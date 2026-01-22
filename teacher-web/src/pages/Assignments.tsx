import { useEffect, useState } from 'react';
import { getAssignments } from '../services/assignmentService';
import { BookOpen, Plus } from 'lucide-react';
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
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Assignments</h1>
          <p className="mt-2 text-gray-600">Create and grade assignments for students</p>
        </div>
        <button
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Assignment
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {assignments.map((assignment) => {
            const dueDate = assignment.dueDate || assignment.due_date;
            const due = dueDate ? new Date(dueDate) : null;
            return (
              <li key={assignment._id || assignment.id} className="hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <BookOpen className="w-5 h-5 text-blue-500 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {assignment.title}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {assignment.classId?.name || 'N/A'} • {assignment.questions?.length || 0} questions •{' '}
                          {assignment.totalPoints || 0} points
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {due && isValid(due) && (
                        <p className="text-sm text-gray-500">
                          Due: {format(due, 'MMM dd, yyyy HH:mm')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {assignments.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No assignments yet. Create a new assignment to get started.
          </div>
        )}
      </div>
    </div>
  );
}
