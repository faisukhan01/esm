import 'package:flutter/material.dart';
import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';
import 'student_dashboard.dart';
import 'student_courses.dart';
import 'student_attendance.dart';
import 'student_results.dart';
import 'student_invoices.dart';

class StudentHome extends StatefulWidget {
  final Map<String, dynamic> user;
  const StudentHome({super.key, required this.user});

  @override
  State<StudentHome> createState() => _StudentHomeState();
}

class _StudentHomeState extends State<StudentHome> {
  int _currentIndex = 0;
  late final List<Widget> _screens;

  @override
  void initState() {
    super.initState();
    _screens = [
      StudentDashboard(user: widget.user),
      StudentCourses(user: widget.user),
      StudentAttendance(user: widget.user),
      StudentResults(user: widget.user),
      StudentInvoices(user: widget.user),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: _screens),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (i) => setState(() => _currentIndex = i),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard_outlined), activeIcon: Icon(Icons.dashboard), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.menu_book_outlined), activeIcon: Icon(Icons.menu_book), label: 'Courses'),
          BottomNavigationBarItem(icon: Icon(Icons.event_available_outlined), activeIcon: Icon(Icons.event_available), label: 'Attendance'),
          BottomNavigationBarItem(icon: Icon(Icons.assessment_outlined), activeIcon: Icon(Icons.assessment), label: 'Results'),
          BottomNavigationBarItem(icon: Icon(Icons.receipt_outlined), activeIcon: Icon(Icons.receipt), label: 'Invoices'),
        ],
      ),
    );
  }
}
