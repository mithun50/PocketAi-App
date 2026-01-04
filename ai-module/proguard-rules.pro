-keep class com.nxg.ai_module.model.** { *; }
-keep class com.nxg.ai_module.workers.** { *; }
-keep class com.nxg.ai_module.helpers.** { *; }

-keep class * extends java.lang.Exception
-keep class * extends java.lang.Throwable

-keep class * extends androidx.room.RoomDatabase
-keep @androidx.room.Dao class * { *; }
-keep @androidx.room.Entity class * { *; }
-keep class androidx.room.** { *; }
-dontwarn androidx.room.**
-keepclassmembers class * {
    @androidx.room.TypeConverter <methods>;
}
