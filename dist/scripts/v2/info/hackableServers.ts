import { NS, Server } from '@ns';
import { FilePaths } from 'data/FilePaths';
import { FileSystem } from 'scripts/utils/fsUtils';
import { getAllServers } from 'scripts/v2/info/allServers';
import { ServerNode } from '/data/ServerNode';
/**
 * Identifies servers that are hackable based on their security and economic attributes,
 * and records their names, sorted by potential profitability. This script first gathers all accessible servers,
 * excluding the starting point ("home"), and then checks each for hackability criteria:
 * root access, hacking level requirement, and the presence of money. It records the names of qualifying servers,
 * sorted by their maximum money capacity, to a file.
 * This script leverages a custom `FileSystem` class to handle file operations.
 */
export async function main(ns: NS) {
  // Instantiate the FileSystem class for file operations, targeting a specific file for hackable targets.
  const HACKABLE_TARGETS_FILE = new FileSystem(ns, FilePaths.HACKABLE_TARGETS);
  const playerHackingLevel = ns.getHackingLevel();
  const hackableServers = getAllServers(ns)
    .filter(({ info }) => isHackable(info, playerHackingLevel))
    .sort(sortByMaxMoney);

  // Write the sorted list of hackable servers to the targeted file.
  await HACKABLE_TARGETS_FILE.write(hackableServers.map((s) => s.toJSON()));
}

const isHackable = (server: Server, playerHackingLevel: number): boolean => {
  return (
    !server.purchasedByPlayer &&
    server.hasAdminRights &&
    !!server.moneyMax &&
    (server.requiredHackingSkill ?? 0) <= playerHackingLevel
  );
};

const sortByMaxMoney = (a: ServerNode, b: ServerNode): number => {
  return b.info.moneyMax! - a.info.moneyMax!;
};
