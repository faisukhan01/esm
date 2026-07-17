import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../services/api_client.dart';
import '../theme/app_theme.dart';
import '../widgets/shared_widgets.dart';

class AnnouncementsScreen extends StatefulWidget {
  final Map<String, dynamic> user;
  const AnnouncementsScreen({super.key, required this.user});

  @override
  State<AnnouncementsScreen> createState() => _AnnouncementsScreenState();
}

class _AnnouncementsScreenState extends State<AnnouncementsScreen> {
  List<dynamic> _announcements = [];
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
      final list = await ApiClient.getList('announcements');
      if (mounted) setState(() { _announcements = list; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  Future<void> _createAnnouncement() async {
    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (ctx) => _CreateAnnouncementDialog(user: widget.user),
    );
    if (result != null) {
      try {
        await ApiClient.post('announcements', body: result);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Announcement sent'), backgroundColor: AppTheme.success, behavior: SnackBarBehavior.floating),
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
  }

  Future<void> _deleteAnnouncement(String id, bool isFromMe) async {
    if (!isFromMe && widget.user['role'] != 'super-admin') {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('You can only delete your own announcements'), backgroundColor: AppTheme.danger, behavior: SnackBarBehavior.floating),
        );
      }
      return;
    }
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Delete Announcement?'),
        content: const Text('This announcement will be permanently removed. This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.danger),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await ApiClient.delete('announcements/$id');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Announcement deleted'), backgroundColor: AppTheme.success, behavior: SnackBarBehavior.floating),
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

  String _fmtDate(dynamic d) {
    if (d == null) return '';
    try {
      final dt = DateTime.parse(d.toString());
      return DateFormat('MMM d, yyyy · h:mm a').format(dt);
    } catch (_) {
      return d.toString();
    }
  }

  Color _targetColor(String? role) {
    switch (role) {
      case 'super-admin': return AppTheme.primary;
      case 'institute-admin': return AppTheme.info;
      case 'branch-manager': return AppTheme.gold;
      case 'teacher': return AppTheme.success;
      case 'student': return AppTheme.warning;
      default: return AppTheme.textMuted;
    }
  }

  String _targetLabel(String? role) {
    switch (role) {
      case 'super-admin': return 'Super Admin';
      case 'institute-admin': return 'Institute Admin';
      case 'branch-manager': return 'Branch Managers';
      case 'teacher': return 'Teachers';
      case 'student': return 'Students';
      default: return 'Everyone';
    }
  }

