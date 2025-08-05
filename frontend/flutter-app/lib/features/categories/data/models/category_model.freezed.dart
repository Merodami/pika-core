// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'category_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

CategoryModel _$CategoryModelFromJson(Map<String, dynamic> json) {
  return _CategoryModel.fromJson(json);
}

/// @nodoc
mixin _$CategoryModel {
  @HiveField(0)
  String get id => throw _privateConstructorUsedError;
  @HiveField(1)
  @MultilingualTextConverter()
  Map<String, String> get name => throw _privateConstructorUsedError;
  @HiveField(2)
  String get slug => throw _privateConstructorUsedError;
  @HiveField(3)
  @MultilingualTextConverter()
  Map<String, String>? get description => throw _privateConstructorUsedError;
  @JsonKey(name: 'icon_url')
  @HiveField(4)
  String? get iconUrl => throw _privateConstructorUsedError;
  @JsonKey(name: 'parent_id')
  @HiveField(5)
  String? get parentId => throw _privateConstructorUsedError;
  @HiveField(6)
  int get level => throw _privateConstructorUsedError;
  @HiveField(7)
  String get path => throw _privateConstructorUsedError;
  @HiveField(8)
  bool? get active => throw _privateConstructorUsedError;
  @JsonKey(name: 'sort_order')
  @HiveField(9)
  int get sortOrder => throw _privateConstructorUsedError;
  @JsonKey(name: 'created_at')
  @HiveField(10)
  DateTime? get createdAt => throw _privateConstructorUsedError;
  @JsonKey(name: 'updated_at')
  @HiveField(11)
  DateTime? get updatedAt => throw _privateConstructorUsedError;
  @HiveField(12)
  List<CategoryModel>? get children => throw _privateConstructorUsedError;

  /// Serializes this CategoryModel to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of CategoryModel
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $CategoryModelCopyWith<CategoryModel> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CategoryModelCopyWith<$Res> {
  factory $CategoryModelCopyWith(
          CategoryModel value, $Res Function(CategoryModel) then) =
      _$CategoryModelCopyWithImpl<$Res, CategoryModel>;
  @useResult
  $Res call(
      {@HiveField(0) String id,
      @HiveField(1) @MultilingualTextConverter() Map<String, String> name,
      @HiveField(2) String slug,
      @HiveField(3)
      @MultilingualTextConverter()
      Map<String, String>? description,
      @JsonKey(name: 'icon_url') @HiveField(4) String? iconUrl,
      @JsonKey(name: 'parent_id') @HiveField(5) String? parentId,
      @HiveField(6) int level,
      @HiveField(7) String path,
      @HiveField(8) bool? active,
      @JsonKey(name: 'sort_order') @HiveField(9) int sortOrder,
      @JsonKey(name: 'created_at') @HiveField(10) DateTime? createdAt,
      @JsonKey(name: 'updated_at') @HiveField(11) DateTime? updatedAt,
      @HiveField(12) List<CategoryModel>? children});
}

/// @nodoc
class _$CategoryModelCopyWithImpl<$Res, $Val extends CategoryModel>
    implements $CategoryModelCopyWith<$Res> {
  _$CategoryModelCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of CategoryModel
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? slug = null,
    Object? description = freezed,
    Object? iconUrl = freezed,
    Object? parentId = freezed,
    Object? level = null,
    Object? path = null,
    Object? active = freezed,
    Object? sortOrder = null,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
    Object? children = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as Map<String, String>,
      slug: null == slug
          ? _value.slug
          : slug // ignore: cast_nullable_to_non_nullable
              as String,
      description: freezed == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as Map<String, String>?,
      iconUrl: freezed == iconUrl
          ? _value.iconUrl
          : iconUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      parentId: freezed == parentId
          ? _value.parentId
          : parentId // ignore: cast_nullable_to_non_nullable
              as String?,
      level: null == level
          ? _value.level
          : level // ignore: cast_nullable_to_non_nullable
              as int,
      path: null == path
          ? _value.path
          : path // ignore: cast_nullable_to_non_nullable
              as String,
      active: freezed == active
          ? _value.active
          : active // ignore: cast_nullable_to_non_nullable
              as bool?,
      sortOrder: null == sortOrder
          ? _value.sortOrder
          : sortOrder // ignore: cast_nullable_to_non_nullable
              as int,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      children: freezed == children
          ? _value.children
          : children // ignore: cast_nullable_to_non_nullable
              as List<CategoryModel>?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$CategoryModelImplCopyWith<$Res>
    implements $CategoryModelCopyWith<$Res> {
  factory _$$CategoryModelImplCopyWith(
          _$CategoryModelImpl value, $Res Function(_$CategoryModelImpl) then) =
      __$$CategoryModelImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {@HiveField(0) String id,
      @HiveField(1) @MultilingualTextConverter() Map<String, String> name,
      @HiveField(2) String slug,
      @HiveField(3)
      @MultilingualTextConverter()
      Map<String, String>? description,
      @JsonKey(name: 'icon_url') @HiveField(4) String? iconUrl,
      @JsonKey(name: 'parent_id') @HiveField(5) String? parentId,
      @HiveField(6) int level,
      @HiveField(7) String path,
      @HiveField(8) bool? active,
      @JsonKey(name: 'sort_order') @HiveField(9) int sortOrder,
      @JsonKey(name: 'created_at') @HiveField(10) DateTime? createdAt,
      @JsonKey(name: 'updated_at') @HiveField(11) DateTime? updatedAt,
      @HiveField(12) List<CategoryModel>? children});
}

/// @nodoc
class __$$CategoryModelImplCopyWithImpl<$Res>
    extends _$CategoryModelCopyWithImpl<$Res, _$CategoryModelImpl>
    implements _$$CategoryModelImplCopyWith<$Res> {
  __$$CategoryModelImplCopyWithImpl(
      _$CategoryModelImpl _value, $Res Function(_$CategoryModelImpl) _then)
      : super(_value, _then);

  /// Create a copy of CategoryModel
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? slug = null,
    Object? description = freezed,
    Object? iconUrl = freezed,
    Object? parentId = freezed,
    Object? level = null,
    Object? path = null,
    Object? active = freezed,
    Object? sortOrder = null,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
    Object? children = freezed,
  }) {
    return _then(_$CategoryModelImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value._name
          : name // ignore: cast_nullable_to_non_nullable
              as Map<String, String>,
      slug: null == slug
          ? _value.slug
          : slug // ignore: cast_nullable_to_non_nullable
              as String,
      description: freezed == description
          ? _value._description
          : description // ignore: cast_nullable_to_non_nullable
              as Map<String, String>?,
      iconUrl: freezed == iconUrl
          ? _value.iconUrl
          : iconUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      parentId: freezed == parentId
          ? _value.parentId
          : parentId // ignore: cast_nullable_to_non_nullable
              as String?,
      level: null == level
          ? _value.level
          : level // ignore: cast_nullable_to_non_nullable
              as int,
      path: null == path
          ? _value.path
          : path // ignore: cast_nullable_to_non_nullable
              as String,
      active: freezed == active
          ? _value.active
          : active // ignore: cast_nullable_to_non_nullable
              as bool?,
      sortOrder: null == sortOrder
          ? _value.sortOrder
          : sortOrder // ignore: cast_nullable_to_non_nullable
              as int,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      children: freezed == children
          ? _value._children
          : children // ignore: cast_nullable_to_non_nullable
              as List<CategoryModel>?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$CategoryModelImpl implements _CategoryModel {
  const _$CategoryModelImpl(
      {@HiveField(0) required this.id,
      @HiveField(1)
      @MultilingualTextConverter()
      required final Map<String, String> name,
      @HiveField(2) required this.slug,
      @HiveField(3)
      @MultilingualTextConverter()
      final Map<String, String>? description,
      @JsonKey(name: 'icon_url') @HiveField(4) this.iconUrl,
      @JsonKey(name: 'parent_id') @HiveField(5) this.parentId,
      @HiveField(6) this.level = 1,
      @HiveField(7) this.path = '',
      @HiveField(8) this.active,
      @JsonKey(name: 'sort_order') @HiveField(9) this.sortOrder = 0,
      @JsonKey(name: 'created_at') @HiveField(10) this.createdAt,
      @JsonKey(name: 'updated_at') @HiveField(11) this.updatedAt,
      @HiveField(12) final List<CategoryModel>? children})
      : _name = name,
        _description = description,
        _children = children;

  factory _$CategoryModelImpl.fromJson(Map<String, dynamic> json) =>
      _$$CategoryModelImplFromJson(json);

  @override
  @HiveField(0)
  final String id;
  final Map<String, String> _name;
  @override
  @HiveField(1)
  @MultilingualTextConverter()
  Map<String, String> get name {
    if (_name is EqualUnmodifiableMapView) return _name;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(_name);
  }

  @override
  @HiveField(2)
  final String slug;
  final Map<String, String>? _description;
  @override
  @HiveField(3)
  @MultilingualTextConverter()
  Map<String, String>? get description {
    final value = _description;
    if (value == null) return null;
    if (_description is EqualUnmodifiableMapView) return _description;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(value);
  }

  @override
  @JsonKey(name: 'icon_url')
  @HiveField(4)
  final String? iconUrl;
  @override
  @JsonKey(name: 'parent_id')
  @HiveField(5)
  final String? parentId;
  @override
  @JsonKey()
  @HiveField(6)
  final int level;
  @override
  @JsonKey()
  @HiveField(7)
  final String path;
  @override
  @HiveField(8)
  final bool? active;
  @override
  @JsonKey(name: 'sort_order')
  @HiveField(9)
  final int sortOrder;
  @override
  @JsonKey(name: 'created_at')
  @HiveField(10)
  final DateTime? createdAt;
  @override
  @JsonKey(name: 'updated_at')
  @HiveField(11)
  final DateTime? updatedAt;
  final List<CategoryModel>? _children;
  @override
  @HiveField(12)
  List<CategoryModel>? get children {
    final value = _children;
    if (value == null) return null;
    if (_children is EqualUnmodifiableListView) return _children;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(value);
  }

  @override
  String toString() {
    return 'CategoryModel(id: $id, name: $name, slug: $slug, description: $description, iconUrl: $iconUrl, parentId: $parentId, level: $level, path: $path, active: $active, sortOrder: $sortOrder, createdAt: $createdAt, updatedAt: $updatedAt, children: $children)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CategoryModelImpl &&
            (identical(other.id, id) || other.id == id) &&
            const DeepCollectionEquality().equals(other._name, _name) &&
            (identical(other.slug, slug) || other.slug == slug) &&
            const DeepCollectionEquality()
                .equals(other._description, _description) &&
            (identical(other.iconUrl, iconUrl) || other.iconUrl == iconUrl) &&
            (identical(other.parentId, parentId) ||
                other.parentId == parentId) &&
            (identical(other.level, level) || other.level == level) &&
            (identical(other.path, path) || other.path == path) &&
            (identical(other.active, active) || other.active == active) &&
            (identical(other.sortOrder, sortOrder) ||
                other.sortOrder == sortOrder) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.updatedAt, updatedAt) ||
                other.updatedAt == updatedAt) &&
            const DeepCollectionEquality().equals(other._children, _children));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      const DeepCollectionEquality().hash(_name),
      slug,
      const DeepCollectionEquality().hash(_description),
      iconUrl,
      parentId,
      level,
      path,
      active,
      sortOrder,
      createdAt,
      updatedAt,
      const DeepCollectionEquality().hash(_children));

  /// Create a copy of CategoryModel
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$CategoryModelImplCopyWith<_$CategoryModelImpl> get copyWith =>
      __$$CategoryModelImplCopyWithImpl<_$CategoryModelImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$CategoryModelImplToJson(
      this,
    );
  }
}

