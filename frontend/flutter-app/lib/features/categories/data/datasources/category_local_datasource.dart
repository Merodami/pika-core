import 'package:hive/hive.dart';
import '../models/category_model.dart';

/// Local data source for category caching
/// Implements offline-first architecture with Hive
abstract class CategoryLocalDataSource {
  /// Cache categories from API response
  Future<void> cacheCategories(List<CategoryModel> categories);

  /// Get cached categories
  Future<List<CategoryModel>?> getCachedCategories();

  /// Cache single category
  Future<void> cacheCategory(CategoryModel category);

  /// Get cached category by ID
  Future<CategoryModel?> getCachedCategoryById(String id);

  /// Get cached category by slug
  Future<CategoryModel?> getCachedCategoryBySlug(String slug);

  /// Cache featured categories
  Future<void> cacheFeaturedCategories(List<CategoryModel> categories);

  /// Get cached featured categories
  Future<List<CategoryModel>?> getCachedFeaturedCategories();

  /// Clear all cached categories
  Future<void> clearCache();

  /// Check if cache is expired
  bool isCacheExpired();

  /// Update cache timestamp
  Future<void> updateCacheTimestamp();
}

/// Implementation of local data source using Hive
class CategoryLocalDataSourceImpl implements CategoryLocalDataSource {
  CategoryLocalDataSourceImpl({
    required Box<CategoryModel> categoryBox,
    required Box<dynamic> metadataBox,
  })  : _categoryBox = categoryBox,
        _metadataBox = metadataBox;

  final Box<CategoryModel> _categoryBox;
  final Box<dynamic> _metadataBox;

  static const String _categoriesKey = 'categories';
  static const String _featuredCategoriesKey = 'featured_categories';
  static const String _cacheTimestampKey = 'cache_timestamp';
  static const Duration _cacheValidDuration = Duration(hours: 1);

  @override
  Future<void> cacheCategories(List<CategoryModel> categories) async {
    // Clear existing categories
    await _categoryBox.clear();
    
    // Store categories with their IDs as keys
    final Map<String, CategoryModel> categoryMap = {
      for (final category in categories) category.id: category,
    };
    
    await _categoryBox.putAll(categoryMap);
    
    // Store category IDs list for ordering
    await _metadataBox.put(_categoriesKey, categories.map((c) => c.id).toList());
    await updateCacheTimestamp();
  }

  @override
  Future<List<CategoryModel>?> getCachedCategories() async {
    if (isCacheExpired()) return null;
    
    final categoryIds = _metadataBox.get(_categoriesKey) as List<dynamic>?;
    if (categoryIds == null) return null;
    
    final categories = <CategoryModel>[];
    for (final id in categoryIds) {
      final category = _categoryBox.get(id);
      if (category != null) {
        categories.add(category);
      }
    }
    
    return categories.isEmpty ? null : categories;
  }

  @override
  Future<void> cacheCategory(CategoryModel category) async {
    await _categoryBox.put(category.id, category);
    await updateCacheTimestamp();
  }

  @override
  Future<CategoryModel?> getCachedCategoryById(String id) async {
    if (isCacheExpired()) return null;
    return _categoryBox.get(id);
  }

  @override
  Future<CategoryModel?> getCachedCategoryBySlug(String slug) async {
    if (isCacheExpired()) return null;
    
    for (final category in _categoryBox.values) {
      if (category.slug == slug) {
        return category;
      }
    }
    return null;
  }

  @override
  Future<void> cacheFeaturedCategories(List<CategoryModel> categories) async {
    await _metadataBox.put(
      _featuredCategoriesKey,
      categories.map((c) => c.id).toList(),
    );
    
    // Also cache the categories themselves
    final Map<String, CategoryModel> categoryMap = {
      for (final category in categories) category.id: category,
    };
    await _categoryBox.putAll(categoryMap);
    await updateCacheTimestamp();
  }

  @override
  Future<List<CategoryModel>?> getCachedFeaturedCategories() async {
    if (isCacheExpired()) return null;
    
    final categoryIds = _metadataBox.get(_featuredCategoriesKey) as List<dynamic>?;
    if (categoryIds == null) return null;
    
    final categories = <CategoryModel>[];
    for (final id in categoryIds) {
      final category = _categoryBox.get(id);
      if (category != null) {
        categories.add(category);
      }
    }
    
    return categories.isEmpty ? null : categories;
  }

  @override
  Future<void> clearCache() async {
    await _categoryBox.clear();
    await _metadataBox.delete(_categoriesKey);
    await _metadataBox.delete(_featuredCategoriesKey);
    await _metadataBox.delete(_cacheTimestampKey);
  }

  @override
  bool isCacheExpired() {
    final timestamp = _metadataBox.get(_cacheTimestampKey) as int?;
    if (timestamp == null) return true;
    
    final cacheTime = DateTime.fromMillisecondsSinceEpoch(timestamp);
    final now = DateTime.now();
    
    return now.difference(cacheTime) > _cacheValidDuration;
  }

  @override
  Future<void> updateCacheTimestamp() async {
    await _metadataBox.put(
      _cacheTimestampKey,
      DateTime.now().millisecondsSinceEpoch,
    );
  }
}