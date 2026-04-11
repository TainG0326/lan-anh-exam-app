import { useEffect, useState } from 'react';
import { Search, Download, Users, Award, ChevronDown, Edit3, FileText, BookOpen, ChevronRight } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GradeAnalytics from './GradeAnalytics';
import GradeEntryModal from './GradeEntryModal';
import BookLoader from '../components/BookLoader';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';
import {
  getGradesByClass,
  getClassStatistics,
  updateExamScore,
  updateAssignmentScore,
  StudentGrade,
  ClassStatistics,
} from '../services/gradeService';
import { getClasses, Class } from '../services/classService';

interface GradeDetail {
  type: 'exam' | 'assignment';
  id: string;
  title: string;
  studentName: string;
  maxScore: number;
  initialScore: number;
  initialFeedback: string;
}

export default function Grades() {
  const { t } = useLanguage();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [stats, setStats] = useState<ClassStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [editingGrade, setEditingGrade] = useState<GradeDetail | null>(null);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadClasses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadGrades();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass]);

  const loadClasses = async () => {
    try {
      const data = await getClasses();
      setClasses(data);
      if (data.length > 0 && !selectedClass) {
        setSelectedClass(data[0]?.id || '');
      }
    } catch (error) {
      toast.error(t('toast.loadDataFailed'));
    } finally {
      setLoading(false);
    }
  };

  const loadGrades = async () => {
    try {
      setLoading(true);
      const [gradesData, statsData] = await Promise.all([
        getGradesByClass(selectedClass),
        getClassStatistics(selectedClass),
      ]);
      setGrades(gradesData);
      setStats(statsData);
    } catch (error) {
      toast.error(t('toast.loadDataFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGrade = async (score: number, feedback: string) => {
    if (!editingGrade) return;

    setSaving(true);
    try {
      if (editingGrade.type === 'exam') {
        await updateExamScore(editingGrade.id, score);
      } else {
        await updateAssignmentScore(editingGrade.id, score, feedback);
      }
      toast.success(t('grades.grading.savedSuccess'));
      setEditingGrade(null);
      loadGrades();
    } catch (error) {
      toast.error(t('grades.grading.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const exportToCSV = () => {
    if (grades.length === 0) return;

    const selectedClassData = classes.find(c => c.id === selectedClass);
    const headers = ['STT', 'Học sinh', 'Email', 'Số bài thi', 'Số bài tập', 'Điểm TB', 'Xếp loại'];
    const rows = grades.map((g, index) => [
      index + 1,
      g.studentName,
      g.studentEmail,
      g.totalExams,
      g.totalAssignments,
      g.averageScore.toFixed(1),
      getRankLabel(g.averageScore),
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${t('grades.exportFileName')}-${selectedClassData?.name || 'class'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('grades.exportSuccess'));
  };

  const getRankLabel = (score: number) => {
    if (score >= 9) return t('grades.rank.excellent');
    if (score >= 8) return t('grades.rank.good');
    if (score >= 7) return t('grades.rank.prettyGood');
    if (score >= 6) return t('grades.rank.average');
    if (score >= 5) return t('grades.rank.weak');
    return t('grades.rank.poor');
  };

  const getRankColor = (score: number) => {
    if (score >= 9) return 'bg-green-100 text-green-700 border-green-200';
    if (score >= 8) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (score >= 7) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (score >= 6) return 'bg-amber-100 text-amber-700 border-amber-200';
    if (score >= 5) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  const filteredGrades = grades.filter(g =>
    g.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.studentEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedClassData = classes.find(c => c.id === selectedClass);

  if (loading && !grades.length) {
    return (
      <div className="flex items-center justify-center py-20">
        <BookLoader />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tighter">
            {t('grades.title')}
          </h1>
          <p className="text-text-secondary mt-1">
            {t('grades.subtitle')}
          </p>
        </div>
        <button
          onClick={exportToCSV}
          disabled={!grades.length}
          className="group relative inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-border hover:border-primary/50 text-text-primary font-semibold rounded-2xl shadow-soft hover:shadow-primary/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          {t('grades.exportCSV')}
        </button>
      </div>

      {/* Class Selector */}
      <GlassCard className="p-4">
        <div className="relative">
          <button
            onClick={() => setShowClassDropdown(!showClassDropdown)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white border border-border rounded-2xl hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              <span className="font-medium text-text-primary">
                {selectedClassData?.name || t('grades.selectClass')}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-text-secondary transition-transform ${showClassDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showClassDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border rounded-2xl shadow-xl z-20 overflow-hidden animate-fade-in-down">
              {classes.length > 0 ? (
                classes.map(cls => (
                  <button
                    key={cls.id}
                    onClick={() => {
                      setSelectedClass(cls.id || '');
                      setShowClassDropdown(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-primary/5 transition-colors text-left ${
                      cls.id === selectedClass ? 'bg-primary/10 border-l-4 border-primary' : ''
                    }`}
                  >
                    <Users className="w-4 h-4 text-text-secondary" />
                    <span className="font-medium text-text-primary">{cls.name}</span>
                    <span className="text-xs text-text-secondary ml-auto">
                      {cls.grade} - Grade {cls.level}
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-text-secondary">
                  {t('grades.noClasses')}
                </div>
              )}
            </div>
          )}
        </div>
      </GlassCard>

      {/* Statistics */}
      {stats && <GradeAnalytics stats={stats} t={t} />}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('grades.searchPlaceholder')}
          className="w-full pl-12 pr-4 py-3 bg-white border border-border rounded-2xl text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        />
      </div>

      {/* Grades Table */}
      <GlassCard className="p-0 overflow-hidden" hover={false}>
        <div className="px-6 py-4 border-b border-white/20 bg-white/10 backdrop-blur-lg">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-text-primary">{t('grades.studentList')}</h2>
            <span className="text-sm text-text-secondary">{filteredGrades.length} {t('grades.students')}</span>
          </div>
        </div>

        {filteredGrades.length > 0 ? (
          <div className="divide-y divide-white/10">
            {filteredGrades.map((grade) => (
              <div key={grade.studentId}>
                {/* Student Row */}
                <div
                  className="px-6 py-4 hover:bg-white/10 transition-all cursor-pointer"
                  onClick={() => setExpandedStudent(expandedStudent === grade.studentId ? null : grade.studentId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-500/20 to-pink-500/10 flex items-center justify-center">
                        <span className="text-rose-600 font-bold text-lg">
                          {grade.studentName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-text-primary">{grade.studentName}</p>
                        <p className="text-sm text-text-secondary">{grade.studentEmail}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="hidden md:flex items-center gap-6 text-sm">
                        <span className="flex items-center gap-1 text-text-secondary">
                          <FileText className="w-4 h-4" />
                          {grade.totalExams} {t('grades.exams')}
                        </span>
                        <span className="flex items-center gap-1 text-text-secondary">
                          <BookOpen className="w-4 h-4" />
                          {grade.totalAssignments} {t('grades.assignments')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center px-3 py-1.5 bg-primary/10 text-primary font-bold rounded-xl">
                          <Award className="w-4 h-4 mr-1" />
                          {grade.averageScore > 0 ? grade.averageScore.toFixed(1) : '—'}
                        </span>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getRankColor(grade.averageScore)}`}>
                          {grade.averageScore > 0 ? getRankLabel(grade.averageScore) : '—'}
                        </span>
                        <ChevronRight className={`w-5 h-5 text-text-secondary transition-transform ${expandedStudent === grade.studentId ? 'rotate-90' : ''}`} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedStudent === grade.studentId && (
                  <div className="px-6 pb-4 animate-fade-in">
                    <div className="ml-16 p-4 bg-white/5 rounded-2xl space-y-4">
                      {/* Exam Scores */}
                      {grade.examScores.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-text-secondary mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            {t('grades.examScores')}
                          </h4>
                          <div className="space-y-2">
                            {grade.examScores.map((exam, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-white/10 rounded-xl">
                                <span className="text-text-primary text-sm">{exam.examTitle}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-text-primary">
                                    {exam.score} / {exam.totalPoints}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingGrade({
                                        type: 'exam',
                                        id: exam.examId,
                                        title: exam.examTitle,
                                        studentName: grade.studentName,
                                        maxScore: exam.totalPoints,
                                        initialScore: exam.score,
                                        initialFeedback: '',
                                      });
                                    }}
                                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                    title={t('grades.editScore')}
                                  >
                                    <Edit3 className="w-4 h-4 text-text-secondary" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Assignment Scores */}
                      {grade.assignmentScores.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-text-secondary mb-2 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            {t('grades.assignmentScores')}
                          </h4>
                          <div className="space-y-2">
                            {grade.assignmentScores.map((assignment, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-white/10 rounded-xl">
                                <span className="text-text-primary text-sm">{assignment.assignmentTitle}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-text-primary">
                                    {assignment.score} / {assignment.totalPoints}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingGrade({
                                        type: 'assignment',
                                        id: assignment.assignmentId,
                                        title: assignment.assignmentTitle,
                                        studentName: grade.studentName,
                                        maxScore: assignment.totalPoints,
                                        initialScore: assignment.score,
                                        initialFeedback: '',
                                      });
                                    }}
                                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                    title={t('grades.editScore')}
                                  >
                                    <Edit3 className="w-4 h-4 text-text-secondary" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* No scores */}
                      {grade.examScores.length === 0 && grade.assignmentScores.length === 0 && (
                        <p className="text-center text-text-secondary text-sm py-4">
                          {t('grades.noScores')}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <Award className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-text-primary mb-2">
              {selectedClass ? t('grades.noData') : t('grades.selectClassFirst')}
            </h3>
            <p className="text-text-secondary text-sm">
              {selectedClass ? t('grades.noDataDesc') : t('grades.selectClassFirstDesc')}
            </p>
          </div>
        )}
      </GlassCard>

      {/* Grade Entry Modal */}
      {editingGrade && (
        <GradeEntryModal
          isOpen={true}
          onClose={() => setEditingGrade(null)}
          onSave={handleSaveGrade}
          type={editingGrade.type}
          title={editingGrade.title}
          studentName={editingGrade.studentName}
          maxScore={editingGrade.maxScore}
          initialScore={editingGrade.initialScore}
          initialFeedback={editingGrade.initialFeedback}
          loading={saving}
          t={t}
        />
      )}
    </div>
  );
}
