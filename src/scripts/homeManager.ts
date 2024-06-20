import { NS } from '@ns';
import { upgradeServer } from 'scripts/utils/resourcesUtils';

export async function main(ns: NS) {
  // Disable verbose logging for specific methods to clean up the output.
  const DISABLED_LOGS = ['getServerMaxRam', 'getServerMoneyAvailable'];
  DISABLED_LOGS.forEach((log) => ns.disableLog(log));

  // Opens a tail window in the game to display log outputs.
  ns.tail();

  // Set default delay times for looping and calculations.
  const LOOP_DELAY = (ns.args[0] as number) ?? 1000 * 3; // Default loop delay is 3 seconds.
  const CALCULATION_DELAY = 5; // Delay after calculations or server actions.
  const THRESHOLD = (ns.args[1] as number) ?? 10;

  const maxRAM = ns.getServerMaxRam('home');
  let ram = 4;

  // Continuously evaluate and manage servers.
  while (ram <= maxRAM) {
    // FIXME: home is not considered as a purchased server
    await upgradeServer(ns, 'home', ram, LOOP_DELAY, THRESHOLD);
    ram *= 2;
    await ns.sleep(CALCULATION_DELAY);
  }
  ns.print('INFO: Home has reached max RAM.');
  ns.exit();
}
