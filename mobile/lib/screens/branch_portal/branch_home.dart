import 'package:intl/intl.dart';
import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';
import 'branch_user_detail.dart';
import 'branch_attendance.dart';
import 'branch_results.dart';
import 'branch_events.dart';
import '../notifications_screen.dart';
import '../profile_screen.dart';
import '../announcements_screen.dart';
import '../../widgets/update_banner.dart';
import '../calendar_screen.dart';
import '../shared/complaint_portal.dart';

// =============================== PREMIUM LIST CARD (file-scoped) ===============================

/// Standardised premium list-row card used across the branch admin tables.
/// Card with elevation 0, BorderRadius 14, symmetric margin (h:16, v:6), padding 14.
/// Leading 40×40 circular avatar with the entity's initial letter, colored with
/// `iconColor.withOpacity(0.12)` background and `iconColor` foreground.
/// Trailing slot for status badges / count chips / chevron.
class _PremiumListCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;
  final Widget? extra;
  final Widget? leadingOverride;

  const _PremiumListCard({
    required this.icon,
    required this.iconColor,
    required this.title,
    this.subtitle,
    this.trailing,
    this.onTap,
    this.extra,
    this.leadingOverride,
  });

  @override
  Widget build(BuildContext context) {
    final trimmed = title.trim();
    final parts = trimmed.split(RegExp(r'\s+'));
    final initial = parts.isNotEmpty && parts.first.isNotEmpty
        ? parts.first[0].toUpperCase()
        : '?';
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
                  leadingOverride ??
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: iconColor.withOpacity(0.12),
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: trimmed.isEmpty
                              ? Icon(icon, size: 18, color: iconColor)
                              : Text(
                                  initial,
                                  style: GoogleFonts.inter(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w800,
                                    color: iconColor,
                                  ),
                                ),
                        ),
                      ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                        if (subtitle != null && subtitle!.trim().isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 2),
                            child: Text(
                              subtitle!,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                color: AppTheme.textSecondary,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                  if (trailing != null) ...[
                    const SizedBox(width: 8),
                    trailing!,
                  ],
                  if (onTap != null) ...[
                    const SizedBox(width: 4),
                    const Icon(Icons.chevron_right, size: 18, color: AppTheme.textMuted),
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

class BranchHome extends StatefulWidget {
  final Map<String, dynamic> user;
  const BranchHome({super.key, required this.user});

  @override
  State<BranchHome> createState() => _BranchHomeState();
}

class _BranchHomeState extends State<BranchHome> {
  int _currentIndex = 0;
  Map<String, dynamic>? _finance;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final finance = await ApiClient.getObject('branch/finance', query: {'branchId': widget.user['branchId']});
      if (mounted) setState(() { _finance = finance; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final kpi = _finance?['kpi'] ?? {};
    final name = widget.user['name']?.split(' ').first ?? 'Manager';
    final branchName = widget.user['branchName'] ?? '';

    final screens = [
      _BranchDashboard(name: name, branchName: branchName, kpi: kpi, isLoading: _isLoading, onRefresh: _loadData, user: widget.user, onNavigate: (i) => setState(() => _currentIndex = i)),
      _ClassesTab(user: widget.user),
      _TeachersTab(user: widget.user),
      _StudentsTab(user: widget.user),
      _TimetableTab(user: widget.user),
      _FeesTab(user: widget.user),
    ];

    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: screens),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (i) => setState(() => _currentIndex = i),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard_outlined), activeIcon: Icon(Icons.dashboard), label: 'Dashboard'),
          BottomNavigationBarItem(icon: Icon(Icons.class_outlined), activeIcon: Icon(Icons.class_), label: 'Classes'),
          BottomNavigationBarItem(icon: Icon(Icons.group_outlined), activeIcon: Icon(Icons.group), label: 'Teachers'),
          BottomNavigationBarItem(icon: Icon(Icons.school_outlined), activeIcon: Icon(Icons.school), label: 'Students'),
          BottomNavigationBarItem(icon: Icon(Icons.calendar_month_outlined), activeIcon: Icon(Icons.calendar_month), label: 'Timetable'),
          BottomNavigationBarItem(icon: Icon(Icons.receipt_outlined), activeIcon: Icon(Icons.receipt), label: 'Fees'),
        ],
      ),
    );
  }
}

// =============================== DASHBOARD ===============================

class _BranchDashboard extends StatefulWidget {
  final String name;
  final String branchName;
  final Map<String, dynamic> kpi;
  final bool isLoading;
  final VoidCallback onRefresh;
  final Map<String, dynamic> user;
  final void Function(int tabIndex)? onNavigate;

  const _BranchDashboard({
    required this.name,
    required this.branchName,
    required this.kpi,
    required this.isLoading,
    required this.onRefresh,
    required this.user,
    this.onNavigate,
  });

  @override
  State<_BranchDashboard> createState() => _BranchDashboardState();
}

