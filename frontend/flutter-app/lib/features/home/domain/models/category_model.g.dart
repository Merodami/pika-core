// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'category_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$CategoryModelImpl _$$CategoryModelImplFromJson(Map<String, dynamic> json) =>
    _$CategoryModelImpl(
      id: json['id'] as String,
      name: json['name'] as String,
      slug: json['slug'] as String,
      description: json['description'] as String?,
      imageUrl: json['imageUrl'] as String?,
      iconName: json['iconName'] as String?,
      isActive: json['isActive'] as bool? ?? true,
      serviceCount: (json['serviceCount'] as num?)?.toInt() ?? 0,
      translations: (json['translations'] as Map<String, dynamic>?)?.map(
        (k, e) => MapEntry(k, e as String),
      ),
    );

Map<String, dynamic> _$$CategoryModelImplToJson(_$CategoryModelImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'slug': instance.slug,
      'description': instance.description,
      'imageUrl': instance.imageUrl,
      'iconName': instance.iconName,
      'isActive': instance.isActive,
      'serviceCount': instance.serviceCount,
      'translations': instance.translations,
    };
