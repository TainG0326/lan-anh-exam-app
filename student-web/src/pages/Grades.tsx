import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getExams } from '../services/examService';
import { getAssignments } from '../services/assignmentService';
import { getStudentAttempt } from '../services/examService';
import { GraduationCap, FileText, TrendingUp, Award, Calendar, ArrowRight, CheckCircle, Clock } from 'lucide-react';
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
      const completedExams = exams.filter((exam) => {
        const endTime = exam.endTime || exam.end_time;
        if (!endTime) return false;
        const end = new Date(endTime);
        return isValid(end) && (end < new Date() || exam.status === 'completed');
      });

      // Get exam attempts and scores
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

        gradeItems.push({
          id: assignment.id || assignment._id || '',
          type: 'assignment',
          title: assignment.title,
          score,
          totalPoints,
          percentage,
          date: assignment.submittedAt || assignment.submitted_at || assignment.dueDate || '',
          status: 'graded',
        });
      }

      // Sort by date (newest first)
      gradeItems.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });

      setGrades(gradeItems);

      // Calculate statistics
      const totalScore = gradeItems.reduce((sum, item) => sum + item.percentage, 0);
      const averageScore = gradeItems.length > 0 ? totalScore / gradeItems.length : 0;

      setStats({
        averageScore: Math.round(averageScore * 10) / 10,
        totalItems: gradeItems.length,
        completedExams: gradeItems.filter((item) => item.type === 'exam').length,
        completedAssignments: gradeItems.filter((item) => item.type === 'assignment').length,
      });
    } catch (error: any) {
      toast.error('Failed to load grades');
      console.error('Error loading grades:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (percentage >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (percentage >= 70) return 'text-amber-600 bg-amber-50 border-amber-200';
    if (percentage >= 60) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getGradeLabel = (percentage: number) => {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 80) return 'Good';
    if (percentage >= 70) return 'Satisfactory';
    if (percentage >= 60) return 'Pass';
    return 'Needs Improvement';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Breadcrumbs */}
      <div className="flex flex-wrap gap-2 text-sm">
        <Link to="/" className="text-slate-500 font-medium hover:text-emerald-600 transition-colors">
          Home
        </Link>
        <span className="text-slate-500 font-medium">/</span>
        <span className="text-slate-800 font-medium">Grades</span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-slate-800 text-2xl sm:text-3xl font-bold leading-tight tracking-tight">
          Grades
        </h1>
        <p className="text-slate-500 text-sm sm:text-base font-normal">
          View your exam and assignment scores
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-card-light rounded-2xl border border-gray-50 shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="size-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mb-1 font-medium">Average Score</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
            {stats.averageScore > 0 ? `${stats.averageScore}%` : 'N/A'}
          </p>
        </div>

        <div className="bg-card-light rounded-2xl border border-gray-50 shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="size-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mb-1 font-medium">Total Graded</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">{stats.totalItems}</p>
        </div>

        <div className="bg-card-light rounded-2xl border border-gray-50 shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="size-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mb-1 font-medium">Exams Completed</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">{stats.completedExams}</p>
        </div>

        <div className="bg-card-light rounded-2xl border border-gray-50 shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="size-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-sm">
              <Award className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mb-1 font-medium">Assignments Graded</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">{stats.completedAssignments}</p>
        </div>
      </div>

      {/* Grades List */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-slate-800 text-xl font-bold leading-tight">All Grades</h2>
        </div>
        <div className="bg-card-light rounded-2xl border border-gray-50 overflow-hidden shadow-sm">
          {grades.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {grades.map((grade, index) => {
                const date = grade.date ? new Date(grade.date) : null;
                const iconColors = [
                  { bg: 'bg-orange-50', text: 'text-orange-600' },
                  { bg: 'bg-blue-50', text: 'text-blue-600' },
                  { bg: 'bg-emerald-50', text: 'text-emerald-600' },
                  { bg: 'bg-purple-50', text: 'text-purple-600' },
                ];
                const iconColor = iconColors[index % iconColors.length];
                
                return (
                  <Link
                    key={grade.id}
                    to={grade.type === 'exam' ? `/exams/result/${grade.id}` : `/assignments/${grade.id}`}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-4 px-4 sm:px-6 py-4 items-center hover:bg-gray-50 transition-colors"
                  >
                    <div className="col-span-6 sm:col-span-7 flex gap-4 items-center">
                      <div className={`size-10 rounded-lg ${iconColor.bg} ${iconColor.text} flex items-center justify-center shrink-0`}>
                        {grade.type === 'exam' ? (
                          <FileText className="w-5 h-5" />
                        ) : (
                          <CheckCircle className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-slate-800 font-medium truncate">{grade.title}</span>
                          <span
                            className={`px-2 py-0.5 text-xs font-semibold rounded-full border shrink-0 ${getGradeColor(
                              grade.percentage
                            )}`}
                          >
                            {getGradeLabel(grade.percentage)}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {date && isValid(date)
                              ? format(date, 'MMM dd, yyyy')
                              : 'Date not available'}
                          </span>
                          <span className="font-mono text-xs">
                            {grade.type === 'exam' ? 'Exam' : 'Assignment'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-6 sm:col-span-5 flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-left sm:text-right">
                        <div className="text-lg sm:text-xl font-bold text-slate-800 mb-0.5">
                          {grade.score} / {grade.totalPoints}
                        </div>
                        <div className="text-xs sm:text-sm font-semibold text-slate-500">
                          {grade.percentage.toFixed(1)}%
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-slate-700 font-medium mb-1">No grades yet</p>
              <p className="text-sm text-slate-500 mb-6">
                Your grades will appear here after you complete exams and assignments
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/exams"
                  className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium hover:bg-gray-50 transition"
                >
                  View Exams
                </Link>
                <Link
                  to="/assignments"
                  className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium hover:bg-gray-50 transition"
                >
                  View Assignments
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
