import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getExams } from '../services/examService';
import { getAssignments } from '../services/assignmentService';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  FileText, 
  Clock,
  ClipboardList,
  LogIn,
  Timer,
  Calendar,
  ChevronRight,
  BookOpen,
  GraduationCap,
  Bell,
  Users,
  Download,
  Monitor,
  ShieldCheck,
} from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [exams, setExams] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [examCode, setExamCode] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [examsData, assignmentsData] = await Promise.allSettled([
        getExams(),
        getAssignments(),
      ]);
      
      if (examsData.status === 'fulfilled') {
        setExams(examsData.value || []);
      } else if (examsData.status === 'rejected') {
        const err = examsData.reason;
        if (err?.response?.status === 403) {
          console.warn('[Dashboard] 403 on getExams - user may not have a class_id');
        }
        setExams([]);
      }

      if (assignmentsData.status === 'fulfilled') {
        setAssignments(assignmentsData.value || []);
      } else {
        setAssignments([]);
      }
    } catch {
      setExams([]);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinExam = () => {
    if (examCode.trim()) {
      navigate(`/exams/take/${examCode.trim().toUpperCase()}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-10 w-10 border-3 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const now = new Date();
  const upcomingExams = exams.filter(
    (exam) => new Date(exam.startTime || exam.start_time) > now && (exam.status === 'draft' || !exam.status)
  );
  const activeExams = exams.filter(
    (exam) => exam.status === 'active' || 
    (new Date(exam.startTime || exam.start_time) <= now && new Date(exam.endTime || exam.end_time) >= now)
  );

  const upcomingAssignments = assignments
    .filter((a) => new Date(a.dueDate || a.due_date) > now)
    .sort((a, b) => new Date(a.dueDate || a.due_date).getTime() - new Date(b.dueDate || b.due_date).getTime())
    .slice(0, 5);

  const getTimeUntil = (date: string) => {
    try {
      const targetDate = new Date(date);
      const diff = targetDate.getTime() - now.getTime();
      if (diff < 0) return 'Quá hạn';
      if (diff < 3600000) return `Còn ${Math.floor(diff / 60000)} phút`;
      if (diff < 86400000) return `Còn ${Math.floor(diff / 3600000)} giờ`;
      return `${Math.ceil(diff / 86400000)} ngày nữa`;
    } catch {
      return format(new Date(date), 'MMM dd, yyyy HH:mm');
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.goodMorning') || 'Good Morning';
    if (hour < 18) return t('dashboard.goodAfternoon') || 'Good Afternoon';
    return t('dashboard.goodEvening') || 'Good Evening';
  };

  const studentName = user?.name?.split(' ')[0] || 'Student';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-text-primary text-2xl sm:text-3xl font-bold leading-tight tracking-tight">
          {getGreeting()}, {studentName}!
        </h1>
        <p className="text-text-secondary text-sm sm:text-base font-normal">
          {t('dashboard.welcome') || 'Welcome back'} - {format(new Date(), 'EEEE, MMMM dd, yyyy')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-white shadow-lg p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{assignments.length}</p>
            <p className="text-sm text-text-secondary">{t('dashboard.pendingAssignments') || 'Pending Assignments'}</p>
          </div>
        </div>
        <div className="card bg-white shadow-lg p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-warning" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{upcomingExams.length + activeExams.length}</p>
            <p className="text-sm text-text-secondary">{t('dashboard.completedExams') || 'Upcoming Exams'}</p>
          </div>
        </div>
        <div className="card bg-white shadow-lg p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center">
            <Bell className="w-6 h-6 text-info" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{activeExams.length}</p>
            <p className="text-sm text-text-secondary">{t('common.active') || 'Active'}</p>
          </div>
        </div>
      </div>

      {/* Software Download Card - Sage Green */}
      <div className="card bg-gradient-to-br from-[#5F8D78] to-[#3D6B5A] rounded-2xl shadow-lg overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-5 p-5 sm:p-6">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <Monitor className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-white font-bold text-lg mb-1">Tải phần mềm thi</h3>
            <p className="text-emerald-100 text-sm leading-relaxed">
              Kỳ thi chính thức phải được thực hiện qua Desktop App để đảm bảo bảo mật và chống gian lận.
            </p>
          </div>
          <a
            href="https://drive.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-2 bg-white hover:bg-emerald-50 text-[#3D6B5A] font-bold px-5 py-2.5 rounded-xl transition-colors shadow-lg"
          >
            <Download className="w-4 h-4" />
            Tải về
          </a>
        </div>
        <div className="bg-[#3D6B5A]/50 px-5 sm:px-6 py-2.5 flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
          <p className="text-xs text-emerald-200">
            Secure exam environment with anti-cheat protection
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          to="/join-class"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-button hover:bg-primary-hover transition-colors"
        >
          <Users className="w-4 h-4" />
          {t('dashboard.joinNewClass') || 'Join New Class'}
        </Link>
        <Link
          to="/grades"
          className="inline-flex items-center gap-2 rounded-xl bg-white border border-border px-5 py-2.5 text-sm font-semibold text-text-primary hover:bg-background transition-colors"
        >
          <GraduationCap className="w-4 h-4" />
          {t('dashboard.viewGrades') || 'View Grades'}
        </Link>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Assignments (2/3 width) */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-text-primary">
              {t('dashboard.yourAssignments') || 'Your Assignments'}
            </h2>
            <Link to="/assignments" className="text-sm text-primary font-semibold hover:underline">
              {t('common.viewAll') || 'View All'}
            </Link>
          </div>
          <div className="card bg-white shadow-lg overflow-hidden">
            {upcomingAssignments.length > 0 ? (
              <div className="divide-y divide-border">
                {upcomingAssignments.map((assignment, index) => {
                  const dueDate = new Date(assignment.dueDate || assignment.due_date);
                  const isUrgent = dueDate.getTime() - now.getTime() < 86400000;
                  const icons = [FileText, ClipboardList, Calendar];
                  const Icon = icons[index % icons.length];
                  const iconColors = [
                    { bg: 'bg-warning/10', text: 'text-warning' },
                    { bg: 'bg-info/10', text: 'text-info' },
                    { bg: 'bg-primary/10', text: 'text-primary' },
                  ];
                  const iconColor = iconColors[index % iconColors.length];

                  return (
                    <div
                      key={assignment._id || assignment.id}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-background transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-lg ${iconColor.bg} ${iconColor.text} flex items-center justify-center shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">
                          {assignment.title}
                        </p>
                        <p className="text-xs text-text-secondary truncate">
                          {assignment.className || assignment.class_name || 'Assignment'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-xs font-semibold ${isUrgent ? 'text-error' : 'text-text-secondary'}`}>
                          {isUrgent ? 'Gấp!' : format(dueDate, 'MMM dd')}
                        </p>
                        <p className="text-xs text-text-muted">
                          {isUrgent ? getTimeUntil(assignment.dueDate || assignment.due_date) : format(dueDate, 'HH:mm')}
                        </p>
                      </div>
                      <Link
                        to="/assignments"
                        className="p-2 rounded-lg hover:bg-background transition-colors shrink-0"
                      >
                        <ChevronRight className="w-4 h-4 text-text-muted" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-10 text-center">
                <ClipboardList className="w-12 h-12 text-text-muted mx-auto mb-3" />
                <p className="text-text-secondary font-medium">{t('assignments.empty') || 'No assignments yet'}</p>
                <p className="text-sm text-text-muted mt-1">{t('assignments.emptyDesc') || 'Join a class to see assignments'}</p>
              </div>
            )}
          </div>
        </section>

        {/* Upcoming Exams & Quick Join (1/3 width) */}
        <section className="flex flex-col gap-6">
          {/* Quick Join Card */}
          <div className="card bg-white shadow-lg p-5">
            <div className="flex items-center gap-2 text-text-primary font-bold mb-3">
              <LogIn className="w-5 h-5 text-primary" />
              <h3>{t('exams.takeExam') || 'Join Live Exam'}</h3>
            </div>
            <p className="text-sm text-text-secondary mb-3">
              Nhập mã đề thi để tham gia thi ngay
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 rounded-xl border border-border bg-background-light px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                placeholder={t('exams.examCode') || 'Exam code'}
                value={examCode}
                onChange={(e) => setExamCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                maxLength={10}
                onKeyPress={(e) => e.key === 'Enter' && handleJoinExam()}
              />
              <button
                onClick={handleJoinExam}
                disabled={!examCode.trim()}
                className="rounded-xl bg-primary hover:bg-primary-hover text-white px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('common.join') || 'Join'}
              </button>
            </div>
          </div>

          {/* Exam List */}
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-text-primary">
              {t('dashboard.upcomingExams') || 'Upcoming Exams'}
            </h2>
            <div className="flex flex-col gap-3">
              {activeExams.length > 0 && activeExams.slice(0, 1).map((exam) => (
                <div
                  key={exam._id || exam.id}
                  className="card bg-white shadow-lg p-4 border-l-4 border-error"
                >
                  <span className="inline-flex items-center rounded-full bg-error/10 px-2 py-0.5 text-xs font-bold text-error mb-2">
                    {t('common.active') || 'ACTIVE'}
                  </span>
                  <h4 className="text-sm font-bold text-text-primary">{exam.title}</h4>
                  <div className="flex items-center gap-3 mt-2 text-xs text-text-secondary">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {exam.duration || 45} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Timer className="w-3.5 h-3.5" />
                      {getTimeUntil(exam.startTime || exam.start_time)}
                    </span>
                  </div>
                  <Link
                    to={`/exams/take/${exam.examCode || exam.exam_code}`}
                    className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
                  >
                    {t('exams.takeExam') || 'Take Exam'}
                  </Link>
                </div>
              ))}

              {upcomingExams.slice(0, 2).map((exam) => (
                <div
                  key={exam._id || exam.id}
                  className="card bg-white shadow-lg p-4 border-l-4 border-primary"
                >
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary mb-2">
                    {t('exams.upcoming') || 'UPCOMING'}
                  </span>
                  <h4 className="text-sm font-bold text-text-primary">{exam.title}</h4>
                  <div className="flex items-center gap-3 mt-2 text-xs text-text-secondary">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(exam.startTime || exam.start_time), 'MMM dd, HH:mm')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Timer className="w-3.5 h-3.5" />
                      {exam.duration || 45} min
                    </span>
                  </div>
                </div>
              ))}

              {upcomingExams.length === 0 && activeExams.length === 0 && (
                <div className="card bg-white shadow-lg p-8 text-center">
                  <FileText className="w-10 h-10 text-text-muted mx-auto mb-3" />
                  <p className="text-text-secondary font-medium">{t('exams.empty') || 'No exams yet'}</p>
                  <p className="text-sm text-text-muted mt-1">{t('exams.emptyDesc') || 'Join a class to see exams'}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
