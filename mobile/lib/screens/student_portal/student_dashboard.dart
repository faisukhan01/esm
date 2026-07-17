import 'dart:async';

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';
import 'student_attendance.dart';
import '../notifications_screen.dart';
import '../profile_screen.dart';
import '../announcements_screen.dart';
import '../calendar_screen.dart';
import 'student_course_detail.dart';
import 'student_invoices.dart';
import 'student_results.dart';

class StudentDashboard extends StatefulWidget {
  final Map<String, dynamic> user;
  const StudentDashboard({super.key, required this.user});

  @override
  State<StudentDashboard> createState() => _StudentDashboardState();
}

class _StudentDashboardState extends State<StudentDashboard> {
  Map<String, dynamic>? _analytics;
  List<dynamic> _courses = [];
  Map<String, dynamic> _attendance = {};
  List<dynamic> _results = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    // Defer to next frame so the Scaffold is mounted before any setState.
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadData());
  }

  Future<void> _loadData() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final studentId = widget.user['id'];

    try {
      // Load all four resources in parallel for a snappy first paint.
      final responses = await Future.wait<dynamic>([
        ApiClient.getObject('student/analytics'),
        ApiClient.getList('student/courses'),
        ApiClient.getObject('attendance', query: {'studentId': studentId}),
        ApiClient.getList('results', query: {'studentId': studentId}),
      ]);

      if (!mounted) return;
      setState(() {
        _analytics = responses[0] as Map<String, dynamic>;
        _courses = responses[1] as List<dynamic>;
        _attendance = responses[2] as Map<String, dynamic>;
        _results = responses[3] as List<dynamic>;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  void _showSnack(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        behavior: SnackBarBehavior.floating,
        backgroundColor: AppTheme.primary,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  Future<void> _logout() async {
    await ApiClient.logout();
    if (!mounted) return;
    Navigator.pushNamedAndRemoveUntil(context, '/', (_) => false);
  }

  String _fmtNum(dynamic v) {
    final d = (v ?? 0).toDouble();
    if (d == d.roundToDouble()) return d.round().toString();
    return d.toStringAsFixed(1);
  }

  @override
  Widget build(BuildContext context) {
    final kpi = (_analytics?['kpi'] ?? <String, dynamic>{}) as Map<String, dynamic>;
    final fullName = widget.user['name']?.toString() ?? 'Student';
    final firstName = fullName.split(' ').first.isEmpty ? 'Student' : fullName.split(' ').first;
    final className = widget.user['class']?.toString() ?? '—';
    final section = widget.user['section']?.toString() ?? '—';
    final rollNo = widget.user['rollNo']?.toString() ?? '—';

    final attendanceRate = (kpi['attendanceRate'] ?? 0).toDouble();
    final totalSessions = (kpi['totalSessions'] ?? 0).toInt();
    final avgScore = (kpi['avgScore'] ?? 0).toDouble();
    final totalResults = (kpi['totalResults'] ?? 0).toInt();
    final paidInvoices = (kpi['paidInvoices'] ?? 0).toInt();
    final totalInvoices = (kpi['totalInvoices'] ?? 0).toInt();
    final totalPending = (kpi['totalPending'] ?? 0).toDouble();
    final hasPending = totalPending > 0;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('My Dashboard'),
        actions: [
          IconButton(
            tooltip: 'Notifications',
            icon: Stack(
              clipBehavior: Clip.none,
              children: [
                const Icon(Icons.notifications_none_rounded, size: 22),
                Positioned(
                  right: -1,
                  top: -1,
                  child: Container(
                    width: 7,
                    height: 7,
                    decoration: const BoxDecoration(
                      color: AppTheme.gold,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
              ],
            ),
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => NotificationsScreen(user: widget.user))),
          ),
          IconButton(
            tooltip: 'Settings',
            icon: const Icon(Icons.settings_outlined, size: 20),
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ProfileScreen(user: widget.user))),
          ),
          IconButton(
            tooltip: 'Logout',
            icon: const Icon(Icons.logout_rounded, size: 20),
            onPressed: _logout,
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: _isLoading
          ? const DashboardSkeleton()
          : RefreshIndicator(
              onRefresh: _loadData,
              color: AppTheme.primary,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // ── a. Hero banner ───────────────────────────────────────────
                  GradientHeroCard(
                    title: 'Hi, $firstName!',
                    subtitle: 'Class $className · Section $section · Roll #$rollNo',
                    metric: '${_fmtNum(attendanceRate)}%',
                    metricLabel: 'Attendance Rate',
                    icon: Icons.school_rounded,
                    gradientColors: const [AppTheme.primary, AppTheme.primaryLight],
                  ),
                  const SizedBox(height: 16),

                  // ── b. 2x2 KPI grid ─────────────────────────────────────────
                  GridView.count(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 2,
                    mainAxisSpacing: 10,
                    crossAxisSpacing: 10,
                    childAspectRatio: 1.25,
                    children: [
                      PremiumStatCard(
                        icon: Icons.event_available_rounded,
                        label: 'Attendance',
                        value: '${_fmtNum(attendanceRate)}%',
                        subtitle: '$totalSessions sessions',
                        color: AppTheme.success,
                      ),
                      PremiumStatCard(
                        icon: Icons.assessment_rounded,
                        label: 'Avg Score',
                        value: '${_fmtNum(avgScore)}%',
                        subtitle: '$totalResults results',
                        color: AppTheme.info,
                      ),
                      PremiumStatCard(
                        icon: Icons.receipt_long_rounded,
                        label: 'Fee Status',
                        value: '$paidInvoices/$totalInvoices paid',
                        subtitle: hasPending
                            ? 'PKR ${_fmtNum(totalPending)} pending'
                            : 'All cleared',
                        color: hasPending ? AppTheme.danger : AppTheme.success,
                      ),
                      PremiumStatCard(
                        icon: Icons.menu_book_rounded,
                        label: 'Courses',
                        value: '${_courses.length}',
                        subtitle: 'enrolled',
                        color: AppTheme.gold,
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // ── c. Attendance Trend (line chart) ───────────────────────
                  ChartCard(
                    title: 'Attendance Trend',
                    subtitle: 'Last 7 sessions',
                    height: 180,
                    chart: _AttendanceTrendChart(
                      entries: _extractEntries(_attendance),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // ── d. Results Overview (bar chart) ────────────────────────
                  ChartCard(
                    title: 'Results Overview',
                    subtitle: 'Last 5 exams',
                    height: 180,
                    chart: _ResultsBarChart(results: _results),
                  ),
                  const SizedBox(height: 20),

                  // ── e. My Courses (horizontal chips) ───────────────────────
                  const SectionHeader(title: 'My Courses', icon: Icons.menu_book_rounded),
                  const SizedBox(height: 10),
                  SizedBox(
                    height: 86,
                    child: _courses.isEmpty
                        ? Container(
                            decoration: BoxDecoration(
                              color: AppTheme.surface,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: AppTheme.border),
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              'No courses enrolled yet',
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                color: AppTheme.textMuted,
                              ),
                            ),
                          )
                        : ListView.separated(
                            scrollDirection: Axis.horizontal,
                            itemCount: _courses.length,
                            separatorBuilder: (_, __) => const SizedBox(width: 10),
                            itemBuilder: (context, i) {
                              final course = _courses[i] as Map<String, dynamic>;
                              return _CourseChip(
                                name: course['name']?.toString() ?? 'Course',
                                code: course['code']?.toString() ?? '',
                                onTap: () => Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => StudentCourseDetail(
                                      course: course,
                                      user: widget.user,
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                  ),
                  const SizedBox(height: 20),

                  // ── f. Quick Actions ───────────────────────────────────────
                  const SectionHeader(title: 'Quick Actions', icon: Icons.bolt_rounded),
                  const SizedBox(height: 10),
                  GridView.count(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 2,
                    mainAxisSpacing: 10,
                    crossAxisSpacing: 10,
                    childAspectRatio: 1.35,
                    children: [
                      QuickActionTile(
                        icon: Icons.event_rounded,
                        label: 'My Attendance',
                        color: AppTheme.success,
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => StudentAttendance(user: widget.user),
                          ),
                        ),
                      ),
                      QuickActionTile(
                        icon: Icons.assessment_rounded,
                        label: 'My Results',
                        color: AppTheme.info,
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => StudentResults(user: widget.user),
                          ),
                        ),
                      ),
                      QuickActionTile(
                        icon: Icons.receipt_long_rounded,
                        label: 'Invoices',
                        color: AppTheme.gold,
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => StudentInvoices(user: widget.user),
                          ),
                        ),
                      ),
                      QuickActionTile(
                        icon: Icons.calendar_today_rounded,
                        label: 'Timetable',
                        color: AppTheme.primary,
                        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => CalendarScreen(user: widget.user))),
                      ),
                    ],
                  ),

                  // Error banner (kept below the fold so the dashboard still renders).
                  if (_error != null) ...[
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.dangerLight,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.danger.withOpacity(0.25)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.error_outline, size: 18, color: AppTheme.danger),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Some data failed to load. Pull down to retry.',
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                color: AppTheme.danger,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 24),
                ],
              ),
            ),
    );
  }

  List<Map<String, dynamic>> _extractEntries(Map<String, dynamic> attendance) {
    final raw = attendance['entries'];
    if (raw is! List) return const [];
    return raw.whereType<Map<String, dynamic>>().toList();
  }
}

