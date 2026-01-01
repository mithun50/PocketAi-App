const { withAndroidManifest } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin to add network security config for localhost HTTP
 */
module.exports = function withNetworkConfig(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const projectRoot = config.modRequest.projectRoot;

    // Copy network_security_config.xml to android res folder
    const sourceFile = path.join(projectRoot, 'assets/network_security_config.xml');
    const destDir = path.join(projectRoot, 'android/app/src/main/res/xml');
    const destFile = path.join(destDir, 'network_security_config.xml');

    // Create xml directory if it doesn't exist
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // Copy the file
    if (fs.existsSync(sourceFile)) {
      fs.copyFileSync(sourceFile, destFile);
    }

    // Add networkSecurityConfig to application
    const application = androidManifest.manifest.application[0];
    if (!application.$['android:networkSecurityConfig']) {
      application.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    }

    // Ensure usesCleartextTraffic is true
    application.$['android:usesCleartextTraffic'] = 'true';

    return config;
  });
};
