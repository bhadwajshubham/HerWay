import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../theme/app_theme.dart';
import '../../models/user_model.dart';
import '../profile/user_service.dart';
import 'map_screen.dart';
import 'search_location_screen.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDarkMode = ref.watch(themeNotifierProvider) == ThemeMode.dark;
    final userService = ref.watch(userServiceProvider);
    final user = FirebaseAuth.instance.currentUser;

    return Scaffold(
      backgroundColor: isDarkMode ? AppColors.charcoal : AppColors.appleBackground,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            Icons.menu_rounded,
            color: isDarkMode ? AppColors.softWhite : AppColors.appleTextPrimary,
          ),
          tooltip: 'Menu',
          onPressed: () => _showMenu(context),
        ),
        actions: [
          IconButton(
            icon: Icon(
              Icons.notifications_none_rounded,
              color: isDarkMode ? AppColors.softWhite : AppColors.appleTextPrimary,
            ),
            tooltip: 'Notifications',
            onPressed: () => _showNotifications(context),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 10),
            
            // Dynamic User Greeting
            StreamBuilder<UserModel?>(
              stream: user != null ? userService.streamUserProfile(user.uid) : null,
              builder: (context, snapshot) {
                final userName = snapshot.data?.name ?? 'there';
                return Text(
                  'Hello, $userName 👋',
                  style: TextStyle(
                    fontSize: 16,
                    color: isDarkMode ? Colors.white70 : AppColors.appleTextSecondary,
                    fontWeight: FontWeight.w500,
                  ),
                );
              },
            ),
            const SizedBox(height: 8),
            Text(
              'Where are\nyou going?',
              style: TextStyle(
                fontSize: 34,
                color: AppColors.herOrange,
                fontWeight: FontWeight.bold,
                height: 1.15,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 28),
            
            // Search Bar (Navigates to Search Location Screen)
            GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const SearchLocationScreen()),
                );
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
                decoration: BoxDecoration(
                  color: isDarkMode ? AppColors.slate : AppColors.appleCard,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: isDarkMode ? Colors.white10 : AppColors.appleBorder,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withAlpha(((isDarkMode ? 0.2 : 0.04) * 255).round()),
                      blurRadius: 16,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    const Icon(Icons.location_on_rounded, color: AppColors.herOrange, size: 22),
                    const SizedBox(width: 14),
                    Text(
                      'Where to?',
                      style: TextStyle(
                        color: isDarkMode ? Colors.white54 : AppColors.appleTextSecondary,
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: isDarkMode ? Colors.white10 : AppColors.appleSlate,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        Icons.tune_rounded,
                        color: isDarkMode ? AppColors.softWhite : AppColors.appleTextPrimary,
                        size: 18,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 28),
            
            // Quick Action Destinations Row
            Wrap(
              spacing: 8,
              runSpacing: 12,
              alignment: WrapAlignment.spaceBetween,
              children: [
                _buildQuickAction(context, isDarkMode, Icons.home_rounded, 'Home', '12 min'),
                _buildQuickAction(context, isDarkMode, Icons.work_rounded, 'Work', '25 min'),
                _buildQuickAction(context, isDarkMode, Icons.school_rounded, 'College', '18 min'),
                _buildQuickAction(context, isDarkMode, Icons.more_horiz_rounded, 'More', ''),
              ],
            ),
            
            const SizedBox(height: 32),
            
            // Safety Priority Banner (Sleek Apple/Uber Aesthetics)
            _buildSafetyPriorityCard(isDarkMode),
            
            const SizedBox(height: 28),
            
            // Safety Tools Row (Unified Monochrome + Accent Palette - No Rainbow Colors)
            _buildSafetyToolsRow(isDarkMode),
            
            const SizedBox(height: 28),
            
            // Instant Ride CTA Card
            _buildInstantRideCard(context, isDarkMode),
            
            const SizedBox(height: 100), // Padding for bottom nav bar
          ],
        ),
      ),
    );
  }

  void _showMenu(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.settings_outlined),
              title: const Text('Settings'),
              onTap: () => Navigator.pop(context),
            ),
            ListTile(
              leading: const Icon(Icons.help_outline_rounded),
              title: const Text('Help & support'),
              onTap: () => Navigator.pop(context),
            ),
          ],
        ),
      ),
    );
  }

  void _showNotifications(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) => const SafeArea(
        child: Padding(
          padding: EdgeInsets.fromLTRB(24, 8, 24, 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Notifications', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              SizedBox(height: 20),
              Text('You’re all caught up.', style: TextStyle(color: Colors.grey)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuickAction(BuildContext context, bool isDarkMode, IconData icon, String title, String subtitle) {
    return SizedBox(
      width: 60,
      child: GestureDetector(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => MapScreen(
              pickupAddress: 'Current Location',
              dropoffAddress: title,
              pickupLat: 17.4435,
              pickupLng: 78.3772,
              dropoffLat: 17.4430,
              dropoffLng: 78.3558,
            )),
          );
        },
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: isDarkMode ? AppColors.slate : AppColors.appleCard,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isDarkMode ? Colors.white10 : AppColors.appleBorder,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withAlpha(((isDarkMode ? 0.15 : 0.03) * 255).round()),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Icon(icon, color: AppColors.herOrange, size: 26),
            ),
            const SizedBox(height: 8),
            Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: isDarkMode ? AppColors.softWhite : AppColors.appleTextPrimary,
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
            ),
            if (subtitle.isNotEmpty)
              Text(
                subtitle,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: isDarkMode ? Colors.white38 : AppColors.appleTextSecondary,
                  fontSize: 11,
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildSafetyPriorityCard(bool isDarkMode) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDarkMode ? AppColors.slate : AppColors.appleCard,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isDarkMode ? Colors.white10 : AppColors.appleBorder,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(((isDarkMode ? 0.2 : 0.04) * 255).round()),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Your Safety, Our Priority',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    color: isDarkMode ? AppColors.softWhite : AppColors.appleTextPrimary,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Verified women partners & live encrypted tracking for every ride.',
                  style: TextStyle(
                    fontSize: 12,
                    color: isDarkMode ? Colors.white60 : AppColors.appleTextSecondary,
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.herOrange.withAlpha((0.12 * 255).round()),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.shield_outlined, color: AppColors.herOrange, size: 28),
          ),
        ],
      ),
    );
  }

  Widget _buildSafetyToolsRow(bool isDarkMode) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        _buildToolIcon(isDarkMode, Icons.my_location_rounded, 'Live Tracking'),
        _buildToolIcon(isDarkMode, Icons.campaign_rounded, 'SOS Alert'),
        _buildToolIcon(isDarkMode, Icons.share_rounded, 'Share Trip'),
        _buildToolIcon(isDarkMode, Icons.health_and_safety_rounded, 'Safety Toolkit'),
      ],
    );
  }

  Widget _buildToolIcon(bool isDarkMode, IconData icon, String label) {
    return Expanded(
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDarkMode ? AppColors.slate : AppColors.appleSlate,
              shape: BoxShape.circle,
              border: Border.all(
                color: isDarkMode ? Colors.white10 : AppColors.appleBorder,
              ),
            ),
            child: Icon(
              icon, 
              color: isDarkMode ? AppColors.softWhite : AppColors.appleTextPrimary, 
              size: 22,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: isDarkMode ? Colors.white70 : AppColors.appleTextSecondary,
              fontSize: 11,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInstantRideCard(BuildContext context, bool isDarkMode) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const MapScreen(
            pickupAddress: 'Current Location',
            dropoffAddress: 'Destination',
            pickupLat: 17.4435,
            pickupLng: 78.3772,
            dropoffLat: 17.4430,
            dropoffLng: 78.3558,
          )),
        );
      },
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isDarkMode ? AppColors.slate : AppColors.appleCard,
          borderRadius: BorderRadius.circular(24),
            border: Border.all(
            color: AppColors.herOrange.withAlpha((0.4 * 255).round()),
          ),
          boxShadow: [
              BoxShadow(
              color: AppColors.herOrange.withAlpha((0.1 * 255).round()),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Book a Ride Instantly',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: isDarkMode ? AppColors.softWhite : AppColors.appleTextPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Choose your preferred verified ride',
                  style: TextStyle(
                    fontSize: 12,
                    color: isDarkMode ? Colors.white54 : AppColors.appleTextSecondary,
                  ),
                ),
              ],
            ),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: const BoxDecoration(
                color: AppColors.herOrange,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.arrow_forward_rounded, color: AppColors.charcoal, size: 18),
            ),
          ],
        ),
      ),
    );
  }
}
