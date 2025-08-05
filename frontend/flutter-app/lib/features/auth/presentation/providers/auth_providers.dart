import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'auth_state.dart';
import 'auth_notifier.dart';
import '../../domain/repositories/auth_repository.dart';
import '../../domain/usecases/login_usecase.dart';
import '../../domain/usecases/register_usecase.dart';
import '../../domain/usecases/logout_usecase.dart';
import '../../domain/usecases/get_current_user_usecase.dart';
import '../../domain/usecases/google_signin_usecase.dart';
import '../../domain/usecases/facebook_signin_usecase.dart';
import '../../data/repositories/auth_repository_impl.dart';
import '../../data/datasources/auth_remote_data_source.dart';
import '../../data/datasources/auth_local_data_source.dart';
import '../../../../core/providers/app_providers.dart';
import '../../domain/entities/user_entity.dart';

/// Remote Data Source Provider
final authRemoteDataSourceProvider = Provider<AuthRemoteDataSource>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return AuthRemoteDataSourceImpl(apiClient);
});

/// Local Data Source Provider
final authLocalDataSourceProvider = Provider<AuthLocalDataSource>((ref) {
  return AuthLocalDataSourceImpl();
});

/// Auth Repository Provider
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final remoteDataSource = ref.watch(authRemoteDataSourceProvider);
  final localDataSource = ref.watch(authLocalDataSourceProvider);
  
  return AuthRepositoryImpl(
    remoteDataSource: remoteDataSource,
    localDataSource: localDataSource,
  );
});

/// Login Use Case Provider
final loginUseCaseProvider = Provider<LoginUseCase>((ref) {
  final repository = ref.watch(authRepositoryProvider);
  return LoginUseCase(repository);
});

/// Register Use Case Provider
final registerUseCaseProvider = Provider<RegisterUseCase>((ref) {
  final repository = ref.watch(authRepositoryProvider);
  return RegisterUseCase(repository);
});

/// Logout Use Case Provider
final logoutUseCaseProvider = Provider<LogoutUseCase>((ref) {
  final repository = ref.watch(authRepositoryProvider);
  return LogoutUseCase(repository);
});

/// Get Current User Use Case Provider
final getCurrentUserUseCaseProvider = Provider<GetCurrentUserUseCase>((ref) {
  final repository = ref.watch(authRepositoryProvider);
  return GetCurrentUserUseCase(repository);
});

/// Google Sign-In Use Case Provider
final googleSignInUseCaseProvider = Provider<GoogleSignInUseCase>((ref) {
  final repository = ref.watch(authRepositoryProvider);
  return GoogleSignInUseCase(repository);
});

/// Facebook Sign-In Use Case Provider
final facebookSignInUseCaseProvider = Provider<FacebookSignInUseCase>((ref) {
  final repository = ref.watch(authRepositoryProvider);
  return FacebookSignInUseCase(repository);
});

/// Auth State Provider
final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final loginUseCase = ref.watch(loginUseCaseProvider);
  final registerUseCase = ref.watch(registerUseCaseProvider);
  final logoutUseCase = ref.watch(logoutUseCaseProvider);
  final getCurrentUserUseCase = ref.watch(getCurrentUserUseCaseProvider);
  final googleSignInUseCase = ref.watch(googleSignInUseCaseProvider);
  final facebookSignInUseCase = ref.watch(facebookSignInUseCaseProvider);
  final authRepository = ref.watch(authRepositoryProvider);

  return AuthNotifier(
    loginUseCase: loginUseCase,
    registerUseCase: registerUseCase,
    logoutUseCase: logoutUseCase,
    getCurrentUserUseCase: getCurrentUserUseCase,
    googleSignInUseCase: googleSignInUseCase,
    facebookSignInUseCase: facebookSignInUseCase,
    authRepository: authRepository,
  );
});

/// Convenience getters for auth state
final isAuthenticatedProvider = Provider<bool>((ref) {
  final authState = ref.watch(authStateProvider);
  return authState is AuthAuthenticated;
});

final currentUserProvider = Provider<UserEntity?>((ref) {
  final authState = ref.watch(authStateProvider);
  return authState is AuthAuthenticated ? authState.user : null;
});

final isLoadingProvider = Provider<bool>((ref) {
  final authState = ref.watch(authStateProvider);
  return authState is AuthLoading;
});