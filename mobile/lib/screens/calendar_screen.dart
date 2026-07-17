import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:shimmer/shimmer.dart';
import '../services/api_client.dart';
import '../theme/app_theme.dart';

// =============================== HELPERS ===============================

/// Maps an event `type` string → brand color.
///   exam → danger (red)
///   holiday → warning (orange)
///   meeting → info (blue)
///   event → primary (navy)
///   default → gold
Color _typeColor(String type) {
  switch (type.toLowerCase()) {
    case 'exam':
      return AppTheme.danger;
    case 'holiday':
      return AppTheme.warning;
    case 'meeting':
      return AppTheme.info;
    case 'event':
      return AppTheme.primary;
    default:
      return AppTheme.gold;
  }
}

IconData _typeIcon(String type) {
  switch (type.toLowerCase()) {
    case 'exam':
      return Icons.edit_note_rounded;
    case 'holiday':
      return Icons.beach_access_outlined;
    case 'meeting':
      return Icons.groups_2_outlined;
    case 'event':
      return Icons.celebration_outlined;
    default:
      return Icons.event_outlined;
  }
}

DateTime? _parseDate(dynamic v) {
  if (v == null) return null;
  try {
    return DateTime.parse(v.toString());
  } catch (_) {
    return null;
  }
}

bool _sameDay(DateTime a, DateTime b) =>
    a.year == b.year && a.month == b.month && a.day == b.day;

const List<String> _kWeekdayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// =============================== SCREEN ===============================

/// Premium Calendar / Events screen for ESM.
///
/// Loads events from `GET /api/events?instituteId=...`. Falls back to a set of
/// static placeholder events for the current month when the request fails or
/// returns an empty list, so the calendar is never blank.
///
/// Navigable from any dashboard's quick actions:
///   `Navigator.push(context, MaterialPageRoute(builder: (_) => CalendarScreen(user: user)));`
class CalendarScreen extends StatefulWidget {
  final Map<String, dynamic> user;

  const CalendarScreen({super.key, required this.user});

  @override
  State<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends State<CalendarScreen> {
  late DateTime _focusedMonth; // 1st of the currently displayed month
  DateTime? _selectedDate;

  List<Map<String, dynamic>> _events = [];
  bool _isLoading = true;
  bool _usingFallback = false; // true when we're showing sample events

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _focusedMonth = DateTime(now.year, now.month, 1);
    _selectedDate = now;
    _load();
  }

  // ---------- Data ----------

  dynamic _instituteId() {
    final u = widget.user;
    final direct = u['instituteId'];
    if (direct != null) return direct;
    final nested = u['institute'];
    if (nested is Map) return nested['id'];
    return null;
  }

  Future<void> _load() async {
    setState(() {
      _isLoading = true;
      _usingFallback = false;
    });
    try {
      final inst = _instituteId();
      final List<dynamic> raw = await ApiClient.getList(
        'events',
        query: inst == null ? null : {'instituteId': inst.toString()},
      );
      final events = raw.whereType<Map>().map((m) => Map<String, dynamic>.from(m)).toList();
      if (!mounted) return;
      setState(() {
        _events = events;
        _usingFallback = false;
        _isLoading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _events = [];
        _usingFallback = false;
        _isLoading = false;
      });
    }
  }

  /// Static sample events anchored to the *current* real-world month so the
  /// calendar is never empty when the API is unreachable.
  List<Map<String, dynamic>> _placeholderEvents() {
    final now = DateTime.now();
    DateTime d(int day, [int hour = 9, int minute = 0]) =>
        DateTime(now.year, now.month, day, hour, minute);
    return [
      {
        'id': 'p1',
        'title': 'Mid-Term Mathematics Exam',
        'description': 'Chapters 4–7 · Calculator permitted',
        'type': 'exam',
        'startDate': d(8, 10, 0).toIso8601String(),
        'location': 'Hall A · Block 2',
        'branchId': null,
        'instituteId': null,
      },
      {
        'id': 'p2',
        'title': 'Annual Sports Day',
        'description': 'Inter-house athletics & ceremonies',
        'type': 'event',
        'startDate': d(12, 9, 0).toIso8601String(),
        'location': 'Main Ground',
        'branchId': null,
        'instituteId': null,
      },
      {
        'id': 'p3',
        'title': 'Parent-Teacher Meeting',
        'description': 'Term performance review',
        'type': 'meeting',
        'startDate': d(15, 14, 0).toIso8601String(),
        'location': 'Conference Room 1',
        'branchId': null,
        'instituteId': null,
      },
      {
        'id': 'p4',
        'title': 'Foundation Day Holiday',
        'description': 'Institute closed',
        'type': 'holiday',
        'startDate': d(20, 0, 0).toIso8601String(),
        'location': '—',
        'branchId': null,
        'instituteId': null,
      },
      {
        'id': 'p5',
        'title': 'Science Exhibition',
        'description': 'Class 9–12 project showcase',
        'type': 'event',
        'startDate': d(24, 11, 0).toIso8601String(),
        'location': 'Science Block',
        'branchId': null,
        'instituteId': null,
      },
      {
        'id': 'p6',
        'title': 'Faculty Strategy Meeting',
        'description': 'Q3 planning',
        'type': 'meeting',
        'startDate': d(28, 16, 0).toIso8601String(),
        'location': 'Boardroom',
        'branchId': null,
        'instituteId': null,
      },
    ];
  }

