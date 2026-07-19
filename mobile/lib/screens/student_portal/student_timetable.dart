import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';
import '../calendar_screen.dart';

/// Student weekly class timetable screen.
///
/// Shows the student's recurring weekly class schedule (Mon–Sat) with a
/// day-selector chip row + a Today / Full Week toggle. A small calendar
/// popup button in the AppBar opens the events `CalendarScreen` (exams /
/// holidays / meetings) inside a modal bottom sheet — so students can
/// still peek at the events calendar without leaving the timetable.
class StudentTimetable extends StatefulWidget {
  final Map<String, dynamic> user;

  const StudentTimetable({super.key, required this.user});

  @override
  State<StudentTimetable> createState() => _StudentTimetableState();
}

class _StudentTimetableState extends State<StudentTimetable> {
  List<dynamic> _entries = [];
  bool _isLoading = true;
  String? _error;

  /// View toggle: 0 = Today only, 1 = Full Week.
  int _viewMode = 0;

  /// Selected day index into [_days]. Defaults to today's weekday on load.
  late int _selectedDayIndex;

  /// Mon–Sat. Sunday is omitted (typically a non-instruction day).
  static const List<String> _days = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  /// Short labels used in the chip row.
  static const List<String> _dayShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  @override
  void initState() {
    super.initState();
    _selectedDayIndex = _weekdayToIndex(DateTime.now().weekday);
    _load();
  }

  int _weekdayToIndex(int weekday) {
    // DateTime.weekday: Mon = 1 ... Sat = 6, Sun = 7
    if (weekday >= 1 && weekday <= 6) return weekday - 1;
    return 0; // Sunday → default to Monday
  }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      // Prefer filtering by studentId; fall back to branchId so siblings
      // at the same branch can still see the published timetable.
      final studentId = widget.user['id'];
      Map<String, dynamic>? query;
      if (studentId != null) {
        query = {'studentId': studentId};
      } else {
        final branchId = widget.user['branchId'];
        if (branchId != null) query = {'branchId': branchId};
      }

      final list = await ApiClient.getList('timetable', query: query);
      if (!mounted) return;
      setState(() {
        _entries = list;
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

  void _openCalendarPopup() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        height: MediaQuery.of(context).size.height * 0.88,
        decoration: const BoxDecoration(
          color: AppTheme.background,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: ClipRRect(
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          child: CalendarScreen(user: widget.user),
        ),
      ),
    );
  }

  List<dynamic> _entriesForDay(String day) {
    final dayEntries = _entries.where((e) {
      final d = (e is Map ? e['day'] : null)?.toString() ?? '';
      return d.toLowerCase() == day.toLowerCase();
    }).toList();
    dayEntries.sort((a, b) {
      final aT = ((a as Map)['startTime'] ?? '').toString();
      final bT = ((b as Map)['startTime'] ?? '').toString();
      return aT.compareTo(bT);
    });
    return dayEntries;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        backgroundColor: AppTheme.surface,
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, size: 22),
          onPressed: () => Navigator.of(context).maybePop(),
        ),
        title: Text(
          'My Timetable',
          style: GoogleFonts.inter(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppTheme.textPrimary,
          ),
        ),
        actions: [
          IconButton(
            tooltip: 'Calendar',
            icon: const Icon(Icons.calendar_today_rounded, size: 20),
            onPressed: _openCalendarPopup,
          ),
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh_rounded, size: 20),
            onPressed: _load,
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) return _buildSkeleton();
    if (_error != null) {
      return _ErrorView(error: _error!, onRetry: _load);
    }
    if (_entries.isEmpty) {
      // EmptyState's root is a Center widget, which needs a bounded height
      // parent — ListView provides unbounded vertical space, so wrap it.
      return RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          children: [
            SizedBox(
              height: MediaQuery.of(context).size.height * 0.6,
              child: const EmptyState(
                icon: Icons.event_busy,
                title: 'No classes scheduled',
                description:
                    'Your weekly timetable will appear here once your branch admin publishes it.',
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      child: Column(
        children: [
          // Today / Full Week segmented toggle.
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: _ViewToggle(
              selectedIndex: _viewMode,
              onChanged: (i) => setState(() => _viewMode = i),
            ),
          ),
          // Day-selector chip row (only meaningful in "Today" mode but always
          // visible so users can hop to any weekday quickly).
          SizedBox(
            height: 44,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _days.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, i) {
                final selected = i == _selectedDayIndex;
                return GestureDetector(
                  onTap: () {
                    setState(() {
                      _selectedDayIndex = i;
                      // Picking a day implies "Today" view (single-day filter).
                      _viewMode = 0;
                    });
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: selected ? AppTheme.primary : AppTheme.surface,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: selected ? AppTheme.primary : AppTheme.border,
                      ),
                    ),
                    child: Center(
                      child: Text(
                        _dayShort[i],
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: selected ? Colors.white : AppTheme.textSecondary,
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 4),
          Expanded(child: _viewMode == 0 ? _buildTodayView() : _buildFullWeekView()),
        ],
      ),
    );
  }

  Widget _buildTodayView() {
    final day = _days[_selectedDayIndex];
    final dayEntries = _entriesForDay(day);

    if (dayEntries.isEmpty) {
      return ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        children: [
          _DayHeader(day: day),
          const SizedBox(height: 12),
          SizedBox(
            height: MediaQuery.of(context).size.height * 0.45,
            child: EmptyState(
              icon: Icons.event_busy,
              title: 'No classes on $day',
              description: 'Enjoy your free day — or pick another day above.',
            ),
          ),
        ],
      );
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      children: [
        _DayHeader(day: day),
        const SizedBox(height: 8),
        ...dayEntries.map((e) => _TimetableEntryCard(entry: e as Map<String, dynamic>)),
      ],
    );
  }

  Widget _buildFullWeekView() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      children: [
        for (final day in _days) ...[
          if (_entriesForDay(day).isNotEmpty) ...[
            _DayHeader(day: day),
            const SizedBox(height: 8),
            ..._entriesForDay(day)
                .map((e) => _TimetableEntryCard(entry: e as Map<String, dynamic>)),
            const SizedBox(height: 8),
          ],
        ],
      ],
    );
  }

  Widget _buildSkeleton() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      children: [
        // Toggle skeleton
        SkeletonBox(width: double.infinity, height: 36, radius: 10),
        const SizedBox(height: 12),
        // Chip row skeleton
        Row(
          children: List.generate(
            6,
            (i) => Padding(
              padding: EdgeInsets.only(right: i == 5 ? 0 : 8),
              child: SkeletonBox(width: 52, height: 32, radius: 20),
            ),
          ),
        ),
        const SizedBox(height: 16),
        for (int i = 0; i < 4; i++) ...[
          SkeletonBox(width: 120, height: 14, radius: 4),
          const SizedBox(height: 8),
          SkeletonBox(width: double.infinity, height: 56, radius: 12),
          const SizedBox(height: 12),
        ],
      ],
    );
  }
}

