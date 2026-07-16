import 'package:intl/intl.dart';
import 'package:flutter/material.dart';
import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';

class StudentAttendance extends StatefulWidget {
  final Map<String, dynamic> user;
  const StudentAttendance({super.key, required this.user});

  @override
  State<StudentAttendance> createState() => _StudentAttendanceState();
}

class _StudentAttendanceState extends State<StudentAttendance> with AutomaticKeepAliveClientMixin {
  Map<String, dynamic>? _data;
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
      final r = await ApiClient.getObject('attendance', query: {'studentId': widget.user['id']});
      if (mounted) setState(() { _data = r; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  @override
  bool get wantKeepAlive => true;

  String _fmtDate(dynamic d) {
    if (d == null) return '';
    try {
      final dt = DateTime.parse(d.toString());
      return DateFormat('EEE, MMM d yyyy').format(dt);
    } catch (_) {
      return d.toString();
    }
  }

  Color _statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'present': return AppTheme.success;
      case 'absent': return AppTheme.danger;
      case 'late': return AppTheme.warning;
      default: return AppTheme.textMuted;
    }
  }

  IconData _statusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'present': return Icons.check_circle;
      case 'absent': return Icons.cancel;
      case 'late': return Icons.schedule;
      default: return Icons.help_outline;
    }
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final entries = (_data?['entries'] as List<dynamic>?) ?? [];
    final present = _data?['present'] ?? 0;
    final absent = _data?['absent'] ?? 0;
    final late = _data?['late'] ?? 0;
    final total = _data?['total'] ?? entries.length;
    final rate = total > 0 ? ((present / total) * 100).round() : 0;

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Attendance'),
        actions: [IconButton(icon: const Icon(Icons.refresh, size: 20), onPressed: _load)],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _StudentErrorView(error: _error!, onRetry: _load)
              : entries.isEmpty
                  ? const EmptyState(
                      icon: Icons.event_busy,
                      title: 'No attendance records',
                      description: 'Your attendance will appear here once teachers start marking it.',
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView(
                        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                        children: [
                          // Attendance rate hero card
                          Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [AppTheme.primary, AppTheme.primaryLight],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text('Attendance Rate', style: TextStyle(fontSize: 12, color: Colors.white70)),
                                      const SizedBox(height: 4),
                                      Text('$rate%', style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w800, color: Colors.white)),
                                      const SizedBox(height: 2),
                                      Text('$present present of $total sessions', style: const TextStyle(fontSize: 11, color: Colors.white70)),
                                    ],
                                  ),
                                ),
                                SizedBox(
                                  width: 56, height: 56,
                                  child: CircularProgressIndicator(
                                    value: rate / 100,
                                    strokeWidth: 5,
                                    backgroundColor: Colors.white24,
                                    valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                          // Summary row
                          Row(
                            children: [
                              Expanded(child: _SummaryCard(icon: Icons.check_circle, label: 'Present', value: '$present', color: AppTheme.success)),
                              const SizedBox(width: 8),
                              Expanded(child: _SummaryCard(icon: Icons.cancel, label: 'Absent', value: '$absent', color: AppTheme.danger)),
                              const SizedBox(width: 8),
                              Expanded(child: _SummaryCard(icon: Icons.schedule, label: 'Late', value: '$late', color: AppTheme.warning)),
                            ],
                          ),
                          const SizedBox(height: 20),
                          const SectionHeader(title: 'Recent Sessions'),
                          const SizedBox(height: 8),
                          ...entries.map((e) {
                            final entry = e as Map<String, dynamic>;
                            final status = (entry['status'] ?? 'Unknown').toString();
                            return Card(
                              margin: const EdgeInsets.only(bottom: 6),
                              child: Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                child: Row(
                                  children: [
                                    Icon(_statusIcon(status), size: 20, color: _statusColor(status)),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Text(_fmtDate(entry['date']), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppTheme.textPrimary)),
                                    ),
                                    StatusBadge(text: status, status: status.toLowerCase()),
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
}

class _SummaryCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;
  const _SummaryCard({required this.icon, required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            Icon(icon, size: 20, color: color),
            const SizedBox(height: 6),
            Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: color)),
            const SizedBox(height: 2),
            Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
          ],
        ),
      ),
    );
  }
}

class _StudentErrorView extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;
  const _StudentErrorView({required this.error, required this.onRetry});

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
