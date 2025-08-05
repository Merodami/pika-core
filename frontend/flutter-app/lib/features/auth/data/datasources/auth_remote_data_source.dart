import 'package:dio/dio.dart';

import '../models/user_dto.dart';
import '../models/auth_tokens_dto.dart';
import '../../../../core/services/api/api_client.dart';

/// Remote data source for authentication
/// Handles all API calls related to authentication
abstract class AuthRemoteDataSource {
  /// Login with email and password
  Future<(UserDto, AuthTokensDto)> login({
    required String email,
    required String password,
  });

  /// Register a new user
  Future<(UserDto, AuthTokensDto)> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String role,
    String? phoneNumber,
  });

  /// Get current user
  Future<UserDto> getCurrentUser(String accessToken);

  /// Refresh tokens
  Future<AuthTokensDto> refreshTokens(String refreshToken);

  /// Update user profile
  Future<UserDto> updateProfile({
    required String accessToken,
    String? firstName,
    String? lastName,
    String? phoneNumber,
    String? avatarUrl,
  });

  /// Logout
  Future<void> logout(String accessToken);

  /// Request password reset
  Future<void> requestPasswordReset(String email);

  /// Get Firebase custom token
  Future<String> getFirebaseToken(String accessToken);

  /// Save FCM token
  Future<void> saveFCMToken({
    required String accessToken,
    required String fcmToken,
  });

  /// Exchange Firebase ID token for JWT tokens
  Future<(UserDto, AuthTokensDto)> exchangeFirebaseToken({
    required String firebaseIdToken,
    required String provider,
    required Map<String, dynamic> deviceInfo,
  });
}

/// Implementation of auth remote data source
class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final ApiClient _apiClient;

  AuthRemoteDataSourceImpl(this._apiClient);

  @override
  Future<(UserDto, AuthTokensDto)> login({
    required String email,
    required String password,
  }) async {
    final response = await _apiClient.post(
      '/auth/login',
      data: {
        'email': email,
        'password': password,
      },
    );

    // Backend returns direct response: {user: {...}, tokens: {...}}
    final user = UserDto.fromJson(response.data['user']);
    final tokens = AuthTokensDto.fromJson(response.data['tokens']);

    return (user, tokens);
  }

  @override
  Future<(UserDto, AuthTokensDto)> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String role,
    String? phoneNumber,
  }) async {
    final response = await _apiClient.post(
      '/auth/register',
      data: {
        'email': email,
        'password': password,
        'first_name': firstName,
        'last_name': lastName,
        'role': role,
        if (phoneNumber != null) 'phone_number': phoneNumber,
      },
    );

    // Backend returns {success: boolean, data: {user: {...}, tokens: {...}}}
    final responseData = response.data['data'] ?? response.data;
    final user = UserDto.fromJson(responseData['user']);
    final tokens = AuthTokensDto.fromJson(responseData['tokens']);

    return (user, tokens);
  }

  @override
  Future<UserDto> getCurrentUser(String accessToken) async {
    final response = await _apiClient.get(
      '/users/me',
      options: Options(
        headers: {'Authorization': 'Bearer $accessToken'},
      ),
    );

    return UserDto.fromJson(response.data);
  }

  @override
  Future<AuthTokensDto> refreshTokens(String refreshToken) async {
    final response = await _apiClient.post(
      '/auth/refresh',
      data: {
        'refresh_token': refreshToken,
      },
    );

    // Backend returns direct response: {tokens: {...}}
    return AuthTokensDto.fromJson(response.data['tokens']);
  }

  @override
  Future<UserDto> updateProfile({
    required String accessToken,
    String? firstName,
    String? lastName,
    String? phoneNumber,
    String? avatarUrl,
  }) async {
    final data = <String, dynamic>{};
    if (firstName != null) data['first_name'] = firstName;
    if (lastName != null) data['last_name'] = lastName;
    if (phoneNumber != null) data['phone_number'] = phoneNumber;
    if (avatarUrl != null) data['avatar_url'] = avatarUrl;

    final response = await _apiClient.patch(
      '/users/me',
      data: data,
      options: Options(
        headers: {'Authorization': 'Bearer $accessToken'},
      ),
    );

    return UserDto.fromJson(response.data);
  }

  @override
  Future<void> logout(String accessToken) async {
    await _apiClient.post(
      '/auth/logout',
      data: {}, // Send empty object to satisfy JSON content-type
      options: Options(
        headers: {'Authorization': 'Bearer $accessToken'},
      ),
    );
  }

  @override
  Future<void> requestPasswordReset(String email) async {
    await _apiClient.post(
      '/auth/forgot-password',
      data: {'email': email},
    );
  }

  @override
  Future<String> getFirebaseToken(String accessToken) async {
    final response = await _apiClient.post(
      '/auth/firebase-token',
      data: {
        'purpose': 'real-time',
        'expiresIn': 3600,
      },
      options: Options(
        headers: {'Authorization': 'Bearer $accessToken'},
      ),
    );

    // Firebase token endpoint returns direct response: {customToken, expiresAt, claims}
    return response.data['customToken'] as String;
  }

  @override
  Future<void> saveFCMToken({
    required String accessToken,
    required String fcmToken,
  }) async {
    await _apiClient.post(
      '/users/me/fcm-token',
      data: {'token': fcmToken},
      options: Options(
        headers: {'Authorization': 'Bearer $accessToken'},
      ),
    );
  }

  @override
  Future<(UserDto, AuthTokensDto)> exchangeFirebaseToken({
    required String firebaseIdToken,
    required String provider,
    required Map<String, dynamic> deviceInfo,
  }) async {
    final response = await _apiClient.post(
      '/auth/exchange-token',
      data: {
        'firebase_id_token': firebaseIdToken,
        'provider': provider,
        'device_info': deviceInfo,
      },
    );

    // Backend returns {user: {...}, tokens: {...}}
    final user = UserDto.fromJson(response.data['user']);
    final tokens = AuthTokensDto.fromJson(response.data['tokens']);

    return (user, tokens);
  }
}