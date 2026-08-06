import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:pointer_interceptor/pointer_interceptor.dart';

import '../../models/ride_model.dart';
import '../../theme/app_theme.dart';
import '../profile/user_service.dart';
import 'ride_service.dart';

class MapScreen extends ConsumerStatefulWidget {
  final String pickupAddress;
  final String dropoffAddress;
  final double pickupLat;
  final double pickupLng;
  final double dropoffLat;
  final double dropoffLng;

  const MapScreen({
    super.key,
    this.pickupAddress = 'Hitec City Metro Station, Hyderabad',
    this.dropoffAddress = 'Gachibowli DLF Cyber City, Hyderabad',
    this.pickupLat = 17.4435,
    this.pickupLng = 78.3772,
    this.dropoffLat = 17.4400,
    this.dropoffLng = 78.3489,
  });

  @override
  ConsumerState<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends ConsumerState<MapScreen> {
  static const double _baseFare = 45.0;
  static const double _perKmRate = 14.0;
  static const double _perMinuteRate = 1.25;
  static const double _minimumFare = 69.0;
  static const double _safetyFee = 8.0;
  static const double _averageSpeedKmh = 24.0;
  static const double _introDiscountPercent = 0.15;
  static const double _introDiscountCap = 40.0;

  bool _isBooking = false;
  String? _activeRideId;

  CameraPosition get _initialPosition => CameraPosition(
    target: LatLng(widget.pickupLat, widget.pickupLng),
    zoom: 15.0,
  );

  double _distanceKm() {
    return Geolocator.distanceBetween(
          widget.pickupLat,
          widget.pickupLng,
          widget.dropoffLat,
          widget.dropoffLng,
        ) /
        1000;
  }

  double _estimatedDurationMinutes(double distanceKm) {
    final minutes = (distanceKm / _averageSpeedKmh) * 60;
    return minutes < 5 ? 5 : minutes;
  }

  double _grossFare() {
    final distanceKm = _distanceKm();
    final durationMinutes = _estimatedDurationMinutes(distanceKm);
    return _baseFare +
        (distanceKm * _perKmRate) +
        (durationMinutes * _perMinuteRate) +
        _safetyFee;
  }

  double _introDiscountAmount(double grossFare) {
    final percentDiscount = grossFare * _introDiscountPercent;
    return percentDiscount > _introDiscountCap
        ? _introDiscountCap
        : percentDiscount;
  }

  double _estimatedFare() {
    final grossFare = _grossFare();
    final discountedFare = grossFare - _introDiscountAmount(grossFare);
    return discountedFare < _minimumFare ? _minimumFare : discountedFare;
  }

  Future<void> _confirmAndDispatchRide() async {
    setState(() => _isBooking = true);

    final rideService = ref.read(rideServiceProvider);
    final user = FirebaseAuth.instance.currentUser;

    try {
      final riderId = user?.uid ?? 'GUEST_USER';
      final userService = ref.read(userServiceProvider);
      final userProfile = user != null
          ? await userService.getUserProfile(user.uid)
          : null;
      final fare = _estimatedFare();

      final ride = RideModel(
        id: '',
        riderId: riderId,
        riderName: userProfile?.name ?? user?.displayName ?? 'Guest',
        riderPhone: userProfile?.phone ?? user?.phoneNumber ?? '',
        pickupAddress: widget.pickupAddress,
        dropoffAddress: widget.dropoffAddress,
        pickupLat: widget.pickupLat,
        pickupLng: widget.pickupLng,
        dropoffLat: widget.dropoffLat,
        dropoffLng: widget.dropoffLng,
        fare: fare,
        otp: '4821',
        createdAt: DateTime.now(),
      );

      final rideId = await rideService.createRideRequest(ride);
      if (!mounted) return;
      setState(() {
        _activeRideId = rideId;
        _isBooking = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _isBooking = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to book ride: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final rideService = ref.watch(rideServiceProvider);
    final distanceKm = _distanceKm();
    final estimatedMinutes = _estimatedDurationMinutes(distanceKm);
    final grossFare = _grossFare();
    final discount = _introDiscountAmount(grossFare);
    final finalFare = _estimatedFare();

    return Scaffold(
      backgroundColor: AppColors.charcoal,
      body: Stack(
        children: [
          GoogleMap(
            initialCameraPosition: _initialPosition,
            zoomControlsEnabled: false,
            myLocationButtonEnabled: false,
            mapToolbarEnabled: false,
          ),
          Positioned(
            top: 50,
            left: 20,
            right: 20,
            child: PointerInterceptor(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppColors.slate,
                        shape: BoxShape.circle,
                        boxShadow: const [
                          BoxShadow(color: Colors.black26, blurRadius: 8),
                        ],
                      ),
                      child: const Icon(
                        Icons.arrow_back_ios_new,
                        color: AppColors.softWhite,
                        size: 20,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.slate,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: AppColors.herOrange.withAlpha(
                          (0.3 * 255).round(),
                        ),
                      ),
                    ),
                    child: const Text(
                      'HerWay SafeRide',
                      style: TextStyle(
                        color: AppColors.softWhite,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 40),
                ],
              ),
            ),
          ),
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: PointerInterceptor(
              child: _activeRideId == null
                  ? _buildConfirmationSheet(
                      distanceKm: distanceKm,
                      estimatedMinutes: estimatedMinutes,
                      grossFare: grossFare,
                      discount: discount,
                      finalFare: finalFare,
                    )
                  : StreamBuilder<RideModel?>(
                      stream: rideService.streamRideStatus(_activeRideId!),
                      builder: (context, snapshot) {
                        final activeRide = snapshot.data;
                        if (activeRide == null) {
                          return Container(
                            padding: const EdgeInsets.all(24),
                            color: AppColors.charcoal,
                            child: const Center(
                              child: CircularProgressIndicator(
                                color: AppColors.herOrange,
                              ),
                            ),
                          );
                        }
                        return _buildActiveRideStatusSheet(activeRide);
                      },
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildConfirmationSheet({
    required double distanceKm,
    required double estimatedMinutes,
    required double grossFare,
    required double discount,
    required double finalFare,
  }) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        color: AppColors.charcoal,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(30),
          topRight: Radius.circular(30),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black54,
            blurRadius: 20,
            offset: Offset(0, -5),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.slate,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: AppColors.herOrange.withAlpha((0.3 * 255).round()),
              ),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.directions_car,
                  color: AppColors.herOrange,
                  size: 36,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'HerWay Premium',
                        style: TextStyle(
                          color: AppColors.softWhite,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${distanceKm.toStringAsFixed(1)} km trip • ${estimatedMinutes.toStringAsFixed(0)} min ETA',
                        style: TextStyle(
                          color: Colors.white.withAlpha((0.6 * 255).round()),
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                Text(
                  '₹${finalFare.toStringAsFixed(0)}',
                  style: const TextStyle(
                    color: AppColors.softWhite,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white.withAlpha((0.04 * 255).round()),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.white10),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _fareRow(
                  'Base + distance + time + safety fee',
                  '₹${grossFare.toStringAsFixed(0)}',
                ),
                const SizedBox(height: 8),
                _fareRow('Intro discount', '-₹${discount.toStringAsFixed(0)}'),
                const SizedBox(height: 8),
                const Divider(color: Colors.white12),
                const SizedBox(height: 8),
                _fareRow(
                  'Payable now',
                  '₹${finalFare.toStringAsFixed(0)}',
                  highlight: true,
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: Text(
                  widget.pickupAddress,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: Colors.white70, fontSize: 13),
                ),
              ),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 8),
                child: Icon(
                  Icons.arrow_forward_rounded,
                  color: Colors.white38,
                  size: 18,
                ),
              ),
              Expanded(
                child: Text(
                  widget.dropoffAddress,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.right,
                  style: const TextStyle(color: Colors.white70, fontSize: 13),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: const [
                  Icon(
                    Icons.account_balance_wallet,
                    color: AppColors.herOrange,
                    size: 20,
                  ),
                  SizedBox(width: 8),
                  Text(
                    'UPI Fast Pay',
                    style: TextStyle(color: Colors.white70, fontSize: 14),
                  ),
                ],
              ),
              TextButton(
                onPressed: () {},
                child: const Text(
                  'Change',
                  style: TextStyle(color: AppColors.herOrange),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: _isBooking ? null : _confirmAndDispatchRide,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.herOrange,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: _isBooking
                  ? const CircularProgressIndicator(color: AppColors.charcoal)
                  : const Text(
                      'CONFIRM & BOOK RIDE',
                      style: TextStyle(
                        color: AppColors.charcoal,
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

  Widget _fareRow(String label, String value, {bool highlight = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            color: highlight ? AppColors.softWhite : Colors.white70,
            fontSize: highlight ? 14 : 13,
            fontWeight: highlight ? FontWeight.w700 : FontWeight.w500,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            color: highlight ? AppColors.herOrange : Colors.white,
            fontSize: highlight ? 16 : 13,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }

  Widget _buildActiveRideStatusSheet(RideModel ride) {
    final bool isAccepted = ride.status == 'accepted';

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        color: AppColors.charcoal,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(30),
          topRight: Radius.circular(30),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isAccepted
                        ? 'Driver En Route'
                        : 'Searching for nearby driver...',
                    style: TextStyle(
                      color: isAccepted
                          ? Colors.greenAccent
                          : AppColors.herOrange,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    isAccepted
                        ? 'Digital Handshake OTP Required'
                        : 'Connecting to nearest verified HerWay partner',
                    style: const TextStyle(color: Colors.white54, fontSize: 12),
                  ),
                ],
              ),
              if (!isAccepted)
                const SizedBox(
                  height: 24,
                  width: 24,
                  child: CircularProgressIndicator(
                    color: AppColors.herOrange,
                    strokeWidth: 2,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 20),
          if (isAccepted) ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.slate,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: Colors.greenAccent.withAlpha((0.3 * 255).round()),
                ),
              ),
              child: Row(
                children: [
                  const CircleAvatar(
                    backgroundColor: AppColors.herOrange,
                    child: Icon(Icons.person, color: AppColors.charcoal),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          ride.driverName ?? 'Verified Driver',
                          style: const TextStyle(
                            color: AppColors.softWhite,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          ride.vehicleNumber ?? 'TS 09 AB 1234',
                          style: const TextStyle(
                            color: Colors.white60,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.herOrange.withAlpha((0.2 * 255).round()),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      'PIN: ${ride.otp}',
                      style: const TextStyle(
                        color: AppColors.herOrange,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],
          SizedBox(
            width: double.infinity,
            height: 50,
            child: OutlinedButton(
              onPressed: () {
                ref
                    .read(rideServiceProvider)
                    .updateRideStatus(ride.id, 'cancelled');
                setState(() => _activeRideId = null);
              },
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Colors.redAccent),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: const Text(
                'Cancel Request',
                style: TextStyle(color: Colors.redAccent),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
