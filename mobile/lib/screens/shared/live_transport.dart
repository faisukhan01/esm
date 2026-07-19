import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';

/// Live Transport — shared screen used by Student and Branch portals.
/// Mirrors the web "Live Transport" module.
///
///   • Branch users see all routes for their branch from
///     GET /api/transport/live?branchId=X
///   • Student users see the same routes for their branch (so they can track
///     their bus in real time).
///   • Each route card shows the driver, vehicle, occupancy, ETA and a
///     status badge. The "Live tracking" section is a placeholder until the
///     map tile integration ships.
class LiveTransport extends StatefulWidget {
  final Map<String, dynamic> user;

  const LiveTransport({super.key, required this.user});

  @override
  State<LiveTransport> createState() => _LiveTransportState();
}

class _LiveTransportState extends State<LiveTransport> {
  List<dynamic> _routes = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Map<String, dynamic> get _query {
    final branchId = widget.user['branchId']?.toString();
    if (branchId != null && branchId.isNotEmpty) return {'branchId': branchId};
    return {};
  }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final obj = await ApiClient.getObject('transport/live', query: _query);
      final routes = (obj['routes'] as List<dynamic>?) ?? const [];
      if (mounted) setState(() => _routes = routes);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final branchId = widget.user['branchId']?.toString();
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Live Transport'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh, size: 20),
            onPressed: _load,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _TransportErrorView(error: _error!, onRetry: _load)
              : (branchId == null || branchId.isEmpty)
                  ? const Center(
                      child: EmptyState(
                        icon: Icons.directions_bus_outlined,
                        title: 'No branch assigned',
                        description: 'Live transport routes are tied to a branch. '
                            'Contact your administrator if you believe this is an error.',
                      ),
                    )
                  : _routes.isEmpty
                      ? RefreshIndicator(
                          onRefresh: _load,
                          color: AppTheme.primary,
                          child: ListView(
                            physics: const AlwaysScrollableScrollPhysics(),
                            children: const [
                              SizedBox(height: 80),
                              EmptyState(
                                icon: Icons.directions_bus_outlined,
                                title: 'No routes yet',
                                description: 'Transport routes configured by your branch '
                                    'will appear here with real-time location and ETA.',
                              ),
                            ],
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh: _load,
                          color: AppTheme.primary,
                          child: ListView(
                            padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
                            physics: const AlwaysScrollableScrollPhysics(),
                            children: [
                              _liveMapPlaceholder(),
                              const SizedBox(height: 12),
                              const SectionHeader(
                                title: 'Active Routes',
                                icon: Icons.alt_route_rounded,
                              ),
                              const SizedBox(height: 10),
                              ..._routes.map((r) {
                                final m = r as Map<String, dynamic>;
                                return _RouteCard(route: m);
                              }),
                            ],
                          ),
                        ),
    );
  }

  Widget _liveMapPlaceholder() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppTheme.primary, AppTheme.primaryLight],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.map_outlined, color: Colors.white, size: 20),
              const SizedBox(width: 8),
              Text(
                'Live Map',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.18),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: const BoxDecoration(
                        color: Colors.greenAccent,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 5),
                    Text(
                      'LIVE',
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Center(
            child: Text(
              'Real-time map view is being prepared.',
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(fontSize: 12, color: Colors.white.withOpacity(0.85)),
            ),
          ),
          const SizedBox(height: 4),
          Center(
            child: Text(
              'ETA and route status below are live.',
              style: GoogleFonts.inter(fontSize: 10, color: Colors.white.withOpacity(0.6)),
            ),
          ),
        ],
      ),
    );
  }
}

// =============================== ROUTE CARD ===============================

class _RouteCard extends StatelessWidget {
  final Map<String, dynamic> route;
  const _RouteCard({required this.route});

  (Color, String, IconData) _statusVisual(String status) {
    switch (status) {
      case 'on-time':
        return (AppTheme.success, 'On Time', Icons.check_circle_outline);
      case 'delayed':
        return (AppTheme.danger, 'Delayed', Icons.error_outline);
      case 'en-route':
        return (AppTheme.info, 'En Route', Icons.directions_bus_filled);
      default:
        return (AppTheme.textMuted, status.isEmpty ? 'Unknown' : status, Icons.help_outline);
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = (route['routeName'] ?? 'Route').toString();
    final driver = (route['driver'] ?? '—').toString();
    final driverPhone = (route['driverPhone'] ?? '').toString();
    final vehicleNo = (route['vehicleNo'] ?? '').toString();
    final capacity = num.tryParse('${route['capacity'] ?? 0}') ?? 0;
    final occupancy = num.tryParse('${route['occupancy'] ?? 0}') ?? 0;
    final speed = num.tryParse('${route['speed'] ?? 0}') ?? 0;
    final eta = num.tryParse('${route['etaMinutes'] ?? 0}') ?? 0;
    final status = (route['status'] ?? '').toString();

    final (statusColor, statusLabel, statusIcon) = _statusVisual(status);
    final occPct = capacity > 0 ? (occupancy / capacity).clamp(0, 1) : 0.0;

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
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.directions_bus, color: AppTheme.primary, size: 20),
                ),
                const SizedBox(width: 10),
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
                        [if (vehicleNo.isNotEmpty) vehicleNo, if (driver.isNotEmpty) driver]
                            .join(' · '),
                        style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(statusIcon, size: 11, color: statusColor),
                      const SizedBox(width: 3),
                      Text(
                        statusLabel,
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: statusColor,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                _RouteStat(
                  icon: Icons.groups_outlined,
                  label: 'Occupancy',
                  value: '$occupancy/$capacity',
                  color: AppTheme.info,
                ),
                _RouteStat(
                  icon: Icons.speed_outlined,
                  label: 'Speed',
                  value: '${speed.toInt()} km/h',
                  color: AppTheme.gold,
                ),
                _RouteStat(
                  icon: Icons.schedule_outlined,
                  label: 'ETA',
                  value: '${eta.toInt()} min',
                  color: statusColor,
                ),
              ],
            ),
            const SizedBox(height: 10),
            // Occupancy bar
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: occPct.toDouble(),
                minHeight: 5,
                backgroundColor: AppTheme.border,
                valueColor: AlwaysStoppedAnimation<Color>(
                  occPct > 0.85 ? AppTheme.danger : AppTheme.success,
                ),
              ),
            ),
            if (driverPhone.isNotEmpty) ...[
              const SizedBox(height: 10),
              Row(
                children: [
                  const Icon(Icons.phone_outlined, size: 12, color: AppTheme.textMuted),
                  const SizedBox(width: 4),
                  Text(
                    driverPhone,
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      color: AppTheme.textSecondary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _RouteStat extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;
  const _RouteStat({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Row(
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: GoogleFonts.inter(fontSize: 9, color: AppTheme.textMuted),
                ),
                Text(
                  value,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// =============================== ERROR VIEW ===============================

class _TransportErrorView extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;
  const _TransportErrorView({required this.error, required this.onRetry});

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
              'Could not load routes',
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
