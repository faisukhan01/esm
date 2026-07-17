import 'package:intl/intl.dart';
import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';
import 'branch_user_detail.dart';
import '../notifications_screen.dart';
import '../profile_screen.dart';
import '../announcements_screen.dart';
import '../calendar_screen.dart';

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
      _BranchDashboard(name: name, branchName: branchName, kpi: kpi, isLoading: _isLoading, onRefresh: _loadData, user: widget.user),
      _TeachersTab(user: widget.user),
      _StudentsTab(user: widget.user),
      _FeesTab(user: widget.user),
    ];

    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: screens),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (i) => setState(() => _currentIndex = i),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard_outlined), activeIcon: Icon(Icons.dashboard), label: 'Dashboard'),
          BottomNavigationBarItem(icon: Icon(Icons.group_outlined), activeIcon: Icon(Icons.group), label: 'Teachers'),
          BottomNavigationBarItem(icon: Icon(Icons.school_outlined), activeIcon: Icon(Icons.school), label: 'Students'),
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

  const _BranchDashboard({
    required this.name,
    required this.branchName,
    required this.kpi,
    required this.isLoading,
    required this.onRefresh,
    required this.user,
  });

  @override
  State<_BranchDashboard> createState() => _BranchDashboardState();
}

class _BranchDashboardState extends State<_BranchDashboard> {
  // Parent passes only `kpi`; this dashboard also needs `monthlyRevenue` +
  // `recentTransactions`, so it fetches the same endpoint itself and falls
  // back to the parent-provided `kpi` while loading.
  Map<String, dynamic>? _finance;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
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
          IconButton(
            icon: const Icon(Icons.campaign_outlined, size: 22),
            tooltip: "Announcements",
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => AnnouncementsScreen(user: widget.user))),
          ),
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
                  const SizedBox(height: 20),
                  const SectionHeader(title: 'Recent Activity'),
                  const SizedBox(height: 8),
                  _recentActivity(),
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
        QuickActionTile(
          icon: Icons.group,
          label: 'Teachers',
          color: AppTheme.primary,
          onTap: () => _toast('Open the Teachers tab to manage staff'),
        ),
        QuickActionTile(
          icon: Icons.school,
          label: 'Students',
          color: AppTheme.info,
          onTap: () => _toast('Open the Students tab to manage enrolment'),
        ),
        QuickActionTile(
          icon: Icons.receipt,
          label: 'Fees',
          color: AppTheme.gold,
          onTap: () => _toast('Open the Fees tab to manage invoices'),
        ),
        QuickActionTile(
          icon: Icons.assessment,
          label: 'Reports',
          color: AppTheme.success,
          onTap: () => _toast('Reports coming soon'),
        ),
      ],
    );
  }

  // ---- (f) Recent Activity card ----------------------------------------
  Widget _recentActivity() {
    final items = _recent;
    final List<Widget> tiles = items.isEmpty
        ? [
            ActivityItem(
              icon: Icons.receipt_long,
              color: AppTheme.gold,
              title: 'Fee invoice generated',
              subtitle: 'Awaiting student payment',
              time: 'Today',
            ),
            ActivityItem(
              icon: Icons.wallet,
              color: AppTheme.info,
              title: 'Salary paid',
              subtitle: 'Monthly payroll disbursed',
              time: 'Yesterday',
            ),
            ActivityItem(
              icon: Icons.person_add,
              color: AppTheme.success,
              title: 'New student enrolled',
              subtitle: 'Admission confirmed',
              time: '2d ago',
            ),
          ]
        : items.map((t) {
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

  void _toast(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
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
                              padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
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
                                return ListRowCard(
                                  title: t['name'] ?? 'Teacher',
                                  subtitle: 'ID: ${t['rollNo'] ?? '—'}  ·  ${sub}',
                                  icon: Icons.menu_book,
                                  badgeText: t['blocked'] == true ? 'Blocked' : 'Active',
                                  badgeStatus: t['blocked'] == true ? 'blocked' : 'active',
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
                              padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                              itemCount: _filtered.length,
                              itemBuilder: (context, i) {
                                final s = _filtered[i] as Map<String, dynamic>;
                                final cls = s['class'] ?? '—';
                                final section = s['section'] ?? 'A';
                                final roll = s['rollNo'] ?? '—';
                                return ListRowCard(
                                  title: s['name'] ?? 'Student',
                                  subtitle: 'Class $cls · Section $section · Roll #$roll',
                                  icon: Icons.person,
                                  badgeText: s['blocked'] == true ? 'Blocked' : 'Active',
                                  badgeStatus: s['blocked'] == true ? 'blocked' : 'active',
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
                        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                        children: [
                          // Summary row
                          Row(
                            children: [
                              Expanded(child: KpiCard(icon: Icons.receipt, label: 'Total Invoices', value: '${_invoices.length}')),
                              const SizedBox(width: 8),
                              Expanded(child: KpiCard(icon: Icons.check_circle, label: 'Paid', value: '$paid', iconColor: AppTheme.success)),
                              const SizedBox(width: 8),
                              Expanded(child: KpiCard(icon: Icons.pending, label: 'Unpaid', value: '$unpaid', iconColor: AppTheme.danger)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          KpiCard(icon: Icons.account_balance_wallet, label: 'Total Billed', value: 'PKR ${NumberFormat('##,###').format(totalAmount.toInt())}'),
                          const SizedBox(height: 16),
                          const SectionHeader(title: 'All Invoices'),
                          const SizedBox(height: 8),
                          ..._invoices.map((inv) {
                            final status = (inv['status'] ?? 'Unpaid').toString();
                            final amount = double.tryParse('${inv['amount'] ?? 0}') ?? 0;
                            final month = inv['month'] ?? '—';
                            final year = inv['year'] ?? '';
                            final type = inv['type'] ?? 'Tuition';
                            final isUnpaid = status.toLowerCase() != 'paid';
                            return ListRowCard(
                              title: _studentName(inv['studentId']),
                              subtitle: '$type · $month $year',
                              icon: Icons.receipt_outlined,
                              badgeText: status,
                              badgeStatus: status.toLowerCase(),
                              trailing: 'PKR ${NumberFormat('##,###').format(amount.toInt())}',
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
