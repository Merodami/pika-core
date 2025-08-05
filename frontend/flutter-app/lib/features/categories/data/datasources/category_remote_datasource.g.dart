// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'category_remote_datasource.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

CategoryResponse _$CategoryResponseFromJson(Map<String, dynamic> json) =>
    CategoryResponse(
      data: CategoryModel.fromJson(json['data'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$CategoryResponseToJson(CategoryResponse instance) =>
    <String, dynamic>{
      'data': instance.data,
    };

PaginatedCategoriesResponse _$PaginatedCategoriesResponseFromJson(
        Map<String, dynamic> json) =>
    PaginatedCategoriesResponse(
      data: (json['data'] as List<dynamic>)
          .map((e) => CategoryModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      pagination: json['pagination'] == null
          ? null
          : PaginationMeta.fromJson(json['pagination'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$PaginatedCategoriesResponseToJson(
        PaginatedCategoriesResponse instance) =>
    <String, dynamic>{
      'data': instance.data,
      'pagination': instance.pagination,
    };

PaginationMeta _$PaginationMetaFromJson(Map<String, dynamic> json) =>
    PaginationMeta(
      page: (json['page'] as num).toInt(),
      limit: (json['limit'] as num).toInt(),
      total: (json['total'] as num).toInt(),
      pages: (json['pages'] as num).toInt(),
      hasNext: json['hasNext'] as bool? ?? false,
      hasPrev: json['hasPrev'] as bool? ?? false,
    );

Map<String, dynamic> _$PaginationMetaToJson(PaginationMeta instance) =>
    <String, dynamic>{
      'page': instance.page,
      'limit': instance.limit,
      'total': instance.total,
      'pages': instance.pages,
      'hasNext': instance.hasNext,
      'hasPrev': instance.hasPrev,
    };

// **************************************************************************
// RetrofitGenerator
// **************************************************************************

// ignore_for_file: unnecessary_brace_in_string_interps,no_leading_underscores_for_local_identifiers,unused_element,unnecessary_string_interpolations

class _CategoryRemoteDataSource implements CategoryRemoteDataSource {
  _CategoryRemoteDataSource(
    this._dio, {
    this.baseUrl,
    this.errorLogger,
  });

  final Dio _dio;

  String? baseUrl;

  final ParseErrorLogger? errorLogger;

  @override
  Future<PaginatedCategoriesResponse> getCategories({
    int page = 1,
    int limit = 20,
    String? parentId,
    int? level,
    bool? active,
    bool includeChildren = false,
    String sort = 'sort_order',
    String order = 'asc',
  }) async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{
      r'page': page,
      r'limit': limit,
      r'parent_id': parentId,
      r'level': level,
      r'active': active,
      r'include_children': includeChildren,
      r'sort': sort,
      r'order': order,
    };
    queryParameters.removeWhere((k, v) => v == null);
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<PaginatedCategoriesResponse>(Options(
      method: 'GET',
      headers: _headers,
      extra: _extra,
    )
        .compose(
          _dio.options,
          '/categories',
          queryParameters: queryParameters,
          data: _data,
        )
        .copyWith(
            baseUrl: _combineBaseUrls(
          _dio.options.baseUrl,
          baseUrl,
        )));
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late PaginatedCategoriesResponse _value;
    try {
      _value = PaginatedCategoriesResponse.fromJson(_result.data!);
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<CategoryResponse> getCategoryById(String id) async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<CategoryResponse>(Options(
      method: 'GET',
      headers: _headers,
      extra: _extra,
    )
        .compose(
          _dio.options,
          '/categories/${id}',
          queryParameters: queryParameters,
          data: _data,
        )
        .copyWith(
            baseUrl: _combineBaseUrls(
          _dio.options.baseUrl,
          baseUrl,
        )));
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late CategoryResponse _value;
    try {
      _value = CategoryResponse.fromJson(_result.data!);
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<PaginatedCategoriesResponse> getFeaturedCategories({
    int limit = 10,
    int level = 1,
    bool active = true,
    String sort = 'sort_order',
  }) async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{
      r'limit': limit,
      r'level': level,
      r'active': active,
      r'sort': sort,
    };
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<PaginatedCategoriesResponse>(Options(
      method: 'GET',
      headers: _headers,
      extra: _extra,
    )
        .compose(
          _dio.options,
          '/categories',
          queryParameters: queryParameters,
          data: _data,
        )
        .copyWith(
            baseUrl: _combineBaseUrls(
          _dio.options.baseUrl,
          baseUrl,
        )));
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late PaginatedCategoriesResponse _value;
    try {
      _value = PaginatedCategoriesResponse.fromJson(_result.data!);
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<PaginatedCategoriesResponse> getCategoriesByPopularity({
    int limit = 10,
    bool active = true,
    String sort = 'sort_order',
    String order = 'asc',
  }) async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{
      r'limit': limit,
      r'active': active,
      r'sort': sort,
      r'order': order,
    };
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<PaginatedCategoriesResponse>(Options(
      method: 'GET',
      headers: _headers,
      extra: _extra,
    )
        .compose(
          _dio.options,
          '/categories',
          queryParameters: queryParameters,
          data: _data,
        )
        .copyWith(
            baseUrl: _combineBaseUrls(
          _dio.options.baseUrl,
          baseUrl,
        )));
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late PaginatedCategoriesResponse _value;
    try {
      _value = PaginatedCategoriesResponse.fromJson(_result.data!);
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<PaginatedCategoriesResponse> searchCategories({
    int limit = 20,
    bool active = true,
  }) async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{
      r'limit': limit,
      r'active': active,
    };
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<PaginatedCategoriesResponse>(Options(
      method: 'GET',
      headers: _headers,
      extra: _extra,
    )
        .compose(
          _dio.options,
          '/categories',
          queryParameters: queryParameters,
          data: _data,
        )
        .copyWith(
            baseUrl: _combineBaseUrls(
          _dio.options.baseUrl,
          baseUrl,
        )));
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late PaginatedCategoriesResponse _value;
    try {
      _value = PaginatedCategoriesResponse.fromJson(_result.data!);
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<CategoryResponse> createCategory(CategoryModel category) async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final _data = category;
    final _options = _setStreamType<CategoryResponse>(Options(
      method: 'POST',
      headers: _headers,
      extra: _extra,
    )
        .compose(
          _dio.options,
          '/categories',
          queryParameters: queryParameters,
          data: _data,
        )
        .copyWith(
            baseUrl: _combineBaseUrls(
          _dio.options.baseUrl,
          baseUrl,
        )));
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late CategoryResponse _value;
    try {
      _value = CategoryResponse.fromJson(_result.data!);
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<CategoryResponse> updateCategory(
    String id,
    CategoryModel category,
  ) async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final _data = category;
    final _options = _setStreamType<CategoryResponse>(Options(
      method: 'PATCH',
      headers: _headers,
      extra: _extra,
    )
        .compose(
          _dio.options,
          '/categories/${id}',
          queryParameters: queryParameters,
          data: _data,
        )
        .copyWith(
            baseUrl: _combineBaseUrls(
          _dio.options.baseUrl,
          baseUrl,
        )));
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late CategoryResponse _value;
    try {
      _value = CategoryResponse.fromJson(_result.data!);
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<void> deleteCategory(String id) async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<void>(Options(
      method: 'DELETE',
      headers: _headers,
      extra: _extra,
    )
        .compose(
          _dio.options,
          '/categories/${id}',
          queryParameters: queryParameters,
          data: _data,
        )
        .copyWith(
            baseUrl: _combineBaseUrls(
          _dio.options.baseUrl,
          baseUrl,
        )));
    await _dio.fetch<void>(_options);
  }

  RequestOptions _setStreamType<T>(RequestOptions requestOptions) {
    if (T != dynamic &&
        !(requestOptions.responseType == ResponseType.bytes ||
            requestOptions.responseType == ResponseType.stream)) {
      if (T == String) {
        requestOptions.responseType = ResponseType.plain;
      } else {
        requestOptions.responseType = ResponseType.json;
      }
    }
    return requestOptions;
  }

  String _combineBaseUrls(
    String dioBaseUrl,
    String? baseUrl,
  ) {
    if (baseUrl == null || baseUrl.trim().isEmpty) {
      return dioBaseUrl;
    }

    final url = Uri.parse(baseUrl);

    if (url.isAbsolute) {
      return url.toString();
    }

    return Uri.parse(dioBaseUrl).resolveUri(url).toString();
  }
}
