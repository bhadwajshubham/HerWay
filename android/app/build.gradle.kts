import java.util.Properties
import java.io.FileInputStream

plugins {
    id("com.android.application")
    // START: FlutterFire Configuration
    id("com.google.gms.google-services")
    // END: FlutterFire Configuration
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "com.herway.her_way"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    val localProperties = Properties()
    val localPropertiesFile = rootProject.file("local.properties")
    if (localPropertiesFile.exists()) {
        localProperties.load(FileInputStream(localPropertiesFile))
    }
    val mapsApiKey = localProperties.getProperty("MAPS_API_KEY")
        ?: System.getenv("MAPS_API_KEY")
        ?: ""

    val signingProperties = Properties()
    val signingPropertiesFile = rootProject.file("key.properties")
    if (signingPropertiesFile.exists()) {
        signingProperties.load(FileInputStream(signingPropertiesFile))
    }
    val keystoreFile = signingProperties.getProperty("storeFile")
        ?: System.getenv("ANDROID_KEYSTORE_PATH")
    val keystorePassword = signingProperties.getProperty("storePassword")
        ?: System.getenv("ANDROID_KEYSTORE_PASSWORD")
    val keyAlias = signingProperties.getProperty("keyAlias")
        ?: System.getenv("ANDROID_KEY_ALIAS")
    val keyPassword = signingProperties.getProperty("keyPassword")
        ?: System.getenv("ANDROID_KEY_PASSWORD")

    if (keystoreFile != null && keystorePassword != null &&
        keyAlias != null && keyPassword != null) {
        signingConfigs {
            create("release") {
                storeFile = file(keystoreFile)
                storePassword = keystorePassword
                this.keyAlias = keyAlias
                this.keyPassword = keyPassword
            }
        }
    }

    defaultConfig {
        applicationId = "com.herway.her_way"
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
        manifestPlaceholders["mapsApiKey"] = mapsApiKey
    }

    buildTypes {
        release {
            if (keystoreFile != null && keystorePassword != null &&
                keyAlias != null && keyPassword != null) {
                signingConfig = signingConfigs.getByName("release")
            }
        }
    }

}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}
