import 'auth_provider_service.dart';
import '../../infrastructure/providers/google_auth_provider.dart';
import '../../infrastructure/providers/facebook_auth_provider.dart';
import '../../../../core/utils/logger_utils.dart';

/// Social authentication service
/// Manages multiple authentication providers in a unified way
class SocialAuthService {
  static final SocialAuthService _instance = SocialAuthService._internal();
  factory SocialAuthService() => _instance;
  SocialAuthService._internal() {
    _registerProviders();
  }

  /// Register all available auth providers
  void _registerProviders() {
    AuthProviderFactory.registerProvider('google', () => GoogleAuthProvider());
    AuthProviderFactory.registerProvider('facebook', () => FacebookAuthProvider());
    
    LoggerUtils.debug('Registered auth providers', data: {
      'providers': AuthProviderFactory.getProviderNames(),
    });
  }

  /// Authenticate with a specific provider
  Future<AuthProviderResult> authenticateWith(String providerName) async {
    final provider = AuthProviderFactory.getProvider(providerName);
    
    if (provider == null) {
      LoggerUtils.warning('Auth provider not found', data: {'provider': providerName});
      return AuthProviderResult.failure('Provider $providerName not available');
    }

    if (!provider.isAvailable) {
      LoggerUtils.warning('Auth provider not available on this platform', data: {
        'provider': providerName,
      });
      return AuthProviderResult.failure('Provider $providerName not available on this platform');
    }

    LoggerUtils.debug('Starting authentication', data: {'provider': providerName});
    
    try {
      final result = await provider.authenticate();
      
      if (result.isSuccess) {
        LoggerUtils.info('Authentication successful', data: {
          'provider': providerName,
          'hasToken': result.firebaseIdToken != null,
        });
      } else if (result.isCancelled) {
        LoggerUtils.debug('Authentication cancelled by user', data: {
          'provider': providerName,
        });
      } else {
        LoggerUtils.warning('Authentication failed', data: {
          'provider': providerName,
          'error': result.error,
        });
      }
      
      return result;
    } catch (e) {
      LoggerUtils.error('Authentication error', error: e);
      return AuthProviderResult.failure('Authentication failed: ${e.toString()}');
    }
  }

  /// Sign out from a specific provider
  Future<void> signOutFrom(String providerName) async {
    final provider = AuthProviderFactory.getProvider(providerName);
    
    if (provider == null) {
      LoggerUtils.warning('Cannot sign out - provider not found', data: {
        'provider': providerName,
      });
      return;
    }

    try {
      await provider.signOut();
      LoggerUtils.debug('Sign out successful', data: {'provider': providerName});
    } catch (e) {
      LoggerUtils.warning('Sign out failed', data: {
        'provider': providerName,
        'error': e.toString(),
      });
    }
  }

  /// Sign out from all providers
  Future<void> signOutFromAll() async {
    final providers = AuthProviderFactory.getAvailableProviders();
    
    LoggerUtils.debug('Signing out from all providers', data: {
      'providerCount': providers.length,
    });

    await Future.wait(
      providers.map((provider) async {
        try {
          await provider.signOut();
        } catch (e) {
          LoggerUtils.warning('Failed to sign out from provider', data: {
            'provider': provider.providerName,
            'error': e.toString(),
          });
        }
      }),
    );
  }

  /// Get all available providers
  List<AuthProviderService> getAvailableProviders() {
    return AuthProviderFactory.getAvailableProviders();
  }

  /// Get provider names
  List<String> getProviderNames() {
    return AuthProviderFactory.getProviderNames();
  }

  /// Check if a provider is available
  bool isProviderAvailable(String providerName) {
    final provider = AuthProviderFactory.getProvider(providerName);
    return provider?.isAvailable ?? false;
  }

  /// Register a custom auth provider (for extensibility)
  void registerCustomProvider(String name, AuthProviderService Function() factory) {
    AuthProviderFactory.registerProvider(name, factory);
    LoggerUtils.info('Custom auth provider registered', data: {'provider': name});
  }
}