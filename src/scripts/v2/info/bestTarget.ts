import { NS } from '@ns';
import { FilePaths } from 'data/FilePaths';
import { ServerNodeDto } from 'data/ServerNode';
import { FileSystem } from 'scripts/utils/fsUtils';
import { assert } from 'scripts/utils/utils';
/**
 * Evaluates a list of hackable servers and identifies the most profitable target
 * for hacking activities, based on a scoring system. The script reads a list of previously identified
 * hackable servers, assesses each based on its profitability and security level, and records
 * the best target into a file. The decision is based on the ratio of potential money gains to the
 * minimum security level of each server, while excluding servers that take too long to weaken.
 * This script uses a custom `FileSystem` class to facilitate file operations.
 */
export async function main(ns: NS) {
  // Instantiate FileSystem classes for file operations, targeting specific files for hackable targets and the best target.
  const hackableTargetsFile = new FileSystem<ServerNodeDto[]>(
    ns,
    FilePaths.HACKABLE_TARGETS
  );
  const bestTargetFile = new FileSystem<ServerNodeDto>(
    ns,
    FilePaths.BEST_TARGET
  );
  const currentBest = await bestTargetFile.read();

  const MAX_MINUTES = 30;
  // Read the list of hackable targets from the file.

  const TARGETS = (await hackableTargetsFile.read())?.filter(
    ({ name }) => !hasLongWeakenTime(ns, name, 1000 * 60 * MAX_MINUTES)
  );

  if (!TARGETS) {
    ns.tprint('ERROR: Failed to read hackable targets from the file.');
    return;
  }

  // Define the maximum allowed time for weakening a server in minutes.

  let score = 0;
  let result = currentBest ?? TARGETS[0];

  // Evaluate each target based on its weaken time and profitability-security ratio.
  for (const target of TARGETS) {
    const { moneyMax, minDifficulty } = target.info;

    assert(
      moneyMax !== undefined && moneyMax > 0 && minDifficulty !== undefined,
      'Invalid target info'
    );

    // Calculate the score as the ratio of maximum potential money to minimum security level.
    const newScore = moneyMax! / minDifficulty!;
    if (newScore > score) {
      score = newScore; // Update the best score found.
      result = target; // Update the best target found.
    }
  }

  if (currentBest?.name !== result.name) {
    ns.print(`INFO bestServer: ${result.name}`);
    // Write the name of the best target server to the file.
    await bestTargetFile.write(result, 'w');
  }
}

const hasLongWeakenTime = (ns: NS, target: string, ms: number): boolean => {
  return ns.getWeakenTime(target) > ms;
};
