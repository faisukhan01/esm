import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';

/// Institute Teachers — lists every teacher user linked to the signed-in
/// institute admin's institute.
///
/// Backend: `GET /api/platform/users?role=teacher&instituteId={instituteId}`
/// returns teacher users with fields:
///   id, name, email, title, status, branchId, subjects, classes
///
/// UI: list of cards with avatar circle (initials), name, title, email,
/// subject chips, and a status chip. Loading / empty / error states with
/// pull-to-refresh.
class InstituteTeachers extends StatefulWidget {
  final Map<String, dynamic> user;

  const InstituteTeachers({super.key, required this.user});

  @override
  State<InstituteTeachers> createState() => _InstituteTeachersState();
}

class _InstituteTeachersState extends State<InstituteTeachers> {
  List<dynamic> _teachers = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  String? get _instituteId {
    final v = widget.user['instituteId'];
    return v == null ? null : v.toString();
  }

  Future<void> _load() async {
    if (!mounted) return;
    final instId = _instituteId;
    if (instId == null || instId.isEmpty) {
      setState(() {
        _isLoading = false;
        _error = null;
        _teachers = [];
      });
      return;
    }
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final list = await ApiClient.getList('platform/users', query: {
        'role': 'teacher',
        'instituteId': instId,
      });
      if (mounted) {
        _teachers = list;
        _error = null;
      }
    } catch (e) {
      if (mounted) {
        _error = e.toString();
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Teachers'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh, size: 20),
            onPressed: _load,
          ),
        ],
      ),
      body: _body(),
    );
  }

  Widget _body() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
    }
    if (_error != null) {
      return _ErrorView(message: _error!, onRetry: _load);
    }
    if (_teachers.isEmpty) {
      return RefreshIndicator(
        onRefresh: _load,
        color: AppTheme.primary,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: const [
            SizedBox(height: 80),
            EmptyState(
              icon: Icons.person_outline_rounded,
              title: 'No teachers yet',
              description: 'Teachers linked to your institute will appear here '
                  'once they are added by a branch manager or platform admin.',
            ),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _load,
      color: AppTheme.primary,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        itemCount: _teachers.length,
        itemBuilder: (context, i) {
          final t = _teachers[i];
          if (t is! Map<String, dynamic>) return const SizedBox.shrink();
          return _TeacherCard(teacher: t);
        },
      ),
    );
  }
}

// =============================== TEACHER CARD ===============================

class _TeacherCard extends StatelessWidget {
  final Map<String, dynamic> teacher;
  const _TeacherCard({required this.teacher});

  @override
  Widget build(BuildContext context) {
    final name = (teacher['name'] ?? 'Unnamed Teacher').toString();
    final title = teacher['title']?.toString();
    final email = teacher['email']?.toString();
    final status = (teacher['status'] ?? 'active').toString();
    final subjectsRaw = teacher['subjects'];
    final subjects = <String>[
      if (subjectsRaw is List)
        ...subjectsRaw.map((s) => s?.toString() ?? '').where((s) => s.isNotEmpty)
      else if (subjectsRaw is String && subjectsRaw.isNotEmpty)
        subjectsRaw,
    ];

    final statusColor = _statusColor(status);

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
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _Avatar(name: name),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          name,
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.textPrimary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      _StatusChip(label: status, color: statusColor),
                    ],
                  ),
                  if (title != null && title.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      title,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.gold,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  if (email != null && email.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        const Icon(Icons.alternate_email_rounded,
                            size: 12, color: AppTheme.textMuted),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            email,
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              color: AppTheme.textSecondary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                  if (subjects.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: subjects
                          .take(4)
                          .map((s) => _SubjectChip(label: s))
                          .toList(),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _statusColor(String status) {
    final s = status.toLowerCase();
    if (s.contains('active') || s.contains('enable')) return AppTheme.success;
    if (s.contains('inactive') || s.contains('disable') || s.contains('suspend')) {
      return AppTheme.danger;
    }
    if (s.contains('pending')) return AppTheme.warning;
    return AppTheme.textMuted;
  }
}

// =============================== SMALL WIDGETS ===============================

class _Avatar extends StatelessWidget {
  final String name;
  const _Avatar({required this.name});

  @override
  Widget build(BuildContext context) {
    final trimmed = name.trim();
    final parts = trimmed.split(RegExp(r'\s+'));
    String initials = '';
    if (parts.isNotEmpty && parts.first.isNotEmpty) {
      initials += parts.first[0];
    }
    if (parts.length > 1 && parts.last.isNotEmpty) {
      initials += parts.last[0];
    }
    initials = initials.toUpperCase();
    if (initials.isEmpty) initials = '?';

    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: AppTheme.primary.withOpacity(0.10),
        borderRadius: BorderRadius.circular(22),
      ),
      alignment: Alignment.center,
      child: Text(
        initials,
        style: GoogleFonts.inter(
          fontSize: 16,
          fontWeight: FontWeight.w800,
          color: AppTheme.primary,
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String label;
  final Color color;
  const _StatusChip({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: GoogleFonts.inter(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          color: color,
        ),
      ),
    );
  }
}

class _SubjectChip extends StatelessWidget {
  final String label;
  const _SubjectChip({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppTheme.accent,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: AppTheme.border),
      ),
      child: Text(
        label,
        style: GoogleFonts.inter(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: AppTheme.textSecondary,
        ),
      ),
    );
  }
}

// =============================== ERROR VIEW ===============================

class _ErrorView extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorView({required this.message, required this.onRetry});

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
            Text(
              'Could not load teachers',
              style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            Text(
              message,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted),
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
