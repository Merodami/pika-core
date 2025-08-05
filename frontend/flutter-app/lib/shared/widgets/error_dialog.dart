import 'package:flutter/material.dart';

import '../../core/exceptions/app_exceptions.dart';

/// Error Dialog Utility
/// Provides consistent error display across the app
class ErrorDialog {
  static Future<void> show(
    BuildContext context, {
    required String title,
    required String message,
    String? actionLabel,
    VoidCallback? onAction,
  }) async {
    return showDialog<void>(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          icon: Icon(
            Icons.error_outline,
            color: Theme.of(context).colorScheme.error,
            size: 48,
          ),
          title: Text(title),
          content: Text(message),
          actions: [
            if (actionLabel != null && onAction != null)
              TextButton(
                onPressed: onAction,
                child: Text(actionLabel),
              ),
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('OK'),
            ),
          ],
        );
      },
    );
  }

  /// Show error from exception with context-aware messages
  static Future<void> showFromException(
    BuildContext context,
    dynamic error, {
    String? title,
    String? actionLabel,
    VoidCallback? onAction,
  }) async {
    final errorInfo = _getErrorInfo(error);
    
    return show(
      context,
      title: title ?? errorInfo.title,
      message: errorInfo.message,
      actionLabel: actionLabel,
      onAction: onAction,
    );
  }

  /// Get user-friendly error information
  static ErrorInfo _getErrorInfo(dynamic error) {
    if (error is ValidationException) {
      return ErrorInfo(
        title: 'Invalid Input',
        message: error.message,
      );
    }

    if (error is UnauthorizedException) {
      return ErrorInfo(
        title: 'Authentication Failed',
        message: 'Invalid credentials. Please check your email and password.',
      );
    }

    if (error is ConflictException) {
      return ErrorInfo(
        title: 'Account Exists',
        message: 'This email is already registered. Try signing in instead.',
      );
    }

    if (error is NetworkException) {
      return ErrorInfo(
        title: 'Connection Error',
        message: 'Please check your internet connection and try again.',
      );
    }

    if (error is ServerException) {
      return ErrorInfo(
        title: 'Server Error',
        message: 'Something went wrong on our end. Please try again later.',
      );
    }

    if (error is NotFoundException) {
      return ErrorInfo(
        title: 'Not Found',
        message: 'The requested resource was not found.',
      );
    }

    // Default error
    return ErrorInfo(
      title: 'Error',
      message: error?.toString() ?? 'An unexpected error occurred.',
    );
  }
}

/// Error information container
class ErrorInfo {
  final String title;
  final String message;

  const ErrorInfo({
    required this.title,
    required this.message,
  });
}

/// Error Snackbar Utility
class ErrorSnackbar {
  static void show(
    BuildContext context, {
    required String message,
    Duration duration = const Duration(seconds: 4),
    String? actionLabel,
    VoidCallback? onAction,
  }) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Theme.of(context).colorScheme.error,
        duration: duration,
        action: onAction != null && actionLabel != null
            ? SnackBarAction(
                label: actionLabel,
                textColor: Colors.white,
                onPressed: onAction,
              )
            : SnackBarAction(
                label: 'Dismiss',
                textColor: Colors.white,
                onPressed: () {
                  ScaffoldMessenger.of(context).hideCurrentSnackBar();
                },
              ),
      ),
    );
  }

  /// Show error from exception
  static void showFromException(
    BuildContext context,
    dynamic error, {
    Duration duration = const Duration(seconds: 4),
    String? actionLabel,
    VoidCallback? onAction,
  }) {
    final errorInfo = ErrorDialog._getErrorInfo(error);
    
    show(
      context,
      message: errorInfo.message,
      duration: duration,
      actionLabel: actionLabel,
      onAction: onAction,
    );
  }
}

/// Success Snackbar Utility
class SuccessSnackbar {
  static void show(
    BuildContext context, {
    required String message,
    Duration duration = const Duration(seconds: 3),
  }) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(
              Icons.check_circle_outline,
              color: Colors.white,
            ),
            const SizedBox(width: 8),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: Colors.green,
        duration: duration,
      ),
    );
  }
}