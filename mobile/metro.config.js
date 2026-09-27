// metro.config.js
// Extends Metro's watch-folder set to include the parent repo's `src/` tree,
// allowing the mobile app to import M1 TypeScript data/types directly without
// duplicating them inside the mobile package.

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const repoRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Allow Metro to resolve modules from the parent repo's src directory.
config.watchFolders = [repoRoot];

// Resolve modules first from mobile/node_modules, then from repo root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

module.exports = config;
