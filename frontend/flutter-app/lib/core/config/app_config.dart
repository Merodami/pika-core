import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppConfig {
  AppConfig._();
  static final instance = AppConfig._();

  late SharedPreferences _prefs;
  
  static const String appName = 'Pika';
  static const String appVersion = '1.0.0';
  
  // API Configuration - Route through API Gateway
  static String get apiBaseUrl {
    // First check if API_BASE_URL is provided (used by yarn scripts)
    const providedUrl = String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: '',
    );
    
    if (providedUrl.isNotEmpty) {
      return providedUrl;
    }
    
    if (kDebugMode) {
      // Check if running on physical device vs simulator/web
      // You can override this with --dart-define=API_HOST=your.ip.address
      const apiHost = String.fromEnvironment(
        'API_HOST',
        defaultValue: '',
      );
      
      if (apiHost.isNotEmpty) {
        // Use provided host (for physical devices)
        return 'http://$apiHost:8000/api/v1';
      }
      
      // Default to localhost for web/simulator
      return 'http://localhost:8000/api/v1';
    }
    
    // Production URL
    return 'https://api.pika.com/api/v1';
  }
  
  // Firebase Configuration
  static const String firebaseProjectId = String.fromEnvironment(
    'FIREBASE_PROJECT_ID',
    defaultValue: 'pika-demo',
  );
  
  // Feature Flags
  bool _enableChat = true;
  bool _enableNotifications = true;
  bool _enableLocation = false;
  
  bool get enableChat => _enableChat;
  bool get enableNotifications => _enableNotifications;
  bool get enableLocation => _enableLocation;
  
  // App Settings
  String _defaultLanguage = 'es';
  bool _isDarkMode = false;
  
  String get defaultLanguage => _defaultLanguage;
  bool get isDarkMode => _isDarkMode;
  
  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
    _loadSettings();
  }
  
  void _loadSettings() {
    _defaultLanguage = _prefs.getString('language') ?? 'es';
    _isDarkMode = _prefs.getBool('darkMode') ?? false;
    _enableChat = _prefs.getBool('enableChat') ?? true;
    _enableNotifications = _prefs.getBool('enableNotifications') ?? true;
    _enableLocation = _prefs.getBool('enableLocation') ?? false;
  }
  
  Future<void> setLanguage(String language) async {
    _defaultLanguage = language;
    await _prefs.setString('language', language);
  }
  
  Future<void> setDarkMode(bool isDark) async {
    _isDarkMode = isDark;
    await _prefs.setBool('darkMode', isDark);
  }
  
  Future<void> setFeatureFlag(String flag, bool value) async {
    switch (flag) {
      case 'chat':
        _enableChat = value;
        await _prefs.setBool('enableChat', value);
        break;
      case 'notifications':
        _enableNotifications = value;
        await _prefs.setBool('enableNotifications', value);
        break;
      case 'location':
        _enableLocation = value;
        await _prefs.setBool('enableLocation', value);
        break;
    }
  }
}