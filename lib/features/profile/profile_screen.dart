import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../theme/app_theme.dart';
import '../../models/user_model.dart';
import 'user_service.dart';

final userProfileStreamProvider = StreamProvider.autoDispose<UserModel?>((ref) {
  final currentUser = FirebaseAuth.instance.currentUser;
  if (currentUser == null) return Stream.value(null);
  return ref.watch(userServiceProvider).streamUserProfile(currentUser.uid);
});

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _emailController;
  late TextEditingController _emergencyContactController;
  late TextEditingController _guardianNameController;

  bool _isEditing = false;
  bool _isSaving = false;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController();
    _emailController = TextEditingController();
    _emergencyContactController = TextEditingController();
    _guardianNameController = TextEditingController();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _emergencyContactController.dispose();
    _guardianNameController.dispose();
    super.dispose();
  }

  void _populateData(UserModel user) {
    if (!_isInitialized) {
      _nameController.text = user.name;
      _emailController.text = user.email ?? '';
      _emergencyContactController.text = user.emergencyContact;
      _guardianNameController.text = user.guardianName;
      _isInitialized = true;
    }
  }

  Future<void> _updateProfile(UserModel currentUserModel) async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);

    try {
      final updatedUser = UserModel(
        uid: currentUserModel.uid,
        name: _nameController.text.trim(),
        phone: currentUserModel.phone,
        email: _emailController.text.trim().isEmpty
            ? null
            : _emailController.text.trim(),
        emergencyContact: _emergencyContactController.text.trim(),
        guardianName: _guardianNameController.text.trim(),
        isDriver: currentUserModel.isDriver,
        isVerified: currentUserModel.isVerified,
        createdAt: currentUserModel.createdAt,
      );

      await ref.read(userServiceProvider).createUserProfile(updatedUser);

      if (mounted) {
        setState(() => _isEditing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Profile updated successfully'),
            backgroundColor: Color(0xFFFF6A00),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update profile: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(userProfileStreamProvider, (previous, next) {
      if (next is AsyncData && next.value != null) {
        _populateData(next.value!);
      }
    });

    final userAsync = ref.watch(userProfileStreamProvider);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.charcoal : AppColors.appleBackground,
      appBar: AppBar(
        title: const Text('Account & Safety Profile'),
        actions: [
          IconButton(
            icon: Icon(isDark ? Icons.light_mode : Icons.dark_mode),
            onPressed: () =>
                ref.read(themeNotifierProvider.notifier).toggleTheme(),
            tooltip: 'Toggle Theme',
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.redAccent),
            onPressed: () async {
              await FirebaseAuth.instance.signOut();
            },
            tooltip: 'Sign Out',
          ),
        ],
      ),
      body: userAsync.when(
        data: (user) {
          if (user == null) {
            return const Center(child: Text('No user profile found.'));
          }
          
          if (!_isInitialized) _populateData(user);

          return SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // User Badge Card
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.surface,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 30,
                          backgroundColor: AppColors.herOrange,
                          child: Text(
                            user.name.isNotEmpty
                                ? user.name[0].toUpperCase()
                                : 'U',
                            style: const TextStyle(
                              fontSize: 26,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    user.name,
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  if (user.isVerified) ...[
                                    const SizedBox(width: 6),
                                    const Icon(
                                      Icons.verified,
                                      color: Colors.blue,
                                      size: 18,
                                    ),
                                  ],
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                user.phone,
                                style: TextStyle(
                                  color: theme.colorScheme.onSurface.withValues(
                                    alpha: 0.6,
                                  ),
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 28),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Personal Info',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      TextButton.icon(
                        onPressed: () {
                          setState(() {
                            if (_isEditing) {
                              _isInitialized = false;
                              _populateData(user);
                            }
                            _isEditing = !_isEditing;
                          });
                        },
                        icon: Icon(
                          _isEditing ? Icons.close : Icons.edit,
                          size: 18,
                        ),
                        label: Text(_isEditing ? 'Cancel' : 'Edit'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  _buildField(
                    controller: _nameController,
                    label: 'Full Name',
                    enabled: _isEditing,
                    icon: Icons.person_outline,
                    validator: (v) =>
                        v!.isEmpty ? 'Name cannot be empty' : null,
                  ),
                  const SizedBox(height: 16),

                  _buildField(
                    controller: _emailController,
                    label: 'Email Address',
                    enabled: _isEditing,
                    icon: Icons.email_outlined,
                  ),
                  const SizedBox(height: 28),

                  const Text(
                    'Safety Contacts',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),

                  _buildField(
                    controller: _guardianNameController,
                    label: 'Guardian Name',
                    enabled: _isEditing,
                    icon: Icons.shield_outlined,
                    validator: (v) =>
                        v!.isEmpty ? 'Guardian name required' : null,
                  ),
                  const SizedBox(height: 16),

                  _buildField(
                    controller: _emergencyContactController,
                    label: 'Emergency Phone Number',
                    enabled: _isEditing,
                    icon: Icons.phone_outlined,
                    keyboardType: TextInputType.phone,
                    validator: (v) =>
                        v!.length < 10 ? 'Enter valid phone number' : null,
                  ),
                  const SizedBox(height: 32),

                  if (_isEditing)
                    ElevatedButton(
                      onPressed: _isSaving ? null : () => _updateProfile(user),
                      child: _isSaving
                          ? CircularProgressIndicator(color: theme.colorScheme.onPrimary)
                          : const Text('Save Profile'),
                    ),
                ],
              ),
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) =>
            Center(child: Text('Error loading profile: $err')),
      ),
    );
  }

  Widget _buildField({
    required TextEditingController controller,
    required String label,
    required bool enabled,
    required IconData icon,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      enabled: enabled,
      keyboardType: keyboardType,
      style: TextStyle(
        color: enabled ? null : Theme.of(context).colorScheme.onSurface.withAlpha(120),
      ),
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon),
        fillColor: enabled ? null : Theme.of(context).colorScheme.onSurface.withAlpha(10),
      ),
      validator: validator,
    );
  }
}
