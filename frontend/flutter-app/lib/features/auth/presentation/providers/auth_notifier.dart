import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;
import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';
import 'dart:io';

import 'auth_state.dart';
import '../../domain/usecases/login_usecase.dart';
import '../../domain/usecases/register_usecase.dart';
import '../../domain/usecases/logout_usecase.dart';
import '../../domain/usecases/get_current_user_usecase.dart';
import '../../domain/usecases/google_signin_usecase.dart';
import '../../domain/usecases/facebook_signin_usecase.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/entities/auth_tokens_entity.dart';
import '../../domain/repositories/auth_repository.dart';
import '../../domain/services/social_auth_service.dart';
import '../../../../core/exceptions/app_exceptions.dart';
import '../../../../core/utils/logger_utils.dart';
import 'package:dartz/dartz.dart';

/// Authentication State Notifier
/// Manages authentication state using clean architecture principles
class AuthNotifier extends StateNotifier<AuthState> {
  final LoginUseCase _loginUseCase;
  final RegisterUseCase _registerUseCase;
  final LogoutUseCase _logoutUseCase;
  final GetCurrentUserUseCase _getCurrentUserUseCase;
  final GoogleSignInUseCase _googleSignInUseCase;
  final FacebookSignInUseCase _facebookSignInUseCase;
  final AuthRepository _authRepository;

  // Firebase user stream subscription for real-time sync
  firebase_auth.User? _firebaseUser;
  final DeviceInfoPlugin _deviceInfo = DeviceInfoPlugin();
  late final firebase_auth.FirebaseAuth _firebaseAuth;
  final SocialAuthService _socialAuthService = SocialAuthService();

  AuthNotifier({
    required LoginUseCase loginUseCase,
    required RegisterUseCase registerUseCase,
    required LogoutUseCase logoutUseCase,
    required GetCurrentUserUseCase getCurrentUserUseCase,
    required GoogleSignInUseCase googleSignInUseCase,
    required FacebookSignInUseCase facebookSignInUseCase,
    required AuthRepository authRepository,
  })  : _loginUseCase = loginUseCase,
        _registerUseCase = registerUseCase,
        _logoutUseCase = logoutUseCase,
        _getCurrentUserUseCase = getCurrentUserUseCase,
        _googleSignInUseCase = googleSignInUseCase,
        _facebookSignInUseCase = facebookSignInUseCase,
        _authRepository = authRepository,
        super(const AuthInitial()) {
    _firebaseAuth = firebase_auth.FirebaseAuth.instance;
    _initializeAuth();
  }

  /// Initialize authentication state
  Future<void> _initializeAuth() async {
    // Check for stored tokens and validate current user
    final result = await _getCurrentUserUseCase();

    result.fold(
      (error) {
        // No valid session
        state = const AuthUnauthenticated();
      },
      (user) async {
        // Get access token from storage
        final tokens = await _authRepository.getStoredTokens();
        if (tokens != null) {
          state = AuthAuthenticated(
            user: user,
            accessToken: tokens.accessToken,
          );

          // Try to sync with Firebase (non-blocking)
          _syncFirebaseAuth(tokens.accessToken);
        } else {
          state = const AuthUnauthenticated();
        }
      },
    );

    // Listen to Firebase auth state changes for real-time features
    firebase_auth.FirebaseAuth.instance.authStateChanges().listen((user) {
      _firebaseUser = user;
      LoggerUtils.debug('Firebase auth state changed', data: {
        'hasUser': user != null,
        'uid': user?.uid,
        'isAnonymous': user?.isAnonymous,
      });
    });
  }

  /// Login with email and password
  Future<void> login({
    required String email,
    required String password,
  }) async {
    state = const AuthLoading();

    final result = await _loginUseCase(
      email: email,
      password: password,
    );

    result.fold(
      (error) {
        state = AuthError(
          message: _getErrorMessage(error),
          error: error,
        );
      },
      (data) async {
        final (user, tokens) = data;
        
        state = AuthAuthenticated(
          user: user,
          accessToken: tokens.accessToken,
        );

        // Sync with Firebase (non-blocking)
        _syncFirebaseAuth(tokens.accessToken);
      },
    );
  }

