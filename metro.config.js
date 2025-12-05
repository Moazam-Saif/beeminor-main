// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for @ alias - proper resolution with Proxy
config.resolver.extraNodeModules = new Proxy(
  {},
  {
    get: (target, name) => {
      if (name === '@') {
        return path.resolve(__dirname);
      }
      // Default behavior for other modules
      return path.join(__dirname, `node_modules/${name}`);
    },
  }
);

module.exports = config;
