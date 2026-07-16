import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_client.dart';
import '../theme/app_theme.dart';
import 'login_screen.dart';

/// A premium Profile / Account screen for ESM.
///
/// Designed to feel like a luxury banking app profile page — a deep navy hero
/// with gold accents, a gold-ringed avatar, clean white cards with soft
/// shadows, generous spacing, and the Inter typeface throughout.
///
/// The widget receives the authenticated user as a `Map<String, dynamic>`
/// (same shape consumed by [SettingsScreen] and the role portals) and adapts
/// the stats + personal info rows to the user's role.
class ProfileScreen extends StatefulWidget {
  final Map<String, dynamic> user;
  const ProfileScreen({super.key, required this.user});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _isChangingPassword = false;
  bool _isLoggingOut = false;

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  String _initials(String name) {
    final s = name.trim();
    if (s.isEmpty) return '?';
    return s
        .split(RegExp(r'\s+'))
        .take(2)
        .map((w) => w.isEmpty ? '' : w[0].toUpperCase())
        .join();
  }

  String _roleLabel(String role) {
    switch (role) {
      case 'super-admin':
        return 'Super Admin';
      case 'institute-admin':
        return 'Institute Admin';
      case 'branch-manager':
        return 'Branch Manager';
      case 'teacher':
        return 'Teacher';
      case 'student':
        return 'Student';
      default:
        return role.isEmpty ? 'Member' : role[0].toUpperCase() + role.substring(1);
    }
  }

  /// Reads a string field from [u], returning [fallback] when null/empty.
  String _string(Map<String, dynamic> u, String key, {String fallback = '—'}) {
    final v = u[key];
    if (v == null) return fallback;
    final s = v.toString().trim();
    return s.isEmpty ? fallback : s;
  }

  /// Joins a List or returns a String as-is.
  String _formatSubjects(dynamic subjects) {
    if (subjects == null) return '—';
    if (subjects is List) {
      final list = subjects.map((s) => s.toString()).where((s) => s.isNotEmpty).toList();
      return list.isEmpty ? '—' : list.join(', ');
    }
    final s = subjects.toString().trim();
    return s.isEmpty ? '—' : s;
  }

  /// Role-specific stat label (Classes / Courses / Branches …).
  String _roleStatLabel(String role) {
    switch (role) {
      case 'teacher':
        return 'Classes';
      case 'student':
        return 'Courses';
      case 'institute-admin':
        return 'Branches';
      case 'branch-manager':
        return 'Students';
      case 'super-admin':
        return 'Institutes';
      default:
        return 'Modules';
    }
  }

  /// Role-specific stat value — pulls from a few common key variants, else '—'.
  String _roleStatValue(Map<String, dynamic> u, String role) {
    const keysByRole = <String, List<String>>{
      'teacher': ['classesCount', 'totalClasses', 'classes'],
      'student': ['coursesCount', 'totalCourses', 'courses'],
      'institute-admin': ['branchesCount', 'totalBranches', 'branches'],
      'branch-manager': ['studentsCount', 'totalStudents', 'students'],
      'super-admin': ['institutesCount', 'totalInstitutes', 'institutes'],
    };
    for (final k in keysByRole[role] ?? const <String>[]) {
      final v = u[k];
      if (v != null && v.toString().isNotEmpty) return v.toString();
    }
    return '—';
  }

  IconData _roleStatIcon(String role) {
    switch (role) {
      case 'teacher':
        return Icons.class_outlined;
      case 'student':
        return Icons.menu_book_outlined;
      case 'institute-admin':
        return Icons.account_tree_outlined;
      case 'branch-manager':
        return Icons.groups_outlined;
      case 'super-admin':
        return Icons.domain_outlined;
      default:
        return Icons.star_outline_rounded;
    }
  }

  /// Trims an ISO date or full string down to its 4-digit year, if it looks
  /// like a date; otherwise returns the value as-is.
  String _yearOf(String raw) {
    if (raw.length >= 4) {
      final prefix = raw.substring(0, 4);
      if (int.tryParse(prefix) != null) return prefix;
    }
    return raw;
  }

