import { NS, Server } from '@ns';
import { HWGWFiles } from 'data/FilePaths';
import { promisify } from 'scripts/utils/promiseUtils';
import { getAllServers } from 'scripts/v2/info/allServers';

type Action =
  | NS['brutessh']
  | NS['ftpcrack']
  | NS['relaysmtp']
  | NS['httpworm']
  | NS['sqlinject'];

/**
 * Automates the process of hacking servers by deploying scripts and cracking open their security.
 * The script first gathers all servers accessible from the starting point ("home"). It then attempts
 * to breach the servers' security using available hacking programs and, if successful, deploys hacking scripts
 * to the compromised servers. This enables automated hacking activities on those servers.
 */
export async function main(ns: NS) {
  // Define the available hacking programs and their corresponding action functions.
  const PROGRAMS = [
    { file: 'BruteSSH.exe', action: ns.brutessh },
    { file: 'FTPCrack.exe', action: ns.ftpcrack },
    { file: 'RelaySMTP.exe', action: ns.relaysmtp },
    { file: 'HTTPWorm.exe', action: ns.httpworm },
    { file: 'SQLInject.exe', action: ns.sqlinject },
  ] as const;

  const ownedPrograms = PROGRAMS.filter((program) =>
    ns.fileExists(program.file)
  );
  const allServers = getAllServers(ns).map((s) => s.info);

  for (const server of allServers) {
    await deployHackingScripts(ns, server);
    root(ns, server, ownedPrograms.slice());
  }
}

const deployHackingScripts = async (ns: NS, server: Server): Promise<void> => {
  await promisify(
    ns.scp,
    [HWGWFiles.WEAKEN, HWGWFiles.GROW, HWGWFiles.HACK],
    server.hostname
  );
  return;
};

const getRequiredPorts = (server: Server): number => {
  return server.numOpenPortsRequired ?? 0;
};

const root = (
  ns: NS,
  server: Server,
  ownedPrograms: { file: string; action: Action }[]
): void => {
  if (
    server.hasAdminRights ||
    getRequiredPorts(server) > ownedPrograms.length
  ) {
    return;
  }

  ownedPrograms.forEach((program) => {
    program.action(server.hostname);
  });

  ns.nuke(server.hostname);
};
