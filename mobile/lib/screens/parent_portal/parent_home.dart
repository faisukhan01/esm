import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';
import '../student_portal/student_announcements.dart';

/// Parent mobile portal — mirrors the PGC Parent App.
/// 4-tab bottom nav: Ward / Attendance / Fees / Announcements.
class ParentHome extends StatefulWidget {
  final Map<String, dynamic> user;
  const ParentHome({super.key, required this.user});

  @override
  State<ParentHome> createState() => _ParentHomeState();
}

class _ParentHomeState extends State<ParentHome> {
  int _currentIndex = 0;

  late final List<Widget> _screens;

  @override
  void initState() {
    super.initState();
    _screens = [
      _WardTab(user: widget.user),
      _WardAttendanceTab(user: widget.user),
      _WardFeesTab(user: widget.user),
      StudentAnnouncements(user: widget.user),
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
          BottomNavigationBarItem(icon: Icon(Icons.child_care_outlined), activeIcon: Icon(Icons.child_care), label: 'Ward'),
          BottomNavigationBarItem(icon: Icon(Icons.event_available_outlined), activeIcon: Icon(Icons.event_available), label: 'Attendance'),
          BottomNavigationBarItem(icon: Icon(Icons.receipt_long_outlined), activeIcon: Icon(Icons.receipt_long), label: 'Fees'),
          BottomNavigationBarItem(icon: Icon(Icons.campaign_outlined), activeIcon: Icon(Icons.campaign), label: 'Notices'),
        ],
      ),
    );
  }
}

// =============================== HELPERS ===============================

String _wardName(Map<String, dynamic> user) =>
    (user['wardName'] ?? user['childName'] ?? user['name'] ?? 'Ward').toString();
String _wardId(Map<String, dynamic> user) =>
    (user['wardId'] ?? user['studentId'] ?? user['id'] ?? '').toString();
String _wardClass(Map<String, dynamic> user) =>
    (user['wardClass'] ?? user['class'] ?? '—').toString();
String _wardSection(Map<String, dynamic> user) =>
    (user['wardSection'] ?? user['section'] ?? '').toString();
String _wardRoll(Map<String, dynamic> user) =>
    (user['wardRollNo'] ?? user['rollNo'] ?? '—').toString();
String _wardPhoto(Map<String, dynamic> user) =>
    (user['wardPhoto'] ?? user['photo'] ?? '').toString();

// =============================== WARD TAB ===============================

class _WardTab extends StatefulWidget {
  final Map<String, dynamic> user;
  const _WardTab({required this.user});

  @override
  State<_WardTab> createState() => _WardTabState();
}

