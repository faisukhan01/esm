import 'package:flutter/material.dart';
import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';
import '../../widgets/detail_scaffold.dart';

class TeacherClassDetail extends StatefulWidget {
  final Map<String, dynamic> classData;
  final Map<String, dynamic> user;
  const TeacherClassDetail({super.key, required this.classData, required this.user});

  @override
  State<TeacherClassDetail> createState() => _TeacherClassDetailState();
}

class _TeacherClassDetailState extends State<TeacherClassDetail> with SingleTickerProviderStateMixin {
  late final TabController _tabCtrl;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.classData;
    final name = c['name'] ?? 'Class';
    final section = c['section'] ?? 'A';

    return DetailScaffold(
      title: 'Class $name',
      subtitle: 'Section $section',
      headerIcon: Icons.menu_book,
      body: Column(
        children: [
          DetailTabBar(controller: _tabCtrl, tabs: const ['Students', 'Attendance', 'Results']),
          SizedBox(
            height: MediaQuery.of(context).size.height - 280,
            child: TabBarView(
              controller: _tabCtrl,
              children: [
                _ClassStudentsTab(classData: c, user: widget.user),
                _ClassAttendanceTab(classData: c, user: widget.user),
                _ClassResultsTab(classData: c, user: widget.user),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// =============================== STUDENTS TAB ===============================

class _ClassStudentsTab extends StatefulWidget {
  final Map<String, dynamic> classData;
  final Map<String, dynamic> user;
  const _ClassStudentsTab({required this.classData, required this.user});

  @override
  State<_ClassStudentsTab> createState() => _ClassStudentsTabState();
}

class _ClassStudentsTabState extends State<_ClassStudentsTab> with AutomaticKeepAliveClientMixin {
  List<dynamic> _students = [];
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
      final list = await ApiClient.getList('platform/users', query: {
        'role': 'student',
        'branchId': widget.user['branchId'],
      });
      // Filter by class name (students don't store classId, they store class name)
      final className = widget.classData['name'];
      final filtered = list.where((s) => s['class'] == className).toList();
      if (mounted) setState(() { _students = filtered; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    if (_isLoading) return const DetailLoading();
    if (_error != null) {
      return Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        const Icon(Icons.cloud_off, size: 40, color: AppTheme.danger),
        const SizedBox(height: 8),
        Text(_error!, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted), textAlign: TextAlign.center),
        const SizedBox(height: 8),
        ElevatedButton(onPressed: _load, child: const Text('Retry')),
      ]));
    }
    if (_students.isEmpty) {
      return const EmptyState(icon: Icons.school_outlined, title: 'No students', description: 'No students enrolled in this class yet.');
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _students.length,
        itemBuilder: (context, i) {
          final s = _students[i] as Map<String, dynamic>;
          return ListRowCard(
            title: s['name'] ?? 'Student',
            subtitle: 'Roll #${s['rollNo'] ?? '—'} · Section ${s['section'] ?? 'A'}',
            icon: Icons.person,
          );
        },
      ),
    );
  }
}

// =============================== ATTENDANCE TAB ===============================

class _ClassAttendanceTab extends StatefulWidget {
  final Map<String, dynamic> classData;
  final Map<String, dynamic> user;
  const _ClassAttendanceTab({required this.classData, required this.user});

  @override
  State<_ClassAttendanceTab> createState() => _ClassAttendanceTabState();
}

class _ClassAttendanceTabState extends State<_ClassAttendanceTab> with AutomaticKeepAliveClientMixin {
  List<dynamic> _students = [];
  List<dynamic> _history = [];
  bool _isLoading = true;
  bool _isSaving = false;
  String? _error;
  DateTime _selectedDate = DateTime.now();
  final Map<String, String> _marks = {}; // studentId -> Present/Absent/Late

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final students = await ApiClient.getList('platform/users', query: {
        'role': 'student',
        'branchId': widget.user['branchId'],
      });
      final className = widget.classData['name'];
      final filtered = students.where((s) => s['class'] == className).toList();
      final history = await ApiClient.getList('attendance', query: {'classId': widget.classData['id']});
      if (mounted) {
        setState(() {
          _students = filtered;
          _history = history;
          // Default everyone to Present
          _marks.clear();
          for (final s in filtered) {
            _marks[s['id']] = 'Present';
          }
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  Future<void> _saveAttendance() async {
    if (_students.isEmpty) return;
    setState(() => _isSaving = true);
    try {
      final records = _students.map((s) => {
        'studentId': s['id'],
        'status': _marks[s['id']] ?? 'Present',
      }).toList();
      final dateStr = _selectedDate.toIso8601String().substring(0, 10);
      await ApiClient.post('attendance', body: {
        'classId': widget.classData['id'],
        'date': dateStr,
        'records': records,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Attendance saved'), backgroundColor: AppTheme.success, behavior: SnackBarBehavior.floating),
        );
        _load();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.danger, behavior: SnackBarBehavior.floating),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    if (_isLoading) return const DetailLoading();
    if (_error != null) {
      return Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        const Icon(Icons.cloud_off, size: 40, color: AppTheme.danger),
        const SizedBox(height: 8),
        ElevatedButton(onPressed: _load, child: const Text('Retry')),
      ]));
    }
    return Column(
      children: [
        // Date picker + save bar
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          color: Colors.white,
          child: Row(
            children: [
              TextButton.icon(
                icon: const Icon(Icons.calendar_today, size: 16),
                label: Text(_fmtDate(_selectedDate)),
                onPressed: () async {
                  final d = await showDatePicker(
                    context: context,
                    initialDate: _selectedDate,
                    firstDate: DateTime.now().subtract(const Duration(days: 90)),
                    lastDate: DateTime.now(),
                  );
                  if (d != null) setState(() => _selectedDate = d);
                },
              ),
              const Spacer(),
              ElevatedButton.icon(
                onPressed: _isSaving ? null : _saveAttendance,
                icon: _isSaving
                    ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.save, size: 16),
                label: const Text('Save'),
              ),
            ],
          ),
        ),
        Expanded(
          child: _students.isEmpty
              ? const EmptyState(icon: Icons.school_outlined, title: 'No students', description: 'No students in this class to mark attendance for.')
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _students.length,
                  itemBuilder: (context, i) {
                    final s = _students[i] as Map<String, dynamic>;
                    final status = _marks[s['id']] ?? 'Present';
                    return Card(
                      margin: const EdgeInsets.only(bottom: 6),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        child: Row(
                          children: [
                            AvatarCircle(name: s['name'] ?? '?', size: 32),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(s['name'] ?? 'Student', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                                  Text('Roll #${s['rollNo'] ?? '—'}', style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                                ],
                              ),
                            ),
                            _StatusSelector(
                              value: status,
                              onChanged: (v) => setState(() => _marks[s['id']] = v),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  String _fmtDate(DateTime d) {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return '${d.day} ${months[d.month - 1]} ${d.year}';
  }
}

class _StatusSelector extends StatelessWidget {
  final String value;
  final ValueChanged<String> onChanged;
  const _StatusSelector({required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return SegmentedButton<String>(
      segments: const [
        ButtonSegment(value: 'Present', icon: Icon(Icons.check, size: 14), label: Text('P', style: TextStyle(fontSize: 10))),
        ButtonSegment(value: 'Absent', icon: Icon(Icons.close, size: 14), label: Text('A', style: TextStyle(fontSize: 10))),
        ButtonSegment(value: 'Late', icon: Icon(Icons.schedule, size: 14), label: Text('L', style: TextStyle(fontSize: 10))),
      ],
      selected: {value},
      onSelectionChanged: (s) => onChanged(s.first),
      style: ButtonStyle(
        visualDensity: VisualDensity.compact,
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
      ),
    );
  }
}

// =============================== RESULTS TAB ===============================

class _ClassResultsTab extends StatefulWidget {
  final Map<String, dynamic> classData;
  final Map<String, dynamic> user;
  const _ClassResultsTab({required this.classData, required this.user});

  @override
  State<_ClassResultsTab> createState() => _ClassResultsTabState();
}

class _ClassResultsTabState extends State<_ClassResultsTab> with AutomaticKeepAliveClientMixin {
  List<dynamic> _students = [];
  List<dynamic> _courses = [];
  List<dynamic> _results = [];
  bool _isLoading = true;
  bool _isSaving = false;
  String? _error;
  String? _selectedCourseId;
  String _examName = '';
  double _totalMarks = 100;
  final Map<String, TextEditingController> _marksControllers = {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final students = await ApiClient.getList('platform/users', query: {
        'role': 'student',
        'branchId': widget.user['branchId'],
      });
      final className = widget.classData['name'];
      final filtered = students.where((s) => s['class'] == className).toList();
      final courses = await ApiClient.getList('courses', query: {'classId': widget.classData['id']});
      final results = await ApiClient.getList('results', query: {'courseId': _selectedCourseId});
      if (mounted) {
        setState(() {
          _students = filtered;
          _courses = courses;
          _results = results;
          if (_selectedCourseId == null && courses.isNotEmpty) _selectedCourseId = courses[0]['id'];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  Future<void> _saveResults() async {
    if (_selectedCourseId == null || _examName.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter exam name and select a course'), backgroundColor: AppTheme.warning, behavior: SnackBarBehavior.floating),
      );
      return;
    }
    setState(() => _isSaving = true);
    try {
      final records = <Map<String, dynamic>>[];
      _marksControllers.forEach((studentId, ctrl) {
        final marks = double.tryParse(ctrl.text.trim());
        if (marks != null) {
          records.add({
            'studentId': studentId,
            'marks': marks,
            'grade': _grade(marks, _totalMarks),
          });
        }
      });
      if (records.isEmpty) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Enter marks for at least one student'), backgroundColor: AppTheme.warning, behavior: SnackBarBehavior.floating),
          );
        }
        setState(() => _isSaving = false);
        return;
      }
      final dateStr = DateTime.now().toIso8601String().substring(0, 10);
      await ApiClient.post('results', body: {
        'exam': _examName.trim(),
        'courseId': _selectedCourseId,
        'classId': widget.classData['id'],
        'totalMarks': _totalMarks,
        'date': dateStr,
        'records': records,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Results saved'), backgroundColor: AppTheme.success, behavior: SnackBarBehavior.floating),
        );
        _marksControllers.values.forEach((c) => c.clear());
        _load();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.danger, behavior: SnackBarBehavior.floating),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  String _grade(double marks, double total) {
    if (total <= 0) return 'F';
    final p = (marks / total) * 100;
    if (p >= 90) return 'A+';
    if (p >= 80) return 'A';
    if (p >= 70) return 'B';
    if (p >= 60) return 'C';
    if (p >= 50) return 'D';
    return 'F';
  }

  @override
  void dispose() {
    for (final c in _marksControllers.values) c.dispose();
    super.dispose();
  }

  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    if (_isLoading) return const DetailLoading();
    if (_error != null) {
      return Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        const Icon(Icons.cloud_off, size: 40, color: AppTheme.danger),
        const SizedBox(height: 8),
        ElevatedButton(onPressed: _load, child: const Text('Retry')),
      ]));
    }
    if (_students.isEmpty) {
      return const EmptyState(icon: Icons.school_outlined, title: 'No students', description: 'No students in this class to post results for.');
    }
    return Column(
      children: [
        // Exam config form
        Container(
          padding: const EdgeInsets.all(16),
          color: Colors.white,
          child: Column(
            children: [
              TextField(
                decoration: const InputDecoration(labelText: 'Exam Name', isDense: true, hintText: 'e.g. Mid Term'),
                onChanged: (v) => _examName = v,
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: _selectedCourseId,
                      decoration: const InputDecoration(labelText: 'Course', isDense: true),
                      items: _courses.map<DropdownMenuItem<String>>((c) {
                        return DropdownMenuItem<String>(
                          value: c['id'],
                          child: Text(c['name'] ?? 'Course', style: const TextStyle(fontSize: 13)),
                        );
                      }).toList(),
                      onChanged: (v) => setState(() => _selectedCourseId = v),
                    ),
                  ),
                  const SizedBox(width: 8),
                  SizedBox(
                    width: 100,
                    child: TextField(
                      decoration: const InputDecoration(labelText: 'Total', isDense: true),
                      keyboardType: TextInputType.number,
                      onChanged: (v) => _totalMarks = double.tryParse(v) ?? 100,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        // Save button
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _isSaving ? null : _saveResults,
              icon: _isSaving
                  ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.save, size: 16),
              label: const Text('Post Results'),
            ),
          ),
        ),
        // Students list with marks input
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            itemCount: _students.length,
            itemBuilder: (context, i) {
              final s = _students[i] as Map<String, dynamic>;
              _marksControllers.putIfAbsent(s['id'], () => TextEditingController());
              return Card(
                margin: const EdgeInsets.only(bottom: 6),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  child: Row(
                    children: [
                      AvatarCircle(name: s['name'] ?? '?', size: 32),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(s['name'] ?? 'Student', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                      ),
                      SizedBox(
                        width: 80,
                        child: TextField(
                          controller: _marksControllers[s['id']],
                          decoration: InputDecoration(
                            hintText: '/${_totalMarks.toInt()}',
                            isDense: true,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                          ),
                          keyboardType: TextInputType.number,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
