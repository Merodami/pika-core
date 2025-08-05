part of 'app_router.dart';

abstract class AppRoutes {
  // Auth routes
  static const String splash = '/';
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String forgotPassword = '/auth/forgot-password';
  
  // Main routes
  static const String home = '/home';
  static const String categories = '/categories';
  static const String services = '/services';
  static const String chat = '/chat';
  static const String profile = '/profile';
  static const String notifications = '/notifications';
  
  // Sub routes
  static String categoryDetails(String id) => '/categories/$id';
  static String serviceDetails(String id) => '/services/$id';
  static const String createService = '/services/create';
  static String chatConversation(String conversationId, {String? userId, String? userName}) {
    final params = <String, String>{};
    if (userId != null) params['userId'] = userId;
    if (userName != null) params['userName'] = userName;
    
    final queryString = params.isNotEmpty 
      ? '?${params.entries.map((e) => '${e.key}=${Uri.encodeComponent(e.value)}').join('&')}'
      : '';
    
    return '/chat/$conversationId$queryString';
  }
  static const String editProfile = '/profile/edit';
}