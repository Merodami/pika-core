import 'package:local_auth/local_auth.dart';
import 'package:flutter/services.dart';
import 'package:dartz/dartz.dart';
import '../domain/failures/failures.dart';
import '../domain/typedefs.dart';

/// Biometric authentication service using industry best practices
/// Provides secure biometric authentication with fallback mechanisms
class BiometricAuthService {
  BiometricAuthService() : _localAuth = LocalAuthentication();

  final LocalAuthentication _localAuth;

  /// Check if biometric authentication is available on the device
  FutureResult<BiometricCapability> checkBiometricCapability() async {
    try {
      final isAvailable = await _localAuth.canCheckBiometrics;
      final isDeviceSupported = await _localAuth.isDeviceSupported();
      
      if (!isDeviceSupported) {
        return const Right(BiometricCapability.notSupported);
      }
      
      if (!isAvailable) {
        return const Right(BiometricCapability.notAvailable);
      }

      final availableBiometrics = await _localAuth.getAvailableBiometrics();
      
      if (availableBiometrics.isEmpty) {
        return const Right(BiometricCapability.notEnrolled);
      }

      // Determine the strongest available biometric method
      if (availableBiometrics.contains(BiometricType.face)) {
        return const Right(BiometricCapability.faceId);
      } else if (availableBiometrics.contains(BiometricType.fingerprint)) {
        return const Right(BiometricCapability.fingerprint);
      } else if (availableBiometrics.contains(BiometricType.iris)) {
        return const Right(BiometricCapability.iris);
      } else {
        return const Right(BiometricCapability.weak);
      }
    } catch (e) {
      return Left(Failure.unexpected(
        message: 'Failed to check biometric capability: ${e.toString()}',
        exception: e,
      ));
    }
  }

  /// Authenticate user using biometrics
  /// Returns true if authentication was successful
  FutureResult<bool> authenticateWithBiometrics({
    String? localizedFallbackTitle,
    bool biometricOnly = false,
    bool stickyAuth = true,
  }) async {
    try {
      final capability = await checkBiometricCapability();
      
      return capability.fold(
        (failure) => Left(failure),
        (biometricCapability) async {
          if (biometricCapability == BiometricCapability.notSupported ||
              biometricCapability == BiometricCapability.notAvailable) {
            return Left(Failure.authentication(
              message: 'Biometric authentication is not available on this device',
              code: 'BIOMETRIC_NOT_AVAILABLE',
            ));
          }

          if (biometricCapability == BiometricCapability.notEnrolled) {
            return Left(Failure.authentication(
              message: 'No biometric credentials are enrolled on this device',
              code: 'BIOMETRIC_NOT_ENROLLED',
            ));
          }

          final isAuthenticated = await _localAuth.authenticate(
            localizedReason: _getLocalizedReason(biometricCapability),
            options: _getAuthMessages(),
          );

          return Right(isAuthenticated);
        },
      );
    } on PlatformException catch (e) {
      return Left(_handlePlatformException(e));
    } catch (e) {
      return Left(Failure.unexpected(
        message: 'Biometric authentication failed: ${e.toString()}',
        exception: e,
      ));
    }
  }

  /// Stop ongoing authentication (if any)
  Future<void> stopAuthentication() async {
    try {
      await _localAuth.stopAuthentication();
    } catch (e) {
      // Ignore errors when stopping authentication
    }
  }

  /// Check if the user has recently authenticated (within the last 5 minutes)
  /// This can be used to avoid repeated biometric prompts
  bool hasRecentAuthentication() {
    final lastAuthTime = _getLastAuthenticationTime();
    if (lastAuthTime == null) return false;
    
    final now = DateTime.now();
    const validDuration = Duration(minutes: 5);
    
    return now.difference(lastAuthTime) < validDuration;
  }

  /// Record successful authentication timestamp
  void recordSuccessfulAuthentication() {
    _setLastAuthenticationTime(DateTime.now());
  }

  /// Clear authentication timestamp (e.g., on app logout)
  void clearAuthenticationRecord() {
    _clearLastAuthenticationTime();
  }

  /// Get localized reason based on biometric capability
  String _getLocalizedReason(BiometricCapability capability) {
    switch (capability) {
      case BiometricCapability.faceId:
        return 'Use Face ID to authenticate and access your account securely';
      case BiometricCapability.fingerprint:
        return 'Use your fingerprint to authenticate and access your account securely';
      case BiometricCapability.iris:
        return 'Use iris recognition to authenticate and access your account securely';
      case BiometricCapability.weak:
        return 'Use biometric authentication to access your account securely';
      default:
        return 'Authenticate to access your account securely';
    }
  }

