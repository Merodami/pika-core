import 'package:dartz/dartz.dart';

import '../entities/user_entity.dart';
import '../entities/auth_tokens_entity.dart';
import '../repositories/auth_repository.dart';
import '../../../../core/exceptions/app_exceptions.dart';

/// Google Sign-In Use Case
/// Handles the business logic for Google authentication
class GoogleSignInUseCase {
  final AuthRepository _repository;

  GoogleSignInUseCase(this._repository);

  /// Execute Google sign-in with Firebase ID token
  Future<Either<AppException, (UserEntity, AuthTokensEntity)>> call({
    required String firebaseIdToken,
    required Map<String, dynamic> deviceInfo,
  }) async {
    // Validate Firebase ID token
    if (firebaseIdToken.isEmpty) {
      return Left(ValidationException('Firebase ID token cannot be empty'));
    }

    // Validate device info
    if (deviceInfo.isEmpty) {
      return Left(ValidationException('Device information is required'));
    }

    // Perform token exchange
    final result = await _repository.exchangeFirebaseToken(
      firebaseIdToken: firebaseIdToken,
      provider: 'google',
      deviceInfo: deviceInfo,
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
}