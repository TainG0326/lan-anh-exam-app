import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getExams } from '../services/examService';
import { getClasses } from '../services/classService';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Users,
  BarChart3,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Activity,
  GraduationCap,
  BookOpenCheck,
  UserCheck,
  AlertCircle,
  Zap,
  Lightbulb,
  MessageSquare,
  MoreHorizontal,
  FileQuestion,
  Calculator,
  History,
  PlusCircle,
  LayoutDashboard,
  Filter,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import BookLoader from '../components/BookLoader';

interface Stats {
  totalClasses: number;
  totalExams: number;
  activeExams: number;
  totalAssignments: number;
  totalStudents: number;
  avgScore: number;
  passRate: number;
}

interface ClassData {
  id: string;
  name: string;
  class_code: string;
  student_count: number;
  exam_count: number;
  created_at: string;
}

interface ExamData {
  id: string;
  title: string;
  class_name: string;
  status: string;
  score: number | null;
  created_at: string;
}

// Animated Counter
function AnimatedCounter({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(value * easeOut));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <span>{count}</span>;
}

// Progress Bar
function ProgressBar({ value, color, delay }: { value: number; color: string; delay: number }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`
        h-1.5 rounded-full bg-gray-200 overflow-hidden
        opacity-0 transform scale-x-0
        ${isVisible ? 'opacity-100 scale-x-100' : ''}
        transition-all duration-1000 ease-out
      `}
    >
      <div
        className={`h-full rounded-full transition-all duration-1000 ease-out`}
        style={{ width: `${isVisible ? Math.min(value, 100) : 0}%`, backgroundColor: color }}
      />
    </div>
  );
}

// Stat Card - nhẹ nhàng với màu pastel
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  bgColor,
  iconBg,
  iconColor,
  delay
}: {
  title: string;
  value: number;
  subtitle?: string;
  icon: any;
  bgColor: string;
  iconBg: string;
  iconColor: string;
  delay: number;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl p-5
        ${bgColor}
        transition-all duration-500
        hover:scale-[1.01] hover:shadow-md
        opacity-0 transform translate-y-4
        ${isVisible ? 'opacity-100 translate-y-0' : ''}
      `}
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>

        <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-800"><AnimatedCounter value={value} /></span>
          {subtitle && <span className="text-gray-500 text-sm">{subtitle}</span>}
        </div>
      </div>
    </div>
  );
}

// Class Card - nhẹ nhàng
function ClassCard({
  name,
  code,
  studentCount,
  examCount,
  delay
}: {
  name: string;
  code: string;
  studentCount: number;
  examCount: number;
  delay: number;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const colors = [
    { bg: 'bg-blue-50', border: 'border-blue-100', accent: 'bg-blue-400' },
    { bg: 'bg-emerald-50', border: 'border-emerald-100', accent: 'bg-emerald-400' },
    { bg: 'bg-amber-50', border: 'border-amber-100', accent: 'bg-amber-400' },
    { bg: 'bg-rose-50', border: 'border-rose-100', accent: 'bg-rose-400' },
    { bg: 'bg-violet-50', border: 'border-violet-100', accent: 'bg-violet-400' },
  ];
  const colorIndex = Math.abs(code.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % colors.length;
  const color = colors[colorIndex];

  return (
    <Link
      to="/classes"
      className={`
        group relative overflow-hidden rounded-xl p-4
        ${color.bg} ${color.border}
        border
        transition-all duration-300
        hover:shadow-md
        opacity-0 transform translate-x-4
        ${isVisible ? 'opacity-100 translate-x-0' : ''}
      `}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${color.accent}`} />

      <div className="flex items-center justify-between mb-3 pl-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg ${color.bg} ${color.border} border flex items-center justify-center`}>
            <GraduationCap className={`h-5 w-5 ${color.accent.replace('bg-', 'text-')}`} />
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">{name}</h4>
            <p className="text-xs text-gray-500">{code}</p>
          </div>
        </div>
        <button className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-500 pl-3">
        <span className="flex items-center gap-1"><Users className="w-4 h-4" />{studentCount}</span>
        <span className="flex items-center gap-1"><FileText className="w-4 h-4" />{examCount}</span>
      </div>

      <div className="mt-3 pt-3 border-t border-black/5 flex items-center justify-end">
        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
      </div>
    </Link>
  );
}

