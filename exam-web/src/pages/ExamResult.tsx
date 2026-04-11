import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Award, Home } from 'lucide-react';

export default function ExamResult() {
  const { examId } = useParams<{ examId: string }>();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setResult({
        score: 85,
        totalPoints: 100,
        passed: true,
        questions: [
          { question: 'What is the capital of France?', correct: true },
          { question: 'What is 2+2?', correct: true },
          { question: 'What is the largest planet?', correct: false },
        ]
      });
      setLoading(false);
    }, 1000);
  }, [examId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const percentage = Math.round((result.score / result.totalPoints) * 100);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg border border-gray-200"
      >
        <div className="text-center mb-8">
          {result.passed ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4"
            >
              <Award className="w-10 h-10 text-green-600" />
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4"
            >
              <XCircle className="w-10 h-10 text-red-600" />
            </motion.div>
          )}
          
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {result.passed ? 'Chúc mừng!' : 'Chưa đạt'}
          </h1>
          <p className="text-gray-500">
            {result.passed 
              ? 'Bạn đã hoàn thành bài thi thành công!' 
              : 'Hãy cố gắng hơn lần sau nhé!'}
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-600">Điểm số</span>
            <span className="text-3xl font-bold text-gray-800">{result.score}/{result.totalPoints}</span>
          </div>
          
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                percentage >= 70 ? 'bg-green-500' : 
                percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
            />
          </div>
          
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>0%</span>
            <span>{percentage}%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
            <div className="text-xl font-bold text-green-700">
              {result.questions.filter((q: any) => q.correct).length}
            </div>
            <div className="text-xs text-green-600">Đúng</div>
          </div>
          
          <div className="bg-red-50 rounded-xl p-4 text-center">
            <XCircle className="w-6 h-6 text-red-600 mx-auto mb-1" />
            <div className="text-xl font-bold text-red-700">
              {result.questions.filter((q: any) => !q.correct).length}
            </div>
            <div className="text-xs text-red-600">Sai</div>
          </div>
          
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <Clock className="w-6 h-6 text-blue-600 mx-auto mb-1" />
            <div className="text-xl font-bold text-blue-700">
              {result.questions.length}
            </div>
            <div className="text-xs text-blue-600">Tổng</div>
          </div>
        </div>

        <Link
          to="/login"
          className="flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-xl transition-colors"
        >
          <Home className="w-5 h-5" />
          Về trang chủ
        </Link>
      </motion.div>
    </div>
  );
}
