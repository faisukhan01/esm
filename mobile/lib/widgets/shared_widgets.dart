import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';

// =============================== KPI CARD (legacy compat) ===============================

/// Legacy KpiCard — delegates to PremiumStatCard for backwards compatibility
/// with older screens that still use the `KpiCard` name.
class KpiCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final String? subtitle;
  final Color? iconColor;

  const KpiCard({
    super.key,
    required this.icon,
    required this.label,
    required this.value,
    this.subtitle,
    this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return PremiumStatCard(
      icon: icon,
      label: label,
      value: value,
      subtitle: subtitle,
      color: iconColor,
    );
  }
}

// =============================== WELCOME BANNER (legacy compat) ===============================

class WelcomeBanner extends StatelessWidget {
  final String name;
  final String subtitle;
  final List<Widget>? actions;

  const WelcomeBanner({super.key, required this.name, required this.subtitle, this.actions});

  @override
  Widget build(BuildContext context) {
    return GradientHeroCard(
      title: 'Hi, $name!',
      subtitle: subtitle,
      icon: Icons.waving_hand,
      gradientColors: const [AppTheme.primary, AppTheme.primaryLight],
      actions: actions,
    );
  }
}

// =============================== QUICK ACTION CARD (legacy compat) ===============================

class QuickActionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const QuickActionCard({super.key, required this.icon, required this.title, required this.subtitle, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
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
              width: 40, height: 40,
              decoration: BoxDecoration(color: AppTheme.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
              child: Icon(icon, size: 20, color: AppTheme.primary),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
                  Text(subtitle, style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted)),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, size: 18, color: AppTheme.textMuted),
          ],
        ),
      ),
    );
  }
}

// =============================== PREMIUM STAT CARD ===============================

/// A premium KPI card with gradient header, icon, value, label, and optional trend.
class PremiumStatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final String? subtitle;
  final Color? color;
  final LinearGradient? gradient;
  final double? trend; // positive = up, negative = down
  final VoidCallback? onTap;

  const PremiumStatCard({
    super.key,
    required this.icon,
    required this.label,
    required this.value,
    this.subtitle,
    this.color,
    this.gradient,
    this.trend,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cardColor = color ?? AppTheme.primary;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppTheme.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Container(
                  width: 32, height: 32,
                  decoration: BoxDecoration(
                    color: cardColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, size: 16, color: cardColor),
                ),
                const Spacer(),
                if (trend != null) _TrendBadge(trend: trend!),
              ],
            ),
            const SizedBox(height: 10),
            FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: Text(value, style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w800, color: AppTheme.textPrimary, letterSpacing: -0.3), maxLines: 1, overflow: TextOverflow.ellipsis),
            ),
            const SizedBox(height: 2),
            Text(label, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w500, color: AppTheme.textSecondary), maxLines: 2, overflow: TextOverflow.ellipsis),
            if (subtitle != null) ...[
              const SizedBox(height: 2),
              Text(subtitle!, style: GoogleFonts.inter(fontSize: 10, color: AppTheme.textMuted), maxLines: 1, overflow: TextOverflow.ellipsis),
            ],
          ],
        ),
      ),
    );
  }
}

class _TrendBadge extends StatelessWidget {
  final double trend;
  const _TrendBadge({required this.trend});

  @override
  Widget build(BuildContext context) {
    final isUp = trend >= 0;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: (isUp ? AppTheme.success : AppTheme.danger).withOpacity(0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(isUp ? Icons.trending_up : Icons.trending_down, size: 10, color: isUp ? AppTheme.success : AppTheme.danger),
          const SizedBox(width: 2),
          Text('${isUp ? '+' : ''}${trend.toStringAsFixed(1)}%', style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: isUp ? AppTheme.success : AppTheme.danger)),
        ],
      ),
    );
  }
}

// =============================== GRADIENT HERO CARD ===============================

/// A bold gradient hero card used at the top of dashboards (welcome banner + key metric).
class GradientHeroCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final String? metric;
  final String? metricLabel;
  final IconData icon;
  final List<Color> gradientColors;
  final List<Widget>? actions;

  const GradientHeroCard({
    super.key,
    required this.title,
    required this.subtitle,
    this.metric,
    this.metricLabel,
    required this.icon,
    this.gradientColors = const [AppTheme.primary, AppTheme.primaryLight],
    this.actions,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.primary,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40, height: 40,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: Colors.white, size: 20),
              ),
              const Spacer(),
              if (metric != null)
                Text(metric!, style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: -0.3)),
            ],
          ),
          const SizedBox(height: 12),
          Text(title, style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700, color: Colors.white)),
          const SizedBox(height: 2),
          Text(subtitle, style: GoogleFonts.inter(fontSize: 12, color: Colors.white.withOpacity(0.7))),
          if (metricLabel != null) ...[
            const SizedBox(height: 4),
            Text(metricLabel!, style: GoogleFonts.inter(fontSize: 10, color: Colors.white.withOpacity(0.5))),
          ],
          if (actions != null && actions!.isNotEmpty) ...[
            const SizedBox(height: 12),
            Wrap(spacing: 8, runSpacing: 8, children: actions!),
          ],
        ],
      ),
    );
  }
}

