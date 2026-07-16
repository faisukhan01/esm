import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_client.dart';
import '../theme/app_theme.dart';
import '../widgets/shared_widgets.dart';
import 'login_screen.dart';

class SettingsScreen extends StatefulWidget {
  final Map<String, dynamic> user;
  const SettingsScreen({super.key, required this.user});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late final TextEditingController _serverCtrl;
  bool _isSavingServer = false;
  bool _isChangingPassword = false;

  @override
  void initState() {
    super.initState();
    _serverCtrl = TextEditingController(text: ApiClient.baseUrl);
  }

  @override
  void dispose() {
    _serverCtrl.dispose();
    super.dispose();
  }

  Future<void> _saveServer() async {
    setState(() => _isSavingServer = true);
    await ApiClient.setBaseUrl(_serverCtrl.text.trim());
    if (mounted) {
      setState(() => _isSavingServer = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Server URL updated'), backgroundColor: AppTheme.success, behavior: SnackBarBehavior.floating),
      );
    }
  }

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
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Password changed successfully'), backgroundColor: AppTheme.success, behavior: SnackBarBehavior.floating),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.danger, behavior: SnackBarBehavior.floating),
        );
      }
    } finally {
      if (mounted) setState(() => _isChangingPassword = false);
    }
  }

  Future<void> _logout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Log out?'),
        content: const Text('You will need to sign in again to access ESM.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.danger),
            child: const Text('Log out'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    await ApiClient.logout();
    if (mounted) {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (_) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final u = widget.user;
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Profile header card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: AppTheme.navyGradient,
              borderRadius: BorderRadius.circular(20),
              boxShadow: AppTheme.shadow,
            ),
            child: Column(
              children: [
                CircleAvatar(
                  radius: 40,
                  backgroundColor: Colors.white.withOpacity(0.15),
                  child: Text(
                    _initials(u['name']),
                    style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.w800, color: Colors.white),
                  ),
                ),
                const SizedBox(height: 12),
                Text(u['name'] ?? 'User', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w800, color: Colors.white)),
                const SizedBox(height: 2),
                Text(_roleLabel(u['role']), style: GoogleFonts.inter(fontSize: 13, color: Colors.white.withOpacity(0.8))),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Account section
          _SectionLabel('ACCOUNT'),
          const SizedBox(height: 8),
          _SettingsCard(
            children: [
              _SettingsTile(
                icon: Icons.lock_outline,
                color: AppTheme.primary,
                title: 'Change Password',
                subtitle: 'Update your login password',
                trailing: _isChangingPassword
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.chevron_right, size: 18, color: AppTheme.textMuted),
                onTap: _isChangingPassword ? null : _changePassword,
              ),
              _Divider(),
              _SettingsTile(
                icon: Icons.email_outlined,
                color: AppTheme.info,
                title: 'Email',
                subtitle: u['email']?.toString().isNotEmpty == true ? u['email'] : 'Not set',
                trailing: null,
              ),
              _Divider(),
              _SettingsTile(
                icon: Icons.badge_outlined,
                color: AppTheme.gold,
                title: 'Role',
                subtitle: _roleLabel(u['role']),
                trailing: null,
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Server section
          _SectionLabel('SERVER'),
          const SizedBox(height: 8),
          Container(
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
                    Icon(Icons.dns_outlined, size: 18, color: AppTheme.primary),
                    const SizedBox(width: 8),
                    Text('Backend Server URL', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700)),
                  ],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _serverCtrl,
                  decoration: InputDecoration(
                    hintText: 'https://your-app.vercel.app',
                    prefixIcon: const Icon(Icons.link, size: 18),
                    isDense: true,
                  ),
                  keyboardType: TextInputType.url,
                  autocorrect: false,
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _isSavingServer ? null : _saveServer,
                    icon: _isSavingServer
                        ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Icon(Icons.save, size: 16),
                    label: const Text('Save Server'),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // About section
          _SectionLabel('ABOUT'),
          const SizedBox(height: 8),
          _SettingsCard(
            children: [
              _SettingsTile(
                icon: Icons.info_outline,
                color: AppTheme.info,
                title: 'Version',
                subtitle: 'ESM Mobile v1.0.0',
                trailing: null,
              ),
              _Divider(),
              _SettingsTile(
                icon: Icons.business_outlined,
                color: AppTheme.primary,
                title: 'Powered by',
                subtitle: 'Cyber Advance Solutions',
                trailing: null,
              ),
              _Divider(),
              _SettingsTile(
                icon: Icons.shield_outlined,
                color: AppTheme.success,
                title: 'Privacy & Security',
                subtitle: 'Bank-grade encryption',
                trailing: const Icon(Icons.chevron_right, size: 18, color: AppTheme.textMuted),
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Your data is encrypted and secure.'), behavior: SnackBarBehavior.floating),
                  );
                },
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Logout
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _logout,
              icon: const Icon(Icons.logout, size: 18),
              label: const Text('Log out'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.danger,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  String _initials(dynamic name) {
    final s = (name ?? '?').toString().trim();
    if (s.isEmpty) return '?';
    return s.split(RegExp(r'\s+')).take(2).map((w) => w[0].toUpperCase()).join();
  }

  String _roleLabel(dynamic role) {
    switch (role.toString()) {
      case 'super-admin': return 'Super Admin';
      case 'institute-admin': return 'Institute Admin';
      case 'branch-manager': return 'Branch Manager';
      case 'teacher': return 'Teacher';
      case 'student': return 'Student';
      default: return role.toString();
    }
  }
}

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 4),
      child: Text(text, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w800, color: AppTheme.textMuted, letterSpacing: 1.2)),
    );
  }
}

class _SettingsCard extends StatelessWidget {
  final List<Widget> children;
  const _SettingsCard({required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
        boxShadow: AppTheme.shadowSm,
      ),
      child: Column(children: children),
    );
  }
}

class _Divider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return const Divider(height: 1, indent: 56);
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;
  const _SettingsTile({required this.icon, required this.color, required this.title, required this.subtitle, this.trailing, this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Container(
                width: 32, height: 32,
                decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                child: Icon(icon, size: 16, color: color),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
                    Text(subtitle, style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textSecondary)),
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
    _current.dispose(); _new.dispose(); _confirm.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final canSubmit = _current.text.isNotEmpty && _new.text.length >= 6 && _new.text == _confirm.text;
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: const Text('Change Password'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            controller: _current,
            obscureText: _obscure,
            decoration: InputDecoration(
              labelText: 'Current Password',
              prefixIcon: const Icon(Icons.lock_outline, size: 18),
              suffixIcon: IconButton(icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility, size: 18), onPressed: () => setState(() => _obscure = !_obscure)),
            ),
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 8),
          TextField(controller: _new, obscureText: _obscure, decoration: const InputDecoration(labelText: 'New Password (min 6 chars)', prefixIcon: Icon(Icons.lock, size: 18)), onChanged: (_) => setState(() {})),
          const SizedBox(height: 8),
          TextField(controller: _confirm, obscureText: _obscure, decoration: InputDecoration(
            labelText: 'Confirm Password',
            prefixIcon: const Icon(Icons.lock, size: 18),
            errorText: _confirm.text.isNotEmpty && _new.text != _confirm.text ? 'Passwords do not match' : null,
          ), onChanged: (_) => setState(() {})),
        ],
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        ElevatedButton(
          onPressed: canSubmit ? () => Navigator.pop(context, {'current': _current.text, 'new': _new.text}) : null,
          child: const Text('Update'),
        ),
      ],
    );
  }
}
