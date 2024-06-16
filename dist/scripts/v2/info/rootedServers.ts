import { NS } from '@ns';
import { FilePaths } from 'data/FilePaths';
import { FileSystem } from 'scripts/utils/fsUtils';
import { getAllServers } from 'scripts/v2/info/allServers';

/**
 * Retrieves and records the names of all servers with root access within a game environment.
 * The script first collects all servers accessible from a starting point and checks each for root access.
 * Servers with root access are sorted by their maximum RAM capacity in descending order,
 * and the list is saved to a specified file.
 * This script leverages a modular approach, using a custom `FileSystem` class for file operations.
 */
export async function main(ns: NS) {
  // Instantiate the FileSystem class for file operations, targeting a specific file.
  const ROOTED_SERVERS = new FileSystem(ns, FilePaths.ROOTED_SERVERS);

  const results = getAllServers(ns)
    .filter((server) => server.info.hasAdminRights)
    .sort((a, b) => b.info.maxRam - a.info.maxRam);

  await ROOTED_SERVERS.write(results.map((server) => server.toJSON()));
}
