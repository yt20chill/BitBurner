import { NS, Server } from '@ns';

export const getAvailableRam = (
  server: Server,
  reserveHomeRam: number
): number => {
  return (
    server.maxRam -
    server.ramUsed -
    (server.hostname === 'home' ? reserveHomeRam : 0)
  );
};

export const optimalHackThreads = (
  hackPercentagePerThread: number,
  hackThreads: number
): number => {
  return hackPercentagePerThread * hackThreads > 1
    ? Math.ceil(1 / hackPercentagePerThread)
    : hackThreads;
};

type GrowthThreadsParam = {
  ns: NS;
  targetName: string;
  hackPercentagePerThread: number;
  hackThreads: number;
  cpuCores: number;
};

export const calculateGrowthThreads = ({
  ns,
  targetName,
  hackPercentagePerThread,
  hackThreads,
  cpuCores,
}: GrowthThreadsParam): number => {
  // Calculate the target percentage of money to hack. Max = 99% to avoid 0 division or -ve
  const targetHackPercentage = Math.min(
    0.99,
    hackPercentagePerThread * hackThreads
  );
  const remainingPercentage = 1 - targetHackPercentage;
  // get the num of threads to grow back to original money after hack
  const growthFactorAfterHack = 1 / remainingPercentage;
  return Math.ceil(
    ns.growthAnalyze(targetName, growthFactorAfterHack, cpuCores)
  );
};
