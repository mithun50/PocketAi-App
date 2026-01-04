package com.nxg.ai_engine.databases.open_router

import androidx.room.Database
import androidx.room.RoomDatabase
import com.nxg.ai_engine.models.llm_models.OpenRouterDatabaseModel

@Database(
    entities = [OpenRouterDatabaseModel::class], version = 1, exportSchema = false
)
abstract class OpenRouterDatabase : RoomDatabase() {
    abstract fun OpenRouterDatabaseAccessObject(): OpenRouterDatabaseAccessObject
}