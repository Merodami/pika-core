abstract class AppException implements Exception {
  final String message;
  final String? code;
  
  const AppException(this.message, [this.code]);
  
  @override
  String toString() => message;
}

class NetworkException extends AppException {
  const NetworkException(String message, [String? code]) : super(message, code);
}

class ServerException extends AppException {
  const ServerException(String message, [String? code]) : super(message, code);
}

class ValidationException extends AppException {
  const ValidationException(String message, [String? code]) : super(message, code);
}

/// Enhanced validation exception with field-specific error support
class ValidationExceptionWithFields extends ValidationException {
  final Map<String, String> fieldErrors;
  final dynamic apiError;

  const ValidationExceptionWithFields(
    String message,
    String? code,
    this.fieldErrors,
    this.apiError,
  ) : super(message, code);

  /// Get error message for a specific field
  String? getFieldError(String fieldName) => fieldErrors[fieldName];

  /// Get all field errors
  Map<String, String> getAllFieldErrors() => fieldErrors;

  /// Check if there are any field errors
  bool get hasFieldErrors => fieldErrors.isNotEmpty;
}

class UnauthorizedException extends AppException {
  const UnauthorizedException(String message, [String? code]) : super(message, code);
}

class NotFoundException extends AppException {
  const NotFoundException(String message, [String? code]) : super(message, code);
}

class ConflictException extends AppException {
  const ConflictException(String message, [String? code]) : super(message, code);
}

class CacheException extends AppException {
  const CacheException(String message, [String? code]) : super(message, code);
}

class FirebaseException extends AppException {
  const FirebaseException(String message, [String? code]) : super(message, code);
}