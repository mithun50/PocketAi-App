package com.nxg.pocketai

import android.app.Application
import android.os.Build
import com.nxg.ai_module.workers.AudioManager
import com.nxg.ai_module.workers.ModelManager
import com.nxg.pocketai.logger.AppLogger
import com.nxg.pocketai.userdata.ntds.neuron_tree.NeuronNode
import com.nxg.pocketai.util.initOpenRouterFromPrefs
import com.nxg.pocketai.worker.ChatManager
import com.nxg.pocketai.worker.UserDataManager
import com.nxg.plugins.manager.PluginManager
import com.nxg.pocketai.logger.AppLogger.measureLogAndTime
import com.nxg.pocketai.worker.DataHubManager
import com.nxg.ai_engine.workers.installer.ModelInstaller
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlin.system.measureTimeMillis

class PocketAiApplication : Application() {
    private val appScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onCreate() {
        super.onCreate()

        appScope.launch {
            // Get root node first
            ModelInstaller.initialize(applicationContext)
            UserDataManager.init(applicationContext)
            val root = UserDataManager.getRootNode()

            // Start logging session
            AppLogger.startSession(root, "App Startup")

            logAppInfo(root)
            initializeManagers(root)

            // Save logs to brain file
            UserDataManager.performTreeSave(applicationContext)
        }
    }

    private fun logAppInfo(root: NeuronNode) {
        AppLogger.info(
            root = root,
            message = "Application starting",
            details = mapOf(
                "version" to BuildConfig.VERSION_NAME,
                "versionCode" to BuildConfig.VERSION_CODE,
                "device" to Build.MODEL,
                "android" to Build.VERSION.SDK_INT
            )
        )

        val runtime = Runtime.getRuntime()
        AppLogger.info(
            root = root,
            message = "System resources",
            details = mapOf(
                "maxMemory" to "${runtime.maxMemory() / (1024 * 1024)}MB",
                "processors" to runtime.availableProcessors()
            )
        )
    }

    private suspend fun initializeManagers(root: NeuronNode) {
        // ChatManager
        measureLogAndTime(root, "ChatManager") {
            ChatManager.refreshChats()
        }

        // ModelManager
        measureLogAndTime(root, "ModelManager") {
            ModelManager.init(applicationContext)
        }

        // AudioManager
        measureLogAndTime(root, "AudioManager") {
            AudioManager.init(applicationContext)
        }

        // PluginManager
        measureLogAndTime(root, "PluginManager") {
            PluginManager.init(applicationContext)
        }

        // DataHubManager
        measureLogAndTime(root, "DataHubManager") {
            DataHubManager.init(applicationContext)
        }

        // OpenRouter
        measureLogAndTime(root, "OpenRouter") {
            initOpenRouterFromPrefs(applicationContext)
        }

        AppLogger.info(root, "All managers initialized successfully")
    }

    override fun onLowMemory() {
        super.onLowMemory()

        appScope.launch {
            val root = UserDataManager.getRootNode()
            val runtime = Runtime.getRuntime()

            AppLogger.warn(
                root = root,
                message = "Low memory warning",
                details = mapOf(
                    "freeMemory" to "${runtime.freeMemory() / (1024 * 1024)}MB",
                    "maxMemory" to "${runtime.maxMemory() / (1024 * 1024)}MB"
                )
            )

            UserDataManager.performTreeSave(applicationContext)
        }
    }

    override fun onTerminate() {
        super.onTerminate()
        val root = UserDataManager.getRootNode()
        AppLogger.endSession(root)
    }
}