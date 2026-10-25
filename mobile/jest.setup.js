// mobile/jest.setup.js
// Setup file for Jest test environment

/* eslint-disable no-undef */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