// =============================================================================
//  Supporting widgets
// =============================================================================

class _DayHeader extends StatelessWidget {
  final String day;
  const _DayHeader({required this.day});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 4, bottom: 4),
      child: Text(
        day,
        style: GoogleFonts.inter(
          fontSize: 13,
          fontWeight: FontWeight.w700,
          color: AppTheme.primary,
        ),
      ),
    );
  }
}

class _TimetableEntryCard extends StatelessWidget {
  final Map<String, dynamic> entry;
  const _TimetableEntryCard({required this.entry});

  @override
  Widget build(BuildContext context) {
    final subject = (entry['subject'] ?? entry['courseName'] ?? 'Class').toString();
    final start = (entry['startTime'] ?? '—').toString();
    final end = (entry['endTime'] ?? '—').toString();
    final room = (entry['room'] ?? '').toString();
    final className = (entry['className'] ?? '').toString();

    final subtitleParts = <String>[
      if (room.isNotEmpty) room,
      if (className.isNotEmpty) className,
    ];
    final subtitle = subtitleParts.join(' · ');

    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        child: Row(
          children: [
            Container(
              width: 4,
              height: 32,
              decoration: BoxDecoration(
                color: AppTheme.primary,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    subject,
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (subtitle.isNotEmpty)
                    Text(
                      subtitle,
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        color: AppTheme.textSecondary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Text(
              '$start - $end',
              style: GoogleFonts.inter(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppTheme.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ViewToggle extends StatelessWidget {
  final int selectedIndex;
  final ValueChanged<int> onChanged;
  const _ViewToggle({required this.selectedIndex, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.accent,
        borderRadius: BorderRadius.circular(10),
      ),
      padding: const EdgeInsets.all(3),
      child: Row(
        children: [
          Expanded(
            child: _toggleItem('Today', 0),
          ),
          Expanded(
            child: _toggleItem('Full Week', 1),
          ),
        ],
      ),
    );
  }

  Widget _toggleItem(String label, int index) {
    final selected = selectedIndex == index;
    return GestureDetector(
      onTap: () => onChanged(index),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: selected ? AppTheme.surface : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          boxShadow: selected ? AppTheme.shadowSm : null,
        ),
        child: Center(
          child: Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: selected ? AppTheme.primary : AppTheme.textSecondary,
            ),
          ),
        ),
      ),
    );
  }
}

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
            Text(
              'Something went wrong',
              style: GoogleFonts.inter(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              error,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted),
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
