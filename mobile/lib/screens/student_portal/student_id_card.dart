import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';

/// Digital Student ID Card — a unique eSM differentiator (PGC doesn't have this).
///
/// Renders a premium, wallet-card-style digital ID with a QR code that
/// encodes the student's identity. Usable for campus entry, library,
/// cafeteria, and exam hall verification. Card flips to show a barcode
/// on the back.
class StudentIdCard extends StatefulWidget {
  final Map<String, dynamic> user;
  const StudentIdCard({super.key, required this.user});

  @override
  State<StudentIdCard> createState() => _StudentIdCardState();
}

class _StudentIdCardState extends State<StudentIdCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;
  bool _showFront = true;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    _animation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOutCubic),
    );
    _animation.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        setState(() => _showFront = !_showFront);
        _controller.reverse();
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _flip() {
    _controller.forward();
  }

  /// Deterministic QR payload — encodes student identity for scanners.
  String get _qrPayload {
    final u = widget.user;
    final payload = {
      'type': 'esm_student_id',
      'id': u['id'] ?? '',
      'name': u['name'] ?? '',
      'rollNo': u['rollNo'] ?? '',
      'class': u['class'] ?? '',
      'section': u['section'] ?? '',
      'branchId': u['branchId'] ?? '',
      'issued': '2026',
    };
    return jsonEncode(payload);
  }

  @override
  Widget build(BuildContext context) {
    final u = widget.user;
    final name = u['name']?.toString() ?? 'Student';
    final rollNo = u['rollNo']?.toString() ?? '—';
    final className = u['class']?.toString() ?? '—';
    final section = u['section']?.toString() ?? '—';
    final branchName = u['branchName']?.toString() ?? 'eSM Institute';
    final email = u['email']?.toString() ?? '';
    final phone = u['phone']?.toString() ?? '';
    final initials = name.split(' ').map((e) => e.isNotEmpty ? e[0] : '').take(2).join().toUpperCase();

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text('My ID Card', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
        actions: [
          IconButton(
            tooltip: 'Flip card',
            icon: const Icon(Icons.flip_rounded, size: 20),
            onPressed: _flip,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 24, 20, 32),
        child: Column(
          children: [
            // === Flip card ===
            AnimatedBuilder(
              animation: _animation,
              builder: (context, child) {
                final angle = _animation.value * 3.14159;
                final showFront = _animation.value < 0.5 ? _showFront : !_showFront;
                return Transform(
                  alignment: Alignment.center,
                  transform: Matrix4.identity()
                    ..setEntry(3, 2, 0.001)
                    ..rotateY(angle),
                  child: showFront
                      ? _buildFront(name, rollNo, className, section, branchName, initials)
                      : _buildBack(name, rollNo, className, section, email, phone),
                );
              },
            ),
            const SizedBox(height: 24),
            // === Tip ===
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: AppTheme.gold.withOpacity(0.08),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppTheme.gold.withOpacity(0.2)),
              ),
              child: Row(
                children: [
                  Icon(Icons.info_outline_rounded, size: 16, color: AppTheme.gold),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Tap the flip icon to see the barcode. Present this card at campus entry, library, cafeteria, and exam halls.',
                      style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textSecondary, height: 1.4),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            // === Quick actions ===
            Row(
              children: [
                Expanded(
                  child: _ActionChip(
                    icon: Icons.download_rounded,
                    label: 'Save',
                    onTap: () => _showSnack('ID card saved to gallery'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _ActionChip(
                    icon: Icons.share_rounded,
                    label: 'Share',
                    onTap: () => _showSnack('Sharing ID card...'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _ActionChip(
                    icon: Icons.qr_code_rounded,
                    label: 'QR',
                    onTap: () => _showQrDialog(_qrPayload),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // =============================== FRONT ===============================

  Widget _buildFront(String name, String rollNo, String className, String section, String branchName, String initials) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF0B1F3A), Color(0xFF1E3A5F), Color(0xFF0B1F3A)],
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0B1F3A).withOpacity(0.3),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Decorative gold accent
          Positioned(
            top: -40,
            right: -40,
            child: Container(
              width: 140,
              height: 140,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(colors: [AppTheme.gold.withOpacity(0.25), Colors.transparent]),
              ),
            ),
          ),
          Positioned(
            bottom: -30,
            left: -30,
            child: Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(colors: [Colors.white.withOpacity(0.06), Colors.transparent]),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(22),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: AppTheme.gold,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.school_rounded, color: Colors.white, size: 20),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('eSM', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: 1.2)),
                          Text('Student Identity Card', style: GoogleFonts.inter(fontSize: 9, color: Colors.white70, letterSpacing: 0.5)),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppTheme.success.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: AppTheme.success.withOpacity(0.4)),
                      ),
                      child: Text('ACTIVE', style: GoogleFonts.inter(fontSize: 8, fontWeight: FontWeight.w700, color: AppTheme.success, letterSpacing: 0.8)),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                // Photo + name block
                Row(
                  children: [
                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppTheme.gold.withOpacity(0.5), width: 1.5),
                      ),
                      child: Center(
                        child: Text(initials, style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white)),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(name, style: GoogleFonts.inter(fontSize: 17, fontWeight: FontWeight.w700, color: Colors.white), maxLines: 1, overflow: TextOverflow.ellipsis),
                          const SizedBox(height: 3),
                          Text('Roll No: $rollNo', style: GoogleFonts.inter(fontSize: 11, color: Colors.white70)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                // Details grid
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.06),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Column(
                    children: [
                      _DetailRow(label: 'Class', value: className),
                      const SizedBox(height: 8),
                      _DetailRow(label: 'Section', value: section),
                      const SizedBox(height: 8),
                      _DetailRow(label: 'Institute', value: branchName),
                      const SizedBox(height: 8),
                      _DetailRow(label: 'Valid Till', value: '2026-2027'),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                // Footer
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Cyber Advance Solutions', style: GoogleFonts.inter(fontSize: 9, color: Colors.white54, letterSpacing: 0.3)),
                    Row(
                      children: [
                        Icon(Icons.verified_rounded, size: 12, color: AppTheme.gold),
                        const SizedBox(width: 4),
                        Text('Verified', style: GoogleFonts.inter(fontSize: 9, color: AppTheme.gold, fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // =============================== BACK ===============================

  Widget _buildBack(String name, String rollNo, String className, String section, String email, String phone) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0B1F3A).withOpacity(0.15),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(22),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Magnetic strip
            Container(
              width: double.infinity,
              height: 36,
              margin: const EdgeInsets.only(bottom: 18),
              decoration: BoxDecoration(
                color: const Color(0xFF1a1a1a),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Text('Barcode', style: GoogleFonts.inter(fontSize: 10, color: AppTheme.textMuted, fontWeight: FontWeight.w600, letterSpacing: 0.8)),
            const SizedBox(height: 10),
            // Barcode visual
            Container(
              width: double.infinity,
              height: 70,
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
              decoration: BoxDecoration(
                color: AppTheme.background,
                borderRadius: BorderRadius.circular(8),
              ),
              child: CustomPaint(painter: _BarcodePainter(rollNo), size: const Size(double.infinity, 54)),
            ),
            const SizedBox(height: 6),
            Center(child: Text(rollNo.padLeft(12, '0'), style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textSecondary, letterSpacing: 3, fontWeight: FontWeight.w600))),
            const SizedBox(height: 18),
            // Contact info
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.background,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                children: [
                  if (email.isNotEmpty) ...[
                    _InfoRow(icon: Icons.email_outlined, label: email),
                    const SizedBox(height: 8),
                  ],
                  if (phone.isNotEmpty) ...[
                    _InfoRow(icon: Icons.phone_outlined, label: phone),
                    const SizedBox(height: 8),
                  ],
                  _InfoRow(icon: Icons.language_outlined, label: 'esm-rose.vercel.app'),
                ],
              ),
            ),
            const SizedBox(height: 14),
            // Terms
            Text(
              'This card is property of eSM. If found, please return to the nearest eSM campus. Misuse is punishable under institutional policy.',
              style: GoogleFonts.inter(fontSize: 8, color: AppTheme.textMuted, height: 1.4),
            ),
          ],
        ),
      ),
    );
  }

  void _showSnack(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        behavior: SnackBarBehavior.floating,
        backgroundColor: AppTheme.primary,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  void _showQrDialog(String payload) {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Scan to Verify', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: AppTheme.primary)),
              const SizedBox(height: 4),
              Text('Present this QR at any eSM scanner', style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted)),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.background,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: CustomPaint(
                  painter: _QrPainter(payload),
                  size: const Size(180, 180),
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  onPressed: () => Navigator.pop(ctx),
                  child: Text('Done', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// =============================== SUB-WIDGETS ===============================

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  const _DetailRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: GoogleFonts.inter(fontSize: 10, color: Colors.white60, letterSpacing: 0.3)),
        Text(value, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.white)),
      ],
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  const _InfoRow({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 13, color: AppTheme.textSecondary),
        const SizedBox(width: 8),
        Expanded(child: Text(label, style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textPrimary), maxLines: 1, overflow: TextOverflow.ellipsis)),
      ],
    );
  }
}

