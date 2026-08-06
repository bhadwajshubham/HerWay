import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../theme/app_theme.dart';
import '../../core/main_scaffold.dart';
import '../../models/user_model.dart';
import '../profile/user_service.dart';

class ProfileSetupScreen extends ConsumerStatefulWidget {
  final String? uid;
  final String? phone;

  const ProfileSetupScreen({super.key, this.uid, this.phone});

  @override
  ConsumerState<ProfileSetupScreen> createState() => _ProfileSetupScreenState();
}

class _ProfileSetupScreenState extends ConsumerState<ProfileSetupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _emergencyPhoneController = TextEditingController();
  final _guardianNameController = TextEditingController();

  bool _isLoading = false;

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final currentUser = FirebaseAuth.instance.currentUser;
      if (currentUser == null) throw Exception('No authenticated user found.');

      final userId = widget.uid ?? currentUser.uid;
      final profilePhone = widget.phone?.trim().isNotEmpty == true
          ? widget.phone!.trim()
          : currentUser.phoneNumber ?? '';

      final newUser = UserModel(
        uid: userId,
        name: _nameController.text.trim(),
        phone: profilePhone,
        email: _emailController.text.trim().isEmpty
            ? null
            : _emailController.text.trim(),
        emergencyContact: _emergencyPhoneController.text.trim(),
        guardianName: _guardianNameController.text.trim(),
        createdAt: DateTime.now(),
      );

      await ref.read(userServiceProvider).createUserProfile(newUser);

      if (mounted) {
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (context) => const MainScaffold()),
          (route) => false,
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
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
      backgroundColor: isDarkMode
          ? AppColors.charcoal
          : AppColors.appleBackground,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 40),
                const Text(
                  'Welcome to HerWay',
                  style: TextStyle(
                    fontSize: 32,
                    color: AppColors.herOrange,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Let\'s set up your safety profile.',
                  style: TextStyle(
                    fontSize: 16,
                    color: theme.colorScheme.onSurface.withValues(alpha: 0.7),
                  ),
                ),
                const SizedBox(height: 40),

                _buildInputField(
                  context: context,
                  controller: _nameController,
                  label: 'Full Name',
                  hint: 'Jane Doe',
                  icon: Icons.person_outline,
                  validator: (value) =>
                      value!.isEmpty ? 'Name is required' : null,
                ),
                const SizedBox(height: 20),

                _buildInputField(
                  context: context,
                  controller: _emailController,
                  label: 'Email (Optional)',
                  hint: 'jane@example.com',
                  icon: Icons.email_outlined,
                  keyboardType: TextInputType.emailAddress,
                ),
                const SizedBox(height: 40),

                Text(
                  'Emergency Contacts',
                  style: TextStyle(
                    fontSize: 18,
                    color: theme.colorScheme.onSurface,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 16),

                _buildInputField(
                  context: context,
                  controller: _guardianNameController,
                  label: 'Guardian Name',
                  hint: 'e.g., Mom, Brother, Simran, or Archi',
                  icon: Icons.shield_outlined,
                  validator: (value) =>
                      value!.isEmpty ? 'Guardian name is required' : null,
                ),
                const SizedBox(height: 20),

                _buildInputField(
                  context: context,
                  controller: _emergencyPhoneController,
                  label: 'Emergency Phone Number',
                  hint: '99999 99999',
                  icon: Icons.phone_outlined,
                  keyboardType: TextInputType.phone,
                  validator: (value) =>
                      value!.length < 10 ? 'Enter valid number' : null,
                ),
                const SizedBox(height: 48),

                ElevatedButton(
                  onPressed: _isLoading ? null : _saveProfile,
                  child: _isLoading
                      ? SizedBox(
                          height: 24,
                          width: 24,
                          child: CircularProgressIndicator(
                            color: isDarkMode
                                ? AppColors.charcoal
                                : Colors.white,
                          ),
                        )
                      : const Text('Complete Setup'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInputField({
    required BuildContext context,
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            color: theme.colorScheme.onSurface.withValues(alpha: 0.7),
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          decoration: InputDecoration(hintText: hint, prefixIcon: Icon(icon)),
          validator: validator,
        ),
      ],
    );
  }
}
