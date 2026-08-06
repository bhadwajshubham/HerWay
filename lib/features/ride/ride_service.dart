import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/ride_model.dart';

final rideServiceProvider = Provider<RideService>((ref) {
  return RideService(FirebaseFirestore.instance);
});

class RideService {
  final FirebaseFirestore _firestore;

  RideService(this._firestore);

  /// Create a new Ride Request in Firestore
  Future<String> createRideRequest(RideModel ride) async {
    try {
      final docRef = _firestore.collection('rides').doc();
      final newRide = RideModel(
        id: docRef.id,
        riderId: ride.riderId,
        riderName: ride.riderName,
        riderPhone: ride.riderPhone,
        pickupAddress: ride.pickupAddress,
        dropoffAddress: ride.dropoffAddress,
        pickupLat: ride.pickupLat,
        pickupLng: ride.pickupLng,
        dropoffLat: ride.dropoffLat,
        dropoffLng: ride.dropoffLng,
        fare: ride.fare,
        status: 'requested',
        otp: ride.otp,
        createdAt: DateTime.now(),
      );

      await docRef.set(newRide.toMap());
      return docRef.id;
    } catch (e) {
      rethrow;
    }
  }

  /// Stream a single ride by ID for real-time tracking
  Stream<RideModel?> streamRideStatus(String rideId) {
    return _firestore.collection('rides').doc(rideId).snapshots().map((snapshot) {
      if (snapshot.exists && snapshot.data() != null) {
        return RideModel.fromMap(snapshot.data()!, snapshot.id);
      }
      return null;
    });
  }

  /// Stream pending ride requests for Drivers
  Stream<List<RideModel>> streamPendingRides() {
    return _firestore
        .collection('rides')
        .where('status', isEqualTo: 'requested')
        .snapshots()
        .map((snapshot) {
      return snapshot.docs.map((doc) => RideModel.fromMap(doc.data(), doc.id)).toList();
    });
  }

  /// Stream ride history for a given rider (ordered from newest)
  Stream<List<RideModel>> streamRidesForUser(String uid) {
    return _firestore
        .collection('rides')
        .where('riderId', isEqualTo: uid)
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs.map((d) => RideModel.fromMap(d.data(), d.id)).toList());
  }

  /// Accept Ride (Driver Side)
  Future<void> acceptRide({
    required String rideId,
    required String driverId,
    required String driverName,
    required String driverPhone,
    required String vehicleNumber,
  }) async {
    await _firestore.collection('rides').doc(rideId).update({
      'status': 'accepted',
      'driverId': driverId,
      'driverName': driverName,
      'driverPhone': driverPhone,
      'vehicleNumber': vehicleNumber,
    });
  }

  /// Update Ride Status (in_transit, completed, cancelled)
  Future<void> updateRideStatus(String rideId, String status) async {
    await _firestore.collection('rides').doc(rideId).update({'status': status});
  }
}