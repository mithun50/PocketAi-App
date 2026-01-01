const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const NETWORK_SECURITY_CONFIG = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">127.0.0.1</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">10.0.3.2</domain>
    </domain-config>
</network-security-config>`;

/**
 * Expo config plugin to add network security config for localhost HTTP
 */
function withNetworkSecurityConfig(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const xmlDir = path.join(projectRoot, 'android/app/src/main/res/xml');
      const xmlFile = path.join(xmlDir, 'network_security_config.xml');

      // Create xml directory
      if (!fs.existsSync(xmlDir)) {
        fs.mkdirSync(xmlDir, { recursive: true });
      }

      // Write network security config
      fs.writeFileSync(xmlFile, NETWORK_SECURITY_CONFIG);
      console.log('✅ Created network_security_config.xml');

      return config;
    },
  ]);
}

function withNetworkManifest(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const application = androidManifest.manifest.application[0];

    // Add networkSecurityConfig reference
    application.$['android:networkSecurityConfig'] = '@xml/network_security_config';

    // Also set usesCleartextTraffic as backup
    application.$['android:usesCleartextTraffic'] = 'true';

    console.log('✅ Updated AndroidManifest.xml with network config');

    return config;
  });
}

module.exports = function withNetworkConfig(config) {
  config = withNetworkSecurityConfig(config);
  config = withNetworkManifest(config);
  return config;
};
