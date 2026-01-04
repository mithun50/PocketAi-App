package com.nxg.pocketai.activity

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.nxg.pocketai.ui.screens.hub.PluginHubScreen
import com.nxg.pocketai.ui.theme.PocketAiTheme

class PluginHubActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            PocketAiTheme {
                PluginHubScreen()
            }
        }
    }
}



