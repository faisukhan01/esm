import 'package:intl/intl.dart';
import 'package:flutter/material.dart';
import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';

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
      _InstituteDashboard(name: name, instituteName: instituteName, kpi: kpi, branches: _branches, isLoading: _isLoading, onRefresh: _loadData, user: widget.user),
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

class _InstituteDashboard extends StatelessWidget {
  final String name;
  final String instituteName;
  final Map<String, dynamic> kpi;
  final List<dynamic> branches;
  final bool isLoading;
  final VoidCallback onRefresh;
  final Map<String, dynamic> user;

  const _InstituteDashboard({required this.name, required this.instituteName, required this.kpi, required this.branches, required this.isLoading, required this.onRefresh, required this.user});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          IconButton(icon: const Icon(Icons.logout, size: 20), onPressed: () async {
            await ApiClient.logout();
            if (context.mounted) Navigator.pushNamedAndRemoveUntil(context, '/', (_) => false);
          }),
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () async { onRefresh(); },
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  WelcomeBanner(name: name, subtitle: 'Institute Admin · $instituteName'),
                  const SizedBox(height: 16),
                  GridView.count(
                    shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 2, mainAxisSpacing: 8, crossAxisSpacing: 8, childAspectRatio: 1.4,
                    children: [
                      KpiCard(icon: Icons.account_tree, label: 'Branches', value: '${kpi['branches'] ?? branches.length}'),
                      KpiCard(icon: Icons.school, label: 'Students', value: '${kpi['students'] ?? 0}'),
                      KpiCard(icon: Icons.group, label: 'Teachers', value: '${kpi['teachers'] ?? 0}'),
                      KpiCard(icon: Icons.payments, label: 'Revenue', value: 'PKR ${_formatNum(kpi['totalRevenue'])}'),
                    ],
                  ),
                ],
              ),
            ),
    );
  }

  String _formatNum(dynamic n) => NumberFormat('##,###').format(int.tryParse('${n ?? 0}') ?? 0);
}

// =============================== BRANCHES TAB ===============================

class _BranchesTab extends StatelessWidget {
  final Map<String, dynamic> user;
  final List<dynamic> branches;
  final bool isLoading;
  final VoidCallback onRefresh;

  const _BranchesTab({required this.user, required this.branches, required this.isLoading, required this.onRefresh});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Branches'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh, size: 20), onPressed: onRefresh),
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : branches.isEmpty
              ? EmptyState(
                  icon: Icons.account_tree_outlined,
                  title: 'No branches yet',
                  description: 'Add branches from the web dashboard to manage them here.',
                  actionText: 'Refresh',
                  onAction: onRefresh,
                )
              : RefreshIndicator(
                  onRefresh: () async { onRefresh(); },
                  child: ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                    itemCount: branches.length,
                    itemBuilder: (context, i) {
                      final b = branches[i] as Map<String, dynamic>;
                      final name = b['name'] ?? 'Branch';
                      final city = b['city'] ?? '—';
                      final students = b['students'] ?? 0;
                      final teachers = b['teachers'] ?? 0;
                      final blocked = b['blocked'] == true || b['blocked'] == 1;
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: Padding(
                          padding: const EdgeInsets.all(14),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    width: 40, height: 40,
                                    decoration: BoxDecoration(
                                      color: AppTheme.primary.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: const Icon(Icons.account_tree, size: 20, color: AppTheme.primary),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
                                        Text(city, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                                      ],
                                    ),
                                  ),
                                  StatusBadge(
                                    text: blocked ? 'Blocked' : 'Active',
                                    status: blocked ? 'blocked' : 'active',
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Row(
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
                                              style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ],
                          ),
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
                      description: 'Generate royalty invoices from the web dashboard to track branch payments here.',
                      actionText: 'Refresh',
                      onAction: _load,
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView(
                        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                        children: [
                          Row(
                            children: [
                              Expanded(child: KpiCard(icon: Icons.receipt, label: 'Total', value: '${_invoices.length}')),
                              const SizedBox(width: 8),
                              Expanded(child: KpiCard(icon: Icons.check_circle, label: 'Paid', value: '$paid', iconColor: AppTheme.success)),
                              const SizedBox(width: 8),
                              Expanded(child: KpiCard(icon: Icons.pending, label: 'Pending', value: '$pending', iconColor: AppTheme.warning)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          KpiCard(icon: Icons.account_balance_wallet, label: 'Total Royalty', value: 'PKR ${NumberFormat('##,###').format(totalAmount.toInt())}'),
                          const SizedBox(height: 16),
                          const SectionHeader(title: 'All Royalty Invoices'),
                          const SizedBox(height: 8),
                          ..._invoices.map((inv) {
                            final status = (inv['status'] ?? 'Pending').toString();
                            final amount = double.tryParse('${inv['amount'] ?? 0}') ?? 0;
                            final month = inv['month'] ?? '—';
                            final year = inv['year'] ?? '';
                            return ListRowCard(
                              title: _branchName(inv['branchId']),
                              subtitle: 'Royalty · $month $year',
                              icon: Icons.storefront,
                              badgeText: status,
                              badgeStatus: status.toLowerCase(),
                              trailing: 'PKR ${NumberFormat('##,###').format(amount.toInt())}',
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
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                    children: [
                      // KPI summary cards
                      GridView.count(
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
                      const SizedBox(height: 20),
                      const SectionHeader(title: 'Branch Performance'),
                      const SizedBox(height: 8),
                      if (branchPerf.isEmpty)
                        const EmptyState(icon: Icons.account_tree_outlined, title: 'No branch data', description: 'Branch revenue figures will appear here.')
                      else
                        ...branchPerf.map((b) {
                          final bp = b as Map<String, dynamic>;
                          final revenue = double.tryParse('${bp['revenue'] ?? bp['totalRevenue'] ?? 0}') ?? 0;
                          final net = double.tryParse('${bp['net'] ?? 0}') ?? 0;
                          final status = (bp['status'] ?? 'Active').toString();
                          return Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: Padding(
                              padding: const EdgeInsets.all(14),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        width: 36, height: 36,
                                        decoration: BoxDecoration(
                                          color: AppTheme.primary.withOpacity(0.1),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: const Icon(Icons.account_tree, size: 18, color: AppTheme.primary),
                                      ),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: Text(
                                          bp['name'] ?? 'Branch',
                                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                                        ),
                                      ),
                                      StatusBadge(text: status, status: status.toLowerCase()),
                                    ],
                                  ),
                                  const SizedBox(height: 10),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: _ReportStat(label: 'Revenue', value: 'PKR ${_fmt(revenue)}', color: AppTheme.success),
                                      ),
                                      Container(width: 1, height: 28, color: AppTheme.border),
                                      Expanded(
                                        child: _ReportStat(label: 'Net', value: 'PKR ${_fmt(net)}', color: net >= 0 ? AppTheme.success : AppTheme.danger),
                                      ),
                                      Container(width: 1, height: 28, color: AppTheme.border),
                                      Expanded(
                                        child: _ReportStat(label: 'Students', value: '${bp['students'] ?? 0}'),
                                      ),
                                    ],
                                  ),
                                ],
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
