import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
// Theme is read via Theme.of(context) where needed; remove unused import
import '../features/ride/home_screen.dart';
import '../features/driver/driver_screen.dart';
import '../features/safety/safety_screen.dart';
import '../features/profile/profile_screen.dart';

class MainScaffold extends ConsumerStatefulWidget {
  const MainScaffold({super.key});

  @override
  ConsumerState<MainScaffold> createState() => _MainScaffoldState();
}

class _MainScaffoldState extends ConsumerState<MainScaffold> {
  int _currentIndex = 0;

  final List<Widget> _pages = const [
    HomeScreen(),
    DriverScreen(),
    SafetyScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _pages,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_rounded),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.local_taxi_rounded),
            label: 'Driver',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.shield_rounded),
            label: 'Safety',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_rounded),
            label: 'Account',
          ),
        ],
      ),
    );
  }
}