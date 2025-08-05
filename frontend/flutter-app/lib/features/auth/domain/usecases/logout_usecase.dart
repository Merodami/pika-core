import 'package:dartz/dartz.dart';

import '../repositories/auth_repository.dart';
import '../../../../core/exceptions/app_exceptions.dart';

/// Logout Use Case
/// Handles the business logic for user logout
class LogoutUseCase {
  final AuthRepository _repository;

  LogoutUseCase(this._repository);

  /// Execute logout
  Future<Either<AppException, Unit>> call() async {
    // Perform logout (will attempt to revoke token on backend)
    final result = await _repository.logout();

    // Clear local auth data regardless of backend result
    await _repository.clearAuthData();

    // Return the result
    return result.fold(
      // Even if backend logout fails, consider it successful
      // since we've cleared local data
      (error) => const Right(unit),
      (success) => Right(success),
    );
  }
}