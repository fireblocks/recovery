import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  verbose: true,
  transform: { '\\.ts$': ['ts-jest', { useESM: true }], '\\.tsx$': ['ts-jest', { useESM: true }] },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
};

export default config;
