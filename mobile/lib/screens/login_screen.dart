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
    _RoleOption(id: 'institute-admin', label: 'Institute', icon: Icons.business_outlined),
    _RoleOption(id: 'branch-manager', label: 'Branch', icon: Icons.store_outlined),
    _RoleOption(id: 'teacher', label: 'Teacher', icon: Icons.menu_book_outlined),
    _RoleOption(id: 'student', label: 'Student', icon: Icons.person_outline),
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
          MaterialPageRoute(builder: (_) => DashboardScreen(user: user)),
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
        elevation: 0,
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
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 16),

              // Logo — simple, solid, no gradient
              Container(
                width: 56, height: 56,
                decoration: BoxDecoration(
                  color: AppTheme.primary,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(Icons.school, color: Colors.white, size: 28),
              ),
              const SizedBox(height: 24),

              // Headline — clean, direct
              Text('Sign in', style: GoogleFonts.inter(fontSize: 26, fontWeight: FontWeight.w700, color: AppTheme.textPrimary, letterSpacing: -0.3)),
              const SizedBox(height: 6),
              Text('Enter your credentials to access your portal.', style: GoogleFonts.inter(fontSize: 14, color: AppTheme.textSecondary)),
              const SizedBox(height: 28),

              // Server status — minimal
              if (ApiClient.baseUrl.isNotEmpty) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppTheme.success.withOpacity(0.06),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.cloud_done_outlined, size: 14, color: AppTheme.success),
                      const SizedBox(width: 6),
                      Expanded(child: Text(ApiClient.baseUrl, style: GoogleFonts.inter(fontSize: 11, color: AppTheme.success, fontWeight: FontWeight.w500), overflow: TextOverflow.ellipsis)),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
              ],

              // Role selector — simple row of 4, clean
              Text('I am a', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textSecondary)),
              const SizedBox(height: 10),
              Row(
                children: _roles.map((r) => Expanded(
                  child: Padding(
                    padding: EdgeInsets.only(right: r != _roles[3] ? 6 : 0),
                    child: _RoleChip(
                      role: r,
                      isSelected: _selectedRole == r.id,
                      onTap: () => setState(() {
                        _selectedRole = r.id;
                        _emailController.clear(); _passwordController.clear(); _nameController.clear();
                      }),
                    ),
                  ),
                )).toList(),
              ),
              const SizedBox(height: 20),

              // Name field (teacher/student only)
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
              const SizedBox(height: 24),

              // Login button — solid, no gradient
              SizedBox(
                height: 50,
                child: ElevatedButton(
                  onPressed: _canSubmit && !_isLoading ? _login : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    elevation: 0,
                  ),
                  child: _isLoading
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : Text(
                          _selectedRole == null ? 'Select a role' : 'Sign in',
                          style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600),
                        ),
                ),
              ),
              const SizedBox(height: 24),

              // Footer — subtle
              Center(
                child: Text(
                  'ESM · Electronic School Management',
                  style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted),
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}

// =============================== ROLE CHIP ===============================

class _RoleOption {
  final String id;
  final String label;
  final IconData icon;
  _RoleOption({required this.id, required this.label, required this.icon});
}

class _RoleChip extends StatelessWidget {
  final _RoleOption role;
  final bool isSelected;
  final VoidCallback onTap;
  const _RoleChip({required this.role, required this.isSelected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primary : AppTheme.surface,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: isSelected ? AppTheme.primary : AppTheme.border, width: 1),
        ),
        child: Column(
          children: [
            Icon(role.icon, size: 18, color: isSelected ? Colors.white : AppTheme.textSecondary),
            const SizedBox(height: 4),
            Text(role.label, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: isSelected ? Colors.white : AppTheme.textSecondary)),
          ],
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
      final result = await ApiClient.getObject('health', );
      final ok = result['ok'] == true;
      setState(() {
        _testOk = ok;
        _testResult = ok ? 'Connected successfully' : 'Health check failed';
      });
    } catch (e) {
      setState(() { _testOk = false; _testResult = 'Connection failed'; });
    } finally {
      if (mounted) setState(() => _testing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: Text(widget.isFirstRun ? 'Set Server Address' : 'Server Settings', style: GoogleFonts.inter(fontSize: 17, fontWeight: FontWeight.w700)),
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
                color: (_testOk ? AppTheme.success : AppTheme.danger).withOpacity(0.06),
                borderRadius: BorderRadius.circular(8),
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
