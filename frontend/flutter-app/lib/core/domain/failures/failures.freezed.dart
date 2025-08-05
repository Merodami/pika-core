// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'failures.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

/// @nodoc
mixin _$Failure {
  String get message => throw _privateConstructorUsedError;
  String? get code => throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(String message, String? code, int statusCode)
        network,
    required TResult Function(String message, String? code, int statusCode)
        server,
    required TResult Function(String message, String? code) cache,
    required TResult Function(String message, String? code) authentication,
    required TResult Function(String message, String? code) authorization,
    required TResult Function(String message, String field, String? code)
        validation,
    required TResult Function(String message, String? resource, String? code)
        notFound,
    required TResult Function(String message, String? code, Object? exception,
            StackTrace? stackTrace)
        unexpected,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(String message, String? code, int statusCode)? network,
    TResult? Function(String message, String? code, int statusCode)? server,
    TResult? Function(String message, String? code)? cache,
    TResult? Function(String message, String? code)? authentication,
    TResult? Function(String message, String? code)? authorization,
    TResult? Function(String message, String field, String? code)? validation,
    TResult? Function(String message, String? resource, String? code)? notFound,
    TResult? Function(String message, String? code, Object? exception,
            StackTrace? stackTrace)?
        unexpected,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(String message, String? code, int statusCode)? network,
    TResult Function(String message, String? code, int statusCode)? server,
    TResult Function(String message, String? code)? cache,
    TResult Function(String message, String? code)? authentication,
    TResult Function(String message, String? code)? authorization,
    TResult Function(String message, String field, String? code)? validation,
    TResult Function(String message, String? resource, String? code)? notFound,
    TResult Function(String message, String? code, Object? exception,
            StackTrace? stackTrace)?
        unexpected,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(NetworkFailure value) network,
    required TResult Function(ServerFailure value) server,
    required TResult Function(CacheFailure value) cache,
    required TResult Function(AuthenticationFailure value) authentication,
    required TResult Function(AuthorizationFailure value) authorization,
    required TResult Function(ValidationFailure value) validation,
    required TResult Function(NotFoundFailure value) notFound,
    required TResult Function(UnexpectedFailure value) unexpected,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(NetworkFailure value)? network,
    TResult? Function(ServerFailure value)? server,
    TResult? Function(CacheFailure value)? cache,
    TResult? Function(AuthenticationFailure value)? authentication,
    TResult? Function(AuthorizationFailure value)? authorization,
    TResult? Function(ValidationFailure value)? validation,
    TResult? Function(NotFoundFailure value)? notFound,
    TResult? Function(UnexpectedFailure value)? unexpected,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(NetworkFailure value)? network,
    TResult Function(ServerFailure value)? server,
    TResult Function(CacheFailure value)? cache,
    TResult Function(AuthenticationFailure value)? authentication,
    TResult Function(AuthorizationFailure value)? authorization,
    TResult Function(ValidationFailure value)? validation,
    TResult Function(NotFoundFailure value)? notFound,
    TResult Function(UnexpectedFailure value)? unexpected,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;

  /// Create a copy of Failure
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $FailureCopyWith<Failure> get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $FailureCopyWith<$Res> {
  factory $FailureCopyWith(Failure value, $Res Function(Failure) then) =
      _$FailureCopyWithImpl<$Res, Failure>;
  @useResult
  $Res call({String message, String? code});
}

/// @nodoc
class _$FailureCopyWithImpl<$Res, $Val extends Failure>
    implements $FailureCopyWith<$Res> {
  _$FailureCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of Failure
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? message = null,
    Object? code = freezed,
  }) {
    return _then(_value.copyWith(
      message: null == message
          ? _value.message
          : message // ignore: cast_nullable_to_non_nullable
              as String,
      code: freezed == code
          ? _value.code
          : code // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$NetworkFailureImplCopyWith<$Res>
    implements $FailureCopyWith<$Res> {
  factory _$$NetworkFailureImplCopyWith(_$NetworkFailureImpl value,
          $Res Function(_$NetworkFailureImpl) then) =
      __$$NetworkFailureImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String message, String? code, int statusCode});
}

/// @nodoc
class __$$NetworkFailureImplCopyWithImpl<$Res>
    extends _$FailureCopyWithImpl<$Res, _$NetworkFailureImpl>
    implements _$$NetworkFailureImplCopyWith<$Res> {
  __$$NetworkFailureImplCopyWithImpl(
      _$NetworkFailureImpl _value, $Res Function(_$NetworkFailureImpl) _then)
      : super(_value, _then);

  /// Create a copy of Failure
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? message = null,
    Object? code = freezed,
    Object? statusCode = null,
  }) {
    return _then(_$NetworkFailureImpl(
      message: null == message
          ? _value.message
          : message // ignore: cast_nullable_to_non_nullable
              as String,
      code: freezed == code
          ? _value.code
          : code // ignore: cast_nullable_to_non_nullable
              as String?,
      statusCode: null == statusCode
          ? _value.statusCode
          : statusCode // ignore: cast_nullable_to_non_nullable
              as int,
    ));
  }
}

/// @nodoc

class _$NetworkFailureImpl implements NetworkFailure {
  const _$NetworkFailureImpl(
      {required this.message, this.code, this.statusCode = 500});

  @override
  final String message;
  @override
  final String? code;
  @override
  @JsonKey()
  final int statusCode;

