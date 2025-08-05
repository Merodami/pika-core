import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../../auth/presentation/providers/auth_providers.dart';
import '../../../../core/localization/app_localizations.dart';
import '../../../../core/routing/routes.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final user = ref.watch(currentUserProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.profile),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () {
              context.push(AppRoutes.editProfile);
            },
          ),
        ],
      ),
      body: user == null
          ? const Center(
              child: CircularProgressIndicator(),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  // Profile Avatar
                  Center(
                    child: Stack(
                      children: [
                        CircleAvatar(
                          radius: 60,
                          backgroundColor: theme.colorScheme.primary,
                          backgroundImage: user.avatarUrl != null
                              ? CachedNetworkImageProvider(user.avatarUrl!)
                              : null,
                          child: user.avatarUrl == null
                              ? Text(
                                  user.firstName.substring(0, 1).toUpperCase(),
                                  style: const TextStyle(
                                    fontSize: 36,
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                  ),
                                )
                              : null,
                        ),
                        Positioned(
                          bottom: 0,
                          right: 0,
                          child: Container(
                            decoration: BoxDecoration(
                              color: theme.colorScheme.primary,
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: theme.colorScheme.surface,
                                width: 2,
                              ),
                            ),
                            child: IconButton(
                              icon: const Icon(
                                Icons.camera_alt,
                                color: Colors.white,
                                size: 20,
                              ),
                              onPressed: () {
                                // TODO: Implement image picker
                              },
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // User Info
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Personal Information',
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 16),
                          _InfoRow(
                            icon: Icons.person,
                            label: 'Name',
                            value: '${user.firstName} ${user.lastName}',
                          ),
                          const SizedBox(height: 12),
                          _InfoRow(
                            icon: Icons.email,
                            label: 'Email',
                            value: user.email,
                          ),
                          if (user.phoneNumber != null) ...[
                            const SizedBox(height: 12),
                            _InfoRow(
                              icon: Icons.phone,
                              label: 'Phone',
                              value: user.phoneNumber!,
                            ),
                          ],
                          const SizedBox(height: 12),
                          _InfoRow(
                            icon: Icons.badge,
                            label: 'Role',
                            value: user.role == 'PROVIDER' 
                                ? 'Service Provider' 
                                : user.role.toLowerCase().replaceFirst(
                                    user.role[0], 
                                    user.role[0].toUpperCase()
                                  ),
                          ),
                          const SizedBox(height: 12),
                          _InfoRow(
                            icon: Icons.verified,
                            label: 'Email Verified',
                            value: user.emailVerified ? 'Yes' : 'No',
                            valueColor: user.emailVerified 
                                ? Colors.green 
                                : Colors.orange,
                          ),
                        ],
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // Account Settings
                  Card(
                    child: Column(
                      children: [
                        ListTile(
                          leading: const Icon(Icons.settings),
                          title: const Text('Settings'),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () {
                            // TODO: Navigate to settings
                          },
                        ),
                        const Divider(height: 1),
                        ListTile(
                          leading: const Icon(Icons.help_outline),
                          title: const Text('Help & Support'),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () {
                            // TODO: Navigate to help
                          },
                        ),
                        const Divider(height: 1),
                        ListTile(
                          leading: const Icon(Icons.privacy_tip_outlined),
                          title: const Text('Privacy Policy'),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () {
                            // TODO: Navigate to privacy policy
                          },
                        ),
                        const Divider(height: 1),
                        ListTile(
                          leading: const Icon(Icons.description_outlined),
                          title: const Text('Terms of Service'),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () {
                            // TODO: Navigate to terms
                          },
                        ),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // Logout Button
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () async {
                        final shouldLogout = await showDialog<bool>(
                          context: context,
                          builder: (context) => AlertDialog(
                            title: const Text('Logout'),
                            content: const Text('Are you sure you want to logout?'),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.of(context).pop(false),
                                child: const Text('Cancel'),
                              ),
                              TextButton(
                                onPressed: () => Navigator.of(context).pop(true),
                                child: const Text('Logout'),
                              ),
                            ],
                          ),
                        );
                        
                        if (shouldLogout == true) {
                          final authNotifier = ref.read(authStateProvider.notifier);
                          await authNotifier.logout();
                          if (context.mounted) {
                            context.go(AppRoutes.login);
                          }
                        }
                      },
                      icon: const Icon(Icons.logout),
                      label: const Text('Logout'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: theme.colorScheme.error,
                        side: BorderSide(color: theme.colorScheme.error),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: 32),
                ],
              ),
            ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color? valueColor;

  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Row(
      children: [
        Icon(
          icon,
          size: 20,
          color: theme.colorScheme.onSurfaceVariant,
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              Text(
                value,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: valueColor ?? theme.colorScheme.onSurface,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}