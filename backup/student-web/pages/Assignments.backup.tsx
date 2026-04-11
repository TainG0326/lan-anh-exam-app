import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAssignments } from '../services/assignmentService';
import { FileText, Calendar, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, isValid } from 'date-fns';

export default function Assignments() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      const data = await getAssignments();
      setAssignments(data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
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
  const upcomingAssignments = assignments.filter((assignment) => {
    const dueDate = assignment.dueDate || assignment.due_date;
    if (!dueDate) return false;
    const due = new Date(dueDate);
    return isValid(due) && due > now;
  });

  const completedAssignments = assignments.filter((assignment) => {
    const dueDate = assignment.dueDate || assignment.due_date;
    if (!dueDate) return assignment.submitted;
    const due = new Date(dueDate);
    return isValid(due) && (due < now || assignment.submitted);
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Assignments</h1>
        <p className="text-gray-600">Complete and submit your assignments</p>
      </div>

      {/* Upcoming Assignments */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Assignments</h2>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
              {upcomingAssignments.length} assignment{upcomingAssignments.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        {upcomingAssignments.length > 0 ? (
          <div className="p-6 space-y-4">
            {upcomingAssignments.map((assignment) => {
              const dueDate = assignment.dueDate || assignment.due_date;
              const due = dueDate ? new Date(dueDate) : null;
              return (
                <Link
                  key={assignment.id || assignment._id}
                  to={`/assignments/${assignment.id || assignment._id}`}
                  className="block p-5 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all bg-white"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{assignment.title}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          {due && isValid(due) && (
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              Due: {format(due, 'MMM dd, yyyy')}
                            </span>
                          )}
                          <span className="flex items-center">
                            {assignment.totalPoints || 0} points
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      {assignment.submitted ? (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                          Submitted
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">
                          Pending
                        </span>
                      )}
                    </div>
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
            <p className="text-gray-700 font-medium mb-1">No upcoming assignments</p>
            <p className="text-sm text-gray-500">Check back later for new assignments</p>
          </div>
        )}
      </div>

      {/* Completed Assignments */}
      {completedAssignments.length > 0 && (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-gray-700" />
                <h2 className="text-lg font-semibold text-gray-900">Completed Assignments</h2>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                {completedAssignments.length} assignment{completedAssignments.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {completedAssignments.slice(0, 5).map((assignment) => (
              <Link
                key={assignment.id || assignment._id}
                to={`/assignments/${assignment.id || assignment._id}`}
                className="block p-5 rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-md transition-all bg-white"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{assignment.title}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        {assignment.score !== undefined && (
                          <span className="font-semibold text-green-600">
                            Score: {assignment.score}/{assignment.totalPoints || 0}
                          </span>
                        )}
                        {assignment.submitted && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                            Submitted
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
