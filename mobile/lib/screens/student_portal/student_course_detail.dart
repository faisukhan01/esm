import 'package:flutter/material.dart';
import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';
import '../../widgets/detail_scaffold.dart';

class StudentCourseDetail extends StatefulWidget {
  final Map<String, dynamic> course;
  final Map<String, dynamic> user;
  const StudentCourseDetail({super.key, required this.course, required this.user});

  @override
  State<StudentCourseDetail> createState() => _StudentCourseDetailState();
}

class _StudentCourseDetailState extends State<StudentCourseDetail> with SingleTickerProviderStateMixin {
  late final TabController _tabCtrl;
  bool _isLoading = true;
  List<dynamic> _materials = [];
  List<dynamic> _results = [];
  List<dynamic> _attendance = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 3, vsync: this);
    _loadAll();
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadAll() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final courseId = widget.course['id'];
      final studentId = widget.user['id'];
      // Fetch all three in parallel
      final results = await Future.wait([
        ApiClient.getList('course-materials', query: {'courseId': courseId}),
        ApiClient.get('results', query: {'courseId': courseId, 'studentId': studentId}),
        ApiClient.getObject('attendance', query: {'studentId': studentId}),
      ]);
      if (mounted) {
        setState(() {
          _materials = results[0] is List ? results[0] as List : [];
          _results = results[1] is List ? results[1] as List : [];
          final att = results[2];
          _attendance = (att['entries'] as List?) ?? [];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = widget.course['name'] ?? 'Course';
    final code = widget.course['code'] ?? '';

    return DetailScaffold(
      title: name,
      subtitle: code.toString().isNotEmpty ? 'Code: $code' : null,
      headerIcon: Icons.book,
      headerActions: [IconButton(icon: const Icon(Icons.refresh, size: 20), onPressed: _loadAll)],
      body: Column(
        children: [
          DetailTabBar(controller: _tabCtrl, tabs: const ['Materials', 'Results', 'Attendance']),
          SizedBox(
            height: MediaQuery.of(context).size.height - 280,
            child: TabBarView(
              controller: _tabCtrl,
              children: [
                _MaterialsTab(materials: _materials, isLoading: _isLoading, error: _error, onRetry: _loadAll),
                _ResultsTab(results: _results, isLoading: _isLoading, error: _error, onRetry: _loadAll),
                _AttendanceTab(entries: _attendance, isLoading: _isLoading, error: _error, onRetry: _loadAll),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// =============================== MATERIALS TAB ===============================

class _MaterialsTab extends StatelessWidget {
  final List<dynamic> materials;
  final bool isLoading;
  final String? error;
  final VoidCallback onRetry;
  const _MaterialsTab({required this.materials, required this.isLoading, required this.error, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    if (isLoading) return const DetailLoading();
    if (error != null) return _DetailError(error: error!, onRetry: onRetry);
    if (materials.isEmpty) {
      return const EmptyState(icon: Icons.folder_open, title: 'No materials', description: 'Your teacher hasn\'t uploaded any materials for this course yet.');
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: materials.length,
      itemBuilder: (context, i) {
        final m = materials[i] as Map<String, dynamic>;
        final title = m['title'] ?? 'Material';
        final type = (m['type'] ?? 'file').toString();
        final isLink = type == 'link' || (m['linkUrl'] != null && m['linkUrl'].toString().isNotEmpty);
        final date = m['createdAt'];
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            leading: Container(
              width: 40, height: 40,
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(isLink ? Icons.link : Icons.description, size: 20, color: AppTheme.primary),
            ),
            title: Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            subtitle: Text(isLink ? 'External link' : 'File', style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
            trailing: Icon(Icons.download_outlined, size: 20, color: AppTheme.primary),
            onTap: () => _openMaterial(context, m),
          ),
        );
      },
    );
  }

  void _openMaterial(BuildContext context, Map<String, dynamic> m) {
    final linkUrl = m['linkUrl'];
    if (linkUrl != null && linkUrl.toString().isNotEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Link: $linkUrl'), behavior: SnackBarBehavior.floating),
      );
      // Note: full URL launching requires url_launcher package; for now we show the link.
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Downloading ${m['title'] ?? 'material'}…'), behavior: SnackBarBehavior.floating),
      );
    }
  }
}

// =============================== RESULTS TAB ===============================

class _ResultsTab extends StatelessWidget {
  final List<dynamic> results;
  final bool isLoading;
  final String? error;
  final VoidCallback onRetry;
  const _ResultsTab({required this.results, required this.isLoading, required this.error, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    if (isLoading) return const DetailLoading();
    if (error != null) return _DetailError(error: error!, onRetry: onRetry);
    if (results.isEmpty) {
      return const EmptyState(icon: Icons.assessment_outlined, title: 'No results', description: 'Your exam results for this course will appear here.');
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: results.length,
      itemBuilder: (context, i) {
        final r = results[i] as Map<String, dynamic>;
        final exam = r['exam'] ?? 'Exam';
        final marks = double.tryParse('${r['marks'] ?? 0}') ?? 0;
        final total = double.tryParse('${r['totalMarks'] ?? 100}') ?? 100;
        final grade = (r['grade'] ?? _grade(marks, total)).toString();
        final pct = total > 0 ? (marks / total) * 100 : 0.0;
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(child: Text(exam, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700))),
                    _GradeBadge(grade: grade, pct: pct),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Text('${marks.toInt()} / ${total.toInt()}', style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                    const Spacer(),
                    Text('${pct.round()}%', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                  ],
                ),
                const SizedBox(height: 6),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: (pct / 100).clamp(0, 1),
                    minHeight: 5,
                    backgroundColor: AppTheme.border,
                    valueColor: AlwaysStoppedAnimation<Color>(_gradeColor(grade)),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  String _grade(double m, double t) {
    if (t <= 0) return 'F';
    final p = (m / t) * 100;
    if (p >= 90) return 'A+';
    if (p >= 80) return 'A';
    if (p >= 70) return 'B';
    if (p >= 60) return 'C';
    if (p >= 50) return 'D';
    return 'F';
  }

  Color _gradeColor(String g) {
    final s = g.toUpperCase();
    if (s.startsWith('A')) return AppTheme.success;
    if (s.startsWith('B')) return const Color(0xFF2563EB);
    if (s.startsWith('C')) return AppTheme.warning;
    return AppTheme.danger;
  }
}

class _GradeBadge extends StatelessWidget {
  final String grade;
  final double pct;
  const _GradeBadge({required this.grade, required this.pct});

  Color get color {
    final g = grade.toUpperCase();
    if (g.startsWith('A')) return AppTheme.success;
    if (g.startsWith('B')) return const Color(0xFF2563EB);
    if (g.startsWith('C')) return AppTheme.warning;
    return AppTheme.danger;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(6)),
      child: Text(grade, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: color)),
    );
  }
}

// =============================== ATTENDANCE TAB ===============================

class _AttendanceTab extends StatelessWidget {
  final List<dynamic> entries;
  final bool isLoading;
  final String? error;
  final VoidCallback onRetry;
  const _AttendanceTab({required this.entries, required this.isLoading, required this.error, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    if (isLoading) return const DetailLoading();
    if (error != null) return _DetailError(error: error!, onRetry: onRetry);
    if (entries.isEmpty) {
      return const EmptyState(icon: Icons.event_busy, title: 'No attendance', description: 'Your attendance for this course will appear here.');
    }
    final present = entries.where((e) => (e['status'] ?? '').toString().toLowerCase() == 'present').length;
    final rate = entries.isNotEmpty ? ((present / entries.length) * 100).round() : 0;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Attendance Rate', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                      const SizedBox(height: 4),
                      Text('$rate%', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: rate >= 75 ? AppTheme.success : AppTheme.danger)),
                    ],
                  ),
                ),
                Text('$present/${entries.length}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.textSecondary)),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        ...entries.map((e) {
          final entry = e as Map<String, dynamic>;
          final status = (entry['status'] ?? 'Unknown').toString();
          final date = entry['date'] ?? '';
          return Card(
            margin: const EdgeInsets.only(bottom: 6),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              child: Row(
                children: [
                  Icon(_statusIcon(status), size: 18, color: _statusColor(status)),
                  const SizedBox(width: 10),
                  Expanded(child: Text(date.toString(), style: const TextStyle(fontSize: 13))),
                  StatusBadge(text: status, status: status.toLowerCase()),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }

  IconData _statusIcon(String s) {
    switch (s.toLowerCase()) {
      case 'present': return Icons.check_circle;
      case 'absent': return Icons.cancel;
      case 'late': return Icons.schedule;
      default: return Icons.help_outline;
    }
  }

  Color _statusColor(String s) {
    switch (s.toLowerCase()) {
      case 'present': return AppTheme.success;
      case 'absent': return AppTheme.danger;
      case 'late': return AppTheme.warning;
      default: return AppTheme.textMuted;
    }
  }
}

// =============================== ERROR VIEW ===============================

class _DetailError extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;
  const _DetailError({required this.error, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.cloud_off, size: 40, color: AppTheme.danger),
            const SizedBox(height: 12),
            const Text('Failed to load', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
            const SizedBox(height: 4),
            Text(error, textAlign: TextAlign.center, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
            const SizedBox(height: 12),
            ElevatedButton.icon(onPressed: onRetry, icon: const Icon(Icons.refresh, size: 16), label: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}
