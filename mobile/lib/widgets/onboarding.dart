import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../theme/app_theme.dart';

/// A simple onboarding/coach-mark system that shows guidance tooltips
/// on first launch. Tracks completion in SharedPreferences so it only
/// shows once per role.
class OnboardingManager {
  static const String _keyPrefix = 'esm_onboarding_done_';

  /// Returns true if onboarding has been completed for the given role.
  static Future<bool> isCompleted(String role) async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool('${_keyPrefix}$role') ?? false;
  }

  /// Marks onboarding as completed for the given role.
  static Future<void> markCompleted(String role) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('${_keyPrefix}$role', true);
  }

  /// Resets onboarding for all roles (for testing).
  static Future<void> reset() async {
    final prefs = await SharedPreferences.getInstance();
    final keys = prefs.getKeys().where((k) => k.startsWith(_keyPrefix));
    for (final key in keys) {
      await prefs.remove(key);
    }
  }
}

/// A full-screen overlay that shows a coach mark pointing to a specific
/// area of the screen. Used for the onboarding flow.
class CoachMarkOverlay extends StatelessWidget {
  final String title;
  final String description;
  final int step;
  final int totalSteps;
  final VoidCallback onNext;
  final VoidCallback onSkip;

  const CoachMarkOverlay({
    super.key,
    required this.title,
    required this.description,
    required this.step,
    required this.totalSteps,
    required this.onNext,
    required this.onSkip,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.black54,
      child: SafeArea(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Step indicator
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: AppTheme.primary,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                'Step $step of $totalSteps',
                style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white),
              ),
            ),
            const SizedBox(height: 16),
            // Coach mark card
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 32),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
                  const SizedBox(height: 8),
                  Text(description, style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textSecondary, height: 1.4)),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      TextButton(onPressed: onSkip, child: Text('Skip', style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textMuted))),
                      const Spacer(),
                      ElevatedButton(
                        onPressed: onNext,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                        ),
                        child: Text(step < totalSteps ? 'Next' : 'Got it', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Shows a multi-step onboarding flow for a specific role.
/// Each step has a title + description. Shows sequentially.
class OnboardingFlow extends StatefulWidget {
  final String role;
  final List<OnboardingStep> steps;
  final VoidCallback onComplete;

  const OnboardingFlow({
    super.key,
    required this.role,
    required this.steps,
    required this.onComplete,
  });

  @override
  State<OnboardingFlow> createState() => _OnboardingFlowState();
}

class _OnboardingFlowState extends State<OnboardingFlow> {
  int _currentStep = 0;

  void _next() {
    if (_currentStep < widget.steps.length - 1) {
      setState(() => _currentStep++);
    } else {
      OnboardingManager.markCompleted(widget.role);
      widget.onComplete();
    }
  }

  void _skip() {
    OnboardingManager.markCompleted(widget.role);
    widget.onComplete();
  }

  @override
  Widget build(BuildContext context) {
    final step = widget.steps[_currentStep];
    return CoachMarkOverlay(
      title: step.title,
      description: step.description,
      step: _currentStep + 1,
      totalSteps: widget.steps.length,
      onNext: _next,
      onSkip: _skip,
    );
  }
}

class OnboardingStep {
  final String title;
  final String description;
  OnboardingStep({required this.title, required this.description});
}

/// Returns role-specific onboarding steps.
List<OnboardingStep> getOnboardingSteps(String role) {
  switch (role) {
    case 'institute-admin':
      return [
        OnboardingStep(title: 'Welcome to ESM', description: 'Manage your entire institute from here. Let\'s take a quick tour.'),
        OnboardingStep(title: 'Dashboard', description: 'View total revenue, branches, students, and teachers at a glance. Tap any quick action card to navigate.'),
        OnboardingStep(title: 'Manage Branches', description: 'Tap the Branches tab below to add and manage branches. Tap any branch card to view its teachers, students, and finance.'),
        OnboardingStep(title: 'Royalty & Reports', description: 'Track royalty invoices and view financial reports from the tabs below.'),
        OnboardingStep(title: 'Announcements', description: 'Tap the megaphone icon in the top bar to send announcements to branches, teachers, or students.'),
        OnboardingStep(title: 'Settings', description: 'Tap the gear icon to view your profile, change password, or log out.'),
      ];
    case 'branch-manager':
      return [
        OnboardingStep(title: 'Welcome to ESM', description: 'Manage your branch from here. Let\'s show you around.'),
        OnboardingStep(title: 'Dashboard', description: 'View your branch revenue, pending fees, and salary payments. Charts update in real-time.'),
        OnboardingStep(title: 'Add Teachers', description: 'Tap the Teachers tab below, then tap the + button to add teachers to your branch.'),
        OnboardingStep(title: 'Add Students', description: 'Tap the Students tab, then tap + to enroll students. You can assign class and section.'),
        OnboardingStep(title: 'Fee Management', description: 'Tap the Fees tab to view invoices and mark them as paid when students pay.'),
        OnboardingStep(title: 'Announcements', description: 'Tap the megaphone icon to send messages to teachers or students in your branch.'),
      ];
    case 'teacher':
      return [
        OnboardingStep(title: 'Welcome to ESM', description: 'Your teaching dashboard — let\'s get you started.'),
        OnboardingStep(title: 'Dashboard', description: 'View your classes, students, attendance rate, and average scores at a glance.'),
        OnboardingStep(title: 'My Classes', description: 'Tap the Classes tab to see your assigned classes. Tap any class to mark attendance or post results.'),
        OnboardingStep(title: 'Mark Attendance', description: 'Inside a class, tap Attendance. Select the date, mark each student Present/Absent/Late, then tap Save.'),
        OnboardingStep(title: 'Post Results', description: 'Inside a class, tap Results. Enter the exam name, select a course, enter marks for each student, and tap Post Results.'),
        OnboardingStep(title: 'Diary & Timetable', description: 'Use the Diary tab to post homework. Use the Timetable tab to view your weekly schedule.'),
      ];
    case 'student':
      return [
        OnboardingStep(title: 'Welcome to ESM', description: 'Your student portal — everything you need in one place.'),
        OnboardingStep(title: 'Dashboard', description: 'View your attendance rate, average score, fee status, and enrolled courses.'),
        OnboardingStep(title: 'My Courses', description: 'Tap the Courses tab to see your subjects. Tap any course to view materials, results, and attendance.'),
        OnboardingStep(title: 'Attendance & Results', description: 'Check your attendance history and exam results with grade badges and progress bars.'),
        OnboardingStep(title: 'Fee Invoices', description: 'Tap the Invoices tab to view your fee invoices. Tap any invoice to download a PDF copy.'),
        OnboardingStep(title: 'Announcements', description: 'Tap the megaphone icon to see announcements from your teachers and institute.'),
      ];
    default:
      return [
        OnboardingStep(title: 'Welcome to ESM', description: 'Electronic School Management — your complete school management platform.'),
        OnboardingStep(title: 'Explore', description: 'Use the tabs below to navigate your portal. Check the top bar for announcements and settings.'),
      ];
  }
}
