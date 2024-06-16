import { GameFiles } from '../../../data/FilePaths';
/**
 * Executes a loop that periodically runs a set of scripts to manage various aspects of a game environment.
 * It repeatedly executes scripts related to deploying resources, analyzing server vulnerabilities,
 * identifying hackable targets, and determining the best targets for hacking.
 * The loop runs indefinitely, pausing for a specified interval between each iteration.
 */
export async function main(ns) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5pdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9zY3JpcHRzL3YyL2hhY2svaW5pdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0seUJBQXlCLENBQUM7QUFFcEQ7Ozs7O0dBS0c7QUFDSCxNQUFNLENBQUMsS0FBSyxVQUFVLElBQUksQ0FBQyxFQUFNO0lBQy9CLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNWLHNFQUFzRTtJQUN0RSx3Q0FBd0M7SUFDeEMsTUFBTSxVQUFVLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQztJQUU1Qix1REFBdUQ7SUFDdkQsT0FBTyxJQUFJLEVBQUU7UUFDWCxtR0FBbUc7UUFDbkcsZ0RBQWdEO1FBQ2hELEVBQUUsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLGdEQUFnRDtRQUMvRSxFQUFFLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQywrQ0FBK0M7UUFDcEYsRUFBRSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsaURBQWlEO1FBQy9FLEVBQUUsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLGtEQUFrRDtRQUVwRiwwR0FBMEc7UUFDMUcsTUFBTSxFQUFFLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0tBQzVCO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE5TIH0gZnJvbSAnQG5zJztcbmltcG9ydCB7IEdhbWVGaWxlcyB9IGZyb20gJy4uLy4uLy4uL2RhdGEvRmlsZVBhdGhzJztcblxuLyoqXG4gKiBFeGVjdXRlcyBhIGxvb3AgdGhhdCBwZXJpb2RpY2FsbHkgcnVucyBhIHNldCBvZiBzY3JpcHRzIHRvIG1hbmFnZSB2YXJpb3VzIGFzcGVjdHMgb2YgYSBnYW1lIGVudmlyb25tZW50LlxuICogSXQgcmVwZWF0ZWRseSBleGVjdXRlcyBzY3JpcHRzIHJlbGF0ZWQgdG8gZGVwbG95aW5nIHJlc291cmNlcywgYW5hbHl6aW5nIHNlcnZlciB2dWxuZXJhYmlsaXRpZXMsXG4gKiBpZGVudGlmeWluZyBoYWNrYWJsZSB0YXJnZXRzLCBhbmQgZGV0ZXJtaW5pbmcgdGhlIGJlc3QgdGFyZ2V0cyBmb3IgaGFja2luZy5cbiAqIFRoZSBsb29wIHJ1bnMgaW5kZWZpbml0ZWx5LCBwYXVzaW5nIGZvciBhIHNwZWNpZmllZCBpbnRlcnZhbCBiZXR3ZWVuIGVhY2ggaXRlcmF0aW9uLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbWFpbihuczogTlMpIHtcbiAgbnMudGFpbCgpO1xuICAvLyBMT09QX0RFTEFZOiBUaW1lIGluIG1pbGxpc2Vjb25kcyB0byB3YWl0IGJldHdlZW4gc2NyaXB0IGV4ZWN1dGlvbnMuXG4gIC8vIFNldCB0byAzMDAwIG1pbGxpc2Vjb25kcyAoMyBzZWNvbmRzKS5cbiAgY29uc3QgTE9PUF9ERUxBWSA9IDEwMDAgKiAzO1xuXG4gIC8vIENvbnRpbnVvdXNseSBsb29wIHRvIG1hbmFnZSB2YXJpb3VzIHNjcmlwdGluZyB0YXNrcy5cbiAgd2hpbGUgKHRydWUpIHtcbiAgICAvLyBSdW4gc2NyaXB0cyB0byBtYW5hZ2UgZGVwbG95bWVudCwgc2VydmVyIHZ1bG5lcmFiaWxpdGllcywgaGFja2FibGUgdGFyZ2V0cywgYW5kIG9wdGltYWwgdGFyZ2V0cy5cbiAgICAvLyBFYWNoIHNjcmlwdCBpcyBsYXVuY2hlZCB3aXRoIGEgc2luZ2xlIHRocmVhZC5cbiAgICBucy5ydW4oR2FtZUZpbGVzLkRFUExPWUVSLCAxKTsgLy8gU2NyaXB0IHRvIGhhY2sgc2VydmVycyBhbmQgZGVwbG95aW5nIHNjcmlwdHMuXG4gICAgbnMucnVuKEdhbWVGaWxlcy5ST09URURfU0VSVkVSUywgMSk7IC8vIFNjcmlwdCB0byBpZGVudGlmeSBzZXJ2ZXJzIHdpdGggcm9vdCBhY2Nlc3MuXG4gICAgbnMucnVuKEdhbWVGaWxlcy5UQVJHRVRTLCAxKTsgLy8gU2NyaXB0IHRvIGlkZW50aWZ5IHNlcnZlcnMgdGhhdCBjYW4gYmUgaGFja2VkLlxuICAgIG5zLnJ1bihHYW1lRmlsZXMuQkVTVF9UQVJHRVQsIDEpOyAvLyBTY3JpcHQgdG8gaWRlbnRpZnkgdGhlIGJlc3Qgc2VydmVyIGZvciBoYWNraW5nLlxuXG4gICAgLy8gUGF1c2UgdGhlIGxvb3AgZm9yIHRoZSBzcGVjaWZpZWQgZGVsYXksIGFsbG93aW5nIHRpbWUgZm9yIHNjcmlwdHMgdG8gZXhlY3V0ZSBiZWZvcmUgdGhlIG5leHQgaXRlcmF0aW9uLlxuICAgIGF3YWl0IG5zLnNsZWVwKExPT1BfREVMQVkpO1xuICB9XG59XG4iXX0=