  @override
  String toString() {
    return 'Failure.network(message: $message, code: $code, statusCode: $statusCode)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$NetworkFailureImpl &&
            (identical(other.message, message) || other.message == message) &&
            (identical(other.code, code) || other.code == code) &&
            (identical(other.statusCode, statusCode) ||
                other.statusCode == statusCode));
  }

  @override
  int get hashCode => Object.hash(runtimeType, message, code, statusCode);

  /// Create a copy of Failure
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$NetworkFailureImplCopyWith<_$NetworkFailureImpl> get copyWith =>
      __$$NetworkFailureImplCopyWithImpl<_$NetworkFailureImpl>(
          this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(String message, String? code, int statusCode)
        network,
    required TResult Function(String message, String? code, int statusCode)
        server,
    required TResult Function(String message, String? code) cache,
    required TResult Function(String message, String? code) authentication,
    required TResult Function(String message, String? code) authorization,
    required TResult Function(String message, String field, String? code)
        validation,
    required TResult Function(String message, String? resource, String? code)
        notFound,
    required TResult Function(String message, String? code, Object? exception,
            StackTrace? stackTrace)
        unexpected,
  }) {
    return network(message, code, statusCode);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(String message, String? code, int statusCode)? network,
    TResult? Function(String message, String? code, int statusCode)? server,
    TResult? Function(String message, String? code)? cache,
    TResult? Function(String message, String? code)? authentication,
    TResult? Function(String message, String? code)? authorization,
    TResult? Function(String message, String field, String? code)? validation,
    TResult? Function(String message, String? resource, String? code)? notFound,
    TResult? Function(String message, String? code, Object? exception,
            StackTrace? stackTrace)?
        unexpected,
  }) {
    return network?.call(message, code, statusCode);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(String message, String? code, int statusCode)? network,
    TResult Function(String message, String? code, int statusCode)? server,
    TResult Function(String message, String? code)? cache,
    TResult Function(String message, String? code)? authentication,
    TResult Function(String message, String? code)? authorization,
    TResult Function(String message, String field, String? code)? validation,
    TResult Function(String message, String? resource, String? code)? notFound,
    TResult Function(String message, String? code, Object? exception,
            StackTrace? stackTrace)?
        unexpected,
    required TResult orElse(),
  }) {
    if (network != null) {
      return network(message, code, statusCode);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(NetworkFailure value) network,
    required TResult Function(ServerFailure value) server,
    required TResult Function(CacheFailure value) cache,
    required TResult Function(AuthenticationFailure value) authentication,
    required TResult Function(AuthorizationFailure value) authorization,
    required TResult Function(ValidationFailure value) validation,
    required TResult Function(NotFoundFailure value) notFound,
    required TResult Function(UnexpectedFailure value) unexpected,
  }) {
    return network(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(NetworkFailure value)? network,
    TResult? Function(ServerFailure value)? server,
    TResult? Function(CacheFailure value)? cache,
    TResult? Function(AuthenticationFailure value)? authentication,
    TResult? Function(AuthorizationFailure value)? authorization,
    TResult? Function(ValidationFailure value)? validation,
    TResult? Function(NotFoundFailure value)? notFound,
    TResult? Function(UnexpectedFailure value)? unexpected,
  }) {
    return network?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(NetworkFailure value)? network,
    TResult Function(ServerFailure value)? server,
    TResult Function(CacheFailure value)? cache,
    TResult Function(AuthenticationFailure value)? authentication,
    TResult Function(AuthorizationFailure value)? authorization,
    TResult Function(ValidationFailure value)? validation,
    TResult Function(NotFoundFailure value)? notFound,
    TResult Function(UnexpectedFailure value)? unexpected,
    required TResult orElse(),
  }) {
    if (network != null) {
      return network(this);
    }
    return orElse();
  }
}

abstract class NetworkFailure implements Failure {
  const factory NetworkFailure(
      {required final String message,
      final String? code,
      final int statusCode}) = _$NetworkFailureImpl;

  @override
  String get message;
  @override
  String? get code;
  int get statusCode;

  /// Create a copy of Failure
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$NetworkFailureImplCopyWith<_$NetworkFailureImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$ServerFailureImplCopyWith<$Res>
    implements $FailureCopyWith<$Res> {
  factory _$$ServerFailureImplCopyWith(
          _$ServerFailureImpl value, $Res Function(_$ServerFailureImpl) then) =
      __$$ServerFailureImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String message, String? code, int statusCode});
}

/// @nodoc
class __$$ServerFailureImplCopyWithImpl<$Res>
    extends _$FailureCopyWithImpl<$Res, _$ServerFailureImpl>
    implements _$$ServerFailureImplCopyWith<$Res> {
  __$$ServerFailureImplCopyWithImpl(
      _$ServerFailureImpl _value, $Res Function(_$ServerFailureImpl) _then)
      : super(_value, _then);

  /// Create a copy of Failure
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? message = null,
    Object? code = freezed,
    Object? statusCode = null,
  }) {
    return _then(_$ServerFailureImpl(
      message: null == message
          ? _value.message
          : message // ignore: cast_nullable_to_non_nullable
              as String,
      code: freezed == code
          ? _value.code
          : code // ignore: cast_nullable_to_non_nullable
              as String?,
      statusCode: null == statusCode
          ? _value.statusCode
          : statusCode // ignore: cast_nullable_to_non_nullable
              as int,
    ));
  }
}

/// @nodoc

class _$ServerFailureImpl implements ServerFailure {
  const _$ServerFailureImpl(
      {required this.message, this.code, this.statusCode = 500});

  @override
  final String message;
  @override
  final String? code;
  @override
  @JsonKey()
  final int statusCode;

