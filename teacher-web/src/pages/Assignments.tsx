import { useEffect, useState } from 'react';
import { getAssignments } from '../services/assignmentService';
import { BookOpen, Clock, FileText, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, isValid } from 'date-fns';
import GlassCard from '../components/GlassCard';
import BookLoader from '../components/BookLoader';
import CreateAssignmentModal from './CreateAssignmentModal';

export default function Assignments() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      const data = await getAssignments();
      setAssignments(data || []);
    } catch (error: any) {
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <BookLoader />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tighter mb-2">
            Manage Assignments
          </h1>
          <p className="text-text-secondary">
            Create and grade assignments for students
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="group relative inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
        >
          <span className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition-opacity duration-300" />
          <BookOpen className="w-5 h-5 relative z-10" />
          <span className="relative z-10">Create Assignment</span>
        </button>
      </div>

      {/* Assignments Table - Glass Container */}
      <GlassCard className="p-0 overflow-hidden" hover={false}>
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-white/20 bg-white/10 backdrop-blur-lg">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-text-primary">All Assignments</h2>
            <span className="text-sm text-text-secondary">{assignments.length} assignments</span>
          </div>
        </div>

        {/* Table */}
        {assignments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/10 backdrop-blur-lg">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Assignment
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {assignments.map((assignment) => {
                  const dueDate = assignment.dueDate || assignment.due_date;
                  const due = dueDate ? new Date(dueDate) : null;
                  return (
                    <tr 
                      key={assignment._id || assignment.id}
                      className="hover:bg-white/20 transition-all duration-300"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center mr-4">
                            <BookOpen className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-text-primary">
                              {assignment.title}
                            </p>
                            <p className="text-xs text-text-secondary">
                              ID: {assignment._id || assignment.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-text-primary bg-white/20 px-3 py-1 rounded-lg border border-white/20">
                          {assignment.classId?.name || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4 text-sm text-text-secondary">
                          <span className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {assignment.questions?.length || 0} questions
                          </span>
                          <span>•</span>
                          <span className="font-medium">
                            {assignment.totalPoints || 0} points
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-text-secondary">
                          <Clock className="w-4 h-4 mr-2" />
                          {due && isValid(due) ? (
                            <span>{format(due, 'MMM dd, yyyy HH:mm')}</span>
                          ) : (
                            <span>No due date</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="inline-flex items-center px-4 py-2 bg-white/20 hover:bg-white/40 backdrop-blur-lg border border-white/30 rounded-xl text-sm font-semibold text-text-primary transition-all duration-300">
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">No assignments yet</h3>
            <p className="text-text-secondary text-sm">No assignment data available</p>
          </div>
        )}
      </GlassCard>

      {/* Create Assignment Modal */}
      <CreateAssignmentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadAssignments}
      />
    </div>
  );
}
