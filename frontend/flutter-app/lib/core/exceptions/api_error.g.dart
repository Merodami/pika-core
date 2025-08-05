// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'api_error.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

FieldError _$FieldErrorFromJson(Map<String, dynamic> json) => FieldError(
      code: json['code'] as String,
      message: json['message'] as String,
      hint: json['hint'] as String?,
    );

Map<String, dynamic> _$FieldErrorToJson(FieldError instance) =>
    <String, dynamic>{
      'code': instance.code,
      'message': instance.message,
      'hint': instance.hint,
    };

ErrorMeta _$ErrorMetaFromJson(Map<String, dynamic> json) => ErrorMeta(
      timestamp: json['timestamp'] as String,
      path: json['path'] as String,
      traceId: json['traceId'] as String,
    );

Map<String, dynamic> _$ErrorMetaToJson(ErrorMeta instance) => <String, dynamic>{
      'timestamp': instance.timestamp,
      'path': instance.path,
      'traceId': instance.traceId,
    };

ApiError _$ApiErrorFromJson(Map<String, dynamic> json) => ApiError(
      error: json['error'] as String,
      message: json['message'] as String,
      statusCode: (json['statusCode'] as num).toInt(),
      fields: (json['fields'] as Map<String, dynamic>?)?.map(
        (k, e) => MapEntry(k, FieldError.fromJson(e as Map<String, dynamic>)),
      ),
      meta: json['meta'] == null
          ? null
          : ErrorMeta.fromJson(json['meta'] as Map<String, dynamic>),
      validationErrors:
          (json['validationErrors'] as Map<String, dynamic>?)?.map(
        (k, e) =>
            MapEntry(k, (e as List<dynamic>).map((e) => e as String).toList()),
      ),
    );

Map<String, dynamic> _$ApiErrorToJson(ApiError instance) => <String, dynamic>{
      'error': instance.error,
      'message': instance.message,
      'statusCode': instance.statusCode,
      'fields': instance.fields,
      'meta': instance.meta,
      'validationErrors': instance.validationErrors,
    };