// ===========================================================================
//  Attendance Trend — smooth navy line, gold gradient fill below.
// ===========================================================================

class _AttendanceTrendChart extends StatelessWidget {
  final List<Map<String, dynamic>> entries;
  const _AttendanceTrendChart({required this.entries});

  @override
  Widget build(BuildContext context) {
    // Take the last 7 entries, then reverse so the oldest is leftmost.
    final source = entries.length > 7
        ? entries.sublist(entries.length - 7)
        : List<Map<String, dynamic>>.from(entries);
    source.sort((a, b) {
      final da = a['date']?.toString() ?? '';
      final db = b['date']?.toString() ?? '';
      return da.compareTo(db);
    });

    final spots = <FlSpot>[];
    for (var i = 0; i < source.length; i++) {
      final status = (source[i]['status']?.toString() ?? '').toLowerCase();
      double y;
      if (status.contains('present')) {
        y = 1.0;
      } else if (status.contains('late')) {
        y = 0.5;
      } else {
        y = 0.0;
      }
      spots.add(FlSpot(i.toDouble(), y));
    }

    if (spots.isEmpty) {
      return Center(
        child: Text(
          'No attendance yet',
          style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted),
        ),
      );
    }

    return LineChart(
      LineChartData(
        minY: -0.05,
        maxY: 1.15,
        minX: 0,
        maxX: (spots.length - 1) > 0 ? (spots.length - 1).toDouble() : 1.0,
        gridData: const FlGridData(show: false),
        titlesData: FlTitlesData(
          show: true,
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          bottomTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        borderData: FlBorderData(show: false),
        lineBarsData: [
          LineChartBarData(
            spots: spots,
            isCurved: true,
            curveSmoothness: 0.4,
            color: AppTheme.primary,
            barWidth: 3,
            isStrokeCapRound: true,
            belowBarData: BarAreaData(
              show: true,
              gradient: LinearGradient(
                colors: [
                  AppTheme.gold.withOpacity(0.45),
                  AppTheme.gold.withOpacity(0.10),
                  Colors.transparent,
                ],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
            dotData: const FlDotData(show: false),
          ),
        ],
        lineTouchData: LineTouchData(
          enabled: true,
          touchTooltipData: LineTouchTooltipData(
            getTooltipColor: (_) => AppTheme.primary,
            getTooltipItems: (touchedSpots) {
              return touchedSpots.map((spot) {
                final label = spot.y >= 0.99
                    ? 'Present'
                    : (spot.y >= 0.4 && spot.y <= 0.6 ? 'Late' : 'Absent');
                return LineTooltipItem(
                  label,
                  GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                );
              }).toList();
            },
          ),
        ),
      ),
    );
  }
}

// ===========================================================================
//  Results Overview — last 5 exams as percentage bars colored by grade.
// ===========================================================================

class _ResultsBarChart extends StatelessWidget {
  final List<dynamic> results;
  const _ResultsBarChart({required this.results});

  Color _colorForGrade(String grade) {
    final g = grade.toUpperCase();
    if (g.startsWith('A')) return AppTheme.success;
    if (g.startsWith('B')) return AppTheme.info;
    if (g.startsWith('C')) return AppTheme.warning;
    return AppTheme.danger; // D, F, or unknown
  }

  String _truncate(String s, int n) {
    if (s.length <= n) return s;
    return '${s.substring(0, n)}…';
  }

  @override
  Widget build(BuildContext context) {
    final source = results.length > 5
        ? results.sublist(results.length - 5)
        : results;
    final items = source.whereType<Map<String, dynamic>>().toList();

    if (items.isEmpty) {
      return Center(
        child: Text(
          'No results yet',
          style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted),
        ),
      );
    }

    final groups = <BarChartGroupData>[];
    for (var i = 0; i < items.length; i++) {
      final r = items[i];
      final marks = (r['marks'] ?? 0).toDouble();
      final totalMarks = (r['totalMarks'] ?? 1).toDouble();
      final pct = totalMarks > 0
          ? (marks / totalMarks * 100).clamp(0, 100).toDouble()
          : 0.0;
      final grade = r['grade']?.toString() ?? 'F';
      groups.add(
        BarChartGroupData(
          x: i,
          barRods: [
            BarChartRodData(
              toY: pct,
              color: _colorForGrade(grade),
              width: 22,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(6),
                topRight: Radius.circular(6),
              ),
              backDrawRodData: BackgroundBarChartRodData(
                show: true,
                toY: 100,
                color: AppTheme.accent,
              ),
            ),
          ],
        ),
      );
    }

    return BarChart(
      BarChartData(
        minY: 0,
        maxY: 100,
        groupsSpace: 14,
        gridData: const FlGridData(show: false),
        borderData: FlBorderData(show: false),
        alignment: BarChartAlignment.spaceAround,
        barGroups: groups,
        titlesData: FlTitlesData(
          show: true,
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 32,
              getTitlesWidget: (value, meta) {
                final idx = value.toInt();
                if (idx < 0 || idx >= items.length) return const SizedBox.shrink();
                final exam = items[idx]['exam']?.toString() ?? '';
                return Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Text(
                    _truncate(exam, 8),
                    style: GoogleFonts.inter(
                      fontSize: 9,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                );
              },
            ),
          ),
        ),
        barTouchData: BarTouchData(
          enabled: true,
          touchTooltipData: BarTouchTooltipData(
            getTooltipColor: (_) => AppTheme.primary,
            getTooltipItem: (group, gIdx, rod, rIdx) {
              final r = items[group.x.toInt()];
              final marks = r['marks'];
              final totalMarks = r['totalMarks'];
              final grade = r['grade']?.toString() ?? '';
              return BarTooltipItem(
                '${rod.toY.toStringAsFixed(0)}%  ·  $marks/$totalMarks  ·  $grade',
                GoogleFonts.inter(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}

// ===========================================================================
//  Course chip — horizontal scroller item.
// ===========================================================================

class _CourseChip extends StatelessWidget {
  final String name;
  final String code;
  final VoidCallback onTap;
  const _CourseChip({required this.name, required this.code, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 184,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppTheme.primary.withOpacity(0.06),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppTheme.primary.withOpacity(0.12)),
        ),
        child: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppTheme.primary, AppTheme.primaryLight],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.book_rounded, size: 18, color: Colors.white),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    name,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textPrimary,
                      height: 1.2,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (code.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      code,
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        color: AppTheme.textSecondary,
                        fontWeight: FontWeight.w600,
                      ),
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
