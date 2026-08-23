import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../theme/app_theme.dart';
import '../safety/safety_screen.dart';

/// Offline, data-free preview for sharing the interface before backend setup.
class DemoShell extends ConsumerStatefulWidget {
  const DemoShell({super.key});

  @override
  ConsumerState<DemoShell> createState() => _DemoShellState();
}

class _DemoShellState extends ConsumerState<DemoShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final pages = [
      const DemoHomeScreen(),
      const DemoDriverScreen(),
      const SafetyScreen(),
      const DemoAuthScreen(),
      const DemoProfileScreen(),
    ];

    final roleLabel = _index == 1 ? 'DRIVER MODE' : 'RIDER MODE';

    return Scaffold(
      appBar: _index == 3 ? null : AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        toolbarHeight: 44,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.herOrange.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: AppColors.herOrange.withValues(alpha: 0.4),
                ),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.admin_panel_settings_rounded,
                    color: AppColors.herOrange,
                    size: 14,
                  ),
                  const SizedBox(width: 5),
                  Text(
                    roleLabel,
                    style: const TextStyle(
                      color: AppColors.herOrange,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.8,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(
              isDark ? Icons.light_mode_rounded : Icons.dark_mode_rounded,
              color: isDark ? AppColors.softWhite : AppColors.appleTextPrimary,
            ),
            onPressed: () =>
                ref.read(themeNotifierProvider.notifier).toggleTheme(),
            tooltip: 'Toggle Theme',
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Banner(
        message: 'UI DEMO',
        location: BannerLocation.topEnd,
        color: AppColors.herOrange,
        child: IndexedStack(index: _index, children: pages),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _index,
        onTap: (value) => setState(() => _index = value),
        type: BottomNavigationBarType.fixed,
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
            icon: Icon(Icons.lock_outline_rounded),
            label: 'Auth Demo',
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

class DemoHomeScreen extends StatelessWidget {
  const DemoHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.charcoal : AppColors.appleBackground,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text(
          'HerWay.',
          style: TextStyle(
            color: AppColors.herOrange,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 20),
            child: Icon(
              Icons.notifications_none_rounded,
              color: isDark ? AppColors.softWhite : AppColors.appleTextPrimary,
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(
          parent: AlwaysScrollableScrollPhysics(),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Hello, Udita 👋',
              style: TextStyle(
                color: isDark ? Colors.white70 : AppColors.appleTextSecondary,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Where are\nyou going?',
              style: TextStyle(
                color: AppColors.herOrange,
                fontSize: 34,
                fontWeight: FontWeight.bold,
                height: 1.15,
              ),
            ),
            const SizedBox(height: 28),
            _DestinationCard(
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const DemoRideScreen()),
              ),
            ),
            const SizedBox(height: 26),
            Text(
              'Quick destinations',
              style: TextStyle(
                color: isDark ? AppColors.softWhite : AppColors.appleTextPrimary,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 14),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: const [
                _QuickDestination(
                  icon: Icons.home_rounded,
                  label: 'Home',
                  eta: '12 min',
                ),
                _QuickDestination(
                  icon: Icons.work_rounded,
                  label: 'Work',
                  eta: '25 min',
                ),
                _QuickDestination(
                  icon: Icons.school_rounded,
                  label: 'College',
                  eta: '18 min',
                ),
                _QuickDestination(
                  icon: Icons.more_horiz_rounded,
                  label: 'More',
                  eta: '',
                ),
              ],
            ),
            const SizedBox(height: 30),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: theme.colorScheme.surface,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  color: isDark ? Colors.white10 : AppColors.appleBorder,
                ),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.shield_outlined,
                    color: AppColors.herOrange,
                    size: 34,
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Your Safety, Our Priority',
                          style: TextStyle(
                            color: theme.colorScheme.onSurface,
                            fontWeight: FontWeight.bold,
                            fontSize: 17,
                          ),
                        ),
                        const SizedBox(height: 5),
                        Text(
                          'Verified partners and live trip sharing for every ride.',
                          style: TextStyle(
                            color: theme.colorScheme.onSurface.withValues(
                              alpha: 0.6,
                            ),
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DestinationCard extends StatelessWidget {
  const _DestinationCard({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    borderRadius: BorderRadius.circular(24),
    child: Ink(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.slate,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white12),
      ),
      child: const Row(
        children: [
          Icon(Icons.location_on_rounded, color: AppColors.herOrange, size: 24),
          SizedBox(width: 14),
          Expanded(
            child: Text(
              'Where to?',
              style: TextStyle(color: Colors.white70, fontSize: 16),
            ),
          ),
          Icon(Icons.arrow_forward_rounded, color: AppColors.softWhite),
        ],
      ),
    ),
  );
}

class _QuickDestination extends StatelessWidget {
  const _QuickDestination({
    required this.icon,
    required this.label,
    required this.eta,
  });
  final IconData icon;
  final String label;
  final String eta;

  @override
  Widget build(BuildContext context) => Expanded(
    child: Column(
      children: [
        Container(
          padding: const EdgeInsets.all(15),
          decoration: BoxDecoration(
            color: AppColors.slate,
            borderRadius: BorderRadius.circular(18),
          ),
          child: Icon(icon, color: AppColors.herOrange),
        ),
        const SizedBox(height: 7),
        Text(
          label,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          textAlign: TextAlign.center,
          style: const TextStyle(color: AppColors.softWhite, fontSize: 12),
        ),
        if (eta.isNotEmpty)
          Text(
            eta,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.white38, fontSize: 10),
          ),
      ],
    ),
  );
}

class DemoRideScreen extends StatefulWidget {
  const DemoRideScreen({super.key});

  @override
  State<DemoRideScreen> createState() => _DemoRideScreenState();
}

class _DemoRideScreenState extends State<DemoRideScreen> {
  bool _booked = false;

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: AppColors.charcoal,
    body: Stack(
      children: [
        Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF25312D), Color(0xFF111719)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        const Center(
          child: Icon(Icons.map_outlined, color: Colors.white24, size: 96),
        ),
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: IconButton(
              onPressed: () => Navigator.pop(context),
              icon: const Icon(
                Icons.arrow_back_ios_new,
                color: AppColors.softWhite,
              ),
            ),
          ),
        ),
        Align(
          alignment: Alignment.bottomCenter,
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: const BoxDecoration(
              color: AppColors.charcoal,
              borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
            ),
            child: _booked
                ? const Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.check_circle,
                        color: Colors.greenAccent,
                        size: 46,
                      ),
                      SizedBox(height: 12),
                      Text(
                        'Ride request confirmed',
                        style: TextStyle(
                          color: AppColors.softWhite,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      SizedBox(height: 6),
                      Text(
                        'Demo only — no ride was created.',
                        style: TextStyle(color: Colors.white60),
                      ),
                    ],
                  )
                : Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'HerWay Premium',
                        style: TextStyle(
                          color: AppColors.softWhite,
                          fontSize: 19,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Hitec City → Gachibowli',
                        style: TextStyle(color: Colors.white60),
                      ),
                      const SizedBox(height: 16),
                      const Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '4.2 km • 14 min',
                            style: TextStyle(color: Colors.white70),
                          ),
                          Text(
                            '₹112',
                            style: TextStyle(
                              color: AppColors.herOrange,
                              fontWeight: FontWeight.bold,
                              fontSize: 20,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () => setState(() => _booked = true),
                          child: const Text('CONFIRM & BOOK RIDE'),
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ],
    ),
  );
}

