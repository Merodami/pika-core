import '../models/auth_tokens_dto.dart';
import '../../../../core/services/storage/storage_service.dart';

/// Local data source for authentication
/// Handles local storage of auth tokens and user data
abstract class AuthLocalDataSource {
  /// Get stored tokens
  Future<AuthTokensDto?> getStoredTokens();

  /// Save tokens
  Future<void> saveTokens(AuthTokensDto tokens);

  /// Clear all auth data
  Future<void> clearAuthData();

  /// Check if user is logged in
  Future<bool> isLoggedIn();

  /// Get last logged in email (for convenience)
  Future<String?> getLastEmail();

  /// Save last logged in email
  Future<void> saveLastEmail(String email);
}

/// Implementation using secure storage
class AuthLocalDataSourceImpl implements AuthLocalDataSource {
  static const String _accessTokenKey = 'jwt_token';
  static const String _refreshTokenKey = 'refresh_token';
  static const String _expiresAtKey = 'expires_at';
  static const String _refreshExpiresAtKey = 'refresh_expires_at';
  static const String _lastEmailKey = 'last_email';

  final StorageService _storage = StorageService.instance;

  @override
  Future<AuthTokensDto?> getStoredTokens() async {
    try {
      final accessToken = await _storage.getSecureString(_accessTokenKey);
      final refreshToken = await _storage.getSecureString(_refreshTokenKey);
      final expiresAtStr = await _storage.getSecureString(_expiresAtKey);
      final refreshExpiresAtStr = await _storage.getSecureString(_refreshExpiresAtKey);

      if (accessToken == null || 
          refreshToken == null || 
          expiresAtStr == null || 
          refreshExpiresAtStr == null) {
        return null;
      }

      return AuthTokensDto(
        accessToken: accessToken,
        refreshToken: refreshToken,
        expiresAt: DateTime.parse(expiresAtStr),
        refreshExpiresAt: DateTime.parse(refreshExpiresAtStr),
      );
    } catch (e) {
      // If any error occurs, return null
      return null;
    }
  }

  @override
  Future<void> saveTokens(AuthTokensDto tokens) async {
    await _storage.setSecureString(_accessTokenKey, tokens.accessToken);
    await _storage.setSecureString(_refreshTokenKey, tokens.refreshToken);
    await _storage.setSecureString(_expiresAtKey, tokens.expiresAt.toIso8601String());
    await _storage.setSecureString(_refreshExpiresAtKey, tokens.refreshExpiresAt.toIso8601String());
  }

  @override
  Future<void> clearAuthData() async {
    await _storage.deleteSecureData(_accessTokenKey);
    await _storage.deleteSecureData(_refreshTokenKey);
    await _storage.deleteSecureData(_expiresAtKey);
    await _storage.deleteSecureData(_refreshExpiresAtKey);
    // Keep last email for convenience
  }

  @override
  Future<bool> isLoggedIn() async {
    final tokens = await getStoredTokens();
    return tokens != null;
  }

  @override
  Future<String?> getLastEmail() async {
    return _storage.getSecureString(_lastEmailKey);
  }

  @override
  Future<void> saveLastEmail(String email) async {
    await _storage.setSecureString(_lastEmailKey, email);
  }
}