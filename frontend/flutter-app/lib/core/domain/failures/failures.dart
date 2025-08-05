import 'package:freezed_annotation/freezed_annotation.dart';

part 'failures.freezed.dart';

/// Base failure class for all domain errors
/// Following Railway Oriented Programming pattern
@freezed
class Failure with _$Failure {
  const factory Failure.network({
    required String message,
    String? code,
    @Default(500) int statusCode,
  }) = NetworkFailure;
  
  const factory Failure.server({
    required String message,
    String? code,
    @Default(500) int statusCode,
  }) = ServerFailure;
  
  const factory Failure.cache({
    required String message,
    String? code,
  }) = CacheFailure;
  
  const factory Failure.authentication({
    required String message,
    String? code,
  }) = AuthenticationFailure;
  
  const factory Failure.authorization({
    required String message,
    String? code,
  }) = AuthorizationFailure;
  
  const factory Failure.validation({
    required String message,
    required String field,
    String? code,
  }) = ValidationFailure;
  
  const factory Failure.notFound({
    required String message,
    String? resource,
    String? code,
  }) = NotFoundFailure;
  
  const factory Failure.unexpected({
    required String message,
    String? code,
    Object? exception,
    StackTrace? stackTrace,
  }) = UnexpectedFailure;
}

/// Extension to provide user-friendly error messages
extension FailureExt on Failure {
  String get userMessage {
    return when(
      network: (message, code, statusCode) => 'Network connection error. Please check your internet connection.',
      server: (message, code, statusCode) => 'Server error. Please try again later.',
      cache: (message, code) => 'Local data error. Please restart the app.',
      authentication: (message, code) => 'Authentication failed. Please login again.',
      authorization: (message, code) => 'You don\'t have permission to access this resource.',
      validation: (message, field, code) => message,
      notFound: (message, resource, code) => 'The requested resource was not found.',
      unexpected: (message, code, exception, stackTrace) => 'An unexpected error occurred. Please try again.',
    );
  }
  
  String get technicalMessage {
    return when(
      network: (message, code, statusCode) => 'Network failure: $message (Status: $statusCode)',
      server: (message, code, statusCode) => 'Server failure: $message (Status: $statusCode)',
      cache: (message, code) => 'Cache failure: $message',
      authentication: (message, code) => 'Auth failure: $message',
      authorization: (message, code) => 'Authorization failure: $message',
      validation: (message, field, code) => 'Validation failure on $field: $message',
      notFound: (message, resource, code) => 'Not found: $message (Resource: $resource)',
      unexpected: (message, code, exception, stackTrace) => 'Unexpected failure: $message',
    );
  }
}