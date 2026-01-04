package com.nxg.pocketai.util

import android.content.Context
import android.widget.Toast

fun String.makeToast(context: Context) {
    Toast.makeText(context, this, Toast.LENGTH_SHORT).show()
}