  void _snack(String message, {Color? bg}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: bg ?? AppTheme.primary,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  Future<void> _changePassword() async {
    final result = await showDialog<Map<String, String>>(
      context: context,
      builder: (ctx) => const _ChangePasswordDialog(),
    );
    if (result == null) return;
    setState(() => _isChangingPassword = true);
    try {
      await ApiClient.post('auth/change-password', body: {
        'currentPassword': result['current']!,
        'newPassword': result['new']!,
      });
      _snack('Password changed successfully', bg: AppTheme.success);
    } catch (e) {
      _snack(e.toString(), bg: AppTheme.danger);
    } finally {
      if (mounted) setState(() => _isChangingPassword = false);
    }
  }

  Future<void> _logout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: AppTheme.dangerLight,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.logout_rounded, size: 18, color: AppTheme.danger),
            ),
            const SizedBox(width: 12),
            const Text('Log out?'),
          ],
        ),
        content: const Text('You will need to sign in again to access ESM.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.danger),
            child: const Text('Log out'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    setState(() => _isLoggingOut = true);
    await ApiClient.logout();
    if (mounted) {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (_) => false,
      );
    }
  }

  void _showEditProfile() {
    _snack('Edit profile — coming soon', bg: AppTheme.goldDark);
  }

  // ---------------------------------------------------------------------------
  // Build
  // ---------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    final u = widget.user;
    final role = (u['role'] ?? '').toString();
    final roleLabel = _roleLabel(role);
    final fullName = (u['name'] ?? 'User').toString();
    final mediaPad = MediaQuery.of(context).padding;
    final bottomPad = mediaPad.bottom;
    // Hero content (avatar + name + badge + edit button + paddings) needs
    // ~230px below the status bar; allow 320 so a 2-line name never overflows.
    final heroHeight = mediaPad.top + 320.0;

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: CustomScrollView(
        slivers: [
          // === Hero header (collapses on scroll, back button stays pinned) ===
          SliverAppBar(
            pinned: true,
            expandedHeight: heroHeight,
            backgroundColor: AppTheme.primary,
            surfaceTintColor: Colors.transparent,
            elevation: 0,
            scrolledUnderElevation: 0,
            foregroundColor: Colors.white,
            automaticallyImplyLeading: false,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
              onPressed: () => Navigator.of(context).maybePop(),
              tooltip: 'Back',
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.edit_outlined, color: Colors.white, size: 20),
                onPressed: _showEditProfile,
                tooltip: 'Edit Profile',
              ),
              const SizedBox(width: 4),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: _HeroHeader(
                initials: _initials(fullName),
                name: fullName,
                roleLabel: roleLabel,
                onEdit: _showEditProfile,
              ),
            ),
          ),
          // === Body content ===
          SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.fromLTRB(16, 16, 16, 24 + bottomPad),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildStatsRow(u, role),
                  const SizedBox(height: 24),
                  _buildSectionLabel('PERSONAL INFORMATION'),
                  const SizedBox(height: 10),
                  _buildPersonalInfoCard(u, role),
                  const SizedBox(height: 24),
                  _buildSectionLabel('ACCOUNT ACTIONS'),
                  const SizedBox(height: 10),
                  _buildAccountActionsCard(),
                  const SizedBox(height: 24),
                  _buildSectionLabel('APP INFO'),
                  const SizedBox(height: 10),
                  _buildAppInfoCard(),
                  const SizedBox(height: 24),
                  _buildLogoutButton(),
                  const SizedBox(height: 20),
                  Center(
                    child: Text(
                      'ESM Mobile · Made with care',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        color: AppTheme.textMuted,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Sections
  // ---------------------------------------------------------------------------

  Widget _buildSectionLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(left: 4),
      child: Text(
        text,
        style: GoogleFonts.inter(
          fontSize: 11,
          fontWeight: FontWeight.w800,
          color: AppTheme.textMuted,
          letterSpacing: 1.4,
        ),
      ),
    );
  }

  Widget _buildStatsRow(Map<String, dynamic> u, String role) {
    final memberSince = _yearOf(_string(u, 'createdAt', fallback: '2025'));
    return Row(
      children: [
        Expanded(
          child: _StatCard(
            icon: _roleStatIcon(role),
            iconColor: AppTheme.primary,
            value: _roleStatValue(u, role),
            label: _roleStatLabel(role),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _StatCard(
            icon: Icons.calendar_today_outlined,
            iconColor: AppTheme.gold,
            value: memberSince,
            label: 'Member since',
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _StatCard(
            iconWidget: Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: AppTheme.successLight,
                borderRadius: BorderRadius.circular(8),
              ),
              alignment: Alignment.center,
              child: Container(
                width: 9,
                height: 9,
                decoration: BoxDecoration(
                  color: AppTheme.success,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.success.withOpacity(0.6),
                      blurRadius: 6,
                      spreadRadius: 1,
                    ),
                  ],
                ),
              ),
            ),
            value: 'Active',
            label: 'Status',
          ),
        ),
      ],
    );
  }

  Widget _buildPersonalInfoCard(Map<String, dynamic> u, String role) {
    final isStudent = role == 'student';
    final isTeacher = role == 'teacher';
    final useRollNo = isStudent || isTeacher;
    final idLabel = useRollNo ? 'Roll No' : 'Email';
    final idValue = useRollNo ? 'Roll #${_string(u, 'rollNo')}' : _string(u, 'email');

    final rows = <Widget>[
      _InfoRow(
        icon: Icons.email_outlined,
        label: 'Email',
        value: _string(u, 'email'),
        iconColor: AppTheme.info,
      ),
      const _RowDivider(),
      _InfoRow(
        icon: Icons.badge_outlined,
        label: idLabel,
        value: idValue,
        iconColor: AppTheme.gold,
      ),
      const _RowDivider(),
      _InfoRow(
        icon: Icons.business_outlined,
        label: 'Institute',
        value: _string(u, 'instituteName', fallback: 'ESM Institute'),
        iconColor: AppTheme.primary,
      ),
      if (u['branchName'] != null && u['branchName'].toString().isNotEmpty) ...[
        const _RowDivider(),
        _InfoRow(
          icon: Icons.location_city_outlined,
          label: 'Branch',
          value: _string(u, 'branchName'),
          iconColor: AppTheme.primaryLight,
        ),
      ],
      if (isStudent) ...[
        if (u['class'] != null || u['className'] != null) ...[
          const _RowDivider(),
          _InfoRow(
            icon: Icons.school_outlined,
            label: 'Class & Section',
            value:
                '${_string(u, 'class', fallback: u['className']?.toString() ?? '—')}'
                '${u['section'] != null && u['section'].toString().isNotEmpty ? ' · ${u['section']}' : ''}',
            iconColor: AppTheme.success,
          ),
        ],
      ],
      if (isTeacher && u['subjects'] != null) ...[
        const _RowDivider(),
        _InfoRow(
          icon: Icons.menu_book_outlined,
          label: 'Subjects',
          value: _formatSubjects(u['subjects']),
          iconColor: AppTheme.warning,
        ),
      ],
    ];

    return _PremiumCard(child: Column(children: rows));
  }

  Widget _buildAccountActionsCard() {
    return _PremiumCard(
      child: Column(
        children: [
          _ActionTile(
            icon: Icons.lock_outline,
            color: AppTheme.primary,
            title: 'Change Password',
            subtitle: 'Update your login credentials',
            trailing: _isChangingPassword
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(
                    Icons.chevron_right_rounded,
                    size: 18,
                    color: AppTheme.textMuted,
                  ),
            onTap: _isChangingPassword ? null : _changePassword,
          ),
          const _RowDivider(),
          _ActionTile(
            icon: Icons.notifications_active_outlined,
            color: AppTheme.gold,
            title: 'Notification Preferences',
            subtitle: 'Manage push & email alerts',
            onTap: () => _snack('Coming soon', bg: AppTheme.goldDark),
          ),
          const _RowDivider(),
          _ActionTile(
            icon: Icons.shield_outlined,
            color: AppTheme.success,
            title: 'Privacy & Security',
            subtitle: 'Bank-grade encryption',
            onTap: () => _snack('Your data is encrypted', bg: AppTheme.success),
          ),
          const _RowDivider(),
          _ActionTile(
            icon: Icons.help_outline_rounded,
            color: AppTheme.info,
            title: 'Help & Support',
            subtitle: 'We are here for you 24/7',
            onTap: () => _snack('Contact support@esm.com', bg: AppTheme.info),
          ),
        ],
      ),
    );
  }

  Widget _buildAppInfoCard() {
    return _PremiumCard(
      child: Column(
        children: [
          _InfoRow(
            icon: Icons.info_outline,
            label: 'Version',
            value: '1.0.0',
            iconColor: AppTheme.info,
          ),
          const _RowDivider(),
          _InfoRow(
            icon: Icons.build_outlined,
            label: 'Build',
            value: '100',
            iconColor: AppTheme.primaryLight,
          ),
          const _RowDivider(),
          _InfoRow(
            icon: Icons.business_outlined,
            label: 'Powered by',
            value: 'Cyber Advance Solutions',
            iconColor: AppTheme.primary,
          ),
        ],
      ),
    );
  }

  Widget _buildLogoutButton() {
    return SizedBox(
      width: double.infinity,
      child: Container(
        decoration: BoxDecoration(
          gradient: AppTheme.dangerGradient,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: AppTheme.danger.withOpacity(0.25),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: _isLoggingOut ? null : _logout,
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (_isLoggingOut)
                    const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  else
                    const Icon(Icons.logout_rounded, size: 18, color: Colors.white),
                  const SizedBox(width: 10),
                  Text(
                    _isLoggingOut ? 'Logging out…' : 'Log out',
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                      letterSpacing: 0.2,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// =============================================================================
// Hero header
// =============================================================================

class _HeroHeader extends StatelessWidget {
  final String initials;
  final String name;
  final String roleLabel;
  final VoidCallback onEdit;

  const _HeroHeader({
    required this.initials,
    required this.name,
    required this.roleLabel,
    required this.onEdit,
  });

  @override
  Widget build(BuildContext context) {
    final topPad = MediaQuery.of(context).padding.top;
    return Container(
      decoration: const BoxDecoration(gradient: AppTheme.navyGradient),
      child: Stack(
        children: [
          // Decorative gold circles — like GradientHeroCard, in gold this time.
          Positioned(
            right: -40,
            top: topPad + 8,
            child: Container(
              width: 150,
              height: 150,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: AppTheme.gold.withOpacity(0.18), width: 1.5),
              ),
            ),
          ),
          Positioned(
            right: -10,
            top: topPad + 56,
            child: Container(
              width: 86,
              height: 86,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppTheme.gold.withOpacity(0.10),
              ),
            ),
          ),
          Positioned(
            left: -34,
            bottom: 12,
            child: Container(
              width: 96,
              height: 96,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withOpacity(0.05),
              ),
            ),
          ),
          // Subtle gold dot in the upper-left for sparkle.
          Positioned(
            left: 28,
            top: topPad + 24,
            child: Container(
              width: 6,
              height: 6,
              decoration: BoxDecoration(
                color: AppTheme.gold.withOpacity(0.6),
                shape: BoxShape.circle,
              ),
            ),
          ),
          // Content
          Padding(
            padding: EdgeInsets.fromLTRB(20, topPad + 64, 20, 26),
            child: Column(
              children: [
                // Avatar with gold gradient ring
                Container(
                  width: 88,
                  height: 88,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: AppTheme.goldGradient,
                    boxShadow: AppTheme.shadowGold,
                  ),
                  padding: const EdgeInsets.all(3),
                  child: Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppTheme.primaryDark,
                      border: Border.all(color: Colors.white.withOpacity(0.22), width: 1),
                    ),
                    child: Center(
                      child: Text(
                        initials,
                        style: GoogleFonts.inter(
                          fontSize: 28,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                // Full name (white, bold, 20px)
                Text(
                  name,
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.inter(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                    letterSpacing: -0.3,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 8),
                // Role label (white70, 13px) with a gold "verified" badge
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 18,
                      height: 18,
                      decoration: BoxDecoration(
                        gradient: AppTheme.goldGradient,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: AppTheme.gold.withOpacity(0.4),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: const Icon(Icons.check_rounded, size: 11, color: AppTheme.primaryDark),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      roleLabel,
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: Colors.white.withOpacity(0.7),
                        letterSpacing: 0.2,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                // Edit Profile — white outline pill button
                OutlinedButton.icon(
                  onPressed: onEdit,
                  icon: const Icon(Icons.edit_outlined, size: 14, color: Colors.white),
                  label: Text(
                    'Edit Profile',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                      letterSpacing: 0.3,
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: BorderSide(color: Colors.white.withOpacity(0.4), width: 1),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                    minimumSize: const Size(0, 34),
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
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

// =============================================================================
// Stat card
// =============================================================================

class _StatCard extends StatelessWidget {
  final IconData? icon;
  final Color? iconColor;
  final Widget? iconWidget;
  final String value;
  final String label;

  const _StatCard({
    this.icon,
    this.iconColor,
    this.iconWidget,
    required this.value,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    final showIcon = iconWidget != null;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 14),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
        boxShadow: AppTheme.shadowSm,
      ),
      child: Column(
        children: [
          if (showIcon)
            iconWidget!
          else
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: (iconColor ?? AppTheme.primary).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, size: 14, color: iconColor ?? AppTheme.primary),
            ),
          const SizedBox(height: 8),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.inter(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: AppTheme.textPrimary,
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: AppTheme.textMuted,
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }
}

// =============================================================================
// Premium card + row primitives
// =============================================================================

class _PremiumCard extends StatelessWidget {
  final Widget child;
  const _PremiumCard({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.border),
        boxShadow: AppTheme.shadow,
      ),
      child: child,
    );
  }
}

class _RowDivider extends StatelessWidget {
  const _RowDivider();

  @override
  Widget build(BuildContext context) {
    return const Divider(
      height: 1,
      thickness: 1,
      color: AppTheme.border,
      indent: 58,
      endIndent: 14,
    );
  }
}

/// InfoRow pattern — icon (in a tinted square) + label on the left, value on
/// the right.
class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color iconColor;

  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
    required this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 16, color: iconColor),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: AppTheme.textSecondary,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Flexible(
            fit: FlexFit.loose,
            child: Text(
              value,
              textAlign: TextAlign.end,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// A tappable action tile used in the Account Actions card.
class _ActionTile extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;

  const _ActionTile({
    required this.icon,
    required this.color,
    required this.title,
    required this.subtitle,
    this.trailing,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, size: 18, color: color),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        color: AppTheme.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
              if (trailing != null) trailing!,
            ],
          ),
        ),
      ),
    );
  }
}

// =============================================================================
// Change password dialog
// =============================================================================

class _ChangePasswordDialog extends StatefulWidget {
  const _ChangePasswordDialog();

  @override
  State<_ChangePasswordDialog> createState() => _ChangePasswordDialogState();
}

class _ChangePasswordDialogState extends State<_ChangePasswordDialog> {
  final _current = TextEditingController();
  final _new = TextEditingController();
  final _confirm = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() {
    _current.dispose();
    _new.dispose();
    _confirm.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final canSubmit = _current.text.isNotEmpty &&
        _new.text.length >= 6 &&
        _new.text == _confirm.text;
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppTheme.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.lock_outline, size: 18, color: AppTheme.primary),
          ),
          const SizedBox(width: 12),
          const Text('Change Password'),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            controller: _current,
            obscureText: _obscure,
            decoration: InputDecoration(
              labelText: 'Current Password',
              prefixIcon: const Icon(Icons.lock_outline, size: 18),
              suffixIcon: IconButton(
                icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility, size: 18),
                onPressed: () => setState(() => _obscure = !_obscure),
              ),
            ),
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _new,
            obscureText: _obscure,
            decoration: const InputDecoration(
              labelText: 'New Password (min 6 chars)',
              prefixIcon: Icon(Icons.lock, size: 18),
            ),
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _confirm,
            obscureText: _obscure,
            decoration: InputDecoration(
              labelText: 'Confirm Password',
              prefixIcon: const Icon(Icons.lock, size: 18),
              errorText: _confirm.text.isNotEmpty && _new.text != _confirm.text
                  ? 'Passwords do not match'
                  : null,
            ),
            onChanged: (_) => setState(() {}),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: canSubmit
              ? () => Navigator.pop(context, {'current': _current.text, 'new': _new.text})
              : null,
          child: const Text('Update'),
        ),
      ],
    );
  }
}
