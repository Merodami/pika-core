import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../../../../core/domain/failures/failures.dart';
import '../../../../core/domain/typedefs.dart';
import '../../domain/entities/category_entity.dart';
import '../../domain/repositories/category_repository.dart';
import '../datasources/category_local_datasource.dart';
import '../datasources/category_remote_datasource.dart';
import '../models/category_model.dart';

/// Implementation of CategoryRepository following Clean Architecture
/// Implements offline-first pattern with cache-first strategy
class CategoryRepositoryImpl implements CategoryRepository {
  const CategoryRepositoryImpl({
    required CategoryRemoteDataSource remoteDataSource,
    required CategoryLocalDataSource localDataSource,
  })  : _remoteDataSource = remoteDataSource,
        _localDataSource = localDataSource;

  final CategoryRemoteDataSource _remoteDataSource;
  final CategoryLocalDataSource _localDataSource;

  @override
  FutureResult<PaginatedResult<CategoryEntity>> getCategories({
    int page = 1,
    int limit = 20,
    String? parentId,
    int? level,
    bool? isActive,
    bool includeChildren = false,
    String sort = 'sort_order',
    String order = 'asc',
  }) async {
    try {
      // Try cache first for first page without filters
      if (page == 1 && parentId == null && level == null) {
        final cachedCategories = await _localDataSource.getCachedCategories();
        if (cachedCategories != null) {
          final entities =
              cachedCategories.map((model) => model.toEntity('es')).toList();

          // Apply filters if needed
          List<CategoryEntity> filteredEntities = entities;
          if (isActive != null) {
            filteredEntities =
                entities.where((e) => e.isActive == isActive).toList();
          }

          // Create pagination info
          final paginationInfo = (
            page: page,
            limit: limit,
            total: filteredEntities.length,
            hasMore: false,
            hasPrevious: false,
          );

          return Right((
            items: filteredEntities.take(limit).toList(),
            pagination: paginationInfo,
          ));
        }
      }

      // Fetch from remote
      final response = await _remoteDataSource.getCategories(
        page: page,
        limit: limit,
        parentId: parentId,
        level: level,
        active: isActive,
        includeChildren: includeChildren,
        sort: sort,
        order: order,
      );

      if (kDebugMode) {
        print('API Response received: ${response.data.length} categories');
        print(
            'First category raw data: ${response.data.isNotEmpty ? response.data.first : 'No data'}');
      }

      // Cache first page results without filters
      if (page == 1 && parentId == null && level == null) {
        await _localDataSource.cacheCategories(response.data);
      }

      // Convert to entities
      final entities = <CategoryEntity>[];
      for (int i = 0; i < response.data.length; i++) {
        try {
          if (kDebugMode) {
            print('Converting category $i: ${response.data[i].id}');
            print('Category active value: ${response.data[i].active}');
            print('Category name: ${response.data[i].name}');
          }
          final entity = response.data[i].toEntity('es');
          entities.add(entity);
          if (kDebugMode) {
            print('Successfully converted category $i');
          }
        } catch (e) {
          if (kDebugMode) {
            print('Error converting category $i to entity: $e');
            print('Category model active field: ${response.data[i].active}');
            print('Category model: ${response.data[i]}');
            print('Stack trace: ${StackTrace.current}');
          }
          rethrow;
        }
      }

      // Create pagination info
      final paginationInfo = response.pagination != null
          ? (
              page: response.pagination!.page,
              limit: response.pagination!.limit,
              total: response.pagination!.total,
              hasMore: response.pagination!.hasNext,
              hasPrevious: response.pagination!.hasPrev,
            )
          : (
              page: page,
              limit: limit,
              total: entities.length,
              hasMore: false,
              hasPrevious: false,
            );

      return Right((
        items: entities,
        pagination: paginationInfo,
      ));
    } catch (e) {
      if (kDebugMode) {
        print('Category repository error in getCategories: $e');
        if (e is DioException) {
          print('DioException type: ${e.type}');
          print('DioException message: ${e.message}');
          print('Response data: ${e.response?.data}');
        }
      }
      return Left(_handleError(e));
    }
  }

  @override
  FutureResult<CategoryEntity> getCategoryById(String id) async {
    try {
      // Try cache first
      final cachedCategory = await _localDataSource.getCachedCategoryById(id);
      if (cachedCategory != null) {
        return Right(cachedCategory.toEntity('es'));
      }

      // Fetch from remote
      final response = await _remoteDataSource.getCategoryById(id);

      // Cache the result
      await _localDataSource.cacheCategory(response.data);

      return Right(response.data.toEntity('es'));
    } catch (e) {
      return Left(_handleError(e));
    }
  }

  @override
  FutureResult<CategoryEntity> getCategoryBySlug(String slug) async {
    try {
      // Try cache first
      final cachedCategory =
          await _localDataSource.getCachedCategoryBySlug(slug);
      if (cachedCategory != null) {
        return Right(cachedCategory.toEntity('es'));
      }

      // Client-side implementation since backend doesn't have slug endpoint
      final categoriesResult = await getCategories(limit: 1000);
      return categoriesResult.fold(
        (failure) => Left(failure),
        (paginatedResult) {
          try {
            final category = paginatedResult.items.firstWhere(
              (cat) => cat.slug == slug,
            );
            return Right(category);
          } catch (e) {
            return Left(Failure.notFound(
              message: 'Category with slug $slug not found',
              code: 'CATEGORY_NOT_FOUND',
            ));
          }
        },
      );
    } catch (e) {
      return Left(_handleError(e));
    }
  }

