import 'package:intl/intl.dart';
import 'package:flutter/material.dart';
import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';

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

class _BranchDashboard extends StatelessWidget {
  final String name;
  final String branchName;
  final Map<String, dynamic> kpi;
  final bool isLoading;
  final VoidCallback onRefresh;
  final Map<String, dynamic> user;

  const _BranchDashboard({required this.name, required this.branchName, required this.kpi, required this.isLoading, required this.onRefresh, required this.user});

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
                  WelcomeBanner(name: name, subtitle: 'Branch Manager · $branchName'),
                  const SizedBox(height: 16),
                  GridView.count(
                    shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 2, mainAxisSpacing: 8, crossAxisSpacing: 8, childAspectRatio: 1.4,
                    children: [
                      KpiCard(icon: Icons.attach_money, label: 'Revenue', value: 'PKR ${_formatNum(kpi['totalRevenue'])}'),
                      KpiCard(icon: Icons.error_outline, label: 'Pending', value: 'PKR ${_formatNum(kpi['pendingFees'])}', iconColor: AppTheme.danger),
                      KpiCard(icon: Icons.wallet, label: 'Salary Paid', value: 'PKR ${_formatNum(kpi['totalSalaryPaid'])}'),
                      KpiCard(icon: Icons.balance, label: 'Net Balance', value: 'PKR ${_formatNum(kpi['netBalance'])}'),
                    ],
                  ),
                ],
              ),
            ),
    );
  }

  String _formatNum(dynamic n) => NumberFormat('##,###').format(int.tryParse('${n ?? 0}') ?? 0);
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
                            return ListRowCard(
                              title: _studentName(inv['studentId']),
                              subtitle: '$type · $month $year',
                              icon: Icons.receipt_outlined,
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
