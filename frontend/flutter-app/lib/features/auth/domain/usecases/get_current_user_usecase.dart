import 'package:dartz/dartz.dart';

import '../entities/user_entity.dart';
import '../repositories/auth_repository.dart';
import '../../../../core/exceptions/app_exceptions.dart';

/// Get Current User Use Case
/// Retrieves the currently authenticated user
class GetCurrentUserUseCase {
  final AuthRepository _repository;

  GetCurrentUserUseCase(this._repository);

  /// Execute get current user
  Future<Either<AppException, UserEntity>> call() async {
    // Check if we have stored tokens
    final tokens = await _repository.getStoredTokens();
    
    if (tokens == null) {
      return Left(UnauthorizedException('No authentication tokens found'));
    }

    // Check if access token is expired
    if (tokens.isAccessTokenExpired) {
      // Try to refresh tokens
      final refreshResult = await _repository.refreshTokens(
        refreshToken: tokens.refreshToken,
      );

      return refreshResult.fold(
        (error) => Left(UnauthorizedException('Session expired')),
        (newTokens) async {
          // Save new tokens
          await _repository.saveTokens(newTokens);
          
          // Get current user with new token
          return _repository.getCurrentUser();
        },
      );
    }

    // Get current user
    return _repository.getCurrentUser();
  }
}