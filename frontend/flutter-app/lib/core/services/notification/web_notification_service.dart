import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../utils/logger_utils.dart';

// Conditional import for web-only functionality
import 'web_notification_stub.dart'
  if (dart.library.html) 'web_notification_web.dart' as web;

class WebNotificationService {
  static WebNotificationService? _instance;
  static WebNotificationService get instance => _instance ??= WebNotificationService._();
  
  WebNotificationService._();

  Future<void> initialize() async {
    if (!kIsWeb) return;
    await web.initializeWebNotifications();
  }

  Future<void> showWebNotification({
    required String title,
    required String body,
    String? icon,
    String? tag,
    Map<String, dynamic>? data,
  }) async {
    await web.showWebNotification(
      title: title,
      body: body,
      icon: icon,
      tag: tag,
      data: data,
    );
  }
}