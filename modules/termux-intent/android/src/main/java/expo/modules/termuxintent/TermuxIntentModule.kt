package expo.modules.termuxintent

import android.content.Intent
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class TermuxIntentModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("TermuxIntent")

        AsyncFunction("runCommand") { command: String ->
            val context = appContext.reactContext ?: throw Exception("Context not available")

            try {
                val intent = Intent().apply {
                    setClassName("com.termux", "com.termux.app.RunCommandService")
                    action = "com.termux.RUN_COMMAND"
                    putExtra("com.termux.RUN_COMMAND_PATH", "/data/data/com.termux/files/usr/bin/bash")
                    putExtra("com.termux.RUN_COMMAND_ARGUMENTS", arrayOf("-c", command))
                    putExtra("com.termux.RUN_COMMAND_WORKDIR", "/data/data/com.termux/files/home")
                    putExtra("com.termux.RUN_COMMAND_BACKGROUND", false)
                    putExtra("com.termux.RUN_COMMAND_SESSION_ACTION", "0")
                }

                context.startService(intent)
                true
            } catch (e: Exception) {
                throw Exception("Failed to start Termux: ${e.message}")
            }
        }
    }
}