  @override
  String toString() {
    return 'Failure.server(message: $message, code: $code, statusCode: $statusCode)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ServerFailureImpl &&
            (identical(other.message, message) || other.message == message) &&
            (identical(other.code, code) || other.code == code) &&
            (identical(other.statusCode, statusCode) ||
                other.statusCode == statusCode));
  }

  @override
  int get hashCode => Object.hash(runtimeType, message, code, statusCode);

  /// Create a copy of Failure
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$ServerFailureImplCopyWith<_$ServerFailureImpl> get copyWith =>
      __$$ServerFailureImplCopyWithImpl<_$ServerFailureImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(String message, String? code, int statusCode)
        network,
    required TResult Function(String message, String? code, int statusCode)
        server,
    required TResult Function(String message, String? code) cache,
    required TResult Function(String message, String? code) authentication,
    required TResult Function(String message, String? code) authorization,
    required TResult Function(String message, String field, String? code)
        validation,
    required TResult Function(String message, String? resource, String? code)
        notFound,
    required TResult Function(String message, String? code, Object? exception,
            StackTrace? stackTrace)
        unexpected,
  }) {
    return server(message, code, statusCode);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(String message, String? code, int statusCode)? network,
    TResult? Function(String message, String? code, int statusCode)? server,
    TResult? Function(String message, String? code)? cache,
    TResult? Function(String message, String? code)? authentication,
    TResult? Function(String message, String? code)? authorization,
    TResult? Function(String message, String field, String? code)? validation,
    TResult? Function(String message, String? resource, String? code)? notFound,
    TResult? Function(String message, String? code, Object? exception,
            StackTrace? stackTrace)?
        unexpected,
  }) {
    return server?.call(message, code, statusCode);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(String message, String? code, int statusCode)? network,
    TResult Function(String message, String? code, int statusCode)? server,
    TResult Function(String message, String? code)? cache,
    TResult Function(String message, String? code)? authentication,
    TResult Function(String message, String? code)? authorization,
    TResult Function(String message, String field, String? code)? validation,
    TResult Function(String message, String? resource, String? code)? notFound,
    TResult Function(String message, String? code, Object? exception,
            StackTrace? stackTrace)?
        unexpected,
    required TResult orElse(),
  }) {
    if (server != null) {
      return server(message, code, statusCode);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(NetworkFailure value) network,
    required TResult Function(ServerFailure value) server,
    required TResult Function(CacheFailure value) cache,
    required TResult Function(AuthenticationFailure value) authentication,
    required TResult Function(AuthorizationFailure value) authorization,
    required TResult Function(ValidationFailure value) validation,
    required TResult Function(NotFoundFailure value) notFound,
    required TResult Function(UnexpectedFailure value) unexpected,
  }) {
    return server(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(NetworkFailure value)? network,
    TResult? Function(ServerFailure value)? server,
    TResult? Function(CacheFailure value)? cache,
    TResult? Function(AuthenticationFailure value)? authentication,
    TResult? Function(AuthorizationFailure value)? authorization,
    TResult? Function(ValidationFailure value)? validation,
    TResult? Function(NotFoundFailure value)? notFound,
    TResult? Function(UnexpectedFailure value)? unexpected,
  }) {
    return server?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(NetworkFailure value)? network,
    TResult Function(ServerFailure value)? server,
    TResult Function(CacheFailure value)? cache,
    TResult Function(AuthenticationFailure value)? authentication,
    TResult Function(AuthorizationFailure value)? authorization,
    TResult Function(ValidationFailure value)? validation,
    TResult Function(NotFoundFailure value)? notFound,
    TResult Function(UnexpectedFailure value)? unexpected,
    required TResult orElse(),
  }) {
    if (server != null) {
      return server(this);
    }
    return orElse();
  }
}

abstract class ServerFailure implements Failure {
  const factory ServerFailure(
      {required final String message,
      final String? code,
      final int statusCode}) = _$ServerFailureImpl;

  @override
  String get message;
  @override
  String? get code;
  int get statusCode;

  /// Create a copy of Failure
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$ServerFailureImplCopyWith<_$ServerFailureImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$CacheFailureImplCopyWith<$Res>
    implements $FailureCopyWith<$Res> {
  factory _$$CacheFailureImplCopyWith(
          _$CacheFailureImpl value, $Res Function(_$CacheFailureImpl) then) =
      __$$CacheFailureImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String message, String? code});
}

/// @nodoc
class __$$CacheFailureImplCopyWithImpl<$Res>
    extends _$FailureCopyWithImpl<$Res, _$CacheFailureImpl>
    implements _$$CacheFailureImplCopyWith<$Res> {
  __$$CacheFailureImplCopyWithImpl(
      _$CacheFailureImpl _value, $Res Function(_$CacheFailureImpl) _then)
      : super(_value, _then);

  /// Create a copy of Failure
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? message = null,
    Object? code = freezed,
  }) {
    return _then(_$CacheFailureImpl(
      message: null == message
          ? _value.message
          : message // ignore: cast_nullable_to_non_nullable
              as String,
      code: freezed == code
          ? _value.code
          : code // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc

class _$CacheFailureImpl implements CacheFailure {
  const _$CacheFailureImpl({required this.message, this.code});

  @override
  final String message;
  @override
  final String? code;

  @override
  String toString() {
    return 'Failure.cache(message: $message, code: $code)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CacheFailureImpl &&
            (identical(other.message, message) || other.message == message) &&
            (identical(other.code, code) || other.code == code));
  }

  @override
  int get hashCode => Object.hash(runtimeType, message, code);

  /// Create a copy of Failure
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$CacheFailureImplCopyWith<_$CacheFailureImpl> get copyWith =>
      __$$CacheFailureImplCopyWithImpl<_$CacheFailureImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(String message, String? code, int statusCode)
        network,
    required TResult Function(String message, String? code, int statusCode)
        server,
    required TResult Function(String message, String? code) cache,
    required TResult Function(String message, String? code) authentication,
    required TResult Function(String message, String? code) authorization,
    required TResult Function(String message, String field, String? code)
        validation,
    required TResult Function(String message, String? resource, String? code)
        notFound,
    required TResult Function(String message, String? code, Object? exception,
            StackTrace? stackTrace)
        unexpected,
  }) {
    return cache(message, code);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(String message, String? code, int statusCode)? network,
    TResult? Function(String message, String? code, int statusCode)? server,
    TResult? Function(String message, String? code)? cache,
    TResult? Function(String message, String? code)? authentication,
    TResult? Function(String message, String? code)? authorization,
    TResult? Function(String message, String field, String? code)? validation,
    TResult? Function(String message, String? resource, String? code)? notFound,
    TResult? Function(String message, String? code, Object? exception,
            StackTrace? stackTrace)?
        unexpected,
  }) {
    return cache?.call(message, code);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(String message, String? code, int statusCode)? network,
    TResult Function(String message, String? code, int statusCode)? server,
    TResult Function(String message, String? code)? cache,
    TResult Function(String message, String? code)? authentication,
    TResult Function(String message, String? code)? authorization,
    TResult Function(String message, String field, String? code)? validation,
    TResult Function(String message, String? resource, String? code)? notFound,
    TResult Function(String message, String? code, Object? exception,
            StackTrace? stackTrace)?
        unexpected,
    required TResult orElse(),
  }) {
    if (cache != null) {
      return cache(message, code);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(NetworkFailure value) network,
    required TResult Function(ServerFailure value) server,
    required TResult Function(CacheFailure value) cache,
    required TResult Function(AuthenticationFailure value) authentication,
    required TResult Function(AuthorizationFailure value) authorization,
    required TResult Function(ValidationFailure value) validation,
    required TResult Function(NotFoundFailure value) notFound,
    required TResult Function(UnexpectedFailure value) unexpected,
  }) {
    return cache(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(NetworkFailure value)? network,
    TResult? Function(ServerFailure value)? server,
    TResult? Function(CacheFailure value)? cache,
    TResult? Function(AuthenticationFailure value)? authentication,
    TResult? Function(AuthorizationFailure value)? authorization,
    TResult? Function(ValidationFailure value)? validation,
    TResult? Function(NotFoundFailure value)? notFound,
    TResult? Function(UnexpectedFailure value)? unexpected,
  }) {
    return cache?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(NetworkFailure value)? network,
    TResult Function(ServerFailure value)? server,
    TResult Function(CacheFailure value)? cache,
    TResult Function(AuthenticationFailure value)? authentication,
    TResult Function(AuthorizationFailure value)? authorization,
    TResult Function(ValidationFailure value)? validation,
    TResult Function(NotFoundFailure value)? notFound,
    TResult Function(UnexpectedFailure value)? unexpected,
    required TResult orElse(),
  }) {
    if (cache != null) {
      return cache(this);
    }
    return orElse();
  }
}