class _WardTabState extends State<_WardTab> with AutomaticKeepAliveClientMixin {
  Map<String, dynamic>? _analytics;
  List<dynamic> _invoices = [];
  List<dynamic> _results = [];
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
      final wid = _wardId(widget.user);
      // Fetch in parallel; tolerate per-endpoint failures so the ward card still renders.
      final results = await Future.wait([
        ApiClient.getObject('student/analytics', query: {'studentId': wid}).catchError((_) => <String, dynamic>{}),
        ApiClient.getList('fee-invoices', query: {'studentId': wid}).catchError((_) => <dynamic>[]),
        ApiClient.getList('results', query: {'studentId': wid}).catchError((_) => <dynamic>[]),
      ]);
      if (mounted) {
        setState(() {
          _analytics = results[0] is Map<String, dynamic> ? results[0] as Map<String, dynamic> : <String, dynamic>{};
          _invoices = (results[1] as List).whereType<Map<String, dynamic>>().toList();
          _results = (results[2] as List).whereType<Map<String, dynamic>>().toList();
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  @override
  bool get wantKeepAlive => true;

  String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts.first.isEmpty) return '?';
    final first = parts.first[0];
    final last = parts.length > 1 && parts.last.isNotEmpty ? parts.last[0] : '';
    return (first + last).toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final name = _wardName(widget.user);
    final cls = _wardClass(widget.user);
    final section = _wardSection(widget.user);
    final roll = _wardRoll(widget.user);
    final photo = _wardPhoto(widget.user);

    final present = num.tryParse('${_analytics?['present'] ?? _analytics?['attendancePresent'] ?? 0}') ?? 0;
    final total = num.tryParse('${_analytics?['total'] ?? _analytics?['attendanceTotal'] ?? 0}') ?? 0;
    final rate = total > 0 ? ((present / total) * 100).round() : 0;
    final pendingFees = _invoices.where((i) => (i['status'] ?? '').toString().toLowerCase() != 'paid').length;
    final latestResult = _results.isNotEmpty ? _results.first : null;
    final grade = (latestResult?['grade'] ?? latestResult?['result'] ?? '—').toString();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Ward'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh, size: 20), onPressed: _load),
          IconButton(
            icon: const Icon(Icons.logout, size: 20),
            onPressed: () async {
              await ApiClient.logout();
              if (context.mounted) Navigator.pushNamedAndRemoveUntil(context, '/', (_) => false);
            },
          ),
        ],
      ),
      body: _isLoading
          ? const DashboardSkeleton()
          : _error != null
              ? _ErrorView(error: _error!, onRetry: _load)
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      _wardHero(name, cls, section, roll, photo),
                      const SizedBox(height: 16),
                      GridView.count(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        crossAxisCount: 2,
                        mainAxisSpacing: 12,
                        crossAxisSpacing: 12,
                        childAspectRatio: 1.4,
                        children: [
                          PremiumStatCard(
                            icon: Icons.event_available,
                            label: 'Attendance',
                            value: '$rate%',
                            subtitle: '$present / $total days',
                            color: rate >= 75 ? AppTheme.success : AppTheme.danger,
                          ),
                          PremiumStatCard(
                            icon: Icons.receipt_long,
                            label: 'Pending Fees',
                            value: '$pendingFees',
                            subtitle: pendingFees == 0 ? 'All clear' : 'Due',
                            color: pendingFees == 0 ? AppTheme.success : AppTheme.warning,
                          ),
                          PremiumStatCard(
                            icon: Icons.grade,
                            label: 'Latest Grade',
                            value: grade,
                            subtitle: latestResult != null ? 'Latest result' : 'No result',
                            color: AppTheme.gold,
                          ),
                          PremiumStatCard(
                            icon: Icons.class_,
                            label: 'Class',
                            value: cls,
                            subtitle: section.isEmpty ? 'Section —' : 'Section $section',
                            color: AppTheme.primary,
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      const SectionHeader(title: 'Quick Overview', icon: Icons.insights_outlined),
                      const SizedBox(height: 10),
                      _overviewCard(rate, pendingFees, grade),
                      const SizedBox(height: 20),
                    ],
                  ),
                ),
    );
  }

  Widget _wardHero(String name, String cls, String section, String roll, String photo) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [AppTheme.primary, AppTheme.primaryLight], begin: Alignment.topLeft, end: Alignment.bottomRight),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Container(
            width: 56, height: 56,
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white.withOpacity(0.6), width: 2),
            ),
            child: photo.isNotEmpty
                ? ClipOval(child: Image.network(photo, fit: BoxFit.cover, errorBuilder: (_, __, ___) => _initialsAvatar(name)))
                : _initialsAvatar(name),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, maxLines: 1, overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700, color: Colors.white)),
                const SizedBox(height: 4),
                Text('Class $cls${section.isNotEmpty ? ' · Section $section' : ''}',
                    style: GoogleFonts.inter(fontSize: 12, color: Colors.white.withOpacity(0.85))),
                const SizedBox(height: 2),
                Text('Roll #$roll',
                    style: GoogleFonts.inter(fontSize: 11, color: Colors.white.withOpacity(0.7))),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _initialsAvatar(String name) {
    return Center(
      child: Text(_initials(name), style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w800, color: AppTheme.primary)),
    );
  }

  Widget _overviewCard(int rate, int pendingFees, String grade) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
        boxShadow: AppTheme.shadowSm,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _overviewRow(
            icon: Icons.event_available,
            color: rate >= 75 ? AppTheme.success : AppTheme.danger,
            title: 'Attendance this month',
            value: '$rate%',
          ),
          const Divider(height: 20),
          _overviewRow(
            icon: Icons.receipt_long,
            color: pendingFees == 0 ? AppTheme.success : AppTheme.warning,
            title: 'Pending fee invoices',
            value: '$pendingFees',
          ),
          const Divider(height: 20),
          _overviewRow(
            icon: Icons.grade,
            color: AppTheme.gold,
            title: 'Latest result grade',
            value: grade,
          ),
        ],
      ),
    );
  }

  Widget _overviewRow({required IconData icon, required Color color, required String title, required String value}) {
    return Row(
      children: [
        Container(
          width: 32, height: 32,
          decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
          child: Icon(icon, size: 16, color: color),
        ),
        const SizedBox(width: 12),
        Expanded(child: Text(title, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textPrimary))),
        Text(value, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w800, color: color)),
      ],
    );
  }
}

