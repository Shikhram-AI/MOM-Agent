const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add audio file extensions to assetExts
config.resolver.assetExts.push('m4a', 'mp3', 'wav', 'aac');

module.exports = config;