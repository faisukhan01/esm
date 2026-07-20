import 'package:intl/intl.dart';
import 'package:flutter/material.dart';
import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';
import 'teacher_dashboard.dart';
import 'teacher_class_detail.dart';
import 'teacher_mark_attendance.dart';

class TeacherHome extends StatefulWidget {
  final Map<String, dynamic> user;
  const TeacherHome({super.key, required this.user});

  @override
  State<TeacherHome> createState() => _TeacherHomeState();
}

class _TeacherHomeState extends State<TeacherHome> {
  int _currentIndex = 0;

  late final List<Widget> _screens;

  @override
  void initState() {
    super.initState();
    _screens = [
      TeacherDashboard(
        user: widget.user,
        onNavigate: (i) => setState(() => _currentIndex = i),
      ),
      _TeacherClassesTab(user: widget.user),
      _TeacherAttendanceTab(user: widget.user),
      _TeacherDiaryTab(user: widget.user),
      _TeacherTimetableTab(user: widget.user),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: _screens),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (i) => setState(() => _currentIndex = i),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard_outlined), activeIcon: Icon(Icons.dashboard), label: 'Dashboard'),
          BottomNavigationBarItem(icon: Icon(Icons.menu_book_outlined), activeIcon: Icon(Icons.menu_book), label: 'Classes'),
          BottomNavigationBarItem(icon: Icon(Icons.fact_check_outlined), activeIcon: Icon(Icons.fact_check), label: 'Attendance'),
          BottomNavigationBarItem(icon: Icon(Icons.assignment_outlined), activeIcon: Icon(Icons.assignment), label: 'Diary'),
          BottomNavigationBarItem(icon: Icon(Icons.event_outlined), activeIcon: Icon(Icons.event), label: 'Timetable'),
        ],
      ),
    );
  }
}

// =============================== ATTENDANCE TAB ===============================

class _TeacherAttendanceTab extends StatelessWidget {
  const _TeacherAttendanceTab({required this.user});
  final Map<String, dynamic> user;

  @override
  Widget build(BuildContext context) {
    return TeacherMarkAttendance(user: user);
  }
}

class _TeacherClassesTab extends StatefulWidget {
  final Map<String, dynamic> user;
  const _TeacherClassesTab({required this.user});

  @override
  State<_TeacherClassesTab> createState() => _TeacherClassesTabState();
}

class _TeacherClassesTabState extends State<_TeacherClassesTab> with AutomaticKeepAliveClientMixin {
  List<dynamic> _classes = [];
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
      final list = await ApiClient.getList('teacher/classes');
      if (mounted) setState(() { _classes = list; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Classes'),
        actions: [IconButton(icon: const Icon(Icons.refresh, size: 20), onPressed: _load)],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _TeacherErrorView(error: _error!, onRetry: _load)
              : _classes.isEmpty
                  ? const EmptyState(icon: Icons.menu_book_outlined, title: 'No classes assigned', description: 'Classes assigned to you by the branch manager will appear here.')
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                        itemCount: _classes.length,
                        itemBuilder: (context, i) {
                          final c = _classes[i] as Map<String, dynamic>;
                          final name = c['name'] ?? 'Class';
                          final section = c['section'] ?? 'A';
                          final students = c['students'] ?? c['studentCount'] ?? 0;
                          return ListRowCard(
                            title: 'Class $name',
                            subtitle: 'Section $section · $students students',
                            icon: Icons.menu_book,
                            trailing: '${students}',
                            onTap: () {
                              Navigator.push(context, MaterialPageRoute(
                                builder: (_) => TeacherClassDetail(classData: c, user: widget.user),
                              ));
                            },
                          );
                        },
                      ),
                    ),
    );
  }
}

// =============================== DIARY TAB ===============================

class _TeacherDiaryTab extends StatefulWidget {
  final Map<String, dynamic> user;
  const _TeacherDiaryTab({required this.user});

  @override
  State<_TeacherDiaryTab> createState() => _TeacherDiaryTabState();
}

