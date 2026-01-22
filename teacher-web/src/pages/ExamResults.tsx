import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getExamResults } from '../services/examService';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, isValid } from 'date-fns';

export default function ExamResults() {
  const { examId } = useParams();
  const [exam, setExam] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (examId) {
      loadResults();
    }
  }, [examId]);

  const loadResults = async () => {
    try {
      const data = await getExamResults(examId!);
      setExam(data.exam);
      setAttempts(data.attempts || []);
    } catch (error: any) {
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!exam) {
    return <div className="text-center py-8">Exam not found</div>;
  }

  const averageScore =
    attempts.length > 0
      ? attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length
      : 0;

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/exams"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Exams
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{exam.title}</h1>
        <p className="mt-2 text-gray-600">
          Exam Code: <span className="font-mono">{exam.examCode || exam.exam_code}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm text-gray-500">Total Students</p>
          <p className="text-2xl font-bold text-gray-900">{attempts.length}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm text-gray-500">Average Score</p>
          <p className="text-2xl font-bold text-gray-900">
            {averageScore.toFixed(1)} / {exam.totalPoints || exam.total_points || 0}
          </p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm text-gray-500">Completion Rate</p>
          <p className="text-2xl font-bold text-gray-900">
            {attempts.filter((a) => a.submittedAt || a.submitted_at).length} / {attempts.length}
          </p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time Taken
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Violations
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {attempts.map((attempt) => {
              const student = attempt.studentId || attempt.student_id;
              const violations = attempt.violations || [];
              const submittedAt = attempt.submittedAt || attempt.submitted_at;
              return (
                <tr key={attempt._id || attempt.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {student?.name || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500">{student?.email || ''}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {attempt.score !== undefined && attempt.score !== null
                        ? `${attempt.score} / ${exam.totalPoints || exam.total_points || 0}`
                        : 'Not graded'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {submittedAt && isValid(new Date(submittedAt))
                      ? format(new Date(submittedAt), 'MMM dd, yyyy HH:mm')
                      : 'Not submitted'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {violations.length > 0 ? (
                      <div className="flex items-center text-red-600">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        <span className="text-sm">{violations.length}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        attempt.autoSubmitted || attempt.auto_submitted
                          ? 'bg-yellow-100 text-yellow-800'
                          : submittedAt
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {attempt.autoSubmitted || attempt.auto_submitted ? 'Auto submitted' : ''}
                      {!(attempt.autoSubmitted || attempt.auto_submitted) && submittedAt ? 'Submitted' : ''}
                      {!submittedAt ? 'Not submitted' : ''}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {attempts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No students have taken this exam yet.
          </div>
        )}
      </div>
    </div>
  );
}
