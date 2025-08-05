import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';

import '../../domain/entities/user_entity.dart';
import '../../domain/entities/auth_tokens_entity.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_data_source.dart';
import '../datasources/auth_local_data_source.dart';
import '../models/auth_tokens_dto.dart';
import '../../../../core/exceptions/app_exceptions.dart';
import '../../../../core/exceptions/api_error.dart';

/// Implementation of AuthRepository
/// Coordinates between remote and local data sources
class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource _remoteDataSource;
  final AuthLocalDataSource _localDataSource;

  // Cache for current access token
  String? _currentAccessToken;

  AuthRepositoryImpl({
    required AuthRemoteDataSource remoteDataSource,
    required AuthLocalDataSource localDataSource,
  })  : _remoteDataSource = remoteDataSource,
        _localDataSource = localDataSource;

  @override
  Future<Either<AppException, (UserEntity, AuthTokensEntity)>> login({
    required String email,
    required String password,
  }) async {
    try {
      // Call remote data source
      final (userDto, tokensDto) = await _remoteDataSource.login(
        email: email,
        password: password,
      );

      // Convert to entities
      final user = userDto.toEntity();
      final tokens = tokensDto.toEntity();

      // Save email for convenience
      await _localDataSource.saveLastEmail(email);

      // Cache access token
      _currentAccessToken = tokens.accessToken;

      return Right((user, tokens));
    } catch (e) {
      return Left(_handleError(e));
    }
  }

  @override
  Future<Either<AppException, (UserEntity, AuthTokensEntity)>> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String role,
    String? phoneNumber,
  }) async {
    try {
      // Call remote data source
      final (userDto, tokensDto) = await _remoteDataSource.register(
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
        role: role,
        phoneNumber: phoneNumber,
      );

      // Convert to entities
      final user = userDto.toEntity();
      final tokens = tokensDto.toEntity();

      // Save email for convenience
      await _localDataSource.saveLastEmail(email);

      // Cache access token
      _currentAccessToken = tokens.accessToken;

      return Right((user, tokens));
    } catch (e) {
      return Left(_handleError(e));
    }
  }

  @override
  Future<Either<AppException, UserEntity>> getCurrentUser() async {
    try {
      // Get access token
      final accessToken = await _getValidAccessToken();
      if (accessToken == null) {
        return Left(UnauthorizedException('No valid authentication token'));
      }

      // Get user from remote
      final userDto = await _remoteDataSource.getCurrentUser(accessToken);
      return Right(userDto.toEntity());
    } catch (e) {
      return Left(_handleError(e));
    }
  }

  @override
  Future<Either<AppException, AuthTokensEntity>> refreshTokens({
    required String refreshToken,
  }) async {
    try {
      // Refresh tokens
      final tokensDto = await _remoteDataSource.refreshTokens(refreshToken);
      final tokens = tokensDto.toEntity();

      // Save new tokens
      await _localDataSource.saveTokens(tokensDto);

      // Update cached access token
      _currentAccessToken = tokens.accessToken;

      return Right(tokens);
    } catch (e) {
      return Left(_handleError(e));
    }
  }

  @override
  Future<Either<AppException, UserEntity>> updateProfile({
    String? firstName,
    String? lastName,
    String? phoneNumber,
    String? avatarUrl,
  }) async {
    try {
      // Get access token
      final accessToken = await _getValidAccessToken();
      if (accessToken == null) {
        return Left(UnauthorizedException('No valid authentication token'));
      }

      // Update profile
      final userDto = await _remoteDataSource.updateProfile(
        accessToken: accessToken,
        firstName: firstName,
        lastName: lastName,
        phoneNumber: phoneNumber,
        avatarUrl: avatarUrl,
      );

      return Right(userDto.toEntity());
    } catch (e) {
      return Left(_handleError(e));
    }
  }

  @override
  Future<Either<AppException, Unit>> logout() async {
    try {
      // Get access token for logout API call
      final accessToken = _currentAccessToken ?? 
          (await _localDataSource.getStoredTokens())?.accessToken;

      // Try to logout on backend (don't fail if this fails)
      if (accessToken != null) {
        try {
          await _remoteDataSource.logout(accessToken);
        } catch (_) {
          // Ignore remote logout errors
        }
      }

      // Clear cached token
      _currentAccessToken = null;

      return const Right(unit);
    } catch (e) {
      return Left(_handleError(e));
    }
  }

  @override
  Future<Either<AppException, Unit>> requestPasswordReset({
    required String email,
  }) async {
    try {
      await _remoteDataSource.requestPasswordReset(email);
      return const Right(unit);
    } catch (e) {
      return Left(_handleError(e));
    }
  }

  @override
  Future<AuthTokensEntity?> getStoredTokens() async {
    final tokensDto = await _localDataSource.getStoredTokens();
    return tokensDto?.toEntity();
  }

  @override
  Future<void> saveTokens(AuthTokensEntity tokens) async {
    final tokensDto = AuthTokensDto.fromEntity(tokens);
    await _localDataSource.saveTokens(tokensDto);
    _currentAccessToken = tokens.accessToken;
  }

  @override
  Future<void> clearAuthData() async {
    await _localDataSource.clearAuthData();
    _currentAccessToken = null;
  }

  @override
  Future<Either<AppException, String>> getFirebaseToken() async {
    try {
      // Get access token
      final accessToken = await _getValidAccessToken();
      if (accessToken == null) {
        return Left(UnauthorizedException('No valid authentication token'));
      }

      // Get Firebase token
      final firebaseToken = await _remoteDataSource.getFirebaseToken(accessToken);
      return Right(firebaseToken);
    } catch (e) {
      return Left(_handleError(e));
    }
  }

  @override
  Future<Either<AppException, Unit>> saveFCMToken({
    required String fcmToken,
  }) async {
    try {
      // Get access token
      final accessToken = await _getValidAccessToken();
      if (accessToken == null) {
        return Left(UnauthorizedException('No valid authentication token'));
      }

      // Save FCM token
      await _remoteDataSource.saveFCMToken(
        accessToken: accessToken,
        fcmToken: fcmToken,
      );

      return const Right(unit);
    } catch (e) {
      return Left(_handleError(e));
    }
  }

  @override
  Future<Either<AppException, (UserEntity, AuthTokensEntity)>> exchangeFirebaseToken({
    required String firebaseIdToken,
    required String provider,
    required Map<String, dynamic> deviceInfo,
  }) async {
    try {
      // Call remote data source
      final (userDto, tokensDto) = await _remoteDataSource.exchangeFirebaseToken(
        firebaseIdToken: firebaseIdToken,
        provider: provider,
        deviceInfo: deviceInfo,
      );

      // Convert to entities
      final user = userDto.toEntity();
      final tokens = tokensDto.toEntity();

      // Cache access token
      _currentAccessToken = tokens.accessToken;

      return Right((user, tokens));
    } catch (e) {
      return Left(_handleError(e));
    }
  }

  /// Get valid access token (refresh if needed)
  Future<String?> _getValidAccessToken() async {
    // Check cached token first
    if (_currentAccessToken != null) {
      return _currentAccessToken;
    }

    // Get stored tokens
    final tokens = await _localDataSource.getStoredTokens();
    if (tokens == null) {
      return null;
    }

    // Check if access token is expired
    if (tokens.expiresAt.isBefore(DateTime.now())) {
      // Try to refresh
      try {
        final newTokensDto = await _remoteDataSource.refreshTokens(tokens.refreshToken);
        await _localDataSource.saveTokens(newTokensDto);
        _currentAccessToken = newTokensDto.accessToken;
        return _currentAccessToken;
      } catch (_) {
        // Refresh failed
        return null;
      }
    }

    _currentAccessToken = tokens.accessToken;
    return _currentAccessToken;
  }

  /// Handle errors and convert to AppException
  /// Enhanced to parse new standardized API error format
  AppException _handleError(dynamic error) {
    if (error is AppException) {
      return error;
    }

    if (error is DioException) {
      if (error.response != null) {
        final statusCode = error.response!.statusCode;
        final data = error.response!.data;

        // Try to parse as new standardized error format
        if (data is Map<String, dynamic>) {
          try {
            final apiError = ApiError.fromJson(data);
            
            // Create appropriate exception based on status code and error type
            switch (statusCode) {
              case 400:
              case 422:
                // For validation errors, create a ValidationExceptionWithFields
                return ValidationExceptionWithFields(
                  apiError.message,
                  apiError.error,
                  apiError.getAllFieldErrors(),
                  apiError,
                );
              case 401:
                return UnauthorizedException(apiError.message, apiError.error);
              case 404:
                return NotFoundException(apiError.message, apiError.error);
              case 409:
                return ConflictException(apiError.message, apiError.error);
              case 500:
              case 502:
              case 503:
                return ServerException(apiError.message, apiError.error);
              default:
                return NetworkException(apiError.message, apiError.error);
            }
          } catch (e) {
            // Fallback to legacy parsing if new format fails
            final message = data['message'] ?? data['error'] ?? 'Request failed';
            
            switch (statusCode) {
              case 400:
              case 422:
                return ValidationException(message);
              case 401:
                return UnauthorizedException(message);
              case 404:
                return NotFoundException(message);
              case 409:
                return ConflictException(message);
              case 500:
              case 502:
              case 503:
                return ServerException(message);
              default:
                return NetworkException(message);
            }
          }
        }
        
        // Simple error format fallback
        final message = data?.toString() ?? 'Request failed';
        switch (statusCode) {
          case 400:
          case 422:
            return ValidationException(message);
          case 401:
            return UnauthorizedException(message);
          case 404:
            return NotFoundException(message);
          case 409:
            return ConflictException(message);
          case 500:
          case 502:
          case 503:
            return ServerException(message);
          default:
            return NetworkException(message);
        }
      }

      // Network-level errors
      if (error.type == DioExceptionType.connectionTimeout ||
          error.type == DioExceptionType.receiveTimeout) {
        return NetworkException('Connection timeout');
      }

      if (error.type == DioExceptionType.connectionError) {
        return NetworkException('No internet connection');
      }

      return NetworkException('Network error');
    }

    return ServerException(error.toString());
  }
}