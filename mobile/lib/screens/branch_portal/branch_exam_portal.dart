import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';

/// Branch Exam Portal — branch-manager module (web parity).
///
/// Two sections stacked in a single scroll view:
///   1. "Upcoming Exams" → `GET /api/exam-portal/upcoming` (endpoint is
///      optional on the server; on failure we show an honest empty state).
///   2. "Recent Results" → `GET /api/results` (client-filtered by
///      `rec.branchId == user.branchId`, top 5).
///
/// Each section has its own loading flag so one slow endpoint doesn't
/// block the other. Both can be refreshed via the AppBar refresh button.
class BranchExamPortal extends StatefulWidget {
  final Map<String, dynamic> user;
  const BranchExamPortal({super.key, required this.user});

  @override
  State<BranchExamPortal> createState() => _BranchExamPortalState();
}

class _BranchExamPortalState extends State<BranchExamPortal> {
  List<Map<String, dynamic>> _upcoming = [];
  List<Map<String, dynamic>> _recent = [];
  bool _loadingUpcoming = true;
  bool _loadingRecent = true;
  String? _upcomingError;

  @override
  void initState() {
    super.initState();
    _loadUpcoming();
    _loadRecent();
  }

  Future<void> _loadUpcoming() async {
    if (!mounted) return;
    setState(() { _loadingUpcoming = true; _upcomingError = null; });
    try {
      final list = await ApiClient.getList('exam-portal/upcoming', query: {
        if (widget.user['branchId'] != null)
          'branchId': widget.user['branchId'].toString(),
      });
      if (mounted) {
        setState(() {
          _upcoming = list
              .whereType<Map<String, dynamic>>()
              .toList(growable: false);
          _loadingUpcoming = false;
        });
      }
    } catch (_) {
      // Endpoint may not exist yet — show honest empty state, no error toast.
      if (mounted) {
        setState(() {
          _upcoming = [];
          _loadingUpcoming = false;
        });
      }
    }
  }

  Future<void> _loadRecent() async {
    if (!mounted) return;
    setState(() => _loadingRecent = true);
    try {
      final branchId = widget.user['branchId']?.toString();
      final list = await ApiClient.getList('results');
      final filtered = <Map<String, dynamic>>[];
      for (final r in list) {
        final m = r is Map<String, dynamic> ? r : <String, dynamic>{};
        if (branchId != null && branchId.isNotEmpty) {
          final rb = m['branchId']?.toString();
          if (rb != null && rb != branchId) continue;
        }
        filtered.add(m);
      }
      filtered.sort((a, b) {
        final da = (a['date'] ?? '').toString();
        final db = (b['date'] ?? '').toString();
        return db.compareTo(da);
      });
      if (mounted) {
        setState(() {
          _recent = filtered.take(5).toList(growable: false);
          _loadingRecent = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _recent = [];
          _loadingRecent = false;
        });
      }
    }
  }

  Future<void> _refreshAll() async {
    await Future.wait([_loadUpcoming(), _loadRecent()]);
  }

