import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';

/// Campus Wallet — student module (web parity).
///
/// Loads balance from /api/wallet/balance and transactions from
/// /api/wallet/transactions. Both endpoints exist on the web backend. The
/// screen shows a navy gradient balance card, a "Top Up" button (currently a
/// toast — the actual payment gateway integration is pending), and a list of
/// recent transactions with type icons and amounts.
class StudentWallet extends StatefulWidget {
  final Map<String, dynamic> user;

  const StudentWallet({super.key, required this.user});

  @override
  State<StudentWallet> createState() => _StudentWalletState();
}

class _StudentWalletState extends State<StudentWallet> {
  Map<String, dynamic>? _balance;
  List<dynamic> _transactions = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final responses = await Future.wait<dynamic>([
        ApiClient.getObject('wallet/balance'),
        ApiClient.getObject('wallet/transactions', query: {'limit': '50'}),
      ]);
      final balance = responses[0] as Map<String, dynamic>;
      final txnWrap = responses[1] as Map<String, dynamic>;
      if (mounted) {
        _balance = balance;
        _transactions = (txnWrap['transactions'] as List<dynamic>?) ?? const [];
      }
    } catch (e) {
      if (mounted) _error = e.toString();
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _topUp() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Online top-up is coming soon. Visit the campus '
            'accounts office to add funds to your wallet.'),
        behavior: SnackBarBehavior.floating,
        backgroundColor: AppTheme.primary,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  String _fmtMoney(dynamic v) {
    final n = num.tryParse('${v ?? 0}') ?? 0;
    final sign = n < 0 ? '-' : '';
    return '$sign${n.abs().toStringAsFixed(0)}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Campus Wallet'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh, size: 20),
            onPressed: _load,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _WalletErrorView(error: _error!, onRetry: _load)
              : RefreshIndicator(
                  onRefresh: _load,
                  color: AppTheme.primary,
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                    physics: const AlwaysScrollableScrollPhysics(),
                    children: [
                      _balanceCard(),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: _topUp,
                              icon: const Icon(Icons.add_circle_outline, size: 18),
                              label: Text('Top Up', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: const Text('Auto-reload settings are coming soon.'),
                                  behavior: SnackBarBehavior.floating,
                                  backgroundColor: AppTheme.primary,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                ),
                              ),
                              icon: const Icon(Icons.autorenew, size: 18),
                              label: Text('Auto-Reload',
                                  style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      const SectionHeader(title: 'Transaction History', icon: Icons.history_rounded),
                      const SizedBox(height: 10),
                      if (_transactions.isEmpty)
                        Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: AppTheme.surface,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: AppTheme.border),
                          ),
                          child: Column(
                            children: [
                              const Icon(Icons.receipt_long_outlined, size: 36, color: AppTheme.textMuted),
                              const SizedBox(height: 10),
                              Text(
                                'No transactions yet',
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Cafeteria, print, bookshop, and transport payments will appear here.',
                                textAlign: TextAlign.center,
                                style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted),
                              ),
                            ],
                          ),
                        )
                      else
                        ..._transactions.map((t) {
                          final m = t as Map<String, dynamic>;
                          return _TransactionTile(txn: m, fmtMoney: _fmtMoney);
                        }),
                    ],
                  ),
                ),
    );
  }

  Widget _balanceCard() {
    final balance = num.tryParse('${_balance?['balance'] ?? 0}') ?? 0;
    final currency = (_balance?['currency'] ?? 'PKR').toString();
    final lastTopUp = _balance?['lastTopUp'];

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppTheme.primary, AppTheme.primaryLight],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primary.withOpacity(0.25),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.account_balance_wallet, color: Colors.white, size: 20),
              ),
              const Spacer(),
              Text(
                'ESM WALLET',
                style: GoogleFonts.inter(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: Colors.white70,
                  letterSpacing: 1.2,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Text(
            'Available Balance',
            style: GoogleFonts.inter(fontSize: 11, color: Colors.white.withOpacity(0.7)),
          ),
          const SizedBox(height: 4),
          Text(
            '$currency ${_fmtMoney(balance)}',
            style: GoogleFonts.inter(
              fontSize: 32,
              fontWeight: FontWeight.w800,
              color: Colors.white,
              letterSpacing: -0.5,
            ),
          ),
          if (lastTopUp != null) ...[
            const SizedBox(height: 8),
            Text(
              'Last top up · ${lastTopUp.toString().split('T').first}',
              style: GoogleFonts.inter(fontSize: 10, color: Colors.white.withOpacity(0.6)),
            ),
          ],
        ],
      ),
    );
  }
}

// =============================== TRANSACTION TILE ===============================

class _TransactionTile extends StatelessWidget {
  final Map<String, dynamic> txn;
  final String Function(dynamic) fmtMoney;
  const _TransactionTile({required this.txn, required this.fmtMoney});

  (IconData, Color) _typeVisual(String type) {
    switch (type) {
      case 'topup':
        return (Icons.add_circle, AppTheme.success);
      case 'cafeteria':
        return (Icons.fastfood_outlined, AppTheme.warning);
      case 'printing':
        return (Icons.print_outlined, AppTheme.info);
      case 'bookshop':
        return (Icons.menu_book_outlined, AppTheme.gold);
      case 'transport':
        return (Icons.directions_bus_outlined, AppTheme.primary);
      case 'stationery':
        return (Icons.edit_outlined, AppTheme.info);
      case 'refund':
        return (Icons.undo, AppTheme.success);
      default:
        return (Icons.receipt_outlined, AppTheme.textMuted);
    }
  }

  @override
  Widget build(BuildContext context) {
    final type = (txn['type'] ?? 'other').toString();
    final merchant = (txn['merchant'] ?? txn['description'] ?? type).toString();
    final amount = num.tryParse('${txn['amount'] ?? 0}') ?? 0;
    final date = (txn['date'] ?? '').toString();
    final time = (txn['time'] ?? '').toString();
    final reference = (txn['referenceNo'] ?? txn['reference'] ?? '').toString();
    final isCredit = amount >= 0;

    final (icon, color) = _typeVisual(type);

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        child: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: color.withOpacity(0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, size: 18, color: color),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    merchant,
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 1),
                  Text(
                    [
                      if (date.isNotEmpty) date,
                      if (time.isNotEmpty) time,
                      if (reference.isNotEmpty) '#$reference',
                    ].join(' · '),
                    style: GoogleFonts.inter(fontSize: 10, color: AppTheme.textMuted),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Text(
              '${isCredit ? '+' : '-'}${fmtMoney(amount.abs())}',
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w800,
                color: isCredit ? AppTheme.success : AppTheme.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// =============================== ERROR VIEW ===============================

class _WalletErrorView extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;
  const _WalletErrorView({required this.error, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.cloud_off, size: 48, color: AppTheme.danger),
            const SizedBox(height: 16),
            const Text(
              'Could not load wallet',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
            ),
            const SizedBox(height: 4),
            Text(
              error,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh, size: 18),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}
