import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyClass } from '../services/classService';
import { getExams } from '../services/examService';
import { getAssignments } from '../services/assignmentService';
import { BookOpen, Users, FileText, Calendar, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, isValid } from 'date-fns';

export default function Courses() {
  const [myClass, setMyClass] = useState<any>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [classData, examsData, assignmentsData] = await Promise.allSettled([
        getMyClass().catch(() => null),
        getExams(),
        getAssignments(),
      ]);

      if (classData.status === 'fulfilled' && classData.value) {
        setMyClass(classData.value.class || classData.value);
      }

      if (examsData.status === 'fulfilled') {
        setExams(examsData.value || []);
      }

      if (assignmentsData.status === 'fulfilled') {
        setAssignments(assignmentsData.value || []);
      }
    } catch (error: any) {
      toast.error('Failed to load data');
      console.error('Error loading data:', error);
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

  if (!myClass) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No class joined</h2>
          <p className="text-gray-600 mb-6">
            You need to join a class to view courses and assignments.
          </p>
          <Link
            to="/join-class"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <Users className="w-5 h-5 mr-2" />
            Join Class
          </Link>
        </div>
      </div>
    );
  }

  const classExams = exams.filter(
    (exam) => (exam.class_id || exam.classId) === (myClass.id || myClass._id)
  );
  const classAssignments = assignments.filter(
    (assignment) => (assignment.class_id || assignment.classId) === (myClass.id || myClass._id)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
        <p className="text-gray-600">Manage your classes and courses</p>
      </div>

      {/* Class Info Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{myClass.name}</h2>
              <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                <span className="flex items-center">
                  <GraduationCap className="w-4 h-4 mr-1" />
                  {myClass.grade} - Grade {myClass.level}
                </span>
                <span className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  Class Code: <span className="font-mono ml-1">{myClass.class_code}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exams Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Exams in Class</h2>
          <Link
            to="/exams"
            className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
          >
            View All
          </Link>
        </div>
        {classExams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classExams.slice(0, 4).map((exam) => {
              const startTime = exam.startTime || exam.start_time;
              const startDate = startTime ? new Date(startTime) : null;
              return (
                <Link
                  key={exam.id || exam._id}
                  to={`/exams/take/${exam.examCode || exam.exam_code}`}
                  className="bg-white rounded-xl shadow-md border border-gray-100 p-5 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{exam.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{exam.description}</p>
                    </div>
                    <FileText className="w-6 h-6 text-blue-500 flex-shrink-0 ml-2" />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-3">
                    {startDate && isValid(startDate) && (
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {format(startDate, 'MMM dd, yyyy')}
                      </span>
                    )}
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                      {exam.status === 'active' ? 'Active' : exam.status === 'completed' ? 'Completed' : 'Upcoming'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No exams in this class yet</p>
          </div>
        )}
      </section>

      {/* Assignments Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Assignments in Class</h2>
          <Link
            to="/assignments"
            className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
          >
            View All
          </Link>
        </div>
        {classAssignments.length > 0 ? (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {classAssignments.slice(0, 5).map((assignment) => (
                <Link
                  key={assignment.id || assignment._id}
                  to={`/assignments/${assignment.id || assignment._id}`}
                  className="block p-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {assignment.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-1">{assignment.description}</p>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <span className="text-sm text-gray-600">
                        {assignment.dueDate && format(new Date(assignment.dueDate), 'MMM dd, yyyy')}
                      </span>
                      {assignment.submitted ? (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                          Submitted
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No assignments in this class yet</p>
          </div>
        )}
      </section>
    </div>
  );
}
