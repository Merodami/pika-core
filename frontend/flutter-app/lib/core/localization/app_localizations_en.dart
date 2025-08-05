import 'app_localizations.dart';

class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appName => 'Pika';

  // Common
  @override
  String get yes => 'Yes';
  @override
  String get no => 'No';
  @override
  String get ok => 'OK';
  @override
  String get cancel => 'Cancel';
  @override
  String get save => 'Save';
  @override
  String get delete => 'Delete';
  @override
  String get edit => 'Edit';
  @override
  String get search => 'Search';
  @override
  String get filter => 'Filter';
  @override
  String get sort => 'Sort';
  @override
  String get loading => 'Loading...';
  @override
  String get error => 'Error';
  @override
  String get success => 'Success';
  @override
  String get retry => 'Retry';
  @override
  String get noResults => 'No results';
  @override
  String get seeAll => 'See all';
  @override
  String get seeMore => 'See more';
  @override
  String get seeLess => 'See less';

  // Auth
  @override
  String get login => 'Login';
  @override
  String get logout => 'Logout';
  @override
  String get register => 'Register';
  @override
  String get forgotPassword => 'Forgot password?';
  @override
  String get email => 'Email';
  @override
  String get password => 'Password';
  @override
  String get confirmPassword => 'Confirm password';
  @override
  String get firstName => 'First name';
  @override
  String get lastName => 'Last name';
  @override
  String get phone => 'Phone';
  @override
  String get role => 'Role';
  @override
  String get customer => 'Customer';
  @override
  String get serviceProvider => 'Service Provider';
  @override
  String get alreadyHaveAccount => 'Already have an account?';
  @override
  String get dontHaveAccount => "Don't have an account?";
  @override
  String get loginSuccess => 'Login successful';
  @override
  String get registerSuccess => 'Registration successful';
  @override
  String get invalidEmail => 'Invalid email';
  @override
  String get passwordTooShort => 'Password is too short';
  @override
  String get passwordsDontMatch => "Passwords don't match";
  @override
  String get fieldRequired => 'This field is required';
  
  // Additional auth fields
  @override
  String get rememberMe => 'Remember me';
  @override
  String get or => 'OR';

  // Navigation
  @override
  String get home => 'Home';
  @override
  String get categories => 'Categories';
  @override
  String get services => 'Services';
  @override
  String get chat => 'Chat';
  @override
  String get profile => 'Profile';
  @override
  String get notifications => 'Notifications';

  // Home
  @override
  String get welcome => 'Welcome';
  @override
  String get popularCategories => 'Popular Categories';
  @override
  String get featuredServices => 'Featured Services';
  @override
  String get nearbyProviders => 'Nearby Providers';

  // Categories
  @override
  String get allCategories => 'All Categories';
  @override
  String get selectCategory => 'Select Category';
  @override
  String get noCategories => 'No categories available';

  // Services
  @override
  String get allServices => 'All Services';
  @override
  String get createService => 'Create Service';
  @override
  String get serviceDetails => 'Service Details';
  @override
  String get bookService => 'Book Service';
  @override
  String get serviceBooked => 'Service Booked';
  @override
  String get price => 'Price';
  @override
  String get duration => 'Duration';
  @override
  String get description => 'Description';
  @override
  String get availability => 'Availability';
  @override
  String get reviews => 'Reviews';
  @override
  String get rating => 'Rating';
  @override
  String get noServices => 'No services available';

  // Chat
  @override
  String get conversations => 'Conversations';
  @override
  String get newMessage => 'New message';
  @override
  String get typeMessage => 'Type a message...';
  @override
  String get send => 'Send';
  @override
  String get online => 'Online';
  @override
  String get offline => 'Offline';
  @override
  String get typing => 'Typing...';
  @override
  String get lastSeen => 'Last seen';
  @override
  String get noConversations => 'No conversations';
  @override
  String get startConversation => 'Start conversation';

  // Profile
  @override
  String get editProfile => 'Edit Profile';
  @override
  String get myServices => 'My Services';
  @override
  String get myBookings => 'My Bookings';
  @override
  String get settings => 'Settings';
  @override
  String get help => 'Help';
  @override
  String get about => 'About';
  @override
  String get privacyPolicy => 'Privacy Policy';
  @override
  String get termsOfService => 'Terms of Service';
  @override
  String get language => 'Language';
  @override
  String get theme => 'Theme';
  @override
  String get lightTheme => 'Light';
  @override
  String get darkTheme => 'Dark';
  @override
  String get systemTheme => 'System';
  @override
  String get notificationsEnabled => 'Notifications enabled';
  @override
  String get locationEnabled => 'Location enabled';

  // Notifications
  @override
  String get newNotification => 'New notification';
  @override
  String get markAllRead => 'Mark all as read';
  @override
  String get clearAll => 'Clear all';
  @override
  String get noNotifications => 'No notifications';

  // Errors
  @override
  String get somethingWentWrong => 'Something went wrong';
  @override
  String get networkError => 'Network error';
  @override
  String get serverError => 'Server error';
  @override
  String get unauthorizedError => 'Unauthorized';
  @override
  String get notFoundError => 'Not found';
  @override
  String get validationError => 'Validation error';

  // Date & Time
  @override
  String get today => 'Today';
  @override
  String get yesterday => 'Yesterday';
  @override
  String get tomorrow => 'Tomorrow';
  @override
  String get justNow => 'Just now';
  @override
  String minutesAgo(int minutes) => '$minutes minutes ago';
  @override
  String hoursAgo(int hours) => '$hours hours ago';
  @override
  String daysAgo(int days) => '$days days ago';
}