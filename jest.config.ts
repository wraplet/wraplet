/** @jest-config-loader esbuild-register */

const config: import('ts-jest').JestConfigWithTsJest = {
  testEnvironment: "jsdom",
  transform: {
    "^.+.tsx?$": ["ts-jest", {}],
  },
  preset: "ts-jest",
  testPathIgnorePatterns: ["/node_modules/", "/tests/performance/"],
  testTimeout: 5_000,
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/index.ts",
    "!src/**/index.ts",
  ],
  coverageThreshold: {
    global: {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  }
};

const includePerf = process.env.RUN_PERF_TESTS === "1";
if (includePerf) {
  config.maxWorkers = 1;
  config.testTimeout = 60_000;
  config.testPathIgnorePatterns = ["/node_modules/"];
  config.testMatch = ["<rootDir>/tests/performance/**/*.test.ts"];
  delete config.coverageThreshold
}

export default config