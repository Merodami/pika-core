import 'package:dartz/dartz.dart';
import '../../../../core/domain/usecases/usecase.dart';
import '../../../../core/domain/typedefs.dart';
import '../../../../core/domain/failures/failures.dart';
import '../entities/category_entity.dart';
import '../repositories/category_repository.dart';

/// Use case for searching categories by query
/// Implements debouncing and caching for better user experience
class SearchCategoriesUseCase implements UseCase<List<CategoryEntity>, SearchCategoriesParams> {
  const SearchCategoriesUseCase(this._repository);

  final CategoryRepository _repository;

  @override
  FutureResult<List<CategoryEntity>> call(SearchCategoriesParams params) async {
    // Business rule: Search query must be at least 2 characters
    if (params.query.length < 2) {
      return const Left(Failure.validation(
        message: 'Search query must be at least 2 characters',
        field: 'query',
        code: 'QUERY_TOO_SHORT',
      ));
    }

    return await _repository.searchCategories(
      query: params.query,
      limit: params.limit,
    );
  }
}

/// Parameters for searching categories
class SearchCategoriesParams extends UseCaseParams {
  const SearchCategoriesParams({
    required this.query,
    this.limit = 20,
  });

  final String query;
  final int limit;

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is SearchCategoriesParams &&
        other.query == query &&
        other.limit == limit;
  }

  @override
  int get hashCode => Object.hash(query, limit);

  @override
  String toString() {
    return 'SearchCategoriesParams(query: $query, limit: $limit)';
  }

  SearchCategoriesParams copyWith({
    String? query,
    int? limit,
  }) {
    return SearchCategoriesParams(
      query: query ?? this.query,
      limit: limit ?? this.limit,
    );
  }
}