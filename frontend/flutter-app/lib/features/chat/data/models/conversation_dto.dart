import 'package:freezed_annotation/freezed_annotation.dart';

part 'conversation_dto.freezed.dart';
part 'conversation_dto.g.dart';

@freezed
class ConversationDto with _$ConversationDto {
  const factory ConversationDto({
    required String id,
    required List<String> participants,
    String? lastMessage,
    DateTime? lastMessageTime,
    @Default(0) int unreadCount,
    @Default(ConversationType.private) ConversationType type,
    Map<String, dynamic>? metadata,
    @Default(true) bool isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) = _ConversationDto;

  factory ConversationDto.fromJson(Map<String, dynamic> json) =>
      _$ConversationDtoFromJson(json);
}

enum ConversationType {
  private,
  group,
  support,
  system
}