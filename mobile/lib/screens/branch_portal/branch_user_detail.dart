import 'package:flutter/material.dart';
import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';
import '../../widgets/detail_scaffold.dart';

class BranchUserDetail extends StatefulWidget {
  final Map<String, dynamic> user;
  final String role;
  const BranchUserDetail({super.key, required this.user, required this.role});

  @override
  State<BranchUserDetail> createState() => _BranchUserDetailState();
}

class _BranchUserDetailState extends State<BranchUserDetail> {
  bool _isBlocking = false;
  bool _showPassword = false;
  String? _password;
  bool _loadingPassword = false;

  @override
  Widget build(BuildContext context) {
    final u = widget.user;
    final role = widget.role;
    final blocked = u['blocked'] == true;
    final isTeacher = role == 'teacher';

    return DetailScaffold(
      title: u['name'] ?? 'User',
      subtitle: '${isTeacher ? 'Teacher' : 'Student'} · ID: ${u['rollNo'] ?? '—'}',
      headerIcon: isTeacher ? Icons.menu_book : Icons.person,
      headerColor: blocked ? AppTheme.danger : AppTheme.primary,
      headerActions: [
        IconButton(icon: const Icon(Icons.edit, size: 20), onPressed: _editUser),
        _isBlocking
            ? const Padding(padding: EdgeInsets.all(12), child: SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)))
            : IconButton(
                icon: Icon(blocked ? Icons.lock_open : Icons.lock_outline, size: 20),
                onPressed: _toggleBlock,
              ),
      ],
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Profile card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.border),
              ),
              child: Column(
                children: [
                  // Avatar + name
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 28,
                        backgroundColor: AppTheme.primary.withOpacity(0.1),
                        child: Text(
                          _initials(u['name']),
                          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppTheme.primary),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(u['name'] ?? 'User', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                            Text(isTeacher ? 'Teacher' : 'Student', style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                          ],
                        ),
                      ),
                      StatusBadge(text: blocked ? 'Blocked' : 'Active', status: blocked ? 'blocked' : 'active'),
                    ],
                  ),
                  const Divider(height: 24),
                  InfoRow(icon: Icons.badge, label: 'ID / Roll No', value: '${u['rollNo'] ?? '—'}'),
                  if (u['email'] != null) InfoRow(icon: Icons.email, label: 'Email', value: '${u['email']}'),
                  if (!isTeacher && u['class'] != null) InfoRow(icon: Icons.school, label: 'Class', value: '${u['class']}'),
                  if (!isTeacher && u['section'] != null) InfoRow(icon: Icons.bookmark, label: 'Section', value: '${u['section']}'),
                  if (isTeacher) ...[
                    InfoRow(icon: Icons.menu_book, label: 'Subjects', value: _fmtSubjects(u['subjects'])),
                    InfoRow(icon: Icons.class_, label: 'Classes', value: _fmtList(u['classes'])),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 16),
            // Password reveal card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Row(
                  children: [
                    const Icon(Icons.lock_outline, size: 20, color: AppTheme.primary),
                    const SizedBox(width: 10),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Password', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                          Text('Reveal the user\'s login password', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                        ],
                      ),
                    ),
                    if (_loadingPassword)
                      const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                    else if (_password != null)
                      Expanded(
                        child: Text(_password!, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.primary), textAlign: TextAlign.right),
                      )
                    else
                      TextButton.icon(
                        icon: const Icon(Icons.visibility, size: 16),
                        label: const Text('Reveal'),
                        onPressed: _revealPassword,
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _initials(dynamic name) {
    final s = (name ?? '?').toString().trim();
    if (s.isEmpty) return '?';
    return s.split(RegExp(r'\s+')).take(2).map((w) => w[0].toUpperCase()).join();
  }

  String _fmtSubjects(dynamic s) {
    if (s is List) return s.isEmpty ? 'None' : s.join(', ');
    if (s is String && s.isNotEmpty) return s.replaceAll(RegExp(r'[\[\]"\\]'), '');
    return 'None';
  }

  String _fmtList(dynamic s) {
    if (s is List) return s.isEmpty ? 'None' : s.join(', ');
    return 'None';
  }

  Future<void> _revealPassword() async {
    setState(() => _loadingPassword = true);
    try {
      final r = await ApiClient.getObject('platform/users/${widget.user['id']}/password');
      if (mounted) setState(() { _password = r['password']; _loadingPassword = false; });
    } catch (e) {
      if (mounted) {
        setState(() => _loadingPassword = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.danger, behavior: SnackBarBehavior.floating),
        );
      }
    }
  }

  Future<void> _toggleBlock() async {
    final u = widget.user;
    final currentlyBlocked = u['blocked'] == true;
    setState(() => _isBlocking = true);
    try {
      await ApiClient.patch('platform/users/${u['id']}/block', body: {'blocked': !currentlyBlocked});
      if (mounted) {
        setState(() => u['blocked'] = !currentlyBlocked);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(!currentlyBlocked ? 'User blocked' : 'User activated'),
            backgroundColor: !currentlyBlocked ? AppTheme.danger : AppTheme.success,
            behavior: SnackBarBehavior.floating,
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
      if (mounted) setState(() => _isBlocking = false);
    }
  }

  Future<void> _editUser() async {
    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (ctx) => _EditUserDialog(user: widget.user),
    );
    if (result != null) {
      try {
        await ApiClient.patch('platform/users/${widget.user['id']}', body: result);
        if (mounted) {
          setState(() {
            if (result['name'] != null) widget.user['name'] = result['name'];
            if (result['email'] != null) widget.user['email'] = result['email'];
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('User updated'), backgroundColor: AppTheme.success, behavior: SnackBarBehavior.floating),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.danger, behavior: SnackBarBehavior.floating),
          );
        }
      }
    }
  }
}

