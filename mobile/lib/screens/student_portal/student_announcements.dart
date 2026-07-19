import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:share_plus/share_plus.dart';
import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';

/// Student → Notices & Announcements screen (improved UX).
///
/// Pulls from `announcements` (scoped to institute+branch when possible),
/// renders premium cards with priority dot + category chip + date,
/// opens a bottom-sheet detail view with full body + share button on tap.
class StudentAnnouncements extends StatefulWidget {
  final Map<String, dynamic> user;
  const StudentAnnouncements({super.key, required this.user});

  @override
  State<StudentAnnouncements> createState() => _StudentAnnouncementsState();
}

class _StudentAnnouncementsState extends State<StudentAnnouncements> {
  List<dynamic> _announcements = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final instituteId = widget.user['instituteId']?.toString();
      final branchId = widget.user['branchId']?.toString();
      List<dynamic> list;
      try {
        list = await ApiClient.getList('announcements', query: {
          if (instituteId != null && instituteId.isNotEmpty) 'instituteId': instituteId,
          if (branchId != null && branchId.isNotEmpty) 'branchId': branchId,
        });
      } catch (_) {
        list = await ApiClient.getList('announcements');
      }
      // Sort by date desc (newest first); fall back to createdAt.
      list.sort((a, b) {
        final aD = (a['date'] ?? a['createdAt'] ?? a['timestamp'] ?? '').toString();
        final bD = (b['date'] ?? b['createdAt'] ?? b['timestamp'] ?? '').toString();
        return bD.compareTo(aD);
      });
      if (mounted) setState(() { _announcements = list; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  String _priority(dynamic a) => (a is Map ? a['priority'] ?? a['urgency'] ?? 'medium' : 'medium').toString().toLowerCase();

  Color _priorityColor(String priority) {
    switch (priority) {
      case 'high':
      case 'urgent':
        return AppTheme.danger;
      case 'low':
      case 'info':
        return AppTheme.success;
      case 'medium':
      case 'normal':
      default:
        return AppTheme.warning;
    }
  }

  String _category(dynamic a) {
    if (a is! Map) return 'General';
    final raw = (a['category'] ?? a['type'] ?? 'general').toString();
    final lower = raw.toLowerCase();
    if (lower.contains('acad')) return 'Academic';
    if (lower.contains('event')) return 'Event';
    if (lower.contains('fee') || lower.contains('finance')) return 'Fee';
    if (lower.contains('holiday')) return 'Holiday';
    if (lower.contains('general')) return 'General';
    // Title-case unknown categories.
    return raw[0].toUpperCase() + raw.substring(1);
  }

  Color _categoryColor(String category) {
    switch (category) {
      case 'Academic': return AppTheme.primary;
      case 'Event': return AppTheme.info;
      case 'Fee': return AppTheme.gold;
      case 'Holiday': return AppTheme.success;
      default: return AppTheme.textMuted;
    }
  }

  String _fmtDate(dynamic d) {
    if (d == null) return '';
    try {
      final dt = DateTime.parse(d.toString());
      return DateFormat('MMM dd, yyyy').format(dt);
    } catch (_) {
      return d.toString();
    }
  }

  void _openDetail(Map<String, dynamic> a) {
    final title = (a['title'] ?? 'Announcement').toString();
    final body = (a['body'] ?? a['message'] ?? a['content'] ?? '').toString();
    final postedBy = (a['postedBy'] ?? a['author'] ?? a['senderName'] ?? 'School').toString();
    final dateStr = _fmtDate(a['date'] ?? a['createdAt']);
    final priority = _priority(a);
    final category = _category(a);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: AppTheme.surface,
          borderRadius: BorderRadius.only(topLeft: Radius.circular(20), topRight: Radius.circular(20)),
        ),
        padding: EdgeInsets.only(
          left: 20, right: 20, top: 16,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(width: 40, height: 4, margin: const EdgeInsets.only(bottom: 14),
                decoration: BoxDecoration(color: AppTheme.border, borderRadius: BorderRadius.circular(2))),
            ),
            Row(
              children: [
                Container(width: 8, height: 8, decoration: BoxDecoration(color: _priorityColor(priority), shape: BoxShape.circle)),
                const SizedBox(width: 8),
                _categoryChip(category),
                const Spacer(),
                Text(dateStr, style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted)),
              ],
            ),
            const SizedBox(height: 12),
            Text(title, style: GoogleFonts.inter(fontSize: 17, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
            const SizedBox(height: 6),
            Text('Posted by $postedBy', style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textSecondary)),
            const SizedBox(height: 14),
            Flexible(
              child: SingleChildScrollView(
                child: Text(body.isEmpty ? 'No additional details.' : body,
                  style: GoogleFonts.inter(fontSize: 14, color: AppTheme.textPrimary, height: 1.5)),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      Navigator.pop(ctx);
                      Share.share(ShareParams(
                        text: '$title\n\n$body\n\n— $postedBy · $dateStr',
                        subject: title,
                      ));
                    },
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.primary,
                      side: const BorderSide(color: AppTheme.border),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    icon: const Icon(Icons.share_outlined, size: 16),
                    label: Text('Share', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700)),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(ctx),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: Text('Close', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _categoryChip(String category) {
    final color = _categoryColor(category);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(category, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: color)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notices & Announcements'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh, size: 20), tooltip: 'Refresh', onPressed: _load),
        ],
      ),
      body: _isLoading
          ? _buildSkeleton()
          : _error != null
              ? _ErrorView(error: _error!, onRetry: _load)
              : _announcements.isEmpty
                  ? const EmptyState(
                      icon: Icons.campaign_outlined,
                      title: 'No announcements yet',
                      description: 'Check back soon — school notices will appear here.',
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.builder(
                        padding: const EdgeInsets.only(top: 8, bottom: 24),
                        itemCount: _announcements.length,
                        itemBuilder: (context, i) => _announcementCard(_announcements[i] as Map<String, dynamic>),
                      ),
                    ),
    );
  }

