import 'package:flutter/material.dart';
import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';

class StudentDashboard extends StatefulWidget {
  final Map<String, dynamic> user;
  const StudentDashboard({super.key, required this.user});

  @override
  State<StudentDashboard> createState() => _StudentDashboardState();
}

class _StudentDashboardState extends State<StudentDashboard> {
  Map<String, dynamic>? _analytics;
  List<dynamic> _courses = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final analytics = await ApiClient.getObject('student/analytics');
      final courses = await ApiClient.getList('student/courses');
      if (mounted) {
        setState(() {
          _analytics = analytics;
          _courses = courses;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final kpi = _analytics?['kpi'] ?? {};
    final name = widget.user['name']?.split(' ').first ?? 'Student';
    final className = widget.user['class'] ?? '';
    final section = widget.user['section'] ?? '';
    final rollNo = widget.user['rollNo'] ?? '';

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Dashboard'),
        actions: [
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
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () async { await _loadData(); },
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  WelcomeBanner(
                    name: name,
                    subtitle: 'Class $className · Section $section · Roll #$rollNo',
                  ),
                  const SizedBox(height: 16),
                  // KPI cards
                  GridView.count(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 2,
                    mainAxisSpacing: 8,
                    crossAxisSpacing: 8,
                    childAspectRatio: 1.4,
                    children: [
                      KpiCard(icon: Icons.event_available, label: 'Attendance', value: '${kpi['attendanceRate'] ?? 0}%', subtitle: '${kpi['totalSessions'] ?? 0} sessions'),
                      KpiCard(icon: Icons.assessment, label: 'Avg Score', value: '${kpi['avgScore'] ?? 0}%', subtitle: '${kpi['totalResults'] ?? 0} results'),
                      KpiCard(icon: Icons.receipt, label: 'Fee Status', value: '${kpi['paidInvoices'] ?? 0}/${kpi['totalInvoices'] ?? 0} paid', subtitle: (kpi['totalPending'] ?? 0) > 0 ? 'Pending' : 'All cleared'),
                      KpiCard(icon: Icons.menu_book, label: 'Courses', value: '${_courses.length}', subtitle: 'enrolled'),
                    ],
                  ),
                  const SizedBox(height: 20),
                  // Quick Actions
                  const SectionHeader(title: 'Quick Actions'),
                  const SizedBox(height: 8),
                  QuickActionCard(icon: Icons.event_available, title: 'My Attendance', subtitle: 'View attendance history', onTap: () {}),
                  const SizedBox(height: 8),
                  QuickActionCard(icon: Icons.assessment, title: 'My Results', subtitle: 'Check exam results', onTap: () {}),
                  const SizedBox(height: 8),
                  QuickActionCard(icon: Icons.receipt, title: 'Invoices', subtitle: 'Download fee challan', onTap: () {}),
                  const SizedBox(height: 20),
                  // My Courses
                  const SectionHeader(title: 'My Courses'),
                  const SizedBox(height: 8),
                  _courses.isEmpty
                      ? const EmptyState(icon: Icons.menu_book, title: 'No courses yet', description: 'Your courses will appear here once assigned.')
                      : ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: _courses.length,
                          itemBuilder: (context, i) {
                            final course = _courses[i];
                            return Card(
                              child: ListTile(
                                leading: Container(
                                  width: 40, height: 40,
                                  decoration: BoxDecoration(color: AppTheme.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                                  child: const Icon(Icons.book, size: 18, color: AppTheme.primary),
                                ),
                                title: Text(course['name'] ?? 'Course', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                                subtitle: Text(course['code'] != null ? 'Code: ${course['code']}' : 'Course', style: const TextStyle(fontSize: 12)),
                                trailing: const Icon(Icons.chevron_right, size: 18, color: AppTheme.textMuted),
                                onTap: () {},
                              ),
                            );
                          },
                        ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
    );
  }
}