  // ---------- Queries ----------

  List<Map<String, dynamic>> _eventsOnDay(DateTime day) {
    return _events.where((e) {
      final d = _parseDate(e['startDate']);
      return d != null && _sameDay(d, day);
    }).toList();
  }

  List<Map<String, dynamic>> _upcomingEvents() {
    final now = DateTime.now();
    final list = _events.toList();
    list.sort((a, b) {
      final da = _parseDate(a['startDate']);
      final db = _parseDate(b['startDate']);
      if (da == null && db == null) return 0;
      if (da == null) return 1;
      if (db == null) return -1;
      return da.compareTo(db);
    });
    return list.where((e) {
      final d = _parseDate(e['startDate']);
      return d != null && d.isAfter(now);
    }).toList();
  }

  // ---------- Navigation ----------

  void _prevMonth() {
    setState(() {
      _focusedMonth = DateTime(_focusedMonth.year, _focusedMonth.month - 1, 1);
    });
  }

  void _nextMonth() {
    setState(() {
      _focusedMonth = DateTime(_focusedMonth.year, _focusedMonth.month + 1, 1);
    });
  }

  void _goToToday() {
    final now = DateTime.now();
    setState(() {
      _focusedMonth = DateTime(now.year, now.month, 1);
      _selectedDate = now;
    });
  }

