import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/services/notification/web_notification_service.dart';

class WebNotificationTest extends ConsumerWidget {
  const WebNotificationTest({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Only show on web in debug mode
    if (!kIsWeb || !kDebugMode) {
      return const SizedBox.shrink();
    }

    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.notifications_active,
                        color: Colors.blue.shade700,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Web Notifications Test',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Colors.blue.shade700,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Test browser notifications (only visible in debug mode)',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      ElevatedButton(
                        onPressed: () => _testNotification(context),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                        ),
                        child: const Text(
                          'Test Notification',
                          style: TextStyle(fontSize: 12),
                        ),
                      ),
                      const SizedBox(width: 12),
                      ElevatedButton(
                        onPressed: () => _testChatNotification(context),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                        ),
                        child: const Text(
                          'Test Chat Message',
                          style: TextStyle(fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _testNotification(BuildContext context) async {
    try {
      await WebNotificationService.instance.showWebNotification(
        title: '🎉 Pika Test Notification',
        body: 'This is a test notification from your Pika app!',
        tag: 'test-notification',
        data: {
          'type': 'test',
          'action': 'open_app',
        },
      );
      
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Test notification sent! Check your browser.'),
            duration: Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to send notification: $e'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    }
  }

  void _testChatNotification(BuildContext context) async {
    try {
      await WebNotificationService.instance.showWebNotification(
        title: '💬 New Message',
        body: 'John Doe: Hey! Are you available for the plumbing service?',
        tag: 'chat-message',
        data: {
          'type': 'chat',
          'conversationId': 'test-123',
          'userId': 'john-doe',
        },
      );
      
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Chat notification sent! Check your browser.'),
            duration: Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to send notification: $e'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    }
  }
}