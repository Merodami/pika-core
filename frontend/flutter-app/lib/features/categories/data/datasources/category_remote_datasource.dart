import 'package:dio/dio.dart';
import 'package:json_annotation/json_annotation.dart';
import 'package:retrofit/retrofit.dart';

import '../models/category_model.dart';

part 'category_remote_datasource.g.dart';

/// Remote data source for category operations
/// Uses Retrofit for type-safe HTTP operations
@RestApi()
abstract class CategoryRemoteDataSource {
  factory CategoryRemoteDataSource(Dio dio, {String baseUrl}) =
      _CategoryRemoteDataSource;

  /// Get paginated categories
  @GET('/categories')
  Future<PaginatedCategoriesResponse> getCategories({
    @Query('page') int page = 1,
    @Query('limit') int limit = 20,
    @Query('parent_id') String? parentId,
    @Query('level') int? level,
    @Query('active') bool? active,
    @Query('include_children') bool includeChildren = false,
    @Query('sort') String sort = 'sort_order',
    @Query('order') String order = 'asc',
  });

  /// Get category by ID
  @GET('/categories/{id}')
  Future<CategoryResponse> getCategoryById(@Path('id') String id);

  /// Get category by slug (not available in backend - remove or implement client-side)
  // @GET('/categories/slug/{slug}')
  // Future<CategoryResponse> getCategoryBySlug(@Path('slug') String slug);

  /// Get featured categories (top-level active categories)
  @GET('/categories')
  Future<PaginatedCategoriesResponse> getFeaturedCategories({
    @Query('limit') int limit = 10,
    @Query('level') int level = 1,
    @Query('active') bool active = true,
    @Query('sort') String sort = 'sort_order',
  });

  /// Get categories by popularity (using sort order)
  @GET('/categories')
  Future<PaginatedCategoriesResponse> getCategoriesByPopularity({
    @Query('limit') int limit = 10,
    @Query('active') bool active = true,
    @Query('sort') String sort = 'sort_order',
    @Query('order') String order = 'asc',
  });

  /// Search categories (implement client-side for now)
  // Note: Backend doesn't have search endpoint, implement client-side filtering
  @GET('/categories')
  Future<PaginatedCategoriesResponse> searchCategories({
    @Query('limit') int limit = 20,
    @Query('active') bool active = true,
  });

  /// Create category (admin operation)
  @POST('/categories')
  Future<CategoryResponse> createCategory(@Body() CategoryModel category);

  /// Update category (admin operation)
  @PATCH('/categories/{id}')
  Future<CategoryResponse> updateCategory(
    @Path('id') String id,
    @Body() CategoryModel category,
  );

  /// Delete category (admin operation)
  @DELETE('/categories/{id}')
  Future<void> deleteCategory(@Path('id') String id);

  /// Get category statistics (not available in backend - remove)
  // @GET('/categories/{id}/stats')
  // Future<CategoryStatsResponse> getCategoryStats(@Path('id') String id);
}

/// API response models
@JsonSerializable()
class CategoryResponse {
  const CategoryResponse({
    required this.data,
  });

  final CategoryModel data;

  factory CategoryResponse.fromJson(Map<String, dynamic> json) =>
      _$CategoryResponseFromJson(json);

  Map<String, dynamic> toJson() => _$CategoryResponseToJson(this);
}

@JsonSerializable()
class PaginatedCategoriesResponse {
  const PaginatedCategoriesResponse({
    required this.data,
    this.pagination,
  });

  final List<CategoryModel> data;
  final PaginationMeta? pagination;

  factory PaginatedCategoriesResponse.fromJson(Map<String, dynamic> json) =>
      _$PaginatedCategoriesResponseFromJson(json);

  Map<String, dynamic> toJson() => _$PaginatedCategoriesResponseToJson(this);
}

@JsonSerializable()
class PaginationMeta {
  const PaginationMeta({
    required this.page,
    required this.limit,
    required this.total,
    required this.pages,
    @JsonKey(name: 'has_next') this.hasNext = false,
    @JsonKey(name: 'has_prev') this.hasPrev = false,
  });

  final int page;
  final int limit;
  final int total;
  final int pages;
  final bool hasNext;
  final bool hasPrev;

  factory PaginationMeta.fromJson(Map<String, dynamic> json) =>
      _$PaginationMetaFromJson(json);

  Map<String, dynamic> toJson() => _$PaginationMetaToJson(this);
}
