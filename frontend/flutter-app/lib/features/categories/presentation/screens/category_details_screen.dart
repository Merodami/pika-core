import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/routing/app_router.dart';
import '../../../../shared/widgets/error_retry_widget.dart';
import '../../domain/entities/category_entity.dart';
import '../providers/category_providers.dart';
import '../widgets/modern_category_grid.dart';

class CategoryDetailsScreen extends ConsumerWidget {
  final String categoryId;
  
  const CategoryDetailsScreen({
    super.key,
    required this.categoryId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categoryAsync = ref.watch(categoryByIdProvider(id: categoryId));

    return categoryAsync.when(
      loading: () => Scaffold(
        appBar: AppBar(
          title: const Text('Category Details'),
        ),
        body: const Center(
          child: CircularProgressIndicator(),
        ),
      ),
      error: (error, stack) => Scaffold(
        appBar: AppBar(
          title: const Text('Category Details'),
        ),
        body: ErrorRetryWidget(
          error: error.toString(),
          onRetry: () => ref.refresh(categoryByIdProvider(id: categoryId)),
        ),
      ),
      data: (category) => _CategoryDetailsView(category: category),
    );
  }
}

class _CategoryDetailsView extends ConsumerWidget {
  const _CategoryDetailsView({required this.category});

  final CategoryEntity category;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // App Bar with category header
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              title: Text(
                category.name,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                ),
              ),
              background: _CategoryHeader(category: category),
            ),
          ),
          
          // Category Details
          SliverToBoxAdapter(
            child: _CategoryInfo(category: category),
          ),
          
          // Subcategories Section
          if (category.hasChildren) ...[
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Text(
                  'Subcategories',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 200,
                child: _SubcategoriesList(category: category),
              ),
            ),
          ] else ...[
            // Show related categories if no subcategories
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Text(
                  'Related Categories',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 200,
                child: _RelatedCategories(currentCategory: category),
              ),
            ),
          ],
          
          // Services Section (Placeholder for now)
          const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Text(
                'Services in this Category',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: _ServicesSection(category: category),
          ),
          
          // Bottom padding
          const SliverToBoxAdapter(
            child: SizedBox(height: 32),
          ),
        ],
      ),
    );
  }
}

class _CategoryHeader extends StatelessWidget {
  const _CategoryHeader({required this.category});

  final CategoryEntity category;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Theme.of(context).colorScheme.primaryContainer,
            Theme.of(context).colorScheme.primaryContainer.withOpacity(0.8),
          ],
        ),
      ),
      child: Stack(
        children: [
          // Background pattern
          Positioned.fill(
            child: CustomPaint(
              painter: _PatternPainter(
                color: Theme.of(context).colorScheme.onPrimaryContainer.withOpacity(0.1),
              ),
            ),
          ),
          
          // Category icon
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (category.iconUrl != null)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(20),
                    child: Image.network(
                      category.iconUrl!,
                      width: 80,
                      height: 80,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => _FallbackIcon(),
                    ),
                  )
                else
                  _FallbackIcon(),
                const SizedBox(height: 16),
                if (category.path.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.surface.withOpacity(0.9),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      'Level ${category.level}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _FallbackIcon extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 80,
      height: 80,
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: Theme.of(context).colorScheme.outline.withOpacity(0.3),
          width: 2,
        ),
      ),
      child: Icon(
        Icons.category,
        size: 40,
        color: Theme.of(context).colorScheme.onSurface,
      ),
    );
  }
}

class _PatternPainter extends CustomPainter {
  final Color color;

  _PatternPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 1;

    // Draw a simple grid pattern
    const spacing = 20.0;
    for (double x = 0; x < size.width; x += spacing) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += spacing) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _CategoryInfo extends StatelessWidget {
  const _CategoryInfo({required this.category});

  final CategoryEntity category;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (category.description != null) ...[
            Text(
              'Description',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              category.description!,
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            const SizedBox(height: 24),
          ],
          
          // Category metadata
          _InfoGrid(category: category),
        ],
      ),
    );
  }
}

class _InfoGrid extends StatelessWidget {
  const _InfoGrid({required this.category});

