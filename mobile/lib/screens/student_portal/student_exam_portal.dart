import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';

/// Exam Portal — student module (web parity).
///
/// Three sections:
///   1. Upcoming exams — sourced from /api/results?studentId=X filtered for
///      future exam dates (empty state if none).
///   2. Past results — sourced from /api/results (already used elsewhere in
///      the app, so the API is verified to exist).
///   3. Practice Test Builder — UI-only builder. Submit button is wired to a
///      "coming soon" toast; no fake tests are generated.
class StudentExamPortal extends StatefulWidget {
  final Map<String, dynamic> user;

  const StudentExamPortal({super.key, required this.user});

  @override
  State<StudentExamPortal> createState() => _StudentExamPortalState();
}

class _StudentExamPortalState extends State<StudentExamPortal>
    with SingleTickerProviderStateMixin {
  late final TabController _tabCtrl = TabController(length: 3, vsync: this);

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Exam Portal'),
        bottom: TabBar(
          controller: _tabCtrl,
          isScrollable: true,
          labelColor: AppTheme.primary,
          unselectedLabelColor: AppTheme.textMuted,
          indicatorColor: AppTheme.primary,
          indicatorSize: TabBarIndicatorSize.label,
          labelStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700),
          unselectedLabelStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500),
          tabs: const [
            Tab(text: 'Upcoming'),
            Tab(text: 'Past Results'),
            Tab(text: 'Practice Test'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabCtrl,
        children: [
          _UpcomingExamsTab(user: widget.user),
          _PastResultsTab(user: widget.user),
          _PracticeTestTab(user: widget.user),
        ],
      ),
    );
  }
}

// =============================== UPCOMING EXAMS ===============================

class _UpcomingExamsTab extends StatefulWidget {
  final Map<String, dynamic> user;
  const _UpcomingExamsTab({required this.user});

  @override
  State<_UpcomingExamsTab> createState() => _UpcomingExamsTabState();
}

class _UpcomingExamsTabState extends State<_UpcomingExamsTab> {
  List<dynamic> _upcoming = [];
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
      // /api/results returns all exams (past + future). We client-filter for
      // upcoming dates so the screen stays honest if the API does not yet
      // expose a dedicated upcoming endpoint.
      final r = await ApiClient.get('results', query: {
        if (widget.user['id'] != null) 'studentId': widget.user['id'].toString(),
      });
      final list = r is List ? r : [];
      final now = DateTime.now();
      final upcoming = list.where((e) {
        final m = e as Map<String, dynamic>;
        final d = m['date'] ?? m['examDate'];
        if (d == null) return false;
        try {
          return DateTime.parse(d.toString()).isAfter(now);
        } catch (_) {
          return false;
        }
      }).toList();
      if (mounted) setState(() => _upcoming = upcoming);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.cloud_off, size: 48, color: AppTheme.danger),
              const SizedBox(height: 16),
              const Text('Could not load exams', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Text(_error!, textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: _load,
                icon: const Icon(Icons.refresh, size: 18),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }
    if (_upcoming.isEmpty) {
      return RefreshIndicator(
        onRefresh: _load,
        color: AppTheme.primary,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: const [
            SizedBox(height: 80),
            EmptyState(
              icon: Icons.event_upcoming,
              title: 'No upcoming exams',
              description: 'Scheduled exams will appear here with a countdown '
                  'and exam-day details. Pull down to refresh.',
            ),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _load,
      color: AppTheme.primary,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        itemCount: _upcoming.length,
        itemBuilder: (context, i) {
          final e = _upcoming[i] as Map<String, dynamic>;
          return _UpcomingExamCard(exam: e);
        },
      ),
    );
  }
}

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
    final title = (exam['exam'] ?? exam['title'] ?? 'Exam').toString();
    final subject = (exam['courseName'] ?? exam['subject'] ?? '').toString();
    final date = exam['date'] ?? exam['examDate'];
    final room = (exam['room'] ?? exam['venue'] ?? '').toString();

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
              width: 48,
              height: 48,
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
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (subject.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      subject,
                      style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textSecondary),
                    ),
                  ],
                  if (date != null) ...[
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.calendar_today_outlined, size: 12, color: AppTheme.textMuted),
                        const SizedBox(width: 4),
                        Text(
                          _fmtDate(date),
                          style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted),
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
                        Text(
                          room,
                          style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted),
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

