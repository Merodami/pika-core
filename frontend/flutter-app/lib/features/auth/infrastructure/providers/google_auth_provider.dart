import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;
import 'package:google_sign_in/google_sign_in.dart';
import 'package:flutter/foundation.dart';

import '../../domain/services/auth_provider_service.dart';
import '../../../../core/utils/logger_utils.dart';

/// Google Sign-In provider implementation
/// Handles Google authentication with Firebase integration
class GoogleAuthProvider implements AuthProviderService {
  static final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
    clientId: kIsWeb ? '303337225326-k8loau7k864meep8i0bggkqpl2nbghl7.apps.googleusercontent.com' : null,
  );
  
  static final firebase_auth.FirebaseAuth _firebaseAuth = 
      firebase_auth.FirebaseAuth.instance;

  @override
  String get providerName => 'google';

  @override
  bool get isAvailable => true; // Google Sign-In is now configured for web

  @override
  Future<AuthProviderResult> authenticate() async {
    try {
      LoggerUtils.debug('Starting Google Sign-In authentication');
      
      if (kIsWeb) {
        // Web: Use Firebase Auth popup (industry standard)
        final provider = firebase_auth.GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        
        final userCredential = await _firebaseAuth.signInWithPopup(provider);
        
        final firebaseIdToken = await userCredential.user?.getIdToken();
        if (firebaseIdToken == null) {
          return AuthProviderResult.failure('Failed to get Firebase ID token');
        }

        LoggerUtils.info('Google web authentication successful', data: {
          'hasUser': userCredential.user != null,
          'isNewUser': userCredential.additionalUserInfo?.isNewUser,
        });

        return AuthProviderResult.success(
          firebaseIdToken: firebaseIdToken,
          metadata: {
            'isNewUser': userCredential.additionalUserInfo?.isNewUser ?? false,
            'profile': userCredential.additionalUserInfo?.profile,
            'providerId': userCredential.additionalUserInfo?.providerId,
          },
        );
      } else {
        // Mobile: Use google_sign_in package (industry standard)
        final googleUser = await _googleSignIn.signIn();
        if (googleUser == null) {
          LoggerUtils.debug('Google Sign-In cancelled by user');
          return AuthProviderResult.cancelled();
        }

        final googleAuth = await googleUser.authentication;
        if (googleAuth.idToken == null) {
          return AuthProviderResult.failure('Failed to get Google ID token');
        }

        final credential = firebase_auth.GoogleAuthProvider.credential(
          accessToken: googleAuth.accessToken,
          idToken: googleAuth.idToken,
        );

        final userCredential = await _firebaseAuth.signInWithCredential(credential);
        
        final firebaseIdToken = await userCredential.user?.getIdToken();
        if (firebaseIdToken == null) {
          return AuthProviderResult.failure('Failed to get Firebase ID token');
        }

        LoggerUtils.info('Google mobile authentication successful', data: {
          'hasUser': userCredential.user != null,
          'isNewUser': userCredential.additionalUserInfo?.isNewUser,
        });

        return AuthProviderResult.success(
          firebaseIdToken: firebaseIdToken,
          metadata: {
            'isNewUser': userCredential.additionalUserInfo?.isNewUser ?? false,
            'profile': userCredential.additionalUserInfo?.profile,
            'providerId': userCredential.additionalUserInfo?.providerId,
          },
        );
      }

    } on firebase_auth.FirebaseAuthException catch (e) {
      LoggerUtils.warning('Google Firebase authentication failed', data: {
        'code': e.code,
        'message': e.message,
      });
      
      return AuthProviderResult.failure('Firebase authentication failed: ${e.message}');
      
    } catch (e) {
      LoggerUtils.error('Google authentication error', error: e);
      return AuthProviderResult.failure('Google authentication failed: ${e.toString()}');
    }
  }

  @override
  Future<void> signOut() async {
    try {
      await Future.wait([
        _googleSignIn.signOut(),
        _firebaseAuth.signOut(),
      ]);
      LoggerUtils.debug('Google sign-out successful');
    } catch (e) {
      LoggerUtils.warning('Google sign-out failed', data: {'error': e.toString()});
      // Don't throw - sign out should always succeed locally
    }
  }

  /// Disconnect from Google (revoke access)
  Future<void> disconnect() async {
    try {
      await _googleSignIn.disconnect();
      LoggerUtils.debug('Google disconnect successful');
    } catch (e) {
      LoggerUtils.warning('Google disconnect failed', data: {'error': e.toString()});
    }
  }

  /// Check if user is currently signed in with Google
  bool get isSignedIn => _googleSignIn.currentUser != null;

  /// Get current Google user
  GoogleSignInAccount? get currentUser => _googleSignIn.currentUser;
}