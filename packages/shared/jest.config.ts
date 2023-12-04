import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  verbose: true,
  transform: { '\\.ts$': ['ts-jest', { useESM: true }], '\\.tsx$': ['ts-jest', { useESM: true }] },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
};

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  transformIgnorePatterns: ['<rootDir>/node_modules/'],
};

export default config;
