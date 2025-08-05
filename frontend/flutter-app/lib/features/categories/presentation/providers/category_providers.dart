import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:dio/dio.dart';
import 'package:hive_flutter/hive_flutter.dart';

import '../../../../core/domain/typedefs.dart';
import '../../../../core/services/api/api_client.dart';
import '../../data/datasources/category_local_datasource.dart';
import '../../data/datasources/category_remote_datasource.dart';
import '../../data/models/category_model.dart';
import '../../data/repositories/category_repository_impl.dart';
import '../../domain/entities/category_entity.dart';
import '../../domain/repositories/category_repository.dart';
import '../../domain/usecases/get_categories_usecase.dart';
import '../../domain/usecases/get_featured_categories_usecase.dart';
import '../../domain/usecases/search_categories_usecase.dart';

part 'category_providers.g.dart';

/// Provider for Hive category box
@riverpod
Future<Box<CategoryModel>> categoryBox(CategoryBoxRef ref) async {
  return await Hive.openBox<CategoryModel>('categories');
}

/// Provider for Hive metadata box
@riverpod
Future<Box<dynamic>> categoryMetadataBox(CategoryMetadataBoxRef ref) async {
  return await Hive.openBox<dynamic>('category_metadata');
}

/// Provider for category local data source
@riverpod
Future<CategoryLocalDataSource> categoryLocalDataSource(CategoryLocalDataSourceRef ref) async {
  final categoryBox = await ref.watch(categoryBoxProvider.future);
  final metadataBox = await ref.watch(categoryMetadataBoxProvider.future);
  
  return CategoryLocalDataSourceImpl(
    categoryBox: categoryBox,
    metadataBox: metadataBox,
  );
}

/// Provider for category remote data source
@riverpod
CategoryRemoteDataSource categoryRemoteDataSource(CategoryRemoteDataSourceRef ref) {
  final dio = ref.watch(dioProvider);
  return CategoryRemoteDataSource(dio);
}

/// Provider for category repository
@riverpod
Future<CategoryRepository> categoryRepository(CategoryRepositoryRef ref) async {
  final remoteDataSource = ref.watch(categoryRemoteDataSourceProvider);
  final localDataSource = await ref.watch(categoryLocalDataSourceProvider.future);
  
  return CategoryRepositoryImpl(
    remoteDataSource: remoteDataSource,
    localDataSource: localDataSource,
  );
}

/// Use case providers
@riverpod
Future<GetCategoriesUseCase> getCategoriesUseCase(GetCategoriesUseCaseRef ref) async {
  final repository = await ref.watch(categoryRepositoryProvider.future);
  return GetCategoriesUseCase(repository);
}

@riverpod
Future<GetFeaturedCategoriesUseCase> getFeaturedCategoriesUseCase(GetFeaturedCategoriesUseCaseRef ref) async {
  final repository = await ref.watch(categoryRepositoryProvider.future);
  return GetFeaturedCategoriesUseCase(repository);
}

@riverpod
Future<SearchCategoriesUseCase> searchCategoriesUseCase(SearchCategoriesUseCaseRef ref) async {
  final repository = await ref.watch(categoryRepositoryProvider.future);
  return SearchCategoriesUseCase(repository);
}

/// Featured categories provider
@riverpod
Future<List<CategoryEntity>> featuredCategories(
  FeaturedCategoriesRef ref, {
  int limit = 8,
}) async {
  final useCase = await ref.watch(getFeaturedCategoriesUseCaseProvider.future);
  
  final params = GetFeaturedCategoriesParams(
    limit: limit,
  );
  
  final result = await useCase(params);
  
  return result.fold(
    (failure) => throw failure,
    (categories) => categories,
  );
}

/// Categories with pagination provider
@riverpod
Future<PaginatedResult<CategoryEntity>> categories(
  CategoriesRef ref, {
  int page = 1,
  int limit = 20,
  String? parentId,
  int? level,
  bool? isActive,
  bool includeChildren = false,
  String sort = 'sort_order',
  String order = 'asc',
}) async {
  final useCase = await ref.watch(getCategoriesUseCaseProvider.future);
  
  final params = GetCategoriesParams(
    page: page,
    limit: limit,
    parentId: parentId,
    level: level,
    isActive: isActive,
    includeChildren: includeChildren,
    sort: sort,
    order: order,
  );
  
  final result = await useCase(params);
  
  return result.fold(
    (failure) => throw failure,
    (paginatedResult) => paginatedResult,
  );
}

/// Search categories provider with debouncing
@riverpod
Future<List<CategoryEntity>> searchCategories(
  SearchCategoriesRef ref, {
  required String query,
  int limit = 20,
}) async {
  // Add debouncing
  await Future.delayed(const Duration(milliseconds: 300));
  
  // Early return if query is too short to avoid unnecessary work
  
  if (query.isEmpty || query.length < 2) {
    return [];
  }
  
  final useCase = await ref.watch(searchCategoriesUseCaseProvider.future);
  
  final params = SearchCategoriesParams(
    query: query,
    limit: limit,
  );
  
  final result = await useCase(params);
  
  return result.fold(
    (failure) => throw failure,
    (categories) => categories,
  );
}

/// Category by ID provider
@riverpod
Future<CategoryEntity> categoryById(
  CategoryByIdRef ref, {
  required String id,
}) async {
  final repository = await ref.watch(categoryRepositoryProvider.future);
  
  final result = await repository.getCategoryById(id);
  
  return result.fold(
    (failure) => throw failure,
    (category) => category,
  );
}

/// Category by slug provider
@riverpod
Future<CategoryEntity> categoryBySlug(
  CategoryBySlugRef ref, {
  required String slug,
}) async {
  final repository = await ref.watch(categoryRepositoryProvider.future);
  
  final result = await repository.getCategoryBySlug(slug);
  
  return result.fold(
    (failure) => throw failure,
    (category) => category,
  );
}

/// Active categories only provider
@riverpod
Future<List<CategoryEntity>> activeCategories(
  ActiveCategoriesRef ref,
) async {
  final useCase = await ref.watch(getCategoriesUseCaseProvider.future);
  
  final params = GetCategoriesParams(
    page: 1,
    limit: 100, // Get all active categories
    isActive: true,
  );
  
  final result = await useCase(params);
  
  return result.fold(
    (failure) => throw failure,
    (paginatedResult) => paginatedResult.items,
  );
}

/// Categories stream provider for real-time updates
@riverpod
Stream<List<CategoryEntity>> categoriesStream(
  CategoriesStreamRef ref, {
  bool? isActive,
}) async* {
  final repository = await ref.watch(categoryRepositoryProvider.future);
  
  final stream = repository.watchCategories(
    isActive: isActive,
  );
  
  await for (final result in stream) {
    yield result.fold(
      (failure) => throw failure,
      (categories) => categories,
    );
  }
}

/// ApiClient provider
final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient();
});

/// Dio provider using the configured ApiClient
final dioProvider = Provider<Dio>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return apiClient.dio;
});