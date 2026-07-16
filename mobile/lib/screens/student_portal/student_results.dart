import 'package:intl/intl.dart';
import 'package:flutter/material.dart';
import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';

class StudentResults extends StatefulWidget {
  final Map<String, dynamic> user;
  const StudentResults({super.key, required this.user});

  @override
  State<StudentResults> createState() => _StudentResultsState();
}

class _StudentResultsState extends State<StudentResults> with AutomaticKeepAliveClientMixin {
  List<dynamic> _entries = [];
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
      final r = await ApiClient.get('results', query: {'studentId': widget.user['id']});
      // GET /results?studentId=X returns an array of { id, exam, courseId, totalMarks, marks, grade, date }
      final list = r is List ? r : [];
      if (mounted) setState(() { _entries = list; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  @override
  bool get wantKeepAlive => true;

  String _fmtDate(dynamic d) {
    if (d == null) return '';
    try {
      final dt = DateTime.parse(d.toString());
      return DateFormat('MMM d, yyyy').format(dt);
    } catch (_) {
      return d.toString();
    }
  }

  Color _gradeColor(String grade) {
    final g = grade.toUpperCase();
    if (g.startsWith('A')) return AppTheme.success;
    if (g.startsWith('B')) return const Color(0xFF2563EB);
    if (g.startsWith('C')) return AppTheme.warning;
    return AppTheme.danger;
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    // Compute average
    double avgPct = 0;
    if (_entries.isNotEmpty) {
      double sum = 0;
      int count = 0;
      for (final e in _entries) {
        final marks = double.tryParse('${e['marks'] ?? 0}') ?? 0;
        final total = double.tryParse('${e['totalMarks'] ?? 100}') ?? 100;
        if (total > 0) {
          sum += (marks / total) * 100;
          count++;
        }
      }
      if (count > 0) avgPct = sum / count;
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Results'),
        actions: [IconButton(icon: const Icon(Icons.refresh, size: 20), onPressed: _load)],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _StudentErrorView(error: _error!, onRetry: _load)
              : _entries.isEmpty
                  ? const EmptyState(
                      icon: Icons.assessment_outlined,
                      title: 'No results yet',
                      description: 'Your exam results will appear here once teachers post them.',
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView(
                        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                        children: [
                          // Average score hero
                          Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
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
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text('Overall Average', style: TextStyle(fontSize: 12, color: Colors.white70)),
                                      const SizedBox(height: 4),
                                      Text('${avgPct.round()}%', style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w800, color: Colors.white)),
                                      const SizedBox(height: 2),
                                      Text('Across ${_entries.length} exam${_entries.length == 1 ? '' : 's'}', style: const TextStyle(fontSize: 11, color: Colors.white70)),
                                    ],
                                  ),
                                ),
                                const Icon(Icons.emoji_events, size: 48, color: Colors.white70),
                              ],
                            ),
                          ),
                          const SizedBox(height: 20),
                          const SectionHeader(title: 'Exam Results'),
                          const SizedBox(height: 8),
                          ..._entries.map((e) {
                            final entry = e as Map<String, dynamic>;
                            final exam = entry['exam'] ?? 'Exam';
                            final marks = double.tryParse('${entry['marks'] ?? 0}') ?? 0;
                            final totalMarks = double.tryParse('${entry['totalMarks'] ?? 100}') ?? 100;
                            final grade = (entry['grade'] ?? _computeGrade(marks, totalMarks)).toString();
                            final pct = totalMarks > 0 ? (marks / totalMarks) * 100 : 0.0;
                            return Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              child: Padding(
                                padding: const EdgeInsets.all(14),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Text(exam, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: _gradeColor(grade).withOpacity(0.12),
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          child: Text(grade, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: _gradeColor(grade))),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 10),
                                    // Marks + progress bar
                                    Row(
                                      children: [
                                        Text('${marks.toInt()} / ${totalMarks.toInt()}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textSecondary)),
                                        const Spacer(),
                                        Text('${pct.round()}%', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: _gradeColor(grade))),
                                      ],
                                    ),
                                    const SizedBox(height: 6),
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(4),
                                      child: LinearProgressIndicator(
                                        value: (pct / 100).clamp(0, 1),
                                        minHeight: 6,
                                        backgroundColor: AppTheme.border,
                                        valueColor: AlwaysStoppedAnimation<Color>(_gradeColor(grade)),
                                      ),
                                    ),
                                    if (entry['date'] != null) ...[
                                      const SizedBox(height: 6),
                                      Text(_fmtDate(entry['date']), style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
                                    ],
                                  ],
                                ),
                              ),
                            );
                          }),
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

class _StudentErrorView extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;
  const _StudentErrorView({required this.error, required this.onRetry});

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
            const Text('Something went wrong', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
            const SizedBox(height: 4),
            Text(error, textAlign: TextAlign.center, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
            const SizedBox(height: 16),
            ElevatedButton.icon(onPressed: onRetry, icon: const Icon(Icons.refresh, size: 18), label: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}
