import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_theme.dart';

/// A reusable detail screen with a clean navy AppBar + body.
/// Used by all "tap a card to open" detail views.
class DetailScaffold extends StatelessWidget {
  final String title;
  final String? subtitle;
  final IconData headerIcon;
  final List<Widget>? headerActions;
  final Widget body;
  final Color? headerColor;

  const DetailScaffold({
    super.key,
    required this.title,
    required this.headerIcon,
    required this.body,
    this.subtitle,
    this.headerActions,
    this.headerColor,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text(title, style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700)),
        actions: headerActions,
        backgroundColor: AppTheme.surface,
        foregroundColor: AppTheme.textPrimary,
        elevation: 0,
        scrolledUnderElevation: 0.5,
      ),
      body: body,
    );
  }
}

/// A simple key-value info row used in detail screens.
class InfoRow extends StatelessWidget {
  final String label;
  final String value;
  final IconData? icon;
  const InfoRow({super.key, required this.label, required this.value, this.icon});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          if (icon != null) ...[
            Icon(icon, size: 16, color: AppTheme.textMuted),
            const SizedBox(width: 8),
          ],
          Text(label, style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted)),
          const Spacer(),
          Flexible(
            child: Text(value, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textPrimary), textAlign: TextAlign.right, maxLines: 1, overflow: TextOverflow.ellipsis),
          ),
        ],
      ),
    );
  }
}

/// A loading state for detail screens.
class DetailLoading extends StatelessWidget {
  const DetailLoading({super.key});
  @override
  Widget build(BuildContext context) {
    return const SizedBox(
      height: 200,
      child: Center(child: CircularProgressIndicator()),
    );
  }
}

/// A tab bar for detail screens.
class DetailTabBar extends StatelessWidget {
  final TabController controller;
  final List<String> tabs;
  const DetailTabBar({super.key, required this.controller, required this.tabs});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppTheme.surface,
      child: TabBar(
        controller: controller,
        isScrollable: true,
        tabAlignment: TabAlignment.start,
        labelColor: AppTheme.primary,
        unselectedLabelColor: AppTheme.textSecondary,
        indicatorColor: AppTheme.primary,
        indicatorSize: TabBarIndicatorSize.label,
        labelStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700),
        unselectedLabelStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500),
        tabs: tabs.map((t) => Tab(text: t)).toList(),
      ),
    );
  }
}
