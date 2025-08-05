import 'package:logger/logger.dart';
import 'package:flutter/foundation.dart';

class LoggerUtils {
  static final _logger = Logger(
    printer: kIsWeb 
      ? SimplePrinter(colors: false) 
      : PrettyPrinter(
          methodCount: 0,
          errorMethodCount: 5,
          lineLength: 120,
          colors: true,
          printEmojis: true,
          dateTimeFormat: DateTimeFormat.onlyTimeAndSinceStart,
        ),
    level: kDebugMode ? Level.debug : Level.info,
  );
  
  static void debug(String message, {dynamic data}) {
    _logger.d(message, error: data);
  }
  
  static void info(String message, {dynamic data}) {
    _logger.i(message, error: data);
  }
  
  static void warning(String message, {dynamic data}) {
    _logger.w(message, error: data);
  }
  
  static void error(String message, {dynamic error, StackTrace? stackTrace}) {
    _logger.e(message, error: error, stackTrace: stackTrace);
  }
  
  static void wtf(String message, {dynamic error, StackTrace? stackTrace}) {
    _logger.f(message, error: error, stackTrace: stackTrace);
  }
}