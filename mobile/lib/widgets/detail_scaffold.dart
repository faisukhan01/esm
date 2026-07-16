import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

/// A reusable detail screen scaffold with a navy gradient header.
/// Used by all "tap a card to open" detail views across the app.
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
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 140,
            pinned: true,
            backgroundColor: headerColor ?? AppTheme.primary,
            foregroundColor: Colors.white,
            title: Text(title),
            actions: headerActions,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [headerColor ?? AppTheme.primary, AppTheme.primaryLight],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Container(
                          width: 40, height: 40,
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(headerIcon, color: Colors.white, size: 22),
                        ),
                        const SizedBox(height: 8),
                        Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Colors.white)),
                        if (subtitle != null) ...[
                          const SizedBox(height: 2),
                          Text(subtitle!, style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.85)), maxLines: 1, overflow: TextOverflow.ellipsis),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(child: body),
        ],
      ),
    );
  }
}

/// A reusable tab bar for detail screens that use tabs.
class DetailTabBar extends StatelessWidget {
  final TabController controller;
  final List<String> tabs;
  const DetailTabBar({super.key, required this.controller, required this.tabs});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppTheme.background,
      child: TabBar(
        controller: controller,
        isScrollable: true,
        tabAlignment: TabAlignment.start,
        labelColor: AppTheme.primary,
        unselectedLabelColor: AppTheme.textSecondary,
        indicatorColor: AppTheme.primary,
        indicatorSize: TabBarIndicatorSize.label,
        labelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
        unselectedLabelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
        tabs: tabs.map((t) => Tab(text: t)).toList(),
      ),
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
          Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
          const Spacer(),
          Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
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