  @override
  Widget build(BuildContext context) {
    final canSend = widget.user['role'] == 'super-admin' || widget.user['role'] == 'institute-admin' || widget.user['role'] == 'branch-manager' || widget.user['role'] == 'teacher';
    return Scaffold(
      appBar: AppBar(
        title: const Text('Announcements'),
        actions: [
          if (canSend)
            IconButton(
              icon: const Icon(Icons.add, size: 22),
              tooltip: 'New Announcement',
              onPressed: _createAnnouncement,
            ),
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
              : _announcements.isEmpty
                  ? const EmptyState(
                      icon: Icons.campaign_outlined,
                      title: 'No announcements',
                      description: 'Announcements from your institute or branch will appear here.',
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _announcements.length,
                        itemBuilder: (context, i) {
                          final a = _announcements[i] as Map<String, dynamic>;
                          final fromRole = a['senderRole']?.toString();
                          final targetRole = a['targetRole']?.toString();
                          final isFromMe = a['senderId'] == widget.user['id'];
                          return Container(
                            margin: const EdgeInsets.only(bottom: 10),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: AppTheme.surface,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: AppTheme.border),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      width: 36, height: 36,
                                      decoration: BoxDecoration(
                                        color: _targetColor(fromRole).withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: Icon(isFromMe ? Icons.send : Icons.campaign, size: 18, color: _targetColor(fromRole)),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(a['title'] ?? 'Announcement', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
                                          Text(isFromMe ? 'You → ${_targetLabel(targetRole)}' : 'From ${_targetLabel(fromRole)}', style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted)),
                                        ],
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: _targetColor(targetRole).withOpacity(0.08),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(_targetLabel(targetRole), style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: _targetColor(targetRole))),
                                    ),
                                    if (isFromMe || widget.user['role'] == 'super-admin') ...[
                                      const SizedBox(width: 4),
                                      GestureDetector(
                                        onTap: () => _deleteAnnouncement(a['id']?.toString() ?? '', isFromMe),
                                        child: Container(
                                          width: 28, height: 28,
                                          decoration: BoxDecoration(
                                            color: AppTheme.danger.withOpacity(0.08),
                                            borderRadius: BorderRadius.circular(7),
                                          ),
                                          child: const Icon(Icons.delete_outline, size: 15, color: AppTheme.danger),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                                if (a['message']?.toString().isNotEmpty == true) ...[
                                  const SizedBox(height: 10),
                                  Text(a['message'], style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textSecondary, height: 1.4)),
                                ],
                                const SizedBox(height: 8),
                                Text(_fmtDate(a['createdAt']), style: GoogleFonts.inter(fontSize: 10, color: AppTheme.textMuted)),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
    );
  }
}

// =============================== CREATE ANNOUNCEMENT DIALOG ===============================

class _CreateAnnouncementDialog extends StatefulWidget {
  final Map<String, dynamic> user;
  const _CreateAnnouncementDialog({required this.user});

  @override
  State<_CreateAnnouncementDialog> createState() => _CreateAnnouncementDialogState();
}

class _CreateAnnouncementDialogState extends State<_CreateAnnouncementDialog> {
  final _titleCtrl = TextEditingController();
  final _messageCtrl = TextEditingController();
  String _targetRole = 'all';
  bool _isSending = false;

  List<_TargetOption> get _targets {
    final role = widget.user['role'];
    if (role == 'super-admin') {
      return [
        _TargetOption('all', 'Everyone'),
        _TargetOption('institute-admin', 'Institute Admins'),
        _TargetOption('branch-manager', 'Branch Managers'),
        _TargetOption('teacher', 'Teachers'),
        _TargetOption('student', 'Students'),
      ];
    } else if (role == 'institute-admin') {
      return [
        _TargetOption('all', 'Everyone in Institute'),
        _TargetOption('branch-manager', 'Branch Managers'),
        _TargetOption('teacher', 'Teachers'),
        _TargetOption('student', 'Students'),
      ];
    } else if (role == 'branch-manager') {
      return [
        _TargetOption('all', 'Everyone in Branch'),
        _TargetOption('teacher', 'Teachers'),
        _TargetOption('student', 'Students'),
      ];
    } else {
      return [
        _TargetOption('all', 'My Classes'),
        _TargetOption('student', 'Students'),
      ];
    }
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _messageCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final canSend = _titleCtrl.text.trim().isNotEmpty && _messageCtrl.text.trim().isNotEmpty;
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: Row(
        children: [
          Icon(Icons.campaign, color: AppTheme.primary, size: 22),
          const SizedBox(width: 8),
          const Text('New Announcement'),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(controller: _titleCtrl, decoration: const InputDecoration(labelText: 'Title *', prefixIcon: Icon(Icons.title, size: 18)), onChanged: (_) => setState(() {})),
            const SizedBox(height: 8),
            TextField(controller: _messageCtrl, decoration: const InputDecoration(labelText: 'Message *', prefixIcon: Icon(Icons.message, size: 18)), maxLines: 3, onChanged: (_) => setState(() {})),
            const SizedBox(height: 12),
            Text('Send to', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textSecondary)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              children: _targets.map((t) => ChoiceChip(
                label: Text(t.label, style: GoogleFonts.inter(fontSize: 11)),
                selected: _targetRole == t.value,
                onSelected: (_) => setState(() => _targetRole = t.value),
                selectedColor: AppTheme.primary.withOpacity(0.1),
                labelStyle: TextStyle(color: _targetRole == t.value ? AppTheme.primary : AppTheme.textSecondary, fontWeight: FontWeight.w600),
              )).toList(),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: _isSending ? null : () => Navigator.pop(context), child: const Text('Cancel')),
        ElevatedButton(
          onPressed: _isSending || !canSend
              ? null
              : () {
                  setState(() => _isSending = true);
                  Navigator.pop(context, {
                    'title': _titleCtrl.text.trim(),
                    'message': _messageCtrl.text.trim(),
                    'targetRole': _targetRole,
                    'senderRole': widget.user['role'],
                  });
                },
          child: _isSending
              ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
              : const Text('Send'),
        ),
      ],
    );
  }
}

class _TargetOption {
  final String value;
  final String label;
  _TargetOption(this.value, this.label);
}