// =============================== ATTENDANCE TAB ===============================

class _WardAttendanceTab extends StatefulWidget {
  final Map<String, dynamic> user;
  const _WardAttendanceTab({required this.user});

  @override
  State<_WardAttendanceTab> createState() => _WardAttendanceTabState();
}

class _WardAttendanceTabState extends State<_WardAttendanceTab> with AutomaticKeepAliveClientMixin {
  DateTime _month = DateTime(DateTime.now().year, DateTime.now().month);
  Map<String, dynamic>? _data;
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
      final wid = _wardId(widget.user);
      final monthStr = DateFormat('yyyy-MM').format(_month);
      final r = await ApiClient.getObject('attendance', query: {'studentId': wid, 'month': monthStr});
      if (mounted) setState(() { _data = r; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  void _changeMonth(int delta) {
    setState(() {
      _month = DateTime(_month.year, _month.month + delta);
      _data = null;
      _isLoading = true;
    });
    _load();
  }

  @override
  bool get wantKeepAlive => true;

  List<Map<String, dynamic>> get _entries {
    final raw = _data?['entries'];
    if (raw is! List) return const [];
    return raw.whereType<Map<String, dynamic>>().toList();
  }

  String _statusFor(DateTime day) {
    for (final e in _entries) {
      final d = (e['date'] ?? e['day'] ?? '').toString();
      try {
        final dt = DateTime.parse(d);
        if (dt.year == day.year && dt.month == day.month && dt.day == day.day) {
          return (e['status'] ?? 'present').toString().toLowerCase();
        }
      } catch (_) {}
    }
    return 'none';
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final present = _entries.where((e) => (e['status'] ?? '').toString().toLowerCase() == 'present').length;
    final absent = _entries.where((e) => (e['status'] ?? '').toString().toLowerCase() == 'absent').length;
    final late = _entries.where((e) => (e['status'] ?? '').toString().toLowerCase() == 'late').length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Attendance'),
        actions: [
          IconButton(icon: const Icon(Icons.chevron_left, size: 22), onPressed: () => _changeMonth(-1)),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Center(child: Text(DateFormat('MMM yyyy').format(_month),
                style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.textPrimary))),
          ),
          IconButton(icon: const Icon(Icons.chevron_right, size: 22), onPressed: () => _changeMonth(1)),
          IconButton(icon: const Icon(Icons.refresh, size: 20), onPressed: _load),
        ],
      ),
      body: _isLoading
          ? _buildSkeleton()
          : _error != null
              ? _ErrorView(error: _error!, onRetry: _load)
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      // Summary stats
                      GridView.count(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        crossAxisCount: 3,
                        mainAxisSpacing: 10,
                        crossAxisSpacing: 10,
                        childAspectRatio: 1.4,
                        children: [
                          PremiumStatCard(icon: Icons.check_circle, label: 'Present', value: '$present', color: AppTheme.success),
                          PremiumStatCard(icon: Icons.cancel, label: 'Absent', value: '$absent', color: AppTheme.danger),
                          PremiumStatCard(icon: Icons.schedule, label: 'Late', value: '$late', color: AppTheme.warning),
                        ],
                      ),
                      const SizedBox(height: 20),
                      // Calendar grid
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: AppTheme.surface,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppTheme.border),
                          boxShadow: AppTheme.shadowSm,
                        ),
                        child: _calendarGrid(),
                      ),
                      const SizedBox(height: 16),
                      // Legend
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          _legendDot(AppTheme.success, 'Present'),
                          const SizedBox(width: 14),
                          _legendDot(AppTheme.danger, 'Absent'),
                          const SizedBox(width: 14),
                          _legendDot(AppTheme.warning, 'Late'),
                        ],
                      ),
                    ],
                  ),
                ),
    );
  }

  Widget _buildSkeleton() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: List.generate(3, (_) => const Padding(
        padding: EdgeInsets.only(bottom: 10),
        child: SkeletonBox(width: double.infinity, height: 100),
      )),
    );
  }

  Widget _legendDot(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(width: 10, height: 10, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 5),
        Text(label, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textSecondary)),
      ],
    );
  }

  Widget _calendarGrid() {
    final firstOfMonth = DateTime(_month.year, _month.month, 1);
    final firstWeekday = (firstOfMonth.weekday - 1) % 7; // Mon=0 ... Sun=6 (Mon-first grid)
    final daysInMonth = DateTime(_month.year, _month.month + 1, 0).day;
    final today = DateTime.now();
    const weekHeaders = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    return Column(
      children: [
        Row(
          children: weekHeaders.map((d) => Expanded(
            child: Center(child: Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Text(d, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.textMuted)),
            )),
          )).toList(),
        ),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 7,
            mainAxisSpacing: 6,
            crossAxisSpacing: 6,
            childAspectRatio: 1,
          ),
          itemCount: firstWeekday + daysInMonth,
          itemBuilder: (context, i) {
            if (i < firstWeekday) return const SizedBox();
            final day = i - firstWeekday + 1;
            final date = DateTime(_month.year, _month.month, day);
            final status = _statusFor(date);
            final isToday = date.year == today.year && date.month == today.month && date.day == today.day;
            Color bg = AppTheme.background;
            Color fg = AppTheme.textSecondary;
            if (status == 'present') { bg = AppTheme.success.withOpacity(0.15); fg = AppTheme.success; }
            else if (status == 'absent') { bg = AppTheme.danger.withOpacity(0.15); fg = AppTheme.danger; }
            else if (status == 'late') { bg = AppTheme.warning.withOpacity(0.15); fg = AppTheme.warning; }

            return Container(
              decoration: BoxDecoration(
                color: bg,
                borderRadius: BorderRadius.circular(8),
                border: isToday ? Border.all(color: AppTheme.primary, width: 1.5) : null,
              ),
              child: Center(
                child: Text('$day', style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: isToday ? FontWeight.w800 : FontWeight.w600,
                  color: isToday ? AppTheme.primary : fg,
                )),
              ),
            );
          },
        ),
      ],
    );
  }
}