  // ---------- Build ----------

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                gradient: AppTheme.navyGradient,
                borderRadius: BorderRadius.circular(10),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.primary.withOpacity(0.25),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: const Icon(
                Icons.calendar_month_rounded,
                color: Colors.white,
                size: 18,
              ),
            ),
            const SizedBox(width: 10),
            Text(
              'Calendar',
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: AppTheme.textPrimary,
                letterSpacing: -0.3,
              ),
            ),
          ],
        ),
        actions: [
          TextButton.icon(
            onPressed: _goToToday,
            icon: const Icon(Icons.today_outlined, size: 16),
            label: Text(
              'Today',
              style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700),
            ),
            style: TextButton.styleFrom(
              foregroundColor: AppTheme.primary,
              padding: const EdgeInsets.symmetric(horizontal: 10),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded, size: 20),
            onPressed: _load,
            tooltip: 'Refresh events',
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: _isLoading
          ? const _CalendarSkeleton()
          : RefreshIndicator(
              onRefresh: _load,
              color: AppTheme.primary,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
                children: [
                  if (_usingFallback) ...[
                    _buildOfflineBanner(),
                    const SizedBox(height: 12),
                  ],
                  _buildMonthCard(),
                  const SizedBox(height: 18),
                  _buildSelectedDaySection(),
                  const SizedBox(height: 22),
                  _buildUpcomingSection(),
                ],
              ),
            ),
    );
  }

  // ---------- Offline banner ----------

  Widget _buildOfflineBanner() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
      decoration: BoxDecoration(
        color: AppTheme.warning.withOpacity(0.10),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.warning.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          const Icon(Icons.cloud_off_outlined, size: 16, color: AppTheme.warning),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Couldn\'t reach the server — showing sample events for this month.',
              style: GoogleFonts.inter(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppTheme.warning,
              ),
            ),
          ),
          GestureDetector(
            onTap: _load,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: AppTheme.warning,
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                'Retry',
                style: GoogleFonts.inter(
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ---------- Month card (header + grid) ----------

  Widget _buildMonthCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.border),
        boxShadow: AppTheme.shadowSm,
      ),
      child: Column(
        children: [
          // Month header row
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppTheme.gold.withOpacity(0.14),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.event_note_rounded,
                  color: AppTheme.goldDark,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _monthTitle(_focusedMonth),
                      style: GoogleFonts.inter(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.primary,
                        letterSpacing: -0.3,
                      ),
                    ),
                    const SizedBox(height: 1),
                    Text(
                      _monthSubtitle(),
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        color: AppTheme.textMuted,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              _ChevronButton(
                icon: Icons.chevron_left_rounded,
                onTap: _prevMonth,
              ),
              const SizedBox(width: 6),
              _ChevronButton(
                icon: Icons.chevron_right_rounded,
                onTap: _nextMonth,
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Weekday header row
          Container(
            padding: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              color: AppTheme.accent.withOpacity(0.6),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: _kWeekdayHeaders
                  .map(
                    (d) => Expanded(
                      child: Center(
                        child: Text(
                          d,
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.textSecondary,
                            letterSpacing: 0.6,
                          ),
                        ),
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
          const SizedBox(height: 8),
          _buildCalendarGrid(),
        ],
      ),
    );
  }

  String _monthTitle(DateTime d) => DateFormat('MMMM y').format(d);

  String _monthSubtitle() {
    final count = _events
        .where((e) {
          final d = _parseDate(e['startDate']);
          return d != null &&
              d.year == _focusedMonth.year &&
              d.month == _focusedMonth.month;
        })
        .length;
    return '$count event${count == 1 ? '' : 's'} this month';
  }

  Widget _buildCalendarGrid() {
    final firstOfMonth = DateTime(_focusedMonth.year, _focusedMonth.month, 1);
    final daysInMonth =
        DateTime(_focusedMonth.year, _focusedMonth.month + 1, 0).day;
    // Monday-first offset: DateTime.weekday has Monday=1, Sunday=7.
    final offset = firstOfMonth.weekday - 1;
    final totalCells = ((offset + daysInMonth + 6) ~/ 7) * 7;
    final today = DateTime.now();

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: EdgeInsets.zero,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 7,
        childAspectRatio: 1.0,
        mainAxisSpacing: 4,
        crossAxisSpacing: 4,
      ),
      itemCount: totalCells,
      itemBuilder: (context, i) {
        final dayNum = i - offset + 1;
        final isOutOfMonth = dayNum < 1 || dayNum > daysInMonth;
        final date = DateTime(_focusedMonth.year, _focusedMonth.month, dayNum);
        final isToday = !isOutOfMonth && _sameDay(date, today);
        final isSelected = _selectedDate != null &&
            !isOutOfMonth &&
            _sameDay(date, _selectedDate!);
        final hasEvents = !isOutOfMonth && _eventsOnDay(date).isNotEmpty;
        return _DayCell(
          dayNumber: isOutOfMonth ? null : dayNum,
          isToday: isToday,
          isSelected: isSelected,
          isOutOfMonth: isOutOfMonth,
          hasEvents: hasEvents,
          onTap: isOutOfMonth
              ? null
              : () => setState(() => _selectedDate = date),
        );
      },
    );
  }

  // ---------- Selected day section ----------

  Widget _buildSelectedDaySection() {
    final selected = _selectedDate ?? DateTime.now();
    final events = _eventsOnDay(selected);
    final dateLabel = DateFormat('EEEE, MMMM d').format(selected);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              width: 4,
              height: 18,
              decoration: BoxDecoration(
                color: AppTheme.gold,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: RichText(
                text: TextSpan(
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.textPrimary,
                  ),
                  children: [
                    const TextSpan(text: 'Events on '),
                    TextSpan(
                      text: dateLabel,
                      style: GoogleFonts.inter(
                        color: AppTheme.primary,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.08),
                borderRadius: BorderRadius.circular(7),
              ),
              child: Text(
                '${events.length}',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.primary,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (events.isEmpty)
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: AppTheme.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: AppTheme.border,
                style: BorderStyle.solid,
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: AppTheme.accent,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.event_available_outlined,
                    size: 18,
                    color: AppTheme.textMuted,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'No events scheduled for this day.',
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      color: AppTheme.textMuted,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          )
        else
          ...events.map((e) => _EventCard(event: e)),
      ],
    );
  }

  // ---------- Upcoming events ----------

  Widget _buildUpcomingSection() {
    final upcoming = _upcomingEvents();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              width: 4,
              height: 18,
              decoration: BoxDecoration(
                color: AppTheme.primary,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              'Upcoming Events',
              style: GoogleFonts.inter(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(width: 8),
            Text(
              '${upcoming.length}',
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: AppTheme.textMuted,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 118,
          child: upcoming.isEmpty
              ? Container(
                  decoration: BoxDecoration(
                    color: AppTheme.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.border),
                  ),
                  alignment: Alignment.center,
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    'No upcoming events scheduled.',
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      color: AppTheme.textMuted,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                )
              : ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: EdgeInsets.zero,
                  itemCount: upcoming.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 10),
                  itemBuilder: (context, i) {
                    final e = upcoming[i];
                    return _UpcomingChip(
                      event: e,
                      onTap: () {
                        final d = _parseDate(e['startDate']);
                        if (d != null) {
                          setState(() {
                            _focusedMonth = DateTime(d.year, d.month, 1);
                            _selectedDate = d;
                          });
                        }
                      },
                    );
                  },
                ),
        ),
      ],
    );
  }
}

