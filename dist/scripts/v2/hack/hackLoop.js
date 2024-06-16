import { FilePaths, HWGWFiles } from 'data/FilePaths';
import { FileSystem } from 'scripts/utils/fsUtils';
import { silenceLogs } from 'scripts/utils/printUtils';
import { calculateGrowthThreads, getAvailableRam, optimalHackThreads, } from '/scripts/v2/hack/hackLoopUtils';
/**
 * Conducts optimized batch operations on servers to maximize hacking effectiveness in a simulated hacking environment.
 * The script reads from three files to obtain lists of rooted servers, hackable targets, and the best target. It
 * adjusts operations based on the game's progression, focusing on maximizing money from servers by adjusting security
 * levels and money available. Operations are batched with delays to ensure effective synchronization and avoid
 * operation collisions. The script dynamically adjusts thread allocations based on server capabilities and
 * operation needs, and continuously iterates through targets and servers to apply the most effective hacking strategy.
 */
export async function main(ns) {
    silenceLogs(ns);
    // Opens a tail window in the game to display log outputs.
    ns.tail();
    // File system management for tracking servers and targets.
    const rootedServersFile = new FileSystem(ns, FilePaths.ROOTED_SERVERS);
    const hackableTargetsFile = new FileSystem(ns, FilePaths.HACKABLE_TARGETS);
    const bestTargetFile = new FileSystem(ns, FilePaths.BEST_TARGET);
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
            if (isEarlyGame)
                target = BEST_TARGET.info; // Focus on the best target during early game stages.
            const { hostname: targetName, moneyMax: maxMoney, minDifficulty: minSecurityLevel, moneyAvailable: money = 1, } = target;
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
                let availableThreads = Math.floor(getAvailableRam(worker, RESERVED_HOME_RAM) / RAM_PER_THREAD);
                if (availableThreads < 1)
                    continue; // Skip servers with no available threads.
                // Adjust operations based on server's security state and financial potential.
                const securityDecreaseByWeakenPerThread = ns.weakenAnalyze(1, cpuCores);
                const hackWeakenRatio = ns.hackAnalyzeSecurity(1, targetName) /
                    securityDecreaseByWeakenPerThread;
                const growWeakenRatio = ns.growthAnalyzeSecurity(1, targetName, cpuCores) / cpuCores;
                // Prioritize operations based on server state: weaken, grow, or hack.
                if (securityLevel > minSecurityLevel) {
                    // Security reduction operations.
                    let reducedSecurityLevel = securityDecreaseByWeakenPerThread * availableThreads;
                    if (securityLevel - reducedSecurityLevel < minSecurityLevel) {
                        availableThreads = Math.ceil((securityLevel - minSecurityLevel) /
                            securityDecreaseByWeakenPerThread);
                        securityLevel = minSecurityLevel;
                    }
                    else {
                        securityLevel -= reducedSecurityLevel;
                    }
                    ns.exec(HWGWFiles.WEAKEN, workerName, availableThreads, targetName, 0, batchNum++);
                }
                else if (money < maxMoney &&
                    (growThreadsRequired > 0 || !isGrowthCalculated)) {
                    // Money maximization operations.
                    if (!isGrowthCalculated) {
                        growThreadsRequired = Math.ceil(ns.growthAnalyze(targetName, maxMoney / money, cpuCores));
                        isGrowthCalculated = true;
                    }
                    availableThreads = Math.min(growThreadsRequired, availableThreads);
                    growThreadsRequired -= availableThreads;
                    securityLevel += ns.growthAnalyzeSecurity(availableThreads, targetName, cpuCores);
                    ns.exec(HWGWFiles.GROW, workerName, availableThreads, targetName, 0, batchNum++);
                }
                else {
                    if (availableThreads < 4)
                        continue; // Minimally need 4 threads to run a HWGW batch.
                    // Hack-Weaken-Grow-Weaken batch operations.
                    const hackPercentagePerThread = ns.hackAnalyze(targetName); // Percentage of money per hack thread. [0 - 1]
                    if (hackPercentagePerThread === 0)
                        continue;
                    let hackThreads = Math.ceil(availableThreads / INITIAL_HACK_THREADS);
                    let growThreads, weakenThreads, weakenThreads2, isOverAllocated = false;
                    while (true) {
                        // Optimal thread calculation loop.
                        hackThreads = optimalHackThreads(hackPercentagePerThread, hackThreads);
                        // Calculate grow and weaken threads required to account for hack threads.
                        growThreads = calculateGrowthThreads({
                            ns,
                            targetName,
                            hackPercentagePerThread,
                            hackThreads,
                            cpuCores,
                        });
                        weakenThreads = Math.ceil(hackWeakenRatio * hackThreads);
                        weakenThreads2 = Math.max(1, Math.ceil(growWeakenRatio * growThreads)); // grow threads could be 0 so we set it to 1.
                        // Calculate batch thread utilization.
                        let thread_usage = (hackThreads + growThreads + weakenThreads + weakenThreads2) /
                            availableThreads;
                        // Prioritize operations based on thread allocation state: over, under, good.
                        if (thread_usage > 1) {
                            // Over allocation.
                            if (hackThreads > 1) {
                                hackThreads--; // Adjust hack threads to manage over-allocation.
                                isOverAllocated = true;
                            }
                            else
                                break; // Recompute.
                        }
                        else if (Math.floor((1 - thread_usage) * hackThreads) > 1) {
                            // Under allocation.
                            let additional_threads = Math.floor(((1 - thread_usage) * hackThreads) / 2);
                            // Checking if adding threads won't cause an over-hack.
                            if (hackPercentagePerThread * (hackThreads + additional_threads) <=
                                1) {
                                hackThreads += additional_threads; // Adjust hack threads to manage under-allocation.
                            }
                            else
                                break; // Recompute.
                            if (isOverAllocated)
                                break; // flag to prevent softlock from increasing and reducing by 1 thread.
                        }
                        else
                            break; // Good allocation.
                        await ns.sleep(CALCULATION_DELAY);
                    }
                    ns.print('INFO Hacking...');
                    ns.exec(HWGWFiles.WEAKEN, workerName, weakenThreads, targetName, batchDelay, batchNum);
                    ns.exec(HWGWFiles.WEAKEN, workerName, weakenThreads2, targetName, batchDelay + BATCH_THREAD_DELAY * 2, batchNum);
                    ns.exec(HWGWFiles.GROW, workerName, growThreads, targetName, batchDelay +
                        BATCH_THREAD_DELAY +
                        ns.getWeakenTime(targetName) -
                        ns.getGrowTime(targetName), batchNum);
                    ns.exec(HWGWFiles.HACK, workerName, hackThreads, targetName, batchDelay -
                        BATCH_THREAD_DELAY +
                        ns.getWeakenTime(targetName) -
                        ns.getHackTime(targetName), batchNum++);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFja0xvb3AuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvc2NyaXB0cy92Mi9oYWNrL2hhY2tMb29wLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFFdEQsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBQ25ELE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQztBQUN2RCxPQUFPLEVBQ0wsc0JBQXNCLEVBQ3RCLGVBQWUsRUFDZixrQkFBa0IsR0FDbkIsTUFBTSxnQ0FBZ0MsQ0FBQztBQUV4Qzs7Ozs7OztHQU9HO0FBQ0gsTUFBTSxDQUFDLEtBQUssVUFBVSxJQUFJLENBQUMsRUFBTTtJQUMvQixXQUFXLENBQUMsRUFBRSxDQUFDLENBQUM7SUFFaEIsMERBQTBEO0lBQzFELEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUVWLDJEQUEyRDtJQUMzRCxNQUFNLGlCQUFpQixHQUFHLElBQUksVUFBVSxDQUN0QyxFQUFFLEVBQ0YsU0FBUyxDQUFDLGNBQWMsQ0FDekIsQ0FBQztJQUNGLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxVQUFVLENBQ3hDLEVBQUUsRUFDRixTQUFTLENBQUMsZ0JBQWdCLENBQzNCLENBQUM7SUFDRixNQUFNLGNBQWMsR0FBRyxJQUFJLFVBQVUsQ0FDbkMsRUFBRSxFQUNGLFNBQVMsQ0FBQyxXQUFXLENBQ3RCLENBQUM7SUFFRixrQ0FBa0M7SUFDbEMsTUFBTSxjQUFjLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyw4QkFBOEI7SUFDeEYsTUFBTSxpQkFBaUIsR0FBRyxFQUFFLENBQUMsQ0FBQywrQ0FBK0M7SUFDN0UsTUFBTSxrQkFBa0IsR0FBRyxHQUFHLENBQUMsQ0FBQyxrREFBa0Q7SUFDbEYsTUFBTSxpQkFB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Q0FBQyxFQUM1QixRQUFRLENBQ1QsQ0FBQztvQkFDRixFQUFFLENBQUMsSUFBSSxDQUNMLFNBQVMsQ0FBQyxJQUFJLEVBQ2QsVUFBVSxFQUNWLFdBQVcsRUFDWCxVQUFVLEVBQ1YsVUFBVTt3QkFDUixrQkFBa0I7d0JBQ2xCLEVBQUUsQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDO3dCQUM1QixFQUFFLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxFQUM1QixRQUFRLEVBQUUsQ0FDWCxDQUFDO29CQUVGLHlDQUF5QztvQkFDekMsVUFBVSxJQUFJLENBQUMsR0FBRyxrQkFBa0IsQ0FBQztpQkFDdEM7Z0JBQ0QsTUFBTSxFQUFFLENBQUMsS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUM7YUFDbkM7WUFDRCxNQUFNLEVBQUUsQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztTQUNuQztRQUNELE1BQU0sRUFBRSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztLQUM1QjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOUyB9IGZyb20gJ0Bucyc7XG5pbXBvcnQgeyBGaWxlUGF0aHMsIEhXR1dGaWxlcyB9IGZyb20gJ2RhdGEvRmlsZVBhdGhzJztcbmltcG9ydCB7IFNlcnZlck5vZGVEdG8gfSBmcm9tICdkYXRhL1NlcnZlck5vZGUnO1xuaW1wb3J0IHsgRmlsZVN5c3RlbSB9IGZyb20gJ3NjcmlwdHMvdXRpbHMvZnNVdGlscyc7XG5pbXBvcnQgeyBzaWxlbmNlTG9ncyB9IGZyb20gJ3NjcmlwdHMvdXRpbHMvcHJpbnRVdGlscyc7XG5pbXBvcnQge1xuICBjYWxjdWxhdGVHcm93dGhUaHJlYWRzLFxuICBnZXRBdmFpbGFibGVSYW0sXG4gIG9wdGltYWxIYWNrVGhyZWFkcyxcbn0gZnJvbSAnL3NjcmlwdHMvdjIvaGFjay9oYWNrTG9vcFV0aWxzJztcblxuLyoqXG4gKiBDb25kdWN0cyBvcHRpbWl6ZWQgYmF0Y2ggb3BlcmF0aW9ucyBvbiBzZXJ2ZXJzIHRvIG1heGltaXplIGhhY2tpbmcgZWZmZWN0aXZlbmVzcyBpbiBhIHNpbXVsYXRlZCBoYWNraW5nIGVudmlyb25tZW50LlxuICogVGhlIHNjcmlwdCByZWFkcyBmcm9tIHRocmVlIGZpbGVzIHRvIG9idGFpbiBsaXN0cyBvZiByb290ZWQgc2VydmVycywgaGFja2FibGUgdGFyZ2V0cywgYW5kIHRoZSBiZXN0IHRhcmdldC4gSXRcbiAqIGFkanVzdHMgb3BlcmF0aW9ucyBiYXNlZCBvbiB0aGUgZ2FtZSdzIHByb2dyZXNzaW9uLCBmb2N1c2luZyBvbiBtYXhpbWl6aW5nIG1vbmV5IGZyb20gc2VydmVycyBieSBhZGp1c3Rpbmcgc2VjdXJpdHlcbiAqIGxldmVscyBhbmQgbW9uZXkgYXZhaWxhYmxlLiBPcGVyYXRpb25zIGFyZSBiYXRjaGVkIHdpdGggZGVsYXlzIHRvIGVuc3VyZSBlZmZlY3RpdmUgc3luY2hyb25pemF0aW9uIGFuZCBhdm9pZFxuICogb3BlcmF0aW9uIGNvbGxpc2lvbnMuIFRoZSBzY3JpcHQgZHluYW1pY2FsbHkgYWRqdXN0cyB0aHJlYWQgYWxsb2NhdGlvbnMgYmFzZWQgb24gc2VydmVyIGNhcGFiaWxpdGllcyBhbmRcbiAqIG9wZXJhdGlvbiBuZWVkcywgYW5kIGNvbnRpbnVvdXNseSBpdGVyYXRlcyB0aHJvdWdoIHRhcmdldHMgYW5kIHNlcnZlcnMgdG8gYXBwbHkgdGhlIG1vc3QgZWZmZWN0aXZlIGhhY2tpbmcgc3RyYXRlZ3kuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtYWluKG5zOiBOUykge1xuICBzaWxlbmNlTG9ncyhucyk7XG5cbiAgLy8gT3BlbnMgYSB0YWlsIHdpbmRvdyBpbiB0aGUgZ2FtZSB0byBkaXNwbGF5IGxvZyBvdXRwdXRzLlxuICBucy50YWlsKCk7XG5cbiAgLy8gRmlsZSBzeXN0ZW0gbWFuYWdlbWVudCBmb3IgdHJhY2tpbmcgc2VydmVycyBhbmQgdGFyZ2V0cy5cbiAgY29uc3Qgcm9vdGVkU2VydmVyc0ZpbGUgPSBuZXcgRmlsZVN5c3RlbTxTZXJ2ZXJOb2RlRHRvW10+KFxuICAgIG5zLFxuICAgIEZpbGVQYXRocy5ST09URURfU0VSVkVSU1xuICApO1xuICBjb25zdCBoYWNrYWJsZVRhcmdldHNGaWxlID0gbmV3IEZpbGVTeXN0ZW08U2VydmVyTm9kZUR0b1tdPihcbiAgICBucyxcbiAgICBGaWxlUGF0aHMuSEFDS0FCTEVfVEFSR0VUU1xuICApO1xuICBjb25zdCBiZXN0VGFyZ2V0RmlsZSA9IG5ldyBGaWxlU3lzdGVtPFNlcnZlck5vZGVEdG8+KFxuICAgIG5zLFxuICAgIEZpbGVQYXRocy5CRVNUX1RBUkdFVFxuICApO1xuXG4gIC8vIENvbnN0YW50cyBmb3Igc2NyaXB0IGV4ZWN1dGlvbi5cbiAgY29uc3QgUkFNX1BFUl9USFJFQUQgPSBucy5nZXRTY3JpcHRSYW0oSFdHV0ZpbGVzLldFQUtFTik7IC8vIFJBTSByZXF1aXJlbWVudCBwZXIgdGhyZWFkLlxuICBjb25zdCBSRVNFUlZFRF9IT01FX1JBTSA9IDIwOyAvLyBBbW91bnQgb2YgUkFNIHJlc2VydmVkIG9uIHRoZSAnaG9tZScgc2VydmVyLlxuICBjb25zdCBCQVRDSF9USFJFQURfREVMQVkgPSAxMDA7IC8vIERlbGF5IGJldHdlZW4gYmF0Y2ggb3BlcmF0aW9ucyBpbiBtaWxsaXNlY29uZHMuXG4gIGNvbnN0IENBTENVTEFUSU9OX0RFTEFZID0gNTsgLy8gRGVsYXkgZm9yIHJlY2FsY3VsYXRpb25zIHRvIG1hbmFnZSBleGVjdXRpb24gc3BlZWQgdnMgcGVyZm9ybWFuY2UuXG4gIGNvbnN0IExPT1BfREVMQVkgPSAxMDAwICogMzsgLy8gRGVsYXkgYWZ0ZXIgY29tcGxldGluZyBhbiBpdGVyYXRpb24gb3ZlciBhbGwgdGFyZ2V0cyBhbmQgc2VydmVycy5cbiAgY29uc3QgSU5JVElBTF9IQUNLX1RIUkVBRFMgPSA4OyAvLyBJbml0aWFsIG51bWJlciBvZiB0aHJlYWRzIHJlc2VydmVkIGZvciBoYWNraW5nIG9wZXJhdGlvbnMuXG5cbiAgbGV0IGJhdGNoTnVtID0gMTsgLy8gSWRlbnRpZmllciBmb3IgZWFjaCBiYXRjaCBvcGVyYXRpb24gdG8gZW5zdXJlIHVuaXF1ZW5lc3MuXG5cbiAgd2hpbGUgKHRydWUpIHtcbiAgICAvLyBSZWFkIHNlcnZlciBhbmQgdGFyZ2V0IGRhdGEgZnJvbSBmaWxlcy5cbiAgICBjb25zdCBbU0VSVkVSUywgVEFSR0VUUywgQkVTVF9UQVJHRVRdID0gYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgcm9vdGVkU2VydmVyc0ZpbGUucmVhZCgpLFxuICAgICAgaGFja2FibGVUYXJnZXRzRmlsZS5yZWFkKCksXG4gICAgICBiZXN0VGFyZ2V0RmlsZS5yZWFkKCksXG4gICAgXSk7XG5cbiAgICBpZiAoIVNFUlZFUlMgfHwgIVRBUkdFVFMgfHwgIUJFU1RfVEFSR0VUKSB7XG4gICAgICBucy5hbGVydCgnRVJST1I6IEZhaWxlZCB0byByZWFkIHNlcnZlciBhbmQgdGFyZ2V0IGRhdGEgZnJvbSBmaWxlcy4nKTtcbiAgICAgIG5zLmV4aXQoKTtcbiAgICB9XG5cbiAgICAvLyBEZXRlcm1pbmUgaWYgdGhlIGdhbWUgaXMgaW4gYW4gZWFybHkgc3RhZ2UuXG4gICAgY29uc3QgaXNFYXJseUdhbWUgPSBucy5nZXRIYWNraW5nTGV2ZWwoKSA8IDc1MDtcblxuICAgIGZvciAobGV0IHsgaW5mbzogdGFyZ2V0IH0gb2YgVEFSR0VUUykge1xuICAgICAgaWYgKGlzRWFybHlHYW1lKSB0YXJnZXQgPSBCRVNUX1RBUkdFVC5pbmZvOyAvLyBGb2N1cyBvbiB0aGUgYmVzdCB0YXJnZXQgZHVyaW5nIGVhcmx5IGdhbWUgc3RhZ2VzLlxuXG4gICAgICBjb25zdCB7XG4gICAgICAgIGhvc3RuYW1lOiB0YXJnZXROYW1lLFxuICAgICAgICBtb25leU1heDogbWF4TW9uZXksXG4gICAgICAgIG1pbkRpZmZpY3VsdHk6IG1pblNlY3VyaXR5TGV2ZWwsXG4gICAgICAgIG1vbmV5QXZhaWxhYmxlOiBtb25leSA9IDEsXG4gICAgICB9ID0gdGFyZ2V0O1xuXG4gICAgICBsZXQgc2VjdXJpdHlMZXZlbCA9IHRhcmdldC5oYWNrRGlmZmljdWx0eTtcbiAgICAgIGlmICghbWluU2VjdXJpdHlMZXZlbCB8fCAhc2VjdXJpdHlMZXZlbCB8fCAhbWF4TW9uZXkpIHtcbiAgICAgICAgY29udGludWU7IC8vIFNraXAgdGFyZ2V0cyB3aXRoIG1pc3Npbmcgc2VjdXJpdHkgb3IgbW9uZXkgZGF0YS5cbiAgICAgIH1cblxuICAgICAgbGV0IGlzR3Jvd3RoQ2FsY3VsYXRlZCA9IGZhbHNlO1xuICAgICAgbGV0IGdyb3dUaHJlYWRzUmVxdWlyZWQgPSAwO1xuICAgICAgbGV0IGJhdGNoRGVsYXkgPSAwO1xuXG4gICAgICBmb3IgKGNvbnN0IHsgaW5mbzogd29ya2VyIH0gb2YgU0VSVkVSUykge1xuICAgICAgICBjb25zdCB7IGhvc3RuYW1lOiB3b3JrZXJOYW1lLCBjcHVDb3JlcyB9ID0gd29ya2VyO1xuICAgICAgICAvLyBDYWxjdWxhdGUgdGhlIG51bWJlciBvZiBhdmFpbGFibGUgdGhyZWFkcyBmb3Igb3BlcmF0aW9ucy5cbiAgICAgICAgbGV0IGF2YWlsYWJsZVRocmVhZHMgPSBNYXRoLmZsb29yKFxuICAgICAgICAgIGdldEF2YWlsYWJsZVJhbSh3b3JrZXIsIFJFU0VSVkVEX0hPTUVfUkFNKSAvIFJBTV9QRVJfVEhSRUFEXG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKGF2YWlsYWJsZVRocmVhZHMgPCAxKSBjb250aW51ZTsgLy8gU2tpcCBzZXJ2ZXJzIHdpdGggbm8gYXZhaWxhYmxlIHRocmVhZHMuXG5cbiAgICAgICAgLy8gQWRqdXN0IG9wZXJhdGlvbnMgYmFzZWQgb24gc2VydmVyJ3Mgc2VjdXJpdHkgc3RhdGUgYW5kIGZpbmFuY2lhbCBwb3RlbnRpYWwuXG4gICAgICAgIGNvbnN0IHNlY3VyaXR5RGVjcmVhc2VCeVdlYWtlblBlclRocmVhZCA9IG5zLndlYWtlbkFuYWx5emUoMSwgY3B1Q29yZXMpO1xuXG4gICAgICAgIGNvbnN0IGhhY2tXZWFrZW5SYXRpbyA9XG4gICAgICAgICAgbnMuaGFja0FuYWx5emVTZWN1cml0eSgxLCB0YXJnZXROYW1lKSAvXG4gICAgICAgICAgc2VjdXJpdHlEZWNyZWFzZUJ5V2Vha2VuUGVyVGhyZWFkO1xuICAgICAgICBjb25zdCBncm93V2Vha2VuUmF0aW8gPVxuICAgICAgICAgIG5zLmdyb3d0aEFuYWx5emVTZWN1cml0eSgxLCB0YXJnZXROYW1lLCBjcHVDb3JlcykgLyBjcHVDb3JlcztcblxuICAgICAgICAvLyBQcmlvcml0aXplIG9wZXJhdGlvbnMgYmFzZWQgb24gc2VydmVyIHN0YXRlOiB3ZWFrZW4sIGdyb3csIG9yIGhhY2suXG4gICAgICAgIGlmIChzZWN1cml0eUxldmVsID4gbWluU2VjdXJpdHlMZXZlbCkge1xuICAgICAgICAgIC8vIFNlY3VyaXR5IHJlZHVjdGlvbiBvcGVyYXRpb25zLlxuICAgICAgICAgIGxldCByZWR1Y2VkU2VjdXJpdHlMZXZlbCA9XG4gICAgICAgICAgICBzZWN1cml0eURlY3JlYXNlQnlXZWFrZW5QZXJUaHJlYWQgKiBhdmFpbGFibGVUaHJlYWRzO1xuICAgICAgICAgIGlmIChzZWN1cml0eUxldmVsIC0gcmVkdWNlZFNlY3VyaXR5TGV2ZWwgPCBtaW5TZWN1cml0eUxldmVsKSB7XG4gICAgICAgICAgICBhdmFpbGFibGVUaHJlYWRzID0gTWF0aC5jZWlsKFxuICAgICAgICAgICAgICAoc2VjdXJpdHlMZXZlbCAtIG1pblNlY3VyaXR5TGV2ZWwpIC9cbiAgICAgICAgICAgICAgICBzZWN1cml0eURlY3JlYXNlQnlXZWFrZW5QZXJUaHJlYWRcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBzZWN1cml0eUxldmVsID0gbWluU2VjdXJpdHlMZXZlbDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VjdXJpdHlMZXZlbCAtPSByZWR1Y2VkU2VjdXJpdHlMZXZlbDtcbiAgICAgICAgICB9XG4gICAgICAgICAgbnMuZXhlYyhcbiAgICAgICAgICAgIEhXR1dGaWxlcy5XRUFLRU4sXG4gICAgICAgICAgICB3b3JrZXJOYW1lLFxuICAgICAgICAgICAgYXZhaWxhYmxlVGhyZWFkcyxcbiAgICAgICAgICAgIHRhcmdldE5hbWUsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgYmF0Y2hOdW0rK1xuICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgbW9uZXkgPCBtYXhNb25leSAmJlxuICAgICAgICAgIChncm93VGhyZWFkc1JlcXVpcmVkID4gMCB8fCAhaXNHcm93dGhDYWxjdWxhdGVkKVxuICAgICAgICApIHtcbiAgICAgICAgICAvLyBNb25leSBtYXhpbWl6YXRpb24gb3BlcmF0aW9ucy5cbiAgICAgICAgICBpZiAoIWlzR3Jvd3RoQ2FsY3VsYXRlZCkge1xuICAgICAgICAgICAgZ3Jvd1RocmVhZHNSZXF1aXJlZCA9IE1hdGguY2VpbChcbiAgICAgICAgICAgICAgbnMuZ3Jvd3RoQW5hbHl6ZSh0YXJnZXROYW1lLCBtYXhNb25leSAvIG1vbmV5LCBjcHVDb3JlcylcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBpc0dyb3d0aENhbGN1bGF0ZWQgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhdmFpbGFibGVUaHJlYWRzID0gTWF0aC5taW4oZ3Jvd1RocmVhZHNSZXF1aXJlZCwgYXZhaWxhYmxlVGhyZWFkcyk7XG4gICAgICAgICAgZ3Jvd1RocmVhZHNSZXF1aXJlZCAtPSBhdmFpbGFibGVUaHJlYWRzO1xuICAgICAgICAgIHNlY3VyaXR5TGV2ZWwgKz0gbnMuZ3Jvd3RoQW5hbHl6ZVNlY3VyaXR5KFxuICAgICAgICAgICAgYXZhaWxhYmxlVGhyZWFkcyxcbiAgICAgICAgICAgIHRhcmdldE5hbWUsXG4gICAgICAgICAgICBjcHVDb3Jlc1xuICAgICAgICAgICk7XG5cbiAgICAgICAgICBucy5leGVjKFxuICAgICAgICAgICAgSFdHV0ZpbGVzLkdST1csXG4gICAgICAgICAgICB3b3JrZXJOYW1lLFxuICAgICAgICAgICAgYXZhaWxhYmxlVGhyZWFkcyxcbiAgICAgICAgICAgIHRhcmdldE5hbWUsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgYmF0Y2hOdW0rK1xuICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKGF2YWlsYWJsZVRocmVhZHMgPCA0KSBjb250aW51ZTsgLy8gTWluaW1hbGx5IG5lZWQgNCB0aHJlYWRzIHRvIHJ1biBhIEhXR1cgYmF0Y2guXG5cbiAgICAgICAgICAvLyBIYWNrLVdlYWtlbi1Hcm93LVdlYWtlbiBiYXRjaCBvcGVyYXRpb25zLlxuICAgICAgICAgIGNvbnN0IGhhY2tQZXJjZW50YWdlUGVyVGhyZWFkID0gbnMuaGFja0FuYWx5emUodGFyZ2V0TmFtZSk7IC8vIFBlcmNlbnRhZ2Ugb2YgbW9uZXkgcGVyIGhhY2sgdGhyZWFkLiBbMCAtIDFdXG4gICAgICAgICAgaWYgKGhhY2tQZXJjZW50YWdlUGVyVGhyZWFkID09PSAwKSBjb250aW51ZTtcblxuICAgICAgICAgIGxldCBoYWNrVGhyZWFkcyA9IE1hdGguY2VpbChhdmFpbGFibGVUaHJlYWRzIC8gSU5JVElBTF9IQUNLX1RIUkVBRFMpO1xuICAgICAgICAgIGxldCBncm93VGhyZWFkcyxcbiAgICAgICAgICAgIHdlYWtlblRocmVhZHMsXG4gICAgICAgICAgICB3ZWFrZW5UaHJlYWRzMixcbiAgICAgICAgICAgIGlzT3ZlckFsbG9jYXRlZCA9IGZhbHNlO1xuXG4gICAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICAgIC8vIE9wdGltYWwgdGhyZWFkIGNhbGN1bGF0aW9uIGxvb3AuXG4gICAgICAgICAgICBoYWNrVGhyZWFkcyA9IG9wdGltYWxIYWNrVGhyZWFkcyhcbiAgICAgICAgICAgICAgaGFja1BlcmNlbnRhZ2VQZXJUaHJlYWQsXG4gICAgICAgICAgICAgIGhhY2tUaHJlYWRzXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAvLyBDYWxjdWxhdGUgZ3JvdyBhbmQgd2Vha2VuIHRocmVhZHMgcmVxdWlyZWQgdG8gYWNjb3VudCBmb3IgaGFjayB0aHJlYWRzLlxuICAgICAgICAgICAgZ3Jvd1RocmVhZHMgPSBjYWxjdWxhdGVHcm93dGhUaHJlYWRzKHtcbiAgICAgICAgICAgICAgbnMsXG4gICAgICAgICAgICAgIHRhcmdldE5hbWUsXG4gICAgICAgICAgICAgIGhhY2tQZXJjZW50YWdlUGVyVGhyZWFkLFxuICAgICAgICAgICAgICBoYWNrVGhyZWFkcyxcbiAgICAgICAgICAgICAgY3B1Q29yZXMsXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgd2Vha2VuVGhyZWFkcyA9IE1hdGguY2VpbChoYWNrV2Vha2VuUmF0aW8gKiBoYWNrVGhyZWFkcyk7XG4gICAgICAgICAgICB3ZWFrZW5UaHJlYWRzMiA9IE1hdGgubWF4KFxuICAgICAgICAgICAgICAxLFxuICAgICAgICAgICAgICBNYXRoLmNlaWwoZ3Jvd1dlYWtlblJhdGlvICogZ3Jvd1RocmVhZHMpXG4gICAgICAgICAgICApOyAvLyBncm93IHRocmVhZHMgY291bGQgYmUgMCBzbyB3ZSBzZXQgaXQgdG8gMS5cblxuICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIGJhdGNoIHRocmVhZCB1dGlsaXphdGlvbi5cbiAgICAgICAgICAgIGxldCB0aHJlYWRfdXNhZ2UgPVxuICAgICAgICAgICAgICAoaGFja1RocmVhZHMgKyBncm93VGhyZWFkcyArIHdlYWtlblRocmVhZHMgKyB3ZWFrZW5UaHJlYWRzMikgL1xuICAgICAgICAgICAgICBhdmFpbGFibGVUaHJlYWRzO1xuXG4gICAgICAgICAgICAvLyBQcmlvcml0aXplIG9wZXJhdGlvbnMgYmFzZWQgb24gdGhyZWFkIGFsbG9jYXRpb24gc3RhdGU6IG92ZXIsIHVuZGVyLCBnb29kLlxuICAgICAgICAgICAgaWYgKHRocmVhZF91c2FnZSA+IDEpIHtcbiAgICAgICAgICAgICAgLy8gT3ZlciBhbGxvY2F0aW9uLlxuICAgICAgICAgICAgICBpZiAoaGFja1RocmVhZHMgPiAxKSB7XG4gICAgICAgICAgICAgICAgaGFja1RocmVhZHMtLTsgLy8gQWRqdXN0IGhhY2sgdGhyZWFkcyB0byBtYW5hZ2Ugb3Zlci1hbGxvY2F0aW9uLlxuICAgICAgICAgICAgICAgIGlzT3ZlckFsbG9jYXRlZCA9IHRydWU7XG4gICAgICAgICAgICAgIH0gZWxzZSBicmVhazsgLy8gUmVjb21wdXRlLlxuICAgICAgICAgICAgfSBlbHNlIGlmIChNYXRoLmZsb29yKCgxIC0gdGhyZWFkX3VzYWdlKSAqIGhhY2tUaHJlYWRzKSA+IDEpIHtcbiAgICAgICAgICAgICAgLy8gVW5kZXIgYWxsb2NhdGlvbi5cbiAgICAgICAgICAgICAgbGV0IGFkZGl0aW9uYWxfdGhyZWFkcyA9IE1hdGguZmxvb3IoXG4gICAgICAgICAgICAgICAgKCgxIC0gdGhyZWFkX3VzYWdlKSAqIGhhY2tUaHJlYWRzKSAvIDJcbiAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAvLyBDaGVja2luZyBpZiBhZGRpbmcgdGhyZWFkcyB3b24ndCBjYXVzZSBhbiBvdmVyLWhhY2suXG4gICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICBoYWNrUGVyY2VudGFnZVBlclRocmVhZCAqIChoYWNrVGhyZWFkcyArIGFkZGl0aW9uYWxfdGhyZWFkcykgPD1cbiAgICAgICAgICAgICAgICAxXG4gICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIGhhY2tUaHJlYWRzICs9IGFkZGl0aW9uYWxfdGhyZWFkczsgLy8gQWRqdXN0IGhhY2sgdGhyZWFkcyB0byBtYW5hZ2UgdW5kZXItYWxsb2NhdGlvbi5cbiAgICAgICAgICAgICAgfSBlbHNlIGJyZWFrOyAvLyBSZWNvbXB1dGUuXG5cbiAgICAgICAgICAgICAgaWYgKGlzT3ZlckFsbG9jYXRlZCkgYnJlYWs7IC8vIGZsYWcgdG8gcHJldmVudCBzb2Z0bG9jayBmcm9tIGluY3JlYXNpbmcgYW5kIHJlZHVjaW5nIGJ5IDEgdGhyZWFkLlxuICAgICAgICAgICAgfSBlbHNlIGJyZWFrOyAvLyBHb29kIGFsbG9jYXRpb24uXG5cbiAgICAgICAgICAgIGF3YWl0IG5zLnNsZWVwKENBTENVTEFUSU9OX0RFTEFZKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbnMucHJpbnQoJ0lORk8gSGFja2luZy4uLicpO1xuICAgICAgICAgIG5zLmV4ZWMoXG4gICAgICAgICAgICBIV0dXRmlsZXMuV0VBS0VOLFxuICAgICAgICAgICAgd29ya2VyTmFtZSxcbiAgICAgICAgICAgIHdlYWtlblRocmVhZHMsXG4gICAgICAgICAgICB0YXJnZXROYW1lLFxuICAgICAgICAgICAgYmF0Y2hEZWxheSxcbiAgICAgICAgICAgIGJhdGNoTnVtXG4gICAgICAgICAgKTtcbiAgICAgICAgICBucy5leGVjKFxuICAgICAgICAgICAgSFdHV0ZpbGVzLldFQUtFTixcbiAgICAgICAgICAgIHdvcmtlck5hbWUsXG4gICAgICAgICAgICB3ZWFrZW5UaHJlYWRzMixcbiAgICAgICAgICAgIHRhcmdldE5hbWUsXG4gICAgICAgICAgICBiYXRjaERlbGF5ICsgQkFUQ0hfVEhSRUFEX0RFTEFZICogMixcbiAgICAgICAgICAgIGJhdGNoTnVtXG4gICAgICAgICAgKTtcbiAgICAgICAgICBucy5leGVjKFxuICAgICAgICAgICAgSFdHV0ZpbGVzLkdST1csXG4gICAgICAgICAgICB3b3JrZXJOYW1lLFxuICAgICAgICAgICAgZ3Jvd1RocmVhZHMsXG4gICAgICAgICAgICB0YXJnZXROYW1lLFxuICAgICAgICAgICAgYmF0Y2hEZWxheSArXG4gICAgICAgICAgICAgIEJBVENIX1RIUkVBRF9ERUxBWSArXG4gICAgICAgICAgICAgIG5zLmdldFdlYWtlblRpbWUodGFyZ2V0TmFtZSkgLVxuICAgICAgICAgICAgICBucy5nZXRHcm93VGltZSh0YXJnZXROYW1lKSxcbiAgICAgICAgICAgIGJhdGNoTnVtXG4gICAgICAgICAgKTtcbiAgICAgICAgICBucy5leGVjKFxuICAgICAgICAgICAgSFdHV0ZpbGVzLkhBQ0ssXG4gICAgICAgICAgICB3b3JrZXJOYW1lLFxuICAgICAgICAgICAgaGFja1RocmVhZHMsXG4gICAgICAgICAgICB0YXJnZXROYW1lLFxuICAgICAgICAgICAgYmF0Y2hEZWxheSAtXG4gICAgICAgICAgICAgIEJBVENIX1RIUkVBRF9ERUxBWSArXG4gICAgICAgICAgICAgIG5zLmdldFdlYWtlblRpbWUodGFyZ2V0TmFtZSkgLVxuICAgICAgICAgICAgICBucy5nZXRIYWNrVGltZSh0YXJnZXROYW1lKSxcbiAgICAgICAgICAgIGJhdGNoTnVtKytcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgLy8gUHJldmVudHMgaW50ZXJzZWN0aW9uIG9mIEhXR1cgYmF0Y2hlcy5cbiAgICAgICAgICBiYXRjaERlbGF5ICs9IDQgKiBCQVRDSF9USFJFQURfREVMQVk7XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgbnMuc2xlZXAoQ0FMQ1VMQVRJT05fREVMQVkpO1xuICAgICAgfVxuICAgICAgYXdhaXQgbnMuc2xlZXAoQ0FMQ1VMQVRJT05fREVMQVkpO1xuICAgIH1cbiAgICBhd2FpdCBucy5zbGVlcChMT09QX0RFTEFZKTtcbiAgfVxufVxuIl19