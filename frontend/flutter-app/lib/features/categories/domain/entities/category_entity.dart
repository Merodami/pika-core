import 'package:freezed_annotation/freezed_annotation.dart';
import '../../../../core/domain/entities/base_entity.dart';

/// Category domain entity following DDD principles
/// This represents the business domain model for categories
class CategoryEntity extends BaseEntity {
  const CategoryEntity({
    required this.id,
    required this.name,
    required this.slug,
    this.description,
    this.iconUrl,
    this.parentId,
    this.level = 1,
    this.path = '',
    this.isActive = true,
    this.sortOrder = 0,
    this.translations,
    this.createdAt,
    this.updatedAt,
    this.children,
  });

  @override
  final String id;
  final String name;
  final String slug;
  final String? description;
  final String? iconUrl;
  final String? parentId;
  final int level;
  final String path;
  final bool isActive;
  final int sortOrder;
  final Map<String, String>? translations;
  final List<CategoryEntity>? children;
  
  @override
  final DateTime? createdAt;
  
  @override
  final DateTime? updatedAt;

  /// Get localized name based on locale
  String getLocalizedName(String locale) {
    return translations?[locale] ?? name;
  }

  /// Check if category has children
  bool get hasChildren => children != null && children!.isNotEmpty;

  /// Check if category is available (active)
  bool get isAvailable => isActive;

  /// Get display name with level indication
  String get displayName => '${'  ' * (level - 1)}$name';

  /// Business rule: Category can be deleted only if it has no children
  bool canBeDeleted() => !hasChildren;

  /// Get service count from children recursively
  int get serviceCount {
    // This would typically come from a separate service count API
    // For now, return 0 as placeholder
    return 0;
  }

  /// Business rule: Category can be published only if it has description
  bool canBePublished() => description != null && description!.isNotEmpty;

  @override
  String toString() {
    return 'CategoryEntity(id: $id, name: $name, slug: $slug, level: $level, isActive: $isActive)';
  }

  /// Copy with method for immutability
  CategoryEntity copyWith({
    String? id,
    String? name,
    String? slug,
    String? description,
    String? iconUrl,
    String? parentId,
    int? level,
    String? path,
    bool? isActive,
    int? sortOrder,
    Map<String, String>? translations,
    DateTime? createdAt,
    DateTime? updatedAt,
    List<CategoryEntity>? children,
  }) {
    return CategoryEntity(
      id: id ?? this.id,
      name: name ?? this.name,
      slug: slug ?? this.slug,
      description: description ?? this.description,
      iconUrl: iconUrl ?? this.iconUrl,
      parentId: parentId ?? this.parentId,
      level: level ?? this.level,
      path: path ?? this.path,
      isActive: isActive ?? this.isActive,
      sortOrder: sortOrder ?? this.sortOrder,
      translations: translations ?? this.translations,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      children: children ?? this.children,
    );
  }
}