import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';

/// Exam Portal — teacher module (mobile parity with student screen).
///
/// The teacher's view of the exam lifecycle. Two clean sections:
///
///   1. Upcoming Exams — exams the teacher needs to prepare. Backend endpoint
///      `GET /api/exam-portal/upcoming` is checked; if the route is not yet
///      implemented on the server, the section shows an honest empty state.
///   2. Posted Results — results this teacher has already entered. Sourced
///      from `GET /api/results` and client-filtered by `teacherId` (the
///      server-side filter only honours `courseId` / `studentId`, so the
///      teacherId filter is enforced here). Each card shows the exam name,
///      date, total marks, number of students graded and the class average.
///
/// No fake data — both sections show real loading → empty/loaded states.
class TeacherExamPortal extends StatefulWidget {
  final Map<String, dynamic> user;

  const TeacherExamPortal({super.key, required this.user});

  @override
  State<TeacherExamPortal> createState() => _TeacherExamPortalState();
}

class _TeacherExamPortalState extends State<TeacherExamPortal> {
  List<dynamic> _upcoming = [];
  List<dynamic> _posted = [];
  bool _isLoadingUpcoming = true;
  bool _isLoadingPosted = true;
  String? _upcomingError;
  String? _postedError;

  @override
  void initState() {
    super.initState();
    _loadUpcoming();
    _loadPosted();
  }

  Future<void> _loadUpcoming() async {
    setState(() { _isLoadingUpcoming = true; _upcomingError = null; });
    try {
      // Endpoint may not exist on the server yet — degrade gracefully.
      final teacherId = widget.user['id']?.toString();
      final list = await ApiClient.getList('exam-portal/upcoming', query: {
        if (teacherId != null && teacherId.isNotEmpty) 'teacherId': teacherId,
      });
      if (mounted) setState(() => _upcoming = list);
    } catch (e) {
      // Silent fail — the route is optional. Show the empty state.
      if (mounted) setState(() { _upcoming = []; _upcomingError = e.toString(); });
    } finally {
      if (mounted) setState(() => _isLoadingUpcoming = false);
    }
  }

  Future<void> _loadPosted() async {
    setState(() { _isLoadingPosted = true; _postedError = null; });
    try {
      // The server GET /api/results ignores `teacherId` server-side (only
      // courseId/studentId are filtered), so we fetch the full branch set and
      // filter client-side by the teacherId field on each record.
      final teacherId = widget.user['id']?.toString();
      final all = await ApiClient.getList('results', query: {
        if (teacherId != null && teacherId.isNotEmpty) 'teacherId': teacherId,
      });
      final mine = teacherId == null
          ? <dynamic>[]
          : all.where((r) {
              final m = r as Map<String, dynamic>;
              return m['teacherId']?.toString() == teacherId;
            }).toList();
      // Newest first — server already orders by date DESC, but client-side
      // filtering may shuffle, so re-sort defensively.
      mine.sort((a, b) {
        final ad = (a as Map<String, dynamic>)['date']?.toString() ?? '';
        final bd = (b as Map<String, dynamic>)['date']?.toString() ?? '';
        return bd.compareTo(ad);
      });
      if (mounted) setState(() => _posted = mine);
    } catch (e) {
      if (mounted) setState(() { _posted = []; _postedError = e.toString(); });
    } finally {
      if (mounted) setState(() => _isLoadingPosted = false);
    }
  }

