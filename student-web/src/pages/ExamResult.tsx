import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getStudentAttempt } from '../services/examService';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ExamResult() {
  const { examId } = useParams();
  const [exam, setExam] = useState<any>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (examId) {
      loadResult();
    }
  }, [examId]);

  const loadResult = async () => {
    try {
      const data = await getStudentAttempt(examId!);
      setExam(data.exam);
      setAttempt(data.attempt);
    } catch (error: any) {
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!exam || !attempt) {
    return <div className="text-center py-8">Results not found</div>;
  }

  const totalPoints = exam.totalPoints || exam.total_points || 0;
  const score = attempt.score !== undefined && attempt.score !== null ? attempt.score : 0;
  const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;

  // Process questions with answers
  const questionsWithAnswers = (exam.questions || []).map((question: any, index: number) => {
    const questionId = question.id || `question_${index}`;
    const userAnswer = attempt.answers?.[questionId] || attempt.answers?.[index];
    const correctAnswer = question.correctAnswer;
    
    let isCorrect = false;
    if (Array.isArray(correctAnswer)) {
      const userAnswerArray = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
      isCorrect = correctAnswer.every((ans) => 
        userAnswerArray.includes(ans) || userAnswerArray.includes(String(ans))
      );
    } else {
      isCorrect = String(userAnswer) === String(correctAnswer);
    }

    return {
      ...question,
      studentAnswer: userAnswer,
      isCorrect,
    };
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          to="/exams"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Exams
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Exam Results</h1>
        <p className="mt-2 text-gray-600">{exam.title}</p>
      </div>

      <div className="bg-white shadow rounded-lg p-8 mb-6 text-center">
        <div className="mb-4">
          <div className="text-6xl font-bold text-blue-600 mb-2">
            {score} / {totalPoints}
          </div>
          <div className="text-2xl text-gray-600">{percentage.toFixed(1)}%</div>
        </div>
        <div className="mt-4">
          {percentage >= 80 && (
            <div className="inline-flex items-center text-green-600">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span className="font-semibold">Excellent!</span>
            </div>
          )}
          {percentage >= 60 && percentage < 80 && (
            <div className="inline-flex items-center text-blue-600">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span className="font-semibold">Good!</span>
            </div>
          )}
          {percentage < 60 && (
            <div className="inline-flex items-center text-orange-600">
              <XCircle className="w-5 h-5 mr-2" />
              <span className="font-semibold">Need more practice!</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Answer Details</h2>
        <div className="space-y-4">
          {questionsWithAnswers.map((question: any, index: number) => (
            <div
              key={index}
              className={`p-4 border rounded-lg ${
                question.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start mb-2">
                {question.isCorrect ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-medium">
                    Question {index + 1}: {question.question}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Your answer: {question.studentAnswer || 'No answer'}
                  </p>
                  {!question.isCorrect && (
                    <p className="text-sm text-gray-700 mt-1">
                      Correct answer: {Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : question.correctAnswer}
                    </p>
                  )}
                  {question.explanation && (
                    <p className="text-sm text-gray-600 mt-1 italic">
                      Explanation: {question.explanation}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
