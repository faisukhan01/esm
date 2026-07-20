import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shared_widgets.dart';

/// E-Learning Hub — teacher module (mobile parity with student screen).
///
/// Same backend as students:
///   GET /api/e-learning/videos
///   GET /api/e-learning/papers
///   GET /api/e-learning/mcq-sets
///   GET /api/e-learning/progress?userId={id}
///
/// For the teacher this is a content-browsing view — they can preview the
/// same resources their students see. Four tabs mirror the student hub:
///   1. Video Library
///   2. Past Papers
///   3. MCQ Practice
///   4. My Progress
///
/// No fake data — every tab shows a real loading → empty/loaded state.
class TeacherELearning extends StatefulWidget {
  final Map<String, dynamic> user;

  const TeacherELearning({super.key, required this.user});

  @override
  State<TeacherELearning> createState() => _TeacherELearningState();
}

class _TeacherELearningState extends State<TeacherELearning>
    with SingleTickerProviderStateMixin {
  late final TabController _tabCtrl = TabController(length: 4, vsync: this);

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('E-Learning Hub'),
        bottom: TabBar(
          controller: _tabCtrl,
          isScrollable: true,
          labelColor: AppTheme.primary,
          unselectedLabelColor: AppTheme.textMuted,
          indicatorColor: AppTheme.primary,
          indicatorSize: TabBarIndicatorSize.label,
          labelStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700),
          unselectedLabelStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500),
          tabs: const [
            Tab(text: 'Videos'),
            Tab(text: 'Past Papers'),
            Tab(text: 'MCQ Practice'),
            Tab(text: 'My Progress'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabCtrl,
        children: [
          _VideoLibraryTab(user: widget.user),
          _PastPapersTab(user: widget.user),
          _McqPracticeTab(user: widget.user),
          _MyProgressTab(user: widget.user),
        ],
      ),
    );
  }
}

// =============================== VIDEO LIBRARY ===============================

class _VideoLibraryTab extends StatefulWidget {
  final Map<String, dynamic> user;
  const _VideoLibraryTab({required this.user});

  @override
  State<_VideoLibraryTab> createState() => _VideoLibraryTabState();
}

class _VideoLibraryTabState extends State<_VideoLibraryTab> {
  List<dynamic> _videos = [];
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
      final list = await ApiClient.getList('e-learning/videos', query: {
        if (widget.user['branchId'] != null)
          'branchId': widget.user['branchId'].toString(),
      });
      if (mounted) setState(() => _videos = list);
    } catch (e) {
      // Endpoint may not exist yet — fall back to an honest empty state.
      if (mounted) setState(() { _videos = []; _error = e.toString(); });
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_videos.isEmpty) {
      return RefreshIndicator(
        onRefresh: _load,
        color: AppTheme.primary,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: const [
            SizedBox(height: 80),
            EmptyState(
              icon: Icons.video_library_outlined,
              title: 'No videos yet',
              description: 'Recorded lectures and tutorial videos uploaded to '
                  'your branch will appear here. Pull down to refresh.',
            ),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _load,
      color: AppTheme.primary,
      child: GridView.builder(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 10,
          mainAxisSpacing: 10,
          childAspectRatio: 0.8,
        ),
        itemCount: _videos.length,
        itemBuilder: (context, i) {
          final v = _videos[i] as Map<String, dynamic>;
          return _VideoTile(video: v);
        },
      ),
    );
  }
}

class _VideoTile extends StatelessWidget {
  final Map<String, dynamic> video;
  const _VideoTile({required this.video});

  @override
  Widget build(BuildContext context) {
    final title = (video['title'] ?? 'Untitled').toString();
    final subject = (video['subject'] ?? video['courseName'] ?? '—').toString();
    final duration = (video['duration'] ?? '').toString();

    return Container(
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.border),
        boxShadow: AppTheme.shadowSm,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppTheme.primary, AppTheme.primaryLight],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.vertical(top: Radius.circular(14)),
              ),
              child: Stack(
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.play_arrow, color: Colors.white, size: 24),
                    ),
                  ),
                  if (duration.isNotEmpty)
                    Positioned(
                      bottom: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.black54,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          duration,
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  subject,
                  style: GoogleFonts.inter(fontSize: 10, color: AppTheme.textMuted),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// =============================== PAST PAPERS ===============================

class _PastPapersTab extends StatefulWidget {
  final Map<String, dynamic> user;
  const _PastPapersTab({required this.user});

  @override
  State<_PastPapersTab> createState() => _PastPapersTabState();
}

class _PastPapersTabState extends State<_PastPapersTab> {
  List<dynamic> _papers = [];
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
      final list = await ApiClient.getList('e-learning/papers', query: {
        if (widget.user['branchId'] != null)
          'branchId': widget.user['branchId'].toString(),
      });
      if (mounted) setState(() => _papers = list);
    } catch (e) {
      if (mounted) setState(() { _papers = []; _error = e.toString(); });
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_papers.isEmpty) {
      return RefreshIndicator(
        onRefresh: _load,
        color: AppTheme.primary,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: const [
            SizedBox(height: 80),
            EmptyState(
              icon: Icons.menu_book_outlined,
              title: 'No past papers yet',
              description: 'Previous years\' exam papers will appear here when '
                  'your institute uploads them. Pull down to refresh.',
            ),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _load,
      color: AppTheme.primary,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        itemCount: _papers.length,
        itemBuilder: (context, i) {
          final p = _papers[i] as Map<String, dynamic>;
          return ListRowCard(
            title: (p['title'] ?? 'Past Paper').toString(),
            subtitle: (p['subject'] ?? p['year'] ?? '').toString(),
            icon: Icons.menu_book,
            iconColor: AppTheme.gold,
            onTap: () {},
          );
        },
      ),
    );
  }
}

