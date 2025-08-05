import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;
import 'package:flutter_facebook_auth/flutter_facebook_auth.dart';
import 'package:flutter/foundation.dart';

import '../../domain/services/auth_provider_service.dart';
import '../../../../core/utils/logger_utils.dart';

/// Facebook Sign-In provider implementation
/// Handles Facebook authentication with Firebase integration
class FacebookAuthProvider implements AuthProviderService {
  static final firebase_auth.FirebaseAuth _firebaseAuth = 
      firebase_auth.FirebaseAuth.instance;

  @override
  String get providerName => 'facebook';

  @override
  bool get isAvailable => true; // Facebook Auth supports web and mobile

  @override
  Future<AuthProviderResult> authenticate() async {
    try {
      LoggerUtils.debug('Starting Facebook Sign-In authentication');
      
      late firebase_auth.UserCredential userCredential;
      String? accessToken;
      
      if (kIsWeb) {
        // Web: Use Firebase Auth popup (works with emulators)
        final provider = firebase_auth.FacebookAuthProvider();
        provider.addScope('email');
        provider.addScope('public_profile');
        
        userCredential = await _firebaseAuth.signInWithPopup(provider);
      } else {
        // Mobile: Use flutter_facebook_auth
        final result = await FacebookAuth.instance.login(
          permissions: ['email', 'public_profile'],
        );
        
        if (result.status == LoginStatus.cancelled) {
          LoggerUtils.debug('Facebook Sign-In cancelled by user');
          return AuthProviderResult.cancelled();
        }
        
        if (result.status != LoginStatus.success) {
          LoggerUtils.warning('Facebook login failed', data: {
            'status': result.status.toString(),
            'message': result.message,
          });
          return AuthProviderResult.failure('Facebook login failed: ${result.message}');
        }

        if (result.accessToken?.tokenString == null) {
          return AuthProviderResult.failure('Failed to get Facebook access token');
        }

        accessToken = result.accessToken!.tokenString;

        // Create Firebase credential and sign in
        final credential = firebase_auth.FacebookAuthProvider.credential(
          result.accessToken!.tokenString,
        );

        userCredential = await _firebaseAuth.signInWithCredential(credential);
      }
      
      // Get Firebase ID token
      final firebaseIdToken = await userCredential.user?.getIdToken();
      if (firebaseIdToken == null) {
        return AuthProviderResult.failure('Failed to get Firebase ID token');
      }

      // Get user data for metadata (only on mobile)
      Map<String, dynamic>? userData;
      if (!kIsWeb) {
        try {
          userData = await FacebookAuth.instance.getUserData(
            fields: "name,email,picture.width(200)",
          );
        } catch (e) {
          LoggerUtils.warning('Failed to get Facebook user data', data: {'error': e.toString()});
        }
      }

      LoggerUtils.info('Facebook authentication successful', data: {
        'hasUser': userCredential.user != null,
        'isNewUser': userCredential.additionalUserInfo?.isNewUser,
      });

      return AuthProviderResult.success(
        firebaseIdToken: firebaseIdToken,
        metadata: {
          'isNewUser': userCredential.additionalUserInfo?.isNewUser ?? false,
          'profile': userCredential.additionalUserInfo?.profile,
          'providerId': userCredential.additionalUserInfo?.providerId,
          'userData': userData,
          'accessToken': accessToken,
        },
      );

    } on firebase_auth.FirebaseAuthException catch (e) {
      LoggerUtils.warning('Facebook Firebase authentication failed', data: {
        'code': e.code,
        'message': e.message,
      });
      
      return AuthProviderResult.failure('Firebase authentication failed: ${e.message}');
      
    } catch (e) {
      LoggerUtils.error('Facebook authentication error', error: e);
      return AuthProviderResult.failure('Facebook authentication failed: ${e.toString()}');
    }
  }

  @override
  Future<void> signOut() async {
    try {
      await Future.wait([
        FacebookAuth.instance.logOut(),
        _firebaseAuth.signOut(),
      ]);
      LoggerUtils.debug('Facebook sign-out successful');
    } catch (e) {
      LoggerUtils.warning('Facebook sign-out failed', data: {'error': e.toString()});
      // Don't throw - sign out should always succeed locally
    }
  }

  /// Get current access token
  Future<AccessToken?> get currentAccessToken => FacebookAuth.instance.accessToken;

  /// Get user data from Facebook
  Future<Map<String, dynamic>?> getUserData({String fields = "name,email,picture"}) async {
    try {
      return await FacebookAuth.instance.getUserData(fields: fields);
    } catch (e) {
      LoggerUtils.warning('Failed to get Facebook user data', data: {'error': e.toString()});
      return null;
    }
  }

  /// Check login status
  Future<bool> get isLoggedIn async {
    final accessToken = await FacebookAuth.instance.accessToken;
    return accessToken != null;
  }
}