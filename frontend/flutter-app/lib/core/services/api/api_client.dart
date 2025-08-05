import 'dart:async';
import 'package:dio/dio.dart';
import 'package:pretty_dio_logger/pretty_dio_logger.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../config/app_config.dart';
import '../../utils/connectivity_utils.dart';
import '../../providers/app_providers.dart';
import '../storage/storage_service.dart';

class ApiClient {
  late final Dio _dio;
  final WidgetRef? _ref;
  
  // Expose the Dio instance for use with other packages like Retrofit
  Dio get dio => _dio;
  
  ApiClient([this._ref]) {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        sendTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );
    
    // Add interceptors
    _dio.interceptors.add(_AuthInterceptor());
    _dio.interceptors.add(_ErrorInterceptor());
    _dio.interceptors.add(_LanguageInterceptor(_ref));
    
    // Add logger in debug mode
    if (kDebugMode) {
      _dio.interceptors.add(
        PrettyDioLogger(
          requestHeader: true,
          requestBody: true,
          responseBody: true,
          responseHeader: false,
          error: true,
          compact: true,
        ),
      );
    }
  }
  
  // GET request
  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    ProgressCallback? onReceiveProgress,
  }) async {
    await _checkConnectivity();
    return _dio.get<T>(
      path,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
      onReceiveProgress: onReceiveProgress,
    );
  }
  
  // POST request
  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    ProgressCallback? onSendProgress,
    ProgressCallback? onReceiveProgress,
  }) async {
    await _checkConnectivity();
    return _dio.post<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
      onSendProgress: onSendProgress,
      onReceiveProgress: onReceiveProgress,
    );
  }
  
  // PUT request
  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    ProgressCallback? onSendProgress,
    ProgressCallback? onReceiveProgress,
  }) async {
    await _checkConnectivity();
    return _dio.put<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
      onSendProgress: onSendProgress,
      onReceiveProgress: onReceiveProgress,
    );
  }
  
  // PATCH request
  Future<Response<T>> patch<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    ProgressCallback? onSendProgress,
    ProgressCallback? onReceiveProgress,
  }) async {
    await _checkConnectivity();
    return _dio.patch<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
      onSendProgress: onSendProgress,
      onReceiveProgress: onReceiveProgress,
    );
  }
  
  // DELETE request
  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    await _checkConnectivity();
    return _dio.delete<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
    );
  }
  
  // Check connectivity
  Future<void> _checkConnectivity() async {
    final isConnected = await ConnectivityUtils.checkConnectivity();
    if (!isConnected) {
      throw DioException(
        requestOptions: RequestOptions(path: ''),
        error: 'No internet connection',
        type: DioExceptionType.connectionError,
      );
    }
  }
}

// Enhanced auth interceptor with auto-refresh
class _AuthInterceptor extends Interceptor {
  static bool _isRefreshing = false;
  static final List<Completer<void>> _refreshCompleters = [];

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // Skip auth for public endpoints
    final publicEndpoints = ['/auth/login', '/auth/register', '/auth/forgot-password'];
    if (publicEndpoints.any((endpoint) => options.path.contains(endpoint))) {
      return handler.next(options);
    }
    
    // Add auth token if available
    final token = await StorageService.instance.getSecureString('jwt_token');
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    
    // Add correlation ID for request tracing
    options.headers['X-Correlation-ID'] = _generateCorrelationId();
    
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    // Only handle 401 errors for authenticated endpoints
    if (err.response?.statusCode == 401 && 
        !_isPublicEndpoint(err.requestOptions.path)) {
      
      // If already refreshing, wait for it to complete
      if (_isRefreshing) {
        final completer = Completer<void>();
        _refreshCompleters.add(completer);
        await completer.future;
        
        // Retry the original request with new token
        return _retryRequest(err, handler);
      }
      
      // Start refresh process
      _isRefreshing = true;
      
      try {
        await _refreshToken();
        
        // Complete all waiting requests
        for (final completer in _refreshCompleters) {
          completer.complete();
        }
        _refreshCompleters.clear();
        
        // Retry the original request
        return _retryRequest(err, handler);
        
      } catch (refreshError) {
        // Refresh failed - complete waiters with error and sign out user
        for (final completer in _refreshCompleters) {
          completer.completeError(refreshError);
        }
        _refreshCompleters.clear();
        
        // Clear stored tokens
        await StorageService.instance.clearSecureStorage();
        
        // Let the error propagate
        return handler.next(err);
      } finally {
        _isRefreshing = false;
      }
    }
    
    handler.next(err);
  }

  Future<void> _refreshToken() async {
    final refreshToken = await StorageService.instance.getSecureString('refresh_token');
    if (refreshToken == null) {
      throw DioException(
        requestOptions: RequestOptions(path: ''),
        error: 'No refresh token available',
      );
    }

    final dio = Dio(BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      headers: {'Content-Type': 'application/json'},
    ));

    final response = await dio.post(
      '/auth/refresh',
      data: {'refreshToken': refreshToken},
    );

    // Backend returns {success: boolean, data: {tokens: {...}}}
    final responseData = response.data['data'] ?? response.data;
    final tokens = responseData['tokens'];
    await StorageService.instance.setSecureString('jwt_token', tokens['accessToken']);
    await StorageService.instance.setSecureString('refresh_token', tokens['refreshToken']);
    await StorageService.instance.setSecureString('expires_at', tokens['expiresAt']);
    await StorageService.instance.setSecureString('refresh_expires_at', tokens['refreshExpiresAt']);
  }

  Future<void> _retryRequest(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    try {
      final token = await StorageService.instance.getSecureString('jwt_token');
      if (token != null) {
        err.requestOptions.headers['Authorization'] = 'Bearer $token';
      }

      final dio = Dio();
      final response = await dio.request(
        err.requestOptions.path,
        data: err.requestOptions.data,
        queryParameters: err.requestOptions.queryParameters,
        options: Options(
          method: err.requestOptions.method,
          headers: err.requestOptions.headers,
        ),
      );

      handler.resolve(response);
    } catch (retryError) {
      handler.next(err);
    }
  }

  bool _isPublicEndpoint(String path) {
    final publicEndpoints = ['/auth/login', '/auth/register', '/auth/forgot-password'];
    return publicEndpoints.any((endpoint) => path.contains(endpoint));
  }

  String _generateCorrelationId() {
    return '${DateTime.now().millisecondsSinceEpoch}-${(DateTime.now().microsecond % 10000).toString().padLeft(4, '0')}';
  }
}

// Language interceptor
class _LanguageInterceptor extends Interceptor {
  final WidgetRef? _ref;
  
  _LanguageInterceptor(this._ref);
  
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    // Add language header from current locale or fallback to config
    String language;
    if (_ref != null) {
      try {
        final currentLocale = _ref!.read(localeProvider);
        language = currentLocale.languageCode;
      } catch (e) {
        // Fallback to config if provider is not available
        language = AppConfig.instance.defaultLanguage;
      }
    } else {
      language = AppConfig.instance.defaultLanguage;
    }
    
    options.headers['Accept-Language'] = language;
    
    handler.next(options);
  }
}

// Error interceptor
class _ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    // Handle 401 unauthorized
    if (err.response?.statusCode == 401) {
      // Token expired or invalid
      // Clear stored token and redirect to login
      StorageService.instance.clearSecureStorage();
    }
    
    handler.next(err);
  }
}