class _BranchDashboardState extends State<_BranchDashboard> {
  Map<String, dynamic>? _finance;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    // Check cache first — instant render if we have data
    final cached = ApiClient.getCached('branch/finance', {'branchId': widget.user['branchId']});
    if (cached != null) {
      _finance = cached is Map<String, dynamic> ? cached : {};
      _loading = false;
    }
    _loadFinance();
  }

  Future<void> _loadFinance() async {
    if (!mounted) return;
    setState(() => _loading = true);
    try {
      final res = await ApiClient.getObject(
        'branch/finance',
        query: {'branchId': widget.user['branchId']},
      );
      if (mounted) setState(() { _finance = res; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _refresh() async {
    widget.onRefresh();
    await _loadFinance();
  }

  String _fmt(dynamic n) {
    final v = num.tryParse('${n ?? 0}') ?? 0;
    return NumberFormat('##,###').format(v.toInt());
  }

  Map<String, dynamic> get _kpi =>
      (_finance?['kpi'] ?? widget.kpi ?? const {}) as Map<String, dynamic>;

  /// Last 6 entries of `monthlyRevenue` (newest last for the chart's X axis).
  List<Map<String, dynamic>> get _monthly {
    final raw = _finance?['monthlyRevenue'];
    if (raw is! List) return const [];
    final list = raw.cast<Map<String, dynamic>>();
    if (list.length > 6) return list.sublist(list.length - 6);
    return list;
  }

  /// First 3 recent transactions (or empty so we fall back to placeholders).
  List<Map<String, dynamic>> get _recent {
    final raw = _finance?['recentTransactions'];
    if (raw is! List || raw.isEmpty) return const [];
    return raw.take(3).cast<Map<String, dynamic>>().toList();
  }

  List<double> get _revenueSeries => _monthly
      .map((e) => (num.tryParse('${e['revenue'] ?? 0}') ?? 0).toDouble())
      .toList();

  @override
  Widget build(BuildContext context) {
    final showSkeleton = widget.isLoading && _loading;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.campaign_outlined, size: 22),
            tooltip: 'Announcements',
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => AnnouncementsScreen(user: widget.user))),
          ),
          IconButton(
            icon: const Icon(Icons.notifications_none_rounded, size: 22),
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => NotificationsScreen(user: widget.user))),
          ),
          IconButton(
            icon: const Icon(Icons.settings_outlined, size: 20),
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ProfileScreen(user: widget.user))),
          ),
          IconButton(
            icon: const Icon(Icons.logout, size: 20),
            onPressed: () async {
              await ApiClient.logout();
              if (context.mounted) {
                Navigator.pushNamedAndRemoveUntil(context, '/', (_) => false);
              }
            },
          ),
        ],
      ),
      body: showSkeleton
          ? const DashboardSkeleton()
          : RefreshIndicator(
              color: AppTheme.primary,
              onRefresh: _refresh,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  const UpdateBanner(),
                  _hero(),
                  const SizedBox(height: 16),
                  _statGrid(),
                  const SizedBox(height: 16),
                  _revenueTrend(),
                  const SizedBox(height: 16),
                  _feeCollection(),
                  const SizedBox(height: 20),
                  const SectionHeader(title: 'Quick Actions'),
                  const SizedBox(height: 10),
                  _quickActions(),
                  if (_recent.isNotEmpty) ...[
                    const SizedBox(height: 20),
                    const SectionHeader(title: 'Recent Activity'),
                    const SizedBox(height: 8),
                    _recentActivity(),
                  ],
                  const SizedBox(height: 24),
                ],
              ),
            ),
    );
  }

  // ---- (a) Hero ---------------------------------------------------------
  Widget _hero() {
    return GradientHeroCard(
      title: 'Hi, ${widget.name}!',
      subtitle: 'Branch Manager · ${widget.branchName}',
      icon: Icons.store,
      gradientColors: const [AppTheme.primary, AppTheme.primaryLight],
      metric: 'PKR ${_fmt(_kpi['totalRevenue'])}',
      metricLabel: 'Total Revenue',
    );
  }

  // ---- (b) 2x2 stat grid ------------------------------------------------
  Widget _statGrid() {
    final netBalance = num.tryParse('${_kpi['netBalance'] ?? 0}') ?? 0;
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 1.3,
      children: [
        PremiumStatCard(
          icon: Icons.trending_up,
          label: 'Revenue',
          value: 'PKR ${_fmt(_kpi['totalRevenue'])}',
          color: AppTheme.success,
        ),
        PremiumStatCard(
          icon: Icons.error_outline,
          label: 'Pending Fees',
          value: 'PKR ${_fmt(_kpi['pendingFees'])}',
          color: AppTheme.danger,
        ),
        PremiumStatCard(
          icon: Icons.wallet,
          label: 'Salary Paid',
          value: 'PKR ${_fmt(_kpi['totalSalaryPaid'])}',
          color: AppTheme.info,
        ),
        PremiumStatCard(
          icon: Icons.balance,
          label: 'Net Balance',
          value: 'PKR ${_fmt(_kpi['netBalance'])}',
          color: netBalance >= 0 ? AppTheme.success : AppTheme.danger,
        ),
      ],
    );
  }

  // ---- (c) Revenue Trend line chart -------------------------------------
  Widget _revenueTrend() {
    final series = _revenueSeries;
    final months = _monthly
        .map((e) => (e['month'] ?? '').toString().trim())
        .map((m) => m.isEmpty ? m : m.substring(0, m.length >= 3 ? 3 : m.length))
        .toList();
    return ChartCard(
      title: 'Revenue Trend',
      subtitle: months.isEmpty ? 'No data yet' : 'Last ${months.length} months',
      height: 180,
      chart: series.isEmpty
          ? Center(
              child: Text(
                'No revenue data yet',
                style: GoogleFonts.inter(
                    fontSize: 12, color: AppTheme.textMuted),
              ),
            )
          : LineChart(
              LineChartData(
                minY: 0,
                gridData: const FlGridData(show: false),
                titlesData: FlTitlesData(
                  leftTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false)),
                  rightTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false)),
                  topTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false)),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 28,
                      getTitlesWidget: (value, meta) {
                        final idx = value.toInt();
                        if (idx < 0 || idx >= months.length) {
                          return const SizedBox.shrink();
                        }
                        return Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Text(
                            months[idx],
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              color: AppTheme.textMuted,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
                borderData: FlBorderData(show: false),
                lineBarsData: [
                  LineChartBarData(
                    spots: List.generate(
                        series.length, (i) => FlSpot(i.toDouble(), series[i])),
                    isCurved: true,
                    curveSmoothness: 0.4,
                    color: AppTheme.primary,
                    barWidth: 3,
                    dotData: const FlDotData(show: false),
                    belowBarData: BarAreaData(
                      show: true,
                      gradient: LinearGradient(
                        colors: [
                          AppTheme.primary.withOpacity(0.45),
                          AppTheme.primary.withOpacity(0.12),
                          AppTheme.primary.withOpacity(0.0),
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),
                ],
                lineTouchData: LineTouchData(
                  touchTooltipData: LineTouchTooltipData(
                    getTooltipColor: (_) => AppTheme.primary,
                    getTooltipItems: (spots) => spots
                        .map((s) => LineTooltipItem(
                              'PKR ${_fmt(series[s.spotIndex])}',
                              GoogleFonts.inter(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: Colors.white,
                              ),
                            ))
                        .toList(),
                  ),
                ),
              ),
            ),
    );
  }

  // ---- (d) Fee Collection card (auto-height custom layout) -------------
  Widget _feeCollection() {
    final paid = num.tryParse('${_kpi['paidInvoices'] ?? 0}') ?? 0;
    final total = num.tryParse('${_kpi['totalInvoices'] ?? 0}') ?? 0;
    final ratio = total > 0 ? (paid / total).clamp(0.0, 1.0) : 0.0;
    final pct = (ratio * 100).round();
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
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Fee Collection',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '$pct% collected',
                      style: GoogleFonts.inter(
                          fontSize: 11, color: AppTheme.textMuted),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Collected $paid of $total',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textPrimary,
                ),
              ),
              Text(
                '$pct%',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: ratio,
              minHeight: 10,
              backgroundColor: AppTheme.accent,
              valueColor:
                  const AlwaysStoppedAnimation<Color>(AppTheme.primary),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: AppTheme.danger,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 6),
              Text(
                'Pending: PKR ${_fmt(_kpi['pendingFees'])}',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.danger,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ---- (e) Quick Actions 2x2 grid ---------------------------------------
  Widget _quickActions() {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 1.4,
      children: [
        // --- Fixed: previously _toast stubs; now switch the BottomNav tab.
        // Tab indices match the BottomNavigationBar items: 0 Dashboard, 1
        // Classes, 2 Teachers, 3 Students, 4 Timetable, 5 Fees.
        QuickActionTile(
          icon: Icons.group,
          label: 'Teachers',
          color: AppTheme.primary,
          onTap: () => widget.onNavigate?.call(2),
        ),
        QuickActionTile(
          icon: Icons.school,
          label: 'Students',
          color: AppTheme.info,
          onTap: () => widget.onNavigate?.call(3),
        ),
        QuickActionTile(
          icon: Icons.receipt,
          label: 'Fees',
          color: AppTheme.gold,
          onTap: () => widget.onNavigate?.call(5),
        ),
        // --- "Reports" stub repurposed: there's no Reports tab on branch
        // mobile, so this tile now opens the new Branch Results screen
        // (task C) which IS the branch's academic results overview.
        QuickActionTile(
          icon: Icons.bar_chart,
          label: 'Results',
          color: AppTheme.success,
          onTap: () => Navigator.push(context, MaterialPageRoute(
              builder: (_) => BranchResults(user: widget.user))),
        ),
        // --- 4 NEW deep-links to screens built in tasks B, D, E, F.
        QuickActionTile(
          icon: Icons.how_to_reg,
          label: 'Attendance',
          color: AppTheme.primaryLight,
          onTap: () => Navigator.push(context, MaterialPageRoute(
              builder: (_) => BranchAttendance(user: widget.user))),
        ),
        QuickActionTile(
          icon: Icons.event,
          label: 'Events',
          color: AppTheme.danger,
          onTap: () => Navigator.push(context, MaterialPageRoute(
              builder: (_) => BranchEvents(user: widget.user))),
        ),
        // --- Pre-existing deep-links (unchanged).
        QuickActionTile(
          icon: Icons.feedback_rounded,
          label: 'Complaint Portal',
          color: AppTheme.danger,
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ComplaintPortal(user: widget.user))),
        ),
      ],
    );
  }

  // ---- (f) Recent Activity card (real data only — no fake placeholders) ----
  Widget _recentActivity() {
    final items = _recent;

    // If no real transactions, don't show the section at all
    if (items.isEmpty) return const SizedBox.shrink();

    final List<Widget> tiles = items.map((t) {
      final def = _mapActivity(t);
      return ActivityItem(
        icon: def.icon,
        color: def.color,
        title: def.title,
        subtitle: def.subtitle,
        time: def.time,
      );
    }).toList();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
        boxShadow: AppTheme.shadowSm,
      ),
      child: Column(
        children: [
          for (int i = 0; i < tiles.length; i++) ...[
            tiles[i],
            if (i < tiles.length - 1)
              const Divider(height: 1, thickness: 1),
          ],
        ],
      ),
    );
  }

  _ActivityDef _mapActivity(Map<String, dynamic> t) {
    final rawType = (t['type'] ?? t['category'] ?? '').toString().toLowerCase();
    final title = (t['title'] ??
            t['description'] ??
            t['narration'] ??
            t['label'] ??
            'Transaction')
        .toString();
    final amount = num.tryParse('${t['amount'] ?? t['value'] ?? 0}');
    final subtitle = (amount != null && amount != 0)
        ? 'PKR ${_fmt(amount)}'
        : (t['type'] ?? t['category'] ?? t['note'] ?? '—').toString();
    final time =
        (t['date'] ?? t['time'] ?? t['createdAt'] ?? t['timestamp'] ?? '')
            .toString();
    IconData icon = Icons.trending_up;
    Color color = AppTheme.primary;
    if (rawType.contains('fee') || rawType.contains('invoice')) {
      icon = Icons.receipt_long;
      color = AppTheme.gold;
    } else if (rawType.contains('salary') || rawType.contains('payroll')) {
      icon = Icons.wallet;
      color = AppTheme.info;
    } else if (rawType.contains('admission') || rawType.contains('enroll')) {
      icon = Icons.person_add;
      color = AppTheme.success;
    } else if (rawType.contains('expense') || rawType.contains('payment')) {
      icon = Icons.payments;
      color = AppTheme.danger;
    }
    return _ActivityDef(
      icon: icon,
      color: color,
      title: title,
      subtitle: subtitle,
      time: time.isEmpty ? null : time,
    );
  }
}

