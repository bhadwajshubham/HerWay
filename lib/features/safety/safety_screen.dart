import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../theme/app_theme.dart';

class SafetyScreen extends ConsumerStatefulWidget {
  const SafetyScreen({super.key});

  @override
  ConsumerState<SafetyScreen> createState() => _SafetyScreenState();
}

class _SafetyScreenState extends ConsumerState<SafetyScreen> {
  bool _isSosTriggered = false;

  void _triggerSosAlert() {
    setState(() => _isSosTriggered = true);
    
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.charcoal,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Row(
          children: const [
            Icon(Icons.warning_amber_rounded, color: Colors.redAccent, size: 28),
            SizedBox(width: 10),
            Text('SOS Emergency Active', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
          ],
        ),
        content: const Text(
          'Encrypted live coordinates & audio recording have been broadcasted to your Emergency Guardian Circle.',
          style: TextStyle(color: Colors.white70, fontSize: 14),
        ),
        actions: [
          TextButton(
            onPressed: () {
              setState(() => _isSosTriggered = false);
              Navigator.pop(context);
            },
            child: const Text('CANCEL ALARM', style: TextStyle(color: Colors.white54)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
            child: const Text('CALL HELPLINE (112)', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _simulateFakeCall() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.black,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
      ),
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.85,
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 48),
        child: SingleChildScrollView(
          child: Column(
            children: [
              const CircleAvatar(
                radius: 44,
                backgroundColor: AppColors.slate,
                child: Icon(Icons.person, size: 50, color: Colors.white70),
              ),
              const SizedBox(height: 20),
              const Text(
                'Mom (Home)',
                style: TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                'Incoming Fake Safety Call...',
                style: TextStyle(color: Colors.white54, fontSize: 14),
              ),
              const SizedBox(height: 80),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Column(
                      children: const [
                        CircleAvatar(
                          radius: 34,
                          backgroundColor: Colors.redAccent,
                          child: Icon(Icons.call_end, color: Colors.white, size: 30),
                        ),
                        SizedBox(height: 8),
                        Text('Decline', style: TextStyle(color: Colors.white70)),
                      ],
                    ),
                  ),
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Column(
                      children: const [
                        CircleAvatar(
                          radius: 34,
                          backgroundColor: Colors.green,
                          child: Icon(Icons.call, color: Colors.white, size: 30),
                        ),
                        SizedBox(height: 8),
                        Text('Accept', style: TextStyle(color: Colors.white70)),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDarkMode = ref.watch(themeNotifierProvider) == ThemeMode.dark;

    return Scaffold(
      backgroundColor: isDarkMode ? AppColors.charcoal : AppColors.appleBackground,
      appBar: AppBar(
        title: Text(
          'HerWay Safety Shield',
          style: TextStyle(
            color: isDarkMode ? AppColors.softWhite : AppColors.appleTextPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            GestureDetector(
              onTap: _triggerSosAlert,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                width: 180,
                height: 180,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: _isSosTriggered ? Colors.redAccent : AppColors.rosePink,
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.rosePink.withAlpha((0.4 * 255).round()),
                      blurRadius: 30,
                      spreadRadius: 8,
                    ),
                  ],
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: const [
                    Icon(Icons.shield, color: Colors.white, size: 64),
                    SizedBox(height: 8),
                    Text(
                      'TAP FOR SOS',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.2,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Pressing SOS immediately alerts your emergency contacts & live command center.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                color: isDarkMode ? Colors.white60 : AppColors.appleTextSecondary,
              ),
            ),
            const SizedBox(height: 36),

            // Smart Safety Features Grid
            Row(
              children: [
                Expanded(
                  child: _buildFeatureCard(
                    isDarkMode: isDarkMode,
                    icon: Icons.phone_callback_rounded,
                    title: 'Fake Call Simulator',
                    subtitle: 'Escape uncomfortable situations with a simulated call',
                    onTap: _simulateFakeCall,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildFeatureCard(
                    isDarkMode: isDarkMode,
                    icon: Icons.share_location_rounded,
                    title: 'Share Live Journey',
                    subtitle: 'Broadcast real-time GPS tracking link to trusted circle',
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Sharing functionality not yet implemented.')),
                      );
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Emergency Contacts Quick Dial Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: isDarkMode ? AppColors.slate : AppColors.appleCard,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isDarkMode ? Colors.white10 : AppColors.appleBorder,
                ),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.herOrange.withAlpha((0.15 * 255).round()),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.contact_phone_rounded, color: AppColors.herOrange, size: 24),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Primary Guardian Connected',
                          style: TextStyle(
                            color: isDarkMode ? AppColors.softWhite : AppColors.appleTextPrimary,
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Mom (+91 98765 43210)',
                          style: TextStyle(
                            color: isDarkMode ? Colors.white60 : AppColors.appleTextSecondary,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Icon(
                    Icons.check_circle_rounded,
                    color: Colors.greenAccent,
                    size: 22,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeatureCard({
    required bool isDarkMode,
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(18),
        height: 160,
        decoration: BoxDecoration(
          color: isDarkMode ? AppColors.slate : AppColors.appleCard,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(
            color: isDarkMode ? Colors.white10 : AppColors.appleBorder,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withAlpha(((isDarkMode ? 0.2 : 0.04) * 255).round()),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Icon(icon, color: AppColors.herOrange, size: 28),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    color: isDarkMode ? AppColors.softWhite : AppColors.appleTextPrimary,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: TextStyle(
                    color: isDarkMode ? Colors.white54 : AppColors.appleTextSecondary,
                    fontSize: 11,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
