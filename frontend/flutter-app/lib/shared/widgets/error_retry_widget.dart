import 'package:flutter/material.dart';
import '../../core/domain/failures/failures.dart';

/// Reusable error widget with retry functionality
/// Follows Material 3 design principles and accessibility guidelines
class ErrorRetryWidget extends StatelessWidget {
  const ErrorRetryWidget({
    super.key,
    required this.error,
    required this.onRetry,
    this.message,
    this.showDetails = false,
  });

  final Object error;
  final VoidCallback onRetry;
  final String? message;
  final bool showDetails;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Error icon
            Icon(
              _getErrorIcon(),
              size: 64,
              color: colorScheme.error,
            ),
            const SizedBox(height: 16),
            
            // Error title
            Text(
              _getErrorTitle(context),
              style: theme.textTheme.titleLarge?.copyWith(
                color: colorScheme.onSurface,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            
            // Error message
            Text(
              _getErrorMessage(context),
              style: theme.textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
            
            // Error details (if requested)
            if (showDetails) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: colorScheme.errorContainer,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  error.toString(),
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: colorScheme.onErrorContainer,
                    fontFamily: 'monospace',
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ],
            
            const SizedBox(height: 24),
            
            // Retry button
            FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Try Again'),
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 12,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  IconData _getErrorIcon() {
    if (error is Failure) {
      final failure = error as Failure;
      return failure.when(
        network: (_, __, ___) => Icons.wifi_off,
        server: (_, __, ___) => Icons.cloud_off,
        cache: (_, __) => Icons.storage,
        authentication: (_, __) => Icons.lock,
        authorization: (_, __) => Icons.security,
        validation: (_, __, ___) => Icons.error_outline,
        notFound: (_, __, ___) => Icons.search_off,
        unexpected: (_, __, ___, ____) => Icons.error,
      );
    }
    return Icons.error_outline;
  }

  String _getErrorTitle(BuildContext context) {
    if (error is Failure) {
      final failure = error as Failure;
      return failure.when(
        network: (_, __, ___) => 'Connection Problem',
        server: (_, __, ___) => 'Server Error',
        cache: (_, __) => 'Storage Error',
        authentication: (_, __) => 'Authentication Required',
        authorization: (_, __) => 'Access Denied',
        validation: (_, __, ___) => 'Invalid Data',
        notFound: (_, __, ___) => 'Not Found',
        unexpected: (_, __, ___, ____) => 'Something Went Wrong',
      );
    }
    return 'Error Occurred';
  }

  String _getErrorMessage(BuildContext context) {
    if (message != null) {
      return message!;
    }
    
    if (error is Failure) {
      final failure = error as Failure;
      return failure.userMessage;
    }
    
    return 'An unexpected error occurred. Please try again.';
  }
}