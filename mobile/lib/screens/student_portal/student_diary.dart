import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:share_plus/share_plus.dart';

import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';

/// Student → Diary & Homework screen.
///
/// Pulls diary entries posted by teachers for the student's branch from
/// `GET /api/diary?branchId={branchId}` and renders them as premium cards
/// (subject badge + due date + title + description snippet). Tapping a card
/// opens a bottom-sheet with the full description + a share action. Overdue
/// homework is highlighted in red so the student can prioritise it.
///
/// Visual style mirrors [StudentAnnouncements].
class StudentDiary extends StatefulWidget {
  final Map<String, dynamic> user;

  const StudentDiary({super.key, required this.user});

  @override
  State<StudentDiary> createState() => _StudentDiaryState();
}

class _StudentDiaryState extends State<StudentDiary> {
  List<dynamic> _entries = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final branchId = widget.user['branchId']?.toString();
      final list = await ApiClient.getList(
        'diary',
        query: {
          if (branchId != null && branchId.isNotEmpty) 'branchId': branchId,
        },
      );

      // Sort by createdAt desc (newest first). Fall back to `due` if absent.
      list.sort((a, b) {
        final aD = (a is Map ? (a['createdAt'] ?? a['due'] ?? '') : '')
            .toString();
        final bD = (b is Map ? (b['createdAt'] ?? b['due'] ?? '') : '')
            .toString();
        return bD.compareTo(aD);
      });

      if (!mounted) return;
      setState(() {
        _entries = list;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  String _fmtDate(dynamic d) {
    if (d == null) return '';
    try {
      final dt = DateTime.parse(d.toString());
      return DateFormat('MMM d, yyyy').format(dt);
    } catch (_) {
      return d.toString();
    }
  }

  /// Returns true if [due] is a valid date in the past (i.e. overdue).
  bool _isOverdue(dynamic due) {
    if (due == null) return false;
    try {
      final dt = DateTime.parse(due.toString());
      // Compare date-only — anything due "today" or earlier counts as overdue
      // only if today's date is strictly after the due date.
      final today = DateTime.now();
      return dt.isBefore(DateTime(today.year, today.month, today.day));
    } catch (_) {
      return false;
    }
  }

  Color _subjectColor(String subject) {
    // Stable color from a small palette based on the subject name hash.
    // Avoids blue/indigo — palette is navy/gold/teal/orange/rose.
    const palette = <Color>[
      AppTheme.primary,
      AppTheme.gold,
      AppTheme.success,
      AppTheme.warning,
      AppTheme.danger,
      AppTheme.info,
    ];
    var hash = 0;
    for (final c in subject.codeUnits) {
      hash = (hash * 31 + c) & 0x7fffffff;
    }
    return palette[hash % palette.length];
  }

  void _openDetail(Map<String, dynamic> e) {
    final subject = (e['subject'] ?? 'General').toString();
    final title = (e['title'] ?? 'Diary Entry').toString();
    final description =
        (e['description'] ?? e['body'] ?? '').toString();
    final dueStr = _fmtDate(e['due']);
    final createdStr = _fmtDate(e['createdAt']);
    final overdue = _isOverdue(e['due']);
    final color = _subjectColor(subject);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: AppTheme.surface,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(20),
            topRight: Radius.circular(20),
          ),
        ),
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 16,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 14),
                decoration: BoxDecoration(
                  color: AppTheme.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Row(
              children: [
                _subjectChip(subject, color),
                const Spacer(),
                if (dueStr.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: (overdue ? AppTheme.danger : AppTheme.gold)
                          .withOpacity(0.12),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      overdue ? 'Overdue · $dueStr' : 'Due $dueStr',
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: overdue ? AppTheme.danger : AppTheme.gold,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: GoogleFonts.inter(
                fontSize: 17,
                fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary,
              ),
            ),
            if (createdStr.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(
                'Posted $createdStr',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: AppTheme.textSecondary,
                ),
              ),
            ],
            const SizedBox(height: 14),
            Flexible(
              child: SingleChildScrollView(
                child: Text(
                  description.isEmpty
                      ? 'No additional details provided.'
                      : description,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    color: AppTheme.textPrimary,
                    height: 1.5,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      Navigator.pop(ctx);
                      Share.share(
                        '$title · $subject\n\n$description\n\nDue: $dueStr',
                        subject: title,
                      );
                    },
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.primary,
                      side: const BorderSide(color: AppTheme.border),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    icon: const Icon(Icons.share_outlined, size: 16),
                    label: Text(
                      'Share',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(ctx),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: Text(
                      'Close',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _subjectChip(String subject, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withOpacity(0.10),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        subject,
        style: GoogleFonts.inter(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          color: color,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        backgroundColor: AppTheme.surface,
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, size: 22),
          onPressed: () => Navigator.of(context).maybePop(),
        ),
        title: Text(
          'Diary & Homework',
          style: GoogleFonts.inter(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppTheme.textPrimary,
          ),
        ),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh_rounded, size: 20),
            onPressed: _load,
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: _isLoading
          ? _buildSkeleton()
          : _error != null
              ? _ErrorView(error: _error!, onRetry: _load)
              : _entries.isEmpty
                  ? RefreshIndicator(
                      onRefresh: _load,
                      color: AppTheme.primary,
                      child: ListView(
                        children: [
                          SizedBox(
                            height: MediaQuery.of(context).size.height * 0.6,
                            child: const EmptyState(
                              icon: Icons.menu_book_outlined,
                              title: 'No diary entries yet',
                              description:
                                  'Homework and class diary entries posted by your teachers will appear here.',
                            ),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      color: AppTheme.primary,
                      child: ListView.builder(
                        padding: const EdgeInsets.only(top: 8, bottom: 24),
                        itemCount: _entries.length,
                        itemBuilder: (context, i) =>
                            _diaryCard(_entries[i] as Map<String, dynamic>),
                      ),
                    ),
    );
  }

  Widget _buildSkeleton() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: List.generate(
        4,
        (_) => const Padding(
          padding: EdgeInsets.only(bottom: 10),
          child: SkeletonBox(width: double.infinity, height: 110),
        ),
      ),
    );
  }

  Widget _diaryCard(Map<String, dynamic> e) {
    final subject = (e['subject'] ?? 'General').toString();
    final title = (e['title'] ?? 'Diary Entry').toString();
    final description =
        (e['description'] ?? e['body'] ?? '').toString();
    final dueStr = _fmtDate(e['due']);
    final overdue = _isOverdue(e['due']);
    final color = _subjectColor(subject);

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: InkWell(
        onTap: () => _openDetail(e),
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  _subjectChip(subject, color),
                  const Spacer(),
                  if (dueStr.isNotEmpty)
                    Row(
                      children: [
                        Icon(
                          Icons.event_rounded,
                          size: 12,
                          color: overdue ? AppTheme.danger : AppTheme.gold,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          dueStr,
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color:
                                overdue ? AppTheme.danger : AppTheme.textMuted,
                          ),
                        ),
                      ],
                    ),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textPrimary,
                ),
              ),
              if (description.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  description,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: AppTheme.textSecondary,
                    height: 1.4,
                  ),
                ),
              ],
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(
                    Icons.arrow_forward_ios,
                    size: 10,
                    color: AppTheme.primary,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    overdue ? 'View details — overdue' : 'View details',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: overdue ? AppTheme.danger : AppTheme.primary,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// =============================================================================
//  Error view (matches the style used by other student screens)
// =============================================================================

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
            Text(
              'Something went wrong',
              style: GoogleFonts.inter(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              error,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: 12,
                color: AppTheme.textMuted,
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh, size: 18),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}
