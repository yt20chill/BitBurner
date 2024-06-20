import { NS } from '@ns';
import { GameFiles } from 'data/FilePaths';

/**
 * Executes a loop that periodically runs a set of scripts to manage various aspects of a game environment.
 * It repeatedly executes scripts related to deploying resources, analyzing server vulnerabilities,
 * identifying hackable targets, and determining the best targets for hacking.
 * The loop runs indefinitely, pausing for a specified interval between each iteration.
 */
export async function main(ns: NS) {
  ns.tail();
  // LOOP_DELAY: Time in milliseconds to wait between script executions.
  // Set to 3000 milliseconds (3 seconds).
  const LOOP_DELAY = 1000 * 3;

  // Continuously loop to manage various scripting tasks.
  while (true) {
    // Run scripts to manage deployment, server vulnerabilities, hackable targets, and optimal targets.
    // Each script is launched with a single thread.
    ns.run(GameFiles.DEPLOYER, 1); // Script to hack servers and deploying scripts.
    ns.run(GameFiles.ROOTED_SERVERS, 1); // Script to identify servers with root access.
    ns.run(GameFiles.TARGETS, 1); // Script to identify servers that can be hacked.
    ns.run(GameFiles.BEST_TARGET, 1); // Script to identify the best server for hacking.

    // Pause the loop for the specified delay, allowing time for scripts to execute before the next iteration.
    await ns.sleep(LOOP_DELAY);
  }
}
