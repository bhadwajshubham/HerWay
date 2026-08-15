import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../features/activity/activity_screen.dart';
import '../features/ride/home_screen.dart';
import '../features/driver/driver_screen.dart';
import '../features/safety/safety_screen.dart';
import '../features/profile/profile_screen.dart';
import '../features/profile/user_service.dart';
import '../theme/app_theme.dart';

class MainScaffold extends ConsumerStatefulWidget {
  const MainScaffold({super.key});

  @override
  ConsumerState<MainScaffold> createState() => _MainScaffoldState();
}

class _MainScaffoldState extends ConsumerState<MainScaffold> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;
    final isDarkMode = ref.watch(themeNotifierProvider) == ThemeMode.dark;

    if (user == null) {
      return const Scaffold(body: Center(child: Text('Please sign in.')));
    }

    return StreamBuilder(
      stream: ref.read(userServiceProvider).streamUserProfile(user.uid),
      builder: (context, snapshot) {
        final isDriver = snapshot.data?.isDriver ?? false;
        
        final pages = [
          const HomeScreen(),
          const ActivityScreen(),
          if (isDriver) const DriverScreen(),
          const SafetyScreen(),
          const ProfileScreen(),
        ];

        final navItems = [
          const BottomNavigationBarItem(icon: Icon(Icons.home_rounded), label: 'Home'),
          const BottomNavigationBarItem(icon: Icon(Icons.history_rounded), label: 'Activity'),
          if (isDriver) const BottomNavigationBarItem(icon: Icon(Icons.local_taxi_rounded), label: 'Driver'),
          const BottomNavigationBarItem(icon: Icon(Icons.shield_rounded), label: 'Safety'),
          const BottomNavigationBarItem(icon: Icon(Icons.person_rounded), label: 'Account'),
        ];

        return Scaffold(
          body: IndexedStack(
            index: _currentIndex,
            children: pages,
          ),
          bottomNavigationBar: BottomNavigationBar(
            currentIndex: _currentIndex,
            onTap: (index) => setState(() => _currentIndex = index),
            type: BottomNavigationBarType.fixed,
            backgroundColor: isDarkMode ? AppColors.charcoal : AppColors.appleCard,
            selectedItemColor: AppColors.herOrange,
            unselectedItemColor: isDarkMode ? Colors.white54 : AppColors.appleTextSecondary,
            items: navItems,
          ),
        );
      },
    );
  }
}