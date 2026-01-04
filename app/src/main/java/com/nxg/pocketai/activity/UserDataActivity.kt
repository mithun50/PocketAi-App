package com.nxg.pocketai.activity

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.core.view.WindowCompat
import com.nxg.pocketai.ui.screens.UserDataViewerScreen
import com.nxg.pocketai.ui.theme.PocketAiTheme

class UserDataActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        WindowCompat.setDecorFitsSystemWindows(window, false)

        setContent {
            PocketAiTheme {
                UserDataViewerScreen()
            }
        }
    }
}

