import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';
import 'package:badges/badges.dart' as badges;

import '../../../../core/localization/app_localizations.dart';
import '../../../../core/routing/routes.dart';
import '../../../auth/presentation/providers/auth_providers.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../notifications/presentation/providers/notifications_provider.dart';
import '../../domain/models/category_model.dart';
import '../../domain/models/service_model.dart';
import '../providers/home_providers.dart';
import '../widgets/category_card.dart';
import '../widgets/service_card.dart';
import '../widgets/search_bar.dart';
import '../../../../shared/widgets/web_notification_test.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _scrollController = ScrollController();
  
  @override
  void initState() {
    super.initState();
    // Load initial data
    Future.microtask(() {
      ref.read(categoriesProvider.notifier).loadCategories();
      ref.read(featuredServicesProvider.notifier).loadFeaturedServices();
    });
  }
  
  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final theme = Theme.of(context);
    final user = ref.watch(currentUserProvider);
    
    return Scaffold(
      body: CustomScrollView(
        controller: _scrollController,
        slivers: [
          // App Bar
          SliverAppBar(
            expandedHeight: 120,
            floating: true,
            pinned: true,
            backgroundColor: theme.scaffoldBackgroundColor,
            flexibleSpace: FlexibleSpaceBar(
              titlePadding: const EdgeInsets.only(left: 16, bottom: 16),
              title: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${l10n.welcome}, ${user?.firstName ?? 'User'}! 👋',
                    style: theme.textTheme.titleLarge,
                  ),
                  Text(
                    _getGreeting(),
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              // Notifications button
              Consumer(
                builder: (context, ref, child) {
                  final unreadCount = ref.watch(unreadNotificationsCountProvider);
                  
                  return IconButton(
                    onPressed: () => context.push(AppRoutes.notifications),
                    icon: badges.Badge(
                      showBadge: unreadCount > 0,
                      badgeContent: Text(
                        unreadCount > 99 ? '99+' : unreadCount.toString(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                        ),
                      ),
                      badgeStyle: badges.BadgeStyle(
                        badgeColor: theme.colorScheme.error,
                        padding: const EdgeInsets.all(4),
                      ),
                      child: const Icon(Icons.notifications_outlined),
                    ),
                  );
                },
              ),
              
              // Profile avatar
              Padding(
                padding: const EdgeInsets.only(right: 16),
                child: GestureDetector(
                  onTap: () => context.go(AppRoutes.profile),
                  child: CircleAvatar(
                    radius: 18,
                    backgroundColor: theme.colorScheme.primary,
                    backgroundImage: user?.avatarUrl != null
                        ? CachedNetworkImageProvider(user!.avatarUrl!)
                        : null,
                    child: user?.avatarUrl == null
                        ? Text(
                            user?.firstName.substring(0, 1).toUpperCase() ?? 'U',
                            style: const TextStyle(color: Colors.white),
                          )
                        : null,
                  ),
                ),
              ),
            ],
          ),
          
          // Search Bar
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: HomeSearchBar(
                onTap: () => context.push(AppRoutes.services),
              ),
            ),
          ),
          
          
          // Location Banner (if provider)
          if (user?.role == 'PROVIDER')
            SliverToBoxAdapter(
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: theme.colorScheme.primaryContainer,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.location_on,
                      color: theme.colorScheme.onPrimaryContainer,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Enable location services',
                            style: theme.textTheme.titleSmall?.copyWith(
                              color: theme.colorScheme.onPrimaryContainer,
                            ),
                          ),
                          Text(
                            'Get more bookings from nearby customers',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onPrimaryContainer,
                            ),
                          ),
                        ],
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        // TODO: Enable location
                      },
                      child: const Text('Enable'),
                    ),
                  ],
                ),
              ),
            ),
          
          // Categories Section
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.only(
                left: 16,
                right: 16,
                top: 24,
                bottom: 12,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    l10n.popularCategories,
                    style: theme.textTheme.titleLarge,
                  ),
                  TextButton(
                    onPressed: () => context.go(AppRoutes.categories),
                    child: Text(l10n.seeAll),
                  ),
                ],
              ),
            ),
          ),
          
          // Categories List
          SliverToBoxAdapter(
            child: SizedBox(
              height: 120,
              child: Consumer(
                builder: (context, ref, child) {
                  final categoriesAsync = ref.watch(categoriesProvider);
                  
                  return categoriesAsync.when(
                    data: (categories) => ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: categories.length,
                      itemBuilder: (context, index) {
                        final category = categories[index];
                        return Padding(
                          padding: const EdgeInsets.only(right: 12),
                          child: CategoryCard(
                            category: category,
                            onTap: () => context.push(
                              AppRoutes.categoryDetails(category.id),
                            ),
                          ),
                        );
                      },
                    ),
                    loading: () => ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: 5,
                      itemBuilder: (context, index) {
                        return const Padding(
                          padding: EdgeInsets.only(right: 12),
                          child: CategoryCardSkeleton(),
                        );
                      },
                    ),
                    error: (error, stack) => Center(
                      child: Text(
                        l10n.error,
                        style: theme.textTheme.bodyMedium,
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
          
          // Featured Services Section
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.only(
                left: 16,
                right: 16,
                top: 32,
                bottom: 12,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    l10n.featuredServices,
                    style: theme.textTheme.titleLarge,
                  ),
                  TextButton(
                    onPressed: () => context.go(AppRoutes.services),
                    child: Text(l10n.seeAll),
                  ),
                ],
              ),
            ),
          ),
          
          // Featured Services Grid
          Consumer(
            builder: (context, ref, child) {
              final servicesAsync = ref.watch(featuredServicesProvider);
              
              return servicesAsync.when(
                data: (services) => SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  sliver: SliverGrid(
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      mainAxisSpacing: 16,
                      crossAxisSpacing: 16,
                      childAspectRatio: 0.75,
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final service = services[index];
                        return ServiceCard(
                          service: service,
                          onTap: () => context.push(
                            AppRoutes.serviceDetails(service.id),
                          ),
                        );
                      },
                      childCount: services.length,
                    ),
                  ),
                ),
                loading: () => SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  sliver: SliverGrid(
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      mainAxisSpacing: 16,
                      crossAxisSpacing: 16,
                      childAspectRatio: 0.75,
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (context, index) => const ServiceCardSkeleton(),
                      childCount: 4,
                    ),
                  ),
                ),
                error: (error, stack) => SliverToBoxAdapter(
                  child: Center(
                    child: Padding(
                      padding: const EdgeInsets.all(32),
                      child: Column(
                        children: [
                          Icon(
                            Icons.error_outline,
                            size: 48,
                            color: theme.colorScheme.error,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            l10n.error,
                            style: theme.textTheme.bodyMedium,
                          ),
                          const SizedBox(height: 8),
                          TextButton(
                            onPressed: () {
                              ref.invalidate(featuredServicesProvider);
                            },
                            child: Text(l10n.retry),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
          
          // Bottom padding
          const SliverPadding(padding: EdgeInsets.only(bottom: 24)),
        ],
      ),
      
      // FAB for providers to create service
      floatingActionButton: user?.role == 'PROVIDER'
          ? FloatingActionButton.extended(
              onPressed: () => context.push(AppRoutes.createService),
              icon: const Icon(Icons.add),
              label: Text(l10n.createService),
            )
          : null,
    );
  }
  
  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) {
      return 'Good morning';
    } else if (hour < 18) {
      return 'Good afternoon';
    } else {
      return 'Good evening';
    }
  }
}

