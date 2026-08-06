import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../../theme/app_theme.dart';
import 'otp_screen.dart';
import 'auth_service.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final TextEditingController _phoneController = TextEditingController();
  bool _isLoading = false;

  void _verifyPhone() {
    final phone = _phoneController.text.trim();
    if (phone.isEmpty || phone.length < 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid 10-digit number')),
      );
      return;
    }

    setState(() => _isLoading = true);

    ref.read(authServiceProvider).sendOtp(
      phoneNumber: phone,
      onSuccess: () {
        if (mounted) {
          setState(() => _isLoading = false);
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => OtpScreen(phoneNumber: phone),
            ),
          );
        }
      },
      onError: (error) {
        if (mounted) {
          setState(() => _isLoading = false);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                error.contains('operation-not-allowed')
                    ? 'Please enable +91 in Firebase Console or add test number'
                    : error,
              ),
              backgroundColor: Colors.redAccent,
              duration: const Duration(seconds: 5),
            ),
          );
        }
      },
    );
  }

  void _handleSocialLogin(String provider) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('$provider login triggered. Phone verification required next.')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDarkMode = ref.watch(themeNotifierProvider) == ThemeMode.dark;

    return Scaffold(
      backgroundColor: isDarkMode ? AppColors.charcoal : AppColors.appleBackground,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 40),
              // Brand Header
              const Text(
                'HerWay.',
                style: TextStyle(
                  fontSize: 40,
                  color: AppColors.herOrange,
                  fontWeight: FontWeight.bold,
                  letterSpacing: -1.0,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Always Her Choice.\nHer Way.',
                style: TextStyle(
                  fontSize: 24,
                  color: isDarkMode ? AppColors.softWhite : AppColors.appleTextPrimary,
                  height: 1.2,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 40),
              
              // Phone Input
              Text(
                'Enter your mobile number',
                style: TextStyle(
                  color: isDarkMode ? Colors.white70 : AppColors.appleTextSecondary,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                decoration: BoxDecoration(
                  color: isDarkMode ? AppColors.slate : AppColors.appleCard,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isDarkMode ? Colors.white10 : AppColors.appleBorder,
                  ),
                ),
                child: Row(
                  children: [
                    Text(
                      '+91', 
                      style: TextStyle(
                        color: isDarkMode ? AppColors.softWhite : AppColors.appleTextPrimary,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Container(
                      width: 1, 
                      height: 24, 
                      color: isDarkMode ? Colors.white24 : AppColors.appleBorder,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        style: TextStyle(
                          color: isDarkMode ? AppColors.softWhite : AppColors.appleTextPrimary,
                          fontSize: 16,
                        ),
                        decoration: InputDecoration(
                          border: InputBorder.none,
                          hintText: '99999 99999',
                          hintStyle: TextStyle(
                            color: isDarkMode ? Colors.white30 : AppColors.appleTextSecondary,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              
              // Continue Button
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _verifyPhone,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.herOrange,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    disabledBackgroundColor: AppColors.herOrange.withAlpha((0.5 * 255).round()),
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          height: 24,
                          width: 24,
                          child: CircularProgressIndicator(
                            color: AppColors.charcoal,
                            strokeWidth: 2,
                          ),
                        )
                      : const Text(
                          'Continue',
                          style: TextStyle(
                            color: AppColors.charcoal,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ),
              
              const SizedBox(height: 32),
              
              // Divider
              Row(
                children: [
                  Expanded(
                    child: Container(
                      height: 1, 
                      color: isDarkMode ? Colors.white10 : AppColors.appleBorder,
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                    child: Text(
                      'OR',
                      style: TextStyle(
                        color: isDarkMode ? Colors.white54 : AppColors.appleTextSecondary,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  Expanded(
                    child: Container(
                      height: 1, 
                      color: isDarkMode ? Colors.white10 : AppColors.appleBorder,
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 32),
              
              // Social Logins
              _buildSocialButton(
                isDarkMode: isDarkMode,
                icon: FaIcon(
                  FontAwesomeIcons.google,
                  color: isDarkMode ? AppColors.softWhite : AppColors.appleTextPrimary,
                  size: 20,
                ),
                label: 'Continue with Google',
                onPressed: () => _handleSocialLogin('Google'),
              ),
              const SizedBox(height: 16),
              _buildSocialButton(
                isDarkMode: isDarkMode,
                icon: FaIcon(
                  FontAwesomeIcons.apple,
                  color: isDarkMode ? AppColors.softWhite : AppColors.appleTextPrimary,
                  size: 20,
                ),
                label: 'Continue with Apple',
                onPressed: () => _handleSocialLogin('Apple'),
              ),

              const SizedBox(height: 40),
              
              Center(
                child: Text(
                  'By continuing, you agree to our Terms & Privacy Policy',
                  style: TextStyle(
                    color: isDarkMode ? Colors.white38 : AppColors.appleTextSecondary,
                    fontSize: 12,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSocialButton({
    required bool isDarkMode,
    required Widget icon,
    required String label,
    required VoidCallback onPressed,
  }) {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: OutlinedButton(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          side: BorderSide(
            color: isDarkMode ? Colors.white24 : AppColors.appleBorder,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          backgroundColor: isDarkMode ? AppColors.slate.withAlpha((0.5 * 255).round()) : AppColors.appleCard,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            icon,
            const SizedBox(width: 12),
            Text(
              label,
              style: TextStyle(
                color: isDarkMode ? AppColors.softWhite : AppColors.appleTextPrimary,
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}