abstract class _CategoryModel implements CategoryModel {
  const factory _CategoryModel(
          {@HiveField(0) required final String id,
          @HiveField(1)
          @MultilingualTextConverter()
          required final Map<String, String> name,
          @HiveField(2) required final String slug,
          @HiveField(3)
          @MultilingualTextConverter()
          final Map<String, String>? description,
          @JsonKey(name: 'icon_url') @HiveField(4) final String? iconUrl,
          @JsonKey(name: 'parent_id') @HiveField(5) final String? parentId,
          @HiveField(6) final int level,
          @HiveField(7) final String path,
          @HiveField(8) final bool? active,
          @JsonKey(name: 'sort_order') @HiveField(9) final int sortOrder,
          @JsonKey(name: 'created_at') @HiveField(10) final DateTime? createdAt,
          @JsonKey(name: 'updated_at') @HiveField(11) final DateTime? updatedAt,
          @HiveField(12) final List<CategoryModel>? children}) =
      _$CategoryModelImpl;

  factory _CategoryModel.fromJson(Map<String, dynamic> json) =
      _$CategoryModelImpl.fromJson;

  @override
  @HiveField(0)
  String get id;
  @override
  @HiveField(1)
  @MultilingualTextConverter()
  Map<String, String> get name;
  @override
  @HiveField(2)
  String get slug;
  @override
  @HiveField(3)
  @MultilingualTextConverter()
  Map<String, String>? get description;
  @override
  @JsonKey(name: 'icon_url')
  @HiveField(4)
  String? get iconUrl;
  @override
  @JsonKey(name: 'parent_id')
  @HiveField(5)
  String? get parentId;
  @override
  @HiveField(6)
  int get level;
  @override
  @HiveField(7)
  String get path;
  @override
  @HiveField(8)
  bool? get active;
  @override
  @JsonKey(name: 'sort_order')
  @HiveField(9)
  int get sortOrder;
  @override
  @JsonKey(name: 'created_at')
  @HiveField(10)
  DateTime? get createdAt;
  @override
  @JsonKey(name: 'updated_at')
  @HiveField(11)
  DateTime? get updatedAt;
  @override
  @HiveField(12)
  List<CategoryModel>? get children;

  /// Create a copy of CategoryModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$CategoryModelImplCopyWith<_$CategoryModelImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