abstract class CacheFailure implements Failure {
  const factory CacheFailure(
      {required final String message, final String? code}) = _$CacheFailureImpl;

  @override
  String get message;
  @override
  String? get code;

  /// Create a copy of Failure
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$CacheFailureImplCopyWith<_$CacheFailureImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$AuthenticationFailureImplCopyWith<$Res>
    implements $FailureCopyWith<$Res> {
  factory _$$AuthenticationFailureImplCopyWith(
          _$AuthenticationFailureImpl value,
          $Res Function(_$AuthenticationFailureImpl) then) =
      __$$AuthenticationFailureImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String message, String? code});
}

/// @nodoc
class __$$AuthenticationFailureImplCopyWithImpl<$Res>
    extends _$FailureCopyWithImpl<$Res, _$AuthenticationFailureImpl>
    implements _$$AuthenticationFailureImplCopyWith<$Res> {
  __$$AuthenticationFailureImplCopyWithImpl(_$AuthenticationFailureImpl _value,
      $Res Function(_$AuthenticationFailureImpl) _then)
      : super(_value, _then);

  /// Create a copy of Failure
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? message = null,
    Object? code = freezed,
  }) {
    return _then(_$AuthenticationFailureImpl(
      message: null == message
          ? _value.message
          : message // ignore: cast_nullable_to_non_nullable
              as String,
      code: freezed == code
          ? _value.code
          : code // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc

class _$AuthenticationFailureImpl implements AuthenticationFailure {
  const _$AuthenticationFailureImpl({required this.message, this.code});

  @override
  final String message;
  @override
  final String? code;

  @override
  String toString() {
    return 'Failure.authentication(message: $message, code: $code)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AuthenticationFailureImpl &&
            (identical(other.message, message) || other.message == message) &&
            (identical(other.code, code) || other.code == code));
  }

  @override
  int get hashCode => Object.hash(runtimeType, message, code);

  /// Create a copy of Failure
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$AuthenticationFailureImplCopyWith<_$AuthenticationFailureImpl>
      get copyWith => __$$AuthenticationFailureImplCopyWithImpl<
          _$AuthenticationFailureImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(String message, String? code, int statusCode)
        network,
    required TResult Function(String message, String? code, int statusCode)
        server,
    required TResult Function(String message, String? code) cache,
    required TResult Function(String message, String? code) authentication,
    required TResult Function(String message, String? code) authorization,
    required TResult Function(String message, String field, String? code)
        validation,
    required TResult Function(String message, String? resource, String? code)
        notFound,
    required TResult Function(String message, String? code, Object? exception,
            StackTrace? stackTrace)
        unexpected,
  }) {
    return authentication(message, code);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(String message, String? code, int statusCode)? network,
    TResult? Function(String message, String? code, int statusCode)? server,
    TResult? Function(String message, String? code)? cache,
    TResult? Function(String message, String? code)? authentication,
    TResult? Function(String message, String? code)? authorization,
    TResult? Function(String message, String field, String? code)? validation,
    TResult? Function(String message, String? resource, String? code)? notFound,
    TResult? Function(String message, String? code, Object? exception,
            StackTrace? stackTrace)?
        unexpected,
  }) {
    return authentication?.call(message, code);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(String message, String? code, int statusCode)? network,
    TResult Function(String message, String? code, int statusCode)? server,
    TResult Function(String message, String? code)? cache,
    TResult Function(String message, String? code)? authentication,
    TResult Function(String message, String? code)? authorization,
    TResult Function(String message, String field, String? code)? validation,
    TResult Function(String message, String? resource, String? code)? notFound,
    TResult Function(String message, String? code, Object? exception,
            StackTrace? stackTrace)?
        unexpected,
    required TResult orElse(),
  }) {
    if (authentication != null) {
      return authentication(message, code);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(NetworkFailure value) network,
    required TResult Function(ServerFailure value) server,
    required TResult Function(CacheFailure value) cache,
    required TResult Function(AuthenticationFailure value) authentication,
    required TResult Function(AuthorizationFailure value) authorization,
    required TResult Function(ValidationFailure value) validation,
    required TResult Function(NotFoundFailure value) notFound,
    required TResult Function(UnexpectedFailure value) unexpected,
  }) {
    return authentication(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(NetworkFailure value)? network,
    TResult? Function(ServerFailure value)? server,
    TResult? Function(CacheFailure value)? cache,
    TResult? Function(AuthenticationFailure value)? authentication,
    TResult? Function(AuthorizationFailure value)? authorization,
    TResult? Function(ValidationFailure value)? validation,
    TResult? Function(NotFoundFailure value)? notFound,
    TResult? Function(UnexpectedFailure value)? unexpected,
  }) {
    return authentication?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(NetworkFailure value)? network,
    TResult Function(ServerFailure value)? server,
    TResult Function(CacheFailure value)? cache,
    TResult Function(AuthenticationFailure value)? authentication,
    TResult Function(AuthorizationFailure value)? authorization,
    TResult Function(ValidationFailure value)? validation,
    TResult Function(NotFoundFailure value)? notFound,
    TResult Function(UnexpectedFailure value)? unexpected,
    required TResult orElse(),
  }) {
    if (authentication != null) {
      return authentication(this);
    }
    return orElse();
  }
}

