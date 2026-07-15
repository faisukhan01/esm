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
      _PlaceholderScreen(title: 'Branches'),
      _PlaceholderScreen(title: 'Royalty'),
      _PlaceholderScreen(title: 'Reports'),
    ];

    return Scaffold(
      body: screens[_currentIndex],
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
                      KpiCard(icon: Icons.payments, label: 'Royalty', value: 'PKR ${_formatNum(kpi['totalRevenue'])}'),
                    ],
                  ),
                  const SizedBox(height: 20),
                  const SectionHeader(title: 'Quick Actions'),
                  const SizedBox(height: 8),
                  QuickActionCard(icon: Icons.account_tree, title: 'Manage Branches', subtitle: 'Add, edit, block branches', onTap: () {}),
                  const SizedBox(height: 8),
                  QuickActionCard(icon: Icons.payments, title: 'Royalty Management', subtitle: 'Set royalty, generate invoices', onTap: () {}),
                  const SizedBox(height: 8),
                  QuickActionCard(icon: Icons.trending_up, title: 'Reports', subtitle: 'View analytics & insights', onTap: () {}),
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
