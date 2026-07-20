import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';

/// Student → Report Card screen.
///
/// Fetches the student's published report cards from
/// `GET /api/report-cards?studentId={userId}` and renders them as premium
/// cards. Each card surfaces the term, exam name, marks split, percentage,
/// color-coded grade, and any teacher remarks.
///
/// Visual style mirrors [StudentResults] — a navy hero banner showing the
/// cumulative average, followed by a list of per-exam report card cards.
class StudentReportCard extends StatefulWidget {
  final Map<String, dynamic> user;

  const StudentReportCard({super.key, required this.user});

  @override
  State<StudentReportCard> createState() => _StudentReportCardState();
}

class _StudentReportCardState extends State<StudentReportCard> {
  List<dynamic> _cards = [];
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
      final studentId = widget.user['id']?.toString();
      final list = await ApiClient.getList(
        'report-cards',
        query: {
          if (studentId != null && studentId.isNotEmpty) 'studentId': studentId,
        },
      );
      // Newest first — `generatedAt` is the most reliable timestamp.
      list.sort((a, b) {
        final aD = (a is Map ? (a['generatedAt'] ?? a['createdAt'] ?? '') : '')
            .toString();
        final bD = (b is Map ? (b['generatedAt'] ?? b['createdAt'] ?? '') : '')
            .toString();
        return bD.compareTo(aD);
      });
      if (!mounted) return;
      setState(() {
        _cards = list;
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

  /// Grade → semantic color (matches [StudentResults._gradeColor] + the
  /// dashboard's `_ResultsBarChart._colorForGrade`).
  Color _gradeColor(String grade) {
    final g = grade.toUpperCase();
    if (g.startsWith('A')) return AppTheme.success;
    if (g.startsWith('B')) return AppTheme.info;
    if (g.startsWith('C')) return AppTheme.warning;
    return AppTheme.danger; // D, F, or unknown
  }

  double _toNum(dynamic v) {
    if (v == null) return 0;
    return double.tryParse(v.toString()) ?? 0;
  }

  @override
  Widget build(BuildContext context) {
    // Compute the cumulative average percentage across all report cards.
    double avgPct = 0;
    if (_cards.isNotEmpty) {
      double sum = 0;
      int count = 0;
      for (final e in _cards) {
        if (e is! Map) continue;
        final pct = _toNum(e['percentage']);
        if (pct > 0) {
          sum += pct;
          count++;
        } else {
          final obtained = _toNum(e['obtainedMarks']);
          final total = _toNum(e['totalMarks']);
          if (total > 0) {
            sum += (obtained / total) * 100;
            count++;
          }
        }
      }
      if (count > 0) avgPct = sum / count;
    }

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
          'Report Card',
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
              : _cards.isEmpty
                  ? RefreshIndicator(
                      onRefresh: _load,
                      color: AppTheme.primary,
                      child: ListView(
                        children: [
                          SizedBox(
                            height: MediaQuery.of(context).size.height * 0.6,
                            child: const EmptyState(
                              icon: Icons.assignment_outlined,
                              title: 'No report cards published yet',
                              description:
                                  'Your term-wise report cards will appear here once your school publishes them.',
                            ),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      color: AppTheme.primary,
                      child: ListView(
                        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                        children: [
                          // ── Hero: cumulative average ─────────────────────────
                          Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [AppTheme.primary, AppTheme.primaryLight],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Cumulative Average',
                                        style: GoogleFonts.inter(
                                          fontSize: 12,
                                          color: Colors.white70,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        '${avgPct.toStringAsFixed(1)}%',
                                        style: GoogleFonts.inter(
                                          fontSize: 32,
                                          fontWeight: FontWeight.w800,
                                          color: Colors.white,
                                          letterSpacing: -0.5,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        'Across ${_cards.length} report card${_cards.length == 1 ? '' : 's'}',
                                        style: GoogleFonts.inter(
                                          fontSize: 11,
                                          color: Colors.white70,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const Icon(
                                  Icons.emoji_events_rounded,
                                  size: 48,
                                  color: Colors.white70,
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 20),
                          const SectionHeader(
                            title: 'Report Cards',
                            icon: Icons.assignment_rounded,
                          ),
                          const SizedBox(height: 8),
                          ..._cards.map((e) => _ReportCardTile(
                                card: e as Map<String, dynamic>,
                                gradeColor:
                                    _gradeColor((e['grade'] ?? 'F').toString()),
                                fmtDate: _fmtDate,
                                toNum: _toNum,
                              )),
                        ],
                      ),
                    ),
    );
  }

  Widget _buildSkeleton() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      children: [
        SkeletonBox(width: double.infinity, height: 110, radius: 16),
        const SizedBox(height: 16),
        SkeletonBox(width: 120, height: 14, radius: 4),
        const SizedBox(height: 8),
        for (int i = 0; i < 3; i++) ...[
          SkeletonBox(width: double.infinity, height: 132, radius: 14),
          const SizedBox(height: 10),
        ],
      ],
    );
  }
}

// =============================================================================
//  Report card tile
// =============================================================================

class _ReportCardTile extends StatelessWidget {
  final Map<String, dynamic> card;
  final Color gradeColor;
  final String Function(dynamic) fmtDate;
  final double Function(dynamic) toNum;

  const _ReportCardTile({
    required this.card,
    required this.gradeColor,
    required this.fmtDate,
    required this.toNum,
  });

  @override
  Widget build(BuildContext context) {
    final term = (card['term'] ?? 'Term').toString();
    final examName = (card['examName'] ?? 'Exam').toString();
    final obtained = toNum(card['obtainedMarks']);
    final total = toNum(card['totalMarks']);
    final percentage = toNum(card['percentage']);
    // If percentage is missing on the row, derive it from obtained/total.
    final pct = percentage > 0
        ? percentage
        : (total > 0 ? (obtained / total) * 100 : 0.0);
    final grade = (card['grade'] ?? '—').toString();
    final remarks = (card['remarks'] ?? '').toString().trim();
    final generatedAt = fmtDate(card['generatedAt'] ?? card['createdAt']);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.border),
        boxShadow: AppTheme.shadowSm,
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header: term + exam name + grade badge.
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Term chip.
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.primary.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          term,
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.primary,
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        examName,
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.textPrimary,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                // Grade badge — circular, color-coded.
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: gradeColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: gradeColor.withOpacity(0.30),
                      width: 1,
                    ),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    grade,
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: gradeColor,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            // Marks split + percentage.
            Row(
              children: [
                Text(
                  '${obtained.toStringAsFixed(obtained == obtained.roundToDouble() ? 0 : 1)} / ${total.toStringAsFixed(total == total.roundToDouble() ? 0 : 1)}',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textSecondary,
                  ),
                ),
                const Spacer(),
                Text(
                  '${pct.toStringAsFixed(1)}%',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: gradeColor,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            // Progress bar.
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: (pct / 100).clamp(0, 1),
                minHeight: 6,
                backgroundColor: AppTheme.border,
                valueColor: AlwaysStoppedAnimation<Color>(gradeColor),
              ),
            ),
            // Remarks (if any).
            if (remarks.isNotEmpty) ...[
              const SizedBox(height: 10),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppTheme.accent,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(
                      Icons.format_quote_rounded,
                      size: 14,
                      color: AppTheme.textMuted,
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        remarks,
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: AppTheme.textSecondary,
                          height: 1.4,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
            // Footer: generated date.
            if (generatedAt.isNotEmpty) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(
                    Icons.event_available_rounded,
                    size: 11,
                    color: AppTheme.textMuted,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    'Published $generatedAt',
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      color: AppTheme.textMuted,
                    ),
                  ),
                ],
              ),
            ],
          ],
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
