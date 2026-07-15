import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  static const String baseUrl = kIsWeb
      ? 'http://localhost:3000'
      : 'https://esm-client.vercel.app';

  static String? _token;

  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('esm_token');
  }

  static Future<void> saveToken(String token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('esm_token', token);
  }

  static Future<void> clearToken() async {
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('esm_token');
    await prefs.remove('esm_user');
  }

  static Future<void> saveUser(Map<String, dynamic> user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('esm_user', jsonEncode(user));
  }

  static Future<Map<String, dynamic>?> getUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('esm_user');
    if (userStr == null) return null;
    return jsonDecode(userStr) as Map<String, dynamic>;
  }

  static Map<String, String> get _headers {
    final headers = {'Content-Type': 'application/json'};
    if (_token != null) {
      headers['Authorization'] = 'Bearer $_token';
    }
    return headers;
  }

  static String _buildUrl(String path, [Map<String, dynamic>? query]) {
    String url = '$baseUrl/api/$path';
    if (query != null && query.isNotEmpty) {
      final params = query.entries
          .where((e) => e.value != null && e.value.toString().isNotEmpty)
          .map((e) => '${e.key}=${Uri.encodeComponent(e.value.toString())}')
          .join('&');
      if (params.isNotEmpty) url += '?$params';
    }
    return url;
  }

  static Future<dynamic> get(String path, {Map<String, dynamic>? query}) async {
    try {
      final response = await http.get(Uri.parse(_buildUrl(path, query)), headers: _headers);
      return _handleResponse(response);
    } catch (e) {
      throw _handleError(e);
    }
  }

  static Future<dynamic> post(String path, {Map<String, dynamic>? body}) async {
    try {
      final response = await http.post(
        Uri.parse(_buildUrl(path)),
        headers: _headers,
        body: body != null ? jsonEncode(body) : null,
      );
      return _handleResponse(response);
    } catch (e) {
      throw _handleError(e);
    }
  }

  static Future<dynamic> patch(String path, {Map<String, dynamic>? body}) async {
    try {
      final response = await http.patch(
        Uri.parse(_buildUrl(path)),
        headers: _headers,
        body: body != null ? jsonEncode(body) : null,
      );
      return _handleResponse(response);
    } catch (e) {
      throw _handleError(e);
    }
  }

  static Future<dynamic> delete(String path) async {
    try {
      final response = await http.delete(Uri.parse(_buildUrl(path)), headers: _headers);
      return _handleResponse(response);
    } catch (e) {
      throw _handleError(e);
    }
  }

  static dynamic _handleResponse(http.Response response) {
    final status = response.statusCode;
    dynamic data;
    try {
      data = jsonDecode(response.body);
    } catch (_) {
      throw ApiException('Invalid response from server');
    }
    if (status >= 200 && status < 300) {
      return data;
    }
    throw ApiException(data['error'] ?? data['message'] ?? 'Request failed ($status)');
  }

  static String _handleError(dynamic e) {
    if (e is ApiException) return e.message;
    if (e.toString().contains('Failed to fetch') || e.toString().contains('SocketException')) {
      return 'Cannot connect to server. Please check your connection.';
    }
    return e.toString();
  }

  // ===== Auth API =====
  static Future<Map<String, dynamic>> login(String email, String password, [String? name]) async {
    final body = {'email': email, 'password': password};
    if (name != null) body['name'] = name;
    return await post('auth/login', body: body);
  }

  static Future<void> logout() async {
    try { await post('auth/logout'); } catch (_) {}
    await clearToken();
  }

  // ===== Generic API helpers =====
  static Future<List<dynamic>> getList(String path, {Map<String, dynamic>? query}) async {
    final result = await get(path, query: query);
    return result is List ? result : [];
  }

  static Future<Map<String, dynamic>> getObject(String path, {Map<String, dynamic>? query}) async {
    final result = await get(path, query: query);
    return result is Map<String, dynamic> ? result : {};
  }
}

class ApiException implements Exception {
  final String message;
  ApiException(this.message);
  @override
  String toString() => message;
}
