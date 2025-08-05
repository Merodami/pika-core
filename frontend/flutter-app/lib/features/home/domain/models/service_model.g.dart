// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'service_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$ServiceModelImpl _$$ServiceModelImplFromJson(Map<String, dynamic> json) =>
    _$ServiceModelImpl(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String,
      price: (json['price'] as num).toDouble(),
      providerId: json['providerId'] as String,
      categoryId: json['categoryId'] as String,
      imageUrl: json['imageUrl'] as String?,
      duration: (json['duration'] as num?)?.toInt() ?? 0,
      priceType: json['priceType'] as String? ?? 'fixed',
      rating: (json['rating'] as num?)?.toDouble() ?? 5.0,
      reviewCount: (json['reviewCount'] as num?)?.toInt() ?? 0,
      isActive: json['isActive'] as bool? ?? true,
      tags:
          (json['tags'] as List<dynamic>?)?.map((e) => e as String).toList() ??
              const [],
      metadata: json['metadata'] as Map<String, dynamic>?,
    );

Map<String, dynamic> _$$ServiceModelImplToJson(_$ServiceModelImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'description': instance.description,
      'price': instance.price,
      'providerId': instance.providerId,
      'categoryId': instance.categoryId,
      'imageUrl': instance.imageUrl,
      'duration': instance.duration,
      'priceType': instance.priceType,
      'rating': instance.rating,
      'reviewCount': instance.reviewCount,
      'isActive': instance.isActive,
      'tags': instance.tags,
      'metadata': instance.metadata,
    };
