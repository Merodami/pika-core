// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'message_dto.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$MessageDtoImpl _$$MessageDtoImplFromJson(Map<String, dynamic> json) =>
    _$MessageDtoImpl(
      id: json['id'] as String,
      conversationId: json['conversationId'] as String,
      senderId: json['senderId'] as String,
      content: json['content'] as String,
      timestamp: DateTime.parse(json['timestamp'] as String),
      isRead: json['isRead'] as bool? ?? false,
      type: $enumDecodeNullable(_$MessageTypeEnumMap, json['type']) ??
          MessageType.text,
      metadata: json['metadata'] as Map<String, dynamic>?,
    );

Map<String, dynamic> _$$MessageDtoImplToJson(_$MessageDtoImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'conversationId': instance.conversationId,
      'senderId': instance.senderId,
      'content': instance.content,
      'timestamp': instance.timestamp.toIso8601String(),
      'isRead': instance.isRead,
      'type': _$MessageTypeEnumMap[instance.type]!,
      'metadata': instance.metadata,
    };

const _$MessageTypeEnumMap = {
  MessageType.text: 'text',
  MessageType.image: 'image',
  MessageType.document: 'document',
  MessageType.location: 'location',
  MessageType.voice: 'voice',
  MessageType.system: 'system',
};
