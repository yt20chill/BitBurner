export async function main(ns) {
    // Log settings: Disable verbose logging for the specified function.
    const DISABLED_LOGS = ['getServerMoneyAvailable'];
    DISABLED_LOGS.forEach((log) => ns.disableLog(log));
    // Opens a tail window in the game to display log outputs.
    ns.tail();
    // d: delay, x: threshold multiplier, max-cost=exit point when min_cost > preset max-cost
    // LOOP_DELAY: Time in milliseconds to wait when funds are insufficient for upgrades. Default value is 3000 milliseconds (3 seconds).
    // THRESHOLD: Multiplier to determine the minimum funds needed relative to the cost of the next upgrade. Default value is 1000, i.e., funds must be at least 1000 times the upgrade cost.
    // MAX_COST: When min_cost to upgrade > MAX_COST, program exit. Default to 1e12 (1T)
    const options = ns.flags([
        ['d', 3000],
        ['x', 1000],
        ['max-cost', 1e12],
    ]);
    const { d: LOOP_DELAY, x: THRESHOLD, 'max-cost': MAX_COST } = options;
    // CALCULATION_DELAY: Time in milliseconds to delay after executing an upgrade,
    // intended to manage load on system resources. Default value is 5 milliseconds.
    const CALCULATION_DELAY = 5;
    // Continuously loop to manage node upgrades or purchases.
    while (true) {
        let owned_nodes = ns.hacknet.numNodes(); // Get the current number of owned nodes.
        let min_cost = ns.hacknet.getPurchaseNodeCost(); // Cost of purchasing a new node.
        let node_index = owned_nodes; // Index for node to upgrade, initialized to the next new node.
        let upgrade_type = -1; // Type of upgrade to perform: -1 for purchase, 0 for level, 1 for RAM, 2 for core.
        // Evaluate the cost and type of the cheapest possible upgrade among existing nodes.
        for (let i = 0; i < owned_nodes; i++) {
            let upgrades = [
                ns.hacknet.getLevelUpgradeCost(i, 1),
                ns.hacknet.getRamUpgradeCost(i, 1),
                ns.hacknet.getCoreUpgradeCost(i, 1),
            ];
            let new_cost = Math.min.apply(Math, upgrades);
            if (new_cost < min_cost) {
                min_cost = new_cost;
                node_index = i;
                upgrade_type = upgrades.indexOf(new_cost);
            }
        }
        if (min_cost > MAX_COST) {
            ns.printf(`WARN: min cost to upgrade (%s) > max cost set (%s). Script is terminated.`, ns.formatNumber(min_cost), ns.formatNumber(MAX_COST));
            ns.exit();
        }
        // Wait until there are sufficient funds for the selected upgrade.
        while (ns.getServerMoneyAvailable('home') < min_cost * THRESHOLD) {
            ns.printf('Node %d needs %s * %d for next upgrade.', node_index, ns.formatNumber(min_cost), THRESHOLD);
            await ns.sleep(LOOP_DELAY);
        }
        // Execute the selected upgrade or node purchase.
        switch (upgrade_type) {
            case -1:
                ns.hacknet.purchaseNode();
                ns.printf('Purchased a new hacknet node.');
                break;
            case 0:
                ns.hacknet.upgradeLevel(node_index, 1);
                ns.printf("Upgraded node %d's level.", node_index);
                break;
            case 1:
                ns.hacknet.upgradeRam(node_index, 1);
                ns.printf("Upgraded node %d's ram.", node_index);
                break;
            case 2:
                ns.hacknet.upgradeCore(node_index, 1);
                ns.printf("Upgraded node %d's cores.", node_index);
                break;
        }
        // Delay after upgrade to manage system performance.
        await ns.sleep(CALCULATION_DELAY);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFja05vZGVNYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3NjcmlwdHMvaGFja05vZGVNYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUlBLE1BQU0sQ0FBQyxLQUFLLFVBQVUsSUFBSSxDQUFDLEVBQU07SUFDL0Isb0VBQW9FO0lBQ3BFLE1BQU0sYUFBYSxHQUFHLENBQUMseUJBQXlCLENBQUMsQ0FBQztJQUNsRCxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFFbkQsMERBQTBEO0lBQzFELEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUVWLHlGQUF5RjtJQUN6RixxSUFBcUk7SUFDckkseUxBQXlMO0lBQ3pMLG9GQUFvRjtJQUNwRixNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDO1FBQ3ZCLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQztRQUNYLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQztRQUNYLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQztLQUNuQixDQUFZLENBQUM7SUFFZCxNQUFNLEVBQUUsQ0FBQyxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsR0FBRyxPQUFPLENBQUM7SUFFdEUsK0VBQStFO0lBQy9FLGdGQUFnRjtJQUNoRixNQUFNLGlCQUFpQixHQUFHLENBQUMsQ0FBQztJQUU1QiwwREFBMEQ7SUFDMUQsT0FBTyxJQUFJLEVBQUU7UUFDWCxJQUFJLFdBQVcsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMseUNBQXlDO1FBQ2xGLElBQUksUUFBUSxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDLGlDQUFpQztRQUNsRixJQUFJLFVBQVUsR0FBRyxXQUFXLENBQUMsQ0FBQywrREFBK0Q7UUFDN0YsSUFBSSxZQUFZLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxtRkFBbUY7UUFFMUcsb0ZBQW9GO1FBQ3BGLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxXQUFXLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDcEMsSUFBSSxRQUFRLEdBQUc7Z0JBQ2IsRUFBRSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNwQyxFQUFFLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ2xDLEVBQUUsQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQzthQUNwQyxDQUFDO1lBRUYsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzlDLElBQUksUUFBUSxHQUFHLFFBQVEsRUFBRTtnQkFDdkIsUUFBUSxHQUFHLFFBQVEsQ0FBQztnQkFDcEIsVUFBVSxHQUFHLENBQUMsQ0FBQztnQkFDZixZQUFZLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUMzQztTQUNGO1FBRUQsSUFBSSxRQUFRLEdBQUcsUUFBUSxFQUFFO1lBQ3ZCLEVBQUUsQ0FBQyxNQUFNLENBQ1AsMkVBQTJFLEVBQzNFLEVBQUUsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLEVBQ3pCLEVBQUUsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQzFCLENBQUM7WUFDRixFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7U0FDWDtRQUVELGtFQUFrRTtRQUNsRSxPQUFPLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxNQUFNLENBQUMsR0FBRyxRQUFRLEdBQUcsU0FBUyxFQUFFO1lBQ2hFLEVBQUUsQ0FBQyxNQUFNLENBQ1AseUNBQXlDLEVBQ3pDLFVBQVUsRUFDVixFQUFFLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxFQUN6QixTQUFTLENBQ1YsQ0FBQztZQUNGLE1BQU0sRUFBRSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztTQUM1QjtRQUVELGlEQUFpRDtRQUNqRCxRQUFRLFlBQVksRUFBRTtZQUNwQixLQUFLLENBQUMsQ0FBQztnQkFDTCxFQUFFLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUMxQixFQUFFLENBQUMsTUFBTSxDQUFDLCtCQUErQixDQUFDLENBQUM7Z0JBQzNDLE1BQU07WUFDUixLQUFLLENBQUM7Z0JBQ0osRUFBRSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUN2QyxFQUFFLENBQUMsTUFBTSxDQUFDLDJCQUEyQixFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNuRCxNQUFNO1lBQ1IsS0FBSyxDQUFDO2dCQUNKLEVBQUUsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDckMsRUFBRSxDQUFDLE1BQU0sQ0FBQyx5QkFBeUIsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDakQsTUFBTTtZQUNSLEtBQUssQ0FBQztnQkFDSixFQUFFLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RDLEVBQUUsQ0FBQyxNQUFNLENBQUMsMkJBQTJCLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ25ELE1BQU07U0FDVDtRQUVELG9EQUFvRDtRQUNwRCxNQUFNLEVBQUUsQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztLQUNuQztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOUyB9IGZyb20gJ0Bucyc7XG5cbnR5cGUgT3B0aW9ucyA9IHsgZDogbnVtYmVyOyB4OiBudW1iZXI7ICdtYXgtY29zdCc6IG51bWJlciB9O1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbWFpbihuczogTlMpIHtcbiAgLy8gTG9nIHNldHRpbmdzOiBEaXNhYmxlIHZlcmJvc2UgbG9nZ2luZyBmb3IgdGhlIHNwZWNpZmllZCBmdW5jdGlvbi5cbiAgY29uc3QgRElTQUJMRURfTE9HUyA9IFsnZ2V0U2VydmVyTW9uZXlBdmFpbGFibGUnXTtcbiAgRElTQUJMRURfTE9HUy5mb3JFYWNoKChsb2cpID0+IG5zLmRpc2FibGVMb2cobG9nKSk7XG5cbiAgLy8gT3BlbnMgYSB0YWlsIHdpbmRvdyBpbiB0aGUgZ2FtZSB0byBkaXNwbGF5IGxvZyBvdXRwdXRzLlxuICBucy50YWlsKCk7XG5cbiAgLy8gZDogZGVsYXksIHg6IHRocmVzaG9sZCBtdWx0aXBsaWVyLCBtYXgtY29zdD1leGl0IHBvaW50IHdoZW4gbWluX2Nvc3QgPiBwcmVzZXQgbWF4LWNvc3RcbiAgLy8gTE9PUF9ERUxBWTogVGltZSBpbiBtaWxsaXNlY29uZHMgdG8gd2FpdCB3aGVuIGZ1bmRzIGFyZSBpbnN1ZmZpY2llbnQgZm9yIHVwZ3JhZGVzLiBEZWZhdWx0IHZhbHVlIGlzIDMwMDAgbWlsbGlzZWNvbmRzICgzIHNlY29uZHMpLlxuICAvLyBUSFJFU0hPTEQ6IE11bHRpcGxpZXIgdG8gZGV0ZXJtaW5lIHRoZSBtaW5pbXVtIGZ1bmRzIG5lZWRlZCByZWxhdGl2ZSB0byB0aGUgY29zdCBvZiB0aGUgbmV4dCB1cGdyYWRlLiBEZWZhdWx0IHZhbHVlIGlzIDEwMDAsIGkuZS4sIGZ1bmRzIG11c3QgYmUgYXQgbGVhc3QgMTAwMCB0aW1lcyB0aGUgdXBncmFkZSBjb3N0LlxuICAvLyBNQVhfQ09TVDogV2hlbiBtaW5fY29zdCB0byB1cGdyYWRlID4gTUFYX0NPU1QsIHByb2dyYW0gZXhpdC4gRGVmYXVsdCB0byAxZTEyICgxVClcbiAgY29uc3Qgb3B0aW9ucyA9IG5zLmZsYWdzKFtcbiAgICBbJ2QnLCAzMDAwXSxcbiAgICBbJ3gnLCAxMDAwXSxcbiAgICBbJ21heC1jb3N0JywgMWUxMl0sXG4gIF0pIGFzIE9wdGlvbnM7XG5cbiAgY29uc3QgeyBkOiBMT09QX0RFTEFZLCB4OiBUSFJFU0hPTEQsICdtYXgtY29zdCc6IE1BWF9DT1NUIH0gPSBvcHRpb25zO1xuXG4gIC8vIENBTENVTEFUSU9OX0RFTEFZOiBUaW1lIGluIG1pbGxpc2Vjb25kcyB0byBkZWxheSBhZnRlciBleGVjdXRpbmcgYW4gdXBncmFkZSxcbiAgLy8gaW50ZW5kZWQgdG8gbWFuYWdlIGxvYWQgb24gc3lzdGVtIHJlc291cmNlcy4gRGVmYXVsdCB2YWx1ZSBpcyA1IG1pbGxpc2Vjb25kcy5cbiAgY29uc3QgQ0FMQ1VMQVRJT05fREVMQVkgPSA1O1xuXG4gIC8vIENvbnRpbnVvdXNseSBsb29wIHRvIG1hbmFnZSBub2RlIHVwZ3JhZGVzIG9yIHB1cmNoYXNlcy5cbiAgd2hpbGUgKHRydWUpIHtcbiAgICBsZXQgb3duZWRfbm9kZXMgPSBucy5oYWNrbmV0Lm51bU5vZGVzKCk7IC8vIEdldCB0aGUgY3VycmVudCBudW1iZXIgb2Ygb3duZWQgbm9kZXMuXG4gICAgbGV0IG1pbl9jb3N0ID0gbnMuaGFja25ldC5nZXRQdXJjaGFzZU5vZGVDb3N0KCk7IC8vIENvc3Qgb2YgcHVyY2hhc2luZyBhIG5ldyBub2RlLlxuICAgIGxldCBub2RlX2luZGV4ID0gb3duZWRfbm9kZXM7IC8vIEluZGV4IGZvciBub2RlIHRvIHVwZ3JhZGUsIGluaXRpYWxpemVkIHRvIHRoZSBuZXh0IG5ldyBub2RlLlxuICAgIGxldCB1cGdyYWRlX3R5cGUgPSAtMTsgLy8gVHlwZSBvZiB1cGdyYWRlIHRvIHBlcmZvcm06IC0xIGZvciBwdXJjaGFzZSwgMCBmb3IgbGV2ZWwsIDEgZm9yIFJBTSwgMiBmb3IgY29yZS5cblxuICAgIC8vIEV2YWx1YXRlIHRoZSBjb3N0IGFuZCB0eXBlIG9mIHRoZSBjaGVhcGVzdCBwb3NzaWJsZSB1cGdyYWRlIGFtb25nIGV4aXN0aW5nIG5vZGVzLlxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb3duZWRfbm9kZXM7IGkrKykge1xuICAgICAgbGV0IHVwZ3JhZGVzID0gW1xuICAgICAgICBucy5oYWNrbmV0LmdldExldmVsVXBncmFkZUNvc3QoaSwgMSksXG4gICAgICAgIG5zLmhhY2tuZXQuZ2V0UmFtVXBncmFkZUNvc3QoaSwgMSksXG4gICAgICAgIG5zLmhhY2tuZXQuZ2V0Q29yZVVwZ3JhZGVDb3N0KGksIDEpLFxuICAgICAgXTtcblxuICAgICAgbGV0IG5ld19jb3N0ID0gTWF0aC5taW4uYXBwbHkoTWF0aCwgdXBncmFkZXMpO1xuICAgICAgaWYgKG5ld19jb3N0IDwgbWluX2Nvc3QpIHtcbiAgICAgICAgbWluX2Nvc3QgPSBuZXdfY29zdDtcbiAgICAgICAgbm9kZV9pbmRleCA9IGk7XG4gICAgICAgIHVwZ3JhZGVfdHlwZSA9IHVwZ3JhZGVzLmluZGV4T2YobmV3X2Nvc3QpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChtaW5fY29zdCA+IE1BWF9DT1NUKSB7XG4gICAgICBucy5wcmludGYoXG4gICAgICAgIGBXQVJOOiBtaW4gY29zdCB0byB1cGdyYWRlICglcykgPiBtYXggY29zdCBzZXQgKCVzKS4gU2NyaXB0IGlzIHRlcm1pbmF0ZWQuYCxcbiAgICAgICAgbnMuZm9ybWF0TnVtYmVyKG1pbl9jb3N0KSxcbiAgICAgICAgbnMuZm9ybWF0TnVtYmVyKE1BWF9DT1NUKVxuICAgICAgKTtcbiAgICAgIG5zLmV4aXQoKTtcbiAgICB9XG5cbiAgICAvLyBXYWl0IHVudGlsIHRoZXJlIGFyZSBzdWZmaWNpZW50IGZ1bmRzIGZvciB0aGUgc2VsZWN0ZWQgdXBncmFkZS5cbiAgICB3aGlsZSAobnMuZ2V0U2VydmVyTW9uZXlBdmFpbGFibGUoJ2hvbWUnKSA8IG1pbl9jb3N0ICogVEhSRVNIT0xEKSB7XG4gICAgICBucy5wcmludGYoXG4gICAgICAgICdOb2RlICVkIG5lZWRzICVzICogJWQgZm9yIG5leHQgdXBncmFkZS4nLFxuICAgICAgICBub2RlX2luZGV4LFxuICAgICAgICBucy5mb3JtYXROdW1iZXIobWluX2Nvc3QpLFxuICAgICAgICBUSFJFU0hPTERcbiAgICAgICk7XG4gICAgICBhd2FpdCBucy5zbGVlcChMT09QX0RFTEFZKTtcbiAgICB9XG5cbiAgICAvLyBFeGVjdXRlIHRoZSBzZWxlY3RlZCB1cGdyYWRlIG9yIG5vZGUgcHVyY2hhc2UuXG4gICAgc3dpdGNoICh1cGdyYWRlX3R5cGUpIHtcbiAgICAgIGNhc2UgLTE6XG4gICAgICAgIG5zLmhhY2tuZXQucHVyY2hhc2VOb2RlKCk7XG4gICAgICAgIG5zLnByaW50ZignUHVyY2hhc2VkIGEgbmV3IGhhY2tuZXQgbm9kZS4nKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDA6XG4gICAgICAgIG5zLmhhY2tuZXQudXBncmFkZUxldmVsKG5vZGVfaW5kZXgsIDEpO1xuICAgICAgICBucy5wcmludGYoXCJVcGdyYWRlZCBub2RlICVkJ3MgbGV2ZWwuXCIsIG5vZGVfaW5kZXgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgbnMuaGFja25ldC51cGdyYWRlUmFtKG5vZGVfaW5kZXgsIDEpO1xuICAgICAgICBucy5wcmludGYoXCJVcGdyYWRlZCBub2RlICVkJ3MgcmFtLlwiLCBub2RlX2luZGV4KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIG5zLmhhY2tuZXQudXBncmFkZUNvcmUobm9kZV9pbmRleCwgMSk7XG4gICAgICAgIG5zLnByaW50ZihcIlVwZ3JhZGVkIG5vZGUgJWQncyBjb3Jlcy5cIiwgbm9kZV9pbmRleCk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIC8vIERlbGF5IGFmdGVyIHVwZ3JhZGUgdG8gbWFuYWdlIHN5c3RlbSBwZXJmb3JtYW5jZS5cbiAgICBhd2FpdCBucy5zbGVlcChDQUxDVUxBVElPTl9ERUxBWSk7XG4gIH1cbn1cbiJdfQ==