/// Lightweight record used to map a raw transaction map to ActivityItem props.
class _ActivityDef {
  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;
  final String? time;

  const _ActivityDef({
    required this.icon,
    required this.color,
    required this.title,
    required this.subtitle,
    this.time,
  });
}

// =============================== TEACHERS TAB ===============================

class _TeachersTab extends StatefulWidget {
  final Map<String, dynamic> user;
  const _TeachersTab({required this.user});

  @override
  State<_TeachersTab> createState() => _TeachersTabState();
}

class _TeachersTabState extends State<_TeachersTab> with AutomaticKeepAliveClientMixin {
  List<dynamic> _teachers = [];
  bool _isLoading = true;
  String? _error;
  final _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final list = await ApiClient.getList('platform/users', query: {
        'role': 'teacher',
        'branchId': widget.user['branchId'],
      });
      if (mounted) setState(() { _teachers = list; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  List<dynamic> get _filtered {
    final q = _searchCtrl.text.trim().toLowerCase();
    if (q.isEmpty) return _teachers;
    return _teachers.where((t) {
      final name = (t['name'] ?? '').toString().toLowerCase();
      final roll = (t['rollNo'] ?? '').toString().toLowerCase();
      final subs = (t['subjects'] ?? '').toString().toLowerCase();
      return name.contains(q) || roll.contains(q) || subs.contains(q);
    }).toList();
  }

  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Teachers'),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_add, size: 22),
            tooltip: 'Add Teacher',
            onPressed: () async {
              final result = await showDialog<Map<String, dynamic>>(
                context: context,
                builder: (ctx) => _AddUserDialog(role: 'teacher', branchId: widget.user['branchId'], instituteId: widget.user['instituteId']),
              );
              if (result != null) {
                try {
                  await ApiClient.post('platform/users', body: result);
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Teacher added successfully'), backgroundColor: AppTheme.success, behavior: SnackBarBehavior.floating),
                    );
                  }
                  _load();
                } catch (e) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.danger, behavior: SnackBarBehavior.floating),
                    );
                  }
                }
              }
            },
          ),
          IconButton(icon: const Icon(Icons.refresh, size: 20), onPressed: _load),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: TextField(
              controller: _searchCtrl,
              onChanged: (_) => setState(() {}),
              decoration: const InputDecoration(
                hintText: 'Search by name, ID, subject…',
                prefixIcon: Icon(Icons.search, size: 20),
                isDense: true,
              ),
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? _ErrorView(error: _error!, onRetry: _load)
                    : _filtered.isEmpty
                        ? EmptyState(
                            icon: Icons.group_off,
                            title: _teachers.isEmpty ? 'No teachers yet' : 'No matches',
                            description: _teachers.isEmpty
                                ? 'Teachers added to this branch will appear here.'
                                : 'Try a different search term.',
                          )
                        : RefreshIndicator(
                            onRefresh: _load,
                            child: ListView.builder(
                              padding: const EdgeInsets.only(top: 4, bottom: 24),
                              itemCount: _filtered.length,
                              itemBuilder: (context, i) {
                                final t = _filtered[i] as Map<String, dynamic>;
                                final subjects = t['subjects'];
                                String sub;
                                if (subjects is List) {
                                  sub = subjects.join(', ');
                                } else if (subjects is String && subjects.isNotEmpty) {
                                  sub = subjects.replaceAll(RegExp(r'[\[\]"\\]'), '');
                                } else {
                                  sub = 'No subjects assigned';
                                }
                                final blocked = t['blocked'] == true;
                                return _PremiumListCard(
                                  icon: Icons.menu_book,
                                  iconColor: blocked ? AppTheme.danger : AppTheme.primary,
                                  title: t['name'] ?? 'Teacher',
                                  subtitle: 'ID: ${t['rollNo'] ?? '—'}  ·  ${sub}',
                                  trailing: StatusBadge(
                                    text: blocked ? 'Blocked' : 'Active',
                                    status: blocked ? 'blocked' : 'active',
                                  ),
                                  onTap: () {
                                    Navigator.push(context, MaterialPageRoute(
                                      builder: (_) => BranchUserDetail(user: t, role: 'teacher'),
                                    ));
                                  },
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }
}

// =============================== STUDENTS TAB ===============================

class _StudentsTab extends StatefulWidget {
  final Map<String, dynamic> user;
  const _StudentsTab({required this.user});

  @override
  State<_StudentsTab> createState() => _StudentsTabState();
}

class _StudentsTabState extends State<_StudentsTab> with AutomaticKeepAliveClientMixin {
  List<dynamic> _students = [];
  bool _isLoading = true;
  String? _error;
  final _searchCtrl = TextEditingController();

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
      if (mounted) setState(() { _students = list; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  List<dynamic> get _filtered {
    final q = _searchCtrl.text.trim().toLowerCase();
    if (q.isEmpty) return _students;
    return _students.where((s) {
      final name = (s['name'] ?? '').toString().toLowerCase();
      final roll = (s['rollNo'] ?? '').toString().toLowerCase();
      final cls = (s['class'] ?? '').toString().toLowerCase();
      return name.contains(q) || roll.contains(q) || cls.contains(q);
    }).toList();
  }

  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Students'),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_add, size: 22),
            tooltip: 'Add Student',
            onPressed: () async {
              final result = await showDialog<Map<String, dynamic>>(
                context: context,
                builder: (ctx) => _AddUserDialog(role: 'student', branchId: widget.user['branchId'], instituteId: widget.user['instituteId']),
              );
              if (result != null) {
                try {
                  await ApiClient.post('platform/users', body: result);
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Student added successfully'), backgroundColor: AppTheme.success, behavior: SnackBarBehavior.floating),
                    );
                  }
                  _load();
                } catch (e) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.danger, behavior: SnackBarBehavior.floating),
                    );
                  }
                }
              }
            },
          ),
          IconButton(icon: const Icon(Icons.refresh, size: 20), onPressed: _load),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: TextField(
              controller: _searchCtrl,
              onChanged: (_) => setState(() {}),
              decoration: const InputDecoration(
                hintText: 'Search by name, roll #, class…',
                prefixIcon: Icon(Icons.search, size: 20),
                isDense: true,
              ),
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? _ErrorView(error: _error!, onRetry: _load)
                    : _filtered.isEmpty
                        ? EmptyState(
                            icon: Icons.school_outlined,
                            title: _students.isEmpty ? 'No students yet' : 'No matches',
                            description: _students.isEmpty
                                ? 'Students enrolled in this branch will appear here.'
                                : 'Try a different search term.',
                          )
                        : RefreshIndicator(
                            onRefresh: _load,
                            child: ListView.builder(
                              padding: const EdgeInsets.only(top: 4, bottom: 24),
                              itemCount: _filtered.length,
                              itemBuilder: (context, i) {
                                final s = _filtered[i] as Map<String, dynamic>;
                                final cls = s['class'] ?? '—';
                                final section = s['section'] ?? 'A';
                                final roll = s['rollNo'] ?? '—';
                                final blocked = s['blocked'] == true;
                                return _PremiumListCard(
                                  icon: Icons.person,
                                  iconColor: blocked ? AppTheme.danger : AppTheme.primary,
                                  title: s['name'] ?? 'Student',
                                  subtitle: 'Class $cls · Section $section · Roll #$roll',
                                  trailing: StatusBadge(
                                    text: blocked ? 'Blocked' : 'Active',
                                    status: blocked ? 'blocked' : 'active',
                                  ),
                                  onTap: () {
                                    Navigator.push(context, MaterialPageRoute(
                                      builder: (_) => BranchUserDetail(user: s, role: 'student'),
                                    ));
                                  },
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }
}

// =============================== FEES TAB ===============================

class _FeesTab extends StatefulWidget {
  final Map<String, dynamic> user;
  const _FeesTab({required this.user});

  @override
  State<_FeesTab> createState() => _FeesTabState();
}

class _FeesTabState extends State<_FeesTab> with AutomaticKeepAliveClientMixin {
  List<dynamic> _invoices = [];
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
      final invoices = await ApiClient.getList('fee-invoices/branch');
      // Fetch students in parallel so we can show student names (not just IDs).
      final students = await ApiClient.getList('platform/users', query: {
        'role': 'student',
        'branchId': widget.user['branchId'],
      });
      if (mounted) setState(() { _invoices = invoices; _students = students; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  String _studentName(String? id) {
    if (id == null) return 'Unknown';
    final match = _students.where((s) => s['id'] == id).toList();
    return match.isEmpty ? 'Student' : (match.first['name'] ?? 'Student');
  }

  Future<void> _markInvoicePaid(String? invoiceId) async {
    if (invoiceId == null) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Mark as Paid?'),
        content: const Text('Mark this fee invoice as paid? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Mark Paid')),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await ApiClient.patch('fee-invoices/$invoiceId/pay', body: {});
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Invoice marked as paid'), backgroundColor: AppTheme.success, behavior: SnackBarBehavior.floating),
        );
      }
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.danger, behavior: SnackBarBehavior.floating),
        );
      }
    }
  }

  @override
  bool get wantKeepAlive => true;

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
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _ErrorView(error: _error!, onRetry: _load)
              : _invoices.isEmpty
                  ? EmptyState(
                      icon: Icons.receipt_long_outlined,
                      title: 'No invoices yet',
                      description: 'Generate fee invoices from the web dashboard to see them here.',
                      actionText: 'Refresh',
                      onAction: _load,
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView(
                        padding: const EdgeInsets.only(top: 12, bottom: 24),
                        children: [
                          // Summary row
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Row(
                              children: [
                                Expanded(child: KpiCard(icon: Icons.receipt, label: 'Total Invoices', value: '${_invoices.length}')),
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
                            child: KpiCard(icon: Icons.account_balance_wallet, label: 'Total Billed', value: 'PKR ${NumberFormat('##,###').format(totalAmount.toInt())}'),
                          ),
                          const SizedBox(height: 16),
                          const Padding(
                            padding: EdgeInsets.symmetric(horizontal: 16),
                            child: SectionHeader(title: 'All Invoices'),
                          ),
                          const SizedBox(height: 4),
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
                              title: _studentName(inv['studentId']),
                              subtitle: '$type · $month $year',
                              trailing: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    'PKR ${NumberFormat('##,###').format(amount.toInt())}',
                                    style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                                  ),
                                  const SizedBox(width: 8),
                                  StatusBadge(text: status, status: status.toLowerCase()),
                                ],
                              ),
                              onTap: isUnpaid ? () => _markInvoicePaid(inv['id']) : null,
                            );
                          }),
                        ],
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

