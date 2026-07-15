import 'package:flutter/material.dart';
import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';

class TeacherDashboard extends StatefulWidget {
  final Map<String, dynamic> user;
  const TeacherDashboard({super.key, required this.user});

  @override
  State<TeacherDashboard> createState() => _TeacherDashboardState();
}

class _TeacherDashboardState extends State<TeacherDashboard> {
  Map<String, dynamic>? _analytics;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final analytics = await ApiClient.getObject('teacher/analytics');
      if (mounted) setState(() { _analytics = analytics; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final kpi = _analytics?['kpi'] ?? {};
    final name = widget.user['name']?.split(' ').first ?? 'Teacher';
    final branchName = widget.user['branchName'] ?? '';

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
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () async { await _loadData(); },
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  WelcomeBanner(name: name, subtitle: 'Teacher · $branchName'),
                  const SizedBox(height: 16),
                  GridView.count(
                    shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 2, mainAxisSpacing: 8, crossAxisSpacing: 8, childAspectRatio: 1.4,
                    children: [
                      KpiCard(icon: Icons.menu_book, label: 'Total Classes', value: '${kpi['totalClasses'] ?? 0}'),
                      KpiCard(icon: Icons.group, label: 'Total Students', value: '${kpi['totalStudents'] ?? 0}'),
                      KpiCard(icon: Icons.event_available, label: 'Attendance Rate', value: '${kpi['attendanceRate'] ?? 0}%'),
                      KpiCard(icon: Icons.assessment, label: 'Avg Score', value: '${kpi['avgScore'] ?? 0}%'),
                    ],
                  ),
                  const SizedBox(height: 20),
                  const SectionHeader(title: 'Quick Actions'),
                  const SizedBox(height: 8),
                  QuickActionCard(icon: Icons.assignment_turned_in, title: 'Take Attendance', subtitle: 'Mark student attendance', onTap: () {}),
                  const SizedBox(height: 8),
                  QuickActionCard(icon: Icons.post_add, title: 'Post Results', subtitle: 'Enter exam marks', onTap: () {}),
                  const SizedBox(height: 8),
                  QuickActionCard(icon: Icons.assignment, title: 'Diary & Homework', subtitle: 'Post assignments', onTap: () {}),
                ],
              ),
            ),
    );
  }
}
