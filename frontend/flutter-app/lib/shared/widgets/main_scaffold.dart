import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:badges/badges.dart' as badges;

import '../../core/localization/app_localizations.dart';
import '../../core/routing/routes.dart';
import '../../features/notifications/presentation/providers/notifications_provider.dart';

class MainScaffold extends ConsumerStatefulWidget {
  final Widget child;
  
  const MainScaffold({
    super.key,
    required this.child,
  });

  @override
  ConsumerState<MainScaffold> createState() => _MainScaffoldState();
}

class _MainScaffoldState extends ConsumerState<MainScaffold> {
  int _selectedIndex = 0;
  
  final _routes = [
    AppRoutes.home,
    AppRoutes.categories,
    AppRoutes.services,
    AppRoutes.chat,
    AppRoutes.profile,
  ];
  
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _updateSelectedIndex();
  }
  
  void _updateSelectedIndex() {
    final location = GoRouterState.of(context).uri.toString();
    final index = _routes.indexWhere((route) => location.startsWith(route));
    if (index != -1 && index != _selectedIndex) {
      setState(() {
        _selectedIndex = index;
      });
    }
  }
  
  void _onItemTapped(int index) {
    if (index != _selectedIndex) {
      setState(() {
        _selectedIndex = index;
      });
      context.go(_routes[index]);
    }
  }
  
  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final unreadCount = ref.watch(unreadNotificationsCountProvider);
    
    return Scaffold(
      body: widget.child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: _onItemTapped,
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.home_outlined),
            selectedIcon: const Icon(Icons.home),
            label: l10n.home,
          ),
          NavigationDestination(
            icon: const Icon(Icons.category_outlined),
            selectedIcon: const Icon(Icons.category),
            label: l10n.categories,
          ),
          NavigationDestination(
            icon: const Icon(Icons.home_repair_service_outlined),
            selectedIcon: const Icon(Icons.home_repair_service),
            label: l10n.services,
          ),
          NavigationDestination(
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
                badgeColor: Theme.of(context).colorScheme.error,
                padding: const EdgeInsets.all(4),
              ),
              child: const Icon(Icons.chat_bubble_outline),
            ),
            selectedIcon: badges.Badge(
              showBadge: unreadCount > 0,
              badgeContent: Text(
                unreadCount > 99 ? '99+' : unreadCount.toString(),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                ),
              ),
              badgeStyle: badges.BadgeStyle(
                badgeColor: Theme.of(context).colorScheme.error,
                padding: const EdgeInsets.all(4),
              ),
              child: const Icon(Icons.chat_bubble),
            ),
            label: l10n.chat,
          ),
          NavigationDestination(
            icon: const Icon(Icons.person_outline),
            selectedIcon: const Icon(Icons.person),
            label: l10n.profile,
          ),
        ],
      ),
    );
  }
}