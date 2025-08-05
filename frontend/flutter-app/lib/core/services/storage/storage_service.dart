import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

class StorageService {
  StorageService._();
  static final instance = StorageService._();
  
  late final FlutterSecureStorage _secureStorage;
  late final SharedPreferences _prefs;
  late final Box<dynamic> _cacheBox;
  
  // Box names
  static const String _cacheBoxName = 'cache';
  static const String _userBoxName = 'user';
  static const String _settingsBoxName = 'settings';
  
  Future<void> init() async {
    // Initialize secure storage
    _secureStorage = const FlutterSecureStorage();
    
    // Initialize shared preferences
    _prefs = await SharedPreferences.getInstance();
    
    // Initialize Hive boxes
    _cacheBox = await Hive.openBox(_cacheBoxName);
    await Hive.openBox(_userBoxName);
    await Hive.openBox(_settingsBoxName);
  }
  
  // Secure Storage Methods (for sensitive data like tokens)
  
  Future<void> setSecureString(String key, String value) async {
    await _secureStorage.write(key: key, value: value);
  }
  
  Future<String?> getSecureString(String key) async {
    return await _secureStorage.read(key: key);
  }
  
  Future<void> deleteSecureString(String key) async {
    await _secureStorage.delete(key: key);
  }
  
  // Alias for deleteSecureString to match the auth data source expectations
  Future<void> deleteSecureData(String key) async {
    await deleteSecureString(key);
  }
  
  Future<void> clearSecureStorage() async {
    await _secureStorage.deleteAll();
  }
  
  // Shared Preferences Methods (for simple key-value pairs)
  
  Future<bool> setBool(String key, bool value) async {
    return await _prefs.setBool(key, value);
  }
  
  bool? getBool(String key) {
    return _prefs.getBool(key);
  }
  
  Future<bool> setString(String key, String value) async {
    return await _prefs.setString(key, value);
  }
  
  String? getString(String key) {
    return _prefs.getString(key);
  }
  
  Future<bool> setInt(String key, int value) async {
    return await _prefs.setInt(key, value);
  }
  
  int? getInt(String key) {
    return _prefs.getInt(key);
  }
  
  Future<bool> setDouble(String key, double value) async {
    return await _prefs.setDouble(key, value);
  }
  
  double? getDouble(String key) {
    return _prefs.getDouble(key);
  }
  
  Future<bool> setStringList(String key, List<String> value) async {
    return await _prefs.setStringList(key, value);
  }
  
  List<String>? getStringList(String key) {
    return _prefs.getStringList(key);
  }
  
  Future<bool> remove(String key) async {
    return await _prefs.remove(key);
  }
  
  // Hive Methods (for complex data and offline caching)
  
  Future<void> setCachedData(String key, dynamic value, {Duration? expiry}) async {
    final data = {
      'value': value,
      'timestamp': DateTime.now().millisecondsSinceEpoch,
      'expiry': expiry?.inMilliseconds,
    };
    await _cacheBox.put(key, jsonEncode(data));
  }
  
  dynamic getCachedData(String key) {
    final jsonString = _cacheBox.get(key);
    if (jsonString == null) return null;
    
    try {
      final data = jsonDecode(jsonString);
      final timestamp = data['timestamp'] as int;
      final expiry = data['expiry'] as int?;
      
      if (expiry != null) {
        final now = DateTime.now().millisecondsSinceEpoch;
        if (now - timestamp > expiry) {
          // Data expired
          _cacheBox.delete(key);
          return null;
        }
      }
      
      return data['value'];
    } catch (e) {
      return null;
    }
  }
  
  Future<void> deleteCachedData(String key) async {
    await _cacheBox.delete(key);
  }
  
  Future<void> clearCache() async {
    await _cacheBox.clear();
  }
  
  // User data methods
  
  Future<void> saveUserData(Map<String, dynamic> userData) async {
    final userBox = Hive.box(_userBoxName);
    await userBox.put('current_user', jsonEncode(userData));
  }
  
  Map<String, dynamic>? getUserData() {
    final userBox = Hive.box(_userBoxName);
    final jsonString = userBox.get('current_user');
    if (jsonString == null) return null;
    
    try {
      return jsonDecode(jsonString) as Map<String, dynamic>;
    } catch (e) {
      return null;
    }
  }
  
  Future<void> clearUserData() async {
    final userBox = Hive.box(_userBoxName);
    await userBox.clear();
  }
  
  // Settings methods
  
  Future<void> setSetting(String key, dynamic value) async {
    final settingsBox = Hive.box(_settingsBoxName);
    await settingsBox.put(key, value);
  }
  
  dynamic getSetting(String key, {dynamic defaultValue}) {
    final settingsBox = Hive.box(_settingsBoxName);
    return settingsBox.get(key, defaultValue: defaultValue);
  }
  
  Future<void> clearSettings() async {
    final settingsBox = Hive.box(_settingsBoxName);
    await settingsBox.clear();
  }
  
  // Clear all storage
  Future<void> clearAll() async {
    await clearSecureStorage();
    await _prefs.clear();
    await clearCache();
    await clearUserData();
    await clearSettings();
  }
}