  /// Register new user
  Future<void> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String role,
    String? phoneNumber,
  }) async {
    state = const AuthLoading();

    final result = await _registerUseCase(
      email: email,
      password: password,
      firstName: firstName,
      lastName: lastName,
      role: role,
      phoneNumber: phoneNumber,
    );

    result.fold(
      (error) {
        state = AuthError(
          message: _getErrorMessage(error),
          error: error,
        );
      },
      (data) async {
        final (user, tokens) = data;
        
        state = AuthAuthenticated(
          user: user,
          accessToken: tokens.accessToken,
        );

        // Sync with Firebase (non-blocking)
        _syncFirebaseAuth(tokens.accessToken);
      },
    );
  }

  /// Logout current user
  Future<void> logout() async {
    state = const AuthLoading();

    await _logoutUseCase();

    // Sign out from all social providers
    try {
      await _socialAuthService.signOutFromAll();
    } catch (e) {
      LoggerUtils.warning('Error signing out from social providers', data: {
        'error': e.toString(),
      });
    }

    // Always transition to unauthenticated state
    state = const AuthUnauthenticated(
      message: 'Successfully logged out',
    );
  }

  /// Refresh current user data
  Future<void> refreshUser() async {
    if (state is! AuthAuthenticated) return;

    final result = await _getCurrentUserUseCase();

    result.fold(
      (error) {
        // Session expired
        state = const AuthUnauthenticated(
          message: 'Session expired. Please login again.',
        );
      },
      (user) async {
        final tokens = await _authRepository.getStoredTokens();
        if (tokens != null) {
          state = AuthAuthenticated(
            user: user,
            accessToken: tokens.accessToken,
          );
        }
      },
    );
  }

  /// Update user profile
  Future<void> updateProfile({
    String? firstName,
    String? lastName,
    String? phoneNumber,
    String? avatarUrl,
  }) async {
    if (state is! AuthAuthenticated) return;

    final currentState = state as AuthAuthenticated;
    
    final result = await _authRepository.updateProfile(
      firstName: firstName,
      lastName: lastName,
      phoneNumber: phoneNumber,
      avatarUrl: avatarUrl,
    );

    result.fold(
      (error) {
        state = AuthError(
          message: _getErrorMessage(error),
          error: error,
        );
      },
      (updatedUser) {
        state = AuthAuthenticated(
          user: updatedUser,
          accessToken: currentState.accessToken,
        );
      },
    );
  }

  /// Clear error state
  void clearError() {
    if (state is AuthError) {
      state = const AuthUnauthenticated();
    }
  }

  /// Sign in with Google using extensible provider pattern
  Future<void> signInWithGoogle() async {
    await _signInWithSocialProvider('google', _googleSignInUseCase);
  }

  /// Sign in with Facebook using extensible provider pattern
  Future<void> signInWithFacebook() async {
    await _signInWithSocialProvider('facebook', _facebookSignInUseCase);
  }

  /// Generic method for social provider authentication
  /// This pattern allows easy addition of new providers (Apple, Twitter, etc.)
  Future<void> _signInWithSocialProvider(
    String providerName, 
    Future<Either<AppException, (UserEntity, AuthTokensEntity)>> Function({
      required String firebaseIdToken,
      required Map<String, dynamic> deviceInfo,
    }) useCase,
  ) async {
    state = const AuthLoading();

    try {
      // Step 1: Authenticate with social provider
      final authResult = await _socialAuthService.authenticateWith(providerName);
      
      if (!authResult.isSuccess) {
        if (authResult.isCancelled) {
          state = const AuthUnauthenticated();
          return;
        }
        
        state = AuthError(
          message: authResult.error ?? '$providerName sign-in failed',
          error: ServerException(authResult.error ?? 'Authentication failed'),
        );
        return;
      }

      if (authResult.firebaseIdToken == null) {
        state = AuthError(
          message: 'Failed to get authentication token',
          error: ServerException('No Firebase ID token received'),
        );
        return;
      }

      // Step 2: Get device information
      final deviceInfo = await _getDeviceInfo();

      // Step 3: Exchange Firebase token for JWT using the appropriate use case
      final result = await useCase(
        firebaseIdToken: authResult.firebaseIdToken!,
        deviceInfo: deviceInfo,
      );

      result.fold(
        (error) {
          LoggerUtils.warning('$providerName sign-in failed', data: {
            'error': error.toString(),
            'provider': providerName,
          });
          state = AuthError(
            message: _getErrorMessage(error),
            error: error,
          );
        },
        (data) {
          final (user, tokens) = data;
          
          LoggerUtils.info('$providerName sign-in successful', data: {
            'userId': user.id,
            'provider': providerName,
            'isNewUser': user.lastLoginAt == null,
            'metadata': authResult.metadata,
          });
          
          state = AuthAuthenticated(
            user: user,
            accessToken: tokens.accessToken,
          );

          // Sync with Firebase for real-time features (non-blocking)
          _syncFirebaseAuth(tokens.accessToken);
        },
      );
    } catch (e) {
      LoggerUtils.error('$providerName authentication error', error: e);
      state = AuthError(
        message: '$providerName sign-in failed. Please try again.',
        error: ServerException(e.toString()),
      );
    }
  }

  /// Sync with Firebase Authentication
  Future<void> _syncFirebaseAuth(String accessToken) async {
    try {
      final firebaseTokenResult = await _authRepository.getFirebaseToken();
      
      firebaseTokenResult.fold(
        (error) {
          // Log but don't fail - Firebase is optional for real-time features
          LoggerUtils.warning('Firebase token sync failed', data: {
            'error': error.toString(),
            'context': 'Firebase custom token for real-time features'
          });
        },
        (firebaseToken) async {
          try {
            await firebase_auth.FirebaseAuth.instance
                .signInWithCustomToken(firebaseToken);
          } catch (e) {
            LoggerUtils.warning('Firebase custom token sign-in failed', data: {
              'error': e.toString(),
              'context': 'Sign in with custom token for real-time features'
            });
          }
        },
      );
    } catch (e) {
      LoggerUtils.error('Firebase sync error', error: e);
    }
  }


  /// Get device information for authentication
  Future<Map<String, dynamic>> _getDeviceInfo() async {
    const uuid = Uuid();
    
    try {
      if (kIsWeb) {
        // For web, generate a consistent UUID or use stored one
        return {
          'device_id': uuid.v4(),
          'device_name': 'Web Browser',
          'device_type': 'web',
        };
      } else if (Platform.isAndroid) {
        final androidInfo = await _deviceInfo.androidInfo;
        // Android device ID might not be UUID format, so generate one if needed
        String deviceId = androidInfo.id;
        if (!_isValidUuid(deviceId)) {
          deviceId = uuid.v4();
        }
        return {
          'device_id': deviceId,
          'device_name': '${androidInfo.brand} ${androidInfo.model}',
          'device_type': 'android',
        };
      } else if (Platform.isIOS) {
        final iosInfo = await _deviceInfo.iosInfo;
        // iOS identifierForVendor is already UUID format, but generate if null
        String deviceId = iosInfo.identifierForVendor ?? uuid.v4();
        return {
          'device_id': deviceId,
          'device_name': '${iosInfo.name} ${iosInfo.model}',
          'device_type': 'ios',
        };
      } else {
        // Fallback for other platforms
        return {
          'device_id': uuid.v4(),
          'device_name': 'Unknown Device',
          'device_type': 'web',
        };
      }
    } catch (e) {
      // Return default info with UUID if device info fails
      return {
        'device_id': uuid.v4(),
        'device_name': 'Unknown Device',
        'device_type': 'web',
      };
    }
  }

  /// Check if a string is a valid UUID format
  bool _isValidUuid(String value) {
    final uuidRegex = RegExp(
      r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    );
    return uuidRegex.hasMatch(value);
  }

  /// Get user-friendly error message
  String _getErrorMessage(dynamic error) {
    if (error == null) return 'An unexpected error occurred';

    if (error is ValidationException) {
      return error.message;
    }

    if (error is UnauthorizedException) {
      return 'Invalid credentials. Please check your email and password.';
    }

    if (error is ConflictException) {
      return 'This email is already registered.';
    }

    if (error is NetworkException) {
      return 'Network error. Please check your connection.';
    }

    if (error is ServerException) {
      return 'Server error. Please try again later.';
    }

    return 'An error occurred. Please try again.';
  }

  @override
  void dispose() {
    super.dispose();
  }
}