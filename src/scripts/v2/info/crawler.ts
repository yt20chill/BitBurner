import { NS, Server } from '@ns';
import { ServerNode } from 'data/ServerNode';
import { FileSystem } from 'scripts/utils/fsUtils';
import {
  Color,
  colorize,
  colorizeMeetRequirement,
} from 'scripts/utils/printUtils.js';
import { getAllServers } from 'scripts/v2/info/allServers';

type Flags = {
  s: string;
  d: number;
  custom: string;
  update: boolean;
  help: boolean;
};

export async function main(ns: NS) {
  const flags = ns.flags([
    ['s', ''],
    ['d', -1],
    ['custom', ''],
    ['update', false],
    ['help', false],
  ]) as Flags;

  if (flags.help) {
    const helpMessage =
      'USAGE: crawl all servers and return the paths. Default: return all paths.\n' +
      '[OPTIONS]\n' +
      `${colorize(
        '-s <hostname>',
        Color.CYAN
      )}: return the path to the target server.\n` +
      `${colorize(
        '-d <{number} depth>',
        Color.CYAN
      )}: returns all the server >= depth connected to "home".\n` +
      `${colorize(
        '--custom <key=value>',
        Color.CYAN
      )}: return a sever which key = value. Only accept equal.\n` +
      `Choose only 1 option.`;
    return ns.tprint(helpMessage);
  }

  const allServers = getAllServers(ns);
  const { s: targetServer, d: depth, custom } = flags;

  if (targetServer) {
    if (!ns.serverExists(targetServer)) {
      return ns.tprint('ERROR: Invalid target');
    }
    const found = findTarget(allServers, targetServer);
    if (!found) {
      ns.tprint(`ERROR: Target (${targetServer} not found.)`);
      return;
    }
    ns.tprintf('path: %s\n', found.path);
    printInfo(ns, found.info);
    return;
  }

  if (depth >= 0) {
    const satisfiedServers = findRemoteTargets(allServers, depth);
    satisfiedServers.forEach((server) => {
      ns.tprintf('[%2d] %s', server.depth, server.name);
    });
    return;
  }

  if (custom) {
    const [key, value] = custom.split('=');

    if (!key || !value) {
      ns.tprint(`ERROR: invalid key (${key}) or value (${value})`);
    }

    const found = allServers.find((server) => {
      const serverValue = server.info[key as keyof Server];
      return (
        serverValue === value ||
        (typeof serverValue === 'string' &&
          serverValue.toLowerCase() === value.toLowerCase())
      );
    });

    if (!found) {
      return ns.tprint(`ERROR: No results found on ${key} = ${value}`);
    }
    printInfo(ns, found.info);
    ns.tprint(`INFO: path: ${found.path}`);
    return;
  }

  const ALL_SERVERS_PATH = new FileSystem(ns, '/data/all-servers-path.txt');
  const allPaths = allServers.reduce(
    (all, server) => `${all}\n${server.path}`,
    ''
  );
  await ALL_SERVERS_PATH.write(allPaths, 'w');
  return ns.tprint(allPaths);
}

const findTarget = (
  servers: ServerNode[],
  target: string
): ServerNode | undefined => {
  const targetName = target.toLowerCase();
  return servers.find((server) => server.name.toLowerCase() === targetName);
};

/**
 * @param {ServerNode[]} servers
 * @param {number} depth
 * @return {ServerNode[]} - List of ServerNode which depth >= given depth from "home", sort by depth desc
 */
const findRemoteTargets = (servers: ServerNode[], depth: number) => {
  return servers
    .filter(({ depth: d }) => d >= depth)
    .sort(({ depth: depthA }, { depth: depthB }) => depthB - depthA);
};

const printInfo = (
  ns: NS,
  { hostname, backdoorInstalled, requiredHackingSkill }: Server
) => {
  return ns.tprintf(
    `INFO: %15s | Backdoor?: ${colorizeMeetRequirement(
      '%s',
      backdoorInstalled ?? false
    )} | HackingSkill: ${colorizeMeetRequirement(
      '%d',
      (requiredHackingSkill ?? 0) <= ns.getHackingLevel()
    )}`,
    hostname,
    backdoorInstalled,
    requiredHackingSkill
  );
};
