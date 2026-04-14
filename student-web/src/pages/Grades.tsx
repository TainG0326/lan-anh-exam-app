import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getExams } from '../services/examService';
import { getAssignments } from '../services/assignmentService';
import { getStudentAttempt } from '../services/examService';
import { useLanguage } from '../context/LanguageContext';
import { GraduationCap, FileText, TrendingUp, Award, Calendar, ArrowRight, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, isValid } from 'date-fns';

interface GradeItem {
  id: string;
  type: 'exam' | 'assignment';
  title: string;
  score: number;
  totalPoints: number;
  percentage: number;
  date: string;
  status: 'completed' | 'graded';
}

export default function Grades() {
  const { t } = useLanguage();
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    averageScore: 0,
    totalItems: 0,
    completedExams: 0,
    completedAssignments: 0,
  });

  useEffect(() => {
    loadGrades();
  }, []);

  const loadGrades = async () => {
    try {
      const [exams, assignments] = await Promise.all([
        getExams(),
        getAssignments(),
      ]);

      const gradeItems: GradeItem[] = [];

      // Process completed exams
      const completedExams = exams.filter((exam: any) => {
        const endTime = exam.endTime || exam.end_time;
        if (!endTime) return false;
        const end = new Date(endTime);
        return isValid(end) && (end < new Date() || exam.status === 'completed');
      });

      for (const exam of completedExams) {
        try {
          const attemptData = await getStudentAttempt(exam.id || exam._id || '');
          if (attemptData.attempt && attemptData.attempt.submittedAt) {
            const totalPoints = exam.totalPoints || exam.total_points || 0;
            const score = attemptData.attempt.score !== undefined && attemptData.attempt.score !== null 
              ? attemptData.attempt.score 
              : 0;
            const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;

            gradeItems.push({
              id: exam.id || exam._id || '',
              type: 'exam',
              title: exam.title,
              score,
              totalPoints,
              percentage,
              date: attemptData.attempt.submittedAt || attemptData.attempt.submitted_at || '',
              status: 'graded',
            });
          }
        } catch (error) {
          // Skip if attempt not found
        }
      }

      // Process assignments with scores
      const gradedAssignments = assignments.filter((assignment) => {
        return assignment.submitted && assignment.score !== undefined;
      });

      for (const assignment of gradedAssignments) {
        const totalPoints = assignment.totalPoints || 0;
        const score = assignment.score || 0;
        const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
        const dateValue = (assignment as any).submittedAt || (assignment as any).submitted_at || assignment.dueDate || '';

        gradeItems.push({
          id: assignment.id || assignment._id || '',
          type: 'assignment',
          title: assignment.title,
          score,
          totalPoints,
          percentage,
          date: dateValue,
          status: 'graded',
        });
      }

      gradeItems.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });

      setGrades(gradeItems);

      const totalScore = gradeItems.reduce((sum, item) => sum + item.percentage, 0);
      const averageScore = gradeItems.length > 0 ? totalScore / gradeItems.length : 0;

      setStats({
        averageScore: Math.round(averageScore * 10) / 10,
        totalItems: gradeItems.length,
        completedExams: gradeItems.filter((item) => item.type === 'exam').length,
        completedAssignments: gradeItems.filter((item) => item.type === 'assignment').length,
      });
    } catch {
      toast.error(t('toast.loadGradesFailed') || 'Failed to load grades');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return { text: 'text-success', bg: 'bg-success/10', border: 'border-success/20' };
    if (percentage >= 80) return { text: 'text-info', bg: 'bg-info/10', border: 'border-info/20' };
    if (percentage >= 70) return { text: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' };
    if (percentage >= 60) return { text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
    return { text: 'text-error', bg: 'bg-error/10', border: 'border-error/20' };
  };

  const getGradeLabel = (percentage: number) => {
    if (percentage >= 90) return t('grades.rank.excellent') || 'Excellent';
    if (percentage >= 80) return t('grades.rank.good') || 'Good';
    if (percentage >= 70) return t('grades.rank.prettyGood') || 'Pretty Good';
    if (percentage >= 60) return t('grades.rank.average') || 'Average';
    return t('grades.rank.weak') || 'Needs Improvement';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-10 w-10 border-3 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-1">
          {t('grades.title') || 'Grades'}
        </h1>
        <p className="text-text-secondary text-sm">
          {t('grades.subtitle') || 'View your exam and assignment scores'}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <p className="text-xs text-text-secondary mb-1">{t('grades.averageScore') || 'Average Score'}</p>
          <p className="text-2xl font-bold text-text-primary">
            {stats.averageScore > 0 ? `${stats.averageScore}%` : 'N/A'}
          </p>
        </div>

        <div className="card p-5">
          <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-info" />
          </div>
          <p className="text-xs text-text-secondary mb-1">{t('common.total') || 'Total Graded'}</p>
          <p className="text-2xl font-bold text-text-primary">{stats.totalItems}</p>
        </div>

        <div className="card p-5">
          <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mb-4">
            <GraduationCap className="w-6 h-6 text-success" />
          </div>
          <p className="text-xs text-text-secondary mb-1">{t('grades.totalExams') || 'Exams'}</p>
          <p className="text-2xl font-bold text-text-primary">{stats.completedExams}</p>
        </div>

        <div className="card p-5">
          <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center mb-4">
            <Award className="w-6 h-6 text-warning" />
          </div>
          <p className="text-xs text-text-secondary mb-1">{t('grades.totalAssignments') || 'Assignments'}</p>
          <p className="text-2xl font-bold text-text-primary">{stats.completedAssignments}</p>
        </div>
      </div>

      {/* Grades List */}
      <div>
        <h2 className="text-lg font-bold text-text-primary mb-4">
          {t('grades.yourGrades') || 'All Grades'}
        </h2>
        
        {grades.length > 0 ? (
          <div className="card overflow-hidden">
            <div className="divide-y divide-border">
              {grades.map((grade, index) => {
                const date = grade.date ? new Date(grade.date) : null;
                const colors = getGradeColor(grade.percentage);
                const iconColors = [
                  { bg: 'bg-warning/10', text: 'text-warning' },
                  { bg: 'bg-info/10', text: 'text-info' },
                  { bg: 'bg-success/10', text: 'text-success' },
                  { bg: 'bg-primary/10', text: 'text-primary' },
                ];
                const iconColor = iconColors[index % iconColors.length];
                
                return (
                  <div
                    key={grade.id}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-background transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-lg ${iconColor.bg} ${iconColor.text} flex items-center justify-center shrink-0`}>
                      {grade.type === 'exam' ? (
                        <FileText className="w-5 h-5" />
                      ) : (
                        <CheckCircle className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-text-primary truncate">
                          {grade.title}
                        </p>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>
                          {getGradeLabel(grade.percentage)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-text-secondary">
                        {date && isValid(date) && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(date, 'MMM dd, yyyy')}
                          </span>
                        )}
                        <span>{grade.type === 'exam' ? t('grades.exam') || 'Exam' : t('grades.assignment') || 'Assignment'}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-text-primary">
                        {grade.score}/{grade.totalPoints}
                      </p>
                      <p className={`text-sm font-semibold ${colors.text}`}>
                        {grade.percentage.toFixed(1)}%
                      </p>
                    </div>
                    <Link
                      to={grade.type === 'exam' ? `/exams/result/${grade.id}` : `/assignments`}
                      className="p-2 rounded-lg hover:bg-background transition-colors shrink-0"
                    >
                      <ArrowRight className="w-4 h-4 text-text-muted" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-primary" />
            </div>
            <p className="text-text-primary font-semibold mb-1">
              {t('grades.noGrades') || 'No grades yet'}
            </p>
            <p className="text-sm text-text-secondary">
              {t('grades.noGradesDesc') || 'Your grades will appear here after completing exams and assignments'}
            </p>
            <div className="flex gap-3 justify-center mt-6">
              <Link
                to="/exams"
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
              >
                {t('dashboard.viewExams') || 'View Exams'}
              </Link>
              <Link
                to="/assignments"
                className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-text-primary hover:bg-background transition-colors"
              >
                {t('dashboard.viewAssignments') || 'View Assignments'}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