// Category Card Widget
class CategoryCard extends StatelessWidget {
  final CategoryModel category;
  final VoidCallback onTap;
  
  const CategoryCard({
    super.key,
    required this.category,
    required this.onTap,
  });
  
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 100,
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                color: theme.colorScheme.primaryContainer,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                _getCategoryIcon(category.slug),
                size: 30,
                color: theme.colorScheme.onPrimaryContainer,
              ),
            ),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Text(
                category.name,
                style: theme.textTheme.bodySmall,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  IconData _getCategoryIcon(String slug) {
    final iconMap = {
      'plumbing': Icons.plumbing,
      'electrical': Icons.electrical_services,
      'cleaning': Icons.cleaning_services,
      'gardening': Icons.grass,
      'painting': Icons.format_paint,
      'carpentry': Icons.carpenter,
      'moving': Icons.local_shipping,
      'appliance': Icons.kitchen,
    };
    
    return iconMap[slug] ?? Icons.home_repair_service;
  }
}

// Category Card Skeleton
class CategoryCardSkeleton extends StatelessWidget {
  const CategoryCardSkeleton({super.key});
  
  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade300,
      highlightColor: Colors.grey.shade100,
      child: Container(
        width: 100,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    );
  }
}

// Service Card placeholder (implement full widget in separate file)
class ServiceCard extends StatelessWidget {
  final ServiceModel service;
  final VoidCallback onTap;
  
  const ServiceCard({
    super.key,
    required this.service,
    required this.onTap,
  });
  
  @override
  Widget build(BuildContext context) {
    // Implement service card UI
    return Container();
  }
}

class ServiceCardSkeleton extends StatelessWidget {
  const ServiceCardSkeleton({super.key});
  
  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade300,
      highlightColor: Colors.grey.shade100,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    );
  }
}