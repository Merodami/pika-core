import 'package:dartz/dartz.dart';

import '../entities/user_entity.dart';
import '../entities/auth_tokens_entity.dart';
import '../repositories/auth_repository.dart';
import '../../../../core/exceptions/app_exceptions.dart';

/// Login Use Case
/// Handles the business logic for user login
class LoginUseCase {
  final AuthRepository _repository;

  LoginUseCase(this._repository);

  /// Execute login with email and password
  Future<Either<AppException, (UserEntity, AuthTokensEntity)>> call({
    required String email,
    required String password,
  }) async {
    // Validate email format
    if (!_isValidEmail(email)) {
      return Left(ValidationException('Invalid email format'));
    }

    // Validate password is not empty
    if (password.isEmpty) {
      return Left(ValidationException('Password cannot be empty'));
    }

    // Perform login
    final result = await _repository.login(
      email: email.toLowerCase().trim(),
      password: password,
    );

    // If successful, save tokens
    return result.fold(
      (error) => Left(error),
      (data) async {
        final (user, tokens) = data;
        await _repository.saveTokens(tokens);
        return Right((user, tokens));
      },
    );
  }

  /// Validate email format
  bool _isValidEmail(String email) {
    final emailRegex = RegExp(
      r'^[a-zA-Z0-9.]+@[a-zA-Z0-9]+\.[a-zA-Z]+',
    );
    return emailRegex.hasMatch(email);
  }
}