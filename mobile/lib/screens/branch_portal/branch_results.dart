import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';

/// Branch Results — branch-manager module (web parity).
///
/// Backend: `GET /api/results` returns the most recent 50 result entries
/// across the whole institute. The handler does NOT honour a `branchId`
/// query param (only `courseId` / `studentId`), so we fetch all and
/// client-filter by `rec['branchId'] == user.branchId`.
///
/// Each entry has: `id, branchId, exam, courseId, classId, teacherId,
/// totalMarks, date, records` (records is a JSON string array of
/// `{studentId, studentName, obtained, grade}`).
class BranchResults extends StatefulWidget {
  final Map<String, dynamic> user;
  const BranchResults({super.key, required this.user});

  @override
  State<BranchResults> createState() => _BranchResultsState();
}

class _BranchResultsState extends State<BranchResults> {
  List<Map<String, dynamic>> _results = [];
  Map<String, String> _classNames = {}; // classId -> "Grade 10 · A"
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() { _isLoading = true; _error = null; });
    try {
      final branchId = widget.user['branchId']?.toString();
      final results = await Future.wait([
        ApiClient.getList('results'),
        ApiClient.getList('branch/classes', query: {
          if (branchId != null && branchId.isNotEmpty) 'branchId': branchId,
        }),
      ]);
      final rawResults = results[0];
      final classes = results[1];

      final nameMap = <String, String>{};
      for (final c in classes) {
        final m = c is Map<String, dynamic> ? c : <String, dynamic>{};
        final id = m['id']?.toString();
        if (id == null || id.isEmpty) continue;
        final name = (m['name'] ?? m['className'] ?? '').toString().trim();
        final section = (m['section'] ?? 'A').toString().trim();
        nameMap[id] = name.isEmpty ? 'Class $id' : '$name · $section';
      }

      final filtered = <Map<String, dynamic>>[];
      for (final r in rawResults) {
        final m = r is Map<String, dynamic> ? r : <String, dynamic>{};
        if (branchId != null && branchId.isNotEmpty) {
          final recBranch = m['branchId']?.toString();
          if (recBranch != null && recBranch != branchId) continue;
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
          _results = filtered;
          _classNames = nameMap;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  List<Map<String, dynamic>> _parseRecords(dynamic records) {
    if (records == null) return const [];
    if (records is List) {
      return records
          .whereType<Map<String, dynamic>>()
          .toList(growable: false);
    }
    if (records is String) {
      final s = records.trim();
      if (s.isEmpty) return const [];
      try {
        final decoded = jsonDecode(s);
        if (decoded is List) {
          return decoded
              .whereType<Map<String, dynamic>>()
              .toList(growable: false);
        }
      } catch (_) {
        return const [];
      }
    }
    return const [];
  }

  double _avg(List<Map<String, dynamic>> recs, num totalMarks) {
    if (recs.isEmpty || totalMarks <= 0) return 0;
    double sum = 0;
    int counted = 0;
    for (final r in recs) {
      final v = num.tryParse('${r['obtained'] ?? r['marks'] ?? 0}');
      if (v != null) {
        sum += v.toDouble();
        counted++;
      }
    }
    if (counted == 0) return 0;
    final avgObtained = sum / counted;
    return totalMarks > 0 ? (avgObtained / totalMarks) * 100 : 0;
  }

  String _classNameFor(String? classId) {
    if (classId == null || classId.isEmpty) return 'Unknown class';
    return _classNames[classId] ?? 'Class $classId';
  }

  String _fmtDate(String? raw) {
    if (raw == null || raw.isEmpty) return '—';
    final d = DateTime.tryParse(raw);
    if (d == null) return raw;
    return DateFormat('EEE, d MMM yyyy').format(d);
  }

  @override
  Widget build(BuildContext context) {
    Widget body;
    if (_isLoading) {
      body = const Center(child: CircularProgressIndicator());
    } else if (_error != null) {
      body = _ErrorView(error: _error!, onRetry: _load);
    } else if (_results.isEmpty) {
      body = RefreshIndicator(
        onRefresh: _load,
        color: AppTheme.primary,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: const [
            SizedBox(height: 80),
            EmptyState(
              icon: Icons.bar_chart_outlined,
              title: 'No results published yet',
              description: 'Exam results posted by your teachers will appear '
                  'here. Pull down to refresh.',
            ),
          ],
        ),
      );
    } else {
      body = RefreshIndicator(
        onRefresh: _load,
        color: AppTheme.primary,
        child: ListView.builder(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          itemCount: _results.length,
          itemBuilder: (context, i) {
            final r = _results[i];
            final recs = _parseRecords(r['records']);
            final totalMarks =
                num.tryParse('${r['totalMarks'] ?? 100}') ?? 100;
            final avg = _avg(recs, totalMarks);
            return _ResultCard(
              exam: (r['exam'] ?? 'Exam').toString(),
              className: _classNameFor(r['classId']?.toString()),
              dateLabel: _fmtDate(r['date']?.toString()),
              totalMarks: totalMarks,
              average: avg,
              records: recs,
            );
          },
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Results'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, size: 20),
            tooltip: 'Refresh',
            onPressed: _load,
          ),
        ],
      ),
      body: body,
    );
  }
}

