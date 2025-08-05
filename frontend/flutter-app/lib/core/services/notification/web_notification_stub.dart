// Stub implementation for non-web platforms

Future<void> initializeWebNotifications() async {
  // No-op for non-web platforms
}

bool isWebNotificationSupported() {
  return false;
}

Future<void> requestWebNotificationPermission() async {
  // No-op for non-web platforms
}

Future<void> showWebNotification({
  required String title,
  required String body,
  String? icon,
  String? tag,
  Map<String, dynamic>? data,
}) async {
  // No-op for non-web platforms
}

void handleWebNotificationClick(Map<String, dynamic>? data) {
  // No-op for non-web platforms
}