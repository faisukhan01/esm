import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';

/// Complaint Portal — shared screen used by Student, Teacher and Branch
/// portals. Mirrors the web "Complaint Portal" module:
///   • Lists complaints from GET /api/complaints
///   • "New Complaint" form posts to POST /api/complaints
///   • Each card shows subject, message, status badge and timestamp.
///
/// No fake data — empty state is shown when no complaints exist or when the
/// endpoint is not yet available.
class ComplaintPortal extends StatefulWidget {
  final Map<String, dynamic> user;

  const ComplaintPortal({super.key, required this.user});

  @override
  State<ComplaintPortal> createState() => _ComplaintPortalState();
}

class _ComplaintPortalState extends State<ComplaintPortal> {
  List<dynamic> _complaints = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Map<String, dynamic> get _query {
    final role = widget.user['role']?.toString();
    final instituteId = widget.user['instituteId']?.toString();
    final branchId = widget.user['branchId']?.toString();
    final userId = widget.user['id']?.toString();

    // Branch managers & institute admins see everything for their scope.
    // Teachers see branch-wide complaints. Students only see their own.
    if (role == 'institute-admin' && instituteId != null) {
      return {'instituteId': instituteId};
    }
    if (role == 'branch-manager' && branchId != null) {
      return {'branchId': branchId};
    }
    if (role == 'teacher' && branchId != null) {
      return {'branchId': branchId};
    }
    // Student / fallback: send parentId param so the server returns the
    // student's own complaints.
    return {'parentId': userId};
  }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final list = await ApiClient.getList('complaints', query: _query);
      if (mounted) setState(() => _complaints = list);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _openNewComplaintForm() async {
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => _NewComplaintSheet(user: widget.user),
    );
    if (result == true) _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Complaint Portal'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh, size: 20),
            onPressed: _load,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openNewComplaintForm,
        backgroundColor: AppTheme.primary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add, size: 20),
        label: Text('New Complaint', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _ComplaintErrorView(error: _error!, onRetry: _load)
              : _complaints.isEmpty
                  ? RefreshIndicator(
                      onRefresh: _load,
                      color: AppTheme.primary,
                      child: ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        children: const [
                          SizedBox(height: 80),
                          EmptyState(
                            icon: Icons.feedback_outlined,
                            title: 'No complaints yet',
                            description: 'Submit a new complaint using the button below. '
                                'Your concerns will appear here with their current status.',
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      color: AppTheme.primary,
                      child: ListView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 12, 16, 96),
                        itemCount: _complaints.length,
                        itemBuilder: (context, i) {
                          final c = _complaints[i] as Map<String, dynamic>;
                          return _ComplaintCard(complaint: c);
                        },
                      ),
                    ),
    );
  }
}

// =============================== COMPLAINT CARD ===============================

class _ComplaintCard extends StatelessWidget {
  final Map<String, dynamic> complaint;
  const _ComplaintCard({required this.complaint});

  String _fmtDate(dynamic d) {
    if (d == null) return '';
    try {
      return DateFormat('MMM d, yyyy · h:mm a').format(DateTime.parse(d.toString()));
    } catch (_) {
      return d.toString();
    }
  }

