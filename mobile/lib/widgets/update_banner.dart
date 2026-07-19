import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import '../theme/app_theme.dart';

/// Checks GitHub Releases API for the latest version and shows an update banner
/// if a newer version is available.
class UpdateChecker {
  static const String _repo = 'faisukhan01/esm';
  static const String _downloadPage = 'https://esm-rose.vercel.app/download';
  static const String _directApkUrl = 'https://github.com/faisukhan01/esm/releases/latest/download/app-release.apk';

  /// The current app version (must match pubspec.yaml).
  static const String currentVersion = '1.5.0';

  /// Checks if a newer version is available on GitHub Releases.
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

      if (_isNewer(tagName, currentVersion)) {
        return tagName;
      }
      return null;
    } catch (_) {
      return null;
    }
  }

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

  /// Opens the download page in the system browser.
  ///
  /// NOTE: We intentionally do NOT call `canLaunchUrl()` first.
  /// On Android 11+ (API 30+) `canLaunchUrl()` returns `false` for any URL
  /// scheme not declared in a `<queries>` element of AndroidManifest.xml,
  /// which would cause the launch to be skipped entirely. The official
  /// `url_launcher` docs recommend calling `launchUrl` directly and relying
  /// on its boolean return value. The `<queries>` block added to
  /// AndroidManifest.xml ensures browser apps are resolvable.
  static Future<bool> openDownloadPage() async {
    final uri = Uri.parse(_downloadPage);

    // Method 1: External browser (preferred — lets user choose browser,
    // supports download manager, doesn't trap them in a Custom Tab).
    try {
      final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (launched) return true;
    } catch (_) {}

    // Method 2: Platform default mode.
    try {
      final launched = await launchUrl(uri);
      if (launched) return true;
    } catch (_) {}

    // Method 3: In-app browser view (Chrome Custom Tab) as last resort.
    try {
      final launched = await launchUrl(uri, mode: LaunchMode.inAppBrowserView);
      if (launched) return true;
    } catch (_) {}

    return false;
  }

  /// Opens the direct APK download URL (used as a fallback inside the dialog).
  static Future<bool> openDirectDownload() async {
    final uri = Uri.parse(_directApkUrl);
    try {
      final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (launched) return true;
    } catch (_) {}
    try {
      final launched = await launchUrl(uri);
      if (launched) return true;
    } catch (_) {}
    return false;
  }
}

/// A banner widget that shows "Update available" when a newer version exists.
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

  void _onUpdateTap() async {
    // Show a brief loading snackbar so the user gets immediate feedback.
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
            ),
            const SizedBox(width: 12),
            Text('Opening download page...', style: GoogleFonts.inter(fontSize: 12)),
          ],
        ),
        duration: const Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
        backgroundColor: AppTheme.primary,
      ),
    );

    // Try to open the download page in the system browser.
    final opened = await UpdateChecker.openDownloadPage();

    // If the browser didn't open, show a fallback dialog with copyable link
    // and a direct APK download button.
    if (!opened && mounted) {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Row(
            children: [
              Icon(Icons.system_update, color: AppTheme.primary, size: 22),
              const SizedBox(width: 8),
              const Text('Update Available'),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('A new version (v$_newVersion) is available.', style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textSecondary)),
              const SizedBox(height: 12),
              Text('We couldn\'t auto-open your browser. Tap the button below, or copy this link:', style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted)),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppTheme.background,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: SelectableText(
                  UpdateChecker._downloadPage,
                  style: GoogleFonts.inter(fontSize: 11, color: AppTheme.primary, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Later')),
            ElevatedButton.icon(
              onPressed: () {
                Navigator.pop(ctx);
                // Try opening the download page again.
                UpdateChecker.openDownloadPage();
              },
              icon: const Icon(Icons.open_in_new, size: 16),
              label: const Text('Open Download Page'),
            ),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
                foregroundColor: Colors.white,
              ),
              onPressed: () {
                Navigator.pop(ctx);
                // Try direct APK download as last resort.
                UpdateChecker.openDirectDownload();
              },
              icon: const Icon(Icons.download, size: 16),
              label: const Text('Direct APK'),
            ),
          ],
        ),
      );
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
            onTap: _onUpdateTap,
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
