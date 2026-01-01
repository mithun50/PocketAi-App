const { withMainApplication, withAndroidManifest } = require('@expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');

/**
 * Expo config plugin to add native Termux intent support
 * Adds a native module that can start Termux's RunCommandService
 */

const NATIVE_MODULE_CODE = `
package com.pocketai.app;

import android.content.Context;
import android.content.Intent;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReadableArray;

public class TermuxIntentModule extends ReactContextBaseJavaModule {
    private static final String TAG = "TermuxIntent";
    private static final String TERMUX_PACKAGE = "com.termux";
    private static final String TERMUX_SERVICE = "com.termux.app.RunCommandService";
    private static final String ACTION_RUN_COMMAND = "com.termux.RUN_COMMAND";

    public TermuxIntentModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "TermuxIntent";
    }

    @ReactMethod
    public void runCommand(String path, ReadableArray arguments, String workdir, boolean background, Promise promise) {
        try {
            Context context = getReactApplicationContext();

            Intent intent = new Intent();
            intent.setClassName(TERMUX_PACKAGE, TERMUX_SERVICE);
            intent.setAction(ACTION_RUN_COMMAND);
            intent.putExtra("com.termux.RUN_COMMAND_PATH", path);

            // Convert ReadableArray to String[]
            String[] args = new String[arguments.size()];
            for (int i = 0; i < arguments.size(); i++) {
                args[i] = arguments.getString(i);
            }
            intent.putExtra("com.termux.RUN_COMMAND_ARGUMENTS", args);
            intent.putExtra("com.termux.RUN_COMMAND_WORKDIR", workdir);
            intent.putExtra("com.termux.RUN_COMMAND_BACKGROUND", background);
            intent.putExtra("com.termux.RUN_COMMAND_SESSION_ACTION", "0");

            context.startService(intent);
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Failed to start Termux service", e);
            promise.reject("TERMUX_ERROR", e.getMessage());
        }
    }
}
`;

const NATIVE_PACKAGE_CODE = `
package com.pocketai.app;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class TermuxIntentPackage implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new TermuxIntentModule(reactContext));
        return modules;
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}
`;

function withTermuxNativeModule(config) {
  const fs = require('fs');
  const path = require('path');

  return withMainApplication(config, (config) => {
    // Add import for the package
    config.modResults.contents = mergeContents({
      tag: 'termux-intent-import',
      src: config.modResults.contents,
      newSrc: 'import com.pocketai.app.TermuxIntentPackage;',
      anchor: /import com\.facebook\.react/,
      offset: 0,
      comment: '//',
    }).contents;

    // Add package to getPackages()
    config.modResults.contents = mergeContents({
      tag: 'termux-intent-package',
      src: config.modResults.contents,
      newSrc: '          packages.add(new TermuxIntentPackage());',
      anchor: /new DefaultReactActivityDelegate/,
      offset: -3,
      comment: '//',
    }).contents;

    return config;
  });
}

module.exports = function withTermuxIntent(config) {
  // Write native module files during prebuild
  config = withAndroidManifest(config, async (config) => {
    const fs = require('fs');
    const path = require('path');

    const projectRoot = config.modRequest.projectRoot;
    const javaDir = path.join(
      projectRoot,
      'android/app/src/main/java/com/pocketai/app'
    );

    // Ensure directory exists
    if (!fs.existsSync(javaDir)) {
      fs.mkdirSync(javaDir, { recursive: true });
    }

    // Write native module
    fs.writeFileSync(
      path.join(javaDir, 'TermuxIntentModule.java'),
      NATIVE_MODULE_CODE.trim()
    );

    // Write package
    fs.writeFileSync(
      path.join(javaDir, 'TermuxIntentPackage.java'),
      NATIVE_PACKAGE_CODE.trim()
    );

    return config;
  });

  // Add the package registration
  config = withTermuxNativeModule(config);

  return config;
};