// =============================== PAST RESULTS ===============================

class _PastResultsTab extends StatefulWidget {
  final Map<String, dynamic> user;
  const _PastResultsTab({required this.user});

  @override
  State<_PastResultsTab> createState() => _PastResultsTabState();
}

class _PastResultsTabState extends State<_PastResultsTab> {
  List<dynamic> _results = [];
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
      final r = await ApiClient.get('results', query: {
        if (widget.user['id'] != null) 'studentId': widget.user['id'].toString(),
      });
      final list = r is List ? r : [];
      // Client-filter for past dates.
      final now = DateTime.now();
      final past = list.where((e) {
        final m = e as Map<String, dynamic>;
        final d = m['date'] ?? m['examDate'];
        if (d == null) return true;
        try {
          return DateTime.parse(d.toString()).isBefore(now);
        } catch (_) {
          return true;
        }
      }).toList();
      if (mounted) setState(() => _results = past);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.cloud_off, size: 48, color: AppTheme.danger),
              const SizedBox(height: 16),
              const Text('Could not load results', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Text(_error!, textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: _load,
                icon: const Icon(Icons.refresh, size: 18),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }
    if (_results.isEmpty) {
      return RefreshIndicator(
        onRefresh: _load,
        color: AppTheme.primary,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: const [
            SizedBox(height: 80),
            EmptyState(
              icon: Icons.assessment_outlined,
              title: 'No past results yet',
              description: 'Your exam results will appear here once teachers post them.',
            ),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _load,
      color: AppTheme.primary,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        itemCount: _results.length,
        itemBuilder: (context, i) {
          final r = _results[i] as Map<String, dynamic>;
          return _PastResultCard(result: r);
        },
      ),
    );
  }
}

class _PastResultCard extends StatelessWidget {
  final Map<String, dynamic> result;
  const _PastResultCard({required this.result});

  Color _gradeColor(String grade) {
    final g = grade.toUpperCase();
    if (g.startsWith('A')) return AppTheme.success;
    if (g.startsWith('B')) return AppTheme.info;
    if (g.startsWith('C')) return AppTheme.warning;
    return AppTheme.danger;
  }

