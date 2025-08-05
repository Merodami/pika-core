import 'package:firebase_performance/firebase_performance.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:flutter/foundation.dart';

/// Performance monitoring service using Firebase Performance and Crashlytics
/// Implements industry-standard monitoring practices
class PerformanceService {
  PerformanceService._();
  
  static final PerformanceService _instance = PerformanceService._();
  static PerformanceService get instance => _instance;

  late final FirebasePerformance _performance;
  late final FirebaseCrashlytics _crashlytics;
  
  bool _isInitialized = false;

  /// Initialize the performance monitoring service
  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      _performance = FirebasePerformance.instance;
      _crashlytics = FirebaseCrashlytics.instance;

      // Enable automatic screen tracking
      await _performance.setPerformanceCollectionEnabled(true);

      // Set up Crashlytics
      FlutterError.onError = _crashlytics.recordFlutterFatalError;
      PlatformDispatcher.instance.onError = (error, stack) {
        _crashlytics.recordError(error, stack, fatal: true);
        return true;
      };

      _isInitialized = true;
    } catch (e) {
      debugPrint('Failed to initialize PerformanceService: $e');
    }
  }

  /// Start a custom trace for measuring performance
  CustomTrace startTrace(String name) {
    final trace = _performance.newTrace(name);
    return CustomTrace._(trace);
  }

  /// Record a network request for performance monitoring
  Future<HttpMetric> recordHttpRequest({
    required String url,
    required HttpMethod method,
  }) async {
    final metric = _performance.newHttpMetric(url, method);
    return metric;
  }

  /// Set user identifier for crash reporting
  Future<void> setUserId(String userId) async {
    if (!_isInitialized) return;
    
    try {
      await _crashlytics.setUserIdentifier(userId);
    } catch (e) {
      debugPrint('Failed to set user ID for crashlytics: $e');
    }
  }

  /// Set custom key-value pairs for crash reporting context
  Future<void> setCustomKey(String key, dynamic value) async {
    if (!_isInitialized) return;
    
    try {
      if (value is String) {
        await _crashlytics.setCustomKey(key, value);
      } else if (value is int) {
        await _crashlytics.setCustomKey(key, value);
      } else if (value is double) {
        await _crashlytics.setCustomKey(key, value);
      } else if (value is bool) {
        await _crashlytics.setCustomKey(key, value);
      } else {
        await _crashlytics.setCustomKey(key, value.toString());
      }
    } catch (e) {
      debugPrint('Failed to set custom key for crashlytics: $e');
    }
  }

  /// Log a custom event for analytics
  void logEvent(String name, {Map<String, dynamic>? parameters}) {
    if (!_isInitialized) return;
    
    try {
      _crashlytics.log('Event: $name${parameters != null ? ' - $parameters' : ''}');
    } catch (e) {
      debugPrint('Failed to log event: $e');
    }
  }

  /// Record a non-fatal error
  Future<void> recordError(
    dynamic exception,
    StackTrace? stackTrace, {
    String? reason,
    bool fatal = false,
  }) async {
    if (!_isInitialized) return;
    
    try {
      await _crashlytics.recordError(
        exception,
        stackTrace,
        reason: reason,
        fatal: fatal,
      );
    } catch (e) {
      debugPrint('Failed to record error: $e');
    }
  }

  /// Check if crash reporting is enabled
  bool get isCrashReportingEnabled => _isInitialized;

  /// Check if performance monitoring is enabled
  bool get isPerformanceMonitoringEnabled => _isInitialized;
}

/// Custom trace wrapper for better API
class CustomTrace {
  CustomTrace._(this._trace);
  
  final Trace _trace;
  bool _isStarted = false;
  bool _isStopped = false;

  /// Start the trace
  Future<void> start() async {
    if (_isStarted || _isStopped) return;
    
    try {
      await _trace.start();
      _isStarted = true;
    } catch (e) {
      debugPrint('Failed to start trace: $e');
    }
  }

  /// Stop the trace
  Future<void> stop() async {
    if (!_isStarted || _isStopped) return;
    
    try {
      await _trace.stop();
      _isStopped = true;
    } catch (e) {
      debugPrint('Failed to stop trace: $e');
    }
  }

