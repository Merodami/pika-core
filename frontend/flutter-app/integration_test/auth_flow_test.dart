import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:pika_app/main.dart' as app;
import 'package:pika_app/core/config/app_config.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Auth Flow Integration Tests', () {
    // Test user data
    const testUser = {
      'email': 'flutter@test.com',
      'password': 'SecurePass123!',
      'firstName': 'Flutter',
      'lastName': 'Test',
      'phoneNumber': '+34600000777',
    };

    setUpAll(() async {
      // Ensure backend is reachable
      // You might want to add a health check here
    });

    testWidgets('Complete registration and login flow', (WidgetTester tester) async {
      // Start the app
      app.main();
      await tester.pumpAndSettle();

      // Wait for app to initialize
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Should start on login screen or home screen
      // Navigate to registration if needed
      if (find.text('Register').hasFound) {
        await tester.tap(find.text('Register'));
        await tester.pumpAndSettle();
      } else if (find.text('Create Account').hasFound) {
        await tester.tap(find.text('Create Account'));
        await tester.pumpAndSettle();
      }

      // Fill registration form
      await tester.enterText(
        find.byKey(const Key('email_field')), 
        testUser['email']!
      );
      await tester.enterText(
        find.byKey(const Key('password_field')), 
        testUser['password']!
      );
      await tester.enterText(
        find.byKey(const Key('firstName_field')), 
        testUser['firstName']!
      );
      await tester.enterText(
        find.byKey(const Key('lastName_field')), 
        testUser['lastName']!
      );
      await tester.enterText(
        find.byKey(const Key('phoneNumber_field')), 
        testUser['phoneNumber']!
      );

      // Select customer role if role selector exists
      final roleSelector = find.byKey(const Key('role_selector'));
      if (roleSelector.hasFound) {
        await tester.tap(roleSelector);
        await tester.pumpAndSettle();
        await tester.tap(find.text('Customer'));
        await tester.pumpAndSettle();
      }

      // Submit registration
      await tester.tap(find.byKey(const Key('register_button')));
      
      // Wait for API call and navigation
      await tester.pumpAndSettle(const Duration(seconds: 5));

      // Should navigate to home screen or dashboard after successful registration
      expect(
        find.byKey(const Key('home_screen')).or(find.text('Welcome')), 
        findsOneWidget,
        reason: 'Should navigate to home screen after successful registration'
      );

      // Logout to test login flow
      final logoutButton = find.byKey(const Key('logout_button'));
      if (logoutButton.hasFound) {
        await tester.tap(logoutButton);
        await tester.pumpAndSettle();
      } else {
        // Navigate to profile and logout
        await tester.tap(find.byIcon(Icons.person));
        await tester.pumpAndSettle();
        await tester.tap(find.byKey(const Key('logout_button')));
        await tester.pumpAndSettle();
      }

      // Should be back to login screen
      expect(find.text('Login'), findsOneWidget);

      // Test login with registered credentials
      await tester.enterText(
        find.byKey(const Key('email_field')), 
        testUser['email']!
      );
      await tester.enterText(
        find.byKey(const Key('password_field')), 
        testUser['password']!
      );

      await tester.tap(find.byKey(const Key('login_button')));
      await tester.pumpAndSettle(const Duration(seconds: 5));

      // Should navigate to home screen after successful login
      expect(
        find.byKey(const Key('home_screen')).or(find.text('Welcome')), 
        findsOneWidget,
        reason: 'Should navigate to home screen after successful login'
      );
    });

    testWidgets('Registration validation errors', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Navigate to registration
      if (find.text('Register').hasFound) {
        await tester.tap(find.text('Register'));
        await tester.pumpAndSettle();
      }

      // Try to submit empty form
      await tester.tap(find.byKey(const Key('register_button')));
      await tester.pumpAndSettle();

      // Should show validation errors
      expect(find.text('Email is required'), findsOneWidget);
      expect(find.text('Password is required'), findsOneWidget);

      // Test invalid email
      await tester.enterText(
        find.byKey(const Key('email_field')), 
        'invalid-email'
      );
      await tester.tap(find.byKey(const Key('register_button')));
      await tester.pumpAndSettle();

      expect(find.text('Please enter a valid email'), findsOneWidget);

      // Test weak password
      await tester.enterText(
        find.byKey(const Key('email_field')), 
        'test@test.com'
      );
      await tester.enterText(
        find.byKey(const Key('password_field')), 
        '123'
      );
      await tester.tap(find.byKey(const Key('register_button')));
      await tester.pumpAndSettle();

      expect(
        find.text('Password must be at least 8 characters'), 
        findsOneWidget
      );
    });

    testWidgets('Login with invalid credentials', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Should start on login screen
      await tester.enterText(
        find.byKey(const Key('email_field')), 
        'nonexistent@test.com'
      );
      await tester.enterText(
        find.byKey(const Key('password_field')), 
        'wrongpassword'
      );

      await tester.tap(find.byKey(const Key('login_button')));
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Should show error message
      expect(
        find.text('Invalid email or password'), 
        findsOneWidget
      );
    });

    testWidgets('Network error handling', (WidgetTester tester) async {
      // This test would require mocking the API client or using a test server
      // that can simulate network failures
      
      app.main();
      await tester.pumpAndSettle();

      // You could temporarily change the API base URL to an unreachable endpoint
      // and test how the app handles network errors
      
      // For now, this is a placeholder for testing network error scenarios
    });
  });
}

// Helper extension for better test readability
extension FinderExtension on Finder {
  bool get hasFound => evaluate().isNotEmpty;
}