// =============================== DAY CELL ===============================

class _DayCell extends StatelessWidget {
  final int? dayNumber;
  final bool isToday;
  final bool isSelected;
  final bool isOutOfMonth;
  final bool hasEvents;
  final VoidCallback? onTap;

  const _DayCell({
    required this.dayNumber,
    required this.isToday,
    required this.isSelected,
    required this.isOutOfMonth,
    required this.hasEvents,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final hasNum = dayNumber != null;
    Color textColor = AppTheme.textPrimary;
    Color? dotColor = hasEvents ? AppTheme.gold : null;

    if (isOutOfMonth) {
      textColor = AppTheme.textMuted.withOpacity(0.45);
      dotColor = null;
    } else if (isToday) {
      textColor = Colors.white;
      dotColor = hasEvents ? Colors.white : null;
    } else if (isSelected) {
      textColor = AppTheme.primary;
    }

    final BoxDecoration deco;
    if (isOutOfMonth) {
      deco = const BoxDecoration();
    } else if (isToday) {
      deco = BoxDecoration(
        color: AppTheme.primary,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: AppTheme.primary.withOpacity(0.30),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      );
    } else if (isSelected) {
      deco = BoxDecoration(
        color: AppTheme.primary.withOpacity(0.07),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppTheme.primary, width: 1.5),
      );
    } else {
      deco = BoxDecoration(
        color: AppTheme.accent.withOpacity(0.45),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppTheme.border.withOpacity(0.6), width: 0.5),
      );
    }

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        decoration: deco,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              hasNum ? dayNumber.toString() : '',
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: isToday || isSelected ? FontWeight.w800 : FontWeight.w600,
                color: textColor,
              ),
            ),
            const SizedBox(height: 3),
            if (dotColor != null)
              Container(
                width: 5,
                height: 5,
                decoration: BoxDecoration(
                  color: dotColor,
                  shape: BoxShape.circle,
                ),
              )
            else
              const SizedBox(height: 5),
          ],
        ),
      ),
    );
  }
}

// =============================== EVENT CARD ===============================

class _EventCard extends StatelessWidget {
  final Map<String, dynamic> event;
  const _EventCard({required this.event});

