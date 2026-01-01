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