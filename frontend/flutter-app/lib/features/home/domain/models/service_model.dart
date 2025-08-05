import 'package:freezed_annotation/freezed_annotation.dart';

part 'service_model.freezed.dart';
part 'service_model.g.dart';

@freezed
class ServiceModel with _$ServiceModel {
  const factory ServiceModel({
    required String id,
    required String name,
    required String description,
    required double price,
    required String providerId,
    required String categoryId,
    String? imageUrl,
    @Default(0) int duration, // in minutes
    @Default('fixed') String priceType, // fixed, hourly
    @Default(5.0) double rating,
    @Default(0) int reviewCount,
    @Default(true) bool isActive,
    @Default([]) List<String> tags,
    Map<String, dynamic>? metadata,
  }) = _ServiceModel;
  
  factory ServiceModel.fromJson(Map<String, dynamic> json) => _$ServiceModelFromJson(json);
}