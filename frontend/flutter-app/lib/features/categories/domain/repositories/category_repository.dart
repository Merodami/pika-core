import '../../../../core/domain/typedefs.dart';
import '../entities/category_entity.dart';

/// Category repository interface following Repository pattern
/// This defines the contract for category data operations
abstract class CategoryRepository {
  /// Get all categories with optional pagination and filters
  FutureResult<PaginatedResult<CategoryEntity>> getCategories({
    int page = 1,
    int limit = 20,
    String? parentId,
    int? level,
    bool? isActive,
    bool includeChildren = false,
    String sort = 'sort_order',
    String order = 'asc',
  });

  /// Get a single category by ID
  FutureResult<CategoryEntity> getCategoryById(String id);

  /// Get a single category by slug
  FutureResult<CategoryEntity> getCategoryBySlug(String slug);

  /// Get featured categories (usually top categories with most services)
  FutureResult<List<CategoryEntity>> getFeaturedCategories({
    int limit = 10,
  });

  /// Get categories by service count (popular categories)
  FutureResult<List<CategoryEntity>> getCategoriesByPopularity({
    int limit = 10,
  });

  /// Create a new category (admin operation)
  FutureResult<CategoryEntity> createCategory(CategoryEntity category);

  /// Update an existing category (admin operation)
  FutureResult<CategoryEntity> updateCategory(CategoryEntity category);

  /// Delete a category (admin operation)
  FutureVoidResult deleteCategory(String id);

  /// Stream of categories for real-time updates
  StreamResult<List<CategoryEntity>> watchCategories({
    bool? isActive,
  });

  /// Search categories by name or description
  FutureResult<List<CategoryEntity>> searchCategories({
    required String query,
    int limit = 20,
  });

  /// Get category statistics (admin operation)
  FutureResult<CategoryStats> getCategoryStats(String id);
}

/// Category statistics model
class CategoryStats {
  const CategoryStats({
    required this.totalServices,
    required this.activeServices,
    required this.totalProviders,
    required this.averageRating,
    required this.totalBookings,
    required this.revenue,
  });

  final int totalServices;
  final int activeServices;
  final int totalProviders;
  final double averageRating;
  final int totalBookings;
  final double revenue;

  @override
  String toString() {
    return 'CategoryStats(totalServices: $totalServices, activeServices: $activeServices, totalProviders: $totalProviders, averageRating: $averageRating, totalBookings: $totalBookings, revenue: $revenue)';
  }
}