// =============================== ADD USER DIALOG ===============================

class _AddUserDialog extends StatefulWidget {
  final String role;
  final String? branchId;
  final String? instituteId;
  const _AddUserDialog({required this.role, required this.branchId, required this.instituteId});

  @override
  State<_AddUserDialog> createState() => _AddUserDialogState();
}

class _AddUserDialogState extends State<_AddUserDialog> {
  final _nameCtrl = TextEditingController();
  final _rollNoCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _classCtrl = TextEditingController();
  final _sectionCtrl = TextEditingController(text: 'A');
  bool _isSaving = false;

  @override
  void dispose() {
    _nameCtrl.dispose(); _rollNoCtrl.dispose(); _passwordCtrl.dispose();
    _classCtrl.dispose(); _sectionCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isTeacher = widget.role == 'teacher';
    final canSubmit = _nameCtrl.text.trim().isNotEmpty &&
        _rollNoCtrl.text.trim().isNotEmpty &&
        _passwordCtrl.text.isNotEmpty;
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: Row(
        children: [
          Icon(isTeacher ? Icons.person_add : Icons.person_add_alt_1, color: AppTheme.primary, size: 22),
          const SizedBox(width: 8),
          Text('Add ${isTeacher ? 'Teacher' : 'Student'}'),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: _nameCtrl, decoration: InputDecoration(labelText: 'Full Name *', prefixIcon: const Icon(Icons.person, size: 18)), onChanged: (_) => setState(() {})),
            const SizedBox(height: 8),
            TextField(controller: _rollNoCtrl, decoration: InputDecoration(labelText: isTeacher ? 'Teacher ID *' : 'Roll Number *', prefixIcon: const Icon(Icons.badge, size: 18)), onChanged: (_) => setState(() {})),
            const SizedBox(height: 8),
            TextField(controller: _passwordCtrl, decoration: const InputDecoration(labelText: 'Password *', prefixIcon: Icon(Icons.lock, size: 18)), obscureText: true, onChanged: (_) => setState(() {})),
            if (!isTeacher) ...[
              const SizedBox(height: 8),
              TextField(controller: _classCtrl, decoration: const InputDecoration(labelText: 'Class', prefixIcon: Icon(Icons.school, size: 18))),
              const SizedBox(height: 8),
              TextField(controller: _sectionCtrl, decoration: const InputDecoration(labelText: 'Section', prefixIcon: Icon(Icons.bookmark, size: 18))),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: _isSaving ? null : () => Navigator.pop(context), child: const Text('Cancel')),
        ElevatedButton(
          onPressed: _isSaving || !canSubmit
              ? null
              : () {
                  final body = <String, dynamic>{
                    'name': _nameCtrl.text.trim(),
                    'rollNo': _rollNoCtrl.text.trim(),
                    'password': _passwordCtrl.text,
                    'role': widget.role,
                    'branchId': widget.branchId,
                    'instituteId': widget.instituteId,
                  };
                  if (!isTeacher && _classCtrl.text.trim().isNotEmpty) {
                    body['class'] = _classCtrl.text.trim();
                    body['section'] = _sectionCtrl.text.trim();
                  }
                  setState(() => _isSaving = true);
                  Navigator.pop(context, body);
                },
          child: _isSaving
              ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
              : Text('Add ${isTeacher ? 'Teacher' : 'Student'}'),
        ),
      ],
    );
  }
}

