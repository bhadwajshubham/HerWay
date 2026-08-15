import 'dart:math';

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
import 'route_service.dart';

class MapScreen extends ConsumerStatefulWidget {
  final String pickupAddress;
  final String dropoffAddress;
  final double pickupLat;
  final double pickupLng;
  final double dropoffLat;
  final double dropoffLng;

  const MapScreen({
    super.key,
    required this.pickupAddress,
    required this.dropoffAddress,
    required this.pickupLat,
    required this.pickupLng,
    required this.dropoffLat,
    required this.dropoffLng,
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
  final _routeService = RouteService();
  GoogleMapController? _mapController;
  List<LatLng> _routePoints = const [];
  double? _routeDistanceKm;
  double? _routeDurationMinutes;

  CameraPosition get _initialPosition => CameraPosition(
    target: LatLng(widget.pickupLat, widget.pickupLng),
    zoom: 15.0,
  );

  @override
  void initState() {
    super.initState();
    _loadRoute();
  }

  Future<void> _loadRoute() async {
    try {
      final route = await _routeService.getRoute(
        pickupLat: widget.pickupLat,
        pickupLng: widget.pickupLng,
        dropoffLat: widget.dropoffLat,
        dropoffLng: widget.dropoffLng,
      );
      if (!mounted || route == null) return;
      setState(() {
        _routeDistanceKm = route.distanceKm;
        _routeDurationMinutes = route.durationMinutes;
        _routePoints = route.points
            .map((point) => LatLng(point.latitude, point.longitude))
            .toList();
      });
      _fitMapToTrip();
    } catch (_) {
      // The straight-line estimate remains available when Directions is
      // unavailable or the key is not enabled for the current platform.
    }
  }

  void _onMapCreated(GoogleMapController controller) {
    _mapController = controller;
    _fitMapToTrip();
  }

  void _fitMapToTrip() {
    final controller = _mapController;
    if (controller == null || !mounted) return;
    final points = [
      LatLng(widget.pickupLat, widget.pickupLng),
      LatLng(widget.dropoffLat, widget.dropoffLng),
      ..._routePoints,
    ];
    final latitudes = points.map((point) => point.latitude);
    final longitudes = points.map((point) => point.longitude);
    final bounds = LatLngBounds(
      southwest: LatLng(latitudes.reduce(min), longitudes.reduce(min)),
      northeast: LatLng(latitudes.reduce(max), longitudes.reduce(max)),
    );
    try {
      controller.animateCamera(CameraUpdate.newLatLngBounds(bounds, 72));
    } catch (_) {
      // The map may not have completed its first layout yet.
    }
  }

  double _distanceKm() {
    if (_routeDistanceKm != null) return _routeDistanceKm!;
    return Geolocator.distanceBetween(
          widget.pickupLat,
          widget.pickupLng,
          widget.dropoffLat,
          widget.dropoffLng,
        ) /
        1000;
  }

  double _estimatedDurationMinutes(double distanceKm) {
    if (_routeDurationMinutes != null) return _routeDurationMinutes!;
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

    if (user == null) {
      setState(() => _isBooking = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please sign in before booking a ride.')),
      );
      return;
    }

    try {
      final riderId = user.uid;
      final userService = ref.read(userServiceProvider);
      final userProfile = await userService.getUserProfile(user.uid);
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
        otp: (Random.secure().nextInt(10000)).toString().padLeft(4, '0'),
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
    
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: Stack(
        children: [
          GoogleMap(
            initialCameraPosition: _initialPosition,
            onMapCreated: _onMapCreated,
            zoomControlsEnabled: false,
            myLocationButtonEnabled: false,
            mapToolbarEnabled: false,
            markers: {
              Marker(
                markerId: const MarkerId('pickup'),
                position: LatLng(widget.pickupLat, widget.pickupLng),
                infoWindow: InfoWindow(title: widget.pickupAddress),
                icon: BitmapDescriptor.defaultMarkerWithHue(
                  BitmapDescriptor.hueGreen,
                ),
              ),
              Marker(
                markerId: const MarkerId('dropoff'),
                position: LatLng(widget.dropoffLat, widget.dropoffLng),
                infoWindow: InfoWindow(title: widget.dropoffAddress),
                icon: BitmapDescriptor.defaultMarkerWithHue(
                  BitmapDescriptor.hueOrange,
                ),
              ),
            },
            polylines: _routePoints.length > 1
                ? {
                    Polyline(
                      polylineId: const PolylineId('trip-route'),
                      points: _routePoints,
                      color: theme.colorScheme.primary,
                      width: 5,
                    ),
                  }
                : {
                    Polyline(
                      polylineId: const PolylineId('trip-estimate'),
                      points: [
                        LatLng(widget.pickupLat, widget.pickupLng),
                        LatLng(widget.dropoffLat, widget.dropoffLng),
                      ],
                      color: theme.colorScheme.primary.withAlpha(180),
                      width: 4,
                      patterns: const [PatternItem.dash(16), PatternItem.gap(8)],
                    ),
                  },
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
                        color: theme.colorScheme.surface,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(color: theme.shadowColor.withAlpha(50), blurRadius: 8),
                        ],
                      ),
                      child: Icon(
                        Icons.arrow_back_ios_new,
                        color: theme.colorScheme.onSurface,
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
                      color: theme.colorScheme.surface,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: theme.colorScheme.primary.withAlpha(100),
                      ),
                    ),
                    child: Text(
                      'HerWay SafeRide',
                      style: TextStyle(
                        color: theme.colorScheme.onSurface,
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
                      context,
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
                            color: theme.scaffoldBackgroundColor,
                            child: Center(
                              child: CircularProgressIndicator(
                                color: theme.colorScheme.primary,
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

  Widget _buildConfirmationSheet(
    BuildContext context, {
    required double distanceKm,
    required double estimatedMinutes,
    required double grossFare,
    required double discount,
    required double finalFare,
  }) {
    final theme = Theme.of(context);
    
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(30),
          topRight: Radius.circular(30),
        ),
        boxShadow: [
          BoxShadow(
            color: theme.shadowColor.withAlpha(50),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: theme.colorScheme.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: theme.colorScheme.primary.withAlpha(100),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.directions_car,
                  color: theme.colorScheme.primary,
                  size: 36,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'HerWay Premium',
                        style: TextStyle(
                          color: theme.colorScheme.onSurface,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${distanceKm.toStringAsFixed(1)} km trip • ${estimatedMinutes.toStringAsFixed(0)} min ETA',
                        style: TextStyle(
                          color: theme.colorScheme.onSurface.withAlpha(180),
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                Text(
                  '₹${finalFare.toStringAsFixed(0)}',
                  style: TextStyle(
                    color: theme.colorScheme.onSurface,
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
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            decoration: BoxDecoration(
              color: theme.colorScheme.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: theme.colorScheme.onSurface.withAlpha(20),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Payable now',
                  style: TextStyle(
                    color: theme.colorScheme.onSurface.withAlpha(180),
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  '₹${finalFare.toStringAsFixed(0)}',
                  style: TextStyle(
                    color: theme.colorScheme.primary,
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: _isBooking ? null : _confirmAndDispatchRide,
              style: theme.elevatedButtonTheme.style,
              child: _isBooking
                  ? CircularProgressIndicator(color: theme.colorScheme.onPrimary)
                  : Text(
                      'CONFIRM & BOOK RIDE',
                      style: TextStyle(
                        color: theme.colorScheme.onPrimary,
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
              onPressed: () async {
                try {
                  await ref
                      .read(rideServiceProvider)
                      .updateRideStatus(ride.id, 'cancelled');
                  if (mounted) setState(() => _activeRideId = null);
                } catch (e) {
                  if (!mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Unable to cancel ride: $e'),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
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
