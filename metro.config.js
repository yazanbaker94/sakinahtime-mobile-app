// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add .db to asset extensions so the pre-built SQLite database
// is bundled with the app (used by QuranDatabase service)
config.resolver.assetExts.push('db');

module.exports = config;