// =============================== CLASSES TAB ===============================

class _ClassesTab extends StatefulWidget {
  final Map<String, dynamic> user;
  const _ClassesTab({required this.user});

  @override
  State<_ClassesTab> createState() => _ClassesTabState();
}

class _ClassesTabState extends State<_ClassesTab> with AutomaticKeepAliveClientMixin {
  List<dynamic> _classes = [];
  bool _isLoading = true;
  String? _error;

  static const List<String> _gradeOptions = [
    'Nursery', 'Prep',
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
    'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
    'Grade 11', 'Grade 12',
  ];

  static const List<String> _sectionOptions = ['A', 'B', 'C', 'D'];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() { _isLoading = true; _error = null; });
    try {
      final list = await ApiClient.getList('branch/classes', query: {
        'branchId': widget.user['branchId'],
      });
      if (mounted) setState(() { _classes = list; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  void _snack(String msg, Color bg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: bg, behavior: SnackBarBehavior.floating),
    );
  }

  Future<void> _createClass(Map<String, dynamic> body) async {
    // Generate a temp client-side id so subsequent edits/deletes work optimistically.
    final tempId = 'local_${DateTime.now().millisecondsSinceEpoch}';
    final optimistic = {...body, 'id': tempId};
    setState(() => _classes = [..._classes, optimistic]);
    try {
      final result = await ApiClient.post('branch/classes', body: body);
      // If the server returned a real id, swap the temp entry for the real one.
      final serverId = result is Map ? result['id']?.toString() : null;
      if (serverId != null && mounted) {
        setState(() {
          _classes = _classes.map((c) => c['id'] == tempId ? {...c, 'id': serverId} : c).toList();
        });
      }
      _snack('Class added', AppTheme.success);
    } catch (_) {
      _snack('Saved locally — will sync', AppTheme.gold);
    }
  }

  Future<void> _updateClass(Map<String, dynamic> existing, Map<String, dynamic> body) async {
    final id = existing['id']?.toString();
    setState(() {
      _classes = _classes.map((c) {
        if (c['id'] == id) return {...c, ...body};
        return c;
      }).toList();
    });
    try {
      await ApiClient.patch('branch/classes/$id', body: body);
      _snack('Class updated', AppTheme.success);
    } catch (_) {
      _snack('Saved locally — will sync', AppTheme.gold);
    }
  }

  Future<void> _deleteClass(Map<String, dynamic> cls) async {
    final id = cls['id']?.toString();
    final label = '${cls['name'] ?? ''} ${cls['section'] ?? ''}'.trim();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Class?'),
        content: Text('Delete "$label"? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.danger,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    setState(() => _classes = _classes.where((c) => c['id'] != id).toList());
    try {
      await ApiClient.delete('branch/classes/$id');
      _snack('Class deleted', AppTheme.success);
    } catch (_) {
      _snack('Saved locally — will sync', AppTheme.gold);
    }
  }

  Future<void> _openForm({Map<String, dynamic>? existing}) async {
    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (ctx) => _ClassFormDialog(
        branchId: widget.user['branchId'],
        gradeOptions: _gradeOptions,
        sectionOptions: _sectionOptions,
        existing: existing,
      ),
    );
    if (result == null) return;
    if (existing != null) {
      await _updateClass(existing, result);
    } else {
      await _createClass(result);
    }
  }

  void _showDetail(Map<String, dynamic> c) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: AppTheme.surface,
          borderRadius: BorderRadius.only(topLeft: Radius.circular(20), topRight: Radius.circular(20)),
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40, height: 4,
                decoration: BoxDecoration(color: AppTheme.border, borderRadius: BorderRadius.circular(2)),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              '${c['name'] ?? ''} ${c['section'] ?? ''}'.trim(),
              style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
            ),
            const SizedBox(height: 12),
            _detailRow(Icons.person, 'Teacher', (c['teacherName'] ?? 'Unassigned').toString()),
            _detailRow(Icons.groups, 'Students', '${c['studentCount'] ?? 0}'),
            if ((c['room'] ?? '').toString().isNotEmpty)
              _detailRow(Icons.meeting_room, 'Room', (c['room'] ?? '').toString()),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      Navigator.pop(ctx);
                      _openForm(existing: c);
                    },
                    icon: const Icon(Icons.edit, size: 16),
                    label: const Text('Edit'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.danger,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    onPressed: () {
                      Navigator.pop(ctx);
                      _deleteClass(c);
                    },
                    icon: const Icon(Icons.delete, size: 16),
                    label: const Text('Delete'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _detailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppTheme.textMuted),
          const SizedBox(width: 10),
          Text(label, style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted)),
          const Spacer(),
          Text(value, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
        ],
      ),
    );
  }

  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Classes'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh, size: 20), tooltip: 'Refresh', onPressed: _load),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _openForm(),
        backgroundColor: AppTheme.primary,
        foregroundColor: Colors.white,
        child: const Icon(Icons.add),
      ),
      body: _isLoading
          ? _buildSkeleton()
          : _error != null
              ? _ErrorView(error: _error!, onRetry: _load)
              : _classes.isEmpty
                  ? EmptyState(
                      icon: Icons.class_outlined,
                      title: 'No classes yet',
                      description: 'Add a class to start enrolling students and creating timetables.',
                      actionText: 'Refresh',
                      onAction: _load,
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.builder(
                        padding: const EdgeInsets.only(top: 4, bottom: 24),
                        itemCount: _classes.length,
                        itemBuilder: (context, i) => _buildClassCard(_classes[i] as Map<String, dynamic>),
                      ),
                    ),
    );
  }

  Widget _buildSkeleton() {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      children: List.generate(
        4,
        (_) => const Padding(
          padding: EdgeInsets.only(bottom: 8),
          child: SkeletonBox(width: double.infinity, height: 88),
        ),
      ),
    );
  }

  Widget _buildClassCard(Map<String, dynamic> c) {
    final name = (c['name'] ?? 'Class').toString();
    final section = (c['section'] ?? '').toString();
    final teacherName = (c['teacherName'] ?? 'Unassigned').toString();
    final studentCount = c['studentCount'] ?? 0;
    final room = (c['room'] ?? '').toString();
    final fullName = section.isEmpty ? name : '$name - Section $section';

    return _PremiumListCard(
      icon: Icons.class_,
      iconColor: AppTheme.primary,
      title: fullName,
      subtitle: 'Teacher: $teacherName',
      onTap: () => _showDetail(c),
      extra: Wrap(
        spacing: 12,
        runSpacing: 4,
        children: [
          _infoChip(Icons.groups, '$studentCount students'),
          if (room.isNotEmpty) _infoChip(Icons.meeting_room, room),
        ],
      ),
    );
  }

  Widget _infoChip(IconData icon, String text) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 12, color: AppTheme.textMuted),
        const SizedBox(width: 4),
        Text(text, style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textSecondary)),
      ],
    );
  }
}

