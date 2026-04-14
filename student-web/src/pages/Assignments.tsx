import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAssignments } from '../services/assignmentService';
import { useLanguage } from '../context/LanguageContext';
import { FileText, Calendar, CheckCircle, Clock, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, isValid } from 'date-fns';

export default function Assignments() {
  const { t } = useLanguage();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      const data = await getAssignments();
      setAssignments(data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('toast.loadAssignmentsFailed') || 'Failed to load assignments');
    } finally {
      setLoading(false);
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

  const displayedAssignments = filter === 'all' ? assignments 
    : filter === 'upcoming' ? upcomingAssignments 
    : completedAssignments;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-1">
          {t('assignments.title') || 'Assignments'}
        </h1>
        <p className="text-text-secondary text-sm">
          {t('assignments.myAssignments') || 'View and manage your assignments'}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            filter === 'all' 
              ? 'bg-primary text-white' 
              : 'bg-white border border-border text-text-secondary hover:bg-background'
          }`}
        >
          {t('common.total') || 'All'} ({assignments.length})
        </button>
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            filter === 'upcoming' 
              ? 'bg-primary text-white' 
              : 'bg-white border border-border text-text-secondary hover:bg-background'
          }`}
        >
          {t('common.pending') || 'Pending'} ({upcomingAssignments.length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            filter === 'completed' 
              ? 'bg-primary text-white' 
              : 'bg-white border border-border text-text-secondary hover:bg-background'
          }`}
        >
          {t('common.completed') || 'Completed'} ({completedAssignments.length})
        </button>
      </div>

      {/* Assignments List */}
      {displayedAssignments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedAssignments.map((assignment) => {
            const dueDate = assignment.dueDate || assignment.due_date;
            const due = dueDate ? new Date(dueDate) : null;
            const isPast = due && due < now;
            const isCompleted = isPast || assignment.submitted;
            
            return (
              <div
                key={assignment.id || assignment._id}
                className="card p-5 hover:shadow-soft-lg transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    isCompleted 
                      ? 'bg-success/10' 
                      : 'bg-primary/10'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6 text-success" />
                    ) : (
                      <FileText className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-text-primary truncate">
                      {assignment.title}
                    </h3>
                    <p className="text-xs text-text-secondary mt-0.5 truncate">
                      {assignment.className || assignment.class_name || 'Assignment'}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      {due && isValid(due) && (
                        <span className={`flex items-center gap-1 text-xs ${
                          isPast ? 'text-error' : 'text-text-secondary'
                        }`}>
                          <Calendar className="w-3.5 h-3.5" />
                          {isPast ? t('assignments.overdue') || 'Overdue' : format(due, 'MMM dd, yyyy')}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-text-secondary">
                        <BookOpen className="w-3.5 h-3.5" />
                        {assignment.totalPoints || 0} {t('common.points') || 'pts'}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {assignment.submitted ? (
                      <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                        {t('assignments.submitted') || 'Submitted'}
                      </span>
                    ) : isPast ? (
                      <span className="inline-flex items-center rounded-full bg-error/10 px-2.5 py-0.5 text-xs font-semibold text-error">
                        {t('assignments.overdue') || 'Overdue'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-semibold text-warning">
                        {t('common.pending') || 'Pending'}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Score if available */}
                {assignment.score !== undefined && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-secondary">{t('grades.score') || 'Score'}</span>
                      <span className="text-sm font-bold text-success">
                        {assignment.score}/{assignment.totalPoints || 0}
                      </span>
                    </div>
                  </div>
                )}
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
            {filter === 'all' 
              ? t('assignments.empty') || 'No assignments yet'
              : filter === 'upcoming'
              ? t('assignments.empty') || 'No pending assignments'
              : t('assignments.empty') || 'No completed assignments'
            }
          </p>
          <p className="text-sm text-text-secondary">
            {t('assignments.emptyDesc') || 'Join a class to see assignments'}
          </p>
        </div>
      )}
    </div>
  );
}