  /// Get platform-specific authentication messages
  AuthenticationOptions _getAuthMessages() {
    return const AuthenticationOptions(
      biometricOnly: false,
      sensitiveTransaction: true,
      stickyAuth: true,
    );
  }

  /// Handle platform-specific exceptions
  Failure _handlePlatformException(PlatformException e) {
    switch (e.code) {
      case 'NotAvailable':
        return const Failure.authentication(
          message: 'Biometric authentication is not available on this device',
          code: 'BIOMETRIC_NOT_AVAILABLE',
        );
      case 'NotEnrolled':
        return const Failure.authentication(
          message: 'No biometric credentials are enrolled',
          code: 'BIOMETRIC_NOT_ENROLLED',
        );
      case 'LockedOut':
        return const Failure.authentication(
          message: 'Too many failed attempts. Biometric authentication is temporarily locked',
          code: 'BIOMETRIC_LOCKED_OUT',
        );
      case 'PermanentlyLockedOut':
        return const Failure.authentication(
          message: 'Biometric authentication is permanently locked. Use device passcode',
          code: 'BIOMETRIC_PERMANENTLY_LOCKED',
        );
      case 'UserCancel':
        return const Failure.authentication(
          message: 'User cancelled biometric authentication',
          code: 'BIOMETRIC_USER_CANCEL',
        );
      case 'UserFallback':
        return const Failure.authentication(
          message: 'User selected fallback authentication method',
          code: 'BIOMETRIC_USER_FALLBACK',
        );
      case 'BiometricOnlyNotSupported':
        return const Failure.authentication(
          message: 'Biometric-only authentication is not supported',
          code: 'BIOMETRIC_ONLY_NOT_SUPPORTED',
        );
      default:
        return Failure.authentication(
          message: 'Biometric authentication failed: ${e.message}',
          code: e.code,
        );
    }
  }

  // Simple in-memory storage for demo purposes
  // In production, you might want to use secure storage
  static DateTime? _lastAuthTime;

  DateTime? _getLastAuthenticationTime() => _lastAuthTime;
  void _setLastAuthenticationTime(DateTime time) => _lastAuthTime = time;
  void _clearLastAuthenticationTime() => _lastAuthTime = null;
}

/// Biometric capability levels
enum BiometricCapability {
  /// Device doesn't support biometric authentication
  notSupported,
  
  /// Biometric authentication is available but not enabled
  notAvailable,
  
  /// Biometric authentication is available but no biometrics are enrolled
  notEnrolled,
  
  /// Face ID is available and enrolled
  faceId,
  
  /// Fingerprint authentication is available and enrolled
  fingerprint,
  
  /// Iris recognition is available and enrolled
  iris,
  
  /// Weak biometric method is available (e.g., voice, pattern)
  weak,
}

/// Extension for user-friendly capability descriptions
extension BiometricCapabilityExt on BiometricCapability {
  String get displayName {
    switch (this) {
      case BiometricCapability.notSupported:
        return 'Not Supported';
      case BiometricCapability.notAvailable:
        return 'Not Available';
      case BiometricCapability.notEnrolled:
        return 'Not Enrolled';
      case BiometricCapability.faceId:
        return 'Face ID';
      case BiometricCapability.fingerprint:
        return 'Fingerprint';
      case BiometricCapability.iris:
        return 'Iris Recognition';
      case BiometricCapability.weak:
        return 'Biometric Authentication';
    }
  }

  String get description {
    switch (this) {
      case BiometricCapability.notSupported:
        return 'This device does not support biometric authentication';
      case BiometricCapability.notAvailable:
        return 'Biometric authentication is disabled on this device';
      case BiometricCapability.notEnrolled:
        return 'No biometric credentials are enrolled on this device';
      case BiometricCapability.faceId:
        return 'Unlock with your face using Face ID';
      case BiometricCapability.fingerprint:
        return 'Unlock with your fingerprint';
      case BiometricCapability.iris:
        return 'Unlock with iris recognition';
      case BiometricCapability.weak:
        return 'Unlock with biometric authentication';
    }
  }

  bool get isStrong {
    switch (this) {
      case BiometricCapability.faceId:
      case BiometricCapability.fingerprint:
      case BiometricCapability.iris:
        return true;
      default:
        return false;
    }
  }
}