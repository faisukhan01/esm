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
  bool get _canSubmit => _selectedRole != null && _emailController.text.isNotEmpty && _passwordController.text.isNotEmpty;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (!_canSubmit) return;
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
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 48),
              // Logo
              Container(
                width: 64, height: 64,
                decoration: BoxDecoration(
                  color: AppTheme.primary,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Icon(Icons.school, color: Colors.white, size: 32),
              ),
              const SizedBox(height: 24),
              const Text('Welcome to ESM', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
              const SizedBox(height: 4),
              const Text('Electronic School Management', style: TextStyle(fontSize: 14, color: AppTheme.textSecondary)),
              const SizedBox(height: 32),

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
              const SizedBox(height: 24),

              // Security note
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.accent,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppTheme.primary.withOpacity(0.1)),
                ),
                child: Row(
                  children: [
                    Icon(Icons.shield_outlined, size: 16, color: AppTheme.primary),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _selectedRole == null
                            ? 'Please select your role above to sign in.'
                            : 'Secure login. Your credentials are encrypted.',
                        style: TextStyle(fontSize: 11, color: AppTheme.primary),
                      ),
                    ),
                  ],
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
          color: isSelected ? AppTheme.primary : Color(0xFFF9FAFB),
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