  @override
  Widget build(BuildContext context) {
    final type = (event['type'] ?? 'event').toString();
    final color = _typeColor(type);
    final title = (event['title'] ?? 'Untitled Event').toString();
    final description = (event['description'] ?? '').toString();
    final location = (event['location'] ?? '—').toString();
    final date = _parseDate(event['startDate']);
    final timeStr = date != null ? DateFormat('h:mm a').format(date) : '—';

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border(
          left: BorderSide(color: color, width: 5),
          top: BorderSide(color: AppTheme.border, width: 1),
          right: BorderSide(color: AppTheme.border, width: 1),
          bottom: BorderSide(color: AppTheme.border, width: 1),
        ),
        boxShadow: AppTheme.shadowSm,
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 14, 14, 14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: color.withOpacity(0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(_typeIcon(type), size: 20, color: color),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          title,
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.textPrimary,
                            height: 1.3,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: color.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          type.toUpperCase(),
                          style: GoogleFonts.inter(
                            fontSize: 9,
                            fontWeight: FontWeight.w800,
                            color: color,
                            letterSpacing: 0.6,
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (description.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      description,
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        color: AppTheme.textSecondary,
                        height: 1.35,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 14,
                    runSpacing: 4,
                    children: [
                      _MetaPill(
                        icon: Icons.access_time_rounded,
                        text: timeStr,
                      ),
                      _MetaPill(
                        icon: Icons.location_on_outlined,
                        text: location,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MetaPill extends StatelessWidget {
  final IconData icon;
  final String text;
  const _MetaPill({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 12, color: AppTheme.textMuted),
        const SizedBox(width: 4),
        Text(
          text,
          style: GoogleFonts.inter(
            fontSize: 11,
            color: AppTheme.textSecondary,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}

// =============================== UPCOMING CHIP ===============================

class _UpcomingChip extends StatelessWidget {
  final Map<String, dynamic> event;
  final VoidCallback onTap;
  const _UpcomingChip({required this.event, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final type = (event['type'] ?? 'event').toString();
    final color = _typeColor(type);
    final date = _parseDate(event['startDate']);
    final dayStr = date != null ? DateFormat('d').format(date) : '—';
    final monStr =
        date != null ? DateFormat('MMM').format(date).toUpperCase() : '';
    final timeStr = date != null ? DateFormat('h:mm a').format(date) : '';
    final title = (event['title'] ?? 'Event').toString();

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 220,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppTheme.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.border),
          boxShadow: AppTheme.shadowSm,
        ),
        child: Row(
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [color, color.withOpacity(0.7)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    dayStr,
                    style: GoogleFonts.inter(
                      fontSize: 19,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                      height: 1.0,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    monStr,
                    style: GoogleFonts.inter(
                      fontSize: 8,
                      fontWeight: FontWeight.w800,
                      color: Colors.white.withOpacity(0.92),
                      letterSpacing: 0.6,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      type.toUpperCase(),
                      style: GoogleFonts.inter(
                        fontSize: 8,
                        fontWeight: FontWeight.w800,
                        color: color,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    title,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textPrimary,
                      height: 1.25,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.access_time_rounded,
                          size: 10, color: AppTheme.textMuted),
                      const SizedBox(width: 3),
                      Flexible(
                        child: Text(
                          timeStr,
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            color: AppTheme.textMuted,
                            fontWeight: FontWeight.w500,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// =============================== CHEVRON BUTTON ===============================

class _ChevronButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _ChevronButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppTheme.accent,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          width: 34,
          height: 34,
          alignment: Alignment.center,
          child: Icon(icon, size: 22, color: AppTheme.primary),
        ),
      ),
    );
  }
}

// =============================== SKELETON ===============================

class _CalendarSkeleton extends StatelessWidget {
  const _CalendarSkeleton();

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppTheme.border,
      highlightColor: AppTheme.accent,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Month card skeleton
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.border,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: AppTheme.accent,
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            height: 16,
                            width: 140,
                            decoration: BoxDecoration(
                              color: AppTheme.accent,
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                          const SizedBox(height: 6),
                          Container(
                            height: 10,
                            width: 90,
                            decoration: BoxDecoration(
                              color: AppTheme.accent,
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      width: 34,
                      height: 34,
                      decoration: BoxDecoration(
                        color: AppTheme.accent,
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      width: 34,
                      height: 34,
                      decoration: BoxDecoration(
                        color: AppTheme.accent,
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Container(
                  height: 28,
                  decoration: BoxDecoration(
                    color: AppTheme.accent,
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                const SizedBox(height: 12),
                // 5 rows of 7 cells
                ...List.generate(5, (r) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      children: List.generate(
                        7,
                        (c) => Expanded(
                          child: AspectRatio(
                            aspectRatio: 1.0,
                            child: Container(
                              margin: const EdgeInsets.symmetric(horizontal: 2),
                              decoration: BoxDecoration(
                                color: AppTheme.accent,
                                borderRadius: BorderRadius.circular(10),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                }),
              ],
            ),
          ),
          const SizedBox(height: 18),
          Container(
            height: 18,
            width: 200,
            decoration: BoxDecoration(
              color: AppTheme.border,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(height: 12),
          Container(
            height: 90,
            decoration: BoxDecoration(
              color: AppTheme.border,
              borderRadius: BorderRadius.circular(16),
            ),
          ),
          const SizedBox(height: 10),
          Container(
            height: 90,
            decoration: BoxDecoration(
              color: AppTheme.border,
              borderRadius: BorderRadius.circular(16),
            ),
          ),
        ],
      ),
    );
  }
}
