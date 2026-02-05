import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getExams, Exam } from '../services/examService';
import { FileText, Plus, Clock, Users, MoreVertical, Edit, Eye, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, isValid } from 'date-fns';
import GlassCard from '../components/GlassCard';

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
      draft: 'bg-gray-400/30 text-gray-700 border-gray-400/30',
      active: 'bg-green-400/30 text-green-700 border-green-400/30',
      completed: 'bg-blue-400/30 text-blue-700 border-blue-400/30',
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
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-text-secondary text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tighter mb-2">
            Manage Exams
          </h1>
          <p className="text-text-secondary">
            Create and manage online exams
          </p>
        </div>
        <Link
          to="/exams/create"
          className="inline-flex items-center justify-center px-6 py-3 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-full transition-all duration-300 hover:scale-[1.02] shadow-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create New Exam
        </Link>
      </div>

      {/* Exams Table - Glass Container */}
      <GlassCard className="p-0 overflow-hidden" hover={false}>
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-white/20 bg-white/10 backdrop-blur-lg">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-text-primary">All Exams</h2>
            <span className="text-sm text-text-secondary">{exams.length} exams</span>
          </div>
        </div>

        {/* Table */}
        {exams.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/10 backdrop-blur-lg">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Exam
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Schedule
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {exams.map((exam) => (
                  <tr 
                    key={(exam as any)._id || (exam as any).id}
                    className="hover:bg-white/20 transition-all duration-300"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center mr-4">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-text-primary">
                            {exam.title}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {(exam as any).examCode || (exam as any).exam_code || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-text-primary bg-white/20 px-3 py-1 rounded-lg border border-white/20">
                        {(exam as any).examCode || (exam as any).exam_code || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-text-secondary">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>
                          {(() => {
                            const startTime = (exam as any).startTime || (exam as any).start_time;
                            const endTime = (exam as any).endTime || (exam as any).end_time;
                            
                            const startDate = startTime ? new Date(startTime) : null;
                            const endDate = endTime ? new Date(endTime) : null;
                            
                            if (startDate && endDate && isValid(startDate) && isValid(endDate)) {
                              return (
                                <span className="hidden sm:inline">
                                  {format(startDate, 'MMM dd, yyyy HH:mm')} -{' '}
                                  {format(endDate, 'MMM dd, yyyy HH:mm')}
                                </span>
                              );
                            }
                            return <span>No time set</span>;
                          })()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4 text-sm text-text-secondary">
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {exam.questions?.length || 0} questions
                        </span>
                        <span>•</span>
                        <span className="font-medium">
                          {(exam as any).totalPoints || (exam as any).total_points || 0} points
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(
                          exam.status
                        )}`}
                      >
                        {getStatusText(exam.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/exams/${(exam as any)._id || (exam as any).id}/results`}
                        className="inline-flex items-center px-4 py-2 bg-white/20 hover:bg-white/40 backdrop-blur-lg border border-white/30 rounded-xl text-sm font-semibold text-text-primary transition-all duration-300"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">No exams yet</h3>
            <p className="text-text-secondary text-sm mb-6">Create a new exam to get started</p>
            <Link
              to="/exams/create"
              className="px-6 py-3 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-full transition-all duration-300 hover:scale-[1.02]"
            >
              Create Exam
            </Link>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
