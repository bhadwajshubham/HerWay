import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart' show kIsWeb;

import 'core/app_config.dart';

/// Firebase configuration for the staged web deployment.
///
/// Vercel injects these public browser configuration values at build time using
/// `--dart-define`; no project-specific values are committed to source.
class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (!kIsWeb) {
      throw UnsupportedError(
        'This Firebase configuration is supplied for the Vercel web build only.',
      );
    }

    return FirebaseOptions(
      apiKey: AppConfig.firebaseApiKey,
      appId: AppConfig.firebaseAppId,
      messagingSenderId: AppConfig.firebaseMessagingSenderId,
      projectId: AppConfig.firebaseProjectId,
      authDomain: AppConfig.firebaseAuthDomain,
      storageBucket: AppConfig.firebaseStorageBucket,
    );
  }
}
