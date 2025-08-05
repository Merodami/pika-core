import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';

import 'package:pika_app/core/domain/failures/failures.dart';
import 'package:pika_app/features/categories/domain/entities/category_entity.dart';
import 'package:pika_app/features/categories/domain/repositories/category_repository.dart';
import 'package:pika_app/features/categories/domain/usecases/get_categories_usecase.dart';

import 'get_categories_usecase_test.mocks.dart';

@GenerateMocks([CategoryRepository])
void main() {
  late GetCategoriesUseCase useCase;
  late MockCategoryRepository mockRepository;

  setUp(() {
    mockRepository = MockCategoryRepository();
    useCase = GetCategoriesUseCase(mockRepository);
  });

  group('GetCategoriesUseCase', () {
    const tPage = 1;
    const tLimit = 20;
    const tParentId = 'parent-1';
    const tLevel = 1;
    const tIsActive = true;
    const tIncludeChildren = false;
    const tSort = 'sort_order';
    const tOrder = 'asc';

    final tCategories = [
      const CategoryEntity(
        id: '1',
        name: 'Plumbing',
        slug: 'plumbing',
        description: 'Professional plumbing services',
        isActive: true,
      ),
      const CategoryEntity(
        id: '2',
        name: 'Electrical',
        slug: 'electrical',
        description: 'Electrical installation and repair',
        isActive: true,
      ),
    ];

    final tPaginationInfo = (
      page: tPage,
      limit: tLimit,
      total: 2,
      hasMore: false,
    );

    final tPaginatedResult = (
      items: tCategories,
      pagination: tPaginationInfo,
    );

    const tParams = GetCategoriesParams(
      page: tPage,
      limit: tLimit,
      parentId: tParentId,
      level: tLevel,
      isActive: tIsActive,
      includeChildren: tIncludeChildren,
      sort: tSort,
      order: tOrder,
    );

    test('should get categories from repository when successful', () async {
      // arrange
      when(mockRepository.getCategories(
        page: anyNamed('page'),
        limit: anyNamed('limit'),
        parentId: anyNamed('parentId'),
        level: anyNamed('level'),
        isActive: anyNamed('isActive'),
        includeChildren: anyNamed('includeChildren'),
        sort: anyNamed('sort'),
        order: anyNamed('order'),
      )).thenAnswer((_) async => Right(tPaginatedResult));

      // act
      final result = await useCase(tParams);

      // assert
      expect(result, Right(tPaginatedResult));
      verify(mockRepository.getCategories(
        page: tPage,
        limit: tLimit,
        parentId: tParentId,
        level: tLevel,
        isActive: tIsActive,
        includeChildren: tIncludeChildren,
        sort: tSort,
        order: tOrder,
      ));
      verifyNoMoreInteractions(mockRepository);
    });

    test('should return failure when repository fails', () async {
      // arrange
      const tFailure = Failure.network(
        message: 'Network error',
        code: 'NETWORK_ERROR',
      );
      when(mockRepository.getCategories(
        page: anyNamed('page'),
        limit: anyNamed('limit'),
        parentId: anyNamed('parentId'),
        level: anyNamed('level'),
        isActive: anyNamed('isActive'),
        includeChildren: anyNamed('includeChildren'),
        sort: anyNamed('sort'),
        order: anyNamed('order'),
      )).thenAnswer((_) async => const Left(tFailure));

      // act
      final result = await useCase(tParams);

      // assert
      expect(result, const Left(tFailure));
      verify(mockRepository.getCategories(
        page: tPage,
        limit: tLimit,
        parentId: tParentId,
        level: tLevel,
        isActive: tIsActive,
        includeChildren: tIncludeChildren,
        sort: tSort,
        order: tOrder,
      ));
      verifyNoMoreInteractions(mockRepository);
    });

    test('should call repository with default parameters when not provided', () async {
      // arrange
      const tDefaultParams = GetCategoriesParams();
      when(mockRepository.getCategories(
        page: anyNamed('page'),
        limit: anyNamed('limit'),
        parentId: anyNamed('parentId'),
        level: anyNamed('level'),
        isActive: anyNamed('isActive'),
        includeChildren: anyNamed('includeChildren'),
        sort: anyNamed('sort'),
        order: anyNamed('order'),
      )).thenAnswer((_) async => Right(tPaginatedResult));

      // act
      await useCase(tDefaultParams);

      // assert
      verify(mockRepository.getCategories(
        page: 1,
        limit: 20,
        parentId: null,
        level: null,
        isActive: null,
        includeChildren: false,
        sort: 'sort_order',
        order: 'asc',
      ));
    });
  });

  group('GetCategoriesParams', () {
    test('should support equality comparison', () {
      // arrange
      const params1 = GetCategoriesParams(page: 1, limit: 20);
      const params2 = GetCategoriesParams(page: 1, limit: 20);
      const params3 = GetCategoriesParams(page: 2, limit: 20);

      // assert
      expect(params1, equals(params2));
      expect(params1, isNot(equals(params3)));
    });

    test('should support copyWith functionality', () {
      // arrange
      const originalParams = GetCategoriesParams(
        page: 1,
        limit: 20,
      );

      // act
      final updatedParams = originalParams.copyWith(page: 2);

      // assert
      expect(updatedParams.page, 2);
      expect(updatedParams.limit, 20);
      expect(updatedParams.sort, 'sort_order');
    });

    test('should have proper toString implementation', () {
      // arrange
      const params = GetCategoriesParams(
        page: 1,
        limit: 20,
        isActive: true,
      );

      // act
      final stringRepresentation = params.toString();

      // assert
      expect(stringRepresentation, contains('GetCategoriesParams'));
      expect(stringRepresentation, contains('page: 1'));
      expect(stringRepresentation, contains('limit: 20'));
      expect(stringRepresentation, contains('isActive: true'));
      expect(stringRepresentation, contains('sort: sort_order'));
      expect(stringRepresentation, contains('order: asc'));
    });
  });
}