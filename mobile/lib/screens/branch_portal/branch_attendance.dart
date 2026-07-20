import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';

/// Branch Attendance Review — branch-manager module (web parity).
///
/// Backend: `GET /api/attendance` returns the most recent 50 attendance
/// sessions across the whole institute. The handler does NOT honour a
/// `branchId` query param, so we fetch all and client-filter by
/// `rec['branchId'] == user.branchId`. Each session carries a `records`
/// field which is a JSON string array of `{studentId, studentName, status}`
/// (status ∈ {Present, Absent, Late}).
///
/// Class names are resolved by fetching `GET /api/branch/classes?branchId=`
/// in parallel; sessions whose classId is unknown simply show the raw id
/// so the manager still sees the data.
class BranchAttendance extends StatefulWidget {
  final Map<String, dynamic> user;
  const BranchAttendance({super.key, required this.user});

  @override
  State<BranchAttendance> createState() => _BranchAttendanceState();
}

class _BranchAttendanceState extends State<BranchAttendance> {
  List<Map<String, dynamic>> _sessions = [];
  Map<String, String> _classNames = {}; // classId -> "Grade 10 · A"
  bool _isLoading = true;
  String? _error;
  String? _classFilter; // null = All classes

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
      // Fetch attendance sessions + classes in parallel so we can resolve
      // classId → className on the client.
      final results = await Future.wait([
        ApiClient.getList('attendance'),
        ApiClient.getList('branch/classes', query: {
          if (branchId != null && branchId.isNotEmpty) 'branchId': branchId,
        }),
      ]);
      final rawSessions = results[0];
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

      // Client-side branch filter — server ignores the branchId query param.
      final filtered = <Map<String, dynamic>>[];
      for (final s in rawSessions) {
        final m = s is Map<String, dynamic> ? s : <String, dynamic>{};
        if (branchId != null && branchId.isNotEmpty) {
          final recBranch = m['branchId']?.toString();
          if (recBranch != null && recBranch != branchId) continue;
        }
        filtered.add(m);
      }
      // Already sorted by date DESC on the server; defensive re-sort anyway.
      filtered.sort((a, b) {
        final da = (a['date'] ?? '').toString();
        final db = (b['date'] ?? '').toString();
        return db.compareTo(da);
      });

      if (mounted) {
        setState(() {
          _sessions = filtered;
          _classNames = nameMap;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  /// Parses the `records` field of an attendance session into a List of maps.
  /// The backend stores it as a JSON string; older clients may already have
  /// it as a List. We handle both shapes defensively.
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

  ({int present, int absent, int late, int total}) _summary(
      List<Map<String, dynamic>> recs) {
    int present = 0, absent = 0, late = 0;
    for (final r in recs) {
      final s = (r['status'] ?? '').toString().toLowerCase();
      if (s == 'present') {
        present++;
      } else if (s == 'absent') {
        absent++;
      } else if (s == 'late') {
        late++;
      }
    }
    return (present: present, absent: absent, late: late, total: recs.length);
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

  List<Map<String, dynamic>> get _visibleSessions {
    if (_classFilter == null) return _sessions;
    return _sessions
        .where((s) => s['classId']?.toString() == _classFilter)
        .toList(growable: false);
  }

  @override
  Widget build(BuildContext context) {
    final branchId = widget.user['branchId']?.toString();
    final body = _isLoading
        ? const Center(child: CircularProgressIndicator())
        : _error != null
            ? _ErrorView(error: _error!, onRetry: _load)
            : RefreshIndicator(
                onRefresh: _load,
                color: AppTheme.primary,
                child: _sessions.isEmpty
                    ? ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        children: const [
                          SizedBox(height: 80),
                          EmptyState(
                            icon: Icons.how_to_reg_outlined,
                            title: 'No attendance records yet',
                            description: 'Attendance sessions marked by your '
                                'teachers will appear here. Pull down to refresh.',
                          ),
                        ],
                      )
                    : CustomScrollView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        slivers: [
                          if (_classNames.length > 1)
                            SliverToBoxAdapter(child: _classFilterBar()),
                          SliverPadding(
                            padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                            sliver: SliverList.builder(
                              itemCount: _visibleSessions.length,
                              itemBuilder: (context, i) {
                                final s = _visibleSessions[i];
                                return _AttendanceSessionCard(
                                  session: s,
                                  className: _classNameFor(
                                      s['classId']?.toString()),
                                  dateLabel: _fmtDate(s['date']?.toString()),
                                  records: _parseRecords(s['records']),
                                  summary: _summary(_parseRecords(s['records'])),
                                );
                              },
                            ),
                          ),
                        ],
                      ),
              );

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Attendance'),
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

  // Optional class filter chips row — only rendered when more than one class
  // has attendance, so single-class branches aren't burdened with chrome.
  Widget _classFilterBar() {
    final presentClasses = _sessions
        .map((s) => s['classId']?.toString())
        .whereType<String>()
        .toSet();
    final chips = <Widget>[
      _filterChip('All', null),
      for (final id in presentClasses)
        _filterChip(_classNameFor(id), id),
    ];
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 4),
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(children: chips),
      ),
    );
  }

