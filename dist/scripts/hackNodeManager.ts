import { NS } from '@ns';

type Options = { d: number; x: number; 'max-cost': number };

export async function main(ns: NS) {
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
  ]) as Options;

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
      ns.printf(
        `WARN: min cost to upgrade (%s) > max cost set (%s). Script is terminated.`,
        ns.formatNumber(min_cost),
        ns.formatNumber(MAX_COST)
      );
      ns.exit();
    }

    // Wait until there are sufficient funds for the selected upgrade.
    while (ns.getServerMoneyAvailable('home') < min_cost * THRESHOLD) {
      ns.printf(
        'Node %d needs %s * %d for next upgrade.',
        node_index,
        ns.formatNumber(min_cost),
        THRESHOLD
      );
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
