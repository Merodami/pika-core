import 'package:flutter_test/flutter_test.dart';
import 'package:pika_app/features/categories/domain/entities/category_entity.dart';

void main() {
  group('CategoryEntity', () {
    const tCategoryEntity = CategoryEntity(
      id: '1',
      name: 'Plumbing',
      slug: 'plumbing',
      description: 'Professional plumbing services',
      iconUrl: 'https://example.com/plumbing.jpg',
      isActive: true,
      translations: {
        'es': 'Plomería',
        'en': 'Plumbing',
        'gn': 'Yvyra renda',
      },
      createdAt: null,
      updatedAt: null,
    );

    group('business rules', () {
      test('should return correct localized name', () {
        // act & assert
        expect(tCategoryEntity.getLocalizedName('es'), 'Plomería');
        expect(tCategoryEntity.getLocalizedName('en'), 'Plumbing');
        expect(tCategoryEntity.getLocalizedName('gn'), 'Yvyra renda');
        expect(tCategoryEntity.getLocalizedName('fr'), 'Plumbing'); // fallback
      });

      test('should correctly identify if category has children', () {
        // arrange
        const categoryWithChildren = CategoryEntity(
          id: '1',
          name: 'Test',
          slug: 'test',
          children: [CategoryEntity(id: '2', name: 'Child', slug: 'child')],
        );
        const categoryWithoutChildren = CategoryEntity(
          id: '2',
          name: 'Test',
          slug: 'test',
          children: null,
        );

        // act & assert
        expect(categoryWithChildren.hasChildren, true);
        expect(categoryWithoutChildren.hasChildren, false);
      });

      test('should correctly identify if category is available', () {
        // arrange
        const availableCategory = CategoryEntity(
          id: '1',
          name: 'Test',
          slug: 'test',
          isActive: true,
        );
        const inactiveCategory = CategoryEntity(
          id: '2',
          name: 'Test',
          slug: 'test',
          isActive: false,
        );

        // act & assert
        expect(availableCategory.isAvailable, true);
        expect(inactiveCategory.isAvailable, false);
      });

      test('should generate correct display name', () {
        // act & assert
        expect(tCategoryEntity.displayName, 'Plumbing');
      });

      test('should correctly determine if category can be deleted', () {
        // arrange
        const categoryWithChildren = CategoryEntity(
          id: '1',
          name: 'Test',
          slug: 'test',
          children: [CategoryEntity(id: '2', name: 'Child', slug: 'child')],
        );
        const categoryWithoutChildren = CategoryEntity(
          id: '2',
          name: 'Test',
          slug: 'test',
          children: null,
        );

        // act & assert
        expect(categoryWithChildren.canBeDeleted(), false);
        expect(categoryWithoutChildren.canBeDeleted(), true);
      });

      test('should correctly determine if category can be published', () {
        // arrange
        const categoryWithDescription = CategoryEntity(
          id: '1',
          name: 'Test',
          slug: 'test',
          description: 'Valid description',
        );
        const categoryWithoutDescription = CategoryEntity(
          id: '2',
          name: 'Test',
          slug: 'test',
          description: null,
        );
        const categoryWithEmptyDescription = CategoryEntity(
          id: '3',
          name: 'Test',
          slug: 'test',
          description: '',
        );

        // act & assert
        expect(categoryWithDescription.canBePublished(), true);
        expect(categoryWithoutDescription.canBePublished(), false);
        expect(categoryWithEmptyDescription.canBePublished(), false);
      });
    });

    group('equality and identity', () {
      test('should be equal when IDs are the same', () {
        // arrange
        const category1 = CategoryEntity(id: '1', name: 'Test1', slug: 'test1');
        const category2 = CategoryEntity(id: '1', name: 'Test2', slug: 'test2');

        // act & assert
        expect(category1, equals(category2));
        expect(category1.hashCode, equals(category2.hashCode));
      });

      test('should not be equal when IDs are different', () {
        // arrange
        const category1 = CategoryEntity(id: '1', name: 'Test', slug: 'test');
        const category2 = CategoryEntity(id: '2', name: 'Test', slug: 'test');

        // act & assert
        expect(category1, isNot(equals(category2)));
        expect(category1.hashCode, isNot(equals(category2.hashCode)));
      });
    });

    group('copyWith', () {
      test('should create new instance with updated values', () {
        // arrange
        const original = CategoryEntity(
          id: '1',
          name: 'Original',
          slug: 'original',
          isActive: true,
        );

        // act
        final updated = original.copyWith(
          name: 'Updated',
          sortOrder: 10,
        );

        // assert
        expect(updated.id, '1');
        expect(updated.name, 'Updated');
        expect(updated.slug, 'original');
        expect(updated.isActive, true);
        expect(updated.sortOrder, 10);
      });

      test('should preserve original values when not specified', () {
        // arrange
        const original = CategoryEntity(
          id: '1',
          name: 'Original',
          slug: 'original',
          description: 'Description',
          isActive: true,
        );

        // act
        final updated = original.copyWith(name: 'Updated');

        // assert
        expect(updated.id, original.id);
        expect(updated.name, 'Updated');
        expect(updated.slug, original.slug);
        expect(updated.description, original.description);
        expect(updated.isActive, original.isActive);
        expect(updated.sortOrder, original.sortOrder);
      });
    });

    group('toString', () {
      test('should provide informative string representation', () {
        // act
        final stringRepresentation = tCategoryEntity.toString();

        // assert
        expect(stringRepresentation, contains('CategoryEntity'));
        expect(stringRepresentation, contains('id: 1'));
        expect(stringRepresentation, contains('name: Plumbing'));
        expect(stringRepresentation, contains('slug: plumbing'));
        expect(stringRepresentation, contains('level: 1'));
        expect(stringRepresentation, contains('isActive: true'));
      });
    });

    group('edge cases', () {
      test('should handle null translations gracefully', () {
        // arrange
        const categoryWithoutTranslations = CategoryEntity(
          id: '1',
          name: 'Test',
          slug: 'test',
          translations: null,
        );

        // act & assert
        expect(categoryWithoutTranslations.getLocalizedName('es'), 'Test');
      });

      test('should handle empty translations gracefully', () {
        // arrange
        const categoryWithEmptyTranslations = CategoryEntity(
          id: '1',
          name: 'Test',
          slug: 'test',
          translations: {},
        );

        // act & assert
        expect(categoryWithEmptyTranslations.getLocalizedName('es'), 'Test');
      });
    });
  });
}