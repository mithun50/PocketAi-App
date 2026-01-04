-keep class com.nxg.plugins.api.** { *; }
-keep class com.nxg.plugins.model.** { *; }
-keep class com.nxg.plugins.manager.PluginManager { *; }
-keepclassmembers class ** {
    @androidx.compose.runtime.Composable *;
}
