import '../../domain/entities/user_entity.dart';

/// User Data Transfer Object
/// Maps between API JSON and domain entity
class UserDto {
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

  const UserDto({
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

  /// Create UserDto from JSON
  factory UserDto.fromJson(Map<String, dynamic> json) {
    return UserDto(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      firstName: json['first_name'] ?? json['firstName'] ?? '',
      lastName: json['last_name'] ?? json['lastName'] ?? '',
      role: json['role'] ?? 'CUSTOMER',
      emailVerified: json['email_verified'] ?? json['emailVerified'] ?? true,
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at'])
          : json['createdAt'] != null 
              ? DateTime.parse(json['createdAt'])
              : DateTime.now(),
      lastLoginAt: json['last_login_at'] != null 
          ? DateTime.parse(json['last_login_at']) 
          : json['lastLoginAt'] != null 
              ? DateTime.parse(json['lastLoginAt'])
              : null,
      phoneNumber: json['phone_number'] ?? json['phoneNumber'],
      avatarUrl: json['avatar_url'] ?? json['avatarUrl'],
      status: json['status'] ?? 'ACTIVE',
    );
  }

  /// Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'first_name': firstName,
      'last_name': lastName,
      'role': role,
      'email_verified': emailVerified,
      'created_at': createdAt.toIso8601String(),
      'last_login_at': lastLoginAt?.toIso8601String(),
      'phone_number': phoneNumber,
      'avatar_url': avatarUrl,
      'status': status,
    };
  }

  /// Convert to domain entity
  UserEntity toEntity() => UserEntity(
        id: id,
        email: email,
        firstName: firstName,
        lastName: lastName,
        role: role,
        emailVerified: emailVerified,
        createdAt: createdAt,
        lastLoginAt: lastLoginAt,
        phoneNumber: phoneNumber,
        avatarUrl: avatarUrl,
        status: status,
      );

  /// Create UserDto from domain entity
  static UserDto fromEntity(UserEntity entity) => UserDto(
        id: entity.id,
        email: entity.email,
        firstName: entity.firstName,
        lastName: entity.lastName,
        role: entity.role,
        emailVerified: entity.emailVerified,
        createdAt: entity.createdAt,
        lastLoginAt: entity.lastLoginAt,
        phoneNumber: entity.phoneNumber,
        avatarUrl: entity.avatarUrl,
        status: entity.status,
      );
}