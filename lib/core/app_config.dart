/// Compile-time configuration supplied by the Vercel build command.
///
/// These values are public web-client configuration, not server secrets. The
/// app still validates them so an incomplete deployment displays a useful
/// recovery screen instead of crashing during Firebase initialization.
class AppConfig {
  AppConfig._();

  static const firebaseApiKey = String.fromEnvironment('FIREBASE_API_KEY');
  static const firebaseAppId = String.fromEnvironment('FIREBASE_APP_ID');
  static const firebaseMessagingSenderId = String.fromEnvironment(
    'FIREBASE_MESSAGING_SENDER_ID',
  );
  static const firebaseProjectId = String.fromEnvironment(
    'FIREBASE_PROJECT_ID',
  );
  static const firebaseAuthDomain = String.fromEnvironment(
    'FIREBASE_AUTH_DOMAIN',
  );
  static const firebaseStorageBucket = String.fromEnvironment(
    'FIREBASE_STORAGE_BUCKET',
  );
  static const isDemoMode = false;

  static List<String> get missingFirebaseVariables => [
    if (firebaseApiKey.isEmpty) 'FIREBASE_API_KEY',
    if (firebaseAppId.isEmpty) 'FIREBASE_APP_ID',
    if (firebaseMessagingSenderId.isEmpty) 'FIREBASE_MESSAGING_SENDER_ID',
    if (firebaseProjectId.isEmpty) 'FIREBASE_PROJECT_ID',
    if (firebaseAuthDomain.isEmpty) 'FIREBASE_AUTH_DOMAIN',
    if (firebaseStorageBucket.isEmpty) 'FIREBASE_STORAGE_BUCKET',
  ];

  static void validateFirebase() {
    final missing = missingFirebaseVariables;
    if (missing.isNotEmpty) {
      throw AppConfigurationException(missing);
    }
  }
}

class AppConfigurationException implements Exception {
  const AppConfigurationException(this.missingVariables);

  final List<String> missingVariables;

  @override
  String toString() =>
      'Missing required configuration: ${missingVariables.join(', ')}';
}
