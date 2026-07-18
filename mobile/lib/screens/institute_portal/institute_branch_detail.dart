import 'package:flutter/material.dart';
import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';
import '../../widgets/detail_scaffold.dart';

class InstituteBranchDetail extends StatefulWidget {
  final Map<String, dynamic> branch;
  final Map<String, dynamic> user;
  const InstituteBranchDetail({super.key, required this.branch, required this.user});

  @override
  State<InstituteBranchDetail> createState() => _InstituteBranchDetailState();
}

class _InstituteBranchDetailState extends State<InstituteBranchDetail> with SingleTickerProviderStateMixin {
  late final TabController _tabCtrl;
  bool _isBlocking = false;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  Future<void> _toggleBlock() async {
    final branch = widget.branch;
    final currentlyBlocked = branch['blocked'] == true || branch['blocked'] == 1;
    setState(() => _isBlocking = true);
    try {
      await ApiClient.patch('branches/${branch['id']}/block', body: {'blocked': !currentlyBlocked});
      if (mounted) {
        setState(() {
          branch['blocked'] = !currentlyBlocked;
          branch['status'] = !currentlyBlocked ? 'Blocked' : 'Active';
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(!currentlyBlocked ? 'Branch blocked' : 'Branch activated'),
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

  Future<void> _editBranch() async {
    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (ctx) => _EditBranchDialog(branch: widget.branch),
    );
    if (result != null) {
      try {
        await ApiClient.patch('branches/${widget.branch['id']}', body: result);
        if (mounted) {
          setState(() {
            widget.branch['name'] = result['name'];
            widget.branch['city'] = result['city'];
            widget.branch['manager'] = result['manager'];
            widget.branch['managerEmail'] = result['managerEmail'];
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Branch updated'), backgroundColor: AppTheme.success, behavior: SnackBarBehavior.floating),
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

  @override
  Widget build(BuildContext context) {
    final b = widget.branch;
    final blocked = b['blocked'] == true || b['blocked'] == 1;

    return DetailScaffold(
      title: b['name'] ?? 'Branch',
      subtitle: b['city']?.toString().isNotEmpty == true ? 'City: ${b['city']}' : null,
      headerIcon: Icons.account_tree,
      headerColor: blocked ? AppTheme.danger : AppTheme.primary,
      headerActions: [
        IconButton(icon: const Icon(Icons.edit, size: 20), onPressed: _editBranch),
        _isBlocking
            ? const Padding(padding: EdgeInsets.all(12), child: SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)))
            : IconButton(
                icon: Icon(blocked ? Icons.lock_open : Icons.lock_outline, size: 20),
                onPressed: _toggleBlock,
              ),
      ],
      body: Column(
        children: [
          // Branch info card
          Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.border),
            ),
            child: Column(
              children: [
                InfoRow(icon: Icons.location_city, label: 'City', value: '${b['city'] ?? '—'}'),
                InfoRow(icon: Icons.person, label: 'Manager', value: '${b['manager'] ?? '—'}'),
                InfoRow(icon: Icons.email, label: 'Manager Email', value: '${b['managerEmail'] ?? '—'}'),
                InfoRow(icon: Icons.school, label: 'Students', value: '${b['students'] ?? 0}'),
                InfoRow(icon: Icons.group, label: 'Teachers', value: '${b['teachers'] ?? 0}'),
                const Divider(height: 24),
                Row(
                  children: [
                    const Text('Status', style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                    const Spacer(),
                    StatusBadge(text: blocked ? 'Blocked' : 'Active', status: blocked ? 'blocked' : 'active'),
                  ],
                ),
              ],
            ),
          ),
          DetailTabBar(controller: _tabCtrl, tabs: const ['Teachers', 'Students', 'Classes', 'Finance']),
          SizedBox(
            height: MediaQuery.of(context).size.height - 460,
            child: TabBarView(
              controller: _tabCtrl,
              children: [
                _BranchUsersTab(branchId: b['id'], role: 'teacher', instituteId: widget.user['instituteId']),
                _BranchUsersTab(branchId: b['id'], role: 'student', instituteId: widget.user['instituteId']),
                _BranchClassesTab(branchId: b['id']),
                _BranchFinanceTab(branchId: b['id']),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// =============================== USERS TAB ===============================

class _BranchUsersTab extends StatefulWidget {
  final String branchId;
  final String role;
  final String? instituteId;
  const _BranchUsersTab({required this.branchId, required this.role, this.instituteId});

  @override
  State<_BranchUsersTab> createState() => _BranchUsersTabState();
}

class _BranchUsersTabState extends State<_BranchUsersTab> with AutomaticKeepAliveClientMixin {
  List<dynamic> _users = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final list = await ApiClient.getList('platform/users', query: {'role': widget.role, 'branchId': widget.branchId});
      if (mounted) setState(() { _users = list; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  Future<void> _addUser() async {
    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (ctx) => _AddUserDialog(role: widget.role, branchId: widget.branchId, instituteId: widget.instituteId),
    );
    if (result != null) {
      try {
        await ApiClient.post('platform/users', body: result);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('${widget.role == 'teacher' ? 'Teacher' : 'Student'} added successfully'), backgroundColor: AppTheme.success, behavior: SnackBarBehavior.floating),
          );
        }
        _load();
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.danger, behavior: SnackBarBehavior.floating),
          );
        }
      }
    }
  }

  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final isTeacher = widget.role == 'teacher';
    return Scaffold(
      floatingActionButton: FloatingActionButton(
        onPressed: _addUser,
        backgroundColor: AppTheme.primary,
        child: const Icon(Icons.person_add, color: Colors.white),
      ),
      body: _isLoading
          ? const DetailLoading()
          : _error != null
              ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  const Icon(Icons.cloud_off, size: 40, color: AppTheme.danger),
                  const SizedBox(height: 8),
                  Text(_error!, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                  const SizedBox(height: 8),
                  ElevatedButton(onPressed: _load, child: const Text('Retry')),
                ]))
              : _users.isEmpty
                  ? EmptyState(
                      icon: isTeacher ? Icons.group_outlined : Icons.school_outlined,
                      title: 'No ${isTeacher ? 'teachers' : 'students'} yet',
                      description: isTeacher
                          ? 'The branch manager will add teachers, or you can add them yourself.'
                          : 'The branch manager will add students, or you can add them yourself.',
                      actionText: 'Add ${isTeacher ? 'Teacher' : 'Student'}',
                      onAction: _addUser,
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _users.length,
                        itemBuilder: (context, i) {
                          final u = _users[i] as Map<String, dynamic>;
                          return ListRowCard(
                            title: u['name'] ?? 'User',
                            subtitle: isTeacher ? 'ID: ${u['rollNo'] ?? '—'}' : 'Roll: ${u['rollNo'] ?? '—'} · Class ${u['class'] ?? '—'}',
                            icon: isTeacher ? Icons.menu_book : Icons.person,
                            badgeText: u['blocked'] == true ? 'Blocked' : 'Active',
                            badgeStatus: u['blocked'] == true ? 'blocked' : 'active',
                          );
                        },
                      ),
                    ),
    );
  }
}

// =============================== CLASSES TAB ===============================

class _BranchClassesTab extends StatefulWidget {
  final String branchId;
  const _BranchClassesTab({required this.branchId});

  @override
  State<_BranchClassesTab> createState() => _BranchClassesTabState();
}

class _BranchClassesTabState extends State<_BranchClassesTab> with AutomaticKeepAliveClientMixin {
  List<dynamic> _classes = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final list = await ApiClient.getList('classes', query: {'branchId': widget.branchId});
      if (mounted) setState(() { _classes = list; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    if (_isLoading) return const DetailLoading();
    if (_error != null) return Center(child: Text(_error!, style: const TextStyle(fontSize: 11)));
    if (_classes.isEmpty) {
      return const EmptyState(icon: Icons.menu_book_outlined, title: 'No classes', description: 'This branch has no classes configured.');
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _classes.length,
        itemBuilder: (context, i) {
          final c = _classes[i] as Map<String, dynamic>;
          return ListRowCard(
            title: 'Class ${c['name'] ?? '—'}',
            subtitle: 'Section ${c['section'] ?? 'A'}',
            icon: Icons.menu_book,
          );
        },
      ),
    );
  }
}

// =============================== FINANCE TAB ===============================

class _BranchFinanceTab extends StatefulWidget {
  final String branchId;
  const _BranchFinanceTab({required this.branchId});

  @override
  State<_BranchFinanceTab> createState() => _BranchFinanceTabState();
}

class _BranchFinanceTabState extends State<_BranchFinanceTab> with AutomaticKeepAliveClientMixin {
  Map<String, dynamic>? _finance;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final f = await ApiClient.getObject('branch/finance', query: {'branchId': widget.branchId});
      if (mounted) setState(() { _finance = f; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  @override
  bool get wantKeepAlive => true;

  String _fmt(dynamic n) {
    final v = int.tryParse('${n ?? 0}') ?? 0;
    return v.toString().replaceAll(RegExp(r'\B(?=(\d{3})+(?!\d))'), ',');
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    if (_isLoading) return const DetailLoading();
    if (_error != null) return Center(child: Text(_error!, style: const TextStyle(fontSize: 11)));
    final kpi = _finance?['kpi'] ?? {};
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
            childAspectRatio: 1.4,
            children: [
              KpiCard(icon: Icons.attach_money, label: 'Revenue', value: 'PKR ${_fmt(kpi['totalRevenue'])}'),
              KpiCard(icon: Icons.error_outline, label: 'Pending', value: 'PKR ${_fmt(kpi['pendingFees'])}', iconColor: AppTheme.danger),
              KpiCard(icon: Icons.wallet, label: 'Salary Paid', value: 'PKR ${_fmt(kpi['totalSalaryPaid'])}'),
              KpiCard(icon: Icons.balance, label: 'Net', value: 'PKR ${_fmt(kpi['netBalance'])}'),
            ],
          ),
        ],
      ),
    );
  }
}

// =============================== EDIT BRANCH DIALOG ===============================

class _EditBranchDialog extends StatefulWidget {
  final Map<String, dynamic> branch;
  const _EditBranchDialog({required this.branch});

  @override
  State<_EditBranchDialog> createState() => _EditBranchDialogState();
}

class _EditBranchDialogState extends State<_EditBranchDialog> {
  late final TextEditingController _name;
  late final TextEditingController _city;
  late final TextEditingController _manager;
  late final TextEditingController _email;
  late final TextEditingController _password;

  @override
  void initState() {
    super.initState();
    _name = TextEditingController(text: widget.branch['name'] ?? '');
    _city = TextEditingController(text: widget.branch['city'] ?? '');
    _manager = TextEditingController(text: widget.branch['manager'] ?? '');
    _email = TextEditingController(text: widget.branch['managerEmail'] ?? '');
    _password = TextEditingController();
  }

  @override
  void dispose() {
    _name.dispose(); _city.dispose(); _manager.dispose(); _email.dispose(); _password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Edit Branch'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: _name, decoration: const InputDecoration(labelText: 'Branch Name'),),
            const SizedBox(height: 8),
            TextField(controller: _city, decoration: const InputDecoration(labelText: 'City')),
            const SizedBox(height: 8),
            TextField(controller: _manager, decoration: const InputDecoration(labelText: 'Manager Name')),
            const SizedBox(height: 8),
            TextField(controller: _email, decoration: const InputDecoration(labelText: 'Manager Email'), keyboardType: TextInputType.emailAddress),
            const SizedBox(height: 8),
            TextField(controller: _password, decoration: const InputDecoration(labelText: 'New Password (optional)'), obscureText: true),
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        ElevatedButton(
          onPressed: () {
            final body = <String, dynamic>{
              'name': _name.text.trim(),
              'city': _city.text.trim(),
              'manager': _manager.text.trim(),
              'managerEmail': _email.text.trim(),
            };
            if (_password.text.isNotEmpty) body['managerPassword'] = _password.text;
            Navigator.pop(context, body);
          },
          child: const Text('Save'),
        ),
      ],
    );
  }
}

// =============================== ADD USER DIALOG ===============================

class _AddUserDialog extends StatefulWidget {
  final String role;
  final String? branchId;
  final String? instituteId;
  const _AddUserDialog({required this.role, required this.branchId, required this.instituteId});