// =============================== SECTION HEADER ===============================

class SectionHeader extends StatelessWidget {
  final String title;
  final String? actionText;
  final VoidCallback? onAction;
  final IconData? icon;

  const SectionHeader({super.key, required this.title, this.actionText, this.onAction, this.icon});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        if (icon != null) ...[
          Icon(icon, size: 16, color: AppTheme.textSecondary),
          const SizedBox(width: 6),
        ],
        Text(title, style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
        const Spacer(),
        if (actionText != null && onAction != null)
          GestureDetector(
            onTap: onAction,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.06),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(actionText!, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.primary)),
            ),
          ),
      ],
    );
  }
}

// =============================== STATUS BADGE ===============================

class StatusBadge extends StatelessWidget {
  final String text;
  final String? status;
  final double size;
  const StatusBadge({super.key, required this.text, this.status, this.size = 1.0});

  Color get _bg {
    final s = (status ?? text).toLowerCase();
    if (s.contains('paid') && !s.contains('un')) return AppTheme.successLight;
    if (s.contains('unpaid') || s.contains('pending') || s.contains('overdue')) return AppTheme.dangerLight;
    if (s.contains('active') && !s.contains('in')) return AppTheme.successLight;
    if (s.contains('inactive') || s.contains('blocked')) return AppTheme.dangerLight;
    if (s.contains('late') || s.contains('absent')) return AppTheme.warningLight;
    return AppTheme.primary.withOpacity(0.10);
  }

  Color get _fg {
    final s = (status ?? text).toLowerCase();
    if (s.contains('paid') && !s.contains('un')) return AppTheme.success;
    if (s.contains('unpaid') || s.contains('pending') || s.contains('overdue')) return AppTheme.danger;
    if (s.contains('active') && !s.contains('in')) return AppTheme.success;
    if (s.contains('inactive') || s.contains('blocked')) return AppTheme.danger;
    if (s.contains('late') || s.contains('absent')) return AppTheme.warning;
    return AppTheme.primary;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8 * size, vertical: 3 * size),
      decoration: BoxDecoration(color: _bg, borderRadius: BorderRadius.circular(6)),
      child: Text(text, style: GoogleFonts.inter(fontSize: 10 * size, fontWeight: FontWeight.w700, color: _fg)),
    );
  }
}

// =============================== AVATAR ===============================

class AvatarCircle extends StatelessWidget {
  final String name;
  final double size;
  final Color? backgroundColor;
  const AvatarCircle({super.key, required this.name, this.size = 40, this.backgroundColor});

  @override
  Widget build(BuildContext context) {
    final initials = name.trim().split(RegExp(r'\s+')).take(2).map((w) => w.isEmpty ? '' : w[0].toUpperCase()).join();
    final bg = backgroundColor ?? AppTheme.primary.withOpacity(0.1);
    return Container(
      width: size, height: size,
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(size / 2)),
      child: Center(
        child: Text(
          initials.isEmpty ? '?' : initials,
          style: GoogleFonts.inter(fontSize: size * 0.38, fontWeight: FontWeight.w800, color: AppTheme.primary),
        ),
      ),
    );
  }
}

// =============================== LIST ROW CARD ===============================

class ListRowCard extends StatelessWidget {
  final String title;
  final String? subtitle;
  final String? trailing;
  final Widget? trailingWidget;
  final IconData? icon;
  final String? badgeText;
  final String? badgeStatus;
  final VoidCallback? onTap;
  final Color? iconColor;

