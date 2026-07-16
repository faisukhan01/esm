import 'package:flutter/material.dart';
import 'services/api_client.dart';
import 'theme/app_theme.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ApiClient.init();
  runApp(const ESMApp());
}

class ESMApp extends StatelessWidget {
  const ESMApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ESM — Electronic School Management',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const SplashScreen(),
      routes: {
        '/': (context) => const SplashScreen(),
        '/login': (context) => const LoginScreen(),
      },
    );
  }
}

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with TickerProviderStateMixin {
  late final AnimationController _logoCtrl;
  late final AnimationController _fadeCtrl;
  late final Animation<double> _logoScale;
  late final Animation<double> _logoFade;
  late final Animation<double> _textFade;

  @override
  void initState() {
    super.initState();
    _logoCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 900));
    _fadeCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 500));
    _logoScale = Tween<double>(begin: 0.6, end: 1.0).animate(CurvedAnimation(parent: _logoCtrl, curve: Curves.easeOutBack));
    _logoFade = Tween<double>(begin: 0.0, end: 1.0).animate(CurvedAnimation(parent: _logoCtrl, curve: Curves.easeIn));
    _textFade = Tween<double>(begin: 0.0, end: 1.0).animate(CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeIn));

    _logoCtrl.forward().then((_) => _fadeCtrl.forward());
    _checkAuth();
  }

  @override
  void dispose() {
    _logoCtrl.dispose();
    _fadeCtrl.dispose();
    super.dispose();
  }

  Future<void> _checkAuth() async {
    await Future.delayed(const Duration(milliseconds: 1600));
    final user = await ApiClient.getUser();
    if (mounted) {
      if (user != null) {
        Navigator.pushReplacement(
          context,
          PageRouteBuilder(
            pageBuilder: (_, __, ___) => DashboardScreen(user: user),
            transitionsBuilder: (_, a, __, child) => FadeTransition(opacity: a, child: child),
            transitionDuration: const Duration(milliseconds: 400),
          ),
        );
      } else {
        Navigator.pushReplacement(
          context,
          PageRouteBuilder(
            pageBuilder: (_, __, ___) => const LoginScreen(),
            transitionsBuilder: (_, a, __, child) => FadeTransition(opacity: a, child: child),
            transitionDuration: const Duration(milliseconds: 400),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [AppTheme.primary, AppTheme.primaryLight, AppTheme.primary],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Stack(
          children: [
            // Decorative circles
            Positioned(
              top: -80, right: -80,
              child: Container(width: 240, height: 240, decoration: BoxDecoration(color: Colors.white.withOpacity(0.04), shape: BoxShape.circle)),
            ),
            Positioned(
              bottom: -60, left: -60,
              child: Container(width: 180, height: 180, decoration: BoxDecoration(color: AppTheme.gold.withOpacity(0.06), shape: BoxShape.circle)),
            ),
            // Center content
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  ScaleTransition(
                    scale: _logoScale,
                    child: FadeTransition(
                      opacity: _logoFade,
                      child: Container(
                        width: 96, height: 96,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(24),
                          boxShadow: [
                            BoxShadow(color: AppTheme.gold.withOpacity(0.3), blurRadius: 30, offset: const Offset(0, 8)),
                          ],
                        ),
                        child: const Icon(Icons.school, size: 48, color: AppTheme.primary),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  FadeTransition(
                    opacity: _textFade,
                    child: Column(
                      children: [
                        const Text('ESM', style: TextStyle(fontSize: 36, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 2)),
                        const SizedBox(height: 4),
                        Text('Electronic School Management', style: TextStyle(fontSize: 13, color: Colors.white.withOpacity(0.7), letterSpacing: 0.5)),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppTheme.gold.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: AppTheme.gold.withOpacity(0.3)),
                          ),
                          child: Text('PREMIUM', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: AppTheme.goldLight, letterSpacing: 1.5)),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 40),
                  SizedBox(
                    width: 24, height: 24,
                    child: CircularProgressIndicator(color: Colors.white.withOpacity(0.4), strokeWidth: 2),
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
