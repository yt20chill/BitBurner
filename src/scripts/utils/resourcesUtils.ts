import { NS } from '@ns';

export async function waitForFunds(
  ns: NS,
  cost: number,
  delay: number,
  threshold: number = 1
) {
  while (ns.getServerMoneyAvailable('home') < cost * threshold) {
    await ns.sleep(delay);
  }
}

export async function upgradeServer(
  ns: NS,
  server: string,
  ram: number,
  delay: number = 1000,
  threshold: number = 1
) {
  const cost = ns.getPurchasedServerUpgradeCost(server, ram);
  await waitForFunds(ns, cost, delay, threshold);
  return ns.upgradePurchasedServer(server, ram);
}

export async function purchaseServer(
  ns: NS,
  server: string,
  ram: number,
  delay: number = 1000,
  threshold: number = 1
) {
  const cost = ns.getPurchasedServerCost(ram);
  await waitForFunds(ns, cost, delay, threshold);
  return ns.purchaseServer(server, ram);
}
