import { NS } from '@ns';

/**
 * Manages the upgrade and acquisition of servers based on their RAM capacity in a game environment.
 * This script periodically checks all purchased servers, upgrading their RAM or purchasing new servers
 * if they do not meet a specified RAM requirement. The RAM requirement doubles each loop iteration,
 * starting from a base level. The script ensures that all operations are affordable before proceeding.
 * Verbose logging for certain operations is disabled to streamline the output.
 */
export async function main(ns: NS) {
  // Disable verbose logging for specific methods to clean up the output.
  const DISABLED_LOGS = ['getServerMaxRam', 'getServerMoneyAvailable'];
  DISABLED_LOGS.forEach((log) => ns.disableLog(log));

  // Opens a tail window in the game to display log outputs.
  ns.tail();

  // Set default delay times for looping and calculations.
  const LOOP_DELAY = (ns.args[0] as number) ?? 1000 * 3; // Default loop delay is 3 seconds.
  const CALCULATION_DELAY = 5; // Delay after calculations or server actions.

  let RAM = 8; // Initial RAM threshold for server actions.
  let servers = ns.getPurchasedServers(); // Get a list of currently owned servers.

  // Continuously evaluate and manage servers.
  while (RAM <= ns.getServerMaxRam(servers[0] ?? 'home')) {
    ns.printf('Checking for servers with %s RAM.', ns.formatRam(RAM));
    for (let i = 0; i < ns.getPurchasedServerLimit(); i++) {
      const server = 'server-' + i;
      if (!servers.includes(server)) {
        servers =
          (await purchaseServer(ns, server, RAM, LOOP_DELAY)) ?? servers;
      } else if (ns.getServerMaxRam(server) < RAM) {
        servers = (await upgradeServer(ns, server, RAM, LOOP_DELAY)) ?? servers;
      }
      // Double the RAM requirement for the next loop iteration.
      RAM *= 2;
      // Pause the script briefly after handling all servers.
      await ns.sleep(CALCULATION_DELAY);
    }
    ns.print('INFO: All servers has reached max RAM.');
  }

  async function waitForFunds(ns: NS, cost: number, delay: number) {
    while (ns.getServerMoneyAvailable('home') < cost) {
      ns.print(`Need ${ns.formatNumber(cost)} to upgrade.`);
      await ns.sleep(delay);
    }
  }

  async function upgradeServer(
    ns: NS,
    server: string,
    ram: number,
    delay: number = 1000
  ) {
    const cost = ns.getPurchasedServerUpgradeCost(server, ram);
    await waitForFunds(ns, cost, delay);
    return ns.upgradePurchasedServer(server, ram)
      ? ns.getPurchasedServers()
      : null;
  }

  async function purchaseServer(
    ns: NS,
    server: string,
    ram: number,
    delay: number = 1000
  ) {
    const cost = ns.getPurchasedServerCost(ram);
    await waitForFunds(ns, cost, delay);
    return ns.purchaseServer(server, ram) ? ns.getPurchasedServers() : null;
  }
}