  Future<void> _reloadAll() async {
    await Future.wait([_loadUpcoming(), _loadPosted()]);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Exam Portal'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh, size: 20),
            onPressed: _reloadAll,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _reloadAll,
        color: AppTheme.primary,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          children: [
            // ===== Upcoming Exams =====
            _SectionHeader(
              title: 'Upcoming Exams',
              icon: Icons.event_upcoming,
              subtitle: 'Exams you need to prepare',
            ),
            const SizedBox(height: 10),
            _buildUpcoming(),
            const SizedBox(height: 24),

            // ===== Posted Results =====
            _SectionHeader(
              title: 'Posted Results',
              icon: Icons.assignment_turned_in,
              subtitle: 'Results you have entered',
            ),
            const SizedBox(height: 10),
            _buildPosted(),
          ],
        ),
      ),
    );
  }

  Widget _buildUpcoming() {
    if (_isLoadingUpcoming) {
      return const _SectionSkeleton();
    }
    if (_upcoming.isEmpty) {
      return _EmptySection(
        icon: Icons.event_available,
        title: 'No upcoming exams',
        description: _upcomingError == null
            ? 'Scheduled exams you need to prepare will appear here with '
              'subject, date and venue details.'
            : 'Exam schedule is not available right now. Pull down to refresh.',
      );
    }
    return Column(
      children: [
        for (final e in _upcoming)
          _UpcomingExamCard(exam: e as Map<String, dynamic>),
      ],
    );
  }

  Widget _buildPosted() {
    if (_isLoadingPosted) {
      return const _SectionSkeleton();
    }
    if (_posted.isEmpty) {
      return _EmptySection(
        icon: Icons.assessment_outlined,
        title: 'No results posted yet',
        description: _postedError == null
            ? 'Results you post from a class\'s Results tab will appear here '
              'with a per-exam breakdown.'
            : 'Could not load posted results right now. Pull down to retry.',
      );
    }
    return Column(
      children: [
        for (final r in _posted)
          _PostedResultCard(result: r as Map<String, dynamic>),
      ],
    );
  }
}

// =============================== SECTION HEADER ===============================

class _SectionHeader extends StatelessWidget {
  final String title;
  final String? subtitle;
  final IconData icon;

  const _SectionHeader({required this.title, required this.icon, this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 32, height: 32,
          decoration: BoxDecoration(
            color: AppTheme.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 16, color: AppTheme.primary),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
              if (subtitle != null)
                Text(subtitle!, style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted)),
            ],
          ),
        ),
      ],
    );
  }
}

// =============================== EMPTY SECTION ===============================

class _EmptySection extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;

  const _EmptySection({required this.icon, required this.title, required this.description});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        children: [
          Container(
            width: 56, height: 56,
            decoration: BoxDecoration(
              color: AppTheme.primary.withOpacity(0.06),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, size: 26, color: AppTheme.textMuted),
          ),
          const SizedBox(height: 14),
          Text(title, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
          const SizedBox(height: 4),
          Text(
            description,
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted, height: 1.4),
          ),
        ],
      ),
    );
  }
}

// =============================== SECTION SKELETON ===============================

class _SectionSkeleton extends StatelessWidget {
  const _SectionSkeleton();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: List.generate(2, (_) {
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          height: 88,
          decoration: BoxDecoration(
            color: AppTheme.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppTheme.border),
          ),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Container(
                  width: 44, height: 44,
                  decoration: BoxDecoration(
                    color: AppTheme.border,
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(width: double.infinity, height: 12, color: AppTheme.border),
                      const SizedBox(height: 8),
                      Container(width: 120, height: 10, color: AppTheme.border),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      }),
    );
  }
}

// =============================== UPCOMING EXAM CARD ===============================

class _UpcomingExamCard extends StatelessWidget {
  final Map<String, dynamic> exam;
  const _UpcomingExamCard({required this.exam});

  String _fmtDate(dynamic d) {
    if (d == null) return '';
    try {
      return DateFormat('EEE, MMM d · h:mm a').format(DateTime.parse(d.toString()));
    } catch (_) {
      return d.toString();
    }
  }

