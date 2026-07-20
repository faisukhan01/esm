import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';
import 'institute_branch_detail.dart';
import '../notifications_screen.dart';
import '../profile_screen.dart';
import '../announcements_screen.dart';
import '../../widgets/update_banner.dart';
import '../calendar_screen.dart';
import 'institute_online_admissions.dart';
import 'institute_teachers.dart';
import 'institute_students.dart';
import '../shared/complaint_portal.dart';

// =============================== PREMIUM LIST CARD (file-scoped) ===============================

/// Standardised premium list-row card used across the institute admin tables.
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

class InstituteHome extends StatefulWidget {
  final Map<String, dynamic> user;
  const InstituteHome({super.key, required this.user});

  @override
  State<InstituteHome> createState() => _InstituteHomeState();
}

class _InstituteHomeState extends State<InstituteHome> {
  int _currentIndex = 0;
  Map<String, dynamic>? _finance;
  List<dynamic> _branches = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final finance = await ApiClient.getObject('institute/finance', query: {'instituteId': widget.user['instituteId']});
      final branches = await ApiClient.getList('branches', query: {'instituteId': widget.user['instituteId']});
      if (mounted) setState(() { _finance = finance; _branches = branches; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final kpi = _finance?['kpi'] ?? {};
    final name = widget.user['name']?.split(' ').first ?? 'Admin';
    final instituteName = widget.user['instituteName'] ?? '';

    final screens = [
      _InstituteDashboard(name: name, instituteName: instituteName, kpi: kpi, branches: _branches, isLoading: _isLoading, onRefresh: _loadData, user: widget.user, onNavigate: (i) => setState(() => _currentIndex = i)),
      _BranchesTab(user: widget.user, branches: _branches, isLoading: _isLoading, onRefresh: _loadData),
      _RoyaltyTab(user: widget.user),
      _ReportsTab(user: widget.user, finance: _finance, isLoading: _isLoading, onRefresh: _loadData),
    ];

    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: screens),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (i) => setState(() => _currentIndex = i),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard_outlined), activeIcon: Icon(Icons.dashboard), label: 'Dashboard'),
          BottomNavigationBarItem(icon: Icon(Icons.account_tree_outlined), activeIcon: Icon(Icons.account_tree), label: 'Branches'),
          BottomNavigationBarItem(icon: Icon(Icons.payments_outlined), activeIcon: Icon(Icons.payments), label: 'Royalty'),
          BottomNavigationBarItem(icon: Icon(Icons.trending_up_outlined), activeIcon: Icon(Icons.trending_up), label: 'Reports'),
        ],
      ),
    );
  }
}

// =============================== DASHBOARD ===============================

class _InstituteDashboard extends StatefulWidget {
  final String name;
  final String instituteName;
  final Map<String, dynamic> kpi;
  final List<dynamic> branches;
  final bool isLoading;
  final VoidCallback onRefresh;
  final Map<String, dynamic> user;
  final void Function(int tabIndex)? onNavigate;

  const _InstituteDashboard({
    required this.name,
    required this.instituteName,
    required this.kpi,
    required this.branches,
    required this.isLoading,
    required this.onRefresh,
    required this.user,
    this.onNavigate,
  });

  @override
  State<_InstituteDashboard> createState() => _InstituteDashboardState();
}

class _InstituteDashboardState extends State<_InstituteDashboard> {
  Map<String, dynamic>? _finance;
  bool _firstLoad = true;

  @override
  void initState() {
    super.initState();
    // Check cache first — if we have cached data, show it instantly (no spinner)
    final cached = ApiClient.getCached('institute/finance', {'instituteId': widget.user['instituteId']});
    if (cached != null) {
      _finance = cached is Map<String, dynamic> ? cached : {};
      _firstLoad = false;
    }
    _loadFinance();
  }

  Future<void> _loadFinance() async {
    try {
      final finance = await ApiClient.getObject(
        'institute/finance',
        query: {'instituteId': widget.user['instituteId']},
      );
      if (mounted) setState(() { _finance = finance; _firstLoad = false; });
    } catch (_) {
      if (mounted) setState(() => _firstLoad = false);
    }
  }

