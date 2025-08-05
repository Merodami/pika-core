import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../theme/app_theme.dart';
import '../routing/app_router.dart';
import '../config/app_config.dart';
import '../services/api/api_client.dart';

// Theme providers
final appThemeProvider = Provider<AppTheme>((ref) => AppTheme());

final themeModeProvider = StateNotifierProvider<ThemeModeNotifier, ThemeMode>((ref) {
  return ThemeModeNotifier();
});

class ThemeModeNotifier extends StateNotifier<ThemeMode> {
  ThemeModeNotifier() : super(ThemeMode.system) {
    _loadThemeMode();
  }
  
  void _loadThemeMode() {
    final isDark = AppConfig.instance.isDarkMode;
    state = isDark ? ThemeMode.dark : ThemeMode.light;
  }
  
  void toggleTheme() {
    state = state == ThemeMode.light ? ThemeMode.dark : ThemeMode.light;
    AppConfig.instance.setDarkMode(state == ThemeMode.dark);
  }
  
  void setThemeMode(ThemeMode mode) {
    state = mode;
    AppConfig.instance.setDarkMode(mode == ThemeMode.dark);
  }
}

// Locale providers
final localeProvider = StateNotifierProvider<LocaleNotifier, Locale>((ref) {
  return LocaleNotifier();
});

class LocaleNotifier extends StateNotifier<Locale> {
  LocaleNotifier() : super(const Locale('es')) {
    _loadLocale();
  }
  
  void _loadLocale() {
    final language = AppConfig.instance.defaultLanguage;
    state = Locale(language);
  }
  
  Future<void> setLocale(String languageCode) async {
    state = Locale(languageCode);
    await AppConfig.instance.setLanguage(languageCode);
  }
}

// API Client provider
final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient();
});

// Router provider
final appRouterProvider = Provider<GoRouter>((ref) {
  return ref.watch(routerProvider);
});

// Loading provider
final loadingProvider = StateProvider<bool>((ref) => false);

// Error provider
final errorProvider = StateProvider<String?>((ref) => null);

// Success message provider
final successMessageProvider = StateProvider<String?>((ref) => null);