import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_es.dart';
import 'app_localizations_en.dart';
import 'app_localizations_gn.dart';

abstract class AppLocalizations {
  AppLocalizations(String locale) : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate = _AppLocalizationsDelegate();

  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates = <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  static const List<Locale> supportedLocales = <Locale>[
    Locale('es'),
    Locale('en'),
    Locale('gn'),
  ];

  // App name
  String get appName;
  
  // Common
  String get yes;
  String get no;
  String get ok;
  String get cancel;
  String get save;
  String get delete;
  String get edit;
  String get search;
  String get filter;
  String get sort;
  String get loading;
  String get error;
  String get success;
  String get retry;
  String get noResults;
  String get seeAll;
  String get seeMore;
  String get seeLess;
  
  // Auth
  String get login;
  String get logout;
  String get register;
  String get forgotPassword;
  String get email;
  String get password;
  String get confirmPassword;
  String get firstName;
  String get lastName;
  String get phone;
  String get role;
  String get customer;
  String get serviceProvider;
  String get alreadyHaveAccount;
  String get dontHaveAccount;
  String get loginSuccess;
  String get registerSuccess;
  String get invalidEmail;
  String get passwordTooShort;
  String get passwordsDontMatch;
  String get fieldRequired;
  
  // Additional auth fields
  String get rememberMe;
  String get or;
  
  // Navigation
  String get home;
  String get categories;
  String get services;
  String get chat;
  String get profile;
  String get notifications;
  
  // Home
  String get welcome;
  String get popularCategories;
  String get featuredServices;
  String get nearbyProviders;
  
  // Categories
  String get allCategories;
  String get selectCategory;
  String get noCategories;
  
  // Services
  String get allServices;
  String get createService;
  String get serviceDetails;
  String get bookService;
  String get serviceBooked;
  String get price;
  String get duration;
  String get description;
  String get availability;
  String get reviews;
  String get rating;
  String get noServices;
  
  // Chat
  String get conversations;
  String get newMessage;
  String get typeMessage;
  String get send;
  String get online;
  String get offline;
  String get typing;
  String get lastSeen;
  String get noConversations;
  String get startConversation;
  
  // Profile
  String get editProfile;
  String get myServices;
  String get myBookings;
  String get settings;
  String get help;
  String get about;
  String get privacyPolicy;
  String get termsOfService;
  String get language;
  String get theme;
  String get lightTheme;
  String get darkTheme;
  String get systemTheme;
  String get notificationsEnabled;
  String get locationEnabled;
  
  // Notifications
  String get newNotification;
  String get markAllRead;
  String get clearAll;
  String get noNotifications;
  
  // Errors
  String get somethingWentWrong;
  String get networkError;
  String get serverError;
  String get unauthorizedError;
  String get notFoundError;
  String get validationError;
  
  // Date & Time
  String get today;
  String get yesterday;
  String get tomorrow;
  String get justNow;
  String minutesAgo(int minutes);
  String hoursAgo(int hours);
  String daysAgo(int days);
}

class _AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) => <String>['en', 'es', 'gn'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'es':
      return AppLocalizationsEs();
    case 'gn':
      return AppLocalizationsGn();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.'
  );
}