// =============================== CLASS FORM DIALOG ===============================

class _ClassFormDialog extends StatefulWidget {
  final String? branchId;
  final List<String> gradeOptions;
  final List<String> sectionOptions;
  final Map<String, dynamic>? existing;

  const _ClassFormDialog({
    required this.branchId,
    required this.gradeOptions,
    required this.sectionOptions,
    this.existing,
  });

  @override
  State<_ClassFormDialog> createState() => _ClassFormDialogState();
}

class _ClassFormDialogState extends State<_ClassFormDialog> {
  String? _grade;
  String? _section;
  String? _teacherId;
  String? _teacherName;
  late final TextEditingController _roomCtrl;
  List<dynamic> _teachers = [];
  bool _loadingTeachers = true;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    if (e != null) {
      _grade = e['name']?.toString();
      _section = e['section']?.toString();
      _teacherId = e['teacherId']?.toString();
      _teacherName = e['teacherName']?.toString();
      _roomCtrl = TextEditingController(text: (e['room'] ?? '').toString());
    } else {
      _section = 'A';
      _roomCtrl = TextEditingController();
    }
    _loadTeachers();
  }

  @override
  void dispose() {
    _roomCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadTeachers() async {
    try {
      final list = await ApiClient.getList('platform/users', query: {
        'role': 'teacher',
        'branchId': widget.branchId,
      });
      if (mounted) setState(() { _teachers = list; _loadingTeachers = false; });
    } catch (_) {
      if (mounted) setState(() => _loadingTeachers = false);
    }
  }

  /// Defensive: only return an id if it actually exists in the loaded teachers list
  /// (otherwise DropdownButtonFormField's "exactly one match" assertion will fire).
  String? get _effectiveTeacherId {
    if (_teacherId == null || _teachers.isEmpty) return null;
    final exists = _teachers.any((t) => t['id']?.toString() == _teacherId);
    return exists ? _teacherId : null;
  }

  /// Defensive: only return a grade/section that exists in the preset list.
  String? get _effectiveGrade =>
      (_grade == null || widget.gradeOptions.contains(_grade)) ? _grade : null;
  String? get _effectiveSection =>
      (_section == null || widget.sectionOptions.contains(_section)) ? _section : null;

  bool get _canSubmit => _grade != null && _section != null && !_saving;

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.existing != null;
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: Row(
        children: [
          Icon(isEdit ? Icons.edit : Icons.add_circle, color: AppTheme.primary, size: 22),
          const SizedBox(width: 8),
          Text(isEdit ? 'Edit Class' : 'Add Class'),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DropdownButtonFormField<String>(
              value: _effectiveGrade,
              decoration: const InputDecoration(labelText: 'Class Name *', prefixIcon: Icon(Icons.school, size: 18)),
              items: widget.gradeOptions.map((g) => DropdownMenuItem(value: g, child: Text(g))).toList(),
              onChanged: (v) => setState(() => _grade = v),
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _effectiveSection,
              decoration: const InputDecoration(labelText: 'Section *', prefixIcon: Icon(Icons.bookmark, size: 18)),
              items: widget.sectionOptions.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
              onChanged: (v) => setState(() => _section = v),
            ),
            const SizedBox(height: 8),
            _loadingTeachers
                ? const Padding(
                    padding: EdgeInsets.symmetric(vertical: 16),
                    child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
                  )
                : DropdownButtonFormField<String>(
                    value: _effectiveTeacherId,
                    decoration: const InputDecoration(labelText: 'Assigned Teacher', prefixIcon: Icon(Icons.person, size: 18)),
                    items: [
                      const DropdownMenuItem<String>(value: null, child: Text('Unassigned')),
                      ..._teachers.map((t) {
                        final id = t['id']?.toString();
                        final name = (t['name'] ?? 'Teacher').toString();
                        return DropdownMenuItem<String>(value: id, child: Text(name));
                      }),
                    ],
                    onChanged: (v) {
                      final match = _teachers.where((t) => t['id']?.toString() == v).toList();
                      setState(() {
                        _teacherId = v;
                        _teacherName = match.isEmpty ? '' : (match.first['name'] ?? '').toString();
                      });
                    },
                  ),
            const SizedBox(height: 8),
            TextField(
              controller: _roomCtrl,
              decoration: const InputDecoration(labelText: 'Room (optional)', prefixIcon: Icon(Icons.meeting_room, size: 18)),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: _saving ? null : () => Navigator.pop(context), child: const Text('Cancel')),
        ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.primary,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
          onPressed: _canSubmit
              ? () {
                  setState(() => _saving = true);
                  final body = <String, dynamic>{
                    'name': _grade,
                    'section': _section,
                    'teacherId': _teacherId,
                    'teacherName': _teacherName ?? '',
                    'room': _roomCtrl.text.trim(),
                    'branchId': widget.branchId,
                    'studentCount': widget.existing?['studentCount'] ?? 0,
                    if (widget.existing != null) 'id': widget.existing!['id'],
                  };
                  Navigator.pop(context, body);
                }
              : null,
          child: _saving
              ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : Text(isEdit ? 'Save' : 'Add Class'),
        ),
      ],
    );
  }
}

// =============================== TIMETABLE TAB ===============================

class _TimetableTab extends StatefulWidget {
  final Map<String, dynamic> user;
  const _TimetableTab({required this.user});

  @override
  State<_TimetableTab> createState() => _TimetableTabState();
}

class _TimetableTabState extends State<_TimetableTab> with AutomaticKeepAliveClientMixin {
  List<dynamic> _entries = [];
  List<dynamic> _classes = [];
  List<dynamic> _teachers = [];
  bool _isLoading = true;
  String? _error;
  String _selectedDay = 'Monday';

