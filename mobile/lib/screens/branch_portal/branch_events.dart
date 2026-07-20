import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';

/// Branch Events — branch-manager module (web parity).
///
/// Backend: `GET /api/events?branchId={branchId}` returns events with
/// `id, title, description, startDate, endDate, location, type`.
class BranchEvents extends StatefulWidget {
  final Map<String, dynamic> user;
  const BranchEvents({super.key, required this.user});

  @override
  State<BranchEvents> createState() => _BranchEventsState();
}

class _BranchEventsState extends State<BranchEvents> {
  List<Map<String, dynamic>> _events = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() { _isLoading = true; _error = null; });
    try {
      final list = await ApiClient.getList('events', query: {
        if (widget.user['branchId'] != null)
          'branchId': widget.user['branchId'].toString(),
      });
      final events = list
          .whereType<Map<String, dynamic>>()
          .toList(growable: false);
      // Sort by startDate DESC (server already does this, but be defensive).
      events.sort((a, b) {
        final da = (a['startDate'] ?? a['date'] ?? '').toString();
        final db = (b['startDate'] ?? b['date'] ?? '').toString();
        return db.compareTo(da);
      });
      if (mounted) {
        setState(() {
          _events = events;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() { _error = e.toString(); _isLoading = false; });
      }
    }
  }

  String _fmtDate(String? raw) {
    if (raw == null || raw.isEmpty) return '';
    final d = DateTime.tryParse(raw);
    if (d == null) return raw;
    return DateFormat('EEE, d MMM yyyy').format(d);
  }

  String _fmtTime(String? raw) {
    if (raw == null || raw.isEmpty) return '';
    final d = DateTime.tryParse(raw);
    if (d == null) return '';
    return DateFormat('h:mm a').format(d);
  }

  @override
  Widget build(BuildContext context) {
    Widget body;
    if (_isLoading) {
      body = const Center(child: CircularProgressIndicator());
    } else if (_error != null) {
      body = _ErrorView(error: _error!, onRetry: _load);
    } else if (_events.isEmpty) {
      body = RefreshIndicator(
        onRefresh: _load,
        color: AppTheme.primary,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: const [
            SizedBox(height: 80),
            EmptyState(
              icon: Icons.event_busy,
              title: 'No events yet',
              description: 'Branch events — exams, holidays, meetings, sports '
                  'days — will appear here once they are scheduled.',
            ),
          ],
        ),
      );
    } else {
      body = RefreshIndicator(
        onRefresh: _load,
        color: AppTheme.primary,
        child: ListView.builder(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          itemCount: _events.length,
          itemBuilder: (context, i) {
            final e = _events[i];
            return _EventCard(
              title: (e['title'] ?? 'Event').toString(),
              description: (e['description'] ?? '').toString(),
              type: (e['type'] ?? 'Event').toString(),
              location: (e['location'] ?? '').toString(),
              startDateLabel: _fmtDate(e['startDate']?.toString()),
              endDateLabel: _fmtDate(e['endDate']?.toString()),
              startTimeLabel: _fmtTime(e['startDate']?.toString()),
            );
          },
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Events'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, size: 20),
            tooltip: 'Refresh',
            onPressed: _load,
          ),
        ],
      ),
      body: body,
    );
  }
}

// =============================== EVENT CARD ===============================

class _EventCard extends StatelessWidget {
  final String title;
  final String description;
  final String type;
  final String location;
  final String startDateLabel;
  final String endDateLabel;
  final String startTimeLabel;

  const _EventCard({
    required this.title,
    required this.description,
    required this.type,
    required this.location,
    required this.startDateLabel,
    required this.endDateLabel,
    required this.startTimeLabel,
  });

  ({IconData icon, Color color}) _typeStyle(String type) {
    final t = type.toLowerCase();
    if (t.contains('exam') || t.contains('test')) {
      return (icon: Icons.assignment, color: AppTheme.danger);
    }
    if (t.contains('holiday')) {
      return (icon: Icons.beach_access, color: AppTheme.info);
    }
    if (t.contains('meeting') || t.contains('ptm')) {
      return (icon: Icons.groups, color: AppTheme.primary);
    }
    if (t.contains('sport')) {
      return (icon: Icons.sports_soccer, color: AppTheme.success);
    }
    if (t.contains('trip') || t.contains('tour')) {
      return (icon: Icons.directions_bus, color: AppTheme.warning);
    }
    if (t.contains('deadline') || t.contains('due')) {
      return (icon: Icons.alarm, color: AppTheme.warning);
    }
    return (icon: Icons.event, color: AppTheme.gold);
  }

  @override
  Widget build(BuildContext context) {
    final style = _typeStyle(type);
    final hasRange = endDateLabel.isNotEmpty && endDateLabel != startDateLabel;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
        boxShadow: AppTheme.shadowSm,
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Date column — calendar-style chip with the icon
            Container(
              width: 46,
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                color: style.color.withOpacity(0.10),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                children: [
                  Icon(style.icon, size: 20, color: style.color),
                  const SizedBox(height: 4),
                  Container(
                    width: 4,
                    height: 4,
                    decoration: BoxDecoration(
                      color: style.color,
                      shape: BoxShape.circle,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          title,
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
                        padding: const EdgeInsets.symmetric(
                            horizontal: 7, vertical: 2),
                        decoration: BoxDecoration(
                          color: style.color.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          type,
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: style.color,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.calendar_today_outlined,
                          size: 13, color: AppTheme.textMuted),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          hasRange
                              ? '$startDateLabel → $endDateLabel'
                              : (startDateLabel.isEmpty
                                  ? 'Date TBD'
                                  : startDateLabel),
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: AppTheme.textSecondary,
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (startTimeLabel.isNotEmpty) ...[
                        const SizedBox(width: 8),
                        const Icon(Icons.access_time,
                            size: 13, color: AppTheme.textMuted),
                        const SizedBox(width: 3),
                        Text(
                          startTimeLabel,
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            color: AppTheme.textMuted,
                          ),
                        ),
                      ],
                    ],
                  ),
                  if (location.isNotEmpty) ...[
                    const SizedBox(height: 3),
                    Row(
                      children: [
                        const Icon(Icons.location_on_outlined,
                            size: 13, color: AppTheme.textMuted),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            location,
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: AppTheme.textSecondary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                  if (description.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(
                      description,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: AppTheme.textSecondary,
                        height: 1.4,
                      ),
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
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
}

// =============================== ERROR VIEW (file-scoped) ===============================

class _ErrorView extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;
  const _ErrorView({required this.error, required this.onRetry});

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
              style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textPrimary),
            ),
            const SizedBox(height: 4),
            Text(
              error,
              textAlign: TextAlign.center,
              style: const TextStyle(
                  fontSize: 12, color: AppTheme.textMuted),
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
