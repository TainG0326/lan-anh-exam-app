import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getExams } from '../services/examService';
import { getAssignments } from '../services/assignmentService';
import { 
  FileText, 
  Clock, 
  TrendingUp, 
  BookOpen,
  FileEdit,
  ClipboardList,
  Headphones,
  ChevronRight,
  LogIn,
  Timer,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const [exams, setExams] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [examCode, setExamCode] = useState('');
  const navigate = useNavigate();

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
        setExams(examsData.value);
      } else {
        console.error('Error loading exams:', examsData.reason);
        setExams([]);
      }
      
      if (assignmentsData.status === 'fulfilled') {
        setAssignments(assignmentsData.value);
      } else {
        console.error('Error loading assignments:', assignmentsData.reason);
        setAssignments([]);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
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
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-emerald-400 h-12 w-12"></div>
        </div>
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

  // Removed mock progress data - will use real data from API when available

  const getTimeUntil = (date: string) => {
    try {
      const targetDate = new Date(date);
      const diff = targetDate.getTime() - now.getTime();
      if (diff < 0) return 'Past due';
      if (diff < 3600000) return `In ${Math.floor(diff / 60000)} minutes`;
      if (diff < 86400000) return `In ${Math.floor(diff / 3600000)} hours`;
      return formatDistanceToNow(targetDate, { addSuffix: true });
    } catch {
      return format(new Date(date), 'MMM dd, yyyy HH:mm');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Breadcrumbs */}
      <div className="flex flex-wrap gap-2 text-sm">
        <Link to="/" className="text-slate-500 font-medium hover:text-emerald-600 transition-colors">
          Home
        </Link>
        <span className="text-slate-500 font-medium">/</span>
        <span className="text-slate-800 font-medium">Dashboard</span>
      </div>

      {/* Welcome Section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-slate-800 text-2xl sm:text-3xl font-bold leading-tight tracking-tight">
          Welcome back, {localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}').name?.split(' ')[0] || 'Student' : 'Student'}
        </h1>
        <p className="text-slate-500 text-sm sm:text-base font-normal">
          Here is your daily overview for {format(new Date(), 'EEEE, MMM dd')}.
        </p>
      </div>


      {/* Two Column Layout: Assignments & Exams */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Upcoming Assignments (Takes 2/3 width on large screens) */}
        <section className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-slate-800 text-xl font-bold leading-tight">Upcoming Assignments</h2>
            <Link to="/assignments" className="text-primary-hover text-sm font-semibold hover:underline">
              View All
            </Link>
          </div>
          <div className="bg-card-light rounded-2xl border border-gray-50 overflow-hidden shadow-sm">
            {/* List Header */}
            <div className="hidden sm:grid grid-cols-12 gap-4 px-4 sm:px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <div className="col-span-6">Assignment Name</div>
              <div className="col-span-3">Due Date</div>
              <div className="col-span-3 text-right">Action</div>
            </div>
            {/* List Items */}
            {upcomingAssignments.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {upcomingAssignments.map((assignment, index) => {
                  const dueDate = new Date(assignment.dueDate || assignment.due_date);
                  const isUrgent = dueDate.getTime() - now.getTime() < 86400000; // Less than 24 hours
                  const icons = [FileEdit, ClipboardList, Headphones];
                  const Icon = icons[index % icons.length];
                  const iconColors = [
                    { bg: 'bg-orange-50', text: 'text-orange-600' },
                    { bg: 'bg-blue-50', text: 'text-blue-600' },
                    { bg: 'bg-emerald-50', text: 'text-emerald-600' },
                  ];
                  const iconColor = iconColors[index % iconColors.length];

                  return (
                    <div
                      key={assignment._id || assignment.id}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-4 px-4 sm:px-6 py-4 items-center hover:bg-gray-50 transition-colors"
                    >
                      <div className="col-span-6 flex gap-4 items-center">
                        <div className={`size-10 rounded-lg ${iconColor.bg} ${iconColor.text} flex items-center justify-center shrink-0`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-slate-800 font-medium truncate">{assignment.title}</span>
                          <span className="text-xs text-slate-500 truncate">
                            {assignment.description || 'Assignment'}
                          </span>
                        </div>
                      </div>
                      <div className="col-span-3 flex items-center gap-2">
                        {isUrgent && <Calendar className="w-4 h-4 text-red-500" />}
                        <span className={`text-sm font-medium ${isUrgent ? 'text-red-600' : 'text-slate-800'}`}>
                          {isUrgent ? `Tomorrow, ${format(dueDate, 'HH:mm')}` : format(dueDate, 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <div className="col-span-3 flex justify-end">
                        <Link
                          to={`/assignments/${assignment._id || assignment.id}`}
                          className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium hover:bg-gray-50 transition"
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No upcoming assignments</p>
              </div>
            )}
          </div>
        </section>

        {/* Upcoming Exams & Quick Join (Takes 1/3 width) */}
        <section className="flex flex-col gap-6">
          {/* Quick Join Card */}
          <div className="bg-card-light rounded-2xl border border-gray-50 p-5">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-gray-900 font-bold">
                <LogIn className="w-5 h-5" />
                <h3>Join Live Exam</h3>
              </div>
              <p className="text-sm text-slate-600">
                Enter the 6-digit code provided by your teacher to join an exam session immediately.
              </p>
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary text-gray-900"
                  placeholder="Code"
                  value={examCode}
                  onChange={(e) => setExamCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  maxLength={10}
                  onKeyPress={(e) => e.key === 'Enter' && handleJoinExam()}
                />
                <button
                  onClick={handleJoinExam}
                  disabled={!examCode.trim()}
                  className="bg-primary hover:bg-primary-hover text-gray-900 rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Join
                </button>
              </div>
            </div>
          </div>

          {/* Exam List */}
          <div className="flex flex-col gap-4">
            <h2 className="text-slate-800 text-xl font-bold leading-tight">Upcoming Exams</h2>
            <div className="flex flex-col gap-3">
              {activeExams.length > 0 && (
                <Link
                  to={`/exams/take/${activeExams[0].examCode || activeExams[0].exam_code}`}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-card-light border-2 border-red-200 shadow-sm relative overflow-hidden group hover:border-red-400 transition-all"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                  <div className="flex flex-col flex-1 gap-1">
                    <span className="text-xs font-bold text-red-500 uppercase tracking-wide">Starting Soon</span>
                    <h4 className="text-slate-800 font-bold text-base">{activeExams[0].title}</h4>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                      <Clock className="w-4 h-4" />
                      <span>Starts in {getTimeUntil(activeExams[0].startTime || activeExams[0].start_time)}</span>
                    </div>
                  </div>
                  <button className="self-center bg-gray-100 p-2 rounded-lg text-slate-700 hover:bg-gray-200 transition">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </Link>
              )}

              {upcomingExams.slice(0, 2).map((exam) => (
                <Link
                  key={exam._id || exam.id}
                  to={`/exams/take/${exam.examCode || exam.exam_code}`}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-card-light border border-gray-50 shadow-sm relative overflow-hidden hover:border-primary/30 transition-all"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-300"></div>
                  <div className="flex flex-col flex-1 gap-1">
                    <span className="text-xs font-bold text-primary-hover uppercase tracking-wide">
                      {format(new Date(exam.startTime || exam.start_time), 'MMM dd, HH:mm')}
                    </span>
                    <h4 className="text-slate-800 font-bold text-base">{exam.title}</h4>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                      <Timer className="w-4 h-4" />
                      <span>{exam.duration || 45} minutes</span>
                    </div>
                  </div>
                  <button className="self-center bg-gray-100 p-2 rounded-lg text-slate-700 hover:bg-gray-200 transition">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </Link>
              ))}

              {upcomingExams.length === 0 && activeExams.length === 0 && (
                <div className="p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No upcoming exams</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
