import 'package:flutter_test/flutter_test.dart';
import 'package:her_way/core/app_config.dart';

void main() {
  group('AppConfig Tests', () {
    test('missingFirebaseVariables returns missing items when unconfigured', () {
      final missing = AppConfig.missingFirebaseVariables;
      // In default test environment without dart-define, variables are empty
      expect(missing, contains('FIREBASE_API_KEY'));
      expect(missing, contains('FIREBASE_APP_ID'));
      expect(missing, contains('FIREBASE_PROJECT_ID'));
    });

    test('validateFirebase throws AppConfigurationException when missing variables exist', () {
      expect(() => AppConfig.validateFirebase(), throwsA(isA<AppConfigurationException>()));
    });
  });
}
