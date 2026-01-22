import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getExams, Exam } from '../services/examService';
import { FileText, Plus, Clock, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, isValid } from 'date-fns';

export default function Exams() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const data = await getExams();
      setExams(data);
    } catch (error: any) {
      toast.error('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      draft: 'Draft',
      active: 'Active',
      completed: 'Completed',
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Manage Exams</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">Create and manage online exams</p>
        </div>
        <Link
          to="/exams/create"
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Exam
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {exams.map((exam) => (
            <li key={(exam as any)._id || (exam as any).id}>
              <Link
                to={`/exams/${(exam as any)._id || (exam as any).id}/results`}
                className="block hover:bg-gray-50"
              >
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center flex-1 min-w-0">
                      <FileText className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {exam.title}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          Exam Code: <span className="font-mono">{(exam as any).examCode || (exam as any).exam_code || 'N/A'}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:space-x-4">
                      <div className="text-left sm:text-right">
                        <p className="text-xs sm:text-sm text-gray-500">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                          {(() => {
                            // Handle both camelCase and snake_case, and validate dates
                            const startTime = (exam as any).startTime || (exam as any).start_time;
                            const endTime = (exam as any).endTime || (exam as any).end_time;
                            
                            const startDate = startTime ? new Date(startTime) : null;
                            const endDate = endTime ? new Date(endTime) : null;
                            
                            if (startDate && endDate && isValid(startDate) && isValid(endDate)) {
                              return (
                                <>
                          <span className="hidden sm:inline">
                                    {format(startDate, 'MMM dd, yyyy HH:mm')} -{' '}
                                    {format(endDate, 'MMM dd, yyyy HH:mm')}
                          </span>
                          <span className="sm:hidden">
                                    {format(startDate, 'MMM dd HH:mm')} -{' '}
                                    {format(endDate, 'MMM dd HH:mm')}
                          </span>
                                </>
                              );
                            }
                            return <span>No time set</span>;
                          })()}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          {exam.questions?.length || 0} questions • {(exam as any).totalPoints || (exam as any).total_points || 0} points
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getStatusBadge(
                          exam.status
                        )}`}
                      >
                        {getStatusText(exam.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        {exams.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No exams yet. Create a new exam to get started.
          </div>
        )}
      </div>
    </div>
  );
}
