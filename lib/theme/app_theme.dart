import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/storage_service.dart';

// Riverpod Provider to manage Theme State across the entire application
final themeNotifierProvider = StateNotifierProvider<ThemeNotifier, ThemeMode>((ref) {
  final prefs = ref.watch(sharedPreferencesProvider);
  return ThemeNotifier(prefs);
});

class ThemeNotifier extends StateNotifier<ThemeMode> {
  final SharedPreferences _prefs;
  static const _key = 'isDarkMode';

  ThemeNotifier(this._prefs) : super(_loadInitialMode(_prefs));

  static ThemeMode _loadInitialMode(SharedPreferences prefs) {
    final isDarkMode = prefs.getBool(_key) ?? true; // Default to dark
    return isDarkMode ? ThemeMode.dark : ThemeMode.light;
  }

  void toggleTheme() {
    state = state == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    _prefs.setBool(_key, state == ThemeMode.dark);
  }

  bool get isDarkMode => state == ThemeMode.dark;
}

class AppColors {
  // Dark Theme Palette
  static const Color charcoal = Color(0xFF0D0D0F);
  static const Color slate = Color(0xFF1A1A1E);
  static const Color softWhite = Color(0xFFF5F5F7);

  // Light Theme Palette
  static const Color appleBackground = Color(0xFFF8F9FB);
  static const Color appleCard = Color(0xFFFFFFFF);
  static const Color appleSlate = Color(0xFFF0F2F5);
  static const Color appleTextPrimary = Color(0xFF1C1C1E);
  static const Color appleTextSecondary = Color(0xFF8E8E93);
  static const Color appleBorder = Color(0xFFE5E5EA);

  // Brand Accents
  static const Color herOrange = Color(0xFFFF6A00);
  static const Color rosePink = Color(0xFFFF2D55);
}

class AppTheme {
  static ThemeData darkTheme() {
    final base = ThemeData.dark(useMaterial3: true);
    return base.copyWith(
      scaffoldBackgroundColor: AppColors.charcoal,
      primaryColor: AppColors.herOrange,
      colorScheme: const ColorScheme.dark(
        primary: AppColors.herOrange,
        onPrimary: AppColors.charcoal,
        surface: AppColors.slate,
        onSurface: AppColors.softWhite,
        secondary: AppColors.rosePink,
        onSecondary: Colors.white,
      ),
      textTheme: GoogleFonts.outfitTextTheme(base.textTheme).apply(
        bodyColor: AppColors.softWhite,
        displayColor: AppColors.softWhite,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.softWhite),
        titleTextStyle: GoogleFonts.outfit(
          color: AppColors.softWhite,
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.slate,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.herOrange,
          foregroundColor: AppColors.charcoal,
          elevation: 0,
          minimumSize: const Size(double.infinity, 56),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          textStyle: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.slate,
        hintStyle: const TextStyle(color: Colors.white24),
        labelStyle: const TextStyle(color: Colors.white70),
        prefixIconColor: Colors.white54,
        disabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: Colors.white12),
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppColors.herOrange, width: 1.5),
        ),
        errorStyle: const TextStyle(color: AppColors.herOrange),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.charcoal,
        selectedItemColor: AppColors.herOrange,
        unselectedItemColor: Colors.white54,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
      ),
    );
  }

  static ThemeData lightTheme() {
    final base = ThemeData.light(useMaterial3: true);
    return base.copyWith(
      scaffoldBackgroundColor: AppColors.appleBackground,
      primaryColor: AppColors.herOrange,
      colorScheme: const ColorScheme.light(
        primary: AppColors.herOrange,
        onPrimary: Colors.white,
        surface: AppColors.appleCard,
        onSurface: AppColors.appleTextPrimary,
        secondary: AppColors.rosePink,
        onSecondary: Colors.white,
      ),
      textTheme: GoogleFonts.outfitTextTheme(base.textTheme).apply(
        bodyColor: AppColors.appleTextPrimary,
        displayColor: AppColors.appleTextPrimary,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.appleTextPrimary),
        titleTextStyle: GoogleFonts.outfit(
          color: AppColors.appleTextPrimary,
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.appleCard,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.herOrange,
          foregroundColor: Colors.white,
          elevation: 0,
          minimumSize: const Size(double.infinity, 56),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          textStyle: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.appleSlate,
        hintStyle: const TextStyle(color: Colors.black26),
        labelStyle: const TextStyle(color: AppColors.appleTextSecondary),
        prefixIconColor: AppColors.appleTextSecondary,
        disabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppColors.appleBorder),
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppColors.herOrange, width: 1.5),
        ),
        errorStyle: const TextStyle(color: AppColors.herOrange),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.appleBackground,
        selectedItemColor: AppColors.herOrange,
        unselectedItemColor: AppColors.appleTextSecondary,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
      ),
    );
  }
}