class _TeacherDiaryTabState extends State<_TeacherDiaryTab> with AutomaticKeepAliveClientMixin {
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
      final list = await ApiClient.getList('diary', query: {'teacherId': widget.user['id']});
      if (mounted) setState(() { _entries = list; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
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

  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Diary & Homework'),
        actions: [IconButton(icon: const Icon(Icons.refresh, size: 20), onPressed: _load)],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _TeacherErrorView(error: _error!, onRetry: _load)
              : _entries.isEmpty
                  ? const EmptyState(icon: Icons.assignment_outlined, title: 'No diary entries', description: 'Homework and diary entries you post from the web dashboard will appear here.')
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                        itemCount: _entries.length,
                        itemBuilder: (context, i) {
                          final e = _entries[i] as Map<String, dynamic>;
                          final title = e['title'] ?? 'Diary Entry';
                          final desc = e['description'] ?? e['message'] ?? '';
                          final dueDate = e['dueDate'] ?? e['date'];
                          final classId = e['classId'];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: Padding(
                              padding: const EdgeInsets.all(14),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        width: 36, height: 36,
                                        decoration: BoxDecoration(color: AppTheme.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                                        child: const Icon(Icons.assignment, size: 18, color: AppTheme.primary),
                                      ),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
                                      ),
                                      if (dueDate != null)
                                        Text(_fmtDate(dueDate), style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                                    ],
                                  ),
                                  if (desc.toString().isNotEmpty) ...[
                                    const SizedBox(height: 8),
                                    Text(desc, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                                  ],
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
    );
  }
}

// =============================== TIMETABLE TAB ===============================

class _TeacherTimetableTab extends StatefulWidget {
  final Map<String, dynamic> user;
  const _TeacherTimetableTab({required this.user});

  @override
  State<_TeacherTimetableTab> createState() => _TeacherTimetableTabState();
}

class _TeacherTimetableTabState extends State<_TeacherTimetableTab> with AutomaticKeepAliveClientMixin {
  List<dynamic> _entries = [];
  bool _isLoading = true;
  String? _error;

  static const _days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      // Scope to the teacher's own classes only — branch-wide fetch returns the
      // whole branch schedule (irrelevant to this teacher).
      final teacherId = widget.user['id']?.toString();
      final list = await ApiClient.getList('timetable', query: {
        if (teacherId != null && teacherId.isNotEmpty) 'teacherId': teacherId,
      });
      if (mounted) setState(() { _entries = list; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    // Group entries by day
    final byDay = <String, List<dynamic>>{};
    for (final e in _entries) {
      final day = (e['day'] ?? 'Monday').toString();
      byDay.putIfAbsent(day, () => []).add(e);
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Timetable'),
        actions: [IconButton(icon: const Icon(Icons.refresh, size: 20), onPressed: _load)],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _TeacherErrorView(error: _error!, onRetry: _load)
              : _entries.isEmpty
                  ? const EmptyState(icon: Icons.event_busy, title: 'No timetable', description: 'Your weekly class schedule will appear here once published.')
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView(
                        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                        children: _days.where((d) => byDay.containsKey(d)).map((day) {
                          final dayEntries = byDay[day]!;
                          // Sort by start time
                          dayEntries.sort((a, b) {
                            final aT = (a['startTime'] ?? '').toString();
                            final bT = (b['startTime'] ?? '').toString();
                            return aT.compareTo(bT);
                          });
                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Padding(
                                padding: const EdgeInsets.only(top: 12, bottom: 6),
                                child: Text(day, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.primary)),
                              ),
                              ...dayEntries.map((e) {
                                final subject = e['subject'] ?? e['courseName'] ?? 'Class';
                                final start = e['startTime'] ?? '—';
                                final end = e['endTime'] ?? '—';
                                final room = e['room'] ?? e['className'] ?? '';
                                return Card(
                                  margin: const EdgeInsets.only(bottom: 6),
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                    child: Row(
                                      children: [
                                        Container(
                                          width: 4, height: 32,
                                          decoration: BoxDecoration(color: AppTheme.primary, borderRadius: BorderRadius.circular(2)),
                                        ),
                                        const SizedBox(width: 10),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(subject, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
                                              if (room.toString().isNotEmpty)
                                                Text(room, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                                            ],
                                          ),
                                        ),
                                        Text('$start - $end', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textMuted)),
                                      ],
                                    ),
                                  ),
                                );
                              }),
                            ],
                          );
                        }).toList(),
                      ),
                    ),
    );
  }
}

// =============================== SHARED ERROR VIEW ===============================

class _TeacherErrorView extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;
  const _TeacherErrorView({required this.error, required this.onRetry});

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
