import 'dart:io';
import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../utils/logger_utils.dart';
import '../storage/storage_service.dart';

// Background message handler - must be top-level function
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  LoggerUtils.info('Handling background message: ${message.messageId}');
  // Handle background message
}

class NotificationService {
  NotificationService._();
  static final instance = NotificationService._();
  
  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  
  String? _fcmToken;
  bool _isInitialized = false;
  
  String? get fcmToken => _fcmToken;
  
  Future<void> init() async {
    if (_isInitialized) return;
    
    try {
      // Initialize local notifications
      await _initializeLocalNotifications();
      
      // Request permissions
      await _requestPermissions();
      
      // Set up Firebase messaging
      await _setupFirebaseMessaging();
      
      // Get FCM token
      await _getFCMToken();
      
      _isInitialized = true;
    } catch (e) {
      LoggerUtils.error('Failed to initialize notifications', error: e);
    }
  }
  
  Future<void> _initializeLocalNotifications() async {
    // Web uses different notification system
    if (kIsWeb) {
      LoggerUtils.info('Skipping local notifications on web platform');
      return;
    }
    
    try {
      // Android initialization
      const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
      
      // iOS initialization
      final iosSettings = DarwinInitializationSettings(
        requestAlertPermission: false,
        requestBadgePermission: false,
        requestSoundPermission: false,
      );
      
      // Initialize settings
      final initSettings = InitializationSettings(
        android: androidSettings,
        iOS: iosSettings,
      );
      
      await _localNotifications.initialize(
        initSettings,
        onDidReceiveNotificationResponse: _onNotificationTapped,
      );
    } catch (e) {
      LoggerUtils.warning('Failed to initialize local notifications: $e');
    }
  }
  
  Future<void> _requestPermissions() async {
    if (!kIsWeb && Platform.isAndroid) {
      // Request notification permission for Android 13+
      if (await Permission.notification.isDenied) {
        await Permission.notification.request();
      }
    }
    
    // Request Firebase messaging permissions
    final settings = await _firebaseMessaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );
    
    LoggerUtils.info('Notification permissions: ${settings.authorizationStatus}');
  }
  
  Future<void> _setupFirebaseMessaging() async {
    // Set background message handler
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
    
    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
    
    // Handle notification taps when app is in background/terminated
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationOpen);
    
    // Check if app was opened from a notification
    final initialMessage = await _firebaseMessaging.getInitialMessage();
    if (initialMessage != null) {
      _handleNotificationOpen(initialMessage);
    }
    
    // Set foreground notification presentation options for iOS
    await _firebaseMessaging.setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );
  }
  
  Future<void> _getFCMToken() async {
    try {
      _fcmToken = await _firebaseMessaging.getToken();
      LoggerUtils.info('FCM Token: $_fcmToken');
      
      // Save token locally
      if (_fcmToken != null) {
        await StorageService.instance.setString('fcm_token', _fcmToken!);
      }
      
      // Listen for token refresh
      _firebaseMessaging.onTokenRefresh.listen((newToken) async {
        _fcmToken = newToken;
        await StorageService.instance.setString('fcm_token', newToken);
        // TODO: Update token on backend
        LoggerUtils.info('FCM Token refreshed: $newToken');
      });
    } catch (e) {
      LoggerUtils.error('Failed to get FCM token', error: e);
    }
  }
  
  void _handleForegroundMessage(RemoteMessage message) {
    LoggerUtils.info('Foreground message received: ${message.messageId}');
    
    // Show local notification
    _showLocalNotification(
      title: message.notification?.title ?? 'New Message',
      body: message.notification?.body ?? '',
      payload: message.data,
    );
    
    // Update badge count if provided
    if (message.data['badge'] != null) {
      final badgeCount = int.tryParse(message.data['badge'].toString()) ?? 0;
      _updateBadgeCount(badgeCount);
    }
  }
  
  void _handleNotificationOpen(RemoteMessage message) {
    LoggerUtils.info('Notification opened: ${message.messageId}');
    
    // Navigate based on notification type
    final type = message.data['type'];
    final entityId = message.data['entityId'];
    
    switch (type) {
      case 'MESSAGE_RECEIVED':
        final conversationId = message.data['conversationId'];
        if (conversationId != null) {
          _navigateToChat(conversationId);
        }
        break;
      case 'SERVICE_BOOKED':
        final serviceId = message.data['serviceId'];
        if (serviceId != null) {
          _navigateToService(serviceId);
        }
        break;
      case 'BOOKING_CONFIRMED':
      case 'BOOKING_CANCELLED':
        final bookingId = message.data['bookingId'];
        if (bookingId != null) {
          _navigateToBooking(bookingId);
        }
        break;
      default:
        // Navigate to notifications screen
        _navigateToNotifications();
    }
  }
  
  Future<void> _showLocalNotification({
    required String title,
    required String body,
    Map<String, dynamic>? payload,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'pika_notifications',
      'Pika Notifications',
      channelDescription: 'Notifications for Pika app',
      importance: Importance.high,
      priority: Priority.high,
      showWhen: true,
      enableVibration: true,
      enableLights: true,
    );
    
    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );
    
    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );
    
    await _localNotifications.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000, // Unique ID
      title,
      body,
      details,
      payload: payload != null ? payload.toString() : null,
    );
  }
  
  void _onNotificationTapped(NotificationResponse response) {
    LoggerUtils.info('Local notification tapped: ${response.payload}');
    
    // Parse payload and navigate
    if (response.payload != null) {
      try {
        // TODO: Parse payload and navigate
      } catch (e) {
        LoggerUtils.error('Failed to parse notification payload', error: e);
      }
    }
  }
  
  Future<void> _updateBadgeCount(int count) async {
    if (Platform.isIOS) {
      // Update badge count on iOS
      await _localNotifications
          .resolvePlatformSpecificImplementation<IOSFlutterLocalNotificationsPlugin>()
          ?.requestPermissions(badge: true);
    }
    
    // TODO: Update badge using app badge plugin
  }
  
  // Navigation methods - implement based on your navigation setup
  void _navigateToChat(String conversationId) {
    // TODO: Navigate to chat screen
  }
  
  void _navigateToService(String serviceId) {
    // TODO: Navigate to service details
  }
  
  void _navigateToBooking(String bookingId) {
    // TODO: Navigate to booking details
  }
  
  void _navigateToNotifications() {
    // TODO: Navigate to notifications screen
  }
  
  // Public methods
  
  Future<void> subscribeToTopic(String topic) async {
    await _firebaseMessaging.subscribeToTopic(topic);
    LoggerUtils.info('Subscribed to topic: $topic');
  }
  
  Future<void> unsubscribeFromTopic(String topic) async {
    await _firebaseMessaging.unsubscribeFromTopic(topic);
    LoggerUtils.info('Unsubscribed from topic: $topic');
  }
  
  Future<void> clearBadgeCount() async {
    await _updateBadgeCount(0);
  }
  
  Future<void> cancelAllNotifications() async {
    if (!kIsWeb) {
      await _localNotifications.cancelAll();
    }
  }

}