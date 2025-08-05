import '../typedefs.dart';

/// Base use case interface following the Clean Architecture pattern
/// All use cases should implement this interface
abstract class UseCase<Type, Params> {
  /// Execute the use case with given parameters
  FutureResult<Type> call(Params params);
}

/// Use case for operations without parameters
abstract class UseCaseNoParams<Type> {
  /// Execute the use case without parameters
  FutureResult<Type> call();
}

/// Stream use case for reactive operations
abstract class StreamUseCase<Type, Params> {
  /// Execute the use case and return a stream
  StreamResult<Type> call(Params params);
}

/// Stream use case for operations without parameters
abstract class StreamUseCaseNoParams<Type> {
  /// Execute the use case and return a stream without parameters
  StreamResult<Type> call();
}

/// Synchronous use case for operations that don't require async
abstract class SyncUseCase<Type, Params> {
  /// Execute the use case synchronously
  Result<Type> call(Params params);
}

/// No parameters class for use cases that don't need parameters
class NoParams {
  const NoParams();
  
  @override
  bool operator ==(Object other) => other is NoParams;
  
  @override
  int get hashCode => 0;
}

/// Base parameters class for use cases
abstract class UseCaseParams {
  const UseCaseParams();
}

/// Pagination parameters for list operations
class PaginationParams extends UseCaseParams {
  final int page;
  final int limit;
  final String? searchQuery;
  final Map<String, dynamic>? filters;
  final SortCriteria? sortBy;
  
  const PaginationParams({
    this.page = 1,
    this.limit = 20,
    this.searchQuery,
    this.filters,
    this.sortBy,
  });
  
  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is PaginationParams &&
        other.page == page &&
        other.limit == limit &&
        other.searchQuery == searchQuery &&
        other.filters == filters &&
        other.sortBy == sortBy;
  }
  
  @override
  int get hashCode {
    return Object.hash(page, limit, searchQuery, filters, sortBy);
  }
  
  @override
  String toString() {
    return 'PaginationParams(page: $page, limit: $limit, searchQuery: $searchQuery, filters: $filters, sortBy: $sortBy)';
  }
}