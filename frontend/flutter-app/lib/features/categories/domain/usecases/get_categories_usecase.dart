import '../../../../core/domain/usecases/usecase.dart';
import '../../../../core/domain/typedefs.dart';
import '../entities/category_entity.dart';
import '../repositories/category_repository.dart';

/// Use case for getting categories with pagination and filtering
/// Following Clean Architecture principles
class GetCategoriesUseCase implements UseCase<PaginatedResult<CategoryEntity>, GetCategoriesParams> {
  const GetCategoriesUseCase(this._repository);

  final CategoryRepository _repository;

  @override
  FutureResult<PaginatedResult<CategoryEntity>> call(GetCategoriesParams params) async {
    return await _repository.getCategories(
      page: params.page,
      limit: params.limit,
      parentId: params.parentId,
      level: params.level,
      isActive: params.isActive,
      includeChildren: params.includeChildren,
      sort: params.sort,
      order: params.order,
    );
  }
}

/// Parameters for getting categories
class GetCategoriesParams extends UseCaseParams {
  const GetCategoriesParams({
    this.page = 1,
    this.limit = 20,
    this.parentId,
    this.level,
    this.isActive,
    this.includeChildren = false,
    this.sort = 'sort_order',
    this.order = 'asc',
  });

  final int page;
  final int limit;
  final String? parentId;
  final int? level;
  final bool? isActive;
  final bool includeChildren;
  final String sort;
  final String order;

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is GetCategoriesParams &&
        other.page == page &&
        other.limit == limit &&
        other.parentId == parentId &&
        other.level == level &&
        other.isActive == isActive &&
        other.includeChildren == includeChildren &&
        other.sort == sort &&
        other.order == order;
  }

  @override
  int get hashCode {
    return Object.hash(page, limit, parentId, level, isActive, includeChildren, sort, order);
  }

  @override
  String toString() {
    return 'GetCategoriesParams(page: $page, limit: $limit, parentId: $parentId, level: $level, isActive: $isActive, includeChildren: $includeChildren, sort: $sort, order: $order)';
  }

  GetCategoriesParams copyWith({
    int? page,
    int? limit,
    String? parentId,
    int? level,
    bool? isActive,
    bool? includeChildren,
    String? sort,
    String? order,
  }) {
    return GetCategoriesParams(
      page: page ?? this.page,
      limit: limit ?? this.limit,
      parentId: parentId ?? this.parentId,
      level: level ?? this.level,
      isActive: isActive ?? this.isActive,
      includeChildren: includeChildren ?? this.includeChildren,
      sort: sort ?? this.sort,
      order: order ?? this.order,
    );
  }
}