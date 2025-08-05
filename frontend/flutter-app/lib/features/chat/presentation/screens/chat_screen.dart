import 'package:flutter/material.dart';

class ChatScreen extends StatelessWidget {
  final String conversationId;
  final String? otherUserId;
  final String? otherUserName;
  
  const ChatScreen({
    super.key,
    required this.conversationId,
    this.otherUserId,
    this.otherUserName,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(otherUserName ?? 'Chat'),
      ),
      body: Center(
        child: Text('Chat Screen - Conversation: $conversationId'),
      ),
    );
  }
}