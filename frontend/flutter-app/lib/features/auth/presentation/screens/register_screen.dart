import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../../../core/localization/app_localizations.dart';
import '../../../../core/routing/routes.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/auth_providers.dart';
import '../providers/auth_state.dart';
import '../../../../shared/widgets/custom_text_field.dart';
import '../../../../shared/widgets/loading_overlay.dart';
import '../../../../shared/widgets/error_dialog.dart';
import '../../../../core/exceptions/app_exceptions.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _phoneController = TextEditingController();
  
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  String _selectedRole = 'CUSTOMER';
  bool _acceptTerms = false;
  
  // Field-specific error messages from API
  Map<String, String> _fieldErrors = {};
  Map<String, String> _fieldHints = {};
  
  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }
  
  Future<void> _handleRegister() async {
    // Clear previous field errors
    setState(() {
      _fieldErrors.clear();
      _fieldHints.clear();
    });
    
    if (!_formKey.currentState!.validate()) return;
    
    if (!_acceptTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Please accept the terms and conditions'),
          backgroundColor: Theme.of(context).colorScheme.error,
        ),
      );
      return;
    }
    
    final authNotifier = ref.read(authStateProvider.notifier);
    
    try {
      await authNotifier.register(
        email: _emailController.text.trim(),
        password: _passwordController.text,
        firstName: _firstNameController.text.trim(),
        lastName: _lastNameController.text.trim(),
        role: _selectedRole,
        phoneNumber: _phoneController.text.trim().isEmpty 
            ? null 
            : _phoneController.text.trim(),
      );
      
      // Check the current state after registration attempt
      final authState = ref.read(authStateProvider);
      
      if (authState is AuthAuthenticated) {
        // Force navigation after successful registration
        if (mounted) {
          SuccessSnackbar.show(
            context,
            message: 'Registration successful! Welcome to Pika!',
          );
          context.go(AppRoutes.home);
        }
      } else if (authState is AuthError) {
        // Enhanced error handling with field-specific errors
        if (mounted) {
          _handleRegistrationError(authState.error);
        }
      }
    } catch (e) {
      if (mounted) {
        _handleRegistrationError(e);
      }
    }
  }
  
  /// Clear field error for a specific field when user starts typing
  void _clearFieldError(String fieldName) {
    if (_fieldErrors.containsKey(fieldName)) {
      setState(() {
        _fieldErrors.remove(fieldName);
        _fieldHints.remove(fieldName);
      });
    }
  }
  
  /// Handle registration errors with enhanced field-specific error display
  void _handleRegistrationError(dynamic error) {
    // Check if this is a validation error with field-specific information
    if (error is ValidationExceptionWithFields) {
      setState(() {
        _fieldErrors = error.getAllFieldErrors();
        // Get hints from the API error if available
        if (error.apiError != null) {
          _fieldHints = {};
          _fieldErrors.keys.forEach((field) {
            final hint = error.apiError.getFieldHint(field);
            if (hint != null) {
              _fieldHints[field] = hint;
            }
          });
        }
      });
      
      // Rebuild the form to show field errors
      _formKey.currentState?.validate();
      
      // Show a general error message
      ErrorSnackbar.show(
        context,
        message: error.hasFieldErrors 
            ? 'Please correct the errors below'
            : error.message,
        duration: const Duration(seconds: 6),
      );
    } else {
      // Fallback to general error handling
      ErrorSnackbar.showFromException(context, error);
    }
  }
  
  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final authState = ref.watch(authStateProvider);
    final isLoading = ref.watch(isLoadingProvider);
    final theme = Theme.of(context);
    
    return LoadingOverlay(
      isLoading: isLoading,
      child: Scaffold(
        body: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 32),
                  
                  // Logo
                  Hero(
                    tag: 'app_logo',
                    child: Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: theme.colorScheme.primary,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Icon(
                        Icons.home_repair_service,
                        size: 40,
                        color: Colors.white,
                      ),
                    ),
                  ).animate().scale(duration: 600.ms, curve: Curves.easeOutBack),
                  
                  const SizedBox(height: 32),
                  
                  // Title
                  Text(
                    l10n.register,
                    style: theme.textTheme.displaySmall,
                    textAlign: TextAlign.center,
                  ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.3, end: 0),
                  
                  const SizedBox(height: 8),
                  
                  Text(
                    'Join the Pika community',
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                    textAlign: TextAlign.center,
                  ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.3, end: 0),
                  
                  const SizedBox(height: 32),
                  
                  // Role selection
                  Text(
                    'I want to:',
                    style: theme.textTheme.titleMedium,
                  ).animate().fadeIn(delay: 400.ms),
                  
                  const SizedBox(height: 12),
                  
                  Row(
                    children: [
                      Expanded(
                        child: RadioListTile<String>(
                          value: 'CUSTOMER',
                          groupValue: _selectedRole,
                          onChanged: (value) {
                            setState(() {
                              _selectedRole = value!;
                            });
                          },
                          title: Text(
                            'Find Services',
                            style: theme.textTheme.bodyMedium,
                          ),
                          subtitle: Text(
                            'Book services from providers',
                            style: theme.textTheme.bodySmall,
                          ),
                          contentPadding: EdgeInsets.zero,
                        ),
                      ),
                      Expanded(
                        child: RadioListTile<String>(
                          value: 'PROVIDER',
                          groupValue: _selectedRole,
                          onChanged: (value) {
                            setState(() {
                              _selectedRole = value!;
                            });
                          },
                          title: Text(
                            'Offer Services',
                            style: theme.textTheme.bodyMedium,
                          ),
                          subtitle: Text(
                            'Provide services to customers',
                            style: theme.textTheme.bodySmall,
                          ),
                          contentPadding: EdgeInsets.zero,
                        ),
                      ),
                    ],
                  ).animate().fadeIn(delay: 450.ms),
                  
                  const SizedBox(height: 24),
                  
                  // First name field
                  CustomTextField(
                    controller: _firstNameController,
                    label: l10n.firstName,
                    hint: 'Enter your first name',
                    textInputAction: TextInputAction.next,
                    prefixIcon: const Icon(Icons.person_outline),
                    onChanged: (_) => _clearFieldError('first_name'),
                    validator: (value) {
                      // Check for API field error first
                      if (_fieldErrors.containsKey('first_name')) {
                        return _fieldErrors['first_name'];
                      }
                      
                      if (value == null || value.isEmpty) {
                        return l10n.fieldRequired;
                      }
                      if (value.length < 2) {
                        return 'First name must be at least 2 characters';
                      }
                      return null;
                    },
                  ).animate().fadeIn(delay: 500.ms).slideX(begin: -0.2, end: 0),
                  
                  const SizedBox(height: 16),
                  
                  // Last name field
                  CustomTextField(
                    controller: _lastNameController,
                    label: l10n.lastName,
                    hint: 'Enter your last name',
                    textInputAction: TextInputAction.next,
                    prefixIcon: const Icon(Icons.person_outline),
                    onChanged: (_) => _clearFieldError('last_name'),
                    validator: (value) {
                      // Check for API field error first
                      if (_fieldErrors.containsKey('last_name')) {
                        return _fieldErrors['last_name'];
                      }
                      
                      if (value == null || value.isEmpty) {
                        return l10n.fieldRequired;
                      }
                      if (value.length < 2) {
                        return 'Last name must be at least 2 characters';
                      }
                      return null;
                    },
                  ).animate().fadeIn(delay: 550.ms).slideX(begin: -0.2, end: 0),
                  
                  const SizedBox(height: 16),
                  
                  // Email field
                  CustomTextField(
                    controller: _emailController,
                    label: l10n.email,
                    hint: 'email@example.com',
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                    prefixIcon: const Icon(Icons.email_outlined),
                    onChanged: (_) => _clearFieldError('email'),
                    validator: (value) {
                      // Check for API field error first
                      if (_fieldErrors.containsKey('email')) {
                        return _fieldErrors['email'];
                      }
                      
                      if (value == null || value.isEmpty) {
                        return l10n.fieldRequired;
                      }
                      if (!value.contains('@')) {
                        return l10n.invalidEmail;
                      }
                      return null;
                    },
                  ).animate().fadeIn(delay: 600.ms).slideX(begin: -0.2, end: 0),
                  
                  const SizedBox(height: 16),
                  
                  // Phone field (optional)
                  CustomTextField(
                    controller: _phoneController,
                    label: 'Phone Number (Optional)',
                    hint: '+1234567890',
                    keyboardType: TextInputType.phone,
                    textInputAction: TextInputAction.next,
                    prefixIcon: const Icon(Icons.phone_outlined),
                    onChanged: (_) => _clearFieldError('phone_number'),
                    validator: (value) {
                      // Check for API field error first
                      if (_fieldErrors.containsKey('phone_number')) {
                        return _fieldErrors['phone_number'];
                      }
                      
                      if (value != null && value.isNotEmpty && value.length < 10) {
                        return 'Please enter a valid phone number';
                      }
                      return null;
                    },
                  ).animate().fadeIn(delay: 650.ms).slideX(begin: -0.2, end: 0),
                  
                  const SizedBox(height: 16),
                  
                  // Password field
                  CustomTextField(
                    controller: _passwordController,
                    label: l10n.password,
                    hint: '••••••••',
                    obscureText: _obscurePassword,
                    textInputAction: TextInputAction.next,
                    prefixIcon: const Icon(Icons.lock_outline),
                    onChanged: (_) => _clearFieldError('password'),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword
                            ? Icons.visibility_outlined
                            : Icons.visibility_off_outlined,
                      ),
                      onPressed: () {
                        setState(() {
                          _obscurePassword = !_obscurePassword;
                        });
                      },
                    ),
                    validator: (value) {
                      // Check for API field error first
                      if (_fieldErrors.containsKey('password')) {
                        return _fieldErrors['password'];
                      }
                      
                      if (value == null || value.isEmpty) {
                        return l10n.fieldRequired;
                      }
                      if (value.length < 8) {
                        return l10n.passwordTooShort;
                      }
                      return null;
                    },
                  ).animate().fadeIn(delay: 700.ms).slideX(begin: -0.2, end: 0),
                  
                  const SizedBox(height: 16),
                  
                  // Confirm password field
                  CustomTextField(
                    controller: _confirmPasswordController,
                    label: 'Confirm Password',
                    hint: '••••••••',
                    obscureText: _obscureConfirmPassword,
                    textInputAction: TextInputAction.done,
                    onFieldSubmitted: (_) => _handleRegister(),
                    onChanged: (_) => _clearFieldError('confirm_password'),
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscureConfirmPassword
                            ? Icons.visibility_outlined
                            : Icons.visibility_off_outlined,
                      ),
                      onPressed: () {
                        setState(() {
                          _obscureConfirmPassword = !_obscureConfirmPassword;
                        });
                      },
                    ),
                    validator: (value) {
                      // Check for API field error first
                      if (_fieldErrors.containsKey('confirm_password')) {
                        return _fieldErrors['confirm_password'];
                      }
                      
                      if (value == null || value.isEmpty) {
                        return l10n.fieldRequired;
                      }
                      if (value != _passwordController.text) {
                        return 'Passwords do not match';
                      }
                      return null;
                    },
                  ).animate().fadeIn(delay: 750.ms).slideX(begin: -0.2, end: 0),
                  
                  const SizedBox(height: 24),
                  
                  // Terms and conditions
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Checkbox(
                        value: _acceptTerms,
                        onChanged: (value) {
                          setState(() {
                            _acceptTerms = value ?? false;
                          });
                        },
                      ),
                      Expanded(
                        child: GestureDetector(
                          onTap: () {
                            setState(() {
                              _acceptTerms = !_acceptTerms;
                            });
                          },
                          child: Text.rich(
                            TextSpan(
                              text: 'I agree to the ',
                              style: theme.textTheme.bodyMedium,
                              children: [
                                TextSpan(
                                  text: 'Terms of Service',
                                  style: TextStyle(
                                    color: theme.colorScheme.primary,
                                    decoration: TextDecoration.underline,
                                  ),
                                ),
                                const TextSpan(text: ' and '),
                                TextSpan(
                                  text: 'Privacy Policy',
                                  style: TextStyle(
                                    color: theme.colorScheme.primary,
                                    decoration: TextDecoration.underline,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ).animate().fadeIn(delay: 800.ms),
                  
                  const SizedBox(height: 32),
                  
                  // Register button
                  FilledButton(
                    onPressed: isLoading ? null : _handleRegister,
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: Text(
                      l10n.register,
                      style: const TextStyle(fontSize: 16),
                    ),
                  ).animate().fadeIn(delay: 850.ms).slideY(begin: 0.2, end: 0),
                  
                  const SizedBox(height: 32),
                  
                  // Sign in link
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        l10n.alreadyHaveAccount,
                        style: theme.textTheme.bodyMedium,
                      ),
                      TextButton(
                        onPressed: () {
                          context.pop();
                        },
                        child: Text(l10n.login),
                      ),
                    ],
                  ).animate().fadeIn(delay: 900.ms),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}