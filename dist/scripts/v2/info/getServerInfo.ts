import { NS } from '@ns';

/**
 * Monitors and displays detailed financial and security information about servers in a simulated hacking environment.
 * The script lists each server that is hackable and profitable based on the player's current hacking level and the server's
 * financial attributes. It continuously updates and prints this information at a specified interval, highlighting the money
 * available, security levels, and estimated times for hacking-related actions. Logging for specific operations is disabled to
 * reduce clutter.
 */
export async function main(ns: NS) {
  // Disable verbose logging for specific operations to make the output cleaner.
  const DISABLED_LOGS = [
    'scan',
    'getServerMoneyAvailable',
    'getServerMaxMoney',
    'getServerRequiredHackingLevel',
    'getServerSecurityLevel',
    'getServerMinSecurityLevel',
    'getHackingLevel',
  ];
  DISABLED_LOGS.forEach((log) => ns.disableLog(log));

  // Determine the list of servers to monitor: either all reachable servers or a specific server passed as an argument.
  const arg = ns.args[0];
  let servers;
  switch (typeof arg) {
    case 'string':
      servers = [arg];
      break;
    case 'number':
      servers = getAllServers(ns)
        .filter((s) => isValidTarget(ns, s))
        .sort((a, b) => sortByMaxMoneyDesc(ns, a, b))
        .slice(0, arg);
      break;
    default:
      servers = getAllServers(ns)
        .filter((s) => isValidTarget(ns, s))
        .sort((a, b) => sortByMaxMoneyDesc(ns, a, b));
  }

  for (let server of servers) {
    if (server === 'home') continue; // Skip the "home" server.
    // Gather financial and security details of each server.
    const MONEY = ns.getServerMoneyAvailable(server);
    const MAX_MONEY = Math.max(1, ns.getServerMaxMoney(server));
    const MONEY_PERCENT = ns.formatPercent(MONEY / MAX_MONEY);
    const HACK_LEVEL = ns.getServerRequiredHackingLevel(server);
    const SECURITY_LEVEL = ns.getServerSecurityLevel(server);
    const MIN_SECURITY_LEVEL = ns.getServerMinSecurityLevel(server);
    const WEAKEN_TIME = formatTime(ns.getWeakenTime(server));
    const GROW_TIME = formatTime(ns.getGrowTime(server));
    const HACK_TIME = formatTime(ns.getHackTime(server));

    ns.tprintf(
      '| %18s | $ %8s / %8s | %7s | HL:%4d | SL:%3d / %2d | WT:%2dh %2dm %2ds | GT:%2dh %2dm %2ds | HT:%2dh %2dm %2ds |',
      server,
      ns.formatNumber(MONEY),
      ns.formatNumber(MAX_MONEY),
      MONEY_PERCENT,
      HACK_LEVEL,
      SECURITY_LEVEL,
      MIN_SECURITY_LEVEL,
      ...WEAKEN_TIME,
      ...GROW_TIME,
      ...HACK_TIME
    );
  }

  // Helper function to retrieve all reachable servers from "home".
  function getAllServers(ns: NS) {
    const servers: string[] = [];
    const stack = ['home'];

    while (stack.length > 0) {
      const CURRENT = stack.pop()!;
      if (!servers.includes(CURRENT)) {
        servers.push(CURRENT);
        stack.push(
          ...ns.scan(CURRENT).filter((next) => !servers.includes(next))
        );
      }
    }
    return servers;
  }

  // Helper function to format milliseconds into hours, minutes, and seconds for readability.
  function formatTime(milliseconds: number) {
    const SECONDS = Math.floor((milliseconds / 1000) % 60);
    const MINUTES = Math.floor((milliseconds / 1000 / 60) % 60);
    const HOURS = Math.floor(milliseconds / 1000 / 3600);
    return [HOURS, MINUTES, SECONDS];
  }
}

const isValidTarget = (ns: NS, server: string) =>
  ns.getServerRequiredHackingLevel(server) < ns.getHackingLevel() &&
  ns.getServerMaxMoney(server) > 1 &&
  server !== 'home';

const sortByMaxMoneyDesc = (ns: NS, serverA: string, serverB: string) =>
  ns.getServerMaxMoney(serverB) - ns.getServerMaxMoney(serverA);