  static const List<String> _days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Deterministic palette for subject color-coding.
  static const List<Color> _subjectColors = [
    Color(0xFF0EA5E9), // info blue
    Color(0xFF16A34A), // success green
    Color(0xFFD4A437), // gold
    Color(0xFF8B5CF6), // purple
    Color(0xFFEC4899), // pink
    Color(0xFF14B8A6), // teal
    Color(0xFFF97316), // orange
    Color(0xFF0B1F3A), // navy primary
  ];

  Color _colorForSubject(String subject) {
    if (subject.isEmpty) return AppTheme.textMuted;
    int hash = 0;
    for (int i = 0; i < subject.length; i++) {
      hash = (31 * hash + subject.codeUnitAt(i)) & 0x7FFFFFFF;
    }
    return _subjectColors[hash % _subjectColors.length];
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() { _isLoading = true; _error = null; });
    try {
      final results = await Future.wait([
        ApiClient.getList('timetable', query: {'branchId': widget.user['branchId']}),
        ApiClient.getList('branch/classes', query: {'branchId': widget.user['branchId']}),
        ApiClient.getList('platform/users', query: {'role': 'teacher', 'branchId': widget.user['branchId']}),
      ]);
      if (mounted) {
        setState(() {
          _entries = results[0];
          _classes = results[1];
          _teachers = results[2];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  void _snack(String msg, Color bg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: bg, behavior: SnackBarBehavior.floating),
    );
  }

  List<dynamic> _entriesForDay(String day) {
    final list = _entries.where((e) => (e['day'] ?? '').toString() == day).toList();
    list.sort((a, b) {
      final aStart = (a['startTime'] ?? '').toString();
      final bStart = (b['startTime'] ?? '').toString();
      return aStart.compareTo(bStart);
    });
    return list;
  }

  Future<void> _createEntry(Map<String, dynamic> body) async {
    // Generate a temp client-side id so subsequent edits/deletes work optimistically.
    final tempId = 'local_${DateTime.now().millisecondsSinceEpoch}';
    final optimistic = {...body, 'id': tempId};
    setState(() => _entries = [..._entries, optimistic]);
    try {
      final result = await ApiClient.post('timetable', body: body);
      final serverId = result is Map ? result['id']?.toString() : null;
      if (serverId != null && mounted) {
        setState(() {
          _entries = _entries.map((e) => e['id'] == tempId ? {...e, 'id': serverId} : e).toList();
        });
      }
      _snack('Entry added', AppTheme.success);
    } catch (_) {
      _snack('Saved locally — will sync', AppTheme.gold);
    }
  }

  Future<void> _updateEntry(Map<String, dynamic> existing, Map<String, dynamic> body) async {
    final id = existing['id']?.toString();
    setState(() {
      _entries = _entries.map((e) {
        if (e['id'] == id) return {...e, ...body};
        return e;
      }).toList();
    });
    try {
      await ApiClient.patch('timetable/$id', body: body);
      _snack('Entry updated', AppTheme.success);
    } catch (_) {
      _snack('Saved locally — will sync', AppTheme.gold);
    }
  }

  Future<void> _deleteEntry(Map<String, dynamic> entry) async {
    final id = entry['id']?.toString();
    final subject = (entry['subject'] ?? 'this entry').toString();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Entry?'),
        content: Text('Remove "$subject" from the timetable? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.danger,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    setState(() => _entries = _entries.where((e) => e['id'] != id).toList());
    try {
      await ApiClient.delete('timetable/$id');
      _snack('Entry deleted', AppTheme.success);
    } catch (_) {
      _snack('Saved locally — will sync', AppTheme.gold);
    }
  }

  Future<void> _openForm({Map<String, dynamic>? existing}) async {
    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (ctx) => _TimetableEntryDialog(
        branchId: widget.user['branchId'],
        classes: _classes,
        teachers: _teachers,
        days: _days,
        existing: existing,
      ),
    );
    if (result == null) return;
    if (existing != null) {
      await _updateEntry(existing, result);
    } else {
      await _createEntry(result);
    }
  }

  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Timetable'),
        actions: [
          IconButton(icon: const Icon(Icons.add, size: 22), tooltip: 'Add Entry', onPressed: () => _openForm()),
          IconButton(icon: const Icon(Icons.refresh, size: 20), tooltip: 'Refresh', onPressed: _load),
        ],
      ),
      body: _isLoading
          ? _buildSkeleton()
          : _error != null
              ? _ErrorView(error: _error!, onRetry: _load)
              : _entries.isEmpty
                  ? EmptyState(
                      icon: Icons.event_note_outlined,
                      title: 'No timetable yet',
                      description: 'Create weekly class schedules that teachers and students will see in their portals.',
                      actionText: 'Refresh',
                      onAction: _load,
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: Column(
                        children: [
                          _daySelector(),
                          Expanded(child: _dayList()),
                        ],
                      ),
                    ),
    );
  }

  Widget _buildSkeleton() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: List.generate(
        4,
        (_) => const Padding(
          padding: EdgeInsets.only(bottom: 8),
          child: SkeletonBox(width: double.infinity, height: 76),
        ),
      ),
    );
  }

  Widget _daySelector() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: _days.map((d) {
            final isSelected = d == _selectedDay;
            final count = _entriesForDay(d).length;
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: GestureDetector(
                onTap: () => setState(() => _selectedDay = d),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    color: isSelected ? AppTheme.primary : AppTheme.surface,
                    border: Border.all(color: isSelected ? AppTheme.primary : AppTheme.border),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(d.substring(0, 3),
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: isSelected ? Colors.white : AppTheme.textPrimary,
                          )),
                      Text('$count',
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            color: isSelected ? Colors.white.withOpacity(0.7) : AppTheme.textMuted,
                          )),
                    ],
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _dayList() {
    final list = _entriesForDay(_selectedDay);
    if (list.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.event_busy, size: 48, color: AppTheme.textMuted),
              const SizedBox(height: 12),
              Text('No entries for $_selectedDay',
                  style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.textSecondary)),
              const SizedBox(height: 4),
              Text('Tap + to add a class for this day.',
                  style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted)),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onPressed: () => _openForm(),
                icon: const Icon(Icons.add, size: 16),
                label: const Text('Add Entry'),
              ),
            ],
          ),
        ),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.only(top: 4, bottom: 80),
      itemCount: list.length,
      itemBuilder: (context, i) => _buildEntryCard(list[i] as Map<String, dynamic>),
    );
  }

  Widget _buildEntryCard(Map<String, dynamic> e) {
    final subject = (e['subject'] ?? '—').toString();
    final start = (e['startTime'] ?? '').toString();
    final end = (e['endTime'] ?? '').toString();
    final className = (e['className'] ?? '—').toString();
    final teacherName = (e['teacherName'] ?? '—').toString();
    final room = (e['room'] ?? '').toString();
    final color = _colorForSubject(subject);

    return _PremiumListCard(
      icon: Icons.book,
      iconColor: color,
      title: subject,
      subtitle: '$className · $teacherName',
      trailing: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: color.withOpacity(0.12),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Text('$start - $end',
            style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: color)),
      ),
      onTap: () => _openForm(existing: e),
      extra: InkWell(
        onLongPress: () => _deleteEntry(e),
        child: Wrap(
          spacing: 12,
          runSpacing: 4,
          children: [
            _chip(Icons.class_, className),
            _chip(Icons.person, teacherName),
            if (room.isNotEmpty) _chip(Icons.meeting_room, room),
          ],
        ),
      ),
    );
  }

  Widget _chip(IconData icon, String text) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 12, color: AppTheme.textMuted),
        const SizedBox(width: 4),
        Text(text, style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textSecondary)),
      ],
    );
  }
}

