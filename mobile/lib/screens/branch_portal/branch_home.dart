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
      _PlaceholderScreen(title: 'Teachers'),
      _PlaceholderScreen(title: 'Students'),
      _PlaceholderScreen(title: 'Fees'),
    ];

    return Scaffold(
      body: screens[_currentIndex],
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

class _PlaceholderScreen extends StatelessWidget {
  final String title;
  const _PlaceholderScreen({required this.title});

  @override
  Widget build(BuildContext context) {
    return Scaffold(appBar: AppBar(title: Text(title)), body: const EmptyState(icon: Icons.construction, title: 'Coming Soon', description: 'This section is under development.'));
  }
}
