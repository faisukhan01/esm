import 'package:flutter/material.dart';
import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';

class StudentInvoices extends StatefulWidget {
  final Map<String, dynamic> user;
  const StudentInvoices({super.key, required this.user});

  @override
  State<StudentInvoices> createState() => _StudentInvoicesState();
}

class _StudentInvoicesState extends State<StudentInvoices> {
  bool _isLoading = true;
  List<dynamic> _data = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      // Load data based on screen type
      List<dynamic> result;
      if ('student_invoices' == 'student_courses') {
        result = await ApiClient.getList('student/courses');
      } else if ('student_invoices' == 'student_attendance') {
        final r = await ApiClient.getObject('attendance', query: {'studentId': widget.user['id']});
        result = r['entries'] ?? [];
      } else if ('student_invoices' == 'student_results') {
        final r = await ApiClient.getObject('results', query: {'studentId': widget.user['id']});
        result = r['entries'] ?? [];
      } else {
        result = await ApiClient.getList('fee-invoices');
      }
      if (mounted) setState(() { _data = result; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('student_invoices'.replaceFirst('student_', 'My ').replaceAll('_', ' ').split(' ').map((w) => w[0].toUpperCase() + w.substring(1)).join(' '))),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _data.isEmpty
              ? EmptyState(icon: Icons.inbox, title: 'No data yet', description: 'Data will appear here when available.')
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _data.length,
                  itemBuilder: (context, i) => Card(
                    child: ListTile(
                      title: Text(_data[i]['name'] ?? _data[i]['title'] ?? _data[i]['exam'] ?? 'Item ${i + 1}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                      subtitle: Text(_data[i]['date'] ?? _data[i]['month'] ?? '', style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                    ),
                  ),
                ),
    );
  }
}
