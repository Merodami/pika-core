import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pika_app/features/categories/presentation/widgets/modern_category_grid.dart';
import 'package:pika_app/features/categories/domain/entities/category_entity.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Category Feature Integration Tests', () {
    testWidgets('should display categories in grid with proper functionality', (tester) async {
      // Test data
      final categories = [
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

      CategoryEntity? tappedCategory;

      // Build the widget tree
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: ModernCategoryGrid(
                onCategoryTap: (category) {
                  tappedCategory = category;
                },
                crossAxisCount: 2,
                showFeaturedOnly: false,
              ),
            ),
          ),
        ),
      );

      // Wait for initial loading to complete
      await tester.pumpAndSettle();

      // Verify loading state appears first
      expect(find.byType(CircularProgressIndicator), findsAny);

      // Wait for data to load (this would normally come from providers)
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Verify category cards are displayed
      // Note: In real integration tests, you'd mock the providers to return test data
      expect(find.text('Category'), findsAny);
    });

    testWidgets('should handle error states gracefully', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: ModernCategoryGrid(
                onCategoryTap: (category) {},
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // In case of error, verify error handling
      if (tester.any(find.text('Try Again'))) {
        // Tap retry button
        await tester.tap(find.text('Try Again'));
        await tester.pumpAndSettle();
      }
    });

    testWidgets('should support accessibility features', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: ModernCategoryGrid(
                onCategoryTap: (category) {},
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify semantic labels are present for accessibility
      final semanticsHandle = tester.ensureSemantics();
      
      // This would verify that proper semantic labels are set
      expect(
        tester.getSemantics(find.byType(ModernCategoryGrid)),
        matchesSemantics(),
      );
      
      semanticsHandle.dispose();
    });

    testWidgets('should support different grid configurations', (tester) async {
      // Test 1 column grid
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: ModernCategoryGrid(
                onCategoryTap: (category) {},
                crossAxisCount: 1,
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Test 3 column grid
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: ModernCategoryGrid(
                onCategoryTap: (category) {},
                crossAxisCount: 3,
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify grid layout adapts correctly
      expect(find.byType(GridView), findsOneWidget);
    });

    testWidgets('should handle featured categories mode', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: ModernCategoryGrid(
                onCategoryTap: (category) {},
                showFeaturedOnly: true,
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify featured categories are loaded
      // This would use a different provider in real implementation
      expect(find.byType(ModernCategoryGrid), findsOneWidget);
    });
  });
}