  Future<void> _refresh() async {
    widget.onRefresh();
    await _loadFinance();
  }

  void _snack(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        behavior: SnackBarBehavior.floating,
        backgroundColor: AppTheme.primary,
      ),
    );
  }

  Map<String, dynamic> get _kpi => _finance?['kpi'] ?? widget.kpi;
  List<dynamic> get _monthlyRevenue => (_finance?['monthlyRevenue'] as List<dynamic>?) ?? const [];
  List<dynamic> get _branchPerformance => (_finance?['branchPerformance'] as List<dynamic>?) ?? const [];

  String _fmt(dynamic n) {
    final v = num.tryParse('${n ?? 0}') ?? 0;
    return NumberFormat('##,###').format(v);
  }

  String _compact(dynamic n) {
    final v = num.tryParse('${n ?? 0}') ?? 0;
    final sign = v < 0 ? '-' : '';
    final a = v.abs();
    if (a >= 1000000) return '$sign${(a / 1000000).toStringAsFixed(1)}M';
    if (a >= 1000) return '$sign${(a / 1000).toStringAsFixed(0)}K';
    return '$sign${a.toInt()}';
  }

  @override
  Widget build(BuildContext context) {
    final showSkeleton = widget.isLoading || _firstLoad;
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
              if (context.mounted) Navigator.pushNamedAndRemoveUntil(context, '/', (_) => false);
            },
          ),
        ],
      ),
      body: showSkeleton
          ? const DashboardSkeleton()
          : RefreshIndicator(
              onRefresh: _refresh,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  const UpdateBanner(),
                  _heroCard(),
                  const SizedBox(height: 16),
                  _quickActions(),
                  const SizedBox(height: 16),
                  _statCards(),
                  const SizedBox(height: 16),
                  _revenueChart(),
                  const SizedBox(height: 16),
                  _branchPerformanceChart(),
                  const SizedBox(height: 16),
                  _recentActivity(),
                  const SizedBox(height: 8),
                ],
              ),
            ),
    );
  }

  // --- (a) Hero banner ---
  Widget _heroCard() {
    return GradientHeroCard(
      title: 'Hi, ${widget.name}!',
      subtitle: widget.instituteName,
      metric: 'PKR ${_fmt(_kpi['totalRevenue'])}',
      metricLabel: 'Total Revenue',
      icon: Icons.business_center,
      gradientColors: const [AppTheme.primary, AppTheme.primaryLight],
    );
  }

  // --- (b) Quick actions ---
  Widget _quickActions() {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.0,
      children: [
        QuickActionTile(
          icon: Icons.account_tree,
          label: 'Branches',
          color: AppTheme.primary,
          onTap: () => widget.onNavigate?.call(1),
        ),
        QuickActionTile(
          icon: Icons.payments,
          label: 'Royalty',
          color: AppTheme.gold,
          onTap: () => widget.onNavigate?.call(2),
        ),
        QuickActionTile(
          icon: Icons.trending_up,
          label: 'Reports',
          color: AppTheme.info,
          onTap: () => widget.onNavigate?.call(3),
        ),
        QuickActionTile(
          icon: Icons.analytics,
          label: 'Analytics',
          color: AppTheme.success,
          onTap: () => widget.onNavigate?.call(0),
        ),
        QuickActionTile(
          icon: Icons.how_to_reg_rounded,
          label: 'Online Admissions',
          color: AppTheme.danger,
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => InstituteOnlineAdmissions(user: widget.user))),
        ),
        QuickActionTile(
          icon: Icons.people,
          label: 'Teachers',
          color: AppTheme.primary,
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => InstituteTeachers(user: widget.user))),
        ),
        QuickActionTile(
          icon: Icons.school,
          label: 'Students',
          color: AppTheme.gold,
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => InstituteStudents(user: widget.user))),
        ),
        QuickActionTile(
          icon: Icons.feedback,
          label: 'Complaint Portal',
          color: AppTheme.warning,
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ComplaintPortal(user: widget.user))),
        ),
      ],
    );
  }

  // --- (c) Premium stat cards ---
  Widget _statCards() {
    final netBalance = num.tryParse('${_kpi['netBalance'] ?? 0}') ?? 0;
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.3,
      children: [
        PremiumStatCard(
          icon: Icons.account_tree,
          label: 'Branches',
          value: '${_kpi['branches'] ?? 0}',
          color: AppTheme.primary,
        ),
        PremiumStatCard(
          icon: Icons.school,
          label: 'Students',
          value: '${_kpi['students'] ?? 0}',
          color: AppTheme.info,
        ),
        PremiumStatCard(
          icon: Icons.group,
          label: 'Teachers',
          value: '${_kpi['teachers'] ?? 0}',
          color: AppTheme.success,
        ),
        PremiumStatCard(
          icon: Icons.account_balance_wallet,
          label: 'Net Balance',
          value: 'PKR ${_compact(netBalance)}',
          color: netBalance >= 0 ? AppTheme.success : AppTheme.danger,
        ),
      ],
    );
  }

  // --- (d) Revenue vs Salary grouped bar chart ---
  Widget _revenueChart() {
    final raw = _monthlyRevenue;
    final data = raw.length > 6 ? raw.sublist(raw.length - 6) : raw;
    double maxVal = 0;
    for (final e in data) {
      final m = e as Map<String, dynamic>;
      final r = num.tryParse('${m['revenue'] ?? 0}') ?? 0;
      final s = num.tryParse('${m['salary'] ?? 0}') ?? 0;
      if (r > maxVal) maxVal = r.toDouble();
      if (s > maxVal) maxVal = s.toDouble();
    }

    return ChartCard(
      title: 'Revenue vs Salary',
      subtitle: 'Last 6 months',
      height: 220,
      headerActions: [
        _legend(AppTheme.primary, 'Revenue'),
        const SizedBox(width: 10),
        _legend(AppTheme.gold.withOpacity(0.8), 'Salary'),
      ],
      chart: data.isEmpty
          ? const Center(
              child: Text('No revenue data', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
            )
          : BarChart(
              BarChartData(
                alignment: BarChartAlignment.spaceAround,
                maxY: maxVal > 0 ? maxVal * 1.2 : 10,
                barGroups: data.asMap().entries.map((entry) {
                  final m = entry.value as Map<String, dynamic>;
                  final rev = (num.tryParse('${m['revenue'] ?? 0}') ?? 0).toDouble();
                  final sal = (num.tryParse('${m['salary'] ?? 0}') ?? 0).toDouble();
                  return BarChartGroupData(
                    x: entry.key,
                    barRods: [
                      BarChartRodData(
                        toY: rev,
                        color: AppTheme.primary,
                        width: 10,
                        borderRadius: const BorderRadius.only(
                          topLeft: Radius.circular(4),
                          topRight: Radius.circular(4),
                        ),
                      ),
                      BarChartRodData(
                        toY: sal,
                        color: AppTheme.gold.withOpacity(0.8),
                        width: 10,
                        borderRadius: const BorderRadius.only(
                          topLeft: Radius.circular(4),
                          topRight: Radius.circular(4),
                        ),
                      ),
                    ],
                  );
                }).toList(),
                titlesData: FlTitlesData(
                  leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 28,
                      getTitlesWidget: (val, _) {
                        final i = val.toInt();
                        if (i < 0 || i >= data.length) return const SizedBox();
                        final month = (data[i] as Map<String, dynamic>)['month'] ?? '';
                        return Padding(
                          padding: const EdgeInsets.only(top: 6),
                          child: Text(
                            '$month',
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
                gridData: const FlGridData(show: false),
                borderData: FlBorderData(show: false),
                barTouchData: BarTouchData(enabled: false),
              ),
            ),
    );
  }

  Widget _legend(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(3)),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: AppTheme.textSecondary),
        ),
      ],
    );
  }

  // --- (e) Branch performance horizontal bars ---
  Widget _branchPerformanceChart() {
    final perf = _branchPerformance;
    double maxRev = 0;
    for (final b in perf) {
      final r = num.tryParse('${(b as Map<String, dynamic>)['revenue'] ?? 0}') ?? 0;
      if (r > maxRev) maxRev = r.toDouble();
    }
    final height = perf.isEmpty ? 80.0 : 60.0 * perf.length;

    return ChartCard(
      title: 'Branch Performance',
      subtitle: 'Revenue by branch',
      height: height,
      chart: perf.isEmpty
          ? const Center(
              child: Text('No branch data', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
            )
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: perf.map((b) {
                final bm = b as Map<String, dynamic>;
                final name = bm['name'] ?? 'Branch';
                final rev = (num.tryParse('${bm['revenue'] ?? 0}') ?? 0).toDouble();
                final ratio = maxRev > 0 ? (rev / maxRev).clamp(0.0, 1.0) : 0.0;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.textPrimary,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'PKR ${_fmt(rev)}',
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.primary,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: Container(
                          height: 12,
                          color: AppTheme.primary.withOpacity(0.08),
                          child: FractionallySizedBox(
                            alignment: Alignment.centerLeft,
                            widthFactor: ratio,
                            child: Container(
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                  colors: [AppTheme.primary, AppTheme.gold],
                                ),
                                borderRadius: BorderRadius.circular(6),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
    );
  }

  // --- (f) Recent activity (real data from finance API) ---
  Widget _recentActivity() {
    final transactions = (_finance?['recentTransactions'] as List<dynamic>?) ?? [];

    // If no real transactions, don't show the section at all
    if (transactions.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(title: 'Recent Activity', icon: Icons.history_rounded),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          decoration: BoxDecoration(
            color: AppTheme.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.border),
            boxShadow: AppTheme.shadowSm,
          ),
          child: Column(
            children: [
              for (var i = 0; i < transactions.length && i < 6; i++) ...[
                if (i > 0) const Divider(height: 1, color: AppTheme.border),
                ActivityItem(
                  icon: Icons.trending_up_rounded,
                  color: AppTheme.success,
                  title: transactions[i]['type'] ?? 'Transaction',
                  subtitle: 'PKR ${_compact(transactions[i]['amount'])}',
                  time: _fmtDate(transactions[i]['date']),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  String _fmtDate(dynamic d) {
    if (d == null) return '';
    try {
      final dt = DateTime.parse(d.toString());
      final diff = DateTime.now().difference(dt);
      if (diff.inMinutes < 1) return 'Just now';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      if (diff.inDays < 7) return '${diff.inDays}d ago';
      return '${dt.day}/${dt.month}/${dt.year}';
    } catch (_) {
      return '';
    }
  }
}

// =============================== BRANCHES TAB ===============================

class _BranchesTab extends StatelessWidget {
  final Map<String, dynamic> user;
  final List<dynamic> branches;
  final bool isLoading;
  final VoidCallback onRefresh;

  const _BranchesTab({required this.user, required this.branches, required this.isLoading, required this.onRefresh});

  Future<void> _addBranch(BuildContext context) async {
    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (ctx) => _AddBranchDialog(instituteId: user['instituteId']),
    );
    if (result != null) {
      try {
        await ApiClient.post('branches', body: result);
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Branch added successfully'), backgroundColor: AppTheme.success, behavior: SnackBarBehavior.floating),
          );
        }
        onRefresh();
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.danger, behavior: SnackBarBehavior.floating),
          );
        }
      }
    }
  }

  void _openDetail(BuildContext context, Map<String, dynamic> branch) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => InstituteBranchDetail(branch: branch, user: user),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Branches'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add, size: 22),
            tooltip: 'Add Branch',
            onPressed: () => _addBranch(context),
          ),
          IconButton(icon: const Icon(Icons.refresh, size: 20), onPressed: onRefresh),
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : branches.isEmpty
              ? EmptyState(
                  icon: Icons.account_tree_outlined,
                  title: 'No branches yet',
                  description: 'Add your first branch to start managing teachers, students, and fees.',
                  actionText: 'Add Branch',
                  onAction: () => _addBranch(context),
                )
              : RefreshIndicator(
                  onRefresh: () async { onRefresh(); },
                  child: ListView.builder(
                    padding: const EdgeInsets.only(top: 6, bottom: 24),
                    itemCount: branches.length,
                    itemBuilder: (context, i) {
                      final b = branches[i] as Map<String, dynamic>;
                      final name = b['name'] ?? 'Branch';
                      final city = b['city'] ?? '—';
                      final students = b['students'] ?? 0;
                      final teachers = b['teachers'] ?? 0;
                      final blocked = b['blocked'] == true || b['blocked'] == 1;
                      return _PremiumListCard(
                        icon: Icons.account_tree,
                        iconColor: AppTheme.primary,
                        title: name,
                        subtitle: city,
                        trailing: StatusBadge(
                          text: blocked ? 'Blocked' : 'Active',
                          status: blocked ? 'blocked' : 'active',
                        ),
                        onTap: () => _openDetail(context, b),
                        extra: Row(
                          children: [
                            _MiniStat(icon: Icons.school, label: 'Students', value: '$students'),
                            const SizedBox(width: 12),
                            _MiniStat(icon: Icons.group, label: 'Teachers', value: '$teachers'),
                            if (b['manager'] != null && b['manager'].toString().isNotEmpty) ...[
                              const SizedBox(width: 12),
                              Expanded(
                                child: Row(
                                  children: [
                                    Icon(Icons.person_outline, size: 14, color: AppTheme.textMuted),
                                    const SizedBox(width: 4),
                                    Expanded(
                                      child: Text(
                                        b['manager'],
                                        style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ],
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}

class _MiniStat extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _MiniStat({required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 14, color: AppTheme.textMuted),
        const SizedBox(width: 4),
        Text('$value $label', style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary, fontWeight: FontWeight.w500)),
      ],
    );
  }
}

// =============================== ROYALTY TAB ===============================

class _RoyaltyTab extends StatefulWidget {
  final Map<String, dynamic> user;
  const _RoyaltyTab({required this.user});

  @override
  State<_RoyaltyTab> createState() => _RoyaltyTabState();
}

class _RoyaltyTabState extends State<_RoyaltyTab> with AutomaticKeepAliveClientMixin {
  List<dynamic> _invoices = [];
  List<dynamic> _branches = [];
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
      final invoices = await ApiClient.getList('royalty/invoices', query: {'instituteId': widget.user['instituteId']});
      final branches = await ApiClient.getList('branches', query: {'instituteId': widget.user['instituteId']});
      if (mounted) setState(() { _invoices = invoices; _branches = branches; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  String _branchName(String? id) {
    if (id == null) return 'Unknown Branch';
    final match = _branches.where((b) => b['id'] == id).toList();
    return match.isEmpty ? 'Branch' : (match.first['name'] ?? 'Branch');
  }

  Future<void> _markPaid(String? invoiceId) async {
    if (invoiceId == null) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Mark as Paid?'),
        content: const Text('Mark this royalty invoice as paid? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Mark Paid')),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await ApiClient.patch('royalty/invoices/$invoiceId/pay', body: {});
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Royalty invoice marked as paid'), backgroundColor: AppTheme.success, behavior: SnackBarBehavior.floating),
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
    final pending = _invoices.length - paid;
    final totalAmount = _invoices.fold<double>(0, (sum, i) => sum + (double.tryParse('${i['amount'] ?? 0}') ?? 0));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Royalty Invoices'),
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
                      icon: Icons.payments_outlined,
                      title: 'No royalty invoices',
                      description: 'Royalty invoices are generated when you set royalty settings for your branches. Add a branch first, then configure royalty from the branch detail screen.',
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
                                Expanded(child: KpiCard(icon: Icons.pending, label: 'Pending', value: '$pending', iconColor: AppTheme.warning)),
                              ],
                            ),
                          ),
                          const SizedBox(height: 8),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: KpiCard(icon: Icons.account_balance_wallet, label: 'Total Royalty', value: 'PKR ${NumberFormat('##,###').format(totalAmount.toInt())}'),
                          ),
                          const SizedBox(height: 16),
                          const Padding(
                            padding: EdgeInsets.symmetric(horizontal: 16),
                            child: SectionHeader(title: 'All Royalty Invoices'),
                          ),
                          const SizedBox(height: 4),
                          ..._invoices.map((inv) {
                            final status = (inv['status'] ?? 'Pending').toString();
                            final amount = double.tryParse('${inv['amount'] ?? 0}') ?? 0;
                            final month = inv['month'] ?? '—';
                            final year = inv['year'] ?? '';
                            final isPending = status.toLowerCase() != 'paid';
                            return _PremiumListCard(
                              icon: Icons.storefront,
                              iconColor: isPending ? AppTheme.warning : AppTheme.success,
                              title: _branchName(inv['branchId']),
                              subtitle: 'Royalty · $month $year',
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
                              onTap: isPending ? () => _markPaid(inv['id']) : null,
                            );
                          }),
                        ],
                      ),
                    ),
    );
  }
}

// =============================== REPORTS TAB ===============================

class _ReportsTab extends StatelessWidget {
  final Map<String, dynamic> user;
  final Map<String, dynamic>? finance;
  final bool isLoading;
  final VoidCallback onRefresh;

  const _ReportsTab({required this.user, required this.finance, required this.isLoading, required this.onRefresh});

  @override
  Widget build(BuildContext context) {
    final kpi = finance?['kpi'] ?? {};
    final branchPerf = finance?['branchPerformance'] as List<dynamic>? ?? [];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Financial Reports'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh, size: 20), onPressed: onRefresh),
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : finance == null
              ? const EmptyState(icon: Icons.trending_up, title: 'No data', description: 'Financial data will appear here once available.')
              : RefreshIndicator(
                  onRefresh: () async { onRefresh(); },
                  child: ListView(
                    padding: const EdgeInsets.only(top: 12, bottom: 24),
                    children: [
                      // KPI summary cards
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: GridView.count(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          crossAxisCount: 2,
                          mainAxisSpacing: 8,
                          crossAxisSpacing: 8,
                          childAspectRatio: 1.4,
                          children: [
                            KpiCard(icon: Icons.trending_up, label: 'Total Revenue', value: 'PKR ${_fmt(kpi['totalRevenue'])}', iconColor: AppTheme.success),
                            KpiCard(icon: Icons.error_outline, label: 'Pending Fees', value: 'PKR ${_fmt(kpi['pendingFees'])}', iconColor: AppTheme.danger),
                            KpiCard(icon: Icons.wallet, label: 'Salary Paid', value: 'PKR ${_fmt(kpi['totalSalaryPaid'])}'),
                            KpiCard(icon: Icons.balance, label: 'Net Balance', value: 'PKR ${_fmt(kpi['netBalance'])}', iconColor: (int.tryParse('${kpi['netBalance'] ?? 0}') ?? 0) >= 0 ? AppTheme.success : AppTheme.danger),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 16),
                        child: SectionHeader(title: 'Branch Performance'),
                      ),
                      const SizedBox(height: 4),
                      if (branchPerf.isEmpty)
                        const EmptyState(icon: Icons.account_tree_outlined, title: 'No branch data', description: 'Branch revenue figures will appear here.')
                      else
                        ...branchPerf.map((b) {
                          final bp = b as Map<String, dynamic>;
                          final revenue = double.tryParse('${bp['revenue'] ?? bp['totalRevenue'] ?? 0}') ?? 0;
                          final net = double.tryParse('${bp['net'] ?? 0}') ?? 0;
                          final status = (bp['status'] ?? 'Active').toString();
                          return _PremiumListCard(
                            icon: Icons.account_tree,
                            iconColor: AppTheme.primary,
                            title: bp['name'] ?? 'Branch',
                            subtitle: '${bp['students'] ?? 0} students',
                            trailing: StatusBadge(text: status, status: status.toLowerCase()),
                            extra: Container(
                              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                              decoration: BoxDecoration(
                                color: AppTheme.background,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: IntrinsicHeight(
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: _ReportStat(label: 'Revenue', value: 'PKR ${_fmt(revenue)}', color: AppTheme.success),
                                    ),
                                    VerticalDivider(width: 1, thickness: 1, color: AppTheme.border),
                                    Expanded(
                                      child: _ReportStat(label: 'Net', value: 'PKR ${_fmt(net)}', color: net >= 0 ? AppTheme.success : AppTheme.danger),
                                    ),
                                    VerticalDivider(width: 1, thickness: 1, color: AppTheme.border),
                                    Expanded(
                                      child: _ReportStat(label: 'Students', value: '${bp['students'] ?? 0}'),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        }),
                    ],
                  ),
                ),
    );
  }

  String _fmt(dynamic n) => NumberFormat('##,###').format(int.tryParse('${n ?? 0}') ?? 0);
}

class _ReportStat extends StatelessWidget {
  final String label;
  final String value;
  final Color? color;
  const _ReportStat({required this.label, required this.value, this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: color ?? AppTheme.textPrimary)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
      ],
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

// =============================== ADD BRANCH DIALOG ===============================

class _AddBranchDialog extends StatefulWidget {
  final String? instituteId;
  const _AddBranchDialog({required this.instituteId});

  @override
  State<_AddBranchDialog> createState() => _AddBranchDialogState();
}

class _AddBranchDialogState extends State<_AddBranchDialog> {
  final _nameCtrl = TextEditingController();
  final _cityCtrl = TextEditingController();
  final _managerCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _isSaving = false;

  @override
  void dispose() {
    _nameCtrl.dispose(); _cityCtrl.dispose(); _managerCtrl.dispose();
    _emailCtrl.dispose(); _passwordCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final canSubmit = _nameCtrl.text.trim().isNotEmpty &&
        _managerCtrl.text.trim().isNotEmpty &&
        _passwordCtrl.text.isNotEmpty;
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: Row(
        children: [
          Icon(Icons.add_business, color: AppTheme.primary, size: 22),
          const SizedBox(width: 8),
          const Text('Add Branch'),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Branch Name *', prefixIcon: Icon(Icons.store, size: 18)), onChanged: (_) => setState(() {})),
            const SizedBox(height: 8),
            TextField(controller: _cityCtrl, decoration: const InputDecoration(labelText: 'City', prefixIcon: Icon(Icons.location_city, size: 18))),
            const SizedBox(height: 8),
            TextField(controller: _managerCtrl, decoration: const InputDecoration(labelText: 'Manager Name *', prefixIcon: Icon(Icons.person, size: 18)), onChanged: (_) => setState(() {})),
            const SizedBox(height: 8),
            TextField(controller: _emailCtrl, decoration: const InputDecoration(labelText: 'Manager Email', prefixIcon: Icon(Icons.email, size: 18)), keyboardType: TextInputType.emailAddress),
            const SizedBox(height: 8),
            TextField(controller: _passwordCtrl, decoration: const InputDecoration(labelText: 'Password *', prefixIcon: Icon(Icons.lock, size: 18)), obscureText: true, onChanged: (_) => setState(() {})),
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: _isSaving ? null : () => Navigator.pop(context), child: const Text('Cancel')),
        ElevatedButton(
          onPressed: _isSaving || !canSubmit
              ? null
              : () {
                  setState(() => _isSaving = true);
                  Navigator.pop(context, {
                    'name': _nameCtrl.text.trim(),
                    'city': _cityCtrl.text.trim(),
                    'manager': _managerCtrl.text.trim(),
                    'managerEmail': _emailCtrl.text.trim(),
                    'managerPassword': _passwordCtrl.text,
                    'instituteId': widget.instituteId,
                  });
                },
          child: _isSaving
              ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
              : const Text('Add Branch'),
        ),
      ],
    );
  }
}
