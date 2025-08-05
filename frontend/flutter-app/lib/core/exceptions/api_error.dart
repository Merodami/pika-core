import 'package:json_annotation/json_annotation.dart';

part 'api_error.g.dart';

/// Field-specific error information following the new standardized format
@JsonSerializable()
class FieldError {
  final String code;
  final String message;
  final String? hint;

  const FieldError({
    required this.code,
    required this.message,
    this.hint,
  });

  factory FieldError.fromJson(Map<String, dynamic> json) => _$FieldErrorFromJson(json);
  Map<String, dynamic> toJson() => _$FieldErrorToJson(this);

  @override
  String toString() => message;
}

/// Error metadata following RFC 7807 standards
@JsonSerializable()
class ErrorMeta {
  final String timestamp;
  final String path;
  final String traceId;

  const ErrorMeta({
    required this.timestamp,
    required this.path,
    required this.traceId,
  });

  factory ErrorMeta.fromJson(Map<String, dynamic> json) => _$ErrorMetaFromJson(json);
  Map<String, dynamic> toJson() => _$ErrorMetaToJson(this);
}

/// Enhanced API error model for the new standardized response format
/// Supports both old format (nested validationErrors) and new format (flat fields)
@JsonSerializable()
class ApiError {
  final String error;
  final String message;
  final int statusCode;
  final Map<String, FieldError>? fields;
  final ErrorMeta? meta;
  
  // Legacy support for old error format
  final Map<String, List<String>>? validationErrors;

  const ApiError({
    required this.error,
    required this.message,
    required this.statusCode,
    this.fields,
    this.meta,
    this.validationErrors,
  });

  factory ApiError.fromJson(Map<String, dynamic> json) {
    // Handle new format
    if (json.containsKey('fields')) {
      return _$ApiErrorFromJson(json);
    }
    
    // Handle legacy format with nested error object
    if (json.containsKey('error') && json['error'] is Map) {
      final errorObj = json['error'] as Map<String, dynamic>;
      return ApiError(
        error: errorObj['code'] ?? 'UNKNOWN_ERROR',
        message: errorObj['message'] ?? 'An error occurred',
        statusCode: json['status_code'] ?? 500,
        validationErrors: errorObj['validationErrors'] != null
            ? Map<String, List<String>>.from(
                (errorObj['validationErrors'] as Map).map(
                  (key, value) => MapEntry(
                    key.toString(),
                    List<String>.from(value as List),
                  ),
                ),
              )
            : null,
      );
    }
    
    // Handle simple error format
    return ApiError(
      error: json['error'] ?? 'UNKNOWN_ERROR',
      message: json['message'] ?? 'An error occurred',
      statusCode: json['statusCode'] ?? json['status_code'] ?? 500,
    );
  }

  Map<String, dynamic> toJson() => _$ApiErrorToJson(this);

  /// Get field-specific error message
  String? getFieldError(String fieldName) {
    // Check new format first
    if (fields != null && fields!.containsKey(fieldName)) {
      return fields![fieldName]!.message;
    }
    
    // Fallback to legacy format
    if (validationErrors != null && validationErrors!.containsKey(fieldName)) {
      final errors = validationErrors![fieldName]!;
      return errors.isNotEmpty ? errors.first : null;
    }
    
    return null;
  }

  /// Get field-specific error hint/suggestion
  String? getFieldHint(String fieldName) {
    if (fields != null && fields!.containsKey(fieldName)) {
      return fields![fieldName]!.hint;
    }
    return null;
  }

  /// Get all field errors as a map
  Map<String, String> getAllFieldErrors() {
    final Map<String, String> errors = {};
    
    // Process new format
    if (fields != null) {
      fields!.forEach((field, error) {
        errors[field] = error.message;
      });
    }
    
    // Process legacy format
    if (validationErrors != null) {
      validationErrors!.forEach((field, errorList) {
        if (errorList.isNotEmpty && !errors.containsKey(field)) {
          errors[field] = errorList.first;
        }
      });
    }
    
    return errors;
  }

  /// Check if this is a validation error
  bool get isValidationError => 
      error == 'validation_error' || 
      error == 'VALIDATION_ERROR' ||
      fields != null ||
      validationErrors != null;

  /// Get the trace ID for debugging
  String? get traceId => meta?.traceId;

  @override
  String toString() => message;
}

/// Exception wrapper for API errors
class ApiException implements Exception {
  final ApiError apiError;
  final int? statusCode;

  const ApiException(this.apiError, [this.statusCode]);

  String get message => apiError.message;
  String get errorCode => apiError.error;
  bool get isValidationError => apiError.isValidationError;
  
  /// Get field-specific error message
  String? getFieldError(String fieldName) => apiError.getFieldError(fieldName);
  
  /// Get field-specific hint
  String? getFieldHint(String fieldName) => apiError.getFieldHint(fieldName);
  
  /// Get all field errors
  Map<String, String> getAllFieldErrors() => apiError.getAllFieldErrors();

  @override
  String toString() => message;
}