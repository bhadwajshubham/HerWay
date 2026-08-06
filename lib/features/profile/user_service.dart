import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/user_model.dart';

final userServiceProvider = Provider<UserService>((ref) {
  return UserService(FirebaseFirestore.instance);
});

class UserService {
  final FirebaseFirestore _firestore;

  UserService(this._firestore);

  // Fetch a user profile once
  Future<UserModel?> getUserProfile(String uid) async {
    try {
      final doc = await _firestore.collection('users').doc(uid).get();
      if (doc.exists && doc.data() != null) {
        return UserModel.fromMap(doc.data()!, doc.id);
      }
      return null;
    } catch (e) {
      throw Exception('Failed to fetch user profile: $e');
    }
  }

  // Save a new user to Firestore
  Future<void> createUserProfile(UserModel user) async {
    try {
      await _firestore.collection('users').doc(user.uid).set(user.toMap());
    } catch (e) {
      throw Exception('Failed to create user profile: $e');
    }
  }

  // Live stream of the user profile for reactive UI updates
  Stream<UserModel?> streamUserProfile(String uid) {
    return _firestore.collection('users').doc(uid).snapshots().map((doc) {
      if (doc.exists && doc.data() != null) {
        return UserModel.fromMap(doc.data()!, doc.id);
      }
      return null;
    });
  }
}