  @override
  Widget build(BuildContext context) {
    final subject = (complaint['subject'] ?? 'Complaint').toString();
    final message = (complaint['message'] ?? '').toString();
    final status = (complaint['status'] ?? 'Open').toString();
    final response = complaint['response']?.toString();
    final createdAt = complaint['createdAt'] ?? complaint['createdAt'];
    final id = complaint['id']?.toString();

    final isResolved = status.toLowerCase() == 'resolved';
    final statusColor = isResolved ? AppTheme.success : AppTheme.warning;
    final statusBg = isResolved ? AppTheme.successLight : AppTheme.warningLight;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.border),
        boxShadow: AppTheme.shadowSm,
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.feedback_outlined, size: 18, color: AppTheme.primary),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    subject,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textPrimary,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: statusBg,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    status,
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: statusColor,
                    ),
                  ),
                ),
              ],
            ),
            if (message.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                message,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: AppTheme.textSecondary,
                  height: 1.45,
                ),
                maxLines: 5,
                overflow: TextOverflow.ellipsis,
              ),
            ],
            if (response != null && response.isNotEmpty) ...[
              const SizedBox(height: 10),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppTheme.success.withOpacity(0.06),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppTheme.success.withOpacity(0.2)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.check_circle_outline, size: 14, color: AppTheme.success),
                        const SizedBox(width: 4),
                        Text(
                          'Official Response',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.success,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      response,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: AppTheme.textPrimary,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 10),
            Row(
              children: [
                if (id != null) ...[
                  Text(
                    '#$id',
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textMuted,
                    ),
                  ),
                  const SizedBox(width: 8),
                ],
                Expanded(
                  child: Text(
                    _fmtDate(createdAt),
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      color: AppTheme.textMuted,
                    ),
                    textAlign: TextAlign.right,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// =============================== NEW COMPLAINT SHEET ===============================

class _NewComplaintSheet extends StatefulWidget {
  final Map<String, dynamic> user;
  const _NewComplaintSheet({required this.user});

  @override
  State<_NewComplaintSheet> createState() => _NewComplaintSheetState();
}

class _NewComplaintSheetState extends State<_NewComplaintSheet> {
  final _subjectCtrl = TextEditingController();
  final _messageCtrl = TextEditingController();
  String _category = 'General';
  bool _isSubmitting = false;

  static const _categories = [
    'General',
    'Academic',
    'Facilities',
    'Behavior',
    'Fees',
    'Transport',
    'Other',
  ];

  @override
  void dispose() {
    _subjectCtrl.dispose();
    _messageCtrl.dispose();
    super.dispose();
  }

  bool get _canSubmit =>
      _subjectCtrl.text.trim().isNotEmpty &&
      _messageCtrl.text.trim().isNotEmpty &&
      !_isSubmitting;

  Future<void> _submit() async {
    if (!_canSubmit) return;
    setState(() => _isSubmitting = true);
    try {
      // Build the subject line so the dashboard shows the category at a glance.
      final fullSubject = _category == 'General' ? _subjectCtrl.text.trim() : '[$_category] ${_subjectCtrl.text.trim()}';
      await ApiClient.post(
        'complaints',
        body: {
          'subject': fullSubject,
          'message': _messageCtrl.text.trim(),
          // Server fills parentId / instituteId / branchId from the auth user,
          // but we pass them too for safety.
          if (widget.user['instituteId'] != null)
            'instituteId': widget.user['instituteId'].toString(),
          if (widget.user['branchId'] != null)
            'branchId': widget.user['branchId'].toString(),
          if (widget.user['id'] != null)
            'studentId': widget.user['id'].toString(),
        },
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Complaint submitted'),
            behavior: SnackBarBehavior.floating,
            backgroundColor: AppTheme.success,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString()),
            behavior: SnackBarBehavior.floating,
            backgroundColor: AppTheme.danger,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Drag handle
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 14),
                decoration: BoxDecoration(
                  color: AppTheme.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Text(
              'New Complaint',
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Tell us what went wrong. A branch manager will respond shortly.',
              style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textSecondary),
            ),
            const SizedBox(height: 18),

            // Category chips
            Text(
              'Category',
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppTheme.textSecondary,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _categories.map((c) {
                final selected = _category == c;
                return GestureDetector(
                  onTap: () => setState(() => _category = c),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: selected ? AppTheme.primary : AppTheme.surface,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: selected ? AppTheme.primary : AppTheme.border,
                      ),
                    ),
                    child: Text(
                      c,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: selected ? Colors.white : AppTheme.textSecondary,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),

            // Subject
            TextField(
              controller: _subjectCtrl,
              decoration: const InputDecoration(
                labelText: 'Subject',
                hintText: 'Short summary of the issue',
                prefixIcon: Icon(Icons.title, size: 18),
              ),
              textCapitalization: TextCapitalization.sentences,
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: 12),

            // Message
            TextField(
              controller: _messageCtrl,
              decoration: const InputDecoration(
                labelText: 'Details',
                hintText: 'Describe what happened, when, and any people involved',
                prefixIcon: Icon(Icons.description_outlined, size: 18),
                alignLabelWithHint: true,
              ),
              maxLines: 5,
              textCapitalization: TextCapitalization.sentences,
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: 20),

            Row(
              children: [
                TextButton(
                  onPressed: _isSubmitting ? null : () => Navigator.pop(context, false),
                  child: const Text('Cancel'),
                ),
                const Spacer(),
                ElevatedButton.icon(
                  onPressed: _canSubmit ? _submit : null,
                  icon: _isSubmitting
                      ? const SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Icon(Icons.send, size: 16),
                  label: Text(_isSubmitting ? 'Submitting…' : 'Submit'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// =============================== ERROR VIEW ===============================

class _ComplaintErrorView extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;
  const _ComplaintErrorView({required this.error, required this.onRetry});

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
            const Text(
              'Something went wrong',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
            ),
            const SizedBox(height: 4),
            Text(
              error,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh, size: 18),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}
