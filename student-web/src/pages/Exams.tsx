import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getExams } from '../services/examService';
import { useLanguage } from '../context/LanguageContext';
import { FileText, Clock, Key, ArrowRight, Calendar, CheckCircle, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, isValid } from 'date-fns';
import { normalizeExams } from '../utils/examUtils';

export default function Exams() {
  const { t } = useLanguage();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [examCode, setExamCode] = useState('');
  const [filter, setFilter] = useState<'all' | 'available' | 'upcoming' | 'completed'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const data = await getExams();
      const normalized = normalizeExams(data);
      setExams(normalized);
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('toast.loadExamsFailed') || 'Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterCode = () => {
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
  const availableExams = exams.filter((exam) => {
    const startTime = exam.startTime || exam.start_time;
    const endTime = exam.endTime || exam.end_time;
    if (!startTime || !endTime) return false;
    const start = new Date(startTime);
    const end = new Date(endTime);
    return (
      exam.status === 'active' &&
      isValid(start) &&
      isValid(end) &&
      start <= now &&
      end >= now
    );
  });

  const upcomingExams = exams.filter((exam) => {
    const startTime = exam.startTime || exam.start_time;
    if (!startTime) return false;
    const start = new Date(startTime);
    return isValid(start) && start > now && (exam.status === 'draft' || !exam.status);
  });

  const completedExams = exams.filter((exam) => {
    const endTime = exam.endTime || exam.end_time;
    if (!endTime) return false;
    const end = new Date(endTime);
    return isValid(end) && (end < now || exam.status === 'completed');
  });

  const displayedExams = filter === 'all' ? exams 
    : filter === 'available' ? availableExams 
    : filter === 'upcoming' ? upcomingExams 
    : completedExams;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-1">
          {t('exams.title') || 'Exams'}
        </h1>
        <p className="text-text-secondary text-sm">
          {t('exams.myExams') || 'Join and complete your exams'}
        </p>
      </div>

      {/* Quick Enter Code */}
      <div className="card p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Key className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">
              {t('exams.examCode') || 'Enter Exam Code'}
            </h2>
            <p className="text-sm text-text-secondary">
              Nhập mã đề thi để tham gia thi ngay
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder={t('exams.examCode') || 'Exam code (e.g., ABC123)'}
            className="flex-1 rounded-xl border border-border bg-background-light px-4 py-3 text-base font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            value={examCode}
            onChange={(e) => setExamCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            onKeyPress={(e) => e.key === 'Enter' && handleEnterCode()}
            maxLength={10}
          />
          <button
            onClick={handleEnterCode}
            disabled={!examCode.trim()}
            className="rounded-xl bg-primary hover:bg-primary-hover text-white px-6 py-3 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {t('exams.startExam') || 'Start Exam'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            filter === 'all' 
              ? 'bg-primary text-white' 
              : 'bg-white border border-border text-text-secondary hover:bg-background'
          }`}
        >
          {t('common.total') || 'All'} ({exams.length})
        </button>
        <button
          onClick={() => setFilter('available')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            filter === 'available' 
              ? 'bg-primary text-white' 
              : 'bg-white border border-border text-text-secondary hover:bg-background'
          }`}
        >
          {t('common.active') || 'Active'} ({availableExams.length})
        </button>
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            filter === 'upcoming' 
              ? 'bg-primary text-white' 
              : 'bg-white border border-border text-text-secondary hover:bg-background'
          }`}
        >
          {t('exams.upcoming') || 'Upcoming'} ({upcomingExams.length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            filter === 'completed' 
              ? 'bg-primary text-white' 
              : 'bg-white border border-border text-text-secondary hover:bg-background'
          }`}
        >
          {t('common.completed') || 'Completed'} ({completedExams.length})
        </button>
      </div>

      {/* Exams List */}
      {displayedExams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedExams.map((exam) => {
            const startTime = exam.startTime || exam.start_time;
            const endTime = exam.endTime || exam.end_time;
            const startDate = startTime ? new Date(startTime) : null;
            const endDate = endTime ? new Date(endTime) : null;
            const isAvailable = availableExams.some(e => e.id === exam.id);
            const isCompleted = completedExams.some(e => e.id === exam.id);
            
            return (
              <div
                key={exam.id || exam._id}
                className={`card p-5 hover:shadow-soft-lg transition-shadow ${
                  isAvailable ? 'border-l-4 border-error' : 
                  isCompleted ? 'border-l-4 border-success' : 
                  'border-l-4 border-warning'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    isAvailable ? 'bg-error/10' :
                    isCompleted ? 'bg-success/10' :
                    'bg-warning/10'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6 text-success" />
                    ) : (
                      <FileText className={`w-6 h-6 ${isAvailable ? 'text-error' : 'text-warning'}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                        isAvailable ? 'bg-error/10 text-error' :
                        isCompleted ? 'bg-success/10 text-success' :
                        'bg-warning/10 text-warning'
                      }`}>
                        {isAvailable ? (t('common.active') || 'ACTIVE') :
                         isCompleted ? (t('common.completed') || 'COMPLETED') :
                         (t('exams.upcoming') || 'UPCOMING')}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-text-primary truncate">
                      {exam.title}
                    </h3>
                    <p className="text-xs text-text-secondary font-mono mt-1">
                      {exam.examCode || exam.exam_code}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-text-secondary">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {exam.duration || 45} min
                      </span>
                      {exam.questions?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5" />
                          {exam.questions.length} {t('common.questions') || 'questions'}
                        </span>
                      )}
                    </div>
                    {startDate && isValid(startDate) && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-text-secondary">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(startDate, 'MMM dd, HH:mm')}
                      </div>
                    )}
                  </div>
                  {isAvailable ? (
                    <Link
                      to={`/exams/take/${exam.examCode || exam.exam_code}`}
                      className="shrink-0 rounded-xl bg-primary hover:bg-primary-hover text-white px-4 py-2 text-sm font-semibold transition-colors"
                    >
                      {t('exams.takeExam') || 'Take Exam'}
                    </Link>
                  ) : isCompleted ? (
                    <Link
                      to={`/exams/result/${exam.id || exam._id}`}
                      className="shrink-0 rounded-xl border border-border hover:bg-background px-4 py-2 text-sm font-semibold transition-colors"
                    >
                      {t('exams.viewResults') || 'View Results'}
                    </Link>
                  ) : (
                    <span className="shrink-0 text-sm text-text-muted">
                      {t('exams.notStarted') || 'Not Started'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <p className="text-text-primary font-semibold mb-1">
            {filter === 'all' ? t('exams.empty') || 'No exams yet' :
             filter === 'available' ? 'No active exams' :
             filter === 'upcoming' ? 'No upcoming exams' :
             'No completed exams'}
          </p>
          <p className="text-sm text-text-secondary">
            {filter === 'all' ? t('exams.emptyDesc') || 'Join a class to see exams' :
             'Enter an exam code above to get started'}
          </p>
        </div>
      )}
    </div>
  );
}
