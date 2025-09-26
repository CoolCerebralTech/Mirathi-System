/** @type {import('jest').Config} */
module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: '.*\\.(spec|test)\\.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  moduleNameMapper: {
    '^@shamba/(.*)$': '<rootDir>/libs/$1/src'
  },
  collectCoverageFrom: [
    '<rootDir>/apps/**/*.(t|j)s',
    '<rootDir>/libs/**/*.(t|j)s',
    '!<rootDir>/**/node_modules/**',
    '!<rootDir>/**/dist/**'
  ],
  coverageDirectory: '<rootDir>/coverage',
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};