  @override
  Widget build(BuildContext context) {
    final title = (exam['exam'] ?? exam['title'] ?? exam['name'] ?? 'Exam').toString();
    final subject = (exam['courseName'] ?? exam['subject'] ?? '').toString();
    final date = exam['date'] ?? exam['examDate'];
    final room = (exam['room'] ?? exam['venue'] ?? '').toString();
    final className = (exam['className'] ?? exam['class'] ?? '').toString();

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
        child: Row(
          children: [
            Container(
              width: 48, height: 48,
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.event, color: AppTheme.primary, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (subject.isNotEmpty || className.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      [subject, className].where((s) => s.isNotEmpty).join(' · '),
                      style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textSecondary),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  if (date != null) ...[
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.calendar_today_outlined, size: 12, color: AppTheme.textMuted),
                        const SizedBox(width: 4),
                        Flexible(
                          child: Text(
                            _fmtDate(date),
                            style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                  if (room.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        const Icon(Icons.place_outlined, size: 12, color: AppTheme.textMuted),
                        const SizedBox(width: 4),
                        Flexible(
                          child: Text(
                            room,
                            style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted),
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
      ),
    );
  }
}

// =============================== POSTED RESULT CARD ===============================

class _PostedResultCard extends StatelessWidget {
  final Map<String, dynamic> result;
  const _PostedResultCard({required this.result});

  String _fmtDate(dynamic d) {
    if (d == null) return '';
    try {
      return DateFormat('MMM d, yyyy').format(DateTime.parse(d.toString()));
    } catch (_) {
      return d.toString();
    }
  }

  @override
  Widget build(BuildContext context) {
    final exam = (result['exam'] ?? 'Exam').toString();
    final date = result['date'];
    final totalMarks = double.tryParse('${result['totalMarks'] ?? 100}') ?? 100;
    final className = (result['className'] ?? result['class'] ?? '').toString();
    final courseId = (result['courseId'] ?? '').toString();

    // records is parsed by the backend into a List already.
    final records = (result['records'] is List)
        ? result['records'] as List<dynamic>
        : <dynamic>[];

    final graded = records.length;
    double sum = 0;
    int validCount = 0;
    for (final r in records) {
      final m = r is Map<String, dynamic> ? r : <String, dynamic>{};
      final marks = double.tryParse('${m['marks'] ?? 0}');
      if (marks != null) {
        sum += marks;
        validCount++;
      }
    }
    final avg = validCount > 0 ? sum / validCount : 0.0;
    final avgPct = totalMarks > 0 ? (avg / totalMarks) * 100 : 0.0;

    Color perfColor(double pct) {
      if (pct >= 80) return AppTheme.success;
      if (pct >= 60) return AppTheme.warning;
      return AppTheme.danger;
    }
    final color = perfColor(avgPct);

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
            Row(
              children: [
                Container(
                  width: 40, height: 40,
                  decoration: BoxDecoration(
                    color: AppTheme.gold.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.assignment_turned_in, size: 18, color: AppTheme.goldDark),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        exam,
                        style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (date != null)
                        Text(
                          _fmtDate(date),
                          style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted),
                        ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    '${avgPct.round()}%',
                    style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w800, color: color),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                _MetaChip(
                  icon: Icons.group_outlined,
                  label: '$graded graded',
                ),
                const SizedBox(width: 8),
                _MetaChip(
                  icon: Icons.check_circle_outline,
                  label: 'Avg ${avg.toStringAsFixed(1)} / ${totalMarks.toInt()}',
                ),
                if (className.isNotEmpty || courseId.isNotEmpty) ...[
                  const SizedBox(width: 8),
                  Expanded(
                    child: _MetaChip(
                      icon: Icons.menu_book_outlined,
                      label: className.isNotEmpty ? className : courseId,
                    ),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: (avgPct / 100).clamp(0, 1),
                minHeight: 5,
                backgroundColor: AppTheme.border,
                valueColor: AlwaysStoppedAnimation<Color>(color),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MetaChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _MetaChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppTheme.background,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 11, color: AppTheme.textMuted),
          const SizedBox(width: 4),
          Text(
            label,
            style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: AppTheme.textSecondary),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
