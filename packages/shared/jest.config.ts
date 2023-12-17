import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  verbose: true,
  transform: {
    '\\.ts$': ['ts-jest', { useESM: true }],
    '\\.tsx$': ['ts-jest', { useESM: true }],
    '\\.js$': ['ts-jest', { useESM: true }],
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transformIgnorePatterns: ['../../node_modules/(?!(semver-regex)/)'],
};

export default config;
