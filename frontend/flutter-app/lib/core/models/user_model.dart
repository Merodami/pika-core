import 'package:freezed_annotation/freezed_annotation.dart';

part 'user_model.freezed.dart';
part 'user_model.g.dart';

@freezed
class UserModel with _$UserModel {
  const factory UserModel({
    required String id,
    required String email,
    @JsonKey(name: 'first_name') required String firstName,
    @JsonKey(name: 'last_name') required String lastName,
    required String role,
    @JsonKey(name: 'phone_number') String? phoneNumber,
    @JsonKey(name: 'photo_url') String? photoUrl,
    @JsonKey(name: 'email_verified_at') DateTime? emailVerifiedAt,
    @JsonKey(name: 'created_at') required DateTime createdAt,
    @JsonKey(name: 'updated_at') required DateTime updatedAt,
    @JsonKey(name: 'fcm_tokens') @Default([]) List<String> fcmTokens,
    UserProfile? profile,
  }) = _UserModel;
  
  factory UserModel.fromJson(Map<String, dynamic> json) => _$UserModelFromJson(json);
}

@freezed
class UserProfile with _$UserProfile {
  const factory UserProfile({
    String? bio,
    String? address,
    String? city,
    String? state,
    String? country,
    @JsonKey(name: 'postal_code') String? postalCode,
    double? latitude,
    double? longitude,
    @Default(5.0) double rating,
    @JsonKey(name: 'review_count') @Default(0) int reviewCount,
    @Default([]) List<String> skills,
    @Default([]) List<String> certifications,
    Map<String, dynamic>? metadata,
  }) = _UserProfile;
  
  factory UserProfile.fromJson(Map<String, dynamic> json) => _$UserProfileFromJson(json);
}

enum UserRole {
  @JsonValue('CUSTOMER')
  customer,
  @JsonValue('PROVIDER')
  provider,
  @JsonValue('ADMIN')
  admin;
  
  String get displayName {
    switch (this) {
      case UserRole.customer:
        return 'Customer';
      case UserRole.provider:
        return 'Service Provider';
      case UserRole.admin:
        return 'Administrator';
    }
  }
  
  static UserRole fromString(String role) {
    return UserRole.values.firstWhere(
      (e) => e.name.toUpperCase() == role.toUpperCase(),
      orElse: () => UserRole.customer,
    );
  }
}

// Updated authentication response to match backend
@freezed
class AuthResponse with _$AuthResponse {
  const factory AuthResponse({
    required UserModel user,
    required AuthTokens tokens,
  }) = _AuthResponse;
  
  factory AuthResponse.fromJson(Map<String, dynamic> json) => _$AuthResponseFromJson(json);
}

extension AuthResponseExtension on AuthResponse {
  String get token => tokens.accessToken;
}

@freezed
class AuthTokens with _$AuthTokens {
  const factory AuthTokens({
    @JsonKey(name: 'access_token') required String accessToken,
    @JsonKey(name: 'refresh_token') required String refreshToken,
    @JsonKey(name: 'expires_in') required int expiresIn,
  }) = _AuthTokens;
  
  factory AuthTokens.fromJson(Map<String, dynamic> json) => _$AuthTokensFromJson(json);
}