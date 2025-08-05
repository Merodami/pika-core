import 'package:dartz/dartz.dart';

import '../entities/user_entity.dart';
import '../entities/auth_tokens_entity.dart';
import '../repositories/auth_repository.dart';
import '../../../../core/exceptions/app_exceptions.dart';

/// Register Use Case
/// Handles the business logic for user registration
class RegisterUseCase {
  final AuthRepository _repository;

  RegisterUseCase(this._repository);

  /// Execute user registration
  Future<Either<AppException, (UserEntity, AuthTokensEntity)>> call({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String role,
    String? phoneNumber,
  }) async {
    // Validate email format
    if (!_isValidEmail(email)) {
      return Left(ValidationException('Invalid email format'));
    }

    // Validate password strength
    final passwordValidation = _validatePassword(password);
    if (passwordValidation != null) {
      return Left(ValidationException(passwordValidation));
    }

    // Validate names
    if (firstName.trim().isEmpty) {
      return Left(ValidationException('First name is required'));
    }

    if (lastName.trim().isEmpty) {
      return Left(ValidationException('Last name is required'));
    }

    // Validate role
    final validRoles = ['CUSTOMER', 'PROVIDER'];
    if (!validRoles.contains(role.toUpperCase())) {
      return Left(ValidationException('Invalid role'));
    }

    // Validate phone number if provided
    if (phoneNumber != null && phoneNumber.isNotEmpty) {
      if (!_isValidPhoneNumber(phoneNumber)) {
        return Left(ValidationException('Invalid phone number format'));
      }
    }

    // Perform registration
    final result = await _repository.register(
      email: email.toLowerCase().trim(),
      password: password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: role.toUpperCase(),
      phoneNumber: phoneNumber?.trim(),
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

  /// Validate password strength
  String? _validatePassword(String password) {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }

    if (!password.contains(RegExp(r'[A-Z]'))) {
      return 'Password must contain at least one uppercase letter';
    }

    if (!password.contains(RegExp(r'[a-z]'))) {
      return 'Password must contain at least one lowercase letter';
    }

    if (!password.contains(RegExp(r'[0-9]'))) {
      return 'Password must contain at least one number';
    }

    if (!password.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>]'))) {
      return 'Password must contain at least one special character';
    }

    return null;
  }

  /// Validate phone number format
  bool _isValidPhoneNumber(String phone) {
    // Remove all non-digit characters
    final cleanPhone = phone.replaceAll(RegExp(r'\D'), '');
    
    // Check if it's between 7 and 15 digits (international standard)
    return cleanPhone.length >= 7 && cleanPhone.length <= 15;
  }
}