abstract class AuthenticationFailure implements Failure {
  const factory AuthenticationFailure(
      {required final String message,
      final String? code}) = _$AuthenticationFailureImpl;

  @override
  String get message;
  @override
  String? get code;

  /// Create a copy of Failure
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$AuthenticationFailureImplCopyWith<_$AuthenticationFailureImpl>
      get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$AuthorizationFailureImplCopyWith<$Res>
    implements $FailureCopyWith<$Res> {
  factory _$$AuthorizationFailureImplCopyWith(_$AuthorizationFailureImpl value,
          $Res Function(_$AuthorizationFailureImpl) then) =
      __$$AuthorizationFailureImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String message, String? code});
}

/// @nodoc
class __$$AuthorizationFailureImplCopyWithImpl<$Res>
    extends _$FailureCopyWithImpl<$Res, _$AuthorizationFailureImpl>
    implements _$$AuthorizationFailureImplCopyWith<$Res> {
  __$$AuthorizationFailureImplCopyWithImpl(_$AuthorizationFailureImpl _value,
      $Res Function(_$AuthorizationFailureImpl) _then)
      : super(_value, _then);

  /// Create a copy of Failure
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? message = null,
    Object? code = freezed,
  }) {
    return _then(_$AuthorizationFailureImpl(
      message: null == message
          ? _value.message
          : message // ignore: cast_nullable_to_non_nullable
              as String,
      code: freezed == code
          ? _value.code
          : code // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc

class _$AuthorizationFailureImpl implements AuthorizationFailure {
  const _$AuthorizationFailureImpl({required this.message, this.code});

  @override
  final String message;
  @override
  final String? code;

  @override
  String toString() {
    return 'Failure.authorization(message: $message, code: $code)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AuthorizationFailureImpl &&
            (identical(other.message, message) || other.message == message) &&
            (identical(other.code, code) || other.code == code));
  }

  @override
  int get hashCode => Object.hash(runtimeType, message, code);

  /// Create a copy of Failure
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$AuthorizationFailureImplCopyWith<_$AuthorizationFailureImpl>
      get copyWith =>
          __$$AuthorizationFailureImplCopyWithImpl<_$AuthorizationFailureImpl>(
              this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(String message, String? code, int statusCode)
        network,
    required TResult Function(String message, String? code, int statusCode)
        server,
    required TResult Function(String message, String? code) cache,
    required TResult Function(String message, String? code) authentication,
    required TResult Function(String message, String? code) authorization,
    required TResult Function(String message, String field, String? code)
        validation,
    required TResult Function(String message, String? resource, String? code)
        notFound,
    required TResult Function(String message, String? code, Object? exception,
            StackTrace? stackTrace)
        unexpected,
  }) {
    return authorization(message, code);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(String message, String? code, int statusCode)? network,
    TResult? Function(String message, String? code, int statusCode)? server,
    TResult? Function(String message, String? code)? cache,
    TResult? Function(String message, String? code)? authentication,
    TResult? Function(String message, String? code)? authorization,
    TResult? Function(String message, String field, String? code)? validation,
    TResult? Function(String message, String? resource, String? code)? notFound,
    TResult? Function(String message, String? code, Object? exception,
            StackTrace? stackTrace)?
        unexpected,
  }) {
    return authorization?.call(message, code);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(String message, String? code, int statusCode)? network,
    TResult Function(String message, String? code, int statusCode)? server,
    TResult Function(String message, String? code)? cache,
    TResult Function(String message, String? code)? authentication,
    TResult Function(String message, String? code)? authorization,
    TResult Function(String message, String field, String? code)? validation,
    TResult Function(String message, String? resource, String? code)? notFound,
    TResult Function(String message, String? code, Object? exception,
            StackTrace? stackTrace)?
        unexpected,
    required TResult orElse(),
  }) {
    if (authorization != null) {
      return authorization(message, code);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(NetworkFailure value) network,
    required TResult Function(ServerFailure value) server,
    required TResult Function(CacheFailure value) cache,
    required TResult Function(AuthenticationFailure value) authentication,
    required TResult Function(AuthorizationFailure value) authorization,
    required TResult Function(ValidationFailure value) validation,
    required TResult Function(NotFoundFailure value) notFound,
    required TResult Function(UnexpectedFailure value) unexpected,
  }) {
    return authorization(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(NetworkFailure value)? network,
    TResult? Function(ServerFailure value)? server,
    TResult? Function(CacheFailure value)? cache,
    TResult? Function(AuthenticationFailure value)? authentication,
    TResult? Function(AuthorizationFailure value)? authorization,
    TResult? Function(ValidationFailure value)? validation,
    TResult? Function(NotFoundFailure value)? notFound,
    TResult? Function(UnexpectedFailure value)? unexpected,
  }) {
    return authorization?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(NetworkFailure value)? network,
    TResult Function(ServerFailure value)? server,
    TResult Function(CacheFailure value)? cache,
    TResult Function(AuthenticationFailure value)? authentication,
    TResult Function(AuthorizationFailure value)? authorization,
    TResult Function(ValidationFailure value)? validation,
    TResult Function(NotFoundFailure value)? notFound,
    TResult Function(UnexpectedFailure value)? unexpected,
    required TResult orElse(),
  }) {
    if (authorization != null) {
      return authorization(this);
    }
    return orElse();
  }
}

