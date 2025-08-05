import '../../../../core/domain/usecases/usecase.dart';
import '../../../../core/domain/typedefs.dart';
import '../entities/category_entity.dart';
import '../repositories/category_repository.dart';

/// Use case for getting featured categories
/// Featured categories are typically the most popular or promoted categories
class GetFeaturedCategoriesUseCase implements UseCase<List<CategoryEntity>, GetFeaturedCategoriesParams> {
  const GetFeaturedCategoriesUseCase(this._repository);

  final CategoryRepository _repository;

  @override
  FutureResult<List<CategoryEntity>> call(GetFeaturedCategoriesParams params) async {
    return await _repository.getFeaturedCategories(
      limit: params.limit,
    );
  }
}

/// Parameters for getting featured categories
class GetFeaturedCategoriesParams extends UseCaseParams {
  const GetFeaturedCategoriesParams({
    this.limit = 10,
  });

  final int limit;

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is GetFeaturedCategoriesParams &&
        other.limit == limit;
  }

  @override
  int get hashCode => limit.hashCode;

  @override
  String toString() {
    return 'GetFeaturedCategoriesParams(limit: $limit)';
  }

  GetFeaturedCategoriesParams copyWith({
    int? limit,
  }) {
    return GetFeaturedCategoriesParams(
      limit: limit ?? this.limit,
    );
  }
}