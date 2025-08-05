import 'package:freezed_annotation/freezed_annotation.dart';

part 'message_dto.freezed.dart';
part 'message_dto.g.dart';

@freezed
class MessageDto with _$MessageDto {
  const factory MessageDto({
    required String id,
    required String conversationId,
    required String senderId,
    required String content,
    required DateTime timestamp,
    @Default(false) bool isRead,
    @Default(MessageType.text) MessageType type,
    Map<String, dynamic>? metadata,
  }) = _MessageDto;

  factory MessageDto.fromJson(Map<String, dynamic> json) =>
      _$MessageDtoFromJson(json);
}

enum MessageType {
  text,
  image,
  document,
  location,
  voice,
  system
}