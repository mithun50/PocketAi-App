package com.nxg.data_hub_lib.db

import android.content.Context
import androidx.room.Room

object DataHubDatabaseProvider {
    @Volatile
    private var INSTANCE: DataHubDatabase? = null

    fun getDatabase(context: Context): DataHubDatabase {
        return INSTANCE ?: synchronized(this) {
            Room.databaseBuilder(
                context.applicationContext,
                DataHubDatabase::class.java,
                "data_hub_db"
            ).build().also { INSTANCE = it }
        }
    }
}
