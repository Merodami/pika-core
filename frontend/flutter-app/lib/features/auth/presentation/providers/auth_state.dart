import 'package:equatable/equatable.dart';

import '../../domain/entities/user_entity.dart';

/// Base Authentication State
abstract class AuthState extends Equatable {
  const AuthState();

  @override
  List<Object?> get props => [];
}

/// Initial state - checking authentication status
class AuthInitial extends AuthState {
  const AuthInitial();
}

/// Loading state - performing authentication operation
class AuthLoading extends AuthState {
  const AuthLoading();
}

/// Authenticated state - user is logged in
class AuthAuthenticated extends AuthState {
  final UserEntity user;
  final String accessToken;

  const AuthAuthenticated({
    required this.user,
    required this.accessToken,
  });

  @override
  List<Object> get props => [user, accessToken];
}

/// Unauthenticated state - user is not logged in
class AuthUnauthenticated extends AuthState {
  final String? message;

  const AuthUnauthenticated({this.message});

  @override
  List<Object?> get props => [message];
}

/// Error state - an error occurred
class AuthError extends AuthState {
  final String message;
  final Object? error;

  const AuthError({
    required this.message,
    this.error,
  });

  @override
  List<Object?> get props => [message, error];
}