// =============================== RESULT CARD (expandable) ===============================

class _ResultCard extends StatefulWidget {
  final String exam;
  final String className;
  final String dateLabel;
  final num totalMarks;
  final double average; // 0..100
  final List<Map<String, dynamic>> records;

  const _ResultCard({
    required this.exam,
    required this.className,
    required this.dateLabel,
    required this.totalMarks,
    required this.average,
    required this.records,
  });

  @override
  State<_ResultCard> createState() => _ResultCardState();
}

class _ResultCardState extends State<_ResultCard> {
  bool _expanded = false;

  Color _avgColor(double avg) {
    if (avg >= 80) return AppTheme.success;
    if (avg >= 60) return AppTheme.gold;
    if (avg >= 40) return AppTheme.warning;
    return AppTheme.danger;
  }

  Color _gradeColor(String? grade) {
    final g = (grade ?? '').toString().toUpperCase();
    if (g.startsWith('A')) return AppTheme.success;
    if (g.startsWith('B')) return AppTheme.info;
    if (g.startsWith('C')) return AppTheme.warning;
    return AppTheme.danger;
  }

  @override
  Widget build(BuildContext context) {
    final avgPct = widget.average.round().clamp(0, 100);
    final avgColor = _avgColor(widget.average);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
        boxShadow: AppTheme.shadowSm,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () => setState(() => _expanded = !_expanded),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: AppTheme.gold.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.bar_chart,
                          size: 20, color: AppTheme.gold),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.exam,
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.textPrimary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${widget.className}  ·  ${widget.dateLabel}',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: AppTheme.textSecondary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: avgColor.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '$avgPct%',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: avgColor,
                        ),
                      ),
                    ),
                    const SizedBox(width: 4),
                    Icon(
                      _expanded
                          ? Icons.keyboard_arrow_up
                          : Icons.keyboard_arrow_down,
                      size: 20,
                      color: AppTheme.textMuted,
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _metaChip(
                        'Total Marks', '${widget.totalMarks}', AppTheme.primary),
                    const SizedBox(width: 6),
                    _metaChip('Students', '${widget.records.length}',
                        AppTheme.primaryLight),
                    const SizedBox(width: 6),
                    _metaChip('Avg', '$avgPct%', avgColor),
                  ],
                ),
                if (_expanded) ...[
                  const SizedBox(height: 12),
                  const Divider(height: 1),
                  const SizedBox(height: 8),
                  if (widget.records.isEmpty)
                    Text(
                      'No student marks recorded for this exam.',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: AppTheme.textMuted,
                        fontStyle: FontStyle.italic,
                      ),
                    )
                  else
                    Column(
                      children: [
                        for (int i = 0; i < widget.records.length; i++) ...[
                            _StudentMarkRow(
                              rec: widget.records[i],
                              totalMarks: widget.totalMarks,
                              gradeColor: _gradeColor(
                                  widget.records[i]['grade']?.toString()),
                            ),
                            if (i < widget.records.length - 1)
                              const SizedBox(height: 6),
                          ],
                      ],
                    ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _metaChip(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w800,
                color: color,
              ),
            ),
            const SizedBox(height: 1),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 9,
                fontWeight: FontWeight.w600,
                color: AppTheme.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// =============================== STUDENT MARK ROW ===============================

class _StudentMarkRow extends StatelessWidget {
  final Map<String, dynamic> rec;
  final num totalMarks;
  final Color gradeColor;

  const _StudentMarkRow({
    required this.rec,
    required this.totalMarks,
    required this.gradeColor,
  });

  @override
  Widget build(BuildContext context) {
    final name = (rec['studentName'] ?? rec['name'] ?? 'Student').toString();
    final obtained = num.tryParse('${rec['obtained'] ?? rec['marks'] ?? 0}') ?? 0;
    final grade = (rec['grade'] ?? '').toString().toUpperCase();
    final initial = name.trim().isEmpty
        ? '?'
        : name.trim().split(RegExp(r'\s+')).first[0].toUpperCase();

    return Row(
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: AppTheme.primary.withOpacity(0.08),
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              initial,
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                color: AppTheme.primary,
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            name,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppTheme.textPrimary,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
        Text(
          '${obtained.toStringAsFixed(obtained.truncateToDouble() == obtained ? 0 : 1)} / $totalMarks',
          style: GoogleFonts.inter(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: AppTheme.textPrimary,
          ),
        ),
        if (grade.isNotEmpty) ...[
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
            decoration: BoxDecoration(
              color: gradeColor.withOpacity(0.12),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              grade,
              style: GoogleFonts.inter(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                color: gradeColor,
              ),
            ),
          ),
        ],
      ],
    );
  }
}

// =============================== ERROR VIEW (file-scoped) ===============================

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
            const Text(
              'Something went wrong',
              style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textPrimary),
            ),
            const SizedBox(height: 4),
            Text(
              error,
              textAlign: TextAlign.center,
              style: const TextStyle(
                  fontSize: 12, color: AppTheme.textMuted),
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
