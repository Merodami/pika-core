import 'package:flutter_riverpod/flutter_riverpod.dart';

// Provider for unread notifications count
final unreadNotificationsCountProvider = StateProvider<int>((ref) {
  // TODO: Implement real-time notification count from Firebase
  return 0;
});