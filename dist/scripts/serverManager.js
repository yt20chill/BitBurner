/**
 * Manages the upgrade and acquisition of servers based on their RAM capacity in a game environment.
 * This script periodically checks all purchased servers, upgrading their RAM or purchasing new servers
 * if they do not meet a specified RAM requirement. The RAM requirement doubles each loop iteration,
 * starting from a base level. The script ensures that all operations are affordable before proceeding.
 * Verbose logging for certain operations is disabled to streamline the output.
 */
export async function main(ns) {
    // Disable verbose logging for specific methods to clean up the output.
    const DISABLED_LOGS = ['getServerMaxRam', 'getServerMoneyAvailable'];
    DISABLED_LOGS.forEach((log) => ns.disableLog(log));
    // Opens a tail window in the game to display log outputs.
    ns.tail();
    // Set default delay times for looping and calculations.
    const LOOP_DELAY = ns.args[0] ?? 1000 * 3; // Default loop delay is 3 seconds.
    const CALCULATION_DELAY = 5; // Delay after calculations or server actions.
    let RAM = 8; // Initial RAM threshold for server actions.
    let servers = ns.getPurchasedServers(); // Get a list of currently owned servers.
    // Continuously evaluate and manage servers.
    while (RAM <= ns.getServerMaxRam(servers[0])) {
        ns.printf('Checking for servers with %s RAM.', ns.formatRam(RAM));
        for (let i = 0; i < ns.getPurchasedServerLimit(); i++) {
            let server = 'server-' + i;
            if (servers.includes(server)) {
                // If server exists, check if it needs an upgrade.
                if (ns.getServerMaxRam(server) < RAM) {
                    let cost = ns.getPurchasedServerUpgradeCost(server, RAM);
                    // Wait for sufficient funds for the upgrade.
                    while (ns.getServerMoneyAvailable('home') < cost) {
                        ns.printf('%s needs %s to upgrade to %s.', server, ns.formatNumber(cost), ns.formatRam(RAM));
                        await ns.sleep(LOOP_DELAY);
                    }
                    // Upgrade the server when funds are sufficient.
                    if (ns.upgradePurchasedServer(server, RAM)) {
                        ns.printf('%s upgraded to %s', server, ns.formatRam(RAM));
                        servers = ns.getPurchasedServers(); // Refresh the server list.
                    }
                }
            }
            else {
                // If server does not exist, check cost and attempt to purchase.
                let cost = ns.getPurchasedServerCost(RAM);
                while (ns.getServerMoneyAvailable('home') < cost) {
                    ns.printf('Need %s to purchase %s with %s', ns.formatNumber(cost), server, ns.formatRam(RAM));
                    await ns.sleep(LOOP_DELAY);
                }
                if (ns.purchaseServer(server, RAM)) {
                    ns.printf('Purchased %s with %s', server, ns.formatRam(RAM));
                    servers = ns.getPurchasedServers(); // Refresh the server list.
                }
            }
        }
        // Double the RAM requirement for the next loop iteration.
        RAM *= 2;
        // Pause the script briefly after handling all servers.
        await ns.sleep(CALCULATION_DELAY);
    }
    ns.print('INFO: All servers has reached max RAM.');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyTWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY3JpcHRzL3NlcnZlck1hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUE7Ozs7OztHQU1HO0FBQ0gsTUFBTSxDQUFDLEtBQUssVUFBVSxJQUFJLENBQUMsRUFBTTtJQUMvQix1RUFBdUU7SUFDdkUsTUFBTSxhQUFhLEdBQUcsQ0FBQyxpQkFBaUIsRUFBRSx5QkFBeUIsQ0FBQyxDQUFDO0lBQ3JFLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUVuRCwwREFBMEQ7SUFDMUQsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDO0lBRVYsd0RBQXdEO0lBQ3hELE1BQU0sVUFBVSxHQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFZLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLG1DQUFtQztJQUMxRixNQUFNLGlCQUFpQixHQUFHLENBQUMsQ0FBQyxDQUFDLDhDQUE4QztJQUUzRSxJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyw0Q0FBNEM7SUFDekQsSUFBSSxPQUFPLEdBQUcsRUFBRSxDQUFDLG1CQUFtQixFQUFFLENBQUMsQ0FBQyx5Q0FBeUM7SUFFakYsNENBQTRDO0lBQzVDLE9BQU8sR0FBRyxJQUFJLEVBQUUsQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7UUFDNUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxtQ0FBbUMsRUFBRSxFQUFFLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDbEUsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyx1QkFBdUIsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ3JELElBQUksTUFBTSxHQUFHLFNBQVMsR0FBRyxDQUFDLENBQUM7WUFDM0IsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUM1QixrREFBa0Q7Z0JBQ2xELElBQUksRUFBRSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsR0FBRyxHQUFHLEVBQUU7b0JBQ3BDLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQyw2QkFBNkIsQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUM7b0JBQ3pELDZDQUE2QztvQkFDN0MsT0FBTyxFQUFFLENBQUMsdUJBQXVCLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxFQUFFO3dCQUNoRCxFQUFFLENBQUMsTUFBTSxDQUNQLCtCQUErQixFQUMvQixNQUFNLEVBQ04sRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsRUFDckIsRUFBRSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FDbEIsQ0FBQzt3QkFDRixNQUFNLEVBQUUsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7cUJBQzVCO29CQUNELGdEQUFnRDtvQkFDaEQsSUFBSSxFQUFFLENBQUMsc0JBQXNCLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxFQUFFO3dCQUMxQyxFQUFFLENBQUMsTUFBTSxDQUFDLG1CQUFtQixFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7d0JBQzFELE9BQU8sR0FBRyxFQUFFLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDLDJCQUEyQjtxQkFDaEU7aUJBQ0Y7YUFDRjtpQkFBTTtnQkFDTCxnRUFBZ0U7Z0JBQ2hFLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDMUMsT0FBTyxFQUFFLENBQUMsdUJBQXVCLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxFQUFFO29CQUNoRCxFQUFFLENBQUMsTUFBTSxDQUNQLGdDQUFnQyxFQUNoQyxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUNyQixNQUFNLEVBQ04sRUFBRSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FDbEIsQ0FBQztvQkFDRixNQUFNLEVBQUUsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7aUJBQzVCO2dCQUNELElBQUksRUFBRSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLEVBQUU7b0JBQ2xDLEVBQUUsQ0FBQyxNQUFNLENBQUMsc0JBQXNCLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFDN0QsT0FBTyxHQUFHLEVBQUUsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLENBQUMsMkJBQTJCO2lCQUNoRTthQUNGO1NBQ0Y7UUFDRCwwREFBMEQ7UUFDMUQsR0FBRyxJQUFJLENBQUMsQ0FBQztRQUNULHVEQUF1RDtRQUN2RCxNQUFNLEVBQUUsQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztLQUNuQztJQUNELEVBQUUsQ0FBQyxLQUFLLENBQUMsd0NBQXdDLENBQUMsQ0FBQztBQUNyRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTlMgfSBmcm9tICdAbnMnO1xuXG4vKipcbiAqIE1hbmFnZXMgdGhlIHVwZ3JhZGUgYW5kIGFjcXVpc2l0aW9uIG9mIHNlcnZlcnMgYmFzZWQgb24gdGhlaXIgUkFNIGNhcGFjaXR5IGluIGEgZ2FtZSBlbnZpcm9ubWVudC5cbiAqIFRoaXMgc2NyaXB0IHBlcmlvZGljYWxseSBjaGVja3MgYWxsIHB1cmNoYXNlZCBzZXJ2ZXJzLCB1cGdyYWRpbmcgdGhlaXIgUkFNIG9yIHB1cmNoYXNpbmcgbmV3IHNlcnZlcnNcbiAqIGlmIHRoZXkgZG8gbm90IG1lZXQgYSBzcGVjaWZpZWQgUkFNIHJlcXVpcmVtZW50LiBUaGUgUkFNIHJlcXVpcmVtZW50IGRvdWJsZXMgZWFjaCBsb29wIGl0ZXJhdGlvbixcbiAqIHN0YXJ0aW5nIGZyb20gYSBiYXNlIGxldmVsLiBUaGUgc2NyaXB0IGVuc3VyZXMgdGhhdCBhbGwgb3BlcmF0aW9ucyBhcmUgYWZmb3JkYWJsZSBiZWZvcmUgcHJvY2VlZGluZy5cbiAqIFZlcmJvc2UgbG9nZ2luZyBmb3IgY2VydGFpbiBvcGVyYXRpb25zIGlzIGRpc2FibGVkIHRvIHN0cmVhbWxpbmUgdGhlIG91dHB1dC5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1haW4obnM6IE5TKSB7XG4gIC8vIERpc2FibGUgdmVyYm9zZSBsb2dnaW5nIGZvciBzcGVjaWZpYyBtZXRob2RzIHRvIGNsZWFuIHVwIHRoZSBvdXRwdXQuXG4gIGNvbnN0IERJU0FCTEVEX0xPR1MgPSBbJ2dldFNlcnZlck1heFJhbScsICdnZXRTZXJ2ZXJNb25leUF2YWlsYWJsZSddO1xuICBESVNBQkxFRF9MT0dTLmZvckVhY2goKGxvZykgPT4gbnMuZGlzYWJsZUxvZyhsb2cpKTtcblxuICAvLyBPcGVucyBhIHRhaWwgd2luZG93IGluIHRoZSBnYW1lIHRvIGRpc3BsYXkgbG9nIG91dHB1dHMuXG4gIG5zLnRhaWwoKTtcblxuICAvLyBTZXQgZGVmYXVsdCBkZWxheSB0aW1lcyBmb3IgbG9vcGluZyBhbmQgY2FsY3VsYXRpb25zLlxuICBjb25zdCBMT09QX0RFTEFZID0gKG5zLmFyZ3NbMF0gYXMgbnVtYmVyKSA/PyAxMDAwICogMzsgLy8gRGVmYXVsdCBsb29wIGRlbGF5IGlzIDMgc2Vjb25kcy5cbiAgY29uc3QgQ0FMQ1VMQVRJT05fREVMQVkgPSA1OyAvLyBEZWxheSBhZnRlciBjYWxjdWxhdGlvbnMgb3Igc2VydmVyIGFjdGlvbnMuXG5cbiAgbGV0IFJBTSA9IDg7IC8vIEluaXRpYWwgUkFNIHRocmVzaG9sZCBmb3Igc2VydmVyIGFjdGlvbnMuXG4gIGxldCBzZXJ2ZXJzID0gbnMuZ2V0UHVyY2hhc2VkU2VydmVycygpOyAvLyBHZXQgYSBsaXN0IG9mIGN1cnJlbnRseSBvd25lZCBzZXJ2ZXJzLlxuXG4gIC8vIENvbnRpbnVvdXNseSBldmFsdWF0ZSBhbmQgbWFuYWdlIHNlcnZlcnMuXG4gIHdoaWxlIChSQU0gPD0gbnMuZ2V0U2VydmVyTWF4UmFtKHNlcnZlcnNbMF0pKSB7XG4gICAgbnMucHJpbnRmKCdDaGVja2luZyBmb3Igc2VydmVycyB3aXRoICVzIFJBTS4nLCBucy5mb3JtYXRSYW0oUkFNKSk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBucy5nZXRQdXJjaGFzZWRTZXJ2ZXJMaW1pdCgpOyBpKyspIHtcbiAgICAgIGxldCBzZXJ2ZXIgPSAnc2VydmVyLScgKyBpO1xuICAgICAgaWYgKHNlcnZlcnMuaW5jbHVkZXMoc2VydmVyKSkge1xuICAgICAgICAvLyBJZiBzZXJ2ZXIgZXhpc3RzLCBjaGVjayBpZiBpdCBuZWVkcyBhbiB1cGdyYWRlLlxuICAgICAgICBpZiAobnMuZ2V0U2VydmVyTWF4UmFtKHNlcnZlcikgPCBSQU0pIHtcbiAgICAgICAgICBsZXQgY29zdCA9IG5zLmdldFB1cmNoYXNlZFNlcnZlclVwZ3JhZGVDb3N0KHNlcnZlciwgUkFNKTtcbiAgICAgICAgICAvLyBXYWl0IGZvciBzdWZmaWNpZW50IGZ1bmRzIGZvciB0aGUgdXBncmFkZS5cbiAgICAgICAgICB3aGlsZSAobnMuZ2V0U2VydmVyTW9uZXlBdmFpbGFibGUoJ2hvbWUnKSA8IGNvc3QpIHtcbiAgICAgICAgICAgIG5zLnByaW50ZihcbiAgICAgICAgICAgICAgJyVzIG5lZWRzICVzIHRvIHVwZ3JhZGUgdG8gJXMuJyxcbiAgICAgICAgICAgICAgc2VydmVyLFxuICAgICAgICAgICAgICBucy5mb3JtYXROdW1iZXIoY29zdCksXG4gICAgICAgICAgICAgIG5zLmZvcm1hdFJhbShSQU0pXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgYXdhaXQgbnMuc2xlZXAoTE9PUF9ERUxBWSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIFVwZ3JhZGUgdGhlIHNlcnZlciB3aGVuIGZ1bmRzIGFyZSBzdWZmaWNpZW50LlxuICAgICAgICAgIGlmIChucy51cGdyYWRlUHVyY2hhc2VkU2VydmVyKHNlcnZlciwgUkFNKSkge1xuICAgICAgICAgICAgbnMucHJpbnRmKCclcyB1cGdyYWRlZCB0byAlcycsIHNlcnZlciwgbnMuZm9ybWF0UmFtKFJBTSkpO1xuICAgICAgICAgICAgc2VydmVycyA9IG5zLmdldFB1cmNoYXNlZFNlcnZlcnMoKTsgLy8gUmVmcmVzaCB0aGUgc2VydmVyIGxpc3QuXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBJZiBzZXJ2ZXIgZG9lcyBub3QgZXhpc3QsIGNoZWNrIGNvc3QgYW5kIGF0dGVtcHQgdG8gcHVyY2hhc2UuXG4gICAgICAgIGxldCBjb3N0ID0gbnMuZ2V0UHVyY2hhc2VkU2VydmVyQ29zdChSQU0pO1xuICAgICAgICB3aGlsZSAobnMuZ2V0U2VydmVyTW9uZXlBdmFpbGFibGUoJ2hvbWUnKSA8IGNvc3QpIHtcbiAgICAgICAgICBucy5wcmludGYoXG4gICAgICAgICAgICAnTmVlZCAlcyB0byBwdXJjaGFzZSAlcyB3aXRoICVzJyxcbiAgICAgICAgICAgIG5zLmZvcm1hdE51bWJlcihjb3N0KSxcbiAgICAgICAgICAgIHNlcnZlcixcbiAgICAgICAgICAgIG5zLmZvcm1hdFJhbShSQU0pXG4gICAgICAgICAgKTtcbiAgICAgICAgICBhd2FpdCBucy5zbGVlcChMT09QX0RFTEFZKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobnMucHVyY2hhc2VTZXJ2ZXIoc2VydmVyLCBSQU0pKSB7XG4gICAgICAgICAgbnMucHJpbnRmKCdQdXJjaGFzZWQgJXMgd2l0aCAlcycsIHNlcnZlciwgbnMuZm9ybWF0UmFtKFJBTSkpO1xuICAgICAgICAgIHNlcnZlcnMgPSBucy5nZXRQdXJjaGFzZWRTZXJ2ZXJzKCk7IC8vIFJlZnJlc2ggdGhlIHNlcnZlciBsaXN0LlxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIC8vIERvdWJsZSB0aGUgUkFNIHJlcXVpcmVtZW50IGZvciB0aGUgbmV4dCBsb29wIGl0ZXJhdGlvbi5cbiAgICBSQU0gKj0gMjtcbiAgICAvLyBQYXVzZSB0aGUgc2NyaXB0IGJyaWVmbHkgYWZ0ZXIgaGFuZGxpbmcgYWxsIHNlcnZlcnMuXG4gICAgYXdhaXQgbnMuc2xlZXAoQ0FMQ1VMQVRJT05fREVMQVkpO1xuICB9XG4gIG5zLnByaW50KCdJTkZPOiBBbGwgc2VydmVycyBoYXMgcmVhY2hlZCBtYXggUkFNLicpO1xufVxuIl19