import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hive/hive.dart';
import '../../domain/entities/category_entity.dart';

part 'category_model.freezed.dart';
part 'category_model.g.dart';

/// Custom JSON converter for handling multilingual text fields
class MultilingualTextConverter implements JsonConverter<Map<String, String>, dynamic> {
  const MultilingualTextConverter();

  @override
  Map<String, String> fromJson(dynamic json) {
    if (json == null) return {};
    
    if (json is Map) {
      // Convert any type of map to Map<String, String>
      return json.map((key, value) => MapEntry(key.toString(), value.toString()));
    }
    
    if (json is String) {
      // If it's a plain string, treat it as Spanish text
      return {'es': json};
    }
    
    return {};
  }

  @override
  dynamic toJson(Map<String, String> object) => object;
}

/// Category data model for JSON serialization/deserialization
/// This represents the data layer model that maps to/from API responses
@freezed
@HiveType(typeId: 1)
class CategoryModel with _$CategoryModel {
  const factory CategoryModel({
    @HiveField(0) required String id,
    @HiveField(1) @MultilingualTextConverter() required Map<String, String> name,
    @HiveField(2) required String slug,
    @HiveField(3) @MultilingualTextConverter() Map<String, String>? description,
    @JsonKey(name: 'icon_url') @HiveField(4) String? iconUrl,
    @JsonKey(name: 'parent_id') @HiveField(5) String? parentId,
    @HiveField(6) @Default(1) int level,
    @HiveField(7) @Default('') String path,
    @HiveField(8) bool? active,
    @JsonKey(name: 'sort_order') @HiveField(9) @Default(0) int sortOrder,
    @JsonKey(name: 'created_at') @HiveField(10) DateTime? createdAt,
    @JsonKey(name: 'updated_at') @HiveField(11) DateTime? updatedAt,
    @HiveField(12) List<CategoryModel>? children,
  }) = _CategoryModel;

  factory CategoryModel.fromJson(Map<String, dynamic> json) =>
      _$CategoryModelFromJson(json);
}

/// Extension to convert between data model and domain entity
extension CategoryModelExt on CategoryModel {
  /// Convert data model to domain entity
  CategoryEntity toEntity([String locale = 'es']) {
    return CategoryEntity(
      id: id,
      name: _getLocalizedText(name, locale),
      slug: slug,
      description: _getLocalizedText(description, locale),
      iconUrl: iconUrl,
      parentId: parentId,
      level: level,
      path: path,
      isActive: active ?? true,
      sortOrder: sortOrder,
      translations: {...name, if (description != null) ...description!},
      createdAt: createdAt,
      updatedAt: updatedAt,
      children: children?.map((child) => child.toEntity(locale)).toList(),
    );
  }

  String _getLocalizedText(Map<String, String>? textMap, String locale) {
    if (textMap == null) return '';
    return textMap[locale] ?? textMap['es'] ?? textMap.values.first;
  }
}

/// Extension to convert from domain entity to data model
extension CategoryEntityExt on CategoryEntity {
  /// Convert domain entity to data model
  CategoryModel toModel() {
    // Extract language-specific text from translations
    final nameMap = <String, String>{};
    final descriptionMap = <String, String>{};
    
    if (translations != null) {
      // Assume translations contain name and description for different locales
      nameMap['es'] = name;
      if (description != null) {
        descriptionMap['es'] = description!;
      }
    } else {
      nameMap['es'] = name;
      if (description != null) {
        descriptionMap['es'] = description!;
      }
    }
    
    return CategoryModel(
      id: id,
      name: nameMap,
      slug: slug,
      description: descriptionMap.isNotEmpty ? descriptionMap : null,
      iconUrl: iconUrl,
      parentId: parentId,
      level: level,
      path: path,
      active: isActive,
      sortOrder: sortOrder,
      createdAt: createdAt,
      updatedAt: updatedAt,
      children: children?.map((child) => child.toModel()).toList(),
    );
  }
}