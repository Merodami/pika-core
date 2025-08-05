import 'package:dio/dio.dart';
import '../../../../core/services/api/api_client.dart';
import '../../../../core/exceptions/app_exceptions.dart';
import '../models/conversation_dto.dart';
import '../models/message_dto.dart';

class MessagingApiDatasource {
  final ApiClient _apiClient;
  
  MessagingApiDatasource(this._apiClient);
  
  // Get conversations for current user
  Future<PaginatedResult<ConversationDto>> getConversations({
    int page = 1,
    int limit = 20,
    String? status,
    String? context,
  }) async {
    try {
      final response = await _apiClient.get(
        '/conversations',
        queryParameters: {
          'page': page,
          'limit': limit,
          if (status != null) 'status': status,
          if (context != null) 'context': context,
        },
      );
      
      return PaginatedResult<ConversationDto>.fromJson(
        response.data,
        (json) => ConversationDto.fromJson(json),
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }
  
  // Create new conversation
  Future<ConversationDto> createConversation({
    required List<String> participantIds,
    required String context,
    String? serviceId,
    String? bookingId,
    Map<String, dynamic>? metadata,
  }) async {
    try {
      final response = await _apiClient.post(
        '/conversations',
        data: {
          'participant_ids': participantIds,
          'context': context,
          if (serviceId != null) 'service_id': serviceId,
          if (bookingId != null) 'booking_id': bookingId,
          if (metadata != null) 'metadata': metadata,
        },
      );
      
      return ConversationDto.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }
  
  // Get messages for a conversation
  Future<PaginatedResult<MessageDto>> getMessages(
    String conversationId, {
    int page = 1,
    int limit = 50,
    String? beforeMessageId,
  }) async {
    try {
      final response = await _apiClient.get(
        '/conversations/$conversationId/messages',
        queryParameters: {
          'page': page,
          'limit': limit,
          if (beforeMessageId != null) 'before_message_id': beforeMessageId,
        },
      );
      
      return PaginatedResult<MessageDto>.fromJson(
        response.data,
        (json) => MessageDto.fromJson(json),
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }
  
  // Send message
  Future<MessageDto> sendMessage(
    String conversationId, {
    required String content,
    required String type,
    String? replyToId,
    Map<String, dynamic>? metadata,
  }) async {
    try {
      final response = await _apiClient.post(
        '/conversations/$conversationId/messages',
        data: {
          'content': content,
          'type': type,
          if (replyToId != null) 'reply_to_id': replyToId,
          if (metadata != null) 'metadata': metadata,
        },
      );
      
      return MessageDto.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }
  
  // Mark messages as read
  Future<void> markAsRead(String conversationId, {String? messageId}) async {
    try {
      await _apiClient.patch(
        '/conversations/$conversationId/read',
        data: {
          if (messageId != null) 'message_id': messageId,
        },
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }
  
  // Upload file for message
  Future<String> uploadFile(
    String conversationId,
    String filePath,
    String fileName,
  ) async {
    try {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(filePath, filename: fileName),
      });
      
      final response = await _apiClient.post(
        '/conversations/$conversationId/upload',
        data: formData,
        options: Options(
          headers: {'Content-Type': 'multipart/form-data'},
        ),
      );
      
      return response.data['file_url'] as String;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }
  
  // Get conversation by ID
  Future<ConversationDto> getConversation(String conversationId) async {
    try {
      final response = await _apiClient.get('/conversations/$conversationId');
      return ConversationDto.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }
  
  // Update conversation settings
  Future<ConversationDto> updateConversation(
    String conversationId, {
    bool? isMuted,
    bool? isArchived,
    bool? isBlocked,
  }) async {
    try {
      final data = <String, dynamic>{};
      if (isMuted != null) data['is_muted'] = isMuted;
      if (isArchived != null) data['is_archived'] = isArchived;
      if (isBlocked != null) data['is_blocked'] = isBlocked;
      
      final response = await _apiClient.patch(
        '/conversations/$conversationId',
        data: data,
      );
      
      return ConversationDto.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }
  
  // Search conversations
  Future<PaginatedResult<ConversationDto>> searchConversations({
    required String query,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _apiClient.get(
        '/conversations/search',
        queryParameters: {
          'query': query,
          'page': page,
          'limit': limit,
        },
      );
      
      return PaginatedResult<ConversationDto>.fromJson(
        response.data,
        (json) => ConversationDto.fromJson(json),
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }
  
  // Handle API errors
  AppException _handleError(DioException error) {
    if (error.response != null) {
      final statusCode = error.response!.statusCode;
      final data = error.response!.data;
      String message = 'Messaging error';
      
      if (data is Map && data.containsKey('message')) {
        message = data['message'];
      } else if (data is Map && data.containsKey('error')) {
        message = data['error']['message'] ?? message;
      }
      
      switch (statusCode) {
        case 400:
          return ValidationException(message);
        case 401:
          return UnauthorizedException(message);
        case 403:
          return UnauthorizedException('Access denied');
        case 404:
          return NotFoundException(message);
        case 409:
          return ConflictException(message);
        case 422:
          return ValidationException(message);
        default:
          return ServerException(message);
      }
    }
    
    if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout) {
      return NetworkException('Connection timeout. Please try again.');
    }
    
    return NetworkException('Network error. Please check your connection.');
  }
}

// Pagination result helper
class PaginatedResult<T> {
  final List<T> data;
  final PaginationMeta pagination;
  
  PaginatedResult({
    required this.data,
    required this.pagination,
  });
  
  factory PaginatedResult.fromJson(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic>) fromJsonT,
  ) {
    return PaginatedResult(
      data: (json['data'] as List)
          .map((item) => fromJsonT(item as Map<String, dynamic>))
          .toList(),
      pagination: PaginationMeta.fromJson(json['pagination']),
    );
  }
}

class PaginationMeta {
  final int currentPage;
  final int totalPages;
  final int totalItems;
  final int itemsPerPage;
  final bool hasNextPage;
  final bool hasPreviousPage;
  
  PaginationMeta({
    required this.currentPage,
    required this.totalPages,
    required this.totalItems,
    required this.itemsPerPage,
    required this.hasNextPage,
    required this.hasPreviousPage,
  });
  
  factory PaginationMeta.fromJson(Map<String, dynamic> json) {
    return PaginationMeta(
      currentPage: json['current_page'] as int,
      totalPages: json['total_pages'] as int,
      totalItems: json['total_items'] as int,
      itemsPerPage: json['items_per_page'] as int,
      hasNextPage: json['has_next_page'] as bool,
      hasPreviousPage: json['has_previous_page'] as bool,
    );
  }
}