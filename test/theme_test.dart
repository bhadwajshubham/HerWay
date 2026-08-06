import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:her_way/theme/app_theme.dart';

void main() {
  group('ThemeNotifier State Tests', () {
    test('Initial theme state is ThemeMode.dark', () {
      final notifier = ThemeNotifier();
      expect(notifier.state, ThemeMode.dark);
      expect(notifier.isDarkMode, true);
    });

    test('Toggling theme switches between dark and light mode', () {
      final notifier = ThemeNotifier();

      notifier.toggleTheme();
      expect(notifier.state, ThemeMode.light);
      expect(notifier.isDarkMode, false);

      notifier.toggleTheme();
      expect(notifier.state, ThemeMode.dark);
      expect(notifier.isDarkMode, true);
    });

    test('AppTheme builds valid light and dark ThemeData', () {
      final darkTheme = AppTheme.darkTheme();
      final lightTheme = AppTheme.lightTheme();

      expect(darkTheme.brightness, Brightness.dark);
      expect(darkTheme.scaffoldBackgroundColor, AppColors.charcoal);

      expect(lightTheme.brightness, Brightness.light);
      expect(lightTheme.scaffoldBackgroundColor, AppColors.appleBackground);
    });
  });
}
