module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^@actions/tool-cache$': '<rootDir>/src/__mocks__/@actions/tool-cache.ts',
    '^@actions/cache$': '<rootDir>/src/__mocks__/@actions/cache.ts',
    '^@actions/exec$': '<rootDir>/src/__mocks__/@actions/exec.ts'
  }
}