// Recent Exam Item - nhẹ nhàng
function RecentExamItem({
  title,
  className,
  date,
  status,
  score,
  delay
}: {
  title: string;
  className: string;
  date: string;
  status: 'completed' | 'in_progress' | 'pending';
  score?: number;
  delay: number;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const statusStyles: Record<string, { bg: string; text: string; border: string }> = {
    completed: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
    in_progress: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    pending: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' }
  };
  const style = statusStyles[status] || statusStyles.pending;

  return (
    <div
      className={`
        flex items-center gap-4 p-3 rounded-xl
        hover:bg-gray-50 transition-all duration-300
        opacity-0 transform translate-x-4
        ${isVisible ? 'opacity-100 translate-x-0' : ''}
      `}
    >
      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
        <FileQuestion className="h-5 w-5 text-gray-500" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 truncate">{title}</p>
        <p className="text-xs text-gray-500">{className} • {date}</p>
      </div>

      <div className="flex items-center gap-3">
        {score !== undefined && <span className="text-sm font-semibold text-gray-700">{score}%</span>}
        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}>
          {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
        </span>
      </div>
    </div>
  );
}

// Empty State
function EmptyState({ icon: Icon, title, description, actionLabel, actionLink }: {
  icon: any;
  title: string;
  description: string;
  actionLabel?: string;
  actionLink?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-gray-400" />
      </div>
      <h3 className="text-base font-semibold text-gray-700 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mb-4">{description}</p>
      {actionLabel && actionLink && (
        <Link
          to={actionLink}
          className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

// Calendar Day
function CalendarDay({ day, isCurrentMonth, isToday, hasEvent }: {
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasEvent: boolean;
}) {
  return (
    <div
      className={`
        relative p-1.5 rounded-md text-center text-sm cursor-pointer
        transition-all duration-200
        ${!isCurrentMonth ? 'text-gray-300' : ''}
        ${isToday ? 'bg-gray-900 text-white font-medium' : 'hover:bg-gray-100'}
        ${hasEvent && !isToday ? 'after:content:"" after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-gray-400 after:rounded-full' : ''}
      `}
    >
      {day}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalClasses: 0,
    totalExams: 0,
    activeExams: 0,
    totalAssignments: 0,
    totalStudents: 0,
    avgScore: 0,
    passRate: 0,
  });
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [recentExams, setRecentExams] = useState<ExamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { loading: authLoading } = useAuth();

  // Load data function - định nghĩa TRƯỚC useEffect
  const loadData = async () => {
    console.log('Dashboard: loadData started');
    
    // Set a fallback timeout to ensure loading = false
    const timeoutId = setTimeout(() => {
      console.log('Dashboard: Timeout - setting loading=false');
      setLoading(false);
    }, 5000);
    
    try {
      console.log('Dashboard: Calling getExams...');
      const examsData = await getExams();
      console.log('Dashboard: getExams response:', examsData);

      console.log('Dashboard: Calling getClasses...');
      const classesData = await getClasses();
      console.log('Dashboard: getClasses response:', classesData);

      // Process classes
      const processedClasses = classesData.map((cls: any) => ({
        id: cls.id || cls._id,
        name: cls.name,
        class_code: cls.class_code || 'N/A',
        student_count: cls.student_count || 0,
        exam_count: 0,
        created_at: cls.created_at,
      }));
      setClasses(processedClasses);

      // Process exams
      const examCountByClass: Record<string, number> = {};
      examsData.forEach((exam: any) => {
        const classId = exam.class_id || exam.classId;
        if (classId) {
          examCountByClass[classId] = (examCountByClass[classId] || 0) + 1;
        }
      });

      const updatedClasses = processedClasses.map((cls: ClassData) => ({
        ...cls,
        exam_count: examCountByClass[cls.id] || 0,
      }));
      setClasses(updatedClasses);

      const sortedExams = [...(examsData || [])]
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map((exam: any) => ({
          id: exam.id || exam._id,
          title: exam.title,
          class_name: exam.class_name || exam.classes?.name || 'Unknown Class',
          status: exam.status || 'pending',
          score: exam.score || null,
          created_at: exam.created_at,
        }));
      setRecentExams(sortedExams);

      const activeExams = (examsData || []).filter((exam: any) => exam.status === 'active').length;
      const totalStudents = processedClasses.reduce((sum: number, cls: ClassData) => sum + (cls.student_count || 0), 0);

      setStats({
        totalClasses: processedClasses.length,
        totalExams: (examsData || []).length,
        activeExams,
        totalAssignments: 0,
        totalStudents,
        avgScore: 0,
        passRate: 0,
      });
      console.log('Dashboard: loadData completed successfully');
    } catch (error: any) {
      console.error('Dashboard: loadData failed:', error);
      // Show error toast but still render the dashboard
      toast.error('Failed to load data: ' + (error.message || 'Unknown error'));
    } finally {
      console.log('Dashboard: loadData finally - setting loading=false');
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  // Chờ auth load xong mới gọi API
  useEffect(() => {
    console.log('Dashboard: Auth loading =', authLoading);
    if (!authLoading) {
      console.log('Dashboard: Calling loadData...');
      loadData();
    }
  }, [authLoading]);

  // Timer cho clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const calendarDays = [];
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const prevMonthDays = new Date(today.getFullYear(), today.getMonth(), 0).getDate();

  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarDays.push({ day: prevMonthDays - i, isCurrentMonth: false, isToday: false, hasEvent: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ day: i, isCurrentMonth: true, isToday: i === today.getDate(), hasEvent: false });
  }
  for (let i = 1; i <= 42 - calendarDays.length; i++) {
    calendarDays.push({ day: i, isCurrentMonth: false, isToday: false, hasEvent: false });
  }

  const pendingReviews = stats.totalExams - (stats.activeExams || 0);
  const completionRate = stats.totalClasses > 0 ? Math.round((stats.activeExams / Math.max(stats.totalExams, 1)) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <BookLoader />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-semibold text-gray-800">
            Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 18 ? 'Afternoon' : 'Evening'}
          </h1>
        </div>
        <p className="text-gray-500">
          {stats.totalClasses > 0
            ? `You have ${stats.totalClasses} class${stats.totalClasses > 1 ? 'es' : ''} to manage.`
            : 'Get started by creating your first class.'}
        </p>
      </div>

      {/* Quick Stats Grid - Pastel nhẹ nhàng */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Classes"
          value={stats.totalClasses}
          icon={GraduationCap}
          bgColor="bg-blue-50"
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          delay={100}
        />
        <StatCard
          title="Active Exams"
          value={stats.activeExams}
          icon={Activity}
          bgColor="bg-amber-50"
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          delay={200}
        />
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={Users}
          bgColor="bg-emerald-50"
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          delay={300}
        />
        <StatCard
          title="Total Exams"
          value={stats.totalExams}
          icon={FileText}
          bgColor="bg-rose-50"
          iconBg="bg-rose-100"
          iconColor="text-rose-600"
          delay={400}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Classes Section */}
          <div className="rounded-2xl p-5 bg-white border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-gray-500" />
                Your Classes
              </h2>
              <Link to="/classes" className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {classes.length === 0 ? (
              <EmptyState
                icon={GraduationCap}
                title="No classes yet"
                description="Create your first class to get started."
                actionLabel="Create Class"
                actionLink="/classes"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {classes.map((cls, index) => (
                  <ClassCard
                    key={cls.id}
                    name={cls.name}
                    code={cls.class_code}
                    studentCount={cls.student_count}
                    examCount={cls.exam_count}
                    delay={500 + index * 100}
                  />
                ))}

                <Link
                  to="/classes"
                  className="group relative overflow-hidden rounded-xl p-4 bg-gray-50 border border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-100 transition-all duration-300 flex flex-col items-center justify-center gap-2 opacity-0 transform scale-95 animate-fade-in"
                  style={{ animationDelay: `${500 + classes.length * 100}ms`, animationFillMode: 'forwards' }}
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <PlusCircle className="h-5 w-5 text-gray-500" />
                  </div>
                  <span className="text-sm text-gray-500">Add Class</span>
                </Link>
              </div>
            )}
          </div>

          {/* Recent Exams */}
          <div className="rounded-2xl p-5 bg-white border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <FileQuestion className="w-5 h-5 text-gray-500" />
                Recent Exams
              </h2>
              <div className="flex items-center gap-2">
                <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <Filter className="w-4 h-4 text-gray-400" />
                </button>
                <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <RefreshCw className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {recentExams.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No exams yet"
                description="Create your first exam to assess students."
                actionLabel="Create Exam"
                actionLink="/exams/create"
              />
            ) : (
              <div className="space-y-1">
                {recentExams.map((exam, index) => (
                  <RecentExamItem
                    key={exam.id}
                    title={exam.title}
                    className={exam.class_name}
                    date={new Date(exam.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    status={exam.status as 'completed' | 'in_progress' | 'pending'}
                    score={exam.score || undefined}
                    delay={900 + index * 80}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Calendar */}
          <div className="rounded-xl p-4 bg-white border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">
                {currentTime.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
            </div>

            <div className="grid grid-cols-7 gap-0.5 text-center text-xs mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-1 text-gray-400 font-medium">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {calendarDays.map((day, index) => (
                <CalendarDay key={index} {...day} />
              ))}
            </div>
          </div>

          {/* Overview */}
          <div className="rounded-xl p-4 bg-white border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-gray-500" />
                Overview
              </h3>
            </div>

            <div className="space-y-4">
              {stats.totalExams > 0 ? (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-gray-500">Completion</span>
                      <span className="text-sm font-medium text-gray-700">{completionRate}%</span>
                    </div>
                    <ProgressBar value={completionRate} color="#3b82f6" delay={1700} />
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-400 text-center py-3">No data yet</p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5" />
                <p className="text-xs text-gray-500">
                  {stats.totalClasses === 0
                    ? 'Create a class to start tracking.'
                    : 'Add exams to see more metrics.'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl p-4 bg-gray-50 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-gray-500" />
              Quick Actions
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { icon: PlusCircle, label: 'New Exam', action: '/exams/create' },
                { icon: Calculator, label: 'Gradebook', action: '/gradebook' },
                { icon: History, label: 'Results', action: '/exams' },
                { icon: MessageSquare, label: 'Messages', action: '/notifications' },
              ].map((item, index) => (
                <Link
                  key={item.label}
                  to={item.action}
                  className="p-3 rounded-lg bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm flex flex-col items-center gap-2 transition-all duration-200 opacity-0 transform translate-y-2 animate-fade-in"
                  style={{ animationDelay: `${2000 + index * 100}ms`, animationFillMode: 'forwards' }}
                >
                  <item.icon className="w-5 h-5 text-gray-600" />
                  <span className="text-xs text-gray-600">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Stats Row */}
      {stats.totalClasses > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg p-4 bg-white border border-gray-200 shadow-sm opacity-0 transform translate-y-3 animate-fade-in" style={{ animationDelay: '2200ms', animationFillMode: 'forwards' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <BookOpenCheck className="w-4 h-4 text-blue-500" />
              </div>
            </div>
            <p className="text-xl font-semibold text-gray-800">{stats.totalExams}</p>
            <p className="text-xs text-gray-500">Exams</p>
          </div>

          <div className="rounded-lg p-4 bg-white border border-gray-200 shadow-sm opacity-0 transform translate-y-3 animate-fade-in" style={{ animationDelay: '2300ms', animationFillMode: 'forwards' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
            <p className="text-xl font-semibold text-gray-800">{stats.totalStudents}</p>
            <p className="text-xs text-gray-500">Students</p>
          </div>

          <div className="rounded-lg p-4 bg-white border border-gray-200 shadow-sm opacity-0 transform translate-y-3 animate-fade-in" style={{ animationDelay: '2400ms', animationFillMode: 'forwards' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-amber-500" />
              </div>
            </div>
            <p className="text-xl font-semibold text-gray-800">{pendingReviews}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </div>

          <div className="rounded-lg p-4 bg-white border border-gray-200 shadow-sm opacity-0 transform translate-y-3 animate-fade-in" style={{ animationDelay: '2500ms', animationFillMode: 'forwards' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                <FileText className="w-4 h-4 text-violet-500" />
              </div>
            </div>
            <p className="text-xl font-semibold text-gray-800">{stats.totalAssignments}</p>
            <p className="text-xs text-gray-500">Assignments</p>
          </div>
        </div>
      )}
    </div>
  );
}
