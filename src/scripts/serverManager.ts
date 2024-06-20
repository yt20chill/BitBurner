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
      let server = 'server-' + i;
      if (servers.includes(server)) {
        // If server exists, check if it needs an upgrade.
        if (ns.getServerMaxRam(server) < RAM) {
          let cost = ns.getPurchasedServerUpgradeCost(server, RAM);
          // Wait for sufficient funds for the upgrade.
          while (ns.getServerMoneyAvailable('home') < cost) {
            ns.printf(
              '%s needs %s to upgrade to %s.',
              server,
              ns.formatNumber(cost),
              ns.formatRam(RAM)
            );
            await ns.sleep(LOOP_DELAY);
          }
          // Upgrade the server when funds are sufficient.
          if (ns.upgradePurchasedServer(server, RAM)) {
            ns.printf('%s upgraded to %s', server, ns.formatRam(RAM));
            servers = ns.getPurchasedServers(); // Refresh the server list.
          }
        }
      } else {
        // If server does not exist, check cost and attempt to purchase.
        let cost = ns.getPurchasedServerCost(RAM);
        while (ns.getServerMoneyAvailable('home') < cost) {
          ns.printf(
            'Need %s to purchase %s with %s',
            ns.formatNumber(cost),
            server,
            ns.formatRam(RAM)
          );
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
