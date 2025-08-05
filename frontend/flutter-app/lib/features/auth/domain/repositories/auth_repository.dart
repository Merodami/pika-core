import 'package:dartz/dartz.dart';

import '../entities/user_entity.dart';
import '../entities/auth_tokens_entity.dart';
import '../../../../core/exceptions/app_exceptions.dart';

/// Authentication Repository Interface
/// Defines the contract for authentication operations
abstract class AuthRepository {
  /// Login with email and password
  /// Returns either an error or a tuple of user and tokens
  Future<Either<AppException, (UserEntity, AuthTokensEntity)>> login({
    required String email,
    required String password,
  });

  /// Register a new user
  /// Returns either an error or a tuple of user and tokens
  Future<Either<AppException, (UserEntity, AuthTokensEntity)>> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String role,
    String? phoneNumber,
  });

  /// Get the current authenticated user
  /// Returns either an error or the user entity
  Future<Either<AppException, UserEntity>> getCurrentUser();

  /// Refresh authentication tokens
  /// Returns either an error or new tokens
  Future<Either<AppException, AuthTokensEntity>> refreshTokens({
    required String refreshToken,
  });

  /// Update user profile
  /// Returns either an error or the updated user
  Future<Either<AppException, UserEntity>> updateProfile({
    String? firstName,
    String? lastName,
    String? phoneNumber,
    String? avatarUrl,
  });

  /// Logout the current user
  /// Returns either an error or success
  Future<Either<AppException, Unit>> logout();

  /// Request password reset
  /// Returns either an error or success
  Future<Either<AppException, Unit>> requestPasswordReset({
    required String email,
  });

  /// Get stored authentication tokens
  /// Returns null if no tokens are stored
  Future<AuthTokensEntity?> getStoredTokens();

  /// Save authentication tokens
  Future<void> saveTokens(AuthTokensEntity tokens);

  /// Clear stored authentication data
  Future<void> clearAuthData();

  /// Get Firebase custom token for real-time features
  /// Returns either an error or the custom token
  Future<Either<AppException, String>> getFirebaseToken();

  /// Save FCM token for push notifications
  Future<Either<AppException, Unit>> saveFCMToken({
    required String fcmToken,
  });

  /// Exchange Firebase ID token for JWT tokens
  /// Returns either an error or a tuple of user and tokens
  Future<Either<AppException, (UserEntity, AuthTokensEntity)>> exchangeFirebaseToken({
    required String firebaseIdToken,
    required String provider,
    required Map<String, dynamic> deviceInfo,
  });
}