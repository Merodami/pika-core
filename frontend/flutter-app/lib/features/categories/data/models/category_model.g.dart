// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'category_model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class CategoryModelAdapter extends TypeAdapter<CategoryModel> {
  @override
  final int typeId = 1;

  @override
  CategoryModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return CategoryModel(
      id: fields[0] as String,
      name: (fields[1] as Map).cast<String, String>(),
      slug: fields[2] as String,
      description: (fields[3] as Map?)?.cast<String, String>(),
      iconUrl: fields[4] as String?,
      parentId: fields[5] as String?,
      level: fields[6] as int,
      path: fields[7] as String,
      active: fields[8] as bool?,
      sortOrder: fields[9] as int,
      createdAt: fields[10] as DateTime?,
      updatedAt: fields[11] as DateTime?,
      children: (fields[12] as List?)?.cast<CategoryModel>(),
    );
  }

  @override
  void write(BinaryWriter writer, CategoryModel obj) {
    writer
      ..writeByte(13)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.name)
      ..writeByte(2)
      ..write(obj.slug)
      ..writeByte(3)
      ..write(obj.description)
      ..writeByte(4)
      ..write(obj.iconUrl)
      ..writeByte(5)
      ..write(obj.parentId)
      ..writeByte(6)
      ..write(obj.level)
      ..writeByte(7)
      ..write(obj.path)
      ..writeByte(8)
      ..write(obj.active)
      ..writeByte(9)
      ..write(obj.sortOrder)
      ..writeByte(10)
      ..write(obj.createdAt)
      ..writeByte(11)
      ..write(obj.updatedAt)
      ..writeByte(12)
      ..write(obj.children);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is CategoryModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$CategoryModelImpl _$$CategoryModelImplFromJson(Map<String, dynamic> json) =>
    _$CategoryModelImpl(
      id: json['id'] as String,
      name: const MultilingualTextConverter().fromJson(json['name']),
      slug: json['slug'] as String,
      description:
          const MultilingualTextConverter().fromJson(json['description']),
      iconUrl: json['icon_url'] as String?,
      parentId: json['parent_id'] as String?,
      level: (json['level'] as num?)?.toInt() ?? 1,
      path: json['path'] as String? ?? '',
      active: json['active'] as bool?,
      sortOrder: (json['sort_order'] as num?)?.toInt() ?? 0,
      createdAt: json['created_at'] == null
          ? null
          : DateTime.parse(json['created_at'] as String),
      updatedAt: json['updated_at'] == null
          ? null
          : DateTime.parse(json['updated_at'] as String),
      children: (json['children'] as List<dynamic>?)
          ?.map((e) => CategoryModel.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$$CategoryModelImplToJson(_$CategoryModelImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': const MultilingualTextConverter().toJson(instance.name),
      'slug': instance.slug,
      'description': _$JsonConverterToJson<dynamic, Map<String, String>>(
          instance.description, const MultilingualTextConverter().toJson),
      'icon_url': instance.iconUrl,
      'parent_id': instance.parentId,
      'level': instance.level,
      'path': instance.path,
      'active': instance.active,
      'sort_order': instance.sortOrder,
      'created_at': instance.createdAt?.toIso8601String(),
      'updated_at': instance.updatedAt?.toIso8601String(),
      'children': instance.children,
    };

Json? _$JsonConverterToJson<Json, Value>(
  Value? value,
  Json? Function(Value value) toJson,
) =>
    value == null ? null : toJson(value);
