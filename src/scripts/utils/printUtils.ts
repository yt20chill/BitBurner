import { NS } from '@ns';

export enum Color {
  RED = 'red',
  CYAN = 'cyan',
  GREEN = 'green',
  YELLOW = 'yellow',
}

export const RESET = '\u001b[0m';

export const CYAN = '\u001b[36m';
export const YELLOW = '\u001b[33m';
export const GREEN = '\u001b[32m';
export const RED = '\u001b[31m';

export const colorize = (displayString: string, color: Color) => {
  const SUFFIX = displayString + RESET;
  switch (color) {
    case 'red':
      return RED + SUFFIX;
    case 'cyan':
      return CYAN + SUFFIX;
    case 'green':
      return GREEN + SUFFIX;
    case 'yellow':
      return YELLOW + SUFFIX;
    default:
      return displayString;
  }
};

export const colorizeMeetRequirement = (
  displayString: string,
  isSatisfied: boolean
) => {
  const color = isSatisfied ? Color.GREEN : Color.RED;
  return colorize(displayString, color);
};

const DISABLED_LOGS = [
  'sleep',
  'getHackingLevel',
  'getServerMaxMoney',
  'getServerMinSecurityLevel',
  'getServerSecurityLevel',
  'getServerMoneyAvailable',
  'getServerMaxRam',
  'getServerUsedRam',
];

export const silenceLogs = (ns: NS, logs: string[] = DISABLED_LOGS) => {
  logs.forEach((log) => ns.disableLog(log));
};