// =============================== FEES TAB ===============================

class _WardFeesTab extends StatefulWidget {
  final Map<String, dynamic> user;
  const _WardFeesTab({required this.user});

  @override
  State<_WardFeesTab> createState() => _WardFeesTabState();
}

class _WardFeesTabState extends State<_WardFeesTab> with AutomaticKeepAliveClientMixin {
  List<dynamic> _invoices = [];
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
      final wid = _wardId(widget.user);
      final list = await ApiClient.getList('fee-invoices', query: {'studentId': wid});
      if (mounted) setState(() { _invoices = list; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  @override
  bool get wantKeepAlive => true;

  String _fmtMoney(dynamic n) {
    final v = double.tryParse('$n') ?? 0;
    return NumberFormat('##,###').format(v.toInt());
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

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final paid = _invoices.where((i) => (i['status'] ?? '').toString().toLowerCase() == 'paid').length;
    final unpaid = _invoices.length - paid;
    final totalAmount = _invoices.fold<double>(0, (sum, i) => sum + (double.tryParse('${i['amount'] ?? 0}') ?? 0));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Fee Invoices'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh, size: 20), onPressed: _load),
        ],
      ),
      body: _isLoading
          ? _buildSkeleton()
          : _error != null
              ? _ErrorView(error: _error!, onRetry: _load)
              : _invoices.isEmpty
                  ? const EmptyState(
                      icon: Icons.receipt_long_outlined,
                      title: 'No invoices',
                      description: 'Your ward\'s fee invoices will appear here.',
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView(
                        padding: const EdgeInsets.only(top: 12, bottom: 24),
                        children: [
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Row(
                              children: [
                                Expanded(child: KpiCard(icon: Icons.receipt, label: 'Total', value: '${_invoices.length}')),
                                const SizedBox(width: 8),
                                Expanded(child: KpiCard(icon: Icons.check_circle, label: 'Paid', value: '$paid', iconColor: AppTheme.success)),
                                const SizedBox(width: 8),
                                Expanded(child: KpiCard(icon: Icons.pending, label: 'Unpaid', value: '$unpaid', iconColor: AppTheme.danger)),
                              ],
                            ),
                          ),
                          const SizedBox(height: 8),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: KpiCard(icon: Icons.account_balance_wallet, label: 'Total Billed', value: 'PKR ${_fmtMoney(totalAmount)}'),
                          ),
                          const SizedBox(height: 12),
                          ..._invoices.map((inv) {
                            final status = (inv['status'] ?? 'Unpaid').toString();
                            final amount = double.tryParse('${inv['amount'] ?? 0}') ?? 0;
                            final month = inv['month'] ?? '—';
                            final year = inv['year'] ?? '';
                            final type = inv['type'] ?? 'Tuition';
                            final isUnpaid = status.toLowerCase() != 'paid';
                            return _PremiumListCard(
                              icon: Icons.receipt_outlined,
                              iconColor: isUnpaid ? AppTheme.danger : AppTheme.success,
                              title: '$type · $month $year',
                              subtitle: 'PKR ${_fmtMoney(amount)}',
                              trailing: StatusBadge(text: status, status: status.toLowerCase()),
                              extra: isUnpaid
                                  ? Align(
                                      alignment: Alignment.centerRight,
                                      child: ElevatedButton.icon(
                                        onPressed: () => _snack('Redirecting to payment…', AppTheme.primary),
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: AppTheme.primary,
                                          foregroundColor: Colors.white,
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                        ),
                                        icon: const Icon(Icons.payment, size: 14),
                                        label: Text('Pay Now', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700)),
                                      ),
                                    )
                                  : null,
                            );
                          }),
                        ],
                      ),
                    ),
    );
  }

  Widget _buildSkeleton() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: List.generate(4, (_) => const Padding(
        padding: EdgeInsets.only(bottom: 10),
        child: SkeletonBox(width: double.infinity, height: 90),
      )),
    );
  }
}

