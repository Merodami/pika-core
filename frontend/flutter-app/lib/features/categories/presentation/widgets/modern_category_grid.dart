import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';

import '../../../../core/localization/app_localizations.dart';
import '../../../../core/monitoring/performance_service.dart';
import '../../../../shared/widgets/error_retry_widget.dart';
import '../../domain/entities/category_entity.dart';
import '../providers/category_providers.dart';

/// Modern category grid widget using Clean Architecture and latest Flutter patterns
/// Demonstrates state-of-the-art implementation with performance monitoring
class ModernCategoryGrid extends ConsumerWidget {
  const ModernCategoryGrid({
    super.key,
    this.onCategoryTap,
    this.crossAxisCount = 2,
    this.showFeaturedOnly = false,
    this.parentId,
    this.level,
    this.sort = 'sort_order',
    this.order = 'asc',
    this.includeChildren = false,
  });

  final void Function(CategoryEntity category)? onCategoryTap;
  final int crossAxisCount;
  final bool showFeaturedOnly;
  final String? parentId;
  final int? level;
  final String sort;
  final String order;
  final bool includeChildren;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    
    // Use the appropriate provider based on showFeaturedOnly flag
    final AsyncValue<List<CategoryEntity>> categoriesAsyncValue = showFeaturedOnly
        ? ref.watch(featuredCategoriesProvider())
        : ref.watch(categoriesProvider(
            parentId: parentId,
            level: level,
            isActive: true,
            includeChildren: includeChildren,
            sort: sort,
            order: order,
          )).when(
              loading: () => const AsyncValue.loading(),
              error: (e, s) => AsyncValue.error(e, s),
              data: (paginatedResult) => AsyncValue.data(paginatedResult.items),
            );

    return categoriesAsyncValue.when(
      loading: () => _buildShimmerGrid(context),
      error: (error, stackTrace) => _buildErrorWidget(
        context,
        error,
        () => ref.invalidate(showFeaturedOnly 
            ? featuredCategoriesProvider 
            : categoriesProvider),
      ),
      data: (categories) => _buildCategoryGrid(context, categories, l10n),
    );
  }

  Widget _buildCategoryGrid(
    BuildContext context,
    List<CategoryEntity> categories,
    AppLocalizations l10n,
  ) {
    if (categories.isEmpty) {
      return _buildEmptyState(context, l10n);
    }

    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: crossAxisCount,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
        childAspectRatio: 1.0,
      ),
      itemCount: categories.length,
      itemBuilder: (context, index) {
        final category = categories[index];
        return ModernCategoryCard(
          category: category,
          onTap: () => _handleCategoryTap(category),
        );
      },
    );
  }

  Widget _buildShimmerGrid(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: crossAxisCount,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
        childAspectRatio: 1.0,
      ),
      itemCount: 6, // Show 6 shimmer cards
      itemBuilder: (context, index) => const _ShimmerCategoryCard(),
    );
  }

  Widget _buildErrorWidget(
    BuildContext context,
    Object error,
    VoidCallback onRetry,
  ) {
    return ErrorRetryWidget(
      error: error,
      onRetry: onRetry,
      message: 'Failed to load categories',
    );
  }

  Widget _buildEmptyState(BuildContext context, AppLocalizations l10n) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.category_outlined,
            size: 64,
            color: Theme.of(context).colorScheme.outline,
          ),
          const SizedBox(height: 16),
          Text(
            showFeaturedOnly ? 'No featured categories' : 'No categories available',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: Theme.of(context).colorScheme.outline,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Categories will appear here once they are added.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Theme.of(context).colorScheme.outline,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  void _handleCategoryTap(CategoryEntity category) {
    // Record performance metric
    PerformanceService.instance.logEvent(
      'category_tapped',
      parameters: {
        'category_id': category.id,
        'category_name': category.name,
        'level': category.level,
      },
    );

    onCategoryTap?.call(category);
  }
}

/// Modern category card with Material 3 design and accessibility support
class ModernCategoryCard extends StatelessWidget {
  const ModernCategoryCard({
    super.key,
    required this.category,
    this.onTap,
  });

  final CategoryEntity category;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: colorScheme.outlineVariant,
          width: 1,
        ),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Semantics(
          label: 'Category: ${_getDisplayName()}',
          button: true,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Category icon/image
                _buildCategoryIcon(context),
                const SizedBox(height: 12),
                
                // Category name
                Text(
                  _getDisplayName(),
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: colorScheme.onSurface,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                
                // Level indicator
                Text(
                  'Level ${category.level}',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
                
                // Availability indicator
                if (category.isAvailable)
                  Container(
                    margin: const EdgeInsets.only(top: 8),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: colorScheme.primaryContainer,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      'Available',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: colorScheme.onPrimaryContainer,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCategoryIcon(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    
    if (category.iconUrl != null) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: CachedNetworkImage(
          imageUrl: category.iconUrl!,
          width: 48,
          height: 48,
          fit: BoxFit.cover,
          placeholder: (context, url) => Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: colorScheme.surfaceVariant,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              Icons.image_outlined,
              color: colorScheme.onSurfaceVariant,
            ),
          ),
          errorWidget: (context, url, error) => _buildFallbackIcon(context),
        ),
      );
    }
    
    return _buildFallbackIcon(context);
  }

  Widget _buildFallbackIcon(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    
    // Map category slug to appropriate icon
    IconData iconData = _getIconForCategory(category.slug);
    
    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        color: colorScheme.primaryContainer,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Icon(
        iconData,
        color: colorScheme.onPrimaryContainer,
        size: 24,
      ),
    );
  }

  String _getDisplayName() {
    // Use Spanish (es) as default locale since it's the primary language
    return category.getLocalizedName('es');
  }

  IconData _getIconForCategory(String slug) {
    switch (slug.toLowerCase()) {
      case 'plumbing':
        return Icons.plumbing;
      case 'electrical':
        return Icons.electrical_services;
      case 'cleaning':
        return Icons.cleaning_services;
      case 'gardening':
        return Icons.yard;
      case 'painting':
        return Icons.format_paint;
      case 'carpentry':
        return Icons.construction;
      case 'automotive':
        return Icons.car_repair;
      case 'beauty':
        return Icons.face;
      case 'fitness':
        return Icons.fitness_center;
      case 'tutoring':
        return Icons.school;
      case 'photography':
        return Icons.camera_alt;
      case 'catering':
        return Icons.restaurant;
      default:
        return Icons.category;
    }
  }
}

/// Shimmer loading card for better UX
class _ShimmerCategoryCard extends StatelessWidget {
  const _ShimmerCategoryCard();

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: colorScheme.outlineVariant,
          width: 1,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Shimmer.fromColors(
          baseColor: colorScheme.surfaceVariant,
          highlightColor: colorScheme.surface,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Icon placeholder
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: colorScheme.surfaceVariant,
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              const SizedBox(height: 12),
              
              // Title placeholder
              Container(
                width: 80,
                height: 16,
                decoration: BoxDecoration(
                  color: colorScheme.surfaceVariant,
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              const SizedBox(height: 8),
              
              // Subtitle placeholder
              Container(
                width: 60,
                height: 12,
                decoration: BoxDecoration(
                  color: colorScheme.surfaceVariant,
                  borderRadius: BorderRadius.circular(6),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}