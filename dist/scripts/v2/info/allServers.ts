import { NS } from '@ns';
import { FilePaths } from 'data/FilePaths';
import { ServerNode } from 'data/ServerNode';
import { FileSystem } from 'scripts/utils/fsUtils';

export async function main(ns: NS) {
  const ALL_SERVERS = new FileSystem(ns, FilePaths.ALL_SERVERS);
  const servers = getAllServers(ns);
  await ALL_SERVERS.write(
    JSON.stringify(servers.map((server) => server.toJSON()))
  );
  return;
}

export const getAllServers = (ns: NS): ServerNode[] => {
  const rootServer = new ServerNode(ns, ns.getHostname(), null);
  const allServers: ServerNode[] = [];

  const stack = [rootServer];
  while (stack.length) {
    const current = stack.pop()!;
    stack.push(
      ...current.children.filter((child) => !isDuplicated(allServers, child))
    );
    allServers.push(current);
  }
  return allServers;
};

const isDuplicated = (existing: ServerNode[], target: ServerNode): boolean => {
  return existing.findIndex((server) => target.name === server.name) !== -1;
};
