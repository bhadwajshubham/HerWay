import 'package:flutter/material.dart';

import '../../theme/app_theme.dart';
import '../safety/safety_screen.dart';

/// Offline, data-free preview for sharing the interface before backend setup.
class DemoShell extends StatefulWidget {
  const DemoShell({super.key});

  @override
  State<DemoShell> createState() => _DemoShellState();
}

class _DemoShellState extends State<DemoShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    const pages = [
      DemoHomeScreen(),
      DemoDriverScreen(),
      SafetyScreen(),
      DemoProfileScreen(),
    ];
    return Scaffold(
      body: Banner(
        message: 'UI DEMO',
        location: BannerLocation.topEnd,
        color: AppColors.herOrange,
        child: IndexedStack(index: _index, children: pages),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _index,
        onTap: (value) => setState(() => _index = value),
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

class DemoHomeScreen extends StatelessWidget {
  const DemoHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.charcoal,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text(
          'HerWay.',
          style: TextStyle(
            color: AppColors.herOrange,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 20),
            child: Icon(Icons.notifications_none_rounded),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Hello, Shreya 👋',
              style: TextStyle(color: Colors.white70, fontSize: 16),
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
            const Text(
              'Quick destinations',
              style: TextStyle(
                color: AppColors.softWhite,
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
                color: AppColors.slate,
                borderRadius: BorderRadius.circular(24),
              ),
              child: const Row(
                children: [
                  Icon(
                    Icons.shield_outlined,
                    color: AppColors.herOrange,
                    size: 34,
                  ),
                  SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Your Safety, Our Priority',
                          style: TextStyle(
                            color: AppColors.softWhite,
                            fontWeight: FontWeight.bold,
                            fontSize: 17,
                          ),
                        ),
                        SizedBox(height: 5),
                        Text(
                          'Verified partners and live trip sharing for every ride.',
                          style: TextStyle(color: Colors.white60, fontSize: 12),
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
  Widget build(BuildContext context) => Column(
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
        style: const TextStyle(color: AppColors.softWhite, fontSize: 12),
      ),
      if (eta.isNotEmpty)
        Text(eta, style: const TextStyle(color: Colors.white38, fontSize: 10)),
    ],
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
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: AppColors.charcoal,
    appBar: AppBar(title: const Text('HerWay Driver Partner')),
    body: Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.slate,
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "Today's Earnings",
                      style: TextStyle(color: Colors.white54),
                    ),
                    SizedBox(height: 6),
                    Text(
                      '₹1,840',
                      style: TextStyle(
                        color: AppColors.softWhite,
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
                      style: TextStyle(color: Colors.white54),
                    ),
                    SizedBox(height: 6),
                    Text(
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
          const Text(
            'Nearby Ride Dispatches',
            style: TextStyle(
              color: AppColors.softWhite,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: AppColors.slate,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Ananya S.',
                  style: TextStyle(
                    color: AppColors.softWhite,
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Hitec City Metro → Gachibowli',
                  style: TextStyle(color: Colors.white70),
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

class DemoProfileScreen extends StatelessWidget {
  const DemoProfileScreen({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: AppColors.charcoal,
    appBar: AppBar(title: const Text('Account & Safety Profile')),
    body: ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppColors.slate,
            borderRadius: BorderRadius.circular(20),
          ),
          child: const Row(
            children: [
              CircleAvatar(
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
              SizedBox(width: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Shreya Sharma',
                    style: TextStyle(
                      color: AppColors.softWhite,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    '+91 98765 43210',
                    style: TextStyle(color: Colors.white60),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 28),
        const Text(
          'Safety Contacts',
          style: TextStyle(
            color: AppColors.softWhite,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        const ListTile(
          leading: Icon(Icons.shield_outlined, color: AppColors.herOrange),
          title: Text(
            'Priya Sharma',
            style: TextStyle(color: AppColors.softWhite),
          ),
          subtitle: Text(
            'Emergency contact',
            style: TextStyle(color: Colors.white60),
          ),
        ),
        const Divider(color: Colors.white12),
        const ListTile(
          leading: Icon(Icons.phone_outlined, color: AppColors.herOrange),
          title: Text(
            '+91 98765 43210',
            style: TextStyle(color: AppColors.softWhite),
          ),
          subtitle: Text(
            'Demo profile — changes are not saved',
            style: TextStyle(color: Colors.white60),
          ),
        ),
      ],
    ),
  );
}
