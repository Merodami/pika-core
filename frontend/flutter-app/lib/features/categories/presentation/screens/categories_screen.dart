import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/routing/app_router.dart';
import '../../domain/entities/category_entity.dart';
import '../providers/category_providers.dart';
import '../widgets/modern_category_grid.dart';
import '../../../../shared/widgets/error_retry_widget.dart';

class CategoriesScreen extends ConsumerStatefulWidget {
  const CategoriesScreen({super.key});

  @override
  ConsumerState<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends ConsumerState<CategoriesScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  bool _showFeaturedOnly = false;
  String _sortBy = 'sort_order';
  String _orderBy = 'asc';
  String? _selectedParentId;
  int? _selectedLevel;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onCategoryTap(CategoryEntity category) {
    context.push(AppRoutes.categoryDetails(category.id));
  }

  void _onSearch(String query) {
    setState(() {
      _searchQuery = query.trim();
    });
  }

  void _toggleFeaturedOnly() {
    setState(() {
      _showFeaturedOnly = !_showFeaturedOnly;
    });
  }

  void _showFilterBottomSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => _FilterBottomSheet(
        currentSort: _sortBy,
        currentOrder: _orderBy,
        currentLevel: _selectedLevel,
        onApplyFilters: (sort, order, level) {
          setState(() {
            _sortBy = sort;
            _orderBy = order;
            _selectedLevel = level;
          });
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Categories'),
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(
              _showFeaturedOnly ? Icons.star : Icons.star_outline,
              color: _showFeaturedOnly ? Colors.amber : null,
            ),
            onPressed: _toggleFeaturedOnly,
            tooltip: _showFeaturedOnly ? 'Show All Categories' : 'Show Featured Only',
          ),
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: _showFilterBottomSheet,
            tooltip: 'Filter & Sort',
          ),
        ],
      ),
      body: Column(
        children: [
          // Search Bar
          Container(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              onChanged: _onSearch,
              decoration: InputDecoration(
                hintText: 'Search categories...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          _onSearch('');
                        },
                      )
                    : null,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                filled: true,
                fillColor: Theme.of(context).colorScheme.surface,
              ),
            ),
          ),
          
          // Categories Grid
          Expanded(
            child: _searchQuery.isNotEmpty
                ? _SearchResults(
                    query: _searchQuery,
                    onCategoryTap: _onCategoryTap,
                  )
                : ModernCategoryGrid(
                    onCategoryTap: _onCategoryTap,
                    showFeaturedOnly: _showFeaturedOnly,
                    crossAxisCount: _getCrossAxisCount(context),
                    sort: _sortBy,
                    order: _orderBy,
                    level: _selectedLevel,
                    parentId: _selectedParentId,
                  ),
          ),
        ],
      ),
    );
  }

  int _getCrossAxisCount(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    if (width > 1200) return 4;
    if (width > 800) return 3;
    if (width > 600) return 2;
    return 2;
  }
}

class _SearchResults extends ConsumerWidget {
  const _SearchResults({
    required this.query,
    required this.onCategoryTap,
  });

  final String query;
  final Function(CategoryEntity) onCategoryTap;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final searchAsync = ref.watch(searchCategoriesProvider(query: query));

    return searchAsync.when(
      data: (categories) {
        if (categories.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.search_off,
                  size: 64,
                  color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5),
                ),
                const SizedBox(height: 16),
                Text(
                  'No categories found for "$query"',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Try a different search term',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5),
                  ),
                ),
              ],
            ),
          );
        }

        return GridView.builder(
          padding: const EdgeInsets.all(16),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            childAspectRatio: 0.85,
          ),
          itemCount: categories.length,
          itemBuilder: (context, index) {
            final category = categories[index];
            return _CategorySearchCard(
              category: category,
              onTap: () => onCategoryTap(category),
            );
          },
        );
      },
      loading: () => const Center(
        child: CircularProgressIndicator(),
      ),
      error: (error, stack) => ErrorRetryWidget(
        error: error.toString(),
        onRetry: () => ref.refresh(searchCategoriesProvider(query: query)),
      ),
    );
  }
}

class _CategorySearchCard extends StatelessWidget {
  const _CategorySearchCard({
    required this.category,
    required this.onTap,
  });

  final CategoryEntity category;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: onTap,
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
                    height: 48,
                    width: 48,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(
                      height: 48,
                      width: 48,
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.primaryContainer,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        Icons.category,
                        color: Theme.of(context).colorScheme.onPrimaryContainer,
                      ),
                    ),
                  ),
                )
              else
                Container(
                  height: 48,
                  width: 48,
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.primaryContainer,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    Icons.category,
                    color: Theme.of(context).colorScheme.onPrimaryContainer,
                  ),
                ),
              const SizedBox(height: 12),
              Text(
                category.name,
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              if (category.description != null) ...[
                const SizedBox(height: 4),
                Text(
                  category.description!,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7),
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _FilterBottomSheet extends StatefulWidget {
  const _FilterBottomSheet({
    required this.currentSort,
    required this.currentOrder,
    required this.currentLevel,
    required this.onApplyFilters,
  });

  final String currentSort;
  final String currentOrder;
  final int? currentLevel;
  final Function(String sort, String order, int? level) onApplyFilters;

  @override
  State<_FilterBottomSheet> createState() => _FilterBottomSheetState();
}

class _FilterBottomSheetState extends State<_FilterBottomSheet> {
  late String _selectedSort;
  late String _selectedOrder;
  int? _selectedLevel;

  @override
  void initState() {
    super.initState();
    _selectedSort = widget.currentSort;
    _selectedOrder = widget.currentOrder;
    _selectedLevel = widget.currentLevel;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Filter & Sort',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          // Sort By
          Text(
            'Sort By',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            value: _selectedSort,
            decoration: InputDecoration(
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            items: const [
              DropdownMenuItem(value: 'sort_order', child: Text('Default Order')),
              DropdownMenuItem(value: 'name', child: Text('Name')),
              DropdownMenuItem(value: 'created_at', child: Text('Created Date')),
              DropdownMenuItem(value: 'updated_at', child: Text('Updated Date')),
            ],
            onChanged: (value) {
              setState(() {
                _selectedSort = value!;
              });
            },
          ),
          const SizedBox(height: 16),
          
          // Order
          Text(
            'Order',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            value: _selectedOrder,
            decoration: InputDecoration(
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            items: const [
              DropdownMenuItem(value: 'asc', child: Text('Ascending')),
              DropdownMenuItem(value: 'desc', child: Text('Descending')),
            ],
            onChanged: (value) {
              setState(() {
                _selectedOrder = value!;
              });
            },
          ),
          const SizedBox(height: 16),
          
          // Level Filter
          Text(
            'Category Level',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          DropdownButtonFormField<int?>(
            value: _selectedLevel,
            decoration: InputDecoration(
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            items: const [
              DropdownMenuItem(value: null, child: Text('All Levels')),
              DropdownMenuItem(value: 1, child: Text('Top Level')),
              DropdownMenuItem(value: 2, child: Text('Second Level')),
              DropdownMenuItem(value: 3, child: Text('Third Level')),
            ],
            onChanged: (value) {
              setState(() {
                _selectedLevel = value;
              });
            },
          ),
          const SizedBox(height: 24),
          
          // Action Buttons
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    setState(() {
                      _selectedSort = 'sort_order';
                      _selectedOrder = 'asc';
                      _selectedLevel = null;
                    });
                  },
                  child: const Text('Reset'),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    widget.onApplyFilters(_selectedSort, _selectedOrder, _selectedLevel);
                    Navigator.of(context).pop();
                  },
                  child: const Text('Apply'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}