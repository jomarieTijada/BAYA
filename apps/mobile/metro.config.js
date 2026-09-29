const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Keep bundled media explicit so native builds and Expo Go resolve local files.
for (const extension of ['mp4', 'wasm']) {
  if (!config.resolver.assetExts.includes(extension)) {
    config.resolver.assetExts.push(extension);
  }
}

// Experiments must never enter an application bundle.
config.resolver.blockList = [/[/\\](sandbox|dev-assets)[/\\]/];

module.exports = config;