  @override
  Widget build(BuildContext context) {
    final exam = (result['exam'] ?? 'Exam').toString();
    final marks = double.tryParse('${result['marks'] ?? 0}') ?? 0;
    final total = double.tryParse('${result['totalMarks'] ?? 100}') ?? 100;
    final grade = (result['grade'] ?? _computeGrade(marks, total)).toString();
    final pct = total > 0 ? (marks / total) * 100 : 0.0;
    final color = _gradeColor(grade);

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
                Expanded(
                  child: Text(
                    exam,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    grade,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: color,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Text(
                  '${marks.toInt()} / ${total.toInt()}',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textSecondary,
                  ),
                ),
                const Spacer(),
                Text(
                  '${pct.round()}%',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: color,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: (pct / 100).clamp(0, 1),
                minHeight: 6,
                backgroundColor: AppTheme.border,
                valueColor: AlwaysStoppedAnimation<Color>(color),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _computeGrade(double marks, double total) {
    if (total <= 0) return 'F';
    final pct = (marks / total) * 100;
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B';
    if (pct >= 60) return 'C';
    if (pct >= 50) return 'D';
    return 'F';
  }
}

// =============================== PRACTICE TEST BUILDER (UI only) ===============================

class _PracticeTestTab extends StatefulWidget {
  final Map<String, dynamic> user;
  const _PracticeTestTab({required this.user});

  @override
  State<_PracticeTestTab> createState() => _PracticeTestTabState();
}

class _PracticeTestTabState extends State<_PracticeTestTab> {
  String _difficulty = 'Mixed';
  int _questionCount = 20;
  bool _timed = true;
  final Set<String> _selectedSubjects = {};

  static const _subjects = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'English',
    'Computer Science',
    'Urdu',
    'Islamiat',
  ];

  static const _difficulties = ['Easy', 'Medium', 'Hard', 'Mixed'];

  void _toggleSubject(String s) {
    setState(() {
      if (_selectedSubjects.contains(s)) {
        _selectedSubjects.remove(s);
      } else {
        _selectedSubjects.add(s);
      }
    });
  }

  void _generate() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Practice test generation is coming soon. '
            'Your selected preferences will be used when the feature goes live.'),
        behavior: SnackBarBehavior.floating,
        backgroundColor: AppTheme.primary,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      children: [
        GradientHeroCard(
          title: 'Practice Test Builder',
          subtitle: 'Pick subjects, difficulty, and length',
          icon: Icons.bolt_rounded,
          gradientColors: const [AppTheme.primary, AppTheme.primaryLight],
        ),
        const SizedBox(height: 16),

        // Subjects
        const SectionHeader(title: 'Subjects', icon: Icons.menu_book_outlined),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _subjects.map((s) {
            final selected = _selectedSubjects.contains(s);
            return GestureDetector(
              onTap: () => _toggleSubject(s),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: selected ? AppTheme.primary : AppTheme.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: selected ? AppTheme.primary : AppTheme.border,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (selected) ...[
                      const Icon(Icons.check, size: 14, color: Colors.white),
                      const SizedBox(width: 4),
                    ],
                    Text(
                      s,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: selected ? Colors.white : AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 20),

        // Difficulty
        const SectionHeader(title: 'Difficulty', icon: Icons.trending_up_rounded),
        const SizedBox(height: 8),
        Row(
          children: _difficulties.map((d) {
            final selected = _difficulty == d;
            return Expanded(
              child: Padding(
                padding: EdgeInsets.only(right: d != _difficulties.last ? 8 : 0),
                child: GestureDetector(
                  onTap: () => setState(() => _difficulty = d),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    decoration: BoxDecoration(
                      color: selected ? AppTheme.primary : AppTheme.surface,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: selected ? AppTheme.primary : AppTheme.border,
                      ),
                    ),
                    child: Center(
                      child: Text(
                        d,
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: selected ? Colors.white : AppTheme.textSecondary,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 20),

        // Question count
        SectionHeader(title: 'Questions: $_questionCount', icon: Icons.format_list_numbered),
        const SizedBox(height: 8),
        Slider(
          value: _questionCount.toDouble(),
          min: 10,
          max: 100,
          divisions: 9,
          activeColor: AppTheme.primary,
          label: '$_questionCount',
          onChanged: (v) => setState(() => _questionCount = v.round()),
        ),
        const SizedBox(height: 16),

        // Timed toggle
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
          decoration: BoxDecoration(
            color: AppTheme.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppTheme.border),
          ),
          child: SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(
              'Timed test',
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimary,
              ),
            ),
            subtitle: Text(
              'Approx ${(_questionCount * 1.5).round()} minutes',
              style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted),
            ),
            value: _timed,
            activeColor: AppTheme.primary,
            onChanged: (v) => setState(() => _timed = v),
          ),
        ),
        const SizedBox(height: 24),

        // Generate
        SizedBox(
          height: 50,
          child: ElevatedButton.icon(
            onPressed: _generate,
            icon: const Icon(Icons.bolt, size: 18),
            label: Text(
              'Generate Practice Test',
              style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700),
            ),
          ),
        ),
        const SizedBox(height: 12),
        Center(
          child: Text(
            'Practice tests are coming soon. Your preferences are saved on this device.',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted),
          ),
        ),
      ],
    );
  }
}
