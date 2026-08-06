import 'package:cloud_firestore/cloud_firestore.dart';

class UserModel {
  final String uid;
  final String name;
  final String phone;
  final String? email;
  final String emergencyContact;
  final String guardianName;
  final bool isDriver;
  final bool isVerified;
  final DateTime createdAt;

  UserModel({
    required this.uid,
    required this.name,
    required this.phone,
    this.email,
    required this.emergencyContact,
    required this.guardianName,
    this.isDriver = false,
    this.isVerified = false,
    required this.createdAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'uid': uid,
      'name': name,
      'phone': phone,
      'email': email,
      'emergencyContact': emergencyContact,
      'guardianName': guardianName,
      'isDriver': isDriver,
      'isVerified': isVerified,
      'createdAt': Timestamp.fromDate(createdAt),
    };
  }

  factory UserModel.fromMap(Map<String, dynamic> map, String documentId) {
    return UserModel(
      uid: documentId,
      name: map['name'] ?? '',
      phone: map['phone'] ?? '',
      email: map['email'],
      emergencyContact: map['emergencyContact'] ?? '',
      guardianName: map['guardianName'] ?? '',
      isDriver: map['isDriver'] ?? false,
      isVerified: map['isVerified'] ?? false,
      createdAt: (map['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
    );
  }
}
