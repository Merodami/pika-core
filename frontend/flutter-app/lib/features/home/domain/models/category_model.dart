import 'package:freezed_annotation/freezed_annotation.dart';

part 'category_model.freezed.dart';
part 'category_model.g.dart';

@freezed
class CategoryModel with _$CategoryModel {
  const factory CategoryModel({
    required String id,
    required String name,
    required String slug,
    String? description,
    String? imageUrl,
    String? iconName,
    @Default(true) bool isActive,
    @Default(0) int serviceCount,
    Map<String, String>? translations,
  }) = _CategoryModel;
  
  factory CategoryModel.fromJson(Map<String, dynamic> json) => _$CategoryModelFromJson(json);
}