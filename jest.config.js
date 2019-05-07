module.exports = {
  roots: ['<rootDir>/test'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  globals: {
    global: {},
  },
  testEnvironment: 'node',
};
