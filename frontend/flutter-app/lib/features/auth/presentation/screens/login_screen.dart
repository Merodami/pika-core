import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../../../core/localization/app_localizations.dart';
import '../../../../core/routing/routes.dart';
import '../../../../core/exceptions/api_error.dart';
import '../providers/auth_providers.dart';
import '../providers/auth_state.dart';
import '../../../../shared/widgets/custom_text_field.dart';
import '../../../../shared/widgets/loading_overlay.dart';
import '../../../../shared/widgets/error_dialog.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  
  bool _obscurePassword = true;
  bool _rememberMe = false;
  
  // Field-specific error messages from API
  String? _emailError;
  String? _passwordError;
  
  @override
  void initState() {
    super.initState();
    // Add listeners to clear field errors when user types
    _emailController.addListener(_clearEmailError);
    _passwordController.addListener(_clearPasswordError);
  }
  
  @override
  void dispose() {
    _emailController.removeListener(_clearEmailError);
    _passwordController.removeListener(_clearPasswordError);
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
  
  void _clearEmailError() {
    if (_emailError != null) {
      setState(() {
        _emailError = null;
      });
    }
  }
  
  void _clearPasswordError() {
    if (_passwordError != null) {
      setState(() {
        _passwordError = null;
      });
    }
  }
  
  void _clearAllFieldErrors() {
    setState(() {
      _emailError = null;
      _passwordError = null;
    });
  }
  
  Future<void> _handleLogin() async {
    // Clear any existing field errors before validation
    _clearAllFieldErrors();
    
    if (!_formKey.currentState!.validate()) return;
    
    final authNotifier = ref.read(authStateProvider.notifier);
    
    try {
      await authNotifier.login(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );
      
      // Check the current state after login attempt
      final authState = ref.read(authStateProvider);
      
      if (authState is AuthAuthenticated) {
        // Force navigation after successful login
        if (mounted) {
          context.go(AppRoutes.home);
        }
      } else if (authState is AuthError) {
        // Handle field-specific errors from ApiError
        if (mounted) {
          _handleAuthError(authState.error);
        }
      }
    } catch (e) {
      if (mounted) {
        _handleAuthError(e);
      }
    }
  }
  
  void _handleAuthError(dynamic error) {
    if (error is ApiError && error.isValidationError) {
      // Handle field-specific errors
      setState(() {
        _emailError = error.getFieldError('email');
        _passwordError = error.getFieldError('password');
      });
      
      // Re-validate form to show field errors
      _formKey.currentState?.validate();
      
      // Show general error message if no field-specific errors
      if (_emailError == null && _passwordError == null) {
        ErrorSnackbar.show(context, message: error.message);
      }
    } else {
      // Show general error for non-field errors
      ErrorSnackbar.showFromException(context, error);
    }
  }
  
  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
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
                  const SizedBox(height: 48),
                  
                  // Logo
                  Hero(
                    tag: 'app_logo',
                    child: Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        color: theme.colorScheme.primary,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Icon(
                        Icons.home_repair_service,
                        size: 50,
                        color: Colors.white,
                      ),
                    ),
                  ).animate().scale(duration: 600.ms, curve: Curves.easeOutBack),
                  
                  const SizedBox(height: 48),
                  
                  // Title
                  Text(
                    l10n.login,
                    style: theme.textTheme.displaySmall,
                    textAlign: TextAlign.center,
                  ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.3, end: 0),
                  
                  const SizedBox(height: 8),
                  
                  Text(
                    l10n.welcome,
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                    textAlign: TextAlign.center,
                  ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.3, end: 0),
                  
                  const SizedBox(height: 48),
                  
                  
                  // Email field
                  CustomTextField(
                    controller: _emailController,
                    label: l10n.email,
                    hint: 'email@example.com',
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                    prefixIcon: const Icon(Icons.email_outlined),
                    validator: (value) {
                      // Check for API field error first
                      if (_emailError != null) {
                        return _emailError;
                      }
                      
                      // Then check basic validation
                      if (value == null || value.isEmpty) {
                        return l10n.fieldRequired;
                      }
                      if (!value.contains('@')) {
                        return l10n.invalidEmail;
                      }
                      return null;
                    },
                  ).animate().fadeIn(delay: 400.ms).slideX(begin: -0.2, end: 0),
                  
                  const SizedBox(height: 16),
                  
                  // Password field
                  CustomTextField(
                    controller: _passwordController,
                    label: l10n.password,
                    hint: '••••••••',
                    obscureText: _obscurePassword,
                    textInputAction: TextInputAction.done,
                    onFieldSubmitted: (_) => _handleLogin(),
                    prefixIcon: const Icon(Icons.lock_outline),
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
                      if (_passwordError != null) {
                        return _passwordError;
                      }
                      
                      // Then check basic validation
                      if (value == null || value.isEmpty) {
                        return l10n.fieldRequired;
                      }
                      if (value.length < 6) {
                        return l10n.passwordTooShort;
                      }
                      return null;
                    },
                  ).animate().fadeIn(delay: 500.ms).slideX(begin: -0.2, end: 0),
                  
                  const SizedBox(height: 16),
                  
                  // Remember me & Forgot password
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Checkbox(
                            value: _rememberMe,
                            onChanged: (value) {
                              setState(() {
                                _rememberMe = value ?? false;
                              });
                            },
                          ),
                          Text(l10n.rememberMe ?? 'Remember me'),
                        ],
                      ),
                      TextButton(
                        onPressed: () {
                          context.push(AppRoutes.forgotPassword);
                        },
                        child: Text(l10n.forgotPassword),
                      ),
                    ],
                  ).animate().fadeIn(delay: 600.ms),
                  
                  const SizedBox(height: 32),
                  
                  // Login button
                  FilledButton(
                    onPressed: isLoading ? null : _handleLogin,
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: Text(
                      l10n.login,
                      style: const TextStyle(fontSize: 16),
                    ),
                  ).animate().fadeIn(delay: 700.ms).slideY(begin: 0.2, end: 0),
                  
                  const SizedBox(height: 24),
                  
                  // Divider
                  Row(
                    children: [
                      const Expanded(child: Divider()),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Text(
                          l10n.or ?? 'OR',
                          style: theme.textTheme.bodySmall,
                        ),
                      ),
                      const Expanded(child: Divider()),
                    ],
                  ).animate().fadeIn(delay: 800.ms),
                  
                  const SizedBox(height: 24),
                  
                  // Social login buttons
                  OutlinedButton.icon(
                    onPressed: isLoading ? null : () async {
                      final authNotifier = ref.read(authStateProvider.notifier);
                      try {
                        await authNotifier.signInWithGoogle();
                        
                        // Check the current state after login attempt
                        final authState = ref.read(authStateProvider);
                        
                        if (authState is AuthAuthenticated) {
                          // Force navigation after successful login
                          if (mounted) {
                            context.go(AppRoutes.home);
                          }
                        } else if (authState is AuthError) {
                          // Handle auth error
                          if (mounted) {
                            _handleAuthError(authState.error);
                          }
                        }
                      } catch (e) {
                        if (mounted) {
                          _handleAuthError(e);
                        }
                      }
                    },
                    icon: Image.asset(
                      'assets/icons/google.png',
                      width: 24,
                      height: 24,
                      errorBuilder: (context, error, stackTrace) => const Icon(
                        Icons.g_mobiledata,
                        size: 24,
                      ),
                    ),
                    label: const Text('Continue with Google'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ).animate().fadeIn(delay: 900.ms).slideY(begin: 0.2, end: 0),
                  
                  const SizedBox(height: 16),
                  
                  // Facebook login button
                  OutlinedButton.icon(
                    onPressed: isLoading ? null : () async {
                      final authNotifier = ref.read(authStateProvider.notifier);
                      try {
                        await authNotifier.signInWithFacebook();
                        
                        // Check the current state after login attempt
                        final authState = ref.read(authStateProvider);
                        
                        if (authState is AuthAuthenticated) {
                          // Force navigation after successful login
                          if (mounted) {
                            context.go(AppRoutes.home);
                          }
                        } else if (authState is AuthError) {
                          // Handle auth error
                          if (mounted) {
                            _handleAuthError(authState.error);
                          }
                        }
                      } catch (e) {
                        if (mounted) {
                          _handleAuthError(e);
                        }
                      }
                    },
                    icon: Icon(
                      Icons.facebook,
                      color: Colors.blue[700],
                      size: 24,
                    ),
                    label: const Text('Continue with Facebook'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ).animate().fadeIn(delay: 950.ms).slideY(begin: 0.2, end: 0),
                  
                  const SizedBox(height: 32),
                  
                  // Sign up link
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        l10n.dontHaveAccount,
                        style: theme.textTheme.bodyMedium,
                      ),
                      TextButton(
                        onPressed: () {
                          context.push(AppRoutes.register);
                        },
                        child: Text(l10n.register),
                      ),
                    ],
                  ).animate().fadeIn(delay: 1000.ms),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}