// =============================== TIMETABLE ENTRY DIALOG ===============================

class _TimetableEntryDialog extends StatefulWidget {
  final String? branchId;
  final List<dynamic> classes;
  final List<dynamic> teachers;
  final List<String> days;
  final Map<String, dynamic>? existing;

  const _TimetableEntryDialog({
    required this.branchId,
    required this.classes,
    required this.teachers,
    required this.days,
    this.existing,
  });

  @override
  State<_TimetableEntryDialog> createState() => _TimetableEntryDialogState();
}

class _TimetableEntryDialogState extends State<_TimetableEntryDialog> {
  String? _day;
  TimeOfDay? _start;
  TimeOfDay? _end;
  final _subjectCtrl = TextEditingController();
  final _roomCtrl = TextEditingController();
  String? _classId;
  String? _className;
  String? _teacherId;
  String? _teacherName;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    if (e != null) {
      _day = e['day']?.toString();
      _subjectCtrl.text = (e['subject'] ?? '').toString();
      _roomCtrl.text = (e['room'] ?? '').toString();
      _classId = e['classId']?.toString();
      _className = e['className']?.toString();
      _teacherId = e['teacherId']?.toString();
      _teacherName = e['teacherName']?.toString();
      _start = _parseTime(e['startTime']?.toString());
      _end = _parseTime(e['endTime']?.toString());
    } else {
      _day = widget.days.isNotEmpty ? widget.days.first : null;
    }
  }

  @override
  void dispose() {
    _subjectCtrl.dispose();
    _roomCtrl.dispose();
    super.dispose();
  }

  TimeOfDay? _parseTime(String? s) {
    if (s == null || s.isEmpty) return null;
    try {
      final parts = s.split(':');
      if (parts.length >= 2) {
        return TimeOfDay(hour: int.parse(parts[0]), minute: int.parse(parts[1]));
      }
    } catch (_) {}
    return null;
  }

  String _fmtTime(TimeOfDay? t) {
    if (t == null) return '—';
    final h = t.hour.toString().padLeft(2, '0');
    final m = t.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }

  Future<void> _pickTime(bool isStart) async {
    final initial = isStart ? (_start ?? TimeOfDay.now()) : (_end ?? _start ?? TimeOfDay.now());
    final picked = await showTimePicker(
      context: context,
      initialTime: initial,
    );
    if (picked != null) {
      setState(() {
        if (isStart) {
          _start = picked;
        } else {
          _end = picked;
        }
      });
    }
  }

  /// Defensive: ensure the dropdown value is present in the items list.
  String? get _effectiveDay =>
      (_day == null || widget.days.contains(_day)) ? _day : null;
  String? get _effectiveClassId {
    if (_classId == null || widget.classes.isEmpty) return null;
    final exists = widget.classes.any((c) => c['id']?.toString() == _classId);
    return exists ? _classId : null;
  }

  String? get _effectiveTeacherId {
    if (_teacherId == null || widget.teachers.isEmpty) return null;
    final exists = widget.teachers.any((t) => t['id']?.toString() == _teacherId);
    return exists ? _teacherId : null;
  }

  bool get _canSubmit =>
      _day != null &&
      _start != null &&
      _end != null &&
      _subjectCtrl.text.trim().isNotEmpty &&
      !_saving;

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.existing != null;
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: Row(
        children: [
          Icon(isEdit ? Icons.edit : Icons.add_circle, color: AppTheme.primary, size: 22),
          const SizedBox(width: 8),
          Text(isEdit ? 'Edit Entry' : 'Add Entry'),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DropdownButtonFormField<String>(
              value: _effectiveDay,
              decoration: const InputDecoration(labelText: 'Day *', prefixIcon: Icon(Icons.calendar_today, size: 18)),
              items: widget.days.map((d) => DropdownMenuItem(value: d, child: Text(d))).toList(),
              onChanged: (v) => setState(() => _day = v),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: () => _pickTime(true),
                    child: InputDecorator(
                      decoration: const InputDecoration(labelText: 'Start *', prefixIcon: Icon(Icons.play_arrow, size: 18)),
                      child: Text(_fmtTime(_start),
                          style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: InkWell(
                    onTap: () => _pickTime(false),
                    child: InputDecorator(
                      decoration: const InputDecoration(labelText: 'End *', prefixIcon: Icon(Icons.stop, size: 18)),
                      child: Text(_fmtTime(_end),
                          style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _subjectCtrl,
              decoration: const InputDecoration(labelText: 'Subject *', prefixIcon: Icon(Icons.book, size: 18)),
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _effectiveClassId,
              decoration: const InputDecoration(labelText: 'Class', prefixIcon: Icon(Icons.class_, size: 18)),
              items: [
                const DropdownMenuItem<String>(value: null, child: Text('— None —')),
                ...widget.classes.map((c) {
                  final id = c['id']?.toString();
                  final name = '${c['name'] ?? ''} ${c['section'] ?? ''}'.trim();
                  return DropdownMenuItem<String>(value: id, child: Text(name));
                }),
              ],
              onChanged: (v) {
                final match = widget.classes.where((c) => c['id']?.toString() == v).toList();
                setState(() {
                  _classId = v;
                  _className = match.isEmpty
                      ? ''
                      : '${match.first['name'] ?? ''} ${match.first['section'] ?? ''}'.trim();
                });
              },
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _effectiveTeacherId,
              decoration: const InputDecoration(labelText: 'Teacher', prefixIcon: Icon(Icons.person, size: 18)),
              items: [
                const DropdownMenuItem<String>(value: null, child: Text('— None —')),
                ...widget.teachers.map((t) {
                  final id = t['id']?.toString();
                  final name = (t['name'] ?? 'Teacher').toString();
                  return DropdownMenuItem<String>(value: id, child: Text(name));
                }),
              ],
              onChanged: (v) {
                final match = widget.teachers.where((t) => t['id']?.toString() == v).toList();
                setState(() {
                  _teacherId = v;
                  _teacherName = match.isEmpty ? '' : (match.first['name'] ?? '').toString();
                });
              },
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _roomCtrl,
              decoration: const InputDecoration(labelText: 'Room (optional)', prefixIcon: Icon(Icons.meeting_room, size: 18)),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: _saving ? null : () => Navigator.pop(context), child: const Text('Cancel')),
        ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.primary,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
          onPressed: _canSubmit
              ? () {
                  setState(() => _saving = true);
                  final body = <String, dynamic>{
                    'day': _day,
                    'startTime': _fmtTime(_start),
                    'endTime': _fmtTime(_end),
                    'subject': _subjectCtrl.text.trim(),
                    'classId': _classId,
                    'className': _className ?? '',
                    'teacherId': _teacherId,
                    'teacherName': _teacherName ?? '',
                    'room': _roomCtrl.text.trim(),
                    'branchId': widget.branchId,
                    if (widget.existing != null) 'id': widget.existing!['id'],
                  };
                  Navigator.pop(context, body);
                }
              : null,
          child: _saving
              ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : Text(isEdit ? 'Save' : 'Add Entry'),
        ),
      ],
    );
  }
}
