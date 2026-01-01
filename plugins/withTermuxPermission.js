const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Expo config plugin to add Termux RUN_COMMAND permission
 * This allows the app to execute commands in Termux automatically
 *
 * Usage in app.json:
 * {
 *   "plugins": ["./plugins/withTermuxPermission"]
 * }
 *
 * After adding, run: npx expo prebuild
 * Then build with: npx expo run:android
 */
module.exports = function withTermuxPermission(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;

    // Add the Termux RUN_COMMAND permission
    const permissions = androidManifest.manifest['uses-permission'] || [];

    const termuxPermission = {
      $: {
        'android:name': 'com.termux.permission.RUN_COMMAND',
      },
    };

    // Check if permission already exists
    const exists = permissions.some(
      (p) => p.$['android:name'] === 'com.termux.permission.RUN_COMMAND'
    );

    if (!exists) {
      permissions.push(termuxPermission);
      androidManifest.manifest['uses-permission'] = permissions;
    }

    // Add queries for Termux package (required for Android 11+)
    if (!androidManifest.manifest.queries) {
      androidManifest.manifest.queries = [];
    }

    const queries = androidManifest.manifest.queries;

    // Add package query for com.termux
    const packageQuery = {
      package: [{ $: { 'android:name': 'com.termux' } }],
    };

    // Check if query already exists
    const queryExists = queries.some(
      (q) => q.package && q.package.some((p) => p.$['android:name'] === 'com.termux')
    );

    if (!queryExists) {
      queries.push(packageQuery);
    }

    return config;
  });
};