  String _fmtDate(String? raw) {
    if (raw == null || raw.isEmpty) return '—';
    final d = DateTime.tryParse(raw);
    if (d == null) return raw;
    return DateFormat('EEE, d MMM yyyy').format(d);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Exam Portal'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, size: 20),
            tooltip: 'Refresh',
            onPressed: _refreshAll,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refreshAll,
        color: AppTheme.primary,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            const SectionHeader(
                title: 'Upcoming Exams', icon: Icons.event),
            const SizedBox(height: 10),
            _upcomingSection(),
            const SizedBox(height: 24),
            const SectionHeader(
                title: 'Recent Results', icon: Icons.history_edu),
            const SizedBox(height: 10),
            _recentSection(),
          ],
        ),
      ),
    );
  }

  // ===================== UPCOMING EXAMS =====================

  Widget _upcomingSection() {
    if (_loadingUpcoming) {
      return _sectionSkeleton();
    }
    if (_upcoming.isEmpty) {
      return _emptyCard(
        icon: Icons.event_busy,
        title: 'No upcoming exams',
        description: _upcomingError != null
            ? 'Exam schedule is not available right now. Pull down to retry.'
            : 'When exams are scheduled they will appear here.',
      );
    }
    return Column(
      children: [
        for (int i = 0; i < _upcoming.length; i++) ...[
          _UpcomingExamCard(
            data: _upcoming[i],
            dateLabel: _fmtDate(
                _upcoming[i]['startDate']?.toString() ??
                    _upcoming[i]['date']?.toString()),
          ),
          if (i < _upcoming.length - 1) const SizedBox(height: 10),
        ],
      ],
    );
  }

  // ===================== RECENT RESULTS =====================

  Widget _recentSection() {
    if (_loadingRecent) {
      return _sectionSkeleton();
    }
    if (_recent.isEmpty) {
      return _emptyCard(
        icon: Icons.bar_chart_outlined,
        title: 'No recent results',
        description: 'Exam results posted by your teachers will appear here.',
      );
    }
    return Column(
      children: [
        for (int i = 0; i < _recent.length; i++) ...[
          _RecentResultCard(
            data: _recent[i],
            dateLabel: _fmtDate(_recent[i]['date']?.toString()),
          ),
          if (i < _recent.length - 1) const SizedBox(height: 10),
        ],
      ],
    );
  }

  // ===================== SHARED HELPERS =====================

  Widget _sectionSkeleton() {
    return Column(
      children: List.generate(2, (_) {
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          height: 84,
          decoration: BoxDecoration(
            color: AppTheme.border,
            borderRadius: BorderRadius.circular(16),
          ),
        );
      }),
    );
  }

  Widget _emptyCard({
    required IconData icon,
    required String title,
    required String description,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 22),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: AppTheme.primary.withOpacity(0.06),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, size: 26, color: AppTheme.textMuted),
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 4),
          Text(
            description,
            style: GoogleFonts.inter(
              fontSize: 12,
              color: AppTheme.textMuted,
              height: 1.4,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

// =============================== UPCOMING EXAM CARD ===============================

class _UpcomingExamCard extends StatelessWidget {
  final Map<String, dynamic> data;
  final String dateLabel;
  const _UpcomingExamCard({required this.data, required this.dateLabel});

  @override
  Widget build(BuildContext context) {
    final title = (data['title'] ?? data['exam'] ?? data['name'] ?? 'Exam')
        .toString();
    final subject = (data['subject'] ?? data['courseName'] ?? '').toString();
    final location = (data['location'] ?? '').toString();
    final type = (data['type'] ?? 'Exam').toString();

    return Container(
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
        boxShadow: AppTheme.shadowSm,
      ),
      padding: const EdgeInsets.all(14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppTheme.primary,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.assignment,
                size: 22, color: Colors.white),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        title,
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.textPrimary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (type.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 7, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppTheme.gold.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          type,
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.goldDark,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.event, size: 13,
                        color: AppTheme.textMuted),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        dateLabel,
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: AppTheme.textSecondary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                if (subject.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      const Icon(Icons.menu_book, size: 13,
                          color: AppTheme.textMuted),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          subject,
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: AppTheme.textSecondary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
                if (location.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined, size: 13,
                          color: AppTheme.textMuted),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          location,
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: AppTheme.textSecondary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// =============================== RECENT RESULT CARD ===============================

class _RecentResultCard extends StatelessWidget {
  final Map<String, dynamic> data;
  final String dateLabel;
  const _RecentResultCard({required this.data, required this.dateLabel});

  @override
  Widget build(BuildContext context) {
    final exam = (data['exam'] ?? 'Exam').toString();
    final totalMarks = num.tryParse('${data['totalMarks'] ?? 100}') ?? 100;

    // Parse records to compute average + count.
    List<dynamic> recs = [];
    final rawRecords = data['records'];
    if (rawRecords is List) {
      recs = rawRecords;
    } else if (rawRecords is String) {
      final s = rawRecords.trim();
      if (s.isNotEmpty) {
        try {
          final decoded = jsonDecode(s);
          if (decoded is List) recs = decoded;
        } catch (_) {
          // malformed JSON — treat as empty
        }
      }
    }

    // Safe parse for the count + average — defensive against any shape.
    int studentCount = 0;
    double sum = 0;
    int counted = 0;
    for (final r in recs) {
      if (r is Map<String, dynamic>) {
        studentCount++;
        final v = num.tryParse('${r['obtained'] ?? r['marks'] ?? 0}');
        if (v != null) {
          sum += v.toDouble();
          counted++;
        }
      }
    }
    final avgObtained = counted > 0 ? sum / counted : 0.0;
    final avgPct = totalMarks > 0 ? (avgObtained / totalMarks) * 100 : 0.0;
    final avgRound = avgPct.round().clamp(0, 100);
    final avgColor = avgPct >= 80
        ? AppTheme.success
        : avgPct >= 60
            ? AppTheme.gold
            : avgPct >= 40
                ? AppTheme.warning
                : AppTheme.danger;

    return Container(
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
        boxShadow: AppTheme.shadowSm,
      ),
      padding: const EdgeInsets.all(14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppTheme.gold.withOpacity(0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.bar_chart,
                size: 22, color: AppTheme.gold),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  exam,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 3),
                Row(
                  children: [
                    const Icon(Icons.event, size: 13,
                        color: AppTheme.textMuted),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        dateLabel,
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: AppTheme.textSecondary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    const Icon(Icons.group, size: 13,
                        color: AppTheme.textMuted),
                    const SizedBox(width: 4),
                    Text(
                      '$studentCount student${studentCount == 1 ? '' : 's'}',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    const SizedBox(width: 10),
                    const Icon(Icons.assessment, size: 13,
                        color: AppTheme.textMuted),
                    const SizedBox(width: 4),
                    Text(
                      'Total $totalMarks',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: avgColor.withOpacity(0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              '$avgRound% avg',
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                color: avgColor,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
