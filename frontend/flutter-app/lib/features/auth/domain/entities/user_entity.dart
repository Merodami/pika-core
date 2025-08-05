import 'package:equatable/equatable.dart';

/// User Entity - Business logic representation
/// This is a clean domain model without any external dependencies
class UserEntity extends Equatable {
  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String role;
  final bool emailVerified;
  final DateTime createdAt;
  final DateTime? lastLoginAt;
  final String? phoneNumber;
  final String? avatarUrl;
  final String status;

  const UserEntity({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.role,
    required this.emailVerified,
    required this.createdAt,
    this.lastLoginAt,
    this.phoneNumber,
    this.avatarUrl,
    this.status = 'ACTIVE',
  });

  /// Get user's full name
  String get fullName => '$firstName $lastName'.trim();

  /// Check if user is a service provider
  bool get isServiceProvider => role == 'PROVIDER';

  /// Check if user is a customer
  bool get isCustomer => role == 'CUSTOMER';

  /// Check if user is an admin
  bool get isAdmin => role == 'ADMIN';

  /// Check if user is active
  bool get isActive => status == 'ACTIVE';

  @override
  List<Object?> get props => [
        id,
        email,
        firstName,
        lastName,
        role,
        emailVerified,
        createdAt,
        lastLoginAt,
        phoneNumber,
        avatarUrl,
        status,
      ];

  /// Create a copy with updated fields
  UserEntity copyWith({
    String? id,
    String? email,
    String? firstName,
    String? lastName,
    String? role,
    bool? emailVerified,
    DateTime? createdAt,
    DateTime? lastLoginAt,
    String? phoneNumber,
    String? avatarUrl,
    String? status,
  }) {
    return UserEntity(
      id: id ?? this.id,
      email: email ?? this.email,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      role: role ?? this.role,
      emailVerified: emailVerified ?? this.emailVerified,
      createdAt: createdAt ?? this.createdAt,
      lastLoginAt: lastLoginAt ?? this.lastLoginAt,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      status: status ?? this.status,
    );
  }
}