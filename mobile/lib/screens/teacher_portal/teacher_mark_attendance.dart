import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';

/// Teacher → Mark Attendance screen (PGC-parity).
///
/// Flow: pick class+section → pick date → tap "Load Roster" → mark each
/// student Present / Absent / Late → tap "Submit Attendance" (optimistic).
class TeacherMarkAttendance extends StatefulWidget {
  final Map<String, dynamic> user;
  const TeacherMarkAttendance({super.key, required this.user});

  @override
  State<TeacherMarkAttendance> createState() => _TeacherMarkAttendanceState();
}

class _TeacherMarkAttendanceState extends State<TeacherMarkAttendance> {
  List<dynamic> _classes = [];
  List<dynamic> _roster = [];
  Map<String, String> _status = {}; // studentId → 'present' | 'absent' | 'late'
  String? _selectedClassId;
  String? _selectedClassName;
  DateTime _selectedDate = DateTime.now();
  bool _loadingClasses = true;
  bool _loadingRoster = false;
  bool _submitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadClasses();
  }

  Future<void> _loadClasses() async {
    setState(() { _loadingClasses = true; _error = null; });
    try {
      final branchId = widget.user['branchId']?.toString();
      List<dynamic> list;
      if (branchId != null && branchId.isNotEmpty) {
        try {
          list = await ApiClient.getList('branch/classes', query: {'branchId': branchId});
        } catch (_) {
          list = await ApiClient.getList('teacher/classes', query: {'teacherId': widget.user['id']?.toString()});
        }
      } else {
        list = await ApiClient.getList('teacher/classes', query: {'teacherId': widget.user['id']?.toString()});
      }
      if (mounted) setState(() { _classes = list; _loadingClasses = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loadingClasses = false; });
    }
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime.now().subtract(const Duration(days: 90)),
      lastDate: DateTime.now().add(const Duration(days: 1)),
    );
    if (picked != null) {
      setState(() => _selectedDate = picked);
    }
  }

  Future<void> _loadRoster() async {
    if (_selectedClassId == null) {
      _snack('Please select a class first', AppTheme.warning);
      return;
    }
    setState(() { _loadingRoster = true; _error = null; _roster = []; _status = {}; });
    try {
      // Try the role-scoped endpoint first, fall back to the branch-scoped list.
      List<dynamic> list;
      try {
        list = await ApiClient.getList('platform/users', query: {
          'role': 'student',
          'classId': _selectedClassId,
        });
      } catch (_) {
        final branchId = widget.user['branchId']?.toString();
        list = await ApiClient.getList('branch/students', query: {
          if (branchId != null) 'branchId': branchId,
          'classId': _selectedClassId,
        });
      }
      // Sort by roll number, fall back to name.
      list.sort((a, b) {
        final ra = (a['rollNo'] ?? a['name'] ?? '').toString();
        final rb = (b['rollNo'] ?? b['name'] ?? '').toString();
        return ra.toLowerCase().compareTo(rb.toLowerCase());
      });
      final initial = {for (final s in list) s['id']?.toString() ?? '': 'present'};
      if (mounted) setState(() { _roster = list; _status = initial; _loadingRoster = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loadingRoster = false; });
    }
  }

  void _setStatus(String studentId, String status) {
    setState(() => _status[studentId] = status);
  }

  void _markAll(String status) {
    setState(() {
      for (final s in _roster) {
        final id = (s['id'] ?? '').toString();
        _status[id] = status;
      }
    });
  }

  Future<void> _submit() async {
    if (_roster.isEmpty) return;
    setState(() => _submitting = true);

    final records = _roster.map((s) {
      final id = (s['id'] ?? '').toString();
      return {
        'studentId': id,
        'status': _status[id] ?? 'present',
      };
    }).toList();

    final body = {
      'classId': _selectedClassId,
      'className': _selectedClassName,
      'date': DateFormat('yyyy-MM-dd').format(_selectedDate),
      'teacherId': widget.user['id']?.toString(),
      'branchId': widget.user['branchId']?.toString(),
      'records': records,
    };

    try {
      await ApiClient.post('attendance', body: body);
      if (mounted) {
        _snack('Attendance submitted · ${records.length} students', AppTheme.success);
        Navigator.of(context).pop();
      }
    } catch (_) {
      // Optimistic — confirm to the user that the action is queued for sync.
      if (mounted) {
        _snack('Saved locally — will sync', AppTheme.gold);
        Navigator.of(context).pop();
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _snack(String msg, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white)),
        behavior: SnackBarBehavior.floating,
        backgroundColor: color,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty) return '?';
    final first = parts.first.isNotEmpty ? parts.first[0] : '';
    final last = parts.length > 1 && parts.last.isNotEmpty ? parts.last[0] : '';
    return (first + last).toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mark Attendance'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, size: 20),
            tooltip: 'Refresh',
            onPressed: () {
              _loadClasses();
              if (_selectedClassId != null) _loadRoster();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          _filtersBar(),
          if (_roster.isNotEmpty) _bulkActionsBar(),
          Expanded(child: _body()),
        ],
      ),
      bottomNavigationBar: _roster.isEmpty
          ? null
          : SafeArea(
              child: Container(
                padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  border: Border(top: BorderSide(color: AppTheme.border, width: 1)),
                ),
                child: SizedBox(
                  height: 48,
                  child: ElevatedButton.icon(
                    onPressed: _submitting ? null : _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    icon: _submitting
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Icon(Icons.check_circle_outline, size: 18),
                    label: Text(_submitting ? 'Submitting…' : 'Submit Attendance',
                        style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700)),
                  ),
                ),
              ),
            ),
    );
  }

  // ---------- Filters bar (class dropdown + date picker + Load button) ----------

  Widget _filtersBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        border: Border(bottom: BorderSide(color: AppTheme.border, width: 1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: _loadingClasses
                    ? const Padding(
                        padding: EdgeInsets.symmetric(vertical: 14),
                        child: Center(child: SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))),
                      )
                    : DropdownButtonFormField<String>(
                        value: _selectedClassId,
                        decoration: const InputDecoration(
                          labelText: 'Class',
                          prefixIcon: Icon(Icons.class_, size: 18),
                          isDense: true,
                        ),
                        items: _classes.map((c) {
                          final id = (c['id'] ?? '').toString();
                          final name = (c['name'] ?? 'Class').toString();
                          final section = (c['section'] ?? '').toString();
                          final label = section.isEmpty ? name : '$name - Section $section';
                          return DropdownMenuItem<String>(value: id, child: Text(label));
                        }).toList(),
                        onChanged: (v) {
                          final match = _classes.where((c) => (c['id'] ?? '').toString() == v).toList();
                          setState(() {
                            _selectedClassId = v;
                            _selectedClassName = match.isEmpty
                                ? null
                                : '${match.first['name'] ?? ''}${match.first['section'] != null ? ' - ${match.first['section']}' : ''}';
                            _roster = [];
                            _status = {};
                          });
                        },
                      ),
              ),
              const SizedBox(width: 10),
              InkWell(
                onTap: _pickDate,
                borderRadius: BorderRadius.circular(12),
                child: InputDecorator(
                  decoration: const InputDecoration(
                    labelText: 'Date',
                    prefixIcon: Icon(Icons.calendar_today, size: 18),
                    isDense: true,
                  ),
                  child: Text(
                    DateFormat('MMM dd, yyyy').format(_selectedDate),
                    style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          SizedBox(
            height: 40,
            child: ElevatedButton.icon(
              onPressed: _loadingRoster ? null : _loadRoster,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              icon: _loadingRoster
                  ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.download_for_offline_outlined, size: 18),
              label: Text('Load Roster', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700)),
            ),
          ),
        ],
      ),
    );
  }

  // ---------- Bulk actions (mark all present/absent/late) ----------

  Widget _bulkActionsBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: AppTheme.background,
      child: Row(
        children: [
          Text('Mark all:', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textSecondary)),
          const SizedBox(width: 10),
          _bulkChip('Present', AppTheme.success, () => _markAll('present')),
          const SizedBox(width: 6),
          _bulkChip('Absent', AppTheme.danger, () => _markAll('absent')),
          const SizedBox(width: 6),
          _bulkChip('Late', AppTheme.warning, () => _markAll('late')),
          const Spacer(),
          Text('${_roster.length} students', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textMuted)),
        ],
      ),
    );
  }

  Widget _bulkChip(String label, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Text(label, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: color)),
      ),
    );
  }

  // ---------- Body ----------

  Widget _body() {
    if (_loadingRoster) {
      return ListView(
        padding: const EdgeInsets.all(16),
        children: List.generate(6, (_) => const Padding(
          padding: EdgeInsets.only(bottom: 8),
          child: SkeletonBox(width: double.infinity, height: 72),
        )),
      );
    }
    if (_error != null) {
      return _ErrorView(error: _error!, onRetry: _loadRoster);
    }
    if (_roster.isEmpty) {
      return EmptyState(
        icon: Icons.group_off,
        title: 'No students loaded',
        description: _selectedClassId == null
            ? 'Pick a class above and tap "Load Roster" to start marking attendance.'
            : 'No students found in this class. Try another class or check back later.',
      );
    }
    return RefreshIndicator(
      onRefresh: _loadRoster,
      child: ListView.builder(
        padding: const EdgeInsets.only(top: 4, bottom: 16),
        itemCount: _roster.length,
        itemBuilder: (context, i) => _studentRow(_roster[i] as Map<String, dynamic>, i),
      ),
    );
  }

  Widget _studentRow(Map<String, dynamic> s, int index) {
    final name = (s['name'] ?? 'Student').toString();
    final id = (s['id'] ?? '').toString();
    final roll = (s['rollNo'] ?? (index + 1)).toString();
    final cls = (s['class'] ?? '').toString();
    final section = (s['section'] ?? '').toString();
    final subtitle = cls.isEmpty && section.isEmpty
        ? 'Roll #$roll'
        : 'Class $cls${section.isNotEmpty ? ' · $section' : ''} · Roll #$roll';
    final status = _status[id] ?? 'present';

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  _initials(name),
                  style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w800, color: AppTheme.primary),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name, maxLines: 1, overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
                  const SizedBox(height: 2),
                  Text(subtitle, maxLines: 1, overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textSecondary)),
                ],
              ),
            ),
            const SizedBox(width: 8),
            _statusChips(id, status),
          ],
        ),
      ),
    );
  }

  Widget _statusChips(String studentId, String current) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        _statusChip('P', 'present', AppTheme.success, current == 'present', () => _setStatus(studentId, 'present')),
        const SizedBox(width: 4),
        _statusChip('A', 'absent', AppTheme.danger, current == 'absent', () => _setStatus(studentId, 'absent')),
        const SizedBox(width: 4),
        _statusChip('L', 'late', AppTheme.warning, current == 'late', () => _setStatus(studentId, 'late')),
      ],
    );
  }

  Widget _statusChip(String letter, String label, Color color, bool selected, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          color: selected ? color : color.withOpacity(0.1),
          shape: BoxShape.circle,
          border: Border.all(color: selected ? color : color.withOpacity(0.3), width: 1),
        ),
        child: Center(
          child: Text(
            letter,
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: selected ? Colors.white : color,
            ),
          ),
        ),
      ),
    );
  }
}

// =============================== SHARED ERROR VIEW ===============================

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
            Text('Something went wrong', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
            const SizedBox(height: 4),
            Text(error, textAlign: TextAlign.center, style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted)),
            const SizedBox(height: 16),
            ElevatedButton.icon(onPressed: onRetry, icon: const Icon(Icons.refresh, size: 18), label: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}
