import 'package:cloud_firestore/cloud_firestore.dart';

class RideModel {
  final String id;
  final String riderId;
  final String riderName;
  final String riderPhone;
  final String pickupAddress;
  final String dropoffAddress;
  final double pickupLat;
  final double pickupLng;
  final double dropoffLat;
  final double dropoffLng;
  final double fare;
  final String status; // requested, accepted, in_transit, completed, cancelled
  final String otp;
  final String? driverId;
  final String? driverName;
  final String? driverPhone;
  final String? vehicleNumber;
  final DateTime createdAt;

  RideModel({
    required this.id,
    required this.riderId,
    required this.riderName,
    required this.riderPhone,
    required this.pickupAddress,
    required this.dropoffAddress,
    required this.pickupLat,
    required this.pickupLng,
    required this.dropoffLat,
    required this.dropoffLng,
    required this.fare,
    this.status = 'requested',
    required this.otp,
    this.driverId,
    this.driverName,
    this.driverPhone,
    this.vehicleNumber,
    required this.createdAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'riderId': riderId,
      'riderName': riderName,
      'riderPhone': riderPhone,
      'pickupAddress': pickupAddress,
      'dropoffAddress': dropoffAddress,
      'pickupLat': pickupLat,
      'pickupLng': pickupLng,
      'dropoffLat': dropoffLat,
      'dropoffLng': dropoffLng,
      'fare': fare,
      'status': status,
      'otp': otp,
      'driverId': driverId,
      'driverName': driverName,
      'driverPhone': driverPhone,
      'vehicleNumber': vehicleNumber,
      'createdAt': Timestamp.fromDate(createdAt),
    };
  }

  factory RideModel.fromMap(Map<String, dynamic> map, String docId) {
    return RideModel(
      id: docId,
      riderId: map['riderId'] ?? '',
      riderName: map['riderName'] ?? 'Rider',
      riderPhone: map['riderPhone'] ?? '',
      pickupAddress: map['pickupAddress'] ?? '',
      dropoffAddress: map['dropoffAddress'] ?? '',
      pickupLat: (map['pickupLat'] as num?)?.toDouble() ?? 0.0,
      pickupLng: (map['pickupLng'] as num?)?.toDouble() ?? 0.0,
      dropoffLat: (map['dropoffLat'] as num?)?.toDouble() ?? 0.0,
      dropoffLng: (map['dropoffLng'] as num?)?.toDouble() ?? 0.0,
      fare: (map['fare'] as num?)?.toDouble() ?? 0.0,
      status: map['status'] ?? 'requested',
      otp: map['otp'] ?? '1234',
      driverId: map['driverId'],
      driverName: map['driverName'],
      driverPhone: map['driverPhone'],
      vehicleNumber: map['vehicleNumber'],
      createdAt: (map['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
    );
  }
}