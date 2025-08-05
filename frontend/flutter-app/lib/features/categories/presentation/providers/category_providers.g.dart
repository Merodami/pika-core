// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'category_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$categoryBoxHash() => r'13c410cc682c1ab6324be9d5b93227c69d621e3b';

/// Provider for Hive category box
///
/// Copied from [categoryBox].
@ProviderFor(categoryBox)
final categoryBoxProvider =
    AutoDisposeFutureProvider<Box<CategoryModel>>.internal(
  categoryBox,
  name: r'categoryBoxProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$categoryBoxHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef CategoryBoxRef = AutoDisposeFutureProviderRef<Box<CategoryModel>>;
String _$categoryMetadataBoxHash() =>
    r'93f72b825ef2799163943b724aae512766ad3828';

/// Provider for Hive metadata box
///
/// Copied from [categoryMetadataBox].
@ProviderFor(categoryMetadataBox)
final categoryMetadataBoxProvider =
    AutoDisposeFutureProvider<Box<dynamic>>.internal(
  categoryMetadataBox,
  name: r'categoryMetadataBoxProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$categoryMetadataBoxHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef CategoryMetadataBoxRef = AutoDisposeFutureProviderRef<Box<dynamic>>;
String _$categoryLocalDataSourceHash() =>
    r'921e457a41f49dbc1b1447266ac991898057c79f';

/// Provider for category local data source
///
/// Copied from [categoryLocalDataSource].
@ProviderFor(categoryLocalDataSource)
final categoryLocalDataSourceProvider =
    AutoDisposeFutureProvider<CategoryLocalDataSource>.internal(
  categoryLocalDataSource,
  name: r'categoryLocalDataSourceProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$categoryLocalDataSourceHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef CategoryLocalDataSourceRef
    = AutoDisposeFutureProviderRef<CategoryLocalDataSource>;
String _$categoryRemoteDataSourceHash() =>
    r'a2b4fcf03f1e33ff7af822983a798d5371d723b1';

/// Provider for category remote data source
///
/// Copied from [categoryRemoteDataSource].
@ProviderFor(categoryRemoteDataSource)
final categoryRemoteDataSourceProvider =
    AutoDisposeProvider<CategoryRemoteDataSource>.internal(
  categoryRemoteDataSource,
  name: r'categoryRemoteDataSourceProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$categoryRemoteDataSourceHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef CategoryRemoteDataSourceRef
    = AutoDisposeProviderRef<CategoryRemoteDataSource>;
String _$categoryRepositoryHash() =>
    r'8bb915f1216690d65db78d9a596787d17e8def95';

/// Provider for category repository
///
/// Copied from [categoryRepository].
@ProviderFor(categoryRepository)
final categoryRepositoryProvider =
    AutoDisposeFutureProvider<CategoryRepository>.internal(
  categoryRepository,
  name: r'categoryRepositoryProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$categoryRepositoryHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef CategoryRepositoryRef
    = AutoDisposeFutureProviderRef<CategoryRepository>;
String _$getCategoriesUseCaseHash() =>
    r'1da1d46ea0f43bc46698b32b3057d84ed249c423';

/// Use case providers
///
/// Copied from [getCategoriesUseCase].
@ProviderFor(getCategoriesUseCase)
final getCategoriesUseCaseProvider =
    AutoDisposeFutureProvider<GetCategoriesUseCase>.internal(
  getCategoriesUseCase,
  name: r'getCategoriesUseCaseProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$getCategoriesUseCaseHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef GetCategoriesUseCaseRef
    = AutoDisposeFutureProviderRef<GetCategoriesUseCase>;
String _$getFeaturedCategoriesUseCaseHash() =>
    r'92de7c770e912181cb52a70efdf8f6c553cac9b8';

/// See also [getFeaturedCategoriesUseCase].
@ProviderFor(getFeaturedCategoriesUseCase)
final getFeaturedCategoriesUseCaseProvider =
    AutoDisposeFutureProvider<GetFeaturedCategoriesUseCase>.internal(
  getFeaturedCategoriesUseCase,
  name: r'getFeaturedCategoriesUseCaseProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$getFeaturedCategoriesUseCaseHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef GetFeaturedCategoriesUseCaseRef
    = AutoDisposeFutureProviderRef<GetFeaturedCategoriesUseCase>;
String _$searchCategoriesUseCaseHash() =>
    r'e641d2143e003167370ddb89dcdbe2f643a64a28';

/// See also [searchCategoriesUseCase].
@ProviderFor(searchCategoriesUseCase)
final searchCategoriesUseCaseProvider =
    AutoDisposeFutureProvider<SearchCategoriesUseCase>.internal(
  searchCategoriesUseCase,
  name: r'searchCategoriesUseCaseProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$searchCategoriesUseCaseHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef SearchCategoriesUseCaseRef
    = AutoDisposeFutureProviderRef<SearchCategoriesUseCase>;
String _$featuredCategoriesHash() =>
    r'0035fb0376458fc6055b0f465408c92066753cb8';

/// Copied from Dart SDK
class _SystemHash {
  _SystemHash._();

  static int combine(int hash, int value) {
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + value);
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + ((0x0007ffff & hash) << 10));
    return hash ^ (hash >> 6);
  }

  static int finish(int hash) {
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + ((0x03ffffff & hash) << 3));
    // ignore: parameter_assignments
    hash = hash ^ (hash >> 11);
    return 0x1fffffff & (hash + ((0x00003fff & hash) << 15));
  }
}

/// Featured categories provider
///
/// Copied from [featuredCategories].
@ProviderFor(featuredCategories)
const featuredCategoriesProvider = FeaturedCategoriesFamily();

/// Featured categories provider
///
/// Copied from [featuredCategories].
class FeaturedCategoriesFamily
    extends Family<AsyncValue<List<CategoryEntity>>> {
  /// Featured categories provider
  ///
  /// Copied from [featuredCategories].
  const FeaturedCategoriesFamily();

  /// Featured categories provider
  ///
  /// Copied from [featuredCategories].
  FeaturedCategoriesProvider call({
    int limit = 8,
  }) {
    return FeaturedCategoriesProvider(
      limit: limit,
    );
  }

  @override
  FeaturedCategoriesProvider getProviderOverride(
    covariant FeaturedCategoriesProvider provider,
  ) {
    return call(
      limit: provider.limit,
    );
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'featuredCategoriesProvider';
}

/// Featured categories provider
///
/// Copied from [featuredCategories].
class FeaturedCategoriesProvider
    extends AutoDisposeFutureProvider<List<CategoryEntity>> {
  /// Featured categories provider
  ///
  /// Copied from [featuredCategories].
  FeaturedCategoriesProvider({
    int limit = 8,
  }) : this._internal(
          (ref) => featuredCategories(
            ref as FeaturedCategoriesRef,
            limit: limit,
          ),
          from: featuredCategoriesProvider,
          name: r'featuredCategoriesProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$featuredCategoriesHash,
          dependencies: FeaturedCategoriesFamily._dependencies,
          allTransitiveDependencies:
              FeaturedCategoriesFamily._allTransitiveDependencies,
          limit: limit,
        );

  FeaturedCategoriesProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.limit,
  }) : super.internal();

  final int limit;

  @override
  Override overrideWith(
    FutureOr<List<CategoryEntity>> Function(FeaturedCategoriesRef provider)
        create,
  ) {
    return ProviderOverride(
      origin: this,
      override: FeaturedCategoriesProvider._internal(
        (ref) => create(ref as FeaturedCategoriesRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        limit: limit,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<List<CategoryEntity>> createElement() {
    return _FeaturedCategoriesProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is FeaturedCategoriesProvider && other.limit == limit;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, limit.hashCode);

    return _SystemHash.finish(hash);
  }
}

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
mixin FeaturedCategoriesRef
    on AutoDisposeFutureProviderRef<List<CategoryEntity>> {
  /// The parameter `limit` of this provider.
  int get limit;
}

class _FeaturedCategoriesProviderElement
    extends AutoDisposeFutureProviderElement<List<CategoryEntity>>
    with FeaturedCategoriesRef {
  _FeaturedCategoriesProviderElement(super.provider);

  @override
  int get limit => (origin as FeaturedCategoriesProvider).limit;
}

String _$categoriesHash() => r'fd97a25892c75165c750705937f201e2632ae5db';

/// Categories with pagination provider
///
/// Copied from [categories].
@ProviderFor(categories)
const categoriesProvider = CategoriesFamily();

/// Categories with pagination provider
///
/// Copied from [categories].
class CategoriesFamily
    extends Family<AsyncValue<PaginatedResult<CategoryEntity>>> {
  /// Categories with pagination provider
  ///
  /// Copied from [categories].
  const CategoriesFamily();

  /// Categories with pagination provider
  ///
  /// Copied from [categories].
  CategoriesProvider call({
    int page = 1,
    int limit = 20,
    String? parentId,
    int? level,
    bool? isActive,
    bool includeChildren = false,
    String sort = 'sort_order',
    String order = 'asc',
  }) {
    return CategoriesProvider(
      page: page,
      limit: limit,
      parentId: parentId,
      level: level,
      isActive: isActive,
      includeChildren: includeChildren,
      sort: sort,
      order: order,
    );
  }

  @override
  CategoriesProvider getProviderOverride(
    covariant CategoriesProvider provider,
  ) {
    return call(
      page: provider.page,
      limit: provider.limit,
      parentId: provider.parentId,
      level: provider.level,
      isActive: provider.isActive,
      includeChildren: provider.includeChildren,
      sort: provider.sort,
      order: provider.order,
    );
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'categoriesProvider';
}

/// Categories with pagination provider
///
/// Copied from [categories].
class CategoriesProvider
    extends AutoDisposeFutureProvider<PaginatedResult<CategoryEntity>> {
  /// Categories with pagination provider
  ///
  /// Copied from [categories].
  CategoriesProvider({
    int page = 1,
    int limit = 20,
    String? parentId,
    int? level,
    bool? isActive,
    bool includeChildren = false,
    String sort = 'sort_order',
    String order = 'asc',
  }) : this._internal(
          (ref) => categories(
            ref as CategoriesRef,
            page: page,
            limit: limit,
            parentId: parentId,
            level: level,
            isActive: isActive,
            includeChildren: includeChildren,
            sort: sort,
            order: order,
          ),
          from: categoriesProvider,
          name: r'categoriesProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$categoriesHash,
          dependencies: CategoriesFamily._dependencies,
          allTransitiveDependencies:
              CategoriesFamily._allTransitiveDependencies,
          page: page,
          limit: limit,
          parentId: parentId,
          level: level,
          isActive: isActive,
          includeChildren: includeChildren,
          sort: sort,
          order: order,
        );

  CategoriesProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.page,
    required this.limit,
    required this.parentId,
    required this.level,
    required this.isActive,
    required this.includeChildren,
    required this.sort,
    required this.order,
  }) : super.internal();

  final int page;
  final int limit;
  final String? parentId;
  final int? level;
  final bool? isActive;
  final bool includeChildren;
  final String sort;
  final String order;

  @override
  Override overrideWith(
    FutureOr<PaginatedResult<CategoryEntity>> Function(CategoriesRef provider)
        create,
  ) {
    return ProviderOverride(
      origin: this,
      override: CategoriesProvider._internal(
        (ref) => create(ref as CategoriesRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        page: page,
        limit: limit,
        parentId: parentId,
        level: level,
        isActive: isActive,
        includeChildren: includeChildren,
        sort: sort,
        order: order,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<PaginatedResult<CategoryEntity>>
      createElement() {
    return _CategoriesProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is CategoriesProvider &&
        other.page == page &&
        other.limit == limit &&
        other.parentId == parentId &&
        other.level == level &&
        other.isActive == isActive &&
        other.includeChildren == includeChildren &&
        other.sort == sort &&
        other.order == order;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, page.hashCode);
    hash = _SystemHash.combine(hash, limit.hashCode);
    hash = _SystemHash.combine(hash, parentId.hashCode);
    hash = _SystemHash.combine(hash, level.hashCode);
    hash = _SystemHash.combine(hash, isActive.hashCode);
    hash = _SystemHash.combine(hash, includeChildren.hashCode);
    hash = _SystemHash.combine(hash, sort.hashCode);
    hash = _SystemHash.combine(hash, order.hashCode);

    return _SystemHash.finish(hash);
  }
}

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
mixin CategoriesRef
    on AutoDisposeFutureProviderRef<PaginatedResult<CategoryEntity>> {
  /// The parameter `page` of this provider.
  int get page;

  /// The parameter `limit` of this provider.
  int get limit;

  /// The parameter `parentId` of this provider.
  String? get parentId;

  /// The parameter `level` of this provider.
  int? get level;

  /// The parameter `isActive` of this provider.
  bool? get isActive;

  /// The parameter `includeChildren` of this provider.
  bool get includeChildren;

  /// The parameter `sort` of this provider.
  String get sort;

  /// The parameter `order` of this provider.
  String get order;
}

class _CategoriesProviderElement
    extends AutoDisposeFutureProviderElement<PaginatedResult<CategoryEntity>>
    with CategoriesRef {
  _CategoriesProviderElement(super.provider);

  @override
  int get page => (origin as CategoriesProvider).page;
  @override
  int get limit => (origin as CategoriesProvider).limit;
  @override
  String? get parentId => (origin as CategoriesProvider).parentId;
  @override
  int? get level => (origin as CategoriesProvider).level;
  @override
  bool? get isActive => (origin as CategoriesProvider).isActive;
  @override
  bool get includeChildren => (origin as CategoriesProvider).includeChildren;
  @override
  String get sort => (origin as CategoriesProvider).sort;
  @override
  String get order => (origin as CategoriesProvider).order;
}

String _$searchCategoriesHash() => r'f54bc0334c6a7f24ab09edb8f53590cd6a0fb374';

/// Search categories provider with debouncing
///
/// Copied from [searchCategories].
@ProviderFor(searchCategories)
const searchCategoriesProvider = SearchCategoriesFamily();

/// Search categories provider with debouncing
///
/// Copied from [searchCategories].
class SearchCategoriesFamily extends Family<AsyncValue<List<CategoryEntity>>> {
  /// Search categories provider with debouncing
  ///
  /// Copied from [searchCategories].
  const SearchCategoriesFamily();

  /// Search categories provider with debouncing
  ///
  /// Copied from [searchCategories].
  SearchCategoriesProvider call({
    required String query,
    int limit = 20,
  }) {
    return SearchCategoriesProvider(
      query: query,
      limit: limit,
    );
  }

  @override
  SearchCategoriesProvider getProviderOverride(
    covariant SearchCategoriesProvider provider,
  ) {
    return call(
      query: provider.query,
      limit: provider.limit,
    );
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'searchCategoriesProvider';
}

/// Search categories provider with debouncing
///
/// Copied from [searchCategories].
class SearchCategoriesProvider
    extends AutoDisposeFutureProvider<List<CategoryEntity>> {
  /// Search categories provider with debouncing
  ///
  /// Copied from [searchCategories].
  SearchCategoriesProvider({
    required String query,
    int limit = 20,
  }) : this._internal(
          (ref) => searchCategories(
            ref as SearchCategoriesRef,
            query: query,
            limit: limit,
          ),
          from: searchCategoriesProvider,
          name: r'searchCategoriesProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$searchCategoriesHash,
          dependencies: SearchCategoriesFamily._dependencies,
          allTransitiveDependencies:
              SearchCategoriesFamily._allTransitiveDependencies,
          query: query,
          limit: limit,
        );

  SearchCategoriesProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.query,
    required this.limit,
  }) : super.internal();

  final String query;
  final int limit;

  @override
  Override overrideWith(
    FutureOr<List<CategoryEntity>> Function(SearchCategoriesRef provider)
        create,
  ) {
    return ProviderOverride(
      origin: this,
      override: SearchCategoriesProvider._internal(
        (ref) => create(ref as SearchCategoriesRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        query: query,
        limit: limit,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<List<CategoryEntity>> createElement() {
    return _SearchCategoriesProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is SearchCategoriesProvider &&
        other.query == query &&
        other.limit == limit;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, query.hashCode);
    hash = _SystemHash.combine(hash, limit.hashCode);

    return _SystemHash.finish(hash);
  }
}

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
mixin SearchCategoriesRef
    on AutoDisposeFutureProviderRef<List<CategoryEntity>> {
  /// The parameter `query` of this provider.
  String get query;

  /// The parameter `limit` of this provider.
  int get limit;
}

class _SearchCategoriesProviderElement
    extends AutoDisposeFutureProviderElement<List<CategoryEntity>>
    with SearchCategoriesRef {
  _SearchCategoriesProviderElement(super.provider);

  @override
  String get query => (origin as SearchCategoriesProvider).query;
  @override
  int get limit => (origin as SearchCategoriesProvider).limit;
}

String _$categoryByIdHash() => r'2ce6be09f29683d99cabaaf90220f8542bebe080';

/// Category by ID provider
///
/// Copied from [categoryById].
@ProviderFor(categoryById)
const categoryByIdProvider = CategoryByIdFamily();

/// Category by ID provider
///
/// Copied from [categoryById].
class CategoryByIdFamily extends Family<AsyncValue<CategoryEntity>> {
  /// Category by ID provider
  ///
  /// Copied from [categoryById].
  const CategoryByIdFamily();

  /// Category by ID provider
  ///
  /// Copied from [categoryById].
  CategoryByIdProvider call({
    required String id,
  }) {
    return CategoryByIdProvider(
      id: id,
    );
  }

  @override
  CategoryByIdProvider getProviderOverride(
    covariant CategoryByIdProvider provider,
  ) {
    return call(
      id: provider.id,
    );
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'categoryByIdProvider';
}

/// Category by ID provider
///
/// Copied from [categoryById].
class CategoryByIdProvider extends AutoDisposeFutureProvider<CategoryEntity> {
  /// Category by ID provider
  ///
  /// Copied from [categoryById].
  CategoryByIdProvider({
    required String id,
  }) : this._internal(
          (ref) => categoryById(
            ref as CategoryByIdRef,
            id: id,
          ),
          from: categoryByIdProvider,
          name: r'categoryByIdProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$categoryByIdHash,
          dependencies: CategoryByIdFamily._dependencies,
          allTransitiveDependencies:
              CategoryByIdFamily._allTransitiveDependencies,
          id: id,
        );

  CategoryByIdProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.id,
  }) : super.internal();

  final String id;

  @override
  Override overrideWith(
    FutureOr<CategoryEntity> Function(CategoryByIdRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: CategoryByIdProvider._internal(
        (ref) => create(ref as CategoryByIdRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        id: id,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<CategoryEntity> createElement() {
    return _CategoryByIdProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is CategoryByIdProvider && other.id == id;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, id.hashCode);

    return _SystemHash.finish(hash);
  }
}

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
mixin CategoryByIdRef on AutoDisposeFutureProviderRef<CategoryEntity> {
  /// The parameter `id` of this provider.
  String get id;
}

class _CategoryByIdProviderElement
    extends AutoDisposeFutureProviderElement<CategoryEntity>
    with CategoryByIdRef {
  _CategoryByIdProviderElement(super.provider);

  @override
  String get id => (origin as CategoryByIdProvider).id;
}

String _$categoryBySlugHash() => r'69c815f77f40b63dc5c2d1e37978eeb51fcbb2e7';

/// Category by slug provider
///
/// Copied from [categoryBySlug].
@ProviderFor(categoryBySlug)
const categoryBySlugProvider = CategoryBySlugFamily();

/// Category by slug provider
///
/// Copied from [categoryBySlug].
class CategoryBySlugFamily extends Family<AsyncValue<CategoryEntity>> {
  /// Category by slug provider
  ///
  /// Copied from [categoryBySlug].
  const CategoryBySlugFamily();

  /// Category by slug provider
  ///
  /// Copied from [categoryBySlug].
  CategoryBySlugProvider call({
    required String slug,
  }) {
    return CategoryBySlugProvider(
      slug: slug,
    );
  }

  @override
  CategoryBySlugProvider getProviderOverride(
    covariant CategoryBySlugProvider provider,
  ) {
    return call(
      slug: provider.slug,
    );
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'categoryBySlugProvider';
}

/// Category by slug provider
///
/// Copied from [categoryBySlug].
class CategoryBySlugProvider extends AutoDisposeFutureProvider<CategoryEntity> {
  /// Category by slug provider
  ///
  /// Copied from [categoryBySlug].
  CategoryBySlugProvider({
    required String slug,
  }) : this._internal(
          (ref) => categoryBySlug(
            ref as CategoryBySlugRef,
            slug: slug,
          ),
          from: categoryBySlugProvider,
          name: r'categoryBySlugProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$categoryBySlugHash,
          dependencies: CategoryBySlugFamily._dependencies,
          allTransitiveDependencies:
              CategoryBySlugFamily._allTransitiveDependencies,
          slug: slug,
        );

  CategoryBySlugProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.slug,
  }) : super.internal();

  final String slug;

  @override
  Override overrideWith(
    FutureOr<CategoryEntity> Function(CategoryBySlugRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: CategoryBySlugProvider._internal(
        (ref) => create(ref as CategoryBySlugRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        slug: slug,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<CategoryEntity> createElement() {
    return _CategoryBySlugProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is CategoryBySlugProvider && other.slug == slug;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, slug.hashCode);

    return _SystemHash.finish(hash);
  }
}

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
mixin CategoryBySlugRef on AutoDisposeFutureProviderRef<CategoryEntity> {
  /// The parameter `slug` of this provider.
  String get slug;
}

class _CategoryBySlugProviderElement
    extends AutoDisposeFutureProviderElement<CategoryEntity>
    with CategoryBySlugRef {
  _CategoryBySlugProviderElement(super.provider);

  @override
  String get slug => (origin as CategoryBySlugProvider).slug;
}

String _$activeCategoriesHash() => r'2f1ea0b8b47ea68c63b52e73d6334b8de8b501d9';

/// Active categories only provider
///
/// Copied from [activeCategories].
@ProviderFor(activeCategories)
final activeCategoriesProvider =
    AutoDisposeFutureProvider<List<CategoryEntity>>.internal(
  activeCategories,
  name: r'activeCategoriesProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$activeCategoriesHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef ActiveCategoriesRef
    = AutoDisposeFutureProviderRef<List<CategoryEntity>>;
String _$categoriesStreamHash() => r'236930291cb5a486b7d48b9fa5dbf36ddc1013a0';

/// Categories stream provider for real-time updates
///
/// Copied from [categoriesStream].
@ProviderFor(categoriesStream)
const categoriesStreamProvider = CategoriesStreamFamily();

/// Categories stream provider for real-time updates
///
/// Copied from [categoriesStream].
class CategoriesStreamFamily extends Family<AsyncValue<List<CategoryEntity>>> {
  /// Categories stream provider for real-time updates
  ///
  /// Copied from [categoriesStream].
  const CategoriesStreamFamily();

  /// Categories stream provider for real-time updates
  ///
  /// Copied from [categoriesStream].
  CategoriesStreamProvider call({
    bool? isActive,
  }) {
    return CategoriesStreamProvider(
      isActive: isActive,
    );
  }

  @override
  CategoriesStreamProvider getProviderOverride(
    covariant CategoriesStreamProvider provider,
  ) {
    return call(
      isActive: provider.isActive,
    );
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'categoriesStreamProvider';
}

/// Categories stream provider for real-time updates
///
/// Copied from [categoriesStream].
class CategoriesStreamProvider
    extends AutoDisposeStreamProvider<List<CategoryEntity>> {
  /// Categories stream provider for real-time updates
  ///
  /// Copied from [categoriesStream].
  CategoriesStreamProvider({
    bool? isActive,
  }) : this._internal(
          (ref) => categoriesStream(
            ref as CategoriesStreamRef,
            isActive: isActive,
          ),
          from: categoriesStreamProvider,
          name: r'categoriesStreamProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$categoriesStreamHash,
          dependencies: CategoriesStreamFamily._dependencies,
          allTransitiveDependencies:
              CategoriesStreamFamily._allTransitiveDependencies,
          isActive: isActive,
        );

  CategoriesStreamProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.isActive,
  }) : super.internal();

  final bool? isActive;

  @override
  Override overrideWith(
    Stream<List<CategoryEntity>> Function(CategoriesStreamRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: CategoriesStreamProvider._internal(
        (ref) => create(ref as CategoriesStreamRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        isActive: isActive,
      ),
    );
  }

  @override
  AutoDisposeStreamProviderElement<List<CategoryEntity>> createElement() {
    return _CategoriesStreamProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is CategoriesStreamProvider && other.isActive == isActive;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, isActive.hashCode);

    return _SystemHash.finish(hash);
  }
}

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
mixin CategoriesStreamRef
    on AutoDisposeStreamProviderRef<List<CategoryEntity>> {
  /// The parameter `isActive` of this provider.
  bool? get isActive;
}

class _CategoriesStreamProviderElement
    extends AutoDisposeStreamProviderElement<List<CategoryEntity>>
    with CategoriesStreamRef {
  _CategoriesStreamProviderElement(super.provider);

  @override
  bool? get isActive => (origin as CategoriesStreamProvider).isActive;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
