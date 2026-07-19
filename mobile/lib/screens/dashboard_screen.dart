import 'package:flutter/material.dart';
import '../services/api_client.dart';
import '../theme/app_theme.dart';
import '../widgets/onboarding.dart';
import 'student_portal/student_home.dart';
import 'teacher_portal/teacher_home.dart';
import 'branch_portal/branch_home.dart';
import 'institute_portal/institute_home.dart';

class DashboardScreen extends StatefulWidget {
  final Map<String, dynamic> user;
  const DashboardScreen({super.key, required this.user});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _showOnboarding = false;

  @override
  void initState() {
    super.initState();
    _checkOnboarding();
  }

  void _checkOnboarding() async {
    final role = widget.user['role'] as String;
    final done = await OnboardingManager.isCompleted(role);
    if (mounted && !done) {
      setState(() => _showOnboarding = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final role = widget.user['role'] as String;

    Widget portal;
    switch (role) {
      case 'student':
        portal = StudentHome(user: widget.user);
        break;
      case 'teacher':
        portal = TeacherHome(user: widget.user);
        break;
      case 'branch-manager':
        portal = BranchHome(user: widget.user);
        break;
      case 'institute-admin':
        portal = InstituteHome(user: widget.user);
        break;
      default:
        portal = _UnknownRole(user: widget.user);
    }

    // Show onboarding overlay on first launch
    if (_showOnboarding) {
      return Stack(
        children: [
          portal,
          OnboardingFlow(
            role: role,
            steps: getOnboardingSteps(role),
            onComplete: () => setState(() => _showOnboarding = false),
          ),
        ],
      );
    }

    return portal;
  }
}

class _UnknownRole extends StatelessWidget {
  final Map<String, dynamic> user;
  const _UnknownRole({required this.user});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('ESM')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: AppTheme.danger),
            const SizedBox(height: 16),
            Text('Unknown role: ${user['role']}'),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () async {
                await ApiClient.logout();
                if (context.mounted) {
                  Navigator.pushNamedAndRemoveUntil(context, '/', (_) => false);
                }
              },
              child: const Text('Logout'),
            ),
          ],
        ),
      ),
    );
  }
}
