import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/register_screen.dart';
import '../../features/auth/presentation/screens/forgot_password_screen.dart';
import '../../features/home/presentation/screens/home_screen.dart';
import '../../features/categories/presentation/screens/categories_screen.dart';
import '../../features/categories/presentation/screens/category_details_screen.dart';
import '../../features/services/presentation/screens/services_screen.dart';
import '../../features/services/presentation/screens/service_details_screen.dart';
import '../../features/services/presentation/screens/create_service_screen.dart';
import '../../features/chat/presentation/screens/conversations_screen.dart';
import '../../features/chat/presentation/screens/chat_screen.dart';
import '../../features/profile/presentation/screens/profile_screen.dart';
import '../../features/profile/presentation/screens/edit_profile_screen.dart';
import '../../features/notifications/presentation/screens/notifications_screen.dart';
import '../../shared/widgets/main_scaffold.dart';
import '../../features/auth/presentation/providers/auth_providers.dart';

part 'app_routes.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final isAuthenticated = ref.watch(isAuthenticatedProvider);
  
  return GoRouter(
    initialLocation: AppRoutes.splash,
    debugLogDiagnostics: true,
    redirect: (context, state) {
      final isAuthRoute = state.matchedLocation.startsWith('/auth');
      
      if (!isAuthenticated && !isAuthRoute && state.matchedLocation != AppRoutes.splash) {
        return AppRoutes.login;
      }
      
      if (isAuthenticated && isAuthRoute) {
        return AppRoutes.home;
      }
      
      return null;
    },
    errorBuilder: (context, state) => const ErrorScreen(),
    routes: [
      GoRoute(
        path: AppRoutes.splash,
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: AppRoutes.login,
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: AppRoutes.register,
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: AppRoutes.forgotPassword,
        builder: (context, state) => const ForgotPasswordScreen(),
      ),
      ShellRoute(
        builder: (context, state, child) => MainScaffold(child: child),
        routes: [
          GoRoute(
            path: AppRoutes.home,
            pageBuilder: (context, state) => NoTransitionPage(
              key: state.pageKey,
              child: const HomeScreen(),
            ),
          ),
          GoRoute(
            path: AppRoutes.categories,
            pageBuilder: (context, state) => NoTransitionPage(
              key: state.pageKey,
              child: const CategoriesScreen(),
            ),
            routes: [
              GoRoute(
                path: ':id',
                builder: (context, state) {
                  final categoryId = state.pathParameters['id']!;
                  return CategoryDetailsScreen(categoryId: categoryId);
                },
              ),
            ],
          ),
          GoRoute(
            path: AppRoutes.services,
            pageBuilder: (context, state) => NoTransitionPage(
              key: state.pageKey,
              child: const ServicesScreen(),
            ),
            routes: [
              GoRoute(
                path: 'create',
                builder: (context, state) => const CreateServiceScreen(),
              ),
              GoRoute(
                path: ':id',
                builder: (context, state) {
                  final serviceId = state.pathParameters['id']!;
                  return ServiceDetailsScreen(serviceId: serviceId);
                },
              ),
            ],
          ),
          GoRoute(
            path: AppRoutes.chat,
            pageBuilder: (context, state) => NoTransitionPage(
              key: state.pageKey,
              child: const ConversationsScreen(),
            ),
            routes: [
              GoRoute(
                path: ':conversationId',
                builder: (context, state) {
                  final conversationId = state.pathParameters['conversationId']!;
                  final otherUserId = state.uri.queryParameters['userId'];
                  final otherUserName = state.uri.queryParameters['userName'];
                  
                  return ChatScreen(
                    conversationId: conversationId,
                    otherUserId: otherUserId,
                    otherUserName: otherUserName,
                  );
                },
              ),
            ],
          ),
          GoRoute(
            path: AppRoutes.profile,
            pageBuilder: (context, state) => NoTransitionPage(
              key: state.pageKey,
              child: const ProfileScreen(),
            ),
            routes: [
              GoRoute(
                path: 'edit',
                builder: (context, state) => const EditProfileScreen(),
              ),
            ],
          ),
        ],
      ),
      GoRoute(
        path: AppRoutes.notifications,
        builder: (context, state) => const NotificationsScreen(),
      ),
    ],
  );
});

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkAuthStatus();
  }

  Future<void> _checkAuthStatus() async {
    await Future.delayed(const Duration(seconds: 2));
    
    if (!mounted) return;
    
    final isAuthenticated = ref.read(isAuthenticatedProvider);
    
    if (mounted) {
      if (isAuthenticated) {
        context.go(AppRoutes.home);
      } else {
        context.go(AppRoutes.login);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Logo placeholder
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primary,
                borderRadius: BorderRadius.circular(24),
              ),
              child: const Icon(
                Icons.home_repair_service,
                size: 60,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Pika',
              style: Theme.of(context).textTheme.displayMedium?.copyWith(
                color: Theme.of(context).colorScheme.primary,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 48),
            const CircularProgressIndicator(),
          ],
        ),
      ),
    );
  }
}

class ErrorScreen extends StatelessWidget {
  const ErrorScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: Theme.of(context).colorScheme.error,
            ),
            const SizedBox(height: 16),
            Text(
              'Oops! Something went wrong',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              'The page you are looking for does not exist',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.go(AppRoutes.home),
              child: const Text('Go Home'),
            ),
          ],
        ),
      ),
    );
  }
}