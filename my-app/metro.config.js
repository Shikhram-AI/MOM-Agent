const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Audio extensions to ensure are recognized as assets
const audioExtensions = ['m4a', 'mp3', 'wav', 'aac'];

audioExtensions.forEach((ext) => {
    if (!config.resolver.assetExts.includes(ext)) {
        config.resolver.assetExts.push(ext);
    }
});

module.exports = config;