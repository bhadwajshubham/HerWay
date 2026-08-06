import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:her_way/models/ride_model.dart';
import 'package:her_way/models/user_model.dart';

void main() {
  group('UserModel Tests', () {
    test('UserModel serializes to and from map correctly', () {
      final now = DateTime.now();
      final user = UserModel(
        uid: 'user_123',
        name: 'Shreya Sharma',
        phone: '9876543210',
        email: 'shreya@example.com',
        emergencyContact: '9876500000',
        guardianName: 'Priya Sharma',
        isDriver: false,
        isVerified: true,
        createdAt: now,
      );

      final map = user.toMap();
      expect(map['uid'], 'user_123');
      expect(map['name'], 'Shreya Sharma');
      expect(map['phone'], '9876543210');
      expect(map['email'], 'shreya@example.com');
      expect(map['isVerified'], true);

      final deserialized = UserModel.fromMap(
        {
          'name': 'Shreya Sharma',
          'phone': '9876543210',
          'email': 'shreya@example.com',
          'emergencyContact': '9876500000',
          'guardianName': 'Priya Sharma',
          'isDriver': false,
          'isVerified': true,
          'createdAt': Timestamp.fromDate(now),
        },
        'user_123',
      );

      expect(deserialized.uid, 'user_123');
      expect(deserialized.name, 'Shreya Sharma');
      expect(deserialized.guardianName, 'Priya Sharma');
    });
  });

  group('RideModel Tests', () {
    test('RideModel serializes to and from map correctly', () {
      final now = DateTime.now();
      final ride = RideModel(
        id: 'ride_99',
        riderId: 'user_123',
        riderName: 'Shreya Sharma',
        riderPhone: '9876543210',
        pickupAddress: 'Hitec City Metro Station',
        dropoffAddress: 'Gachibowli DLF Cyber City',
        pickupLat: 17.4435,
        pickupLng: 78.3772,
        dropoffLat: 17.4400,
        dropoffLng: 78.3489,
        fare: 112.0,
        status: 'requested',
        otp: '4821',
        createdAt: now,
      );

      final map = ride.toMap();
      expect(map['id'], 'ride_99');
      expect(map['fare'], 112.0);
      expect(map['otp'], '4821');
      expect(map['status'], 'requested');

      final deserialized = RideModel.fromMap(
        {
          'riderId': 'user_123',
          'riderName': 'Shreya Sharma',
          'riderPhone': '9876543210',
          'pickupAddress': 'Hitec City Metro Station',
          'dropoffAddress': 'Gachibowli DLF Cyber City',
          'pickupLat': 17.4435,
          'pickupLng': 78.3772,
          'dropoffLat': 17.4400,
          'dropoffLng': 78.3489,
          'fare': 112.0,
          'status': 'accepted',
          'otp': '4821',
          'driverName': 'Ananya S.',
          'vehicleNumber': 'TS 09 AB 1234',
          'createdAt': Timestamp.fromDate(now),
        },
        'ride_99',
      );

      expect(deserialized.id, 'ride_99');
      expect(deserialized.status, 'accepted');
      expect(deserialized.driverName, 'Ananya S.');
      expect(deserialized.vehicleNumber, 'TS 09 AB 1234');
    });
  });
}
