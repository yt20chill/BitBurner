import { NS } from '@ns';
import { FilePaths, HWGWFiles } from 'data/FilePaths';
import { ServerNodeDto } from 'data/ServerNode';
import { FileSystem } from 'scripts/utils/fsUtils';
import { silenceLogs } from 'scripts/utils/printUtils';
import {
  calculateGrowthThreads,
  getAvailableRam,
  optimalHackThreads,
} from '/scripts/v2/hack/hackLoopUtils';

/**
 * Conducts optimized batch operations on servers to maximize hacking effectiveness in a simulated hacking environment.
 * The script reads from three files to obtain lists of rooted servers, hackable targets, and the best target. It
 * adjusts operations based on the game's progression, focusing on maximizing money from servers by adjusting security
 * levels and money available. Operations are batched with delays to ensure effective synchronization and avoid
 * operation collisions. The script dynamically adjusts thread allocations based on server capabilities and
 * operation needs, and continuously iterates through targets and servers to apply the most effective hacking strategy.
 */
export async function main(ns: NS) {
  silenceLogs(ns);

  // Opens a tail window in the game to display log outputs.
  ns.tail();

  // File system management for tracking servers and targets.
  const rootedServersFile = new FileSystem<ServerNodeDto[]>(
    ns,
    FilePaths.ROOTED_SERVERS
  );
  const hackableTargetsFile = new FileSystem<ServerNodeDto[]>(
    ns,
    FilePaths.HACKABLE_TARGETS
  );
  const bestTargetFile = new FileSystem<ServerNodeDto>(
    ns,
    FilePaths.BEST_TARGET
  );

  // Constants for script execution.
  const RAM_PER_THREAD = ns.getScriptRam(HWGWFiles.WEAKEN); // RAM requirement per thread.
  const RESERVED_HOME_RAM = 20; // Amount of RAM reserved on the 'home' server.
  const BATCH_THREAD_DELAY = 100; // Delay between batch operations in milliseconds.
  const CALCULATION_DELAY = 5; // Delay for recalculations to manage execution speed vs performance.
  const LOOP_DELAY = 1000 * 3; // Delay after completing an iteration over all targets and servers.
  const INITIAL_HACK_THREADS = 8; // Initial number of threads reserved for hacking operations.

  let batchNum = 1; // Identifier for each batch operation to ensure uniqueness.

  while (true) {
    // Read server and target data from files.
    const [SERVERS, TARGETS, BEST_TARGET] = await Promise.all([
      rootedServersFile.read(),
      hackableTargetsFile.read(),
      bestTargetFile.read(),
    ]);

    if (!SERVERS || !TARGETS || !BEST_TARGET) {
      ns.alert('ERROR: Failed to read server and target data from files.');
      ns.exit();
    }

    // Determine if the game is in an early stage.
    const isEarlyGame = ns.getHackingLevel() < 750;

    for (let { info: target } of TARGETS) {
      if (isEarlyGame) target = BEST_TARGET.info; // Focus on the best target during early game stages.

      const {
        hostname: targetName,
        moneyMax: maxMoney,
        minDifficulty: minSecurityLevel,
        moneyAvailable: money = 1,
      } = target;

      let securityLevel = target.hackDifficulty;
      if (!minSecurityLevel || !securityLevel || !maxMoney) {
        continue; // Skip targets with missing security or money data.
      }

      let isGrowthCalculated = false;
      let growThreadsRequired = 0;
      let batchDelay = 0;

      for (const { info: worker } of SERVERS) {
        const { hostname: workerName, cpuCores } = worker;
        // Calculate the number of available threads for operations.
        let availableThreads = Math.floor(
          getAvailableRam(worker, RESERVED_HOME_RAM) / RAM_PER_THREAD
        );

        if (availableThreads < 1) continue; // Skip servers with no available threads.

        // Adjust operations based on server's security state and financial potential.
        const securityDecreaseByWeakenPerThread = ns.weakenAnalyze(1, cpuCores);

        const hackWeakenRatio =
          ns.hackAnalyzeSecurity(1, targetName) /
          securityDecreaseByWeakenPerThread;
        const growWeakenRatio =
          ns.growthAnalyzeSecurity(1, targetName, cpuCores) / cpuCores;

        // Prioritize operations based on server state: weaken, grow, or hack.
        if (securityLevel > minSecurityLevel) {
          // Security reduction operations.
          let reducedSecurityLevel =
            securityDecreaseByWeakenPerThread * availableThreads;
          if (securityLevel - reducedSecurityLevel < minSecurityLevel) {
            availableThreads = Math.ceil(
              (securityLevel - minSecurityLevel) /
                securityDecreaseByWeakenPerThread
            );
            securityLevel = minSecurityLevel;
          } else {
            securityLevel -= reducedSecurityLevel;
          }
          ns.exec(
            HWGWFiles.WEAKEN,
            workerName,
            availableThreads,
            targetName,
            0,
            batchNum++
          );
        } else if (
          money < maxMoney &&
          (growThreadsRequired > 0 || !isGrowthCalculated)
        ) {
          // Money maximization operations.
          if (!isGrowthCalculated) {
            growThreadsRequired = Math.ceil(
              ns.growthAnalyze(targetName, maxMoney / money, cpuCores)
            );
            isGrowthCalculated = true;
          }
          availableThreads = Math.min(growThreadsRequired, availableThreads);
          growThreadsRequired -= availableThreads;
          securityLevel += ns.growthAnalyzeSecurity(
            availableThreads,
            targetName,
            cpuCores
          );

          ns.exec(
            HWGWFiles.GROW,
            workerName,
            availableThreads,
            targetName,
            0,
            batchNum++
          );
        } else {
          if (availableThreads < 4) continue; // Minimally need 4 threads to run a HWGW batch.

          // Hack-Weaken-Grow-Weaken batch operations.
          const hackPercentagePerThread = ns.hackAnalyze(targetName); // Percentage of money per hack thread. [0 - 1]
          if (hackPercentagePerThread === 0) continue;

          let hackThreads = Math.ceil(availableThreads / INITIAL_HACK_THREADS);
          let growThreads,
            weakenThreads,
            weakenThreads2,
            isOverAllocated = false;

          while (true) {
            // Optimal thread calculation loop.
            hackThreads = optimalHackThreads(
              hackPercentagePerThread,
              hackThreads
            );

            // Calculate grow and weaken threads required to account for hack threads.
            growThreads = calculateGrowthThreads({
              ns,
              targetName,
              hackPercentagePerThread,
              hackThreads,
              cpuCores,
            });

            weakenThreads = Math.ceil(hackWeakenRatio * hackThreads);
            weakenThreads2 = Math.max(
              1,
              Math.ceil(growWeakenRatio * growThreads)
            ); // grow threads could be 0 so we set it to 1.

            // Calculate batch thread utilization.
            let thread_usage =
              (hackThreads + growThreads + weakenThreads + weakenThreads2) /
              availableThreads;

            // Prioritize operations based on thread allocation state: over, under, good.
            if (thread_usage > 1) {
              // Over allocation.
              if (hackThreads > 1) {
                hackThreads--; // Adjust hack threads to manage over-allocation.
                isOverAllocated = true;
              } else break; // Recompute.
            } else if (Math.floor((1 - thread_usage) * hackThreads) > 1) {
              // Under allocation.
              let additional_threads = Math.floor(
                ((1 - thread_usage) * hackThreads) / 2
              );

              // Checking if adding threads won't cause an over-hack.
              if (
                hackPercentagePerThread * (hackThreads + additional_threads) <=
                1
              ) {
                hackThreads += additional_threads; // Adjust hack threads to manage under-allocation.
              } else break; // Recompute.

              if (isOverAllocated) break; // flag to prevent softlock from increasing and reducing by 1 thread.
            } else break; // Good allocation.

            await ns.sleep(CALCULATION_DELAY);
          }
          ns.print('INFO Hacking...');
          ns.exec(
            HWGWFiles.WEAKEN,
            workerName,
            weakenThreads,
            targetName,
            batchDelay,
            batchNum
          );
          ns.exec(
            HWGWFiles.WEAKEN,
            workerName,
            weakenThreads2,
            targetName,
            batchDelay + BATCH_THREAD_DELAY * 2,
            batchNum
          );
          ns.exec(
            HWGWFiles.GROW,
            workerName,
            growThreads,
            targetName,
            batchDelay +
              BATCH_THREAD_DELAY +
              ns.getWeakenTime(targetName) -
              ns.getGrowTime(targetName),
            batchNum
          );
          ns.exec(
            HWGWFiles.HACK,
            workerName,
            hackThreads,
            targetName,
            batchDelay -
              BATCH_THREAD_DELAY +
              ns.getWeakenTime(targetName) -
              ns.getHackTime(targetName),
            batchNum++
          );

          // Prevents intersection of HWGW batches.
          batchDelay += 4 * BATCH_THREAD_DELAY;
        }
        await ns.sleep(CALCULATION_DELAY);
      }
      await ns.sleep(CALCULATION_DELAY);
    }
    await ns.sleep(LOOP_DELAY);
  }
}