class DemoDriverScreen extends StatefulWidget {
  const DemoDriverScreen({super.key});

  @override
  State<DemoDriverScreen> createState() => _DemoDriverScreenState();
}

class _DemoDriverScreenState extends State<DemoDriverScreen> {
  bool _accepted = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.charcoal : AppColors.appleBackground,
      appBar: AppBar(title: const Text('HerWay Driver Partner')),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(
          parent: AlwaysScrollableScrollPhysics(),
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: theme.colorScheme.surface,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isDark ? Colors.white10 : AppColors.appleBorder,
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "Today's Earnings",
                        style: TextStyle(
                          color: theme.colorScheme.onSurface.withValues(
                            alpha: 0.6,
                          ),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '₹1,840',
                        style: TextStyle(
                          color: theme.colorScheme.onSurface,
                          fontSize: 26,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        'Rides Completed',
                        style: TextStyle(
                          color: theme.colorScheme.onSurface.withValues(
                            alpha: 0.6,
                          ),
                        ),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        '7 rides',
                        style: TextStyle(
                          color: AppColors.herOrange,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),
            Text(
              'Nearby Ride Dispatches',
              style: TextStyle(
                color: theme.colorScheme.onSurface,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: theme.colorScheme.surface,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isDark ? Colors.white10 : AppColors.appleBorder,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Ananya S.',
                    style: TextStyle(
                      color: theme.colorScheme.onSurface,
                      fontSize: 17,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Hitec City Metro → Gachibowli',
                    style: TextStyle(
                      color: theme.colorScheme.onSurface.withValues(
                        alpha: 0.7,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    _accepted ? 'Ride accepted for demo' : '₹112 • 4.2 km away',
                    style: const TextStyle(color: AppColors.herOrange),
                  ),
                  const SizedBox(height: 18),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => setState(() => _accepted = true),
                      child: Text(
                        _accepted ? 'ACCEPTED' : 'ACCEPT RIDE DISPATCH',
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class DemoAuthScreen extends StatelessWidget {
  const DemoAuthScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.charcoal : AppColors.appleBackground,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            const SizedBox(height: 32),
            const Text(
              'HerWay.',
              style: TextStyle(
                color: AppColors.herOrange,
                fontSize: 40,
                fontWeight: FontWeight.bold,
                letterSpacing: -1,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Auth preview',
              style: TextStyle(
                color: theme.colorScheme.onSurface,
                fontSize: 28,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Demo mode does not contact Firebase or send SMS. Use connected mode for real phone OTP.',
              style: TextStyle(
                color: theme.colorScheme.onSurface.withValues(alpha: 0.65),
                height: 1.4,
              ),
            ),
            const SizedBox(height: 32),
            _DemoInputPreview(
              label: 'Mobile number',
              value: '+91 99999 99999',
              icon: Icons.phone_outlined,
              isDark: isDark,
            ),
            const SizedBox(height: 16),
            _DemoInputPreview(
              label: 'OTP code',
              value: '••••••',
              icon: Icons.lock_outline_rounded,
              isDark: isDark,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Demo only — no authentication request was sent.'),
                ),
              ),
              child: const Text('Preview Verify & Continue'),
            ),
            const SizedBox(height: 24),
            Text(
              'Connected launch checklist: Firebase Phone Auth enabled, test phone numbers configured, authorized domains added.',
              style: TextStyle(
                color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                fontSize: 12,
                height: 1.35,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DemoInputPreview extends StatelessWidget {
  const _DemoInputPreview({
    required this.label,
    required this.value,
    required this.icon,
    required this.isDark,
  });

  final String label;
  final String value;
  final IconData icon;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.slate : AppColors.appleCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? Colors.white10 : AppColors.appleBorder,
        ),
      ),
      child: Row(
        children: [
          Icon(icon, color: AppColors.herOrange),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: TextStyle(
                    color: theme.colorScheme.onSurface,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class DemoProfileScreen extends ConsumerWidget {
  const DemoProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.charcoal : AppColors.appleBackground,
      appBar: AppBar(
        title: const Text('Account & Safety Profile'),
        actions: [
          IconButton(
            icon: Icon(isDark ? Icons.light_mode : Icons.dark_mode),
            onPressed: () =>
                ref.read(themeNotifierProvider.notifier).toggleTheme(),
            tooltip: 'Toggle Theme',
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: theme.colorScheme.surface,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              children: [
                const CircleAvatar(
                  radius: 30,
                  backgroundColor: AppColors.herOrange,
                  child: Text(
                    'S',
                    style: TextStyle(
                      color: AppColors.charcoal,
                      fontSize: 25,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Udita',
                      style: TextStyle(
                        color: theme.colorScheme.onSurface,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '+91 98765 43210',
                      style: TextStyle(
                        color: theme.colorScheme.onSurface.withValues(
                          alpha: 0.6,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 28),
          Text(
            'Safety Contacts',
            style: TextStyle(
              color: theme.colorScheme.onSurface,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          ListTile(
            leading: const Icon(Icons.shield_outlined, color: AppColors.herOrange),
            title: Text(
              'Priya Sharma',
              style: TextStyle(color: theme.colorScheme.onSurface),
            ),
            subtitle: Text(
              'Emergency contact',
              style: TextStyle(
                color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
              ),
            ),
          ),
          Divider(
            color: theme.colorScheme.onSurface.withValues(alpha: 0.1),
          ),
          ListTile(
            leading: const Icon(Icons.phone_outlined, color: AppColors.herOrange),
            title: Text(
              '+91 98765 43210',
              style: TextStyle(color: theme.colorScheme.onSurface),
            ),
            subtitle: Text(
              'Demo profile — changes are not saved',
              style: TextStyle(
                color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