  @override
  State<_AddUserDialog> createState() => _AddUserDialogState();
}

class _AddUserDialogState extends State<_AddUserDialog> {
  final _nameCtrl = TextEditingController();
  final _rollNoCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _classCtrl = TextEditingController();
  final _sectionCtrl = TextEditingController(text: 'A');

  @override
  void dispose() {
    _nameCtrl.dispose(); _rollNoCtrl.dispose(); _passwordCtrl.dispose();
    _classCtrl.dispose(); _sectionCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isTeacher = widget.role == 'teacher';
    final canSubmit = _nameCtrl.text.trim().isNotEmpty &&
        _rollNoCtrl.text.trim().isNotEmpty &&
        _passwordCtrl.text.isNotEmpty;
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: Row(
        children: [
          Icon(Icons.person_add, color: AppTheme.primary, size: 22),
          const SizedBox(width: 8),
          Text('Add ${isTeacher ? 'Teacher' : 'Student'}'),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Full Name *', prefixIcon: Icon(Icons.person, size: 18)), onChanged: (_) => setState(() {})),
            const SizedBox(height: 8),
            TextField(controller: _rollNoCtrl, decoration: InputDecoration(labelText: isTeacher ? 'Teacher ID *' : 'Roll Number *', prefixIcon: const Icon(Icons.badge, size: 18)), onChanged: (_) => setState(() {})),
            const SizedBox(height: 8),
            TextField(controller: _passwordCtrl, decoration: const InputDecoration(labelText: 'Password *', prefixIcon: Icon(Icons.lock, size: 18)), obscureText: true, onChanged: (_) => setState(() {})),
            if (!isTeacher) ...[
              const SizedBox(height: 8),
              TextField(controller: _classCtrl, decoration: const InputDecoration(labelText: 'Class', prefixIcon: Icon(Icons.school, size: 18))),
              const SizedBox(height: 8),
              TextField(controller: _sectionCtrl, decoration: const InputDecoration(labelText: 'Section', prefixIcon: Icon(Icons.bookmark, size: 18))),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        ElevatedButton(
          onPressed: !canSubmit
              ? null
              : () {
                  final body = <String, dynamic>{
                    'name': _nameCtrl.text.trim(),
                    'rollNo': _rollNoCtrl.text.trim(),
                    'password': _passwordCtrl.text,
                    'role': widget.role,
                    'branchId': widget.branchId,
                    'instituteId': widget.instituteId,
                  };
                  if (!isTeacher && _classCtrl.text.trim().isNotEmpty) {
                    body['class'] = _classCtrl.text.trim();
                    body['section'] = _sectionCtrl.text.trim();
                  }
                  Navigator.pop(context, body);
                },
          child: Text('Add ${isTeacher ? 'Teacher' : 'Student'}'),
        ),
      ],
    );
  }
}
