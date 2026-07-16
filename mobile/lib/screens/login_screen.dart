import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_client.dart';
import '../theme/app_theme.dart';
import 'dashboard_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  String? _selectedRole;
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();
  bool _obscurePassword = true;
  bool _isLoading = false;

  final List<_RoleOption> _roles = [
    _RoleOption(id: 'institute-admin', label: 'Institute', icon: Icons.business, color: AppTheme.primary),
    _RoleOption(id: 'branch-manager', label: 'Branch', icon: Icons.group, AppTheme.info),
    _RoleOption(id: 'teacher', label: 'Teacher', icon: Icons.menu_book, color: AppTheme.success),
    _RoleOption(id: 'student', label: 'Student', icon: Icons.person, color: AppTheme.gold),
  ];

  bool get _needsName => _selectedRole == 'teacher' || _selectedRole == 'student';
  bool get _canSubmit =>
      _selectedRole != null &&
      _emailController.text.isNotEmpty &&
      _passwordController.text.isNotEmpty;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (ApiClient.baseUrl.isEmpty) _showServerDialog(firstRun: true);
    });
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _showServerDialog({bool firstRun = false}) async {
    final controller = TextEditingController(text: ApiClient.baseUrl);
    final result = await showDialog<String>(
      context: context,
      barrierDismissible: !firstRun,
      builder: (ctx) => _ServerSettingsDialog(controller: controller, isFirstRun: firstRun),
    );
    if (result != null && result.trim().isNotEmpty) {
      await ApiClient.setBaseUrl(result.trim());
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Server: ${result.trim()}'), backgroundColor: AppTheme.success, behavior: SnackBarBehavior.floating),
        );
      }
    }
  }

  Future<void> _login() async {
    if (!_canSubmit) return;
    if (ApiClient.baseUrl.isEmpty) {
      _showServerDialog(firstRun: true);
      return;
    }
    setState(() => _isLoading = true);
    try {
      final result = await ApiClient.login(
        _emailController.text.trim(),
        _passwordController.text,
        _needsName ? _nameController.text.trim() : null,
      );
      final token = result['token'] as String;
      final user = result['user'] as Map<String, dynamic>;
      await ApiClient.saveToken(token);
      await ApiClient.saveUser(user);
      if (mounted) {
        Navigator.pushReplacement(
          context,
          PageRouteBuilder(
            pageBuilder: (_, __, ___) => DashboardScreen(user: user),
            transitionsBuilder: (_, a, __, child) => FadeTransition(opacity: a, child: child),
            transitionDuration: const Duration(milliseconds: 400),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.danger, behavior: SnackBarBehavior.floating),
        );
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
        backgroundColor: Colors.transparent,
        actions: [
          IconButton(
            icon: const Icon(Icons.dns_outlined, size: 20),
            tooltip: 'Server Settings',
            onPressed: () => _showServerDialog(),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 8),
              // Logo + brand
              Container(
                width: 72, height: 72,
                decoration: BoxDecoration(
                  gradient: AppTheme.navyGradient,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: AppTheme.shadow,
                ),
                child: const Icon(Icons.school, color: Colors.white, size: 36),
              ),
              const SizedBox(height: 20),
              Text('Welcome back', style: GoogleFonts.inter(fontSize: 28, fontWeight: FontWeight.w800, color: AppTheme.textPrimary, letterSpacing: -0.5)),
              const SizedBox(height: 6),
              Text('Sign in to your ESM account to continue', style: GoogleFonts.inter(fontSize: 14, color: AppTheme.textSecondary)),
              const SizedBox(height: 28),

              // Server status
              if (ApiClient.baseUrl.isNotEmpty) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppTheme.successLight,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppTheme.success.withOpacity(0.2)),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.cloud_done_outlined, size: 14, color: AppTheme.success),
                      const SizedBox(width: 6),
                      Expanded(child: Text(ApiClient.baseUrl, style: GoogleFonts.inter(fontSize: 11, color: AppTheme.success, fontWeight: FontWeight.w600), overflow: TextOverflow.ellipsis)),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
              ],

              // Role selector
              Text('Select your role', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.textSecondary, letterSpacing: 0.5)),
              const SizedBox(height: 12),
              Row(
                children: _roles.take(2).map((r) => Expanded(
                  child: Padding(
                    padding: EdgeInsets.only(right: r != _roles[1] ? 8 : 0),
                    child: _RoleCard(role: r, isSelected: _selectedRole == r.id, onTap: () => setState(() {
                      _selectedRole = r.id;
                      _emailController.clear(); _passwordController.clear(); _nameController.clear();
                    })),
                  ),
                )).toList(),
              ),
              const SizedBox(height: 8),
              Row(
                children: _roles.skip(2).map((r) => Expanded(
                  child: Padding(
                    padding: EdgeInsets.only(right: r != _roles[3] ? 8 : 0),
                    child: _RoleCard(role: r, isSelected: _selectedRole == r.id, onTap: () => setState(() {
                      _selectedRole = r.id;
                      _emailController.clear(); _passwordController.clear(); _nameController.clear();
                    })),
                  ),
                )).toList(),
              ),
              const SizedBox(height: 24),

              // Name field
              if (_needsName) ...[
                TextField(
                  controller: _nameController,
                  decoration: const InputDecoration(labelText: 'Full Name', prefixIcon: Icon(Icons.person_outline, size: 20)),
                  textCapitalization: TextCapitalization.words,
                ),
                const SizedBox(height: 12),
              ],

              // Email field
              TextField(
                controller: _emailController,
                decoration: InputDecoration(
                  labelText: _selectedRole == 'teacher' ? 'Teacher ID' : _selectedRole == 'student' ? 'Roll Number' : 'Email',
                  prefixIcon: const Icon(Icons.alternate_email, size: 20),
                ),
                keyboardType: _selectedRole == 'teacher' || _selectedRole == 'student' ? TextInputType.text : TextInputType.emailAddress,
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: 12),

              // Password field
              TextField(
                controller: _passwordController,
                decoration: InputDecoration(
                  labelText: 'Password',
                  prefixIcon: const Icon(Icons.lock_outline, size: 20),
                  suffixIcon: IconButton(
                    icon: Icon(_obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined, size: 20, color: AppTheme.textMuted),
                    onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                  ),
                ),
                obscureText: _obscurePassword,
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: 28),

              // Login button
              SizedBox(
                height: 54,
                child: ElevatedButton(
                  onPressed: _canSubmit && !_isLoading ? _login : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    elevation: 0,
                  ),
                  child: _isLoading
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : Text(_selectedRole == null ? 'Select a role to continue' : 'Sign in as ${_roles.firstWhere((r) => r.id == _selectedRole).label}',
                          style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700)),
                ),
              ),
              const SizedBox(height: 32),

              // Trust badges
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.shield_outlined, size: 14, color: AppTheme.textMuted),
                  const SizedBox(width: 4),
                  Text('Bank-grade encryption', style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted)),
                  const SizedBox(width: 12),
                  Icon(Icons.verified_outlined, size: 14, color: AppTheme.textMuted),
                  const SizedBox(width: 4),
                  Text('ISO 27001', style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted)),
                ],
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}

