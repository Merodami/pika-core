import 'package:dartz/dartz.dart';

import 'failures/failures.dart';

/// Type definitions for common patterns in Clean Architecture
/// Following functional programming principles with Either monad

/// Result type for operations that can fail
/// Left side represents failure, Right side represents success
typedef Result<T> = Either<Failure, T>;

/// Future result type for async operations
typedef FutureResult<T> = Future<Result<T>>;

/// Stream result type for reactive operations
typedef StreamResult<T> = Stream<Result<T>>;

/// Void result for operations that don't return data
typedef VoidResult = Result<void>;

/// Future void result for async operations that don't return data
typedef FutureVoidResult = Future<VoidResult>;

/// Pagination info for list operations
typedef PaginationInfo = ({
  int page,
  int limit,
  int total,
  bool hasMore,
  bool hasPrevious,
});

/// Paginated result wrapper
typedef PaginatedResult<T> = ({
  List<T> items,
  PaginationInfo pagination,
});

/// Search criteria for queries
typedef SearchCriteria = Map<String, dynamic>;

/// Sort criteria for ordering
enum SortOrder { asc, desc }

typedef SortCriteria = ({String field, SortOrder order});

/// Filter criteria for filtering operations
typedef FilterCriteria = Map<String, dynamic>;
