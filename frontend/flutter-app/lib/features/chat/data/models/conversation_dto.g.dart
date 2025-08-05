// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'conversation_dto.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$ConversationDtoImpl _$$ConversationDtoImplFromJson(
        Map<String, dynamic> json) =>
    _$ConversationDtoImpl(
      id: json['id'] as String,
      participants: (json['participants'] as List<dynamic>)
          .map((e) => e as String)
          .toList(),
      lastMessage: json['lastMessage'] as String?,
      lastMessageTime: json['lastMessageTime'] == null
          ? null
          : DateTime.parse(json['lastMessageTime'] as String),
      unreadCount: (json['unreadCount'] as num?)?.toInt() ?? 0,
      type: $enumDecodeNullable(_$ConversationTypeEnumMap, json['type']) ??
          ConversationType.private,
      metadata: json['metadata'] as Map<String, dynamic>?,
      isActive: json['isActive'] as bool? ?? true,
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
      updatedAt: json['updatedAt'] == null
          ? null
          : DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$$ConversationDtoImplToJson(
        _$ConversationDtoImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'participants': instance.participants,
      'lastMessage': instance.lastMessage,
      'lastMessageTime': instance.lastMessageTime?.toIso8601String(),
      'unreadCount': instance.unreadCount,
      'type': _$ConversationTypeEnumMap[instance.type]!,
      'metadata': instance.metadata,
      'isActive': instance.isActive,
      'createdAt': instance.createdAt?.toIso8601String(),
      'updatedAt': instance.updatedAt?.toIso8601String(),
    };

const _$ConversationTypeEnumMap = {
  ConversationType.private: 'private',
  ConversationType.group: 'group',
  ConversationType.support: 'support',
  ConversationType.system: 'system',
};
