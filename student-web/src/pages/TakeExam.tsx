import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExamByCode, startExam, submitExam, submitAnswer } from '../services/examService';
import { Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TakeExam() {
  const { examCode } = useParams<{ examCode: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<any>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (examCode) {
      loadExam();
    }
  }, [examCode]);

  useEffect(() => {
    if (attempt && exam) {
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const startedAt = new Date(attempt.started_at || attempt.startedAt).getTime();
        const duration = exam.duration * 60 * 1000; // Convert minutes to milliseconds
        const endTime = startedAt + duration;
        const remaining = Math.max(0, endTime - now);
        
        setTimeRemaining(Math.floor(remaining / 1000));

        if (remaining <= 0) {
          handleSubmit();
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [attempt, exam]);

  const loadExam = async () => {
    try {
      const examId = examCode || '';
      const examData = await getExamByCode(examId);
      setExam(examData);
      
      // Start exam
      const startData = await startExam(examData.id || examData._id);
      setAttempt(startData.attempt);
      setAnswers(startData.attempt.answers || {});
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load exam');
      navigate('/exams');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = async (questionId: string, answer: any) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);

    // Auto-save answer
    try {
      await submitAnswer(exam.id || exam._id, questionId, answer);
    } catch (error) {
      console.error('Failed to save answer:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const timeSpent = exam.duration * 60 - timeRemaining;
      const result = await submitExam(exam.id || exam._id, answers, timeSpent);
      toast.success('Exam submitted successfully!');
      navigate(`/exams/result/${exam.id || exam._id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit exam');
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (!exam || !attempt) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Exam not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>
            <p className="text-gray-600 mt-1">{exam.description}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center text-red-600 font-semibold mb-2">
              <Clock className="w-5 h-5 mr-2" />
              {formatTime(timeRemaining)}
            </div>
            <p className="text-sm text-gray-500">
              {exam.questions?.length || 0} questions • {exam.totalPoints || exam.total_points || 0} points
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 space-y-6">
        {(exam.questions || []).map((question: any, index: number) => {
          const questionId = question.id || `question_${index}`;
          const currentAnswer = answers[questionId];

          return (
            <div key={index} className="border-b pb-6 last:border-b-0">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Question {index + 1}: {question.question}
                </h3>
                <p className="text-sm text-gray-500">
                  {question.points} points {question.type && `• ${question.type}`}
                </p>
              </div>

              {question.type === 'multiple-choice' && question.options && (
                <div className="space-y-2">
                  {question.options.map((option: string, optIndex: number) => (
                    <label
                      key={optIndex}
                      className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="radio"
                        name={questionId}
                        value={option}
                        checked={currentAnswer === option}
                        onChange={() => handleAnswerChange(questionId, option)}
                        className="mr-3"
                      />
                      <span className="text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.type === 'fill-blank' && (
                <input
                  type="text"
                  value={currentAnswer || ''}
                  onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your answer..."
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSubmit}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Submit Exam
        </button>
      </div>
    </div>
  );
}
