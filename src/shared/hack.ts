import { NS } from '@ns';

/**
 * args[0] = hostname
 * args[1] = sleep time
 */
export async function main(ns: NS) {
  const [target, delay = 1] = ns.args as [string, number];
  await ns.hack(target, { additionalMsec: delay });
}
