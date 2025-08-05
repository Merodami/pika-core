import '../../domain/entities/auth_tokens_entity.dart';

/// Authentication Tokens Data Transfer Object
/// Maps between API JSON and domain entity
class AuthTokensDto {
  final String accessToken;
  final String refreshToken;
  final DateTime expiresAt;
  final DateTime refreshExpiresAt;

  const AuthTokensDto({
    required this.accessToken,
    required this.refreshToken,
    required this.expiresAt,
    required this.refreshExpiresAt,
  });

  /// Create AuthTokensDto from JSON
  factory AuthTokensDto.fromJson(Map<String, dynamic> json) {
    // Handle expires_in (seconds from now) or expires_at (ISO date string)
    DateTime expiresAt;
    if (json['expires_in'] != null) {
      final expiresInSeconds = json['expires_in'] as int;
      expiresAt = DateTime.now().add(Duration(seconds: expiresInSeconds));
    } else if (json['expires_at'] != null || json['expiresAt'] != null) {
      expiresAt = DateTime.parse(json['expires_at'] ?? json['expiresAt']);
    } else {
      // Default to 15 minutes from now if not provided
      expiresAt = DateTime.now().add(const Duration(minutes: 15));
    }
    
    // For refresh token, API doesn't provide expiry, so we calculate it (7 days)
    DateTime refreshExpiresAt;
    if (json['refresh_expires_at'] != null || json['refreshExpiresAt'] != null) {
      refreshExpiresAt = DateTime.parse(json['refresh_expires_at'] ?? json['refreshExpiresAt']);
    } else {
      // Default to 7 days from now
      refreshExpiresAt = DateTime.now().add(const Duration(days: 7));
    }
    
    return AuthTokensDto(
      accessToken: json['accessToken'] ?? json['access_token'],
      refreshToken: json['refreshToken'] ?? json['refresh_token'],
      expiresAt: expiresAt,
      refreshExpiresAt: refreshExpiresAt,
    );
  }

  /// Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      'access_token': accessToken,
      'refresh_token': refreshToken,
      'expires_at': expiresAt.toIso8601String(),
      'refresh_expires_at': refreshExpiresAt.toIso8601String(),
    };
  }

  /// Convert to domain entity
  AuthTokensEntity toEntity() => AuthTokensEntity(
        accessToken: accessToken,
        refreshToken: refreshToken,
        expiresAt: expiresAt,
        refreshExpiresAt: refreshExpiresAt,
      );

  /// Create AuthTokensDto from domain entity
  static AuthTokensDto fromEntity(AuthTokensEntity entity) => AuthTokensDto(
        accessToken: entity.accessToken,
        refreshToken: entity.refreshToken,
        expiresAt: entity.expiresAt,
        refreshExpiresAt: entity.refreshExpiresAt,
      );
}