abstract class AuthorizationFailure implements Failure {
  const factory AuthorizationFailure(
      {required final String message,
      final String? code}) = _$AuthorizationFailureImpl;

  @override
  String get message;
  @override
  String? get code;

  /// Create a copy of Failure
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$AuthorizationFailureImplCopyWith<_$AuthorizationFailureImpl>
      get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$ValidationFailureImplCopyWith<$Res>
    implements $FailureCopyWith<$Res> {
  factory _$$ValidationFailureImplCopyWith(_$ValidationFailureImpl value,
          $Res Function(_$ValidationFailureImpl) then) =
      __$$ValidationFailureImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String message, String field, String? code});
}

/// @nodoc
class __$$ValidationFailureImplCopyWithImpl<$Res>
    extends _$FailureCopyWithImpl<$Res, _$ValidationFailureImpl>
    implements _$$ValidationFailureImplCopyWith<$Res> {
  __$$ValidationFailureImplCopyWithImpl(_$ValidationFailureImpl _value,
      $Res Function(_$ValidationFailureImpl) _then)
      : super(_value, _then);

  /// Create a copy of Failure
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? message = null,
    Object? field = null,
    Object? code = freezed,
  }) {
    return _then(_$ValidationFailureImpl(
      message: null == message
          ? _value.message
          : message // ignore: cast_nullable_to_non_nullable
              as String,
      field: null == field
          ? _value.field
          : field // ignore: cast_nullable_to_non_nullable
              as String,
      code: freezed == code
          ? _value.code
          : code // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc

class _$ValidationFailureImpl implements ValidationFailure {
  const _$ValidationFailureImpl(
      {required this.message, required this.field, this.code});

  @override
  final String message;
  @override
  final String field;
  @override
  final String? code;

  @override
  String toString() {
    return 'Failure.validation(message: $message, field: $field, code: $code)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ValidationFailureImpl &&
            (identical(other.message, message) || other.message == message) &&
            (identical(other.field, field) || other.field == field) &&
            (identical(other.code, code) || other.code == code));
  }

  @override
  int get hashCode => Object.hash(runtimeType, message, field, code);

  /// Create a copy of Failure
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$ValidationFailureImplCopyWith<_$ValidationFailureImpl> get copyWith =>
      __$$ValidationFailureImplCopyWithImpl<_$ValidationFailureImpl>(
          this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(String message, String? code, int statusCode)
        network,
    required TResult Function(String message, String? code, int statusCode)
        server,
    required TResult Function(String message, String? code) cache,
    required TResult Function(String message, String? code) authentication,
    required TResult Function(String message, String? code) authorization,
    required TResult Function(String message, String field, String? code)
        validation,
    required TResult Function(String message, String? resource, String? code)
        notFound,
    required TResult Function(String message, String? code, Object? exception,
            StackTrace? stackTrace)
        unexpected,
  }) {
    return validation(message, field, code);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(String message, String? code, int statusCode)? network,
    TResult? Function(String message, String? code, int statusCode)? server,
    TResult? Function(String message, String? code)? cache,
    TResult? Function(String message, String? code)? authentication,
    TResult? Function(String message, String? code)? authorization,
    TResult? Function(String message, String field, String? code)? validation,
    TResult? Function(String message, String? resource, String? code)? notFound,
    TResult? Function(String message, String? code, Object? exception,
            StackTrace? stackTrace)?
        unexpected,
  }) {
    return validation?.call(message, field, code);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(String message, String? code, int statusCode)? network,
    TResult Function(String message, String? code, int statusCode)? server,
    TResult Function(String message, String? code)? cache,
    TResult Function(String message, String? code)? authentication,
    TResult Function(String message, String? code)? authorization,
    TResult Function(String message, String field, String? code)? validation,
    TResult Function(String message, String? resource, String? code)? notFound,
    TResult Function(String message, String? code, Object? exception,
            StackTrace? stackTrace)?
        unexpected,
    required TResult orElse(),
  }) {
    if (validation != null) {
      return validation(message, field, code);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(NetworkFailure value) network,
    required TResult Function(ServerFailure value) server,
    required TResult Function(CacheFailure value) cache,
    required TResult Function(AuthenticationFailure value) authentication,
    required TResult Function(AuthorizationFailure value) authorization,
    required TResult Function(ValidationFailure value) validation,
    required TResult Function(NotFoundFailure value) notFound,
    required TResult Function(UnexpectedFailure value) unexpected,
  }) {
    return validation(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(NetworkFailure value)? network,
    TResult? Function(ServerFailure value)? server,
    TResult? Function(CacheFailure value)? cache,
    TResult? Function(AuthenticationFailure value)? authentication,
    TResult? Function(AuthorizationFailure value)? authorization,
    TResult? Function(ValidationFailure value)? validation,
    TResult? Function(NotFoundFailure value)? notFound,
    TResult? Function(UnexpectedFailure value)? unexpected,
  }) {
    return validation?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(NetworkFailure value)? network,
    TResult Function(ServerFailure value)? server,
    TResult Function(CacheFailure value)? cache,
    TResult Function(AuthenticationFailure value)? authentication,
    TResult Function(AuthorizationFailure value)? authorization,
    TResult Function(ValidationFailure value)? validation,
    TResult Function(NotFoundFailure value)? notFound,
    TResult Function(UnexpectedFailure value)? unexpected,
    required TResult orElse(),
  }) {
    if (validation != null) {
      return validation(this);
    }
    return orElse();
  }
}

abstract class ValidationFailure implements Failure {
  const factory ValidationFailure(
      {required final String message,
      required final String field,
      final String? code}) = _$ValidationFailureImpl;

  @override
  String get message;
  String get field;
  @override
  String? get code;

