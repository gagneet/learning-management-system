/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  // Picks up tests/api/**/*.test.ts and tests/db/**/*.test.ts
  testMatch: [
    '**/tests/api/**/*.test.ts',
    '**/tests/db/**/*.test.ts',
  ],
};
