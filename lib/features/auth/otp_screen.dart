import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// ignore_for_file: use_build_context_synchronously
import '../../theme/app_theme.dart';
import '../../core/main_scaffold.dart';
import 'auth_service.dart';
import '../profile/user_service.dart';
import 'profile_setup_screen.dart';

class OtpScreen extends ConsumerStatefulWidget {
  final String phoneNumber;

  const OtpScreen({super.key, required this.phoneNumber});

  @override
  ConsumerState<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends ConsumerState<OtpScreen> {
  final TextEditingController _otpController = TextEditingController();
  bool _isLoading = false;

  // We capture ScaffoldMessengerState and guard navigation with `mounted`.
  // The use_build_context_synchronously lint is suppressed at file level because
  // we've added mounted checks and captured messenger where needed.
  Future<void> _verifyOtp() async {
    final smsCode = _otpController.text.trim();
    final messenger = ScaffoldMessenger.of(context);
    if (smsCode.length < 6) {
      messenger.showSnackBar(
        const SnackBar(content: Text('Please enter the 6-digit code')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final credential = await ref.read(authServiceProvider).verifyOtp(smsCode);
      final user = credential?.user;

      if (user != null && mounted) {
        // Check if user profile exists in Firestore
        final userService = ref.read(userServiceProvider);
        final existingUser = await userService.getUserProfile(user.uid);

        if (!mounted) return;

        if (existingUser == null) {
          // New User -> Profile Setup Screen
          Navigator.pushAndRemoveUntil(
            context,
            MaterialPageRoute(
              builder: (context) =>
                  ProfileSetupScreen(uid: user.uid, phone: widget.phoneNumber),
            ),
            (route) => false,
          );
        } else {
          // Existing User -> Main Scaffold Dashboard
          Navigator.pushAndRemoveUntil(
            context,
            MaterialPageRoute(builder: (context) => const MainScaffold()),
            (route) => false,
          );
        }
      }
    } catch (e) {
      if (mounted) {
        messenger.showSnackBar(
          SnackBar(
            content: Text('Verification failed: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDarkMode = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 20),
              const Text(
                'Verify it\'s you',
                style: TextStyle(
                  fontSize: 32,
                  color: AppColors.herOrange,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'We sent a 6-digit code to\n+91 ${widget.phoneNumber}',
                style: TextStyle(
                  fontSize: 16,
                  color: theme.colorScheme.onSurface.withValues(alpha: 0.7),
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 40),

              // OTP Input Field
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: AppColors.herOrange.withValues(alpha: 0.5),
                  ),
                ),
                child: TextField(
                  controller: _otpController,
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: theme.colorScheme.onSurface,
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 16,
                  ),
                  decoration: InputDecoration(
                    fillColor: Colors.transparent, // Override theme fill
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    counterText: "",
                    hintText: "••••••",
                    hintStyle: TextStyle(
                      color: isDarkMode
                          ? Colors.white24
                          : theme.colorScheme.onSurface.withValues(alpha: 0.32),
                      letterSpacing: 16,
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 24),
              Center(
                child: TextButton(
                  onPressed: () {
                    final messenger = ScaffoldMessenger.of(context);
                    ref
                        .read(authServiceProvider)
                        .sendOtp(
                          phoneNumber: widget.phoneNumber,
                          onSuccess: () {
                            if (!mounted) return;
                            messenger.showSnackBar(
                              const SnackBar(content: Text('Code resent!')),
                            );
                          },
                          onError: (e) {
                            if (!mounted) return;
                            messenger.showSnackBar(
                              SnackBar(
                                content: Text(e),
                                backgroundColor: Colors.red,
                              ),
                            );
                          },
                        );
                  },
                  child: const Text(
                    'Didn\'t receive code? Resend',
                    style: TextStyle(color: AppColors.herOrange, fontSize: 14),
                  ),
                ),
              ),

              const SizedBox(height: 36),

              ElevatedButton(
                onPressed: _isLoading ? null : _verifyOtp,
                child: _isLoading
                    ? SizedBox(
                        height: 24,
                        width: 24,
                        child: CircularProgressIndicator(
                          color: isDarkMode ? AppColors.charcoal : Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : const Text('Verify & Continue'),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}