// =============================== PREMIUM LIST CARD (file-scoped) ===============================

class _PremiumListCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;
  final Widget? extra;

  const _PremiumListCard({
    required this.icon,
    required this.iconColor,
    required this.title,
    this.subtitle,
    this.trailing,
    this.onTap,
    this.extra,
  });

  @override
  Widget build(BuildContext context) {
    final trimmed = title.trim();
    final parts = trimmed.split(RegExp(r'\s+'));
    final initial = parts.isNotEmpty && parts.first.isNotEmpty ? parts.first[0].toUpperCase() : '?';
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 40, height: 40,
                    decoration: BoxDecoration(color: iconColor.withOpacity(0.12), shape: BoxShape.circle),
                    child: Center(
                      child: trimmed.isEmpty
                          ? Icon(icon, size: 18, color: iconColor)
                          : Text(initial, style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w800, color: iconColor)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(title, maxLines: 1, overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
                        if (subtitle != null && subtitle!.trim().isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 2),
                            child: Text(subtitle!, maxLines: 2, overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textSecondary)),
                          ),
                      ],
                    ),
                  ),
                  if (trailing != null) ...[
                    const SizedBox(width: 8),
                    trailing!,
                  ],
                ],
              ),
              if (extra != null) ...[
                const SizedBox(height: 10),
                extra!,
              ],
            ],
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