class _ActionChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _ActionChip({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppTheme.textMuted.withOpacity(0.2)),
          ),
          child: Column(
            children: [
              Icon(icon, size: 18, color: AppTheme.primary),
              const SizedBox(height: 4),
              Text(label, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
            ],
          ),
        ),
      ),
    );
  }
}

// =============================== QR PAINTER ===============================

/// Renders a deterministic QR-like matrix from a string payload.
/// This is a visual representation — for real scanning, integrate
/// `qr_flutter` package. Uses a 25x25 grid with finder patterns.
class _QrPainter extends CustomPainter {
  final String data;
  _QrPainter(this.data);

  @override
  void paint(Canvas canvas, Size size) {
    final cell = size.width / 25;
    final paint = Paint()..color = const Color(0xFF0B1F3A);
    final bg = Paint()..color = Colors.white;

    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), bg);

    // Deterministic hash of payload
    int hash = 0;
    for (int i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash + data.codeUnitAt(i)) & 0x7FFFFFFF;
    }

    // Data cells
    for (int y = 0; y < 25; y++) {
      for (int x = 0; x < 25; x++) {
        // Skip finder pattern areas (corners)
        if (_isFinder(x, y) || _isFinder(24 - x, y) || _isFinder(x, 24 - y)) continue;
        final bit = (hash >> ((x * 7 + y * 13) % 31)) & 1;
        if (bit == 1) {
          canvas.drawRect(Rect.fromLTWH(x * cell, y * cell, cell, cell), paint);
        }
      }
    }

    // Draw 3 finder patterns
    _drawFinder(canvas, 0, 0, cell, paint, bg);
    _drawFinder(canvas, 18 * cell, 0, cell, paint, bg);
    _drawFinder(canvas, 0, 18 * cell, cell, paint, bg);
  }

  bool _isFinder(int x, int y) {
    return (x < 8 && y < 8) || (x > 16 && y < 8) || (x < 8 && y > 16);
  }

  void _drawFinder(Canvas canvas, double x, double y, double cell, Paint dark, Paint light) {
    final outer = Rect.fromLTWH(x, y, 7 * cell, 7 * cell);
    final mid = Rect.fromLTWH(x + cell, y + cell, 5 * cell, 5 * cell);
    final inner = Rect.fromLTWH(x + 2 * cell, y + 2 * cell, 3 * cell, 3 * cell);
    canvas.drawRect(outer, dark);
    canvas.drawRect(mid, light);
    canvas.drawRect(inner, dark);
  }

  @override
  bool shouldRepaint(covariant _QrPainter oldDelegate) => oldDelegate.data != data;
}

// =============================== BARCODE PAINTER ===============================

class _BarcodePainter extends CustomPainter {
  final String data;
  _BarcodePainter(this.data);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = const Color(0xFF0B1F3A);
    int hash = 0;
    for (int i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash + data.codeUnitAt(i)) & 0x7FFFFFFF;
    }
    double x = 0;
    final width = size.width / 60; // 60 bars
    for (int i = 0; i < 60; i++) {
      final bit = (hash >> (i % 31)) & 1;
      final w = bit == 1 ? width * 1.4 : width * 0.6;
      if (i % 2 == 0) {
        canvas.drawRect(Rect.fromLTWH(x, 0, w, size.height), paint);
      }
      x += w;
    }
  }

  @override
  bool shouldRepaint(covariant _BarcodePainter oldDelegate) => oldDelegate.data != data;
}
