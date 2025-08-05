import 'package:equatable/equatable.dart';

/// Authentication Tokens Entity
/// Represents JWT tokens used for authentication
class AuthTokensEntity extends Equatable {
  final String accessToken;
  final String refreshToken;
  final DateTime expiresAt;
  final DateTime refreshExpiresAt;

  const AuthTokensEntity({
    required this.accessToken,
    required this.refreshToken,
    required this.expiresAt,
    required this.refreshExpiresAt,
  });

  /// Check if access token is expired
  bool get isAccessTokenExpired => DateTime.now().isAfter(expiresAt);

  /// Check if refresh token is expired
  bool get isRefreshTokenExpired => DateTime.now().isAfter(refreshExpiresAt);

  /// Get remaining time until access token expires
  Duration get accessTokenRemainingTime => expiresAt.difference(DateTime.now());

  /// Get remaining time until refresh token expires
  Duration get refreshTokenRemainingTime => refreshExpiresAt.difference(DateTime.now());

  @override
  List<Object> get props => [
        accessToken,
        refreshToken,
        expiresAt,
        refreshExpiresAt,
      ];
}