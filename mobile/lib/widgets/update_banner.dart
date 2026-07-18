import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import '../theme/app_theme.dart';

/// Checks GitHub Releases API for the latest version and shows an update banner
/// if a newer version is available. When tapped, opens the browser to the
/// download page so the user can get the new APK.
class UpdateChecker {
  static const String _repo = 'faisukhan01/esm';
  static const String _downloadPage = 'https://esm-rose.vercel.app/download';

  /// The current app version (must match pubspec.yaml).
  /// Bump this when you release a new version.
  static const String currentVersion = '1.2.0';

  /// Checks if a newer version is available on GitHub Releases.
  /// Returns the latest version tag (e.g. "v1.2.0") if newer, or null if up-to-date.
  static Future<String?> checkForUpdate() async {
    try {
      final response = await http.get(
        Uri.parse('https://api.github.com/repos/$_repo/releases/latest'),
        headers: {'Accept': 'application/vnd.github+json'},
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode != 200) return null;

      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final tagName = (data['tag_name'] as String?)?.replaceAll('v', '');
      if (tagName == null) return null;

      // Compare versions
      if (_isNewer(tagName, currentVersion)) {
        return tagName;
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  /// Returns true if [remote] is a newer version than [current].
  static bool _isNewer(String remote, String current) {
    final r = remote.split('.').map((e) => int.tryParse(e) ?? 0).toList();
    final c = current.split('.').map((e) => int.tryParse(e) ?? 0).toList();
    for (var i = 0; i < 3; i++) {
      final rv = i < r.length ? r[i] : 0;
      final cv = i < c.length ? c[i] : 0;
      if (rv > cv) return true;
      if (rv < cv) return false;
    }
    return false;
  }

  /// Opens the download page in the browser.
  static Future<void> openDownloadPage() async {
    final uri = Uri.parse(_downloadPage);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}

/// A banner widget that shows "Update available" when a newer version exists.
/// Place this at the top of any screen (e.g. dashboards).
class UpdateBanner extends StatefulWidget {
  const UpdateBanner({super.key});

  @override
  State<UpdateBanner> createState() => _UpdateBannerState();
}

class _UpdateBannerState extends State<UpdateBanner> {
  String? _newVersion;
  bool _checked = false;
  bool _dismissed = false;

  @override
  void initState() {
    super.initState();
    _check();
  }

  Future<void> _check() async {
    final v = await UpdateChecker.checkForUpdate();
    if (mounted) {
      setState(() {
        _newVersion = v;
        _checked = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_checked || _newVersion == null || _dismissed) {
      return const SizedBox.shrink();
    }
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: AppTheme.primary,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          const Icon(Icons.system_update, color: Colors.white, size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Update available — v$_newVersion', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.white)),
                const SizedBox(height: 1),
                Text('Tap to download the latest version', style: GoogleFonts.inter(fontSize: 10, color: Colors.white.withOpacity(0.7))),
              ],
            ),
          ),
          GestureDetector(
            onTap: () => UpdateChecker.openDownloadPage(),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text('Update', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.primary)),
            ),
          ),
          const SizedBox(width: 6),
          GestureDetector(
            onTap: () => setState(() => _dismissed = true),
            child: const Icon(Icons.close, color: Colors.white70, size: 16),
          ),
        ],
      ),
    );
  }
}