  Widget _buildSkeleton() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: List.generate(4, (_) => const Padding(
        padding: EdgeInsets.only(bottom: 10),
        child: SkeletonBox(width: double.infinity, height: 110),
      )),
    );
  }

  Widget _announcementCard(Map<String, dynamic> a) {
    final title = (a['title'] ?? 'Announcement').toString();
    final body = (a['body'] ?? a['message'] ?? a['content'] ?? '').toString();
    final dateStr = _fmtDate(a['date'] ?? a['createdAt']);
    final priority = _priority(a);
    final category = _category(a);

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: InkWell(
        onTap: () => _openDetail(a),
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 8, height: 8,
                    decoration: BoxDecoration(color: _priorityColor(priority), shape: BoxShape.circle),
                  ),
                  const SizedBox(width: 8),
                  _categoryChip(category),
                  const Spacer(),
                  Text(dateStr, style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted)),
                ],
              ),
              const SizedBox(height: 10),
              Text(title, maxLines: 2, overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
              if (body.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(body, maxLines: 3, overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textSecondary, height: 1.4)),
              ],
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.arrow_forward_ios, size: 10, color: AppTheme.primary),
                  const SizedBox(width: 4),
                  Text('Read more', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.primary)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// =============================== SHARED ERROR VIEW ===============================

class _ErrorView extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;
  const _ErrorView({required this.error, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.cloud_off, size: 48, color: AppTheme.danger),
            const SizedBox(height: 16),
            Text('Something went wrong', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
            const SizedBox(height: 4),
            Text(error, textAlign: TextAlign.center, style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted)),
            const SizedBox(height: 16),
            ElevatedButton.icon(onPressed: onRetry, icon: const Icon(Icons.refresh, size: 18), label: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}