// =============================== EDIT USER DIALOG ===============================

class _EditUserDialog extends StatefulWidget {
  final Map<String, dynamic> user;
  const _EditUserDialog({required this.user});

  @override
  State<_EditUserDialog> createState() => _EditUserDialogState();
}

class _EditUserDialogState extends State<_EditUserDialog> {
  late final TextEditingController _name;
  late final TextEditingController _email;
  late final TextEditingController _password;

  @override
  void initState() {
    super.initState();
    _name = TextEditingController(text: widget.user['name'] ?? '');
    _email = TextEditingController(text: widget.user['email'] ?? '');
    _password = TextEditingController();
  }

  @override
  void dispose() {
    _name.dispose(); _email.dispose(); _password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Edit User'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: _name, decoration: const InputDecoration(labelText: 'Full Name')),
            const SizedBox(height: 8),
            TextField(controller: _email, decoration: const InputDecoration(labelText: 'Email (optional)'), keyboardType: TextInputType.emailAddress),
            const SizedBox(height: 8),
            TextField(controller: _password, decoration: const InputDecoration(labelText: 'New Password (optional)'), obscureText: true),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: AppTheme.warning.withOpacity(0.08), borderRadius: BorderRadius.circular(8)),
              child: Row(
                children: [
                  Icon(Icons.info_outline, size: 14, color: AppTheme.warning),
                  const SizedBox(width: 6),
                  const Expanded(child: Text('Setting a password forces reset on next login.', style: TextStyle(fontSize: 10, color: AppTheme.warning))),
                ],
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        ElevatedButton(
          onPressed: () {
            final body = <String, dynamic>{};
            if (_name.text.trim().isNotEmpty) body['name'] = _name.text.trim();
            if (_email.text.trim().isNotEmpty) body['email'] = _email.text.trim();
            if (_password.text.isNotEmpty) body['password'] = _password.text;
            Navigator.pop(context, body);
          },
          child: const Text('Save'),
        ),
      ],
    );
  }
}