  Widget _filterChip(String label, String? id) {
    final selected = _classFilter == id;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: () => setState(() => _classFilter = id),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          decoration: BoxDecoration(
            color: selected ? AppTheme.primary : AppTheme.surface,
            border: Border.all(
              color: selected ? AppTheme.primary : AppTheme.border,
            ),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: selected ? Colors.white : AppTheme.textSecondary,
            ),
          ),
        ),
      ),
    );
  }
}

// =============================== SESSION CARD (expandable) ===============================

class _AttendanceSessionCard extends StatefulWidget {
  final Map<String, dynamic> session;
  final String className;
  final String dateLabel;
  final List<Map<String, dynamic>> records;
  final ({int present, int absent, int late, int total}) summary;

  const _AttendanceSessionCard({
    required this.session,
    required this.className,
    required this.dateLabel,
    required this.records,
    required this.summary,
  });

  @override
  State<_AttendanceSessionCard> createState() => _AttendanceSessionCardState();
}

class _AttendanceSessionCardState extends State<_AttendanceSessionCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final s = widget.summary;
    final rate = s.total > 0 ? (s.present / s.total) : 0.0;
    final pct = (rate * 100).round();
    final rateColor = pct >= 75
        ? AppTheme.success
        : pct >= 50
            ? AppTheme.warning
            : AppTheme.danger;

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
                        color: AppTheme.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.how_to_reg,
                          size: 20, color: AppTheme.primary),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.className,
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
                            widget.dateLabel,
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: AppTheme.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: rateColor.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '$pct%',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: rateColor,
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
                // Summary row: present / absent / late / total
                Row(
                  children: [
                    _countChip('Present', s.present, AppTheme.success),
                    const SizedBox(width: 6),
                    _countChip('Absent', s.absent, AppTheme.danger),
                    const SizedBox(width: 6),
                    _countChip('Late', s.late, AppTheme.warning),
                    const SizedBox(width: 6),
                    _countChip('Total', s.total, AppTheme.primary),
                  ],
                ),
                if (_expanded) ...[
                  const SizedBox(height: 12),
                  const Divider(height: 1),
                  const SizedBox(height: 8),
                  if (widget.records.isEmpty)
                    Text(
                      'No student records in this session.',
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
                            _StudentStatusRow(rec: widget.records[i]),
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

  Widget _countChip(String label, int value, Color color) {
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
              '$value',
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

// =============================== STUDENT ROW ===============================

class _StudentStatusRow extends StatelessWidget {
  final Map<String, dynamic> rec;
  const _StudentStatusRow({required this.rec});

  @override
  Widget build(BuildContext context) {
    final name = (rec['studentName'] ?? rec['name'] ?? 'Student').toString();
    final statusRaw = (rec['status'] ?? '').toString();
    final statusLower = statusRaw.toLowerCase();
    final Color color;
    final IconData icon;
    if (statusLower == 'present') {
      color = AppTheme.success;
      icon = Icons.check_circle;
    } else if (statusLower == 'absent') {
      color = AppTheme.danger;
      icon = Icons.cancel;
    } else if (statusLower == 'late') {
      color = AppTheme.warning;
      icon = Icons.access_time;
    } else {
      color = AppTheme.textMuted;
      icon = Icons.help_outline;
    }
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
        Icon(icon, size: 16, color: color),
        const SizedBox(width: 4),
        Text(
          statusRaw.isEmpty ? '—' : statusRaw,
          style: GoogleFonts.inter(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: color,
          ),
        ),
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
