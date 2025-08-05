import 'app_localizations.dart';

class AppLocalizationsGn extends AppLocalizations {
  AppLocalizationsGn([String locale = 'gn']) : super(locale);

  @override
  String get appName => 'Pika';

  // Common
  @override
  String get yes => 'Heẽ';
  @override
  String get no => 'Nahániri';
  @override
  String get ok => 'OK';
  @override
  String get cancel => 'Jejoko';
  @override
  String get save => 'Ñongatu';
  @override
  String get delete => 'Mboguete';
  @override
  String get edit => 'Mbohekopyahu';
  @override
  String get search => 'Heka';
  @override
  String get filter => 'Mbogua';
  @override
  String get sort => 'Mohenda';
  @override
  String get loading => 'Oñemyenyhẽ hína...';
  @override
  String get error => 'Jejavy';
  @override
  String get success => 'Oĩporã';
  @override
  String get retry => 'Jey jejapo';
  @override
  String get noResults => 'Ndaipóri mba\'e ojejuhúva';
  @override
  String get seeAll => 'Hecha opavave';
  @override
  String get seeMore => 'Hecha hetave';
  @override
  String get seeLess => 'Hecha\'ỹve';

  // Auth
  @override
  String get login => 'Jeike';
  @override
  String get logout => 'Sẽ';
  @override
  String get register => 'Jehai';
  @override
  String get forgotPassword => '¿Nderesarái ñe\'ẽñemi?';
  @override
  String get email => 'Ñanduti veve';
  @override
  String get password => 'Ñe\'ẽñemi';
  @override
  String get confirmPassword => 'Moneĩ ñe\'ẽñemi';
  @override
  String get firstName => 'Téra';
  @override
  String get lastName => 'Terajoapy';
  @override
  String get phone => 'Pumbyry';
  @override
  String get role => 'Tembiapo';
  @override
  String get customer => 'Jehepyme\'ẽha';
  @override
  String get serviceProvider => 'Mba\'epytyvõha';
  @override
  String get alreadyHaveAccount => '¿Erekóma mba\'ete?';
  @override
  String get dontHaveAccount => '¿Ndereguerekói mba\'ete?';
  @override
  String get loginSuccess => 'Eike porã';
  @override
  String get registerSuccess => 'Ojehai porã';
  @override
  String get invalidEmail => 'Ñanduti veve ndoikóiva';
  @override
  String get passwordTooShort => 'Ñe\'ẽñemi mbyky';
  @override
  String get passwordsDontMatch => 'Ñe\'ẽñemi ndojojáva';
  @override
  String get fieldRequired => 'Tekotevẽ ko tenda';
  
  // Additional auth fields
  @override
  String get rememberMe => 'Che mandu\'a';
  @override
  String get or => 'TÉRÃ';

  // Navigation
  @override
  String get home => 'Óga';
  @override
  String get categories => 'Jehechaukaha';
  @override
  String get services => 'Mba\'epytyvõ';
  @override
  String get chat => 'Ñemongeta';
  @override
  String get profile => 'Che mba\'e';
  @override
  String get notifications => 'Marandu';

  // Home
  @override
  String get welcome => 'Eg̃uahẽporãite';
  @override
  String get popularCategories => 'Jehechaukaha ojeguerohorýva';
  @override
  String get featuredServices => 'Mba\'epytyvõ iporãva';
  @override
  String get nearbyProviders => 'Pytyvõhára ag̃uĩ';

  // Categories
  @override
  String get allCategories => 'Opavave jehechaukaha';
  @override
  String get selectCategory => 'Eiporavo jehechaukaha';
  @override
  String get noCategories => 'Ndaipóri jehechaukaha';

  // Services
  @override
  String get allServices => 'Opavave mba\'epytyvõ';
  @override
  String get createService => 'Moheñói mba\'epytyvõ';
  @override
  String get serviceDetails => 'Mba\'epytyvõ rehegua';
  @override
  String get bookService => 'Emondo mba\'epytyvõ';
  @override
  String get serviceBooked => 'Oñemondo mba\'epytyvõ';
  @override
  String get price => 'Tepy';
  @override
  String get duration => 'Aravo';
  @override
  String get description => 'Ñemombe\'u';
  @override
  String get availability => 'Ojepurukuaaha';
  @override
  String get reviews => 'Jehechakuaa';
  @override
  String get rating => 'Ñembohovái';
  @override
  String get noServices => 'Ndaipóri mba\'epytyvõ';

  // Chat
  @override
  String get conversations => 'Ñemongeta';
  @override
  String get newMessage => 'Marandu pyahu';
  @override
  String get typeMessage => 'Ehai marandu...';
  @override
  String get send => 'Mondo';
  @override
  String get online => 'Oĩ línea-pe';
  @override
  String get offline => 'Ndoĩri línea-pe';
  @override
  String get typing => 'Ohai hína...';
  @override
  String get lastSeen => 'Ojehecha ramo paha';
  @override
  String get noConversations => 'Ndaipóri ñemongeta';
  @override
  String get startConversation => 'Ñepyrũ ñemongeta';

  // Profile
  @override
  String get editProfile => 'Emboheko che mba\'e';
  @override
  String get myServices => 'Che mba\'epytyvõ';
  @override
  String get myBookings => 'Che jerure';
  @override
  String get settings => 'Ñemboheko';
  @override
  String get help => 'Pytyvõ';
  @override
  String get about => 'Rehegua';
  @override
  String get privacyPolicy => 'Ñemigua porureko';
  @override
  String get termsOfService => 'Jepuru mba\'e';
  @override
  String get language => 'Ñe\'ẽ';
  @override
  String get theme => 'Tema';
  @override
  String get lightTheme => 'Sakã';
  @override
  String get darkTheme => 'Pytũ';
  @override
  String get systemTheme => 'Sistema';
  @override
  String get notificationsEnabled => 'Marandu myendy';
  @override
  String get locationEnabled => 'Tendáre myendy';

  // Notifications
  @override
  String get newNotification => 'Marandu pyahu';
  @override
  String get markAllRead => 'Oñemoñe\'ẽma';
  @override
  String get clearAll => 'Mopotĩ opavave';
  @override
  String get noNotifications => 'Ndaipóri marandu';

  // Errors
  @override
  String get somethingWentWrong => 'Oĩ mba\'e vai';
  @override
  String get networkError => 'Jejavy ñandutípe';
  @override
  String get serverError => 'Jejavy servidor-pe';
  @override
  String get unauthorizedError => 'Ndereguerekói ñemoneĩ';
  @override
  String get notFoundError => 'Ndojejuhúi';
  @override
  String get validationError => 'Jejavy jehechajey';

  // Date & Time
  @override
  String get today => 'Ko árape';
  @override
  String get yesterday => 'Kuehe';
  @override
  String get tomorrow => 'Ko\'ẽrõ';
  @override
  String get justNow => 'Ko\'ág̃a';
  @override
  String minutesAgo(int minutes) => '$minutes aravo\'i ohasáva';
  @override
  String hoursAgo(int hours) => '$hours aravo ohasáva';
  @override
  String daysAgo(int days) => '$days ára ohasáva';
}