import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../theme/app_theme.dart';
import '../../models/ride_model.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../profile/user_service.dart';
import '../ride/ride_service.dart';

class DriverScreen extends ConsumerStatefulWidget {
  const DriverScreen({super.key});

  @override
  ConsumerState<DriverScreen> createState() => _DriverScreenState();
}

class _DriverScreenState extends ConsumerState<DriverScreen> {
  bool _isOnline = true;
  final Set<String> _acceptingRideIds = {};

  @override
  Widget build(BuildContext context) {
    final rideService = ref.watch(rideServiceProvider);

    return Scaffold(
      backgroundColor: AppColors.charcoal,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text(
          'HerWay Driver Partner',
          style: TextStyle(
            color: AppColors.softWhite,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        actions: [
          Row(
            children: [
              Text(
                _isOnline ? 'ONLINE' : 'OFFLINE',
                style: TextStyle(
                  color: _isOnline ? Colors.greenAccent : Colors.redAccent,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
              Switch(
                value: _isOnline,
                activeThumbColor: AppColors.herOrange,
                onChanged: (val) {
                  setState(() => _isOnline = val);
                },
              ),
              const SizedBox(width: 8),
            ],
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Online Driver Stats Card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.slate,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: _isOnline ? Colors.greenAccent.withAlpha((0.3 * 255).round()) : Colors.white10,
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text(
                          'Today\'s Earnings',
                          style: TextStyle(color: Colors.white54, fontSize: 12),
                        ),
                        SizedBox(height: 6),
                        Text(
                          '₹1,840.00',
                          style: TextStyle(
                            color: AppColors.softWhite,
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: const [
                        Text(
                          'Rides Completed',
                          style: TextStyle(color: Colors.white54, fontSize: 12),
                        ),
                        SizedBox(height: 6),
                        Text(
                          '7 Rides',
                          style: TextStyle(
                            color: AppColors.herOrange,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),
              
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Nearby Ride Dispatches',
                    style: TextStyle(
                      color: AppColors.softWhite,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (_isOnline)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.herOrange.withAlpha((0.15 * 255).round()),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: const [
                          Icon(Icons.sensors, color: AppColors.herOrange, size: 14),
                          SizedBox(width: 4),
                          Text(
                            'Live Stream',
                            style: TextStyle(color: AppColors.herOrange, fontSize: 11, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 16),

              // Real-time Rides Stream
              Expanded(
                child: !_isOnline
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: const [
                            Icon(Icons.power_settings_new, color: Colors.white24, size: 60),
                            SizedBox(height: 16),
                            Text(
                              'You are currently offline.',
                              style: TextStyle(color: Colors.white54, fontSize: 16),
                            ),
                            SizedBox(height: 4),
                            Text(
                              'Toggle online at top right to start receiving rides.',
                              style: TextStyle(color: Colors.white30, fontSize: 12),
                            ),
                          ],
                        ),
                      )
                    : StreamBuilder<RideModel?>(
                        stream: FirebaseAuth.instance.currentUser != null
                            ? rideService.streamActiveRideForDriver(FirebaseAuth.instance.currentUser!.uid)
                            : Stream.value(null),
                        builder: (context, activeRideSnapshot) {
                          if (activeRideSnapshot.connectionState == ConnectionState.waiting) {
                            return const Center(child: CircularProgressIndicator(color: AppColors.herOrange));
                          }
                          
                          final activeRide = activeRideSnapshot.data;
                          
                          if (activeRide != null) {
                            return _buildActiveRideCard(activeRide);
                          }

                          return StreamBuilder<List<RideModel>>(
                            stream: rideService.streamPendingRides(),
                            builder: (context, snapshot) {
                              if (snapshot.connectionState == ConnectionState.waiting) {
                                return const Center(
                                  child: CircularProgressIndicator(color: AppColors.herOrange),
                                );
                              }

                              final rides = snapshot.data ?? [];

                              if (rides.isEmpty) {
                                return Center(
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: const [
                                      Icon(Icons.radar, color: AppColors.herOrange, size: 50),
                                      SizedBox(height: 16),
                                      Text(
                                        'Scanning for ride requests...',
                                        style: TextStyle(color: Colors.white70, fontSize: 16),
                                      ),
                                      SizedBox(height: 6),
                                      Text(
                                        'New ride bookings in your city will appear here live.',
                                        style: TextStyle(color: Colors.white30, fontSize: 12),
                                      ),
                                    ],
                                  ),
                                );
                              }

                              return ListView.builder(
                                itemCount: rides.length,
                                itemBuilder: (context, index) {
                                  final ride = rides[index];
                                  return _buildRideRequestCard(ride);
                                },
                              );
                            },
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRideRequestCard(RideModel ride) {
    final rideService = ref.read(rideServiceProvider);
    final isAccepting = _acceptingRideIds.contains(ride.id);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.slate,
        borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.herOrange.withAlpha((0.4 * 255).round())),
        boxShadow: const [
          BoxShadow(
            color: Colors.black38,
            blurRadius: 8,
            offset: Offset(0, 4),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.person_pin, color: AppColors.herOrange, size: 22),
                  const SizedBox(width: 8),
                  Text(
                    ride.riderName,
                    style: const TextStyle(
                      color: AppColors.softWhite,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              Text(
                '₹${ride.fare.toStringAsFixed(0)}',
                style: const TextStyle(
                  color: AppColors.herOrange,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const Divider(color: Colors.white10, height: 24),
          Row(
            children: [
              const Icon(Icons.circle, color: Colors.greenAccent, size: 12),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  ride.pickupAddress,
                  style: const TextStyle(color: Colors.white70, fontSize: 13),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              const Icon(Icons.location_on, color: AppColors.herOrange, size: 14),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  ride.dropoffAddress,
                  style: const TextStyle(color: Colors.white70, fontSize: 13),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
                onPressed: isAccepting
                    ? null
                    : () async {
                setState(() => _acceptingRideIds.add(ride.id));
                try {
                  final currentUser = FirebaseAuth.instance.currentUser;
                  if (currentUser == null) {
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Please sign in to accept rides.'),
                          backgroundColor: Colors.red,
                        ),
                      );
                    }
                    return;
                  }

                  final userService = ref.read(userServiceProvider);
                  final driverProfile =
                      await userService.getUserProfile(currentUser.uid);

                  await rideService.acceptRide(
                    rideId: ride.id,
                    driverId: currentUser.uid,
                    driverName: driverProfile?.name ??
                        currentUser.displayName ??
                        'Driver',
                    driverPhone:
                        driverProfile?.phone ?? currentUser.phoneNumber ?? '',
                    vehicleNumber: 'TS 09 AB 1234',
                  );

                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text(
                          'Ride Accepted! Routing to pickup location...',
                        ),
                        backgroundColor: Colors.green,
                      ),
                    );
                  }
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Failed to accept ride: $e'),
                        backgroundColor: Colors.red,
                      ),
                    );
                  }
                } finally {
                  if (mounted) {
                    setState(() => _acceptingRideIds.remove(ride.id));
                  }
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.herOrange,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: Text(
                isAccepting ? 'ACCEPTING...' : 'ACCEPT RIDE DISPATCH',
                style: TextStyle(
                  color: AppColors.charcoal,
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActiveRideCard(RideModel ride) {
    final rideService = ref.read(rideServiceProvider);
    final isAccepted = ride.status == 'accepted';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.slate,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.greenAccent.withAlpha(100), width: 2),
        boxShadow: const [
          BoxShadow(
            color: Colors.black38,
            blurRadius: 8,
            offset: Offset(0, 4),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                isAccepted ? 'RIDER WAITING' : 'TRIP IN PROGRESS',
                style: const TextStyle(
                  color: Colors.greenAccent,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.2,
                ),
              ),
              if (isAccepted)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.herOrange.withAlpha(40),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'OTP: ${ride.otp}',
                    style: const TextStyle(color: AppColors.herOrange, fontWeight: FontWeight.bold),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.person_pin, color: AppColors.softWhite, size: 22),
                  const SizedBox(width: 8),
                  Text(
                    ride.riderName,
                    style: const TextStyle(
                      color: AppColors.softWhite,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              Text(
                '₹${ride.fare.toStringAsFixed(0)}',
                style: const TextStyle(
                  color: AppColors.softWhite,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const Divider(color: Colors.white10, height: 24),
          Row(
            children: [
              const Icon(Icons.circle, color: Colors.greenAccent, size: 12),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  ride.pickupAddress,
                  style: const TextStyle(color: Colors.white70, fontSize: 13),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              const Icon(Icons.location_on, color: AppColors.herOrange, size: 14),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  ride.dropoffAddress,
                  style: const TextStyle(color: Colors.white70, fontSize: 13),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: () async {
                try {
                  if (isAccepted) {
                    await rideService.updateRideStatus(ride.id, 'in_transit');
                  } else {
                    await rideService.updateRideStatus(ride.id, 'completed');
                  }
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
                    );
                  }
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: isAccepted ? AppColors.herOrange : Colors.greenAccent,
                foregroundColor: AppColors.charcoal,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: Text(
                isAccepted ? 'START RIDE' : 'COMPLETE RIDE',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}