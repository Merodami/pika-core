import 'package:dio/dio.dart';
import 'package:jwt_decoder/jwt_decoder.dart';

import '../../config/app_config.dart';
import '../../models/user_model.dart';
import '../../exceptions/app_exceptions.dart';
import '../api/api_client.dart';

class AuthService {
  late final ApiClient _apiClient;
  
  AuthService() {
    _apiClient = ApiClient();
  }
  
  // Login - Fixed to match backend response structure
  Future<AuthResponse> login(String email, String password) async {
    try {
      final response = await _apiClient.post(
        '/auth/login',
        data: {
          'email': email,
          'password': password,
        },
      );
      
      // Backend returns: { user: {...}, tokens: {...} }
      // Response structure matches Flutter models
      return AuthResponse.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleAuthError(e);
    }
  }
  
  // Register - Fixed to match backend schema
  Future<AuthResponse> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String role,
    String? phoneNumber,
  }) async {
    try {
      final response = await _apiClient.post(
        '/auth/register',
        data: {
          'email': email,
          'password': password,
          'first_name': firstName,        // Backend expects snake_case
          'last_name': lastName,          // Backend expects snake_case
          'role': role.toUpperCase(),     // Backend expects CUSTOMER/PROVIDER
          if (phoneNumber != null) 'phone_number': phoneNumber,
        },
      );
      
      return AuthResponse.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleAuthError(e);
    }
  }
  
  // Get current user - Fixed endpoint
  Future<UserModel?> getCurrentUser(String token) async {
    try {
      // Check if token is expired
      if (JwtDecoder.isExpired(token)) {
        return null;
      }
      
      // Backend endpoint is /users/me, not /auth/me
      final response = await _apiClient.get(
        '/users/me',
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );
      
      return UserModel.fromJson(response.data);
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        return null;
      }
      throw _handleAuthError(e);
    }
  }
  
  // Get Firebase custom token - Fixed for backend integration
  Future<String> getFirebaseToken(String jwtToken) async {
    try {
      final response = await _apiClient.post(
        '/auth/firebase-token',
        data: {
          'purpose': 'real-time',
          'expiresIn': 3600,
        },
        options: Options(
          headers: {'Authorization': 'Bearer $jwtToken'},
        ),
      );
      
      // Backend returns: { customToken: "...", expiresAt: "...", claims: {...} }
      return response.data['customToken'] as String;
    } on DioException catch (e) {
      throw _handleAuthError(e);
    }
  }
  
  // Refresh token
  Future<AuthTokens> refreshToken(String refreshToken) async {
    try {
      final response = await _apiClient.post(
        '/auth/refresh',
        data: {
          'refresh_token': refreshToken,
        },
      );
      
      // Backend returns only tokens for refresh endpoint
      return AuthTokens.fromJson(response.data['tokens']);
    } on DioException catch (e) {
      throw _handleAuthError(e);
    }
  }
  
  // Update profile - Fixed endpoint and schema
  Future<UserModel> updateProfile({
    required String token,
    String? firstName,
    String? lastName,
    String? phoneNumber,
    String? photoUrl,
  }) async {
    try {
      final data = <String, dynamic>{};
      if (firstName != null) data['first_name'] = firstName;
      if (lastName != null) data['last_name'] = lastName;
      if (phoneNumber != null) data['phone_number'] = phoneNumber;
      if (photoUrl != null) data['photo_url'] = photoUrl;
      
      final response = await _apiClient.patch(
        '/users/me',  // Backend endpoint
        data: data,
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );
      
      return UserModel.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleAuthError(e);
    }
  }
  
  // Reset password
  Future<void> resetPassword(String email) async {
    try {
      await _apiClient.post(
        '/auth/forgot-password',
        data: {'email': email},
      );
    } on DioException catch (e) {
      throw _handleAuthError(e);
    }
  }
  
  // Logout
  Future<void> logout(String token) async {
    try {
      await _apiClient.post(
        '/auth/logout',
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );
    } on DioException catch (e) {
      // Ignore logout errors - we'll clear local state anyway
    }
  }
  
  // Save FCM token to backend
  Future<void> saveFCMToken(String token, String fcmToken) async {
    try {
      await _apiClient.post(
        '/users/me/fcm-token',  // Backend endpoint for FCM tokens
        data: {'token': fcmToken},
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );
    } on DioException catch (e) {
      // Log but don't throw - FCM token saving is not critical
      print('Failed to save FCM token: ${e.message}');
    }
  }
  
  // Handle authentication errors
  AppException _handleAuthError(DioException error) {
    if (error.response != null) {
      final statusCode = error.response!.statusCode;
      final data = error.response!.data;
      String message = 'Authentication failed';
      
      if (data is Map && data.containsKey('message')) {
        message = data['message'];
      } else if (data is Map && data.containsKey('error')) {
        message = data['error']['message'] ?? message;
      }
      
      switch (statusCode) {
        case 400:
          return ValidationException(message);
        case 401:
          return UnauthorizedException(message);
        case 404:
          return NotFoundException(message);
        case 409:
          return ConflictException(message);
        case 422:
          return ValidationException(message);
        default:
          return ServerException(message);
      }
    }
    
    if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout) {
      return NetworkException('Connection timeout. Please try again.');
    }
    
    if (error.type == DioExceptionType.connectionError) {
      return NetworkException('Network error. Please check your connection.');
    }
    
    return NetworkException('Network error. Please try again.');
  }
}