  /// Add a custom metric to the trace
  void setMetric(String metricName, int value) {
    if (!_isStarted || _isStopped) return;
    
    try {
      _trace.setMetric(metricName, value);
    } catch (e) {
      debugPrint('Failed to set metric: $e');
    }
  }

  /// Increment a metric value
  void incrementMetric(String metricName, int value) {
    if (!_isStarted || _isStopped) return;
    
    try {
      _trace.incrementMetric(metricName, value);
    } catch (e) {
      debugPrint('Failed to increment metric: $e');
    }
  }

  /// Add a custom attribute to the trace
  void putAttribute(String attributeName, String value) {
    if (!_isStarted || _isStopped) return;
    
    try {
      _trace.putAttribute(attributeName, value);
    } catch (e) {
      debugPrint('Failed to put attribute: $e');
    }
  }

  /// Remove a custom attribute from the trace
  void removeAttribute(String attributeName) {
    if (!_isStarted || _isStopped) return;
    
    try {
      _trace.removeAttribute(attributeName);
    } catch (e) {
      debugPrint('Failed to remove attribute: $e');
    }
  }

  /// Get the value of a custom attribute
  String? getAttribute(String attributeName) {
    if (!_isStarted) return null;
    
    try {
      return _trace.getAttribute(attributeName);
    } catch (e) {
      debugPrint('Failed to get attribute: $e');
      return null;
    }
  }

  bool get isStarted => _isStarted;
  bool get isStopped => _isStopped;
}

/// Utility functions for common performance monitoring patterns
extension PerformanceServiceExt on PerformanceService {
  /// Measure the execution time of a function
  Future<T> measureExecution<T>(
    String traceName,
    Future<T> Function() function, {
    Map<String, String>? attributes,
  }) async {
    final trace = startTrace(traceName);
    
    try {
      await trace.start();
      
      // Add custom attributes if provided
      if (attributes != null) {
        for (final entry in attributes.entries) {
          trace.putAttribute(entry.key, entry.value);
        }
      }
      
      final result = await function();
      
      await trace.stop();
      return result;
    } catch (e, stackTrace) {
      // Record the error and still stop the trace
      await recordError(e, stackTrace, reason: 'Error in $traceName');
      await trace.stop();
      rethrow;
    }
  }

  /// Measure HTTP request performance
  Future<T> measureHttpRequest<T>(
    String url,
    HttpMethod method,
    Future<T> Function() request, {
    Map<String, String>? customAttributes,
  }) async {
    final metric = await recordHttpRequest(url: url, method: method);
    
    try {
      await metric.start();
      
      // Add custom attributes if provided
      if (customAttributes != null) {
        for (final entry in customAttributes.entries) {
          metric.putAttribute(entry.key, entry.value);
        }
      }
      
      final result = await request();
      
      metric.httpResponseCode = 200; // Success
      await metric.stop();
      
      return result;
    } catch (e, stackTrace) {
      // Set error response code
      if (e.toString().contains('404')) {
        metric.httpResponseCode = 404;
      } else if (e.toString().contains('500')) {
        metric.httpResponseCode = 500;
      } else {
        metric.httpResponseCode = 400;
      }
      
      await recordError(e, stackTrace, reason: 'HTTP request failed: $url');
      await metric.stop();
      rethrow;
    }
  }
}

/// Common trace names for consistency
class TraceNames {
  static const String appStart = 'app_start';
  static const String login = 'user_login';
  static const String logout = 'user_logout';
  static const String loadCategories = 'load_categories';
  static const String loadServices = 'load_services';
  static const String sendMessage = 'send_message';
  static const String uploadFile = 'upload_file';
  static const String cacheData = 'cache_data';
  static const String databaseQuery = 'database_query';
}

/// Common metric names for consistency
class MetricNames {
  static const String itemCount = 'item_count';
  static const String cacheHits = 'cache_hits';
  static const String cacheMisses = 'cache_misses';
  static const String retryCount = 'retry_count';
  static const String fileSize = 'file_size_bytes';
  static const String processingTime = 'processing_time_ms';
}