  /// Create a copy of Failure
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$ValidationFailureImplCopyWith<_$ValidationFailureImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$NotFoundFailureImplCopyWith<$Res>
    implements $FailureCopyWith<$Res> {
  factory _$$NotFoundFailureImplCopyWith(_$NotFoundFailureImpl value,
          $Res Function(_$NotFoundFailureImpl) then) =
      __$$NotFoundFailureImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String message, String? resource, String? code});
}

/// @nodoc
class __$$NotFoundFailureImplCopyWithImpl<$Res>
    extends _$FailureCopyWithImpl<$Res, _$NotFoundFailureImpl>
    implements _$$NotFoundFailureImplCopyWith<$Res> {
  __$$NotFoundFailureImplCopyWithImpl(
      _$NotFoundFailureImpl _value, $Res Function(_$NotFoundFailureImpl) _then)
      : super(_value, _then);

  /// Create a copy of Failure
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? message = null,
    Object? resource = freezed,
    Object? code = freezed,
  }) {
    return _then(_$NotFoundFailureImpl(
      message: null == message
          ? _value.message
          : message // ignore: cast_nullable_to_non_nullable
              as String,
      resource: freezed == resource
          ? _value.resource
          : resource // ignore: cast_nullable_to_non_nullable
              as String?,
      code: freezed == code
          ? _value.code
          : code // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc

class _$NotFoundFailureImpl implements NotFoundFailure {
  const _$NotFoundFailureImpl(
      {required this.message, this.resource, this.code});

  @override
  final String message;
  @override
  final String? resource;
  @override
  final String? code;

  @override
  String toString() {
    return 'Failure.notFound(message: $message, resource: $resource, code: $code)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$NotFoundFailureImpl &&
            (identical(other.message, message) || other.message == message) &&
            (identical(other.resource, resource) ||
                other.resource == resource) &&
            (identical(other.code, code) || other.code == code));
  }

  @override
  int get hashCode => Object.hash(runtimeType, message, resource, code);

  /// Create a copy of Failure
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$NotFoundFailureImplCopyWith<_$NotFoundFailureImpl> get copyWith =>
      __$$NotFoundFailureImplCopyWithImpl<_$NotFoundFailureImpl>(
          this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(String message, String? code, int statusCode)
        network,
    required TResult Function(String message, String? code, int statusCode)
        server,
    required TResult Function(String message, String? code) cache,
    required TResult Function(String message, String? code) authentication,
    required TResult Function(String message, String? code) authorization,
    required TResult Function(String message, String field, String? code)
        validation,
    required TResult Function(String message, String? resource, String? code)
        notFound,
    required TResult Function(String message, String? code, Object? exception,
            StackTrace? stackTrace)
        unexpected,
  }) {
    return notFound(message, resource, code);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(String message, String? code, int statusCode)? network,
    TResult? Function(String message, String? code, int statusCode)? server,
    TResult? Function(String message, String? code)? cache,
    TResult? Function(String message, String? code)? authentication,
    TResult? Function(String message, String? code)? authorization,
    TResult? Function(String message, String field, String? code)? validation,
    TResult? Function(String message, String? resource, String? code)? notFound,
    TResult? Function(String message, String? code, Object? exception,
            StackTrace? stackTrace)?
        unexpected,
  }) {
    return notFound?.call(message, resource, code);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(String message, String? code, int statusCode)? network,
    TResult Function(String message, String? code, int statusCode)? server,
    TResult Function(String message, String? code)? cache,
    TResult Function(String message, String? code)? authentication,
    TResult Function(String message, String? code)? authorization,
    TResult Function(String message, String field, String? code)? validation,
    TResult Function(String message, String? resource, String? code)? notFound,
    TResult Function(String message, String? code, Object? exception,
            StackTrace? stackTrace)?
        unexpected,
    required TResult orElse(),
  }) {
    if (notFound != null) {
      return notFound(message, resource, code);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(NetworkFailure value) network,
    required TResult Function(ServerFailure value) server,
    required TResult Function(CacheFailure value) cache,
    required TResult Function(AuthenticationFailure value) authentication,
    required TResult Function(AuthorizationFailure value) authorization,
    required TResult Function(ValidationFailure value) validation,
    required TResult Function(NotFoundFailure value) notFound,
    required TResult Function(UnexpectedFailure value) unexpected,
  }) {
    return notFound(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(NetworkFailure value)? network,
    TResult? Function(ServerFailure value)? server,
    TResult? Function(CacheFailure value)? cache,
    TResult? Function(AuthenticationFailure value)? authentication,
    TResult? Function(AuthorizationFailure value)? authorization,
    TResult? Function(ValidationFailure value)? validation,
    TResult? Function(NotFoundFailure value)? notFound,
    TResult? Function(UnexpectedFailure value)? unexpected,
  }) {
    return notFound?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(NetworkFailure value)? network,
    TResult Function(ServerFailure value)? server,
    TResult Function(CacheFailure value)? cache,
    TResult Function(AuthenticationFailure value)? authentication,
    TResult Function(AuthorizationFailure value)? authorization,
    TResult Function(ValidationFailure value)? validation,
    TResult Function(NotFoundFailure value)? notFound,
    TResult Function(UnexpectedFailure value)? unexpected,
    required TResult orElse(),
  }) {
    if (notFound != null) {
      return notFound(this);
    }
    return orElse();
  }
}

abstract class NotFoundFailure implements Failure {
  const factory NotFoundFailure(
      {required final String message,
      final String? resource,
      final String? code}) = _$NotFoundFailureImpl;

  @override
  String get message;
  String? get resource;
  @override
  String? get code;

  /// Create a copy of Failure
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$NotFoundFailureImplCopyWith<_$NotFoundFailureImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$UnexpectedFailureImplCopyWith<$Res>
    implements $FailureCopyWith<$Res> {
  factory _$$UnexpectedFailureImplCopyWith(_$UnexpectedFailureImpl value,
          $Res Function(_$UnexpectedFailureImpl) then) =
      __$$UnexpectedFailureImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String message,
      String? code,
      Object? exception,
      StackTrace? stackTrace});
}