  final CategoryEntity category;

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 3,
      crossAxisSpacing: 16,
      mainAxisSpacing: 16,
      children: [
        _InfoCard(
          icon: Icons.layers,
          title: 'Level',
          value: category.level.toString(),
        ),
        _InfoCard(
          icon: Icons.check_circle,
          title: 'Status',
          value: category.isActive ? 'Active' : 'Inactive',
          valueColor: category.isActive ? Colors.green : Colors.red,
        ),
        _InfoCard(
          icon: Icons.sort,
          title: 'Sort Order',
          value: category.sortOrder.toString(),
        ),
        _InfoCard(
          icon: Icons.calendar_today,
          title: 'Created',
          value: category.createdAt != null 
              ? '${category.createdAt!.day}/${category.createdAt!.month}/${category.createdAt!.year}'
              : 'Unknown',
        ),
      ],
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({
    required this.icon,
    required this.title,
    required this.value,
    this.valueColor,
  });

  final IconData icon;
  final String title;
  final String value;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Icon(
              icon,
              size: 20,
              color: Theme.of(context).colorScheme.primary,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    title,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7),
                    ),
                  ),
                  Text(
                    value,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: valueColor,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SubcategoriesList extends StatelessWidget {
  const _SubcategoriesList({required this.category});

  final CategoryEntity category;

  @override
  Widget build(BuildContext context) {
    if (category.children == null || category.children!.isEmpty) {
      return const Center(
        child: Text('No subcategories available'),
      );
    }

    return ListView.builder(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: category.children!.length,
      itemBuilder: (context, index) {
        final subcategory = category.children![index];
        return Container(
          width: 160,
          margin: const EdgeInsets.only(right: 16),
          child: Card(
            elevation: 2,
            child: InkWell(
              onTap: () => context.push(AppRoutes.categoryDetails(subcategory.id)),
              borderRadius: BorderRadius.circular(12),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (subcategory.iconUrl != null)
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.network(
                          subcategory.iconUrl!,
                          width: 40,
                          height: 40,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) => Icon(
                            Icons.category,
                            size: 40,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                        ),
                      )
                    else
                      Icon(
                        Icons.category,
                        size: 40,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                    const SizedBox(height: 8),
                    Text(
                      subcategory.name,
                      style: Theme.of(context).textTheme.titleSmall,
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _RelatedCategories extends ConsumerWidget {
  const _RelatedCategories({required this.currentCategory});

  final CategoryEntity currentCategory;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Get categories at the same level or parent level
    final categoriesAsync = ref.watch(categoriesProvider(
      level: currentCategory.level,
      isActive: true,
      limit: 10,
    ));

    return categoriesAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) => Center(
        child: Text('Failed to load related categories: $error'),
      ),
      data: (paginatedResult) {
        final relatedCategories = paginatedResult.items
            .where((cat) => cat.id != currentCategory.id)
            .take(5)
            .toList();

        if (relatedCategories.isEmpty) {
          return const Center(
            child: Text('No related categories found'),
          );
        }

        return ListView.builder(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          itemCount: relatedCategories.length,
          itemBuilder: (context, index) {
            final category = relatedCategories[index];
            return Container(
              width: 160,
              margin: const EdgeInsets.only(right: 16),
              child: Card(
                elevation: 2,
                child: InkWell(
                  onTap: () => context.push(AppRoutes.categoryDetails(category.id)),
                  borderRadius: BorderRadius.circular(12),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        if (category.iconUrl != null)
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.network(
                              category.iconUrl!,
                              width: 40,
                              height: 40,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) => Icon(
                                Icons.category,
                                size: 40,
                                color: Theme.of(context).colorScheme.primary,
                              ),
                            ),
                          )
                        else
                          Icon(
                            Icons.category,
                            size: 40,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                        const SizedBox(height: 8),
                        Text(
                          category.name,
                          style: Theme.of(context).textTheme.titleSmall,
                          textAlign: TextAlign.center,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }
}

class _ServicesSection extends StatelessWidget {
  const _ServicesSection({required this.category});

  final CategoryEntity category;

  @override
  Widget build(BuildContext context) {
    // For now, this is a placeholder since we're focusing on categories
    // In a real app, you'd have a services provider and display actual services
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.3),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: Theme.of(context).colorScheme.outline.withOpacity(0.3),
        ),
      ),
      child: Column(
        children: [
          Icon(
            Icons.build,
            size: 48,
            color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5),
          ),
          const SizedBox(height: 16),
          Text(
            'Services Coming Soon',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Service listings for ${category.name} will be available here.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7),
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          OutlinedButton(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Service feature coming soon!'),
                ),
              );
            },
            child: const Text('Browse Services'),
          ),
        ],
      ),
    );
  }
}