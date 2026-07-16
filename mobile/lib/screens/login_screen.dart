import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:async';
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
    _RoleOption(id: 'institute-admin', label: 'Institute', icon: Icons.business),
    _RoleOption(id: 'branch-manager', label: 'Branch', icon: Icons.group),
    _RoleOption(id: 'teacher', label: 'Teacher', icon: Icons.menu_book),
    _RoleOption(id: 'student', label: 'Student', icon: Icons.person),
  ];

  bool get _needsName => _selectedRole == 'teacher' || _selectedRole == 'student';
  bool get _canSubmit =>
      _selectedRole != null &&
      _emailController.text.isNotEmpty &&
      _passwordController.text.isNotEmpty;

  @override
  void initState() {
    super.initState();
    // Show the server settings dialog automatically if no base URL is set.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (ApiClient.baseUrl.isEmpty) {
        _showServerDialog(firstRun: true);
      }
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
          SnackBar(
            content: Text('Server set to ${result.trim()}'),
            backgroundColor: AppTheme.success,
            behavior: SnackBarBehavior.floating,
            duration: const Duration(seconds: 2),
          ),
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
          SnackBar(
            content: Text(e.toString()),
            backgroundColor: AppTheme.danger,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Sign In'),
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
              // Logo
              Container(
                width: 64, height: 64,
                decoration: BoxDecoration(
                  color: AppTheme.primary,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Icon(Icons.school, color: Colors.white, size: 32),
              ),
              const SizedBox(height: 20),
              const Text('Welcome to ESM', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
              const SizedBox(height: 4),
              const Text('Electronic School Management', style: TextStyle(fontSize: 14, color: AppTheme.textSecondary)),
              const SizedBox(height: 28),

              // Server status indicator
              if (ApiClient.baseUrl.isNotEmpty) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppTheme.success.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppTheme.success.withOpacity(0.2)),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.cloud_done_outlined, size: 14, color: AppTheme.success),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          ApiClient.baseUrl,
                          style: TextStyle(fontSize: 11, color: AppTheme.success, fontWeight: FontWeight.w500),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
              ],

              // Role selector
              const Text('Select your role', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textSecondary)),
              const SizedBox(height: 12),
              // First row: 3 roles
              Row(
                children: _roles.take(3).map((r) => Expanded(
                  child: Padding(
                    padding: EdgeInsets.only(right: r != _roles[2] ? 8 : 0),
                    child: _RoleCard(
                      role: r,
                      isSelected: _selectedRole == r.id,
                      onTap: () => setState(() {
                        _selectedRole = r.id;
                        _emailController.clear();
                        _passwordController.clear();
                        _nameController.clear();
                      }),
                    ),
                  ),
                )).toList(),
              ),
              const SizedBox(height: 8),
              // Second row: 1 role full width
              _RoleCard(
                role: _roles[3],
                isSelected: _selectedRole == _roles[3].id,
                isFullWidth: true,
                onTap: () => setState(() {
                  _selectedRole = _roles[3].id;
                  _emailController.clear();
                  _passwordController.clear();
                  _nameController.clear();
                }),
              ),
              const SizedBox(height: 24),

              // Name field (teacher/student only)
              if (_needsName) ...[
                TextField(
                  controller: _nameController,
                  decoration: const InputDecoration(hintText: 'Full Name', prefixIcon: Icon(Icons.person_outline, size: 20)),
                  textCapitalization: TextCapitalization.words,
                ),
                const SizedBox(height: 12),
              ],

              // Email field
              TextField(
                controller: _emailController,
                decoration: InputDecoration(
                  hintText: _selectedRole == 'teacher' ? 'Teacher ID' : _selectedRole == 'student' ? 'Roll Number' : 'Email',
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
                  hintText: 'Password',
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

              // Login button
              SizedBox(
                height: 52,
                child: ElevatedButton(
                  onPressed: _canSubmit && !_isLoading ? _login : null,
                  child: _isLoading
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : Text(_selectedRole == null ? 'Select a role to continue' : 'Sign in as ${_roles.firstWhere((r) => r.id == _selectedRole).label}'),
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}

/// Modal dialog for configuring the backend server URL.
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
        _testResult = ok
            ? 'Connected! Service: ${result['service'] ?? 'esm'}'
            : 'Server responded but health check failed';
      });
    } catch (e) {
      setState(() {
        _testOk = false;
        _testResult = e.toString();
      });
    } finally {
      if (mounted) setState(() => _testing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
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
            widget.isFirstRun
                ? 'Enter the ESM server URL to connect. This is the web address where your ESM backend is hosted.'
                : 'Change the server the app connects to.',
            style: TextStyle(fontSize: 13, color: AppTheme.textSecondary),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: widget.controller,
            decoration: InputDecoration(
              hintText: 'https://your-app.vercel.app',
              prefixIcon: const Icon(Icons.link, size: 20),
              labelText: 'Server URL',
            ),
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
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: (_testOk ? AppTheme.success : AppTheme.danger).withOpacity(0.2)),
              ),
              child: Row(
                children: [
                  Icon(_testOk ? Icons.check_circle : Icons.error_outline, size: 16, color: _testOk ? AppTheme.success : AppTheme.danger),
                  const SizedBox(width: 6),
                  Expanded(child: Text(_testResult!, style: TextStyle(fontSize: 12, color: _testOk ? AppTheme.success : AppTheme.danger))),
                ],
              ),
            ),
            const SizedBox(height: 8),
          ],
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton.icon(
              onPressed: _testing ? null : _testConnection,
              icon: _testing
                  ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.wifi_find, size: 16),
              label: Text(_testing ? 'Testing…' : 'Test connection'),
            ),
          ),
        ],
      ),
      actions: [
        if (!widget.isFirstRun)
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
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

class _RoleOption {
  final String id;
  final String label;
  final IconData icon;
  _RoleOption({required this.id, required this.label, required this.icon});
}

class _RoleCard extends StatelessWidget {
  final _RoleOption role;
  final bool isSelected;
  final bool isFullWidth;
  final VoidCallback onTap;

  const _RoleCard({required this.role, required this.isSelected, required this.onTap, this.isFullWidth = false});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: EdgeInsets.symmetric(vertical: isFullWidth ? 12 : 10, horizontal: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primary : const Color(0xFFF9FAFB),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: isSelected ? AppTheme.primary : AppTheme.border),
          boxShadow: isSelected ? [BoxShadow(color: AppTheme.primary.withOpacity(0.2), blurRadius: 8, offset: const Offset(0, 2))] : null,
        ),
        child: isFullWidth
            ? Row(mainAxisAlignment: MainAxisAlignment.center, children: _buildContent())
            : Column(children: _buildContent()),
      ),
    );
  }

  List<Widget> _buildContent() {
    return [
      Icon(role.icon, size: 20, color: isSelected ? Colors.white : AppTheme.textSecondary),
      SizedBox(width: isFullWidth ? 8 : 0, height: isFullWidth ? 0 : 6),
      Text(
        role.label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: isSelected ? Colors.white : AppTheme.textSecondary,
        ),
      ),
    ];
  }
}
