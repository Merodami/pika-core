import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:hive_flutter/hive_flutter.dart';

import 'core/config/firebase_options.dart';
import 'core/config/app_config.dart';
import 'core/theme/app_theme.dart';
import 'core/routing/app_router.dart';
import 'core/providers/app_providers.dart';
import 'core/services/storage/storage_service.dart';
import 'core/services/notification/notification_service.dart';
import 'core/localization/app_localizations.dart';
import 'core/monitoring/performance_service.dart';
import 'features/categories/data/models/category_model.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Set preferred orientations
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Initialize Firebase
  bool firebaseInitialized = false;
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    firebaseInitialized = true;
    print('✅ Firebase initialized successfully');
    
    // Initialize Firebase Crashlytics (not supported on web)
    if (!kIsWeb) {
      try {
        // Pass all uncaught errors from the framework to Crashlytics
        FlutterError.onError = FirebaseCrashlytics.instance.recordFlutterFatalError;
        
        // Pass all uncaught asynchronous errors that aren't handled by the Flutter framework to Crashlytics
        PlatformDispatcher.instance.onError = (error, stack) {
          FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
          return true;
        };
        
        print('✅ Firebase Crashlytics initialized');
      } catch (e) {
        print('⚠️ Firebase Crashlytics initialization failed: $e');
      }
    } else {
      print('⚠️ Firebase Crashlytics is not supported on web platform');
    }
  } catch (e) {
    print('⚠️ Firebase initialization failed: $e');
    print('📱 Continuing without Firebase for local testing...');
  }

  // ✅ Connect to Firebase emulators in debug mode (only if Firebase is initialized)
  if (const bool.fromEnvironment('DEBUG', defaultValue: true) && firebaseInitialized) {
    print('🔥 Connecting to Firebase emulators...');
    
    try {
      // Use Mac IP for physical devices, localhost for simulators/web
      final emulatorHost = kIsWeb || 
          Platform.environment['FLUTTER_TEST'] == 'true' ||
          Platform.isIOS && await _isSimulator()
          ? 'localhost' 
          : '192.168.100.139';
      
      // Connect to Auth emulator
      await FirebaseAuth.instance.useAuthEmulator(emulatorHost, 9099);
      print('✅ Connected to Auth emulator on $emulatorHost:9099');
      
      // Connect to Firestore emulator
      FirebaseFirestore.instance.useFirestoreEmulator(emulatorHost, 8080);
      print('✅ Connected to Firestore emulator on $emulatorHost:8080');
      
      // Configure Firestore settings for development
      FirebaseFirestore.instance.settings = const Settings(
        persistenceEnabled: true,
        cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED,
      );
      print('✅ Firestore offline persistence enabled');
      
    } catch (e) {
      print('⚠️ Failed to connect to Firebase emulators: $e');
      print('Make sure Firebase emulators are running: firebase emulators:start');
    }
  } else {
    // Production Firebase settings
    FirebaseFirestore.instance.settings = const Settings(
      persistenceEnabled: true,
      cacheSizeBytes: 100 * 1024 * 1024, // 100MB cache
    );
  }

  // Initialize Hive for local storage
  await Hive.initFlutter();
  
  // Register Hive adapters for models
  if (!Hive.isAdapterRegistered(1)) {
    Hive.registerAdapter(CategoryModelAdapter());
  }
  
  await StorageService.instance.init();

  // Initialize performance monitoring
  await PerformanceService.instance.initialize();

  // Initialize notifications
  await NotificationService.instance.init();

  // Initialize app configuration
  await AppConfig.instance.init();

  // Print startup info
  print('🚀 Pika Flutter App Starting...');
  print('📱 API Base URL: ${AppConfig.apiBaseUrl}');
  print('🌐 Language: ${AppConfig.instance.defaultLanguage}');
  print('🎨 Dark Mode: ${AppConfig.instance.isDarkMode}');

  runApp(
    const ProviderScope(
      child: PikaApp(),
    ),
  );
}

class PikaApp extends ConsumerWidget {
  const PikaApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);
    final theme = ref.watch(appThemeProvider);
    final locale = ref.watch(localeProvider);

    return MaterialApp.router(
      title: AppConfig.appName,
      debugShowCheckedModeBanner: false,
      
      // Theme
      theme: theme.lightTheme,
      darkTheme: theme.darkTheme,
      themeMode: ref.watch(themeModeProvider),
      
      // Localization
      locale: locale,
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      
      // Routing
      routerConfig: router,
      
      // Builder for responsive text scaling and error handling
      builder: (context, child) {
        // Global error handler
        ErrorWidget.builder = (FlutterErrorDetails details) {
          // Only record to Crashlytics on non-web platforms
          if (!kIsWeb) {
            try {
              FirebaseCrashlytics.instance.recordFlutterError(details);
            } catch (e) {
              print('⚠️ Failed to record error to Crashlytics: $e');
            }
          }
          
          return MaterialApp(
            home: Scaffold(
              body: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.error_outline,
                      size: 64,
                      color: Colors.red,
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Something went wrong',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Error: ${details.exception}',
                      style: const TextStyle(fontSize: 14),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () {
                        // Restart app
                        SystemNavigator.pop();
                      },
                      child: const Text('Restart App'),
                    ),
                  ],
                ),
              ),
            ),
          );
        };
        
        return MediaQuery(
          data: MediaQuery.of(context).copyWith(
            textScaler: TextScaler.linear(
              MediaQuery.of(context).textScaleFactor.clamp(0.8, 1.2),
            ),
          ),
          child: child!,
        );
      },
    );
  }
}

// Helper function to detect iOS simulator
Future<bool> _isSimulator() async {
  if (!Platform.isIOS) return false;
  
  try {
    final deviceInfo = DeviceInfoPlugin();
    final iosInfo = await deviceInfo.iosInfo;
    return !iosInfo.isPhysicalDevice;
  } catch (e) {
    return false;
  }
}