/// @nodoc
class __$$UnexpectedFailureImplCopyWithImpl<$Res>
    extends _$FailureCopyWithImpl<$Res, _$UnexpectedFailureImpl>
    implements _$$UnexpectedFailureImplCopyWith<$Res> {
  __$$UnexpectedFailureImplCopyWithImpl(_$UnexpectedFailureImpl _value,
      $Res Function(_$UnexpectedFailureImpl) _then)
      : super(_value, _then);

  /// Create a copy of Failure
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? message = null,
    Object? code = freezed,
    Object? exception = freezed,
    Object? stackTrace = freezed,
  }) {
    return _then(_$UnexpectedFailureImpl(
      message: null == message
          ? _value.message
          : message // ignore: cast_nullable_to_non_nullable
              as String,
      code: freezed == code
          ? _value.code
          : code // ignore: cast_nullable_to_non_nullable
              as String?,
      exception: freezed == exception ? _value.exception : exception,
      stackTrace: freezed == stackTrace
          ? _value.stackTrace
          : stackTrace // ignore: cast_nullable_to_non_nullable
              as StackTrace?,
    ));
  }
}

/// @nodoc

class _$UnexpectedFailureImpl implements UnexpectedFailure {
  const _$UnexpectedFailureImpl(
      {required this.message, this.code, this.exception, this.stackTrace});

  @override
  final String message;
  @override
  final String? code;
  @override
  final Object? exception;
  @override
  final StackTrace? stackTrace;

  @override
  String toString() {
    return 'Failure.unexpected(message: $message, code: $code, exception: $exception, stackTrace: $stackTrace)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$UnexpectedFailureImpl &&
            (identical(other.message, message) || other.message == message) &&
            (identical(other.code, code) || other.code == code) &&
            const DeepCollectionEquality().equals(other.exception, exception) &&
            (identical(other.stackTrace, stackTrace) ||
                other.stackTrace == stackTrace));
  }

  @override
  int get hashCode => Object.hash(runtimeType, message, code,
      const DeepCollectionEquality().hash(exception), stackTrace);

  /// Create a copy of Failure
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$UnexpectedFailureImplCopyWith<_$UnexpectedFailureImpl> get copyWith =>
      __$$UnexpectedFailureImplCopyWithImpl<_$UnexpectedFailureImpl>(
          this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(String message, String? code, int statusCode)
        network,
    required TResult Function(String message, String? code, int statusCode)
        server,
    required TResult Function(String message, String? code) cache,
    required TResult Function(String message, String? code) authentication,
    required TResult Function(String message, String? code) authorization,
    required TResult Function(String message, String field, String? code)
        validation,
    required TResult Function(String message, String? resource, String? code)
        notFound,
    required TResult Function(String message, String? code, Object? exception,
            StackTrace? stackTrace)
        unexpected,
  }) {
    return unexpected(message, code, exception, stackTrace);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(String message, String? code, int statusCode)? network,
    TResult? Function(String message, String? code, int statusCode)? server,
    TResult? Function(String message, String? code)? cache,
    TResult? Function(String message, String? code)? authentication,
    TResult? Function(String message, String? code)? authorization,
    TResult? Function(String message, String field, String? code)? validation,
    TResult? Function(String message, String? resource, String? code)? notFound,
    TResult? Function(String message, String? code, Object? exception,
            StackTrace? stackTrace)?
        unexpected,
  }) {
    return unexpected?.call(message, code, exception, stackTrace);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(String message, String? code, int statusCode)? network,
    TResult Function(String message, String? code, int statusCode)? server,
    TResult Function(String message, String? code)? cache,
    TResult Function(String message, String? code)? authentication,
    TResult Function(String message, String? code)? authorization,
    TResult Function(String message, String field, String? code)? validation,
    TResult Function(String message, String? resource, String? code)? notFound,
    TResult Function(String message, String? code, Object? exception,
            StackTrace? stackTrace)?
        unexpected,
    required TResult orElse(),
  }) {
    if (unexpected != null) {
      return unexpected(message, code, exception, stackTrace);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(NetworkFailure value) network,
    required TResult Function(ServerFailure value) server,
    required TResult Function(CacheFailure value) cache,
    required TResult Function(AuthenticationFailure value) authentication,
    required TResult Function(AuthorizationFailure value) authorization,
    required TResult Function(ValidationFailure value) validation,
    required TResult Function(NotFoundFailure value) notFound,
    required TResult Function(UnexpectedFailure value) unexpected,
  }) {
    return unexpected(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(NetworkFailure value)? network,
    TResult? Function(ServerFailure value)? server,
    TResult? Function(CacheFailure value)? cache,
    TResult? Function(AuthenticationFailure value)? authentication,
    TResult? Function(AuthorizationFailure value)? authorization,
    TResult? Function(ValidationFailure value)? validation,
    TResult? Function(NotFoundFailure value)? notFound,
    TResult? Function(UnexpectedFailure value)? unexpected,
  }) {
    return unexpected?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(NetworkFailure value)? network,
    TResult Function(ServerFailure value)? server,
    TResult Function(CacheFailure value)? cache,
    TResult Function(AuthenticationFailure value)? authentication,
    TResult Function(AuthorizationFailure value)? authorization,
    TResult Function(ValidationFailure value)? validation,
    TResult Function(NotFoundFailure value)? notFound,
    TResult Function(UnexpectedFailure value)? unexpected,
    required TResult orElse(),
  }) {
    if (unexpected != null) {
      return unexpected(this);
    }
    return orElse();
  }
}

abstract class UnexpectedFailure implements Failure {
  const factory UnexpectedFailure(
      {required final String message,
      final String? code,
      final Object? exception,
      final StackTrace? stackTrace}) = _$UnexpectedFailureImpl;

  @override
  String get message;
  @override
  String? get code;
  Object? get exception;
  StackTrace? get stackTrace;

  /// Create a copy of Failure
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$UnexpectedFailureImplCopyWith<_$UnexpectedFailureImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