// =============================== SERVER DIALOG ===============================

class _ServerSettingsDialog extends StatefulWidget {
  final TextEditingController controller;
  final bool isFirstRun;
  const _ServerSettingsDialog({required this.controller, required this.isFirstRun});

  @override
  State<_ServerSettingsDialog> createState() => _ServerSettingsDialogState();
}

class _ServerSettingsDialogState extends State<_ServerSettingsDialog> {
  bool _testing = false;
  String? _testResult;
  bool _testOk = false;

  Future<void> _testConnection() async {
    final url = widget.controller.text.trim();
    if (url.isEmpty) return;
    setState(() { _testing = true; _testResult = null; });
    try {
      var cleaned = url;
      if (cleaned.endsWith('/')) cleaned = cleaned.substring(0, cleaned.length - 1);
      await ApiClient.setBaseUrl(cleaned);
      final result = await ApiClient.getObject('health');
      final ok = result['ok'] == true;
      setState(() {
        _testOk = ok;
        _testResult = ok ? 'Connected! Service: ${result['service'] ?? 'esm'}' : 'Health check failed';
      });
    } catch (e) {
      setState(() { _testOk = false; _testResult = e.toString(); });
    } finally {
      if (mounted) setState(() => _testing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Row(
        children: [
          Icon(widget.isFirstRun ? Icons.wifi : Icons.dns, color: AppTheme.primary, size: 22),
          const SizedBox(width: 8),
          Text(widget.isFirstRun ? 'Set Server Address' : 'Server Settings'),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            widget.isFirstRun ? 'Enter the ESM server URL to connect.' : 'Change the server URL.',
            style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textSecondary),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: widget.controller,
            decoration: const InputDecoration(hintText: 'https://your-app.vercel.app', prefixIcon: Icon(Icons.link, size: 20), labelText: 'Server URL'),
            keyboardType: TextInputType.url,
            autocorrect: false,
            onChanged: (_) => setState(() => _testResult = null),
          ),
          const SizedBox(height: 8),
          if (_testResult != null) ...[
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: (_testOk ? AppTheme.success : AppTheme.danger).withOpacity(0.08),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: (_testOk ? AppTheme.success : AppTheme.danger).withOpacity(0.2)),
              ),
              child: Row(
                children: [
                  Icon(_testOk ? Icons.check_circle : Icons.error_outline, size: 16, color: _testOk ? AppTheme.success : AppTheme.danger),
                  const SizedBox(width: 6),
                  Expanded(child: Text(_testResult!, style: GoogleFonts.inter(fontSize: 12, color: _testOk ? AppTheme.success : AppTheme.danger))),
                ],
              ),
            ),
            const SizedBox(height: 8),
          ],
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton.icon(
              onPressed: _testing ? null : _testConnection,
              icon: _testing ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.wifi_find, size: 16),
              label: Text(_testing ? 'Testing…' : 'Test connection'),
            ),
          ),
        ],
      ),
      actions: [
        if (!widget.isFirstRun) TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        ElevatedButton(
          onPressed: () {
            final url = widget.controller.text.trim();
            if (url.isNotEmpty) Navigator.pop(context, url);
          },
          child: const Text('Save'),
        ),
      ],
    );
  }
}

// =============================== ROLE CARD ===============================

class _RoleOption {
  final String id;
  final String label;
  final IconData icon;
  final Color color;
  _RoleOption({required this.id, required this.label, required this.icon, required this.color});
}

class _RoleCard extends StatelessWidget {
  final _RoleOption role;
  final bool isSelected;
  final VoidCallback onTap;
  const _RoleCard({required this.role, required this.isSelected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
        decoration: BoxDecoration(
          gradient: isSelected ? LinearGradient(colors: [role.color, role.color.withOpacity(0.8)], begin: Alignment.topLeft, end: Alignment.bottomRight) : null,
          color: isSelected ? null : AppTheme.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: isSelected ? role.color : AppTheme.border, width: isSelected ? 1.5 : 1),
          boxShadow: isSelected ? [BoxShadow(color: role.color.withOpacity(0.3), blurRadius: 12, offset: const Offset(0, 4))] : AppTheme.shadowSm,
        ),
        child: Column(
          children: [
            Icon(role.icon, size: 24, color: isSelected ? Colors.white : role.color),
            const SizedBox(height: 6),
            Text(role.label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: isSelected ? Colors.white : AppTheme.textSecondary)),
          ],
        ),
      ),
    );
  }
}