  @override
  FutureResult<List<CategoryEntity>> getFeaturedCategories({
    int limit = 10,
  }) async {
    try {
      // Try cache first
      final cachedCategories =
          await _localDataSource.getCachedFeaturedCategories();
      if (cachedCategories != null) {
        return Right(
            cachedCategories.map((model) => model.toEntity()).toList());
      }

      // Fetch from remote
      final response = await _remoteDataSource.getFeaturedCategories(
        limit: limit,
      );

      // Cache the results
      await _localDataSource.cacheFeaturedCategories(response.data);

      return Right(response.data.map((model) => model.toEntity('es')).toList());
    } catch (e) {
      return Left(_handleError(e));
    }
  }

  @override
  FutureResult<List<CategoryEntity>> getCategoriesByPopularity({
    int limit = 10,
    String? locale,
  }) async {
    try {
      final response = await _remoteDataSource.getCategoriesByPopularity(
        limit: limit,
      );

      return Right(response.data.map((model) => model.toEntity('es')).toList());
    } catch (e) {
      return Left(_handleError(e));
    }
  }

  @override
  FutureResult<CategoryEntity> createCategory(CategoryEntity category) async {
    try {
      final model = category.toModel();
      final response = await _remoteDataSource.createCategory(model);

      // Cache the new category
      await _localDataSource.cacheCategory(response.data);

      return Right(response.data.toEntity('es'));
    } catch (e) {
      return Left(_handleError(e));
    }
  }

  @override
  FutureResult<CategoryEntity> updateCategory(CategoryEntity category) async {
    try {
      final model = category.toModel();
      final response =
          await _remoteDataSource.updateCategory(category.id, model);

      // Update cache
      await _localDataSource.cacheCategory(response.data);

      return Right(response.data.toEntity('es'));
    } catch (e) {
      return Left(_handleError(e));
    }
  }

  @override
  FutureVoidResult deleteCategory(String id) async {
    try {
      await _remoteDataSource.deleteCategory(id);

      // Remove from cache by clearing all cache (simple approach)
      await _localDataSource.clearCache();

      return const Right(null);
    } catch (e) {
      return Left(_handleError(e));
    }
  }

  @override
  StreamResult<List<CategoryEntity>> watchCategories({
    bool? isActive,
    String? locale,
  }) async* {
    // This would typically use WebSockets or Firebase listeners
    // For now, we'll implement a simple polling mechanism
    while (true) {
      try {
        final result = await getFeaturedCategories();
        yield result.map((categories) {
          if (isActive != null) {
            return categories.where((c) => c.isActive == isActive).toList();
          }
          return categories;
        });

        // Wait before next poll
        await Future.delayed(const Duration(seconds: 30));
      } catch (e) {
        yield Left(_handleError(e));
        await Future.delayed(const Duration(seconds: 10));
      }
    }
  }

  @override
  FutureResult<List<CategoryEntity>> searchCategories({
    required String query,
    int limit = 20,
    String? locale,
  }) async {
    try {
      // Client-side search implementation since backend doesn't have search
      final response = await _remoteDataSource.searchCategories(
        limit: limit,
      );

      // Filter client-side by query
      final filteredCategories = response.data.where((category) {
        final searchText = query.toLowerCase();
        final nameText = category.name.values.join(' ').toLowerCase();
        final descText =
            category.description?.values.join(' ').toLowerCase() ?? '';
        return nameText.contains(searchText) || descText.contains(searchText);
      }).toList();

      return Right(
          filteredCategories.map((model) => model.toEntity('es')).toList());
    } catch (e) {
      return Left(_handleError(e));
    }
  }

  @override
  FutureResult<CategoryStats> getCategoryStats(String id) async {
    // Stats endpoint not available in backend
    return const Left(Failure.server(
      message: 'Category stats not implemented in backend',
      code: 'NOT_IMPLEMENTED',
      statusCode: 501,
    ));
  }

  /// Convert exceptions to domain failures
  Failure _handleError(dynamic error) {
    if (error is DioException) {
      switch (error.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.sendTimeout:
        case DioExceptionType.receiveTimeout:
          return Failure.network(
            message: 'Connection timeout',
            code: 'TIMEOUT',
            statusCode: error.response?.statusCode ?? 408,
          );
        case DioExceptionType.badResponse:
          final statusCode = error.response?.statusCode ?? 500;
          if (statusCode == 404) {
            return Failure.notFound(
              message: 'Resource not found',
              code: 'NOT_FOUND',
            );
          } else if (statusCode == 401) {
            return Failure.authentication(
              message: 'Authentication required',
              code: 'UNAUTHORIZED',
            );
          } else if (statusCode == 403) {
            return Failure.authorization(
              message: 'Access forbidden',
              code: 'FORBIDDEN',
            );
          }
          return Failure.server(
            message: error.response?.data?['message'] ?? 'Server error',
            code: error.response?.data?['code'],
            statusCode: statusCode,
          );
        case DioExceptionType.connectionError:
          return const Failure.network(
            message: 'No internet connection',
            code: 'NO_CONNECTION',
          );
        default:
          return Failure.unexpected(
            message: error.message ?? 'Unknown network error',
            exception: error,
          );
      }
    }

    return Failure.unexpected(
      message: error.toString(),
      exception: error,
    );
  }
}