// =============================== MCQ PRACTICE ===============================

class _McqPracticeTab extends StatefulWidget {
  final Map<String, dynamic> user;
  const _McqPracticeTab({required this.user});

  @override
  State<_McqPracticeTab> createState() => _McqPracticeTabState();
}

class _McqPracticeTabState extends State<_McqPracticeTab> {
  List<dynamic> _sets = [];
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
      final list = await ApiClient.getList('e-learning/mcq-sets', query: {
        if (widget.user['branchId'] != null)
          'branchId': widget.user['branchId'].toString(),
      });
      if (mounted) setState(() => _sets = list);
    } catch (e) {
      if (mounted) setState(() { _sets = []; _error = e.toString(); });
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_sets.isEmpty) {
      return RefreshIndicator(
        onRefresh: _load,
        color: AppTheme.primary,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: const [
            SizedBox(height: 80),
            EmptyState(
              icon: Icons.quiz_outlined,
              title: 'No practice sets yet',
              description: 'Multiple-choice practice sets will appear here when '
                  'your institute publishes them. Pull down to refresh.',
            ),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _load,
      color: AppTheme.primary,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        itemCount: _sets.length,
        itemBuilder: (context, i) {
          final s = _sets[i] as Map<String, dynamic>;
          return ListRowCard(
            title: (s['title'] ?? 'Practice Set').toString(),
            subtitle: '${s['questionCount'] ?? '—'} questions',
            icon: Icons.quiz,
            iconColor: AppTheme.info,
            onTap: () {},
          );
        },
      ),
    );
  }
}

// =============================== MY PROGRESS ===============================

class _MyProgressTab extends StatefulWidget {
  final Map<String, dynamic> user;
  const _MyProgressTab({required this.user});

  @override
  State<_MyProgressTab> createState() => _MyProgressTabState();
}

class _MyProgressTabState extends State<_MyProgressTab> {
  Map<String, dynamic>? _progress;
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
      // The progress endpoint is keyed by the caller's userId — teacher or
      // student alike. The teacher's own browsing/usage stats surface here.
      final obj = await ApiClient.getObject('e-learning/progress', query: {
        if (widget.user['id'] != null) 'userId': widget.user['id'].toString(),
      });
      if (mounted) setState(() => _progress = obj);
    } catch (e) {
      if (mounted) setState(() { _progress = {}; _error = e.toString(); });
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    final isEmpty = _progress == null || _progress!.isEmpty;
    if (isEmpty) {
      return RefreshIndicator(
        onRefresh: _load,
        color: AppTheme.primary,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: const [
            SizedBox(height: 80),
            EmptyState(
              icon: Icons.insights_outlined,
              title: 'No progress data yet',
              description: 'Watch a video, attempt a past paper, or complete an '
                  'MCQ practice set — your activity will be tracked here.',
            ),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _load,
      color: AppTheme.primary,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        children: [
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 1.3,
            children: [
              PremiumStatCard(
                icon: Icons.play_circle_outline,
                label: 'Videos Watched',
                value: '${_progress!['videosWatched'] ?? 0}',
                color: AppTheme.primary,
              ),
              PremiumStatCard(
                icon: Icons.assignment_outlined,
                label: 'Papers Attempted',
                value: '${_progress!['papersAttempted'] ?? 0}',
                color: AppTheme.gold,
              ),
              PremiumStatCard(
                icon: Icons.quiz_outlined,
                label: 'MCQs Practised',
                value: '${_progress!['mcqsPractised'] ?? 0}',
                color: AppTheme.info,
              ),
              PremiumStatCard(
                icon: Icons.local_fire_department_outlined,
                label: 'Day Streak',
                value: '${_progress!['streak'] ?? 0}',
                color: AppTheme.warning,
              ),
            ],
          ),
        ],
      ),
    );
  }
}