  const ListRowCard({
    super.key,
    required this.title,
    this.subtitle,
    this.trailing,
    this.trailingWidget,
    this.icon,
    this.badgeText,
    this.badgeStatus,
    this.onTap,
    this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    final showAvatar = icon == null;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.border),
        boxShadow: AppTheme.shadowSm,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            child: Row(
              children: [
                if (showAvatar) ...[
                  AvatarCircle(name: title),
                  const SizedBox(width: 12),
                ] else ...[
                  Container(
                    width: 40, height: 40,
                    decoration: BoxDecoration(
                      color: (iconColor ?? AppTheme.primary).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(icon, size: 18, color: iconColor ?? AppTheme.primary),
                  ),
                  const SizedBox(width: 12),
                ],
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
                      if (subtitle != null) ...[
                        const SizedBox(height: 2),
                        Text(subtitle!, style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textSecondary)),
                      ],
                    ],
                  ),
                ),
                if (badgeText != null) ...[
                  StatusBadge(text: badgeText!, status: badgeStatus),
                  const SizedBox(width: 8),
                ],
                if (trailingWidget != null)
                  trailingWidget!
                else if (trailing != null)
                  Text(trailing!, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
                if (onTap != null) ...[
                  const SizedBox(width: 6),
                  const Icon(Icons.chevron_right, size: 18, color: AppTheme.textMuted),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// =============================== QUICK ACTION GRID ===============================

class QuickActionTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  const QuickActionTile({super.key, required this.icon, required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppTheme.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppTheme.border),
          boxShadow: AppTheme.shadowSm,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 40, height: 40,
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, size: 20, color: color),
            ),
            const SizedBox(height: 8),
            Text(label, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textPrimary), textAlign: TextAlign.center, maxLines: 2, overflow: TextOverflow.ellipsis),
          ],
        ),
      ),
    );
  }
}

// =============================== EMPTY STATE ===============================

class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final String? actionText;
  final VoidCallback? onAction;

  const EmptyState({super.key, required this.icon, required this.title, required this.description, this.actionText, this.onAction});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 72, height: 72,
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.06),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Icon(icon, size: 32, color: AppTheme.textMuted),
            ),
            const SizedBox(height: 20),
            Text(title, style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
            const SizedBox(height: 6),
            Text(description, textAlign: TextAlign.center, style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textMuted, height: 1.4)),
            if (actionText != null && onAction != null) ...[
              const SizedBox(height: 20),
              ElevatedButton.icon(onPressed: onAction, icon: const Icon(Icons.refresh, size: 16), label: Text(actionText!)),
            ],
          ],
        ),
      ),
    );
  }
}

// =============================== SKELETON LOADERS ===============================

class SkeletonBox extends StatelessWidget {
  final double width;
  final double height;
  final double radius;
  const SkeletonBox({super.key, required this.width, required this.height, this.radius = 8});

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppTheme.border,
      highlightColor: AppTheme.accent,
      child: Container(
        width: width, height: height,
        decoration: BoxDecoration(color: AppTheme.border, borderRadius: BorderRadius.circular(radius)),
      ),
    );
  }
}

class DashboardSkeleton extends StatelessWidget {
  const DashboardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppTheme.border,
      highlightColor: AppTheme.accent,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(height: 140, decoration: BoxDecoration(color: AppTheme.border, borderRadius: BorderRadius.circular(20))),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: Container(height: 100, decoration: BoxDecoration(color: AppTheme.border, borderRadius: BorderRadius.circular(16)))),
              const SizedBox(width: 8),
              Expanded(child: Container(height: 100, decoration: BoxDecoration(color: AppTheme.border, borderRadius: BorderRadius.circular(16)))),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(child: Container(height: 100, decoration: BoxDecoration(color: AppTheme.border, borderRadius: BorderRadius.circular(16)))),
              const SizedBox(width: 8),
              Expanded(child: Container(height: 100, decoration: BoxDecoration(color: AppTheme.border, borderRadius: BorderRadius.circular(16)))),
            ],
          ),
          const SizedBox(height: 16),
          Container(height: 180, decoration: BoxDecoration(color: AppTheme.border, borderRadius: BorderRadius.circular(16))),
        ],
      ),
    );
  }
}

// =============================== CHART CARD WRAPPER ===============================

/// Wraps a fl_chart widget in a premium card with a title.
class ChartCard extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget chart;
  final double height;
  final List<Widget>? headerActions;

  const ChartCard({
    super.key,
    required this.title,
    required this.chart,
    this.subtitle,
    this.height = 200,
    this.headerActions,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
        boxShadow: AppTheme.shadowSm,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
                    if (subtitle != null)
                      Text(subtitle!, style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted)),
                  ],
                ),
              ),
              if (headerActions != null) ...headerActions!,
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(height: height, child: chart),
        ],
      ),
    );
  }
}

// =============================== ACTIVITY FEED ITEM ===============================

class ActivityItem extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;
  final String? time;
  const ActivityItem({super.key, required this.icon, required this.color, required this.title, required this.subtitle, this.time});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 32, height: 32,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 16, color: color),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
                const SizedBox(height: 1),
                Text(subtitle, style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textSecondary)),
              ],
            ),
          ),
          if (time != null)
            Text(time!, style: GoogleFonts.inter(fontSize: 10, color: AppTheme.textMuted)),
        ],
      ),
    );
  }
}
