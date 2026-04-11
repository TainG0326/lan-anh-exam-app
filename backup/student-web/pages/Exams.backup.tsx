import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getExams } from '../services/examService';
import { FileText, Clock, Key, ArrowRight, Calendar, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, isValid } from 'date-fns';
import { normalizeExams } from '../utils/examUtils';

export default function Exams() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [examCode, setExamCode] = useState('');
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
      toast.error(error.response?.data?.message || 'Failed to load exams');
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
        <div className="animate-pulse text-gray-600">Loading...</div>
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Exams</h1>
        <p className="text-gray-600">Join and complete your exams</p>
      </div>

      {/* Quick Enter Code */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
            <Key className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Enter Exam Code</h2>
            <p className="text-sm text-gray-600">Have an exam code from your teacher? Enter it now!</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Enter exam code (e.g., ABC123)"
              className="w-full pl-10 pr-4 py-3 text-base font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
              value={examCode}
              onChange={(e) => setExamCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              onKeyPress={(e) => e.key === 'Enter' && handleEnterCode()}
              maxLength={10}
            />
          </div>
          <button
            onClick={handleEnterCode}
            disabled={!examCode.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <ArrowRight className="w-5 h-5 mr-2" />
            Start Exam
          </button>
        </div>
      </div>

      {/* Available Exams */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg font-semibold text-gray-900">Active Exams</h2>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
              {availableExams.length} exam{availableExams.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        {availableExams.length > 0 ? (
          <div className="p-6 space-y-4">
            {availableExams.map((exam) => {
              const endTime = exam.endTime || exam.end_time;
              const endDate = endTime ? new Date(endTime) : null;
              return (
              <Link
                  key={exam.id || exam._id}
                to={`/exams/take/${exam.examCode || exam.exam_code}`}
                  className="block p-5 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all bg-white"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{exam.title}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <span className="font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              {exam.examCode || exam.exam_code}
                          </span>
                          {endDate && isValid(endDate) && (
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              Ends {format(endDate, 'MMM dd, HH:mm')}
                            </span>
                          )}
                          <span className="flex items-center">
                            {exam.questions?.length || 0} questions • {exam.duration} minutes
                          </span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
                </div>
              </Link>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-700 font-medium mb-1">No active exams</p>
            <p className="text-sm text-gray-500">Check back later or enter an exam code above</p>
          </div>
        )}
      </div>

      {/* Upcoming Exams */}
      {upcomingExams.length > 0 && (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-700" />
                <h2 className="text-lg font-semibold text-gray-900">Upcoming Exams</h2>
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-semibold">
                {upcomingExams.length} exam{upcomingExams.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {upcomingExams.slice(0, 5).map((exam) => {
              const startTime = exam.startTime || exam.start_time;
              const startDate = startTime ? new Date(startTime) : null;
              return (
              <div
                  key={exam.id || exam._id}
                  className="p-5 rounded-lg border border-gray-200 bg-gray-50"
              >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{exam.title}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        {startDate && isValid(startDate) && (
                          <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                            Starts: {format(startDate, 'MMM dd, yyyy HH:mm')}
                          </span>
                        )}
                        <span className="flex items-center">
                          {exam.questions?.length || 0} questions • {exam.duration} minutes
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Exams */}
      {completedExams.length > 0 && (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-gray-700" />
                <h2 className="text-lg font-semibold text-gray-900">Completed Exams</h2>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                {completedExams.length} exam{completedExams.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {completedExams.slice(0, 5).map((exam) => (
              <Link
                key={exam.id || exam._id}
                to={`/exams/result/${exam.id || exam._id}`}
                className="block p-5 rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-md transition-all bg-white"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{exam.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span className="font-mono font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
                        {exam.examCode || exam.exam_code}
                      </span>
                      <span className="flex items-center">
                        {exam.questions?.length || 0} questions • {exam.duration} minutes
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
