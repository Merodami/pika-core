
/// Abstract authentication provider interface
/// Enables easy extension for new providers (Apple, Twitter, etc.)
abstract class AuthProviderService {
  String get providerName;
  
  /// Authenticate with the provider and return Firebase credential
  Future<AuthProviderResult> authenticate();
  
  /// Sign out from the provider
  Future<void> signOut();
  
  /// Check if provider is available on current platform
  bool get isAvailable;
}

/// Result of authentication provider operation
class AuthProviderResult {
  final bool isSuccess;
  final String? firebaseIdToken;
  final String? error;
  final bool isCancelled;
  final Map<String, dynamic>? metadata;

  const AuthProviderResult._({
    required this.isSuccess,
    this.firebaseIdToken,
    this.error,
    this.isCancelled = false,
    this.metadata,
  });

  factory AuthProviderResult.success({
    required String firebaseIdToken,
    Map<String, dynamic>? metadata,
  }) {
    return AuthProviderResult._(
      isSuccess: true,
      firebaseIdToken: firebaseIdToken,
      metadata: metadata,
    );
  }

  factory AuthProviderResult.failure(String error) {
    return AuthProviderResult._(
      isSuccess: false,
      error: error,
    );
  }

  factory AuthProviderResult.cancelled() {
    return AuthProviderResult._(
      isSuccess: false,
      isCancelled: true,
    );
  }
}

/// Factory for creating auth provider services
class AuthProviderFactory {
  static final Map<String, AuthProviderService Function()> _providers = {};
  
  /// Register a new auth provider
  static void registerProvider(String name, AuthProviderService Function() factory) {
    _providers[name] = factory;
  }
  
  /// Get provider by name
  static AuthProviderService? getProvider(String name) {
    final factory = _providers[name];
    return factory?.call();
  }
  
  /// Get all available providers for current platform
  static List<AuthProviderService> getAvailableProviders() {
    return _providers.values
        .map((factory) => factory())
        .where((provider) => provider.isAvailable)
        .toList();
  }
  
  /// Get provider names
  static List<String> getProviderNames() {
    return _providers.keys.toList();
  }
}