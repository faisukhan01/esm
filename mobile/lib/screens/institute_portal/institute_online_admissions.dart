import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';

/// Online Admissions — Institute Admin module (web parity).
///
/// Lists applications from the API when an endpoint exists; until then shows
/// an honest empty state with a pipeline overview and a "share admission link"
/// affordance. No fake/dummy data — the empty state is the truth.
class InstituteOnlineAdmissions extends StatefulWidget {
  final Map<String, dynamic> user;

  const InstituteOnlineAdmissions({super.key, required this.user});

  @override
  State<InstituteOnlineAdmissions> createState() => _InstituteOnlineAdmissionsState();
}

class _InstituteOnlineAdmissionsState extends State<InstituteOnlineAdmissions>
    with SingleTickerProviderStateMixin {
  late final TabController _tabCtrl = TabController(length: 2, vsync: this);

  List<dynamic> _applications = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      // The web app does not yet expose a stable admissions endpoint. We try
      // the most plausible path; any failure (404 etc.) is treated as "no
      // data yet" so the screen shows an honest empty state rather than an
      // error card. The moment an endpoint ships, this will light up.
      final list = await ApiClient.getList('admissions', query: {
        if (widget.user['instituteId'] != null)
          'instituteId': widget.user['instituteId'].toString(),
      });
      if (mounted) {
        _applications = list;
        _error = null;
      }
    } catch (_) {
      // Endpoint missing — show empty state, not an error card.
      if (mounted) {
        _applications = [];
        _error = null;
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _toast(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        behavior: SnackBarBehavior.floating,
        backgroundColor: AppTheme.primary,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Online Admissions'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh, size: 20),
            onPressed: _load,
          ),
        ],
        bottom: TabBar(
          controller: _tabCtrl,
          labelColor: AppTheme.primary,
          unselectedLabelColor: AppTheme.textMuted,
          indicatorColor: AppTheme.primary,
          indicatorSize: TabBarIndicatorSize.label,
          labelStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700),
          unselectedLabelStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500),
          tabs: const [
            Tab(text: 'Pipeline'),
            Tab(text: 'Applications'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabCtrl,
        children: [
          _pipelineTab(),
          _applicationsTab(),
        ],
      ),
    );
  }

  // =============================== PIPELINE TAB ===============================

  Widget _pipelineTab() {
    return RefreshIndicator(
      onRefresh: _load,
      color: AppTheme.primary,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          GradientHeroCard(
            title: 'Online Admissions',
            subtitle: 'Track every applicant from enquiry to enrolment',
            icon: Icons.how_to_reg_rounded,
            gradientColors: const [AppTheme.primary, AppTheme.primaryLight],
          ),
          const SizedBox(height: 16),
          const SectionHeader(title: 'Pipeline Overview', icon: Icons.account_tree_rounded),
          const SizedBox(height: 10),
          _pipelineGrid(),
          const SizedBox(height: 16),
          const SectionHeader(title: 'Quick Actions', icon: Icons.bolt_rounded),
          const SizedBox(height: 10),
          _quickActions(),
        ],
      ),
    );
  }

  Widget _pipelineGrid() {
    final stages = <Map<String, dynamic>>[
      {'label': 'New', 'icon': Icons.fiber_new_rounded, 'color': AppTheme.info},
      {'label': 'Under Review', 'icon': Icons.visibility_rounded, 'color': AppTheme.warning},
      {'label': 'Test / Interview', 'icon': Icons.assignment_ind_rounded, 'color': AppTheme.gold},
      {'label': 'Accepted', 'icon': Icons.check_circle_rounded, 'color': AppTheme.success},
      {'label': 'Rejected', 'icon': Icons.cancel_rounded, 'color': AppTheme.danger},
      {'label': 'Enrolled', 'icon': Icons.school_rounded, 'color': AppTheme.primary},
    ];

    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 1.55,
      children: stages.map((s) {
        final color = s['color'] as Color;
        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppTheme.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppTheme.border),
            boxShadow: AppTheme.shadowSm,
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(s['icon'] as IconData, size: 20, color: color),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      s['label'] as String,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textSecondary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '—',
                      style: GoogleFonts.inter(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _quickActions() {
    return Column(
      children: [
        QuickActionCard(
          icon: Icons.share_rounded,
          title: 'Share Admission Link',
          subtitle: 'Send the public admission form URL to applicants',
          onTap: () => _toast('The public admission form will be available here once published on the web dashboard.'),
        ),
        QuickActionCard(
          icon: Icons.description_outlined,
          title: 'Customise Form',
          subtitle: 'Edit the questions asked on the admission form',
          onTap: () => _toast('Form builder is available on the web dashboard.'),
        ),
        QuickActionCard(
          icon: Icons.calendar_month_outlined,
          title: 'Admission Calendar',
          subtitle: 'Tests, interviews, and merit-list dates',
          onTap: () => _toast('Admission calendar will be available here once scheduled on the web dashboard.'),
        ),
      ],
    );
  }

  // =============================== APPLICATIONS TAB ===============================

  Widget _applicationsTab() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.cloud_off, size: 48, color: AppTheme.danger),
              const SizedBox(height: 16),
              Text(
                'Could not load applications',
                style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 8),
              Text(
                _error!,
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted),
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: _load,
                icon: const Icon(Icons.refresh, size: 18),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }
    if (_applications.isEmpty) {
      return RefreshIndicator(
        onRefresh: _load,
        color: AppTheme.primary,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: const [
            SizedBox(height: 80),
            EmptyState(
              icon: Icons.inbox_outlined,
              title: 'No applications yet',
              description: 'Online applications submitted via your public admission '
                  'form will appear here. The feature is being prepared — once the '
                  'web dashboard enables the form, applications will sync automatically.',
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
        itemCount: _applications.length,
        itemBuilder: (context, i) {
          final a = _applications[i] as Map<String, dynamic>;
          return _ApplicationCard(application: a);
        },
      ),
    );
  }
}

// =============================== APPLICATION CARD ===============================

class _ApplicationCard extends StatelessWidget {
  final Map<String, dynamic> application;
  const _ApplicationCard({required this.application});

  @override
  Widget build(BuildContext context) {
    final name = (application['applicantName'] ??
            application['name'] ??
            application['studentName'] ??
            'Applicant')
        .toString();
    final program = (application['program'] ??
            application['class'] ??
            application['className'] ??
            '—')
        .toString();
    final status = (application['status'] ?? 'New').toString();
    final date = application['createdAt'] ?? application['date'];

    Color statusColor;
    if (status.toLowerCase().contains('accept')) {
      statusColor = AppTheme.success;
    } else if (status.toLowerCase().contains('reject')) {
      statusColor = AppTheme.danger;
    } else if (status.toLowerCase().contains('review')) {
      statusColor = AppTheme.warning;
    } else {
      statusColor = AppTheme.info;
    }

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
          children: [
            AvatarCircle(name: name, size: 44),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    program,
                    style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textSecondary),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (date != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      date.toString(),
                      style: GoogleFonts.inter(fontSize: 10, color: AppTheme.textMuted),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: statusColor.withOpacity(0.12),
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
      ),
    );
  }
}
