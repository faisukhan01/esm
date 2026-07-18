import 'package:intl/intl.dart';
import 'package:flutter/material.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'dart:io';
import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';

class StudentInvoices extends StatefulWidget {
  final Map<String, dynamic> user;
  const StudentInvoices({super.key, required this.user});

  @override
  State<StudentInvoices> createState() => _StudentInvoicesState();
}

class _StudentInvoicesState extends State<StudentInvoices> with AutomaticKeepAliveClientMixin {
  List<dynamic> _invoices = [];
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
      final list = await ApiClient.getList('fee-invoices');
      if (mounted) setState(() { _invoices = list; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  @override
  bool get wantKeepAlive => true;

  String _fmtMoney(dynamic n) {
    final v = double.tryParse('$n') ?? 0;
    return NumberFormat('##,###').format(v.toInt());
  }

  Future<void> _downloadPdf(Map<String, dynamic> inv) async {
    try {
      final pdf = pw.Document();
      final amount = double.tryParse('${inv['amount'] ?? 0}') ?? 0;
      final status = (inv['status'] ?? 'Unpaid').toString();
      final type = inv['type'] ?? 'Tuition';
      final month = inv['month'] ?? '—';
      final year = inv['year'] ?? '';
      final studentName = widget.user['name'] ?? 'Student';
      final className = widget.user['class'] ?? '—';
      final rollNo = widget.user['rollNo'] ?? '—';

      pdf.addPage(
        pw.Page(
          pageFormat: PdfPageFormat.a4,
          build: (pw.Context context) {
            return pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                // Header
                pw.Container(
                  padding: const pw.EdgeInsets.only(bottom: 16),
                  decoration: const pw.BoxDecoration(
                    border: pw.Border(bottom: pw.BorderSide(color: PdfColors.blue900, width: 2)),
                  ),
                  child: pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    children: [
                      pw.Column(
                        crossAxisAlignment: pw.CrossAxisAlignment.start,
                        children: [
                          pw.Text('ESM', style: pw.TextStyle(fontSize: 24, fontWeight: pw.FontWeight.bold, color: PdfColors.blue900)),
                          pw.Text('Electronic School Management', style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey600)),
                        ],
                      ),
                      pw.Column(
                        crossAxisAlignment: pw.CrossAxisAlignment.end,
                        children: [
                          pw.Text('FEE INVOICE', style: pw.TextStyle(fontSize: 18, fontWeight: pw.FontWeight.bold, color: PdfColors.blue900)),
                          pw.Text('#${inv['id'] ?? '—'}', style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey600)),
                        ],
                      ),
                    ],
                  ),
                ),
                pw.SizedBox(height: 30),
                // Student info
                pw.Text('Student Details', style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold, color: PdfColors.grey800)),
                pw.SizedBox(height: 8),
                pw.Container(
                  padding: const pw.EdgeInsets.all(12),
                  decoration: pw.BoxDecoration(
                    color: PdfColors.grey100,
                    borderRadius: pw.BorderRadius.circular(8),
                  ),
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      _pdfRow('Name', studentName),
                      _pdfRow('Class', '$className'),
                      _pdfRow('Roll No', '$rollNo'),
                      _pdfRow('Month', '$month $year'),
                    ],
                  ),
                ),
                pw.SizedBox(height: 24),
                // Invoice details
                pw.Text('Invoice Summary', style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold, color: PdfColors.grey800)),
                pw.SizedBox(height: 8),
                pw.Container(
                  padding: const pw.EdgeInsets.all(12),
                  decoration: pw.BoxDecoration(
                    border: pw.Border.all(color: PdfColors.grey300),
                    borderRadius: pw.BorderRadius.circular(8),
                  ),
                  child: pw.Column(
                    children: [
                      _pdfRow('Type', type),
                      _pdfRow('Status', status),
                      pw.Divider(),
                      _pdfRow('Amount', 'PKR ${_fmtMoney(amount)}'),
                    ],
                  ),
                ),
                pw.SizedBox(height: 40),
                // Footer
                pw.Center(
                  child: pw.Text(
                    'This is a system-generated invoice from ESM.',
                    style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey500),
                  ),
                ),
              ],
            );
          },
        ),
      );

      // Save and share
      final dir = await getTemporaryDirectory();
      final file = File('${dir.path}/ESM_Invoice_${inv['id'] ?? 'invoice'}.pdf');
      await file.writeAsBytes(await pdf.save());

      await Share.shareXFiles(
        [XFile(file.path)],
        text: 'ESM Fee Invoice - $studentName',
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to generate PDF: $e'), backgroundColor: AppTheme.danger, behavior: SnackBarBehavior.floating),
        );
      }
    }
  }

  pw.Widget _pdfRow(String label, String value) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 3),
      child: pw.Row(
        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
        children: [
          pw.Text(label, style: const pw.TextStyle(fontSize: 11, color: PdfColors.grey600)),
          pw.Text(value, style: pw.TextStyle(fontSize: 11, fontWeight: pw.FontWeight.bold, color: PdfColors.blue900)),
        ],
      ),
    );
  }

  void _showInvoiceDetail(BuildContext context, Map<String, dynamic> inv) {
    final status = (inv['status'] ?? 'Unpaid').toString();
    final amount = double.tryParse('${inv['amount'] ?? 0}') ?? 0;
    final month = inv['month'] ?? '—';
    final year = inv['year'] ?? '';
    final type = inv['type'] ?? 'Tuition';
    final isPaid = status.toLowerCase() == 'paid';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Container(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppTheme.border, borderRadius: BorderRadius.circular(2))),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Container(
                  width: 48, height: 48,
                  decoration: BoxDecoration(
                    color: (isPaid ? AppTheme.success : AppTheme.danger).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(isPaid ? Icons.paid : Icons.receipt_long, size: 24, color: isPaid ? AppTheme.success : AppTheme.danger),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(type, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                      Text('$month $year', style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                    ],
                  ),
                ),
                StatusBadge(text: status, status: status.toLowerCase()),
              ],
            ),
            const SizedBox(height: 20),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: AppTheme.background, borderRadius: BorderRadius.circular(12)),
              child: Column(
                children: [
                  Text('Amount', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                  const SizedBox(height: 4),
                  Text('PKR ${_fmtMoney(amount)}', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppTheme.primary)),
                ],
              ),
            ),
            const SizedBox(height: 16),
            if (inv['id'] != null) ...[
              _DetailRow(label: 'Invoice ID', value: '${inv['id']}'),
              const SizedBox(height: 8),
            ],
            if (inv['createdAt'] != null) ...[
              _DetailRow(label: 'Issued', value: '${inv['createdAt']}'.substring(0, 10)),
              const SizedBox(height: 8),
            ],
            _DetailRow(label: 'Status', value: status),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      Navigator.pop(ctx);
                      _downloadPdf(inv);
                    },
                    icon: const Icon(Icons.download, size: 18),
                    label: const Text('PDF'),
                  ),
                ),
                const SizedBox(width: 8),
                if (!isPaid)
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.pop(ctx);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Please contact your branch to pay this invoice.'), behavior: SnackBarBehavior.floating),
                        );
                      },
                      icon: const Icon(Icons.payment, size: 18),
                      label: const Text('Pay'),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final paid = _invoices.where((i) => (i['status'] ?? '').toString().toLowerCase() == 'paid').length;
    final unpaid = _invoices.length - paid;
    final totalBilled = _invoices.fold<double>(0, (s, i) => s + (double.tryParse('${i['amount'] ?? 0}') ?? 0));
    final totalPaid = _invoices.where((i) => (i['status'] ?? '').toString().toLowerCase() == 'paid').fold<double>(0, (s, i) => s + (double.tryParse('${i['amount'] ?? 0}') ?? 0));
    final outstanding = totalBilled - totalPaid;

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Invoices'),
        actions: [IconButton(icon: const Icon(Icons.refresh, size: 20), onPressed: _load)],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _StudentErrorView(error: _error!, onRetry: _load)
              : _invoices.isEmpty
                  ? const EmptyState(
                      icon: Icons.receipt_long_outlined,
                      title: 'No invoices yet',
                      description: 'Your fee invoices will appear here once generated.',
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView(
                        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                        children: [
                          // Outstanding hero
                          Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: outstanding > 0
                                    ? [AppTheme.danger, const Color(0xFFBE123C)]
                                    : [AppTheme.success, const Color(0xFF047857)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(outstanding > 0 ? 'Outstanding' : 'All Paid', style: const TextStyle(fontSize: 12, color: Colors.white70)),
                                      const SizedBox(height: 4),
                                      Text('PKR ${_fmtMoney(outstanding)}', style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: Colors.white)),
                                      const SizedBox(height: 2),
                                      Text('$paid paid · $unpaid unpaid', style: const TextStyle(fontSize: 11, color: Colors.white70)),
                                    ],
                                  ),
                                ),
                                Icon(outstanding > 0 ? Icons.warning_amber : Icons.check_circle, size: 48, color: Colors.white70),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                          // KPI row
                          Row(
                            children: [
                              Expanded(child: KpiCard(icon: Icons.receipt, label: 'Total', value: '${_invoices.length}')),
                              const SizedBox(width: 8),
                              Expanded(child: KpiCard(icon: Icons.check_circle, label: 'Paid', value: '$paid', iconColor: AppTheme.success)),
                              const SizedBox(width: 8),
                              Expanded(child: KpiCard(icon: Icons.pending, label: 'Unpaid', value: '$unpaid', iconColor: AppTheme.danger)),
                            ],
                          ),
                          const SizedBox(height: 20),
                          const SectionHeader(title: 'All Invoices'),
                          const SizedBox(height: 8),
                          ..._invoices.map((inv) {
                            final i = inv as Map<String, dynamic>;
                            final status = (i['status'] ?? 'Unpaid').toString();
                            final amount = double.tryParse('${i['amount'] ?? 0}') ?? 0;
                            final month = i['month'] ?? '—';
                            final year = i['year'] ?? '';
                            final type = i['type'] ?? 'Tuition';
                            final isPaid = status.toLowerCase() == 'paid';
                            return Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              child: InkWell(
                                onTap: () => _showInvoiceDetail(context, i),
                                borderRadius: BorderRadius.circular(12),
                                child: Padding(
                                  padding: const EdgeInsets.all(14),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 44, height: 44,
                                        decoration: BoxDecoration(
                                          color: (isPaid ? AppTheme.success : AppTheme.danger).withOpacity(0.1),
                                          borderRadius: BorderRadius.circular(10),
                                        ),
                                        child: Icon(isPaid ? Icons.paid : Icons.receipt_long, size: 22, color: isPaid ? AppTheme.success : AppTheme.danger),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(type, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
                                            Text('$month $year', style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                                          ],
                                        ),
                                      ),
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.end,
                                        children: [
                                          Text('PKR ${_fmtMoney(amount)}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppTheme.textPrimary)),
                                          const SizedBox(height: 2),
                                          StatusBadge(text: status, status: status.toLowerCase()),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          }),
                        ],
                      ),
                    ),
    );
  }
}

class _StudentErrorView extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;
  const _StudentErrorView({required this.error, required this.onRetry});

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
            const Text('Something went wrong', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
            const SizedBox(height: 4),
            Text(error, textAlign: TextAlign.center, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
            const SizedBox(height: 16),
            ElevatedButton.icon(onPressed: onRetry, icon: const Icon(Icons.refresh, size: 18), label: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  const _DetailRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
        const Spacer(),
        Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
      ],
    );
  }
}
