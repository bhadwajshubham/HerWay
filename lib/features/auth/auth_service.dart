import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// Riverpod Provider for AuthService
final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService(FirebaseAuth.instance);
});

class AuthService {
  final FirebaseAuth _firebaseAuth;
  
  String? _verificationId;
  ConfirmationResult? _webConfirmationResult;

  AuthService(this._firebaseAuth);

  /// Returns currently signed-in Firebase User
  User? get currentUser => _firebaseAuth.currentUser;

  /// Helper method for current user
  User? getCurrentUser() => _firebaseAuth.currentUser;

  /// Stream auth state changes
  Stream<User?> get authStateChanges => _firebaseAuth.authStateChanges();

  /// Sign Out User
  Future<void> signOut() async {
    await _firebaseAuth.signOut();
  }

  String _mapFirebaseErrorToMessage(String errorCode) {
    switch (errorCode) {
      case 'invalid-phone-number':
        return 'The phone number provided is invalid.';
      case 'too-many-requests':
        return 'Too many requests. Please try again later.';
      case 'operation-not-allowed':
        return 'Phone authentication is not enabled for this project.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /// Triggers the Firebase SMS sending process (Handles both Web & Native)
  Future<void> sendOtp({
    required String phoneNumber,
    required VoidCallback onSuccess,
    required Function(String) onError,
  }) async {
    final formattedPhone = '+91$phoneNumber';

    try {
      if (kIsWeb) {
        // Web Platform: Uses Invisible Recaptcha
        _webConfirmationResult = await _firebaseAuth.signInWithPhoneNumber(
          formattedPhone,
        );
        onSuccess();
      } else {
        // Mobile Platforms (Android/iOS)
        await _firebaseAuth.verifyPhoneNumber(
          phoneNumber: formattedPhone,
          verificationCompleted: (PhoneAuthCredential credential) async {
            await _firebaseAuth.signInWithCredential(credential);
            onSuccess();
          },
          verificationFailed: (FirebaseAuthException e) {
            onError(_mapFirebaseErrorToMessage(e.code));
          },
          codeSent: (String verificationId, int? resendToken) {
            _verificationId = verificationId;
            onSuccess();
          },
          codeAutoRetrievalTimeout: (String verificationId) {
            _verificationId = verificationId;
          },
        );
      }
    } catch (e) {
      onError('An unexpected error occurred. Please check your connection.');
    }
  }

  /// Verifies the OTP entered by the user
  Future<UserCredential?> verifyOtp(String smsCode) async {
    if (kIsWeb) {
      if (_webConfirmationResult == null) {
        throw Exception('Web confirmation result is null');
      }
      return await _webConfirmationResult!.confirm(smsCode);
    } else {
      if (_verificationId == null) {
        throw Exception('Verification ID is null');
      }
      PhoneAuthCredential credential = PhoneAuthProvider.credential(
        verificationId: _verificationId!,
        smsCode: smsCode,
      );
      return await _firebaseAuth.signInWithCredential(credential);
    }
  }
}