const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add 'sql' to sourceExts for Drizzle SQLite migrations
config.resolver.sourceExts.push('sql');

// Enable workspace resolution
const path = require('path');
const workspaceRoot = path.resolve(__dirname, '../..');
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
// config.resolver.disableHierarchicalLookup = true;

module.exports = config;
