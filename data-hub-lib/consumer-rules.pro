-keep class com.nxg.data_hub_lib.model.** { *; }

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
