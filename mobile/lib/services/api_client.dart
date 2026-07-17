import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  /// Base URL of the ESM backend. On the mobile app this MUST be an absolute
  /// URL (e.g. https://esm.vercel.app) because — unlike a browser — Flutter
  /// cannot resolve relative URLs. Configurable at runtime via the Server
  /// Settings dialog on the login screen; persisted in SharedPreferences.
  static String _baseUrl = '';
  static String get baseUrl => _baseUrl;

  static String? _token;
  static String? get token => _token;

  static const String _baseUrlKey = 'esm_base_url';
  // Pre-configured production server so the app works out of the box.
  // Users can still override via the Server Settings dialog on the login screen.
  static const String _defaultBaseUrl = 'https://esm-rose.vercel.app';

  /// Called once at startup (in main.dart). Loads the saved base URL + token
  /// AND restores the persistent cache from disk so the app is instant on launch.
  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _baseUrl = prefs.getString(_baseUrlKey) ?? _defaultBaseUrl;
    _token = prefs.getString('esm_token');
    // Restore persistent cache from disk → memory
    await _loadPersistentCache();
  }

  // === Persistent cache (survives app restarts) ===
  // Stores cached GET responses as JSON in SharedPreferences so the app
  // is instant even on cold start. The stale-while-revalidate pattern then
  // refreshes data in the background.
  static const String _persistKey = 'esm_api_cache';
  static bool _persistDirty = false;

  static Future<void> _loadPersistentCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final json = prefs.getString(_persistKey);
      if (json != null) {
        final map = jsonDecode(json) as Map<String, dynamic>;
        _cache.clear();
        for (final entry in map.entries) {
          _cache[entry.key] = _CacheEntry(entry.value, DateTime.now().subtract(const Duration(minutes: 5)));
        }
      }
    } catch (_) {}
  }

  static Future<void> _persistCache() async {
    if (!_persistDirty) return;
    _persistDirty = false;
    try {
      final prefs = await SharedPreferences.getInstance();
      final map = <String, dynamic>{};
      for (final entry in _cache.entries) {
        map[entry.key] = entry.value.data;
      }
      await prefs.setString(_persistKey, jsonEncode(map));
    } catch (_) {}
  }

  /// Persist a new base URL. Called from the Server Settings dialog.
  static Future<void> setBaseUrl(String url) async {
    var cleaned = url.trim();
    if (cleaned.endsWith('/')) cleaned = cleaned.substring(0, cleaned.length - 1);
    _baseUrl = cleaned;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_baseUrlKey, cleaned);
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
    if (_token != null) headers['Authorization'] = 'Bearer $_token';
    return headers;
  }

  // === In-memory cache with stale-while-revalidate ===
  // Returns cached data INSTANTLY (even if stale), then refreshes in background.
  // This eliminates the "loading spinner on every screen" problem.
  static final Map<String, _CacheEntry> _cache = {};
  static const Duration _cacheTtl = Duration(seconds: 60);
  // Callbacks that screens register to get notified when background refresh completes
  static final Map<String, List<void Function(dynamic)>> _refreshCallbacks = {};

  static String _cacheKey(String path, [Map<String, dynamic>? query]) {
    final q = query?.entries.map((e) => '${e.key}=${e.value}').join('&') ?? '';
    return '$path?$q';
  }

  /// Returns cached data if available (even if stale). Returns null if no cache.
  static dynamic getCached(String path, [Map<String, dynamic>? query]) {
    final entry = _cache[_cacheKey(path, query)];
    return entry?.data;
  }

  /// Clears the entire cache. Call after any POST/PATCH/DELETE.
  static void invalidateCache() => _cache.clear();

  /// Register a callback to be called when a background refresh completes.
  /// Returns a remove function. Screens use this to update UI silently.
  static VoidCallback onRefresh(String path, void Function(dynamic) callback) {
    final key = _cacheKey(path);
    _refreshCallbacks.putIfAbsent(key, () => []);
    _refreshCallbacks[key]!.add(callback);
    return () => _refreshCallbacks[key]?.remove(callback);
  }

  /// Throws a clear, user-readable error if the base URL has not been set.
  static void _ensureBaseUrl() {
    if (_baseUrl.isEmpty) {
      throw ApiException(
        'Server URL not configured. Tap the gear icon on the login screen '
        'and enter your ESM server address (e.g. https://your-app.vercel.app).',
      );
    }
  }

  static String _buildUrl(String path, [Map<String, dynamic>? query]) {
    _ensureBaseUrl();
    String url = '$_baseUrl/api/$path';
    if (query != null && query.isNotEmpty) {
      final params = query.entries
          .where((e) => e.value != null && e.value.toString().isNotEmpty)
          .map((e) => '${e.key}=${Uri.encodeComponent(e.value.toString())}')
          .join('&');
      if (params.isNotEmpty) url += '?$params';
    }
    return url;
  }

  static Future<dynamic> get(String path, {Map<String, dynamic>? query, bool useCache = true}) async {
    final key = _cacheKey(path, query);
    if (useCache) {
      final entry = _cache[key];
      if (entry != null) {
        // Stale-while-revalidate: if cache is fresh (< 60s), return instantly.
        if (DateTime.now().difference(entry.time) < _cacheTtl) {
          return entry.data;
        }
        // Cache is stale — return stale data instantly, refresh in background.
        _backgroundRefresh(path, query, key);
        return entry.data;
      }
    }
    // No cache — must fetch from network
    try {
      final response = await http.get(Uri.parse(_buildUrl(path, query)), headers: _headers);
      final data = _handleResponse(response);
      if (useCache) {
        _cache[key] = _CacheEntry(data, DateTime.now());
        _persistDirty = true;
        _persistCache(); // fire-and-forget persist to disk
      }
      return data;
    } catch (e) {
      throw _handleError(e);
    }
  }

  /// Fetches fresh data in the background and notifies registered screens.
  static Future<void> _backgroundRefresh(String path, Map<String, dynamic>? query, String key) async {
    try {
      final response = await http.get(Uri.parse(_buildUrl(path, query)), headers: _headers);
      final data = _handleResponse(response);
      _cache[key] = _CacheEntry(data, DateTime.now());
      _persistDirty = true;
      _persistCache(); // persist fresh data to disk
      // Notify all registered screens
      for (final cb in (_refreshCallbacks[key] ?? []).toList()) {
        try { cb(data); } catch (_) {}
      }
    } catch (_) {
      // Silent failure — keep showing stale data
    }
  }

  static Future<dynamic> post(String path, {Map<String, dynamic>? body}) async {
    try {
      final response = await http.post(
        Uri.parse(_buildUrl(path)),
        headers: _headers,
        body: body != null ? jsonEncode(body) : null,
      );
      final data = _handleResponse(response);
      invalidateCache(); // POST changes data — clear cache so next GET is fresh
      return data;
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
      final data = _handleResponse(response);
      invalidateCache(); // PATCH changes data — clear cache
      return data;
    } catch (e) {
      throw _handleError(e);
    }
  }

  static Future<dynamic> delete(String path) async {
    try {
      final response = await http.delete(Uri.parse(_buildUrl(path)), headers: _headers);
      final data = _handleResponse(response);
      invalidateCache(); // DELETE changes data — clear cache
      return data;
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
      throw ApiException('Invalid response from server (${response.statusCode})');
    }
    if (status >= 200 && status < 300) return data;
    throw ApiException(data['error'] ?? data['message'] ?? 'Request failed ($status)');
  }

  static String _handleError(dynamic e) {
    if (e is ApiException) return e.message;
    final s = e.toString();
    if (s.contains('Failed to fetch') ||
        s.contains('SocketException') ||
        s.contains('HandshakeException') ||
        s.contains('Connection refused') ||
        s.contains('Network is unreachable')) {
      return 'Cannot connect to server. Check your internet connection and '
          'that the server URL is correct.';
    }
    return s;
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

class _CacheEntry {
  final dynamic data;
  final DateTime time;
  _CacheEntry(this.data, this.time);
}
