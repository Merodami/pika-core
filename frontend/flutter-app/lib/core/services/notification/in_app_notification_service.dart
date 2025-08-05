import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// Provider for in-app notifications
final inAppNotificationProvider = StateNotifierProvider<InAppNotificationNotifier, List<InAppNotification>>((ref) {
  return InAppNotificationNotifier();
});

class InAppNotification {
  final String id;
  final String title;
  final String message;
  final InAppNotificationType type;
  final DateTime timestamp;
  final Duration? duration;
  final VoidCallback? onTap;

  const InAppNotification({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    required this.timestamp,
    this.duration,
    this.onTap,
  });
}

enum InAppNotificationType {
  info,
  success,
  warning,
  error,
  chat,
  booking,
}

class InAppNotificationNotifier extends StateNotifier<List<InAppNotification>> {
  InAppNotificationNotifier() : super([]);

  void show({
    required String title,
    required String message,
    InAppNotificationType type = InAppNotificationType.info,
    Duration? duration,
    VoidCallback? onTap,
  }) {
    final notification = InAppNotification(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      title: title,
      message: message,
      type: type,
      timestamp: DateTime.now(),
      duration: duration ?? const Duration(seconds: 4),
      onTap: onTap,
    );

    state = [...state, notification];

    // Auto-remove after duration
    if (notification.duration != null) {
      Future.delayed(notification.duration!, () {
        remove(notification.id);
      });
    }
  }

  void remove(String id) {
    state = state.where((notification) => notification.id != id).toList();
  }

  void clear() {
    state = [];
  }

  // Convenience methods
  void showInfo(String title, String message, {VoidCallback? onTap}) {
    show(title: title, message: message, type: InAppNotificationType.info, onTap: onTap);
  }

  void showSuccess(String title, String message, {VoidCallback? onTap}) {
    show(title: title, message: message, type: InAppNotificationType.success, onTap: onTap);
  }

  void showWarning(String title, String message, {VoidCallback? onTap}) {
    show(title: title, message: message, type: InAppNotificationType.warning, onTap: onTap);
  }

  void showError(String title, String message, {VoidCallback? onTap}) {
    show(title: title, message: message, type: InAppNotificationType.error, onTap: onTap);
  }

  void showChatMessage(String senderName, String message, {VoidCallback? onTap}) {
    show(
      title: '💬 New Message',
      message: '$senderName: $message',
      type: InAppNotificationType.chat,
      onTap: onTap,
    );
  }

  void showBookingUpdate(String title, String message, {VoidCallback? onTap}) {
    show(
      title: '📅 $title',
      message: message,
      type: InAppNotificationType.booking,
      onTap: onTap,
    );
  }
}

// Widget to display in-app notifications
class InAppNotificationOverlay extends ConsumerWidget {
  const InAppNotificationOverlay({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifications = ref.watch(inAppNotificationProvider);

    if (notifications.isEmpty) {
      return const SizedBox.shrink();
    }

    return Positioned(
      top: MediaQuery.of(context).padding.top + 16,
      left: 16,
      right: 16,
      child: Column(
        children: notifications.map((notification) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: InAppNotificationCard(notification: notification),
          );
        }).toList(),
      ),
    );
  }
}

class InAppNotificationCard extends ConsumerWidget {
  final InAppNotification notification;

  const InAppNotificationCard({
    super.key,
    required this.notification,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final notifier = ref.read(inAppNotificationProvider.notifier);

    return Material(
      elevation: 8,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        decoration: BoxDecoration(
          color: _getBackgroundColor(theme),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: _getBorderColor(theme),
            width: 1,
          ),
        ),
        child: InkWell(
          onTap: () {
            notification.onTap?.call();
            notifier.remove(notification.id);
          },
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Icon(
                  _getIcon(),
                  color: _getIconColor(theme),
                  size: 24,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        notification.title,
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: _getTextColor(theme),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        notification.message,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: _getTextColor(theme).withOpacity(0.8),
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => notifier.remove(notification.id),
                  icon: Icon(
                    Icons.close,
                    size: 20,
                    color: _getTextColor(theme).withOpacity(0.6),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  IconData _getIcon() {
    switch (notification.type) {
      case InAppNotificationType.success:
        return Icons.check_circle;
      case InAppNotificationType.warning:
        return Icons.warning;
      case InAppNotificationType.error:
        return Icons.error;
      case InAppNotificationType.chat:
        return Icons.chat_bubble;
      case InAppNotificationType.booking:
        return Icons.event;
      case InAppNotificationType.info:
      default:
        return Icons.info;
    }
  }

  Color _getBackgroundColor(ThemeData theme) {
    switch (notification.type) {
      case InAppNotificationType.success:
        return Colors.green.shade50;
      case InAppNotificationType.warning:
        return Colors.orange.shade50;
      case InAppNotificationType.error:
        return Colors.red.shade50;
      case InAppNotificationType.chat:
        return Colors.blue.shade50;
      case InAppNotificationType.booking:
        return Colors.purple.shade50;
      case InAppNotificationType.info:
      default:
        return theme.colorScheme.surface;
    }
  }

  Color _getBorderColor(ThemeData theme) {
    switch (notification.type) {
      case InAppNotificationType.success:
        return Colors.green.shade200;
      case InAppNotificationType.warning:
        return Colors.orange.shade200;
      case InAppNotificationType.error:
        return Colors.red.shade200;
      case InAppNotificationType.chat:
        return Colors.blue.shade200;
      case InAppNotificationType.booking:
        return Colors.purple.shade200;
      case InAppNotificationType.info:
      default:
        return theme.colorScheme.outline.withOpacity(0.2);
    }
  }

  Color _getIconColor(ThemeData theme) {
    switch (notification.type) {
      case InAppNotificationType.success:
        return Colors.green.shade600;
      case InAppNotificationType.warning:
        return Colors.orange.shade600;
      case InAppNotificationType.error:
        return Colors.red.shade600;
      case InAppNotificationType.chat:
        return Colors.blue.shade600;
      case InAppNotificationType.booking:
        return Colors.purple.shade600;
      case InAppNotificationType.info:
      default:
        return theme.colorScheme.primary;
    }
  }

  Color _getTextColor(ThemeData theme) {
    switch (notification.type) {
      case InAppNotificationType.success:
        return Colors.green.shade800;
      case InAppNotificationType.warning:
        return Colors.orange.shade800;
      case InAppNotificationType.error:
        return Colors.red.shade800;
      case InAppNotificationType.chat:
        return Colors.blue.shade800;
      case InAppNotificationType.booking:
        return Colors.purple.shade800;
      case InAppNotificationType.info:
      default:
        return theme.colorScheme.onSurface;
    }
  }
}