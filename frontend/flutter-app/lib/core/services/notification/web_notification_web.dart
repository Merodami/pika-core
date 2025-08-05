// Web-specific implementation
import 'dart:async';
import 'dart:html' as html;
import '../../utils/logger_utils.dart';

Future<void> initializeWebNotifications() async {
  try {
    LoggerUtils.info('Initializing web notifications...');
    
    // Check if notifications are supported
    if (!isWebNotificationSupported()) {
      LoggerUtils.warning('Web notifications not supported by this browser');
      return;
    }
    
    // Request permission for web notifications
    await requestWebNotificationPermission();
    
    LoggerUtils.info('Web notifications initialized successfully');
  } catch (e) {
    LoggerUtils.warning('Failed to initialize web notifications: $e');
  }
}

bool isWebNotificationSupported() {
  return html.Notification.supported ?? false;
}

Future<void> requestWebNotificationPermission() async {
  if (!isWebNotificationSupported()) return;
  
  try {
    final permission = await html.Notification.requestPermission();
    LoggerUtils.info('Web notification permission: $permission');
    
    if (permission == 'granted') {
      LoggerUtils.info('Web notification permission granted');
    } else {
      LoggerUtils.warning('Web notification permission denied');
    }
  } catch (e) {
    LoggerUtils.warning('Failed to request web notification permission: $e');
  }
}

Future<void> showWebNotification({
  required String title,
  required String body,
  String? icon,
  String? tag,
  Map<String, dynamic>? data,
}) async {
  if (!isWebNotificationSupported()) {
    LoggerUtils.warning('Web notifications not supported');
    return;
  }

  try {
    final permission = html.Notification.permission;
    if (permission != 'granted') {
      LoggerUtils.warning('Web notification permission not granted');
      return;
    }

    final notification = html.Notification(
      title,
      body: body,
      icon: icon ?? '/favicon.ico',
      tag: tag,
    );

    // Auto-close after 5 seconds
    Timer(const Duration(seconds: 5), () {
      notification.close();
    });

    // Handle notification click
    notification.onClick.listen((_) {
      // Focus the window when notification is clicked
      html.window.location.href = html.window.location.href;
      notification.close();
      
      // Handle notification click action here
      handleWebNotificationClick(data);
    });

  } catch (e) {
    LoggerUtils.error('Failed to show web notification: $e');
  }
}

void handleWebNotificationClick(Map<String, dynamic>? data) {
  LoggerUtils.info('Web notification clicked: $data');
  // Handle navigation or actions based on notification data
  // For example: navigate to specific screen, show dialog, etc.
}