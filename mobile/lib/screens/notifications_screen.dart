import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../services/api_client.dart';
import '../theme/app_theme.dart';
import '../widgets/shared_widgets.dart';

class NotificationsScreen extends StatefulWidget {
  final Map<String, dynamic> user;
  const NotificationsScreen({super.key, required this.user});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<dynamic> _items = [];
  int _unread = 0;
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
      final r = await ApiClient.getObject('notifications');
      if (mounted) {
        setState(() {
          _items = (r['items'] as List<dynamic>?) ?? [];
          _unread = r['unread'] ?? 0;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  String _fmtTime(dynamic t) {
    if (t == null) return '';
    try {
      final dt = DateTime.parse(t.toString());
      final now = DateTime.now();
      final diff = now.difference(dt);
      if (diff.inMinutes < 1) return 'Just now';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      if (diff.inDays < 7) return '${diff.inDays}d ago';
      return DateFormat('MMM d').format(dt);
    } catch (_) {
      return t.toString();
    }
  }

  IconData _iconForType(String type) {
    switch (type.toLowerCase()) {
      case 'announcement': return Icons.campaign_outlined;
      case 'complaint': return Icons.report_problem_outlined;
      case 'fee': return Icons.receipt_outlined;
      case 'result': return Icons.assessment_outlined;
      case 'attendance': return Icons.event_available_outlined;
      default: return Icons.notifications_outlined;
    }
  }

  Color _colorForType(String type) {
    switch (type.toLowerCase()) {
      case 'announcement': return AppTheme.primary;
      case 'complaint': return AppTheme.danger;
      case 'fee': return AppTheme.gold;
      case 'result': return AppTheme.success;
      case 'attendance': return AppTheme.info;
      default: return AppTheme.textSecondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh, size: 20), onPressed: _load),
        ],
      ),
      body: _isLoading
          ? const DashboardSkeleton()
          : _error != null
              ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  const Icon(Icons.cloud_off, size: 48, color: AppTheme.danger),
                  const SizedBox(height: 12),
                  Text(_error!, style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted), textAlign: TextAlign.center),
                  const SizedBox(height: 12),
                  ElevatedButton(onPressed: _load, child: const Text('Retry')),
                ]))
              : _items.isEmpty
                  ? const EmptyState(
                      icon: Icons.notifications_none_outlined,
                      title: 'No notifications',
                      description: 'You\'re all caught up! New announcements and alerts will appear here.',
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _items.length,
                        itemBuilder: (context, i) {
                          final n = _items[i] as Map<String, dynamic>;
                          final type = (n['type'] ?? 'general').toString();
                          final title = n['title'] ?? 'Notification';
                          final message = n['message'] ?? n['body'] ?? '';
                          final time = n['createdAt'] ?? n['time'];
                          final read = n['read'] == true;
                          return Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            decoration: BoxDecoration(
                              color: read ? AppTheme.surface : AppTheme.primary.withOpacity(0.03),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: read ? AppTheme.border : AppTheme.primary.withOpacity(0.15)),
                              boxShadow: AppTheme.shadowSm,
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(14),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    width: 40, height: 40,
                                    decoration: BoxDecoration(
                                      color: _colorForType(type).withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Icon(_iconForType(type), size: 18, color: _colorForType(type)),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Expanded(child: Text(title, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textPrimary))),
                                            if (!read) ...[
                                              Container(width: 8, height: 8, decoration: BoxDecoration(color: AppTheme.primary, borderRadius: BorderRadius.circular(4))),
                                              const SizedBox(width: 6),
                                            ],
                                            Text(_fmtTime(time), style: GoogleFonts.inter(fontSize: 10, color: AppTheme.textMuted)),
                                          ],
                                        ),
                                        if (message.toString().isNotEmpty) ...[
                                          const SizedBox(height: 4),
                                          Text(message, style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textSecondary), maxLines: 3, overflow: TextOverflow.ellipsis),
                                        ],
                                      ],
                                    ),
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
