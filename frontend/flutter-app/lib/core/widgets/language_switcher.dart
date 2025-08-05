import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/app_providers.dart';
import '../localization/app_localizations.dart';

/// Global language switcher widget that can be used anywhere in the app
class LanguageSwitcher extends ConsumerWidget {
  final bool showAsDropdown;
  final bool showFlags;
  
  const LanguageSwitcher({
    super.key,
    this.showAsDropdown = true,
    this.showFlags = true,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentLocale = ref.watch(localeProvider);
    final localeNotifier = ref.read(localeProvider.notifier);
    
    if (showAsDropdown) {
      return _DropdownLanguageSwitcher(
        currentLocale: currentLocale,
        onLanguageChanged: (languageCode) async {
          await localeNotifier.setLocale(languageCode);
        },
        showFlags: showFlags,
      );
    } else {
      return _ButtonLanguageSwitcher(
        currentLocale: currentLocale,
        onLanguageChanged: (languageCode) async {
          await localeNotifier.setLocale(languageCode);
        },
        showFlags: showFlags,
      );
    }
  }
}

class _DropdownLanguageSwitcher extends StatelessWidget {
  final Locale currentLocale;
  final Future<void> Function(String) onLanguageChanged;
  final bool showFlags;

  const _DropdownLanguageSwitcher({
    required this.currentLocale,
    required this.onLanguageChanged,
    required this.showFlags,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        border: Border.all(color: theme.colorScheme.outline.withOpacity(0.3)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: currentLocale.languageCode,
          icon: const Icon(Icons.keyboard_arrow_down, size: 16),
          style: theme.textTheme.bodyMedium,
          onChanged: (String? newValue) {
            if (newValue != null) {
              onLanguageChanged(newValue);
            }
          },
          items: _supportedLanguages.map<DropdownMenuItem<String>>((language) {
            return DropdownMenuItem<String>(
              value: language['code'],
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (showFlags) ...[
                    Text(
                      language['flag']!,
                      style: const TextStyle(fontSize: 16),
                    ),
                    const SizedBox(width: 8),
                  ],
                  Text(language['name']!),
                ],
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}

class _ButtonLanguageSwitcher extends StatelessWidget {
  final Locale currentLocale;
  final Future<void> Function(String) onLanguageChanged;
  final bool showFlags;

  const _ButtonLanguageSwitcher({
    required this.currentLocale,
    required this.onLanguageChanged,
    required this.showFlags,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return PopupMenuButton<String>(
      icon: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (showFlags) ...[
            Text(
              _getCurrentFlag(currentLocale.languageCode),
              style: const TextStyle(fontSize: 16),
            ),
            const SizedBox(width: 4),
          ],
          Icon(
            Icons.language,
            size: 20,
            color: theme.colorScheme.primary,
          ),
        ],
      ),
      onSelected: onLanguageChanged,
      itemBuilder: (BuildContext context) {
        return _supportedLanguages.map((language) {
          final isSelected = language['code'] == currentLocale.languageCode;
          
          return PopupMenuItem<String>(
            value: language['code'],
            child: Row(
              children: [
                if (showFlags) ...[
                  Text(
                    language['flag']!,
                    style: const TextStyle(fontSize: 16),
                  ),
                  const SizedBox(width: 8),
                ],
                Expanded(
                  child: Text(
                    language['name']!,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                      color: isSelected ? theme.colorScheme.primary : null,
                    ),
                  ),
                ),
                if (isSelected)
                  Icon(
                    Icons.check,
                    size: 16,
                    color: theme.colorScheme.primary,
                  ),
              ],
            ),
          );
        }).toList();
      },
    );
  }
}

/// Floating language switcher that can be placed anywhere
class FloatingLanguageSwitcher extends ConsumerWidget {
  final Alignment alignment;
  final EdgeInsets margin;

  const FloatingLanguageSwitcher({
    super.key,
    this.alignment = Alignment.topRight,
    this.margin = const EdgeInsets.all(16),
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentLocale = ref.watch(localeProvider);
    final localeNotifier = ref.read(localeProvider.notifier);
    final theme = Theme.of(context);
    
    return Positioned.fill(
      child: Align(
        alignment: alignment,
        child: Container(
          margin: margin,
          child: FloatingActionButton.small(
            heroTag: 'language_switcher',
            backgroundColor: theme.colorScheme.surface,
            foregroundColor: theme.colorScheme.primary,
            elevation: 4,
            onPressed: () => _showLanguageBottomSheet(
              context, 
              currentLocale, 
              (languageCode) async {
                await localeNotifier.setLocale(languageCode);
              }
            ),
            child: Text(
              _getCurrentFlag(currentLocale.languageCode),
              style: const TextStyle(fontSize: 16),
            ),
          ),
        ),
      ),
    );
  }
}

void _showLanguageBottomSheet(
  BuildContext context,
  Locale currentLocale,
  Future<void> Function(String) onLanguageChanged,
) {
  final theme = Theme.of(context);
  
  showModalBottomSheet(
    context: context,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
    ),
    builder: (context) {
      return Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.language,
                  color: theme.colorScheme.primary,
                ),
                const SizedBox(width: 8),
                Text(
                  'Choose Language',
                  style: theme.textTheme.titleLarge,
                ),
              ],
            ),
            const SizedBox(height: 16),
            ..._supportedLanguages.map((language) {
              final isSelected = language['code'] == currentLocale.languageCode;
              
              return ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Text(
                  language['flag']!,
                  style: const TextStyle(fontSize: 24),
                ),
                title: Text(
                  language['name']!,
                  style: theme.textTheme.bodyLarge?.copyWith(
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
                subtitle: Text(
                  language['nativeName']!,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                trailing: isSelected
                    ? Icon(
                        Icons.check_circle,
                        color: theme.colorScheme.primary,
                      )
                    : null,
                onTap: () async {
                  await onLanguageChanged(language['code']!);
                  Navigator.pop(context);
                },
              );
            }).toList(),
            const SizedBox(height: 16),
          ],
        ),
      );
    },
  );
}

String _getCurrentFlag(String languageCode) {
  return _supportedLanguages
      .firstWhere((lang) => lang['code'] == languageCode)['flag']!;
}

const List<Map<String, String>> _supportedLanguages = [
  {
    'code': 'en',
    'name': 'English',
    'nativeName': 'English',
    'flag': '🇺🇸',
  },
  {
    'code': 'es',
    'name': 'Spanish',
    'nativeName': 'Español',
    'flag': '🇪🇸',
  },
  {
    'code': 'gn',
    'name': 'Guarani',
    'nativeName': 'Guaraní',
    'flag': '🇵🇾',
  },
];