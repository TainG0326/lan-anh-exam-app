import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Clock, FileText, LogOut, User } from 'lucide-react';
import { examAuth } from '../services/api';
import api from '../services/api';

interface Exam {
  id: string;
  title: string;
  description: string;
  exam_code?: string;
  duration: number;
  start_time?: string;
  end_time?: string;
  status: 'upcoming' | 'active' | 'completed';
  total_questions?: number;
  total_points?: number;
}

export default function Exams() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const currentUser = examAuth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'student') {
      navigate('/login');
      return;
    }
    setUser(currentUser);
    fetchExams();
  };

  const fetchExams = async () => {
    try {
      setLoading(true);
      const response = await api.get('/exams/student');
      if (response.data.success) {
        setExams(response.data.exams || []);
      }
    } catch (error: any) {
      console.error('Failed to fetch exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    examAuth.logout();
    navigate('/login');
  };

  const handleEnterExam = (examCode: string) => {
    navigate(`/exam/${examCode}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            Đang diễn ra
          </span>
        );
      case 'upcoming':
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            Sắp diễn ra
          </span>
        );
      case 'completed':
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
            Đã kết thúc
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">Phòng Thi Trực Tuyến</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-5 h-5" />
              <span className="font-medium">{user?.name || user?.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Danh sách bài thi</h2>
          <p className="text-gray-500 mt-1">Chọn bài thi để làm bài</p>
        </div>

        {exams.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-200 p-12 text-center"
          >
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Chưa có bài thi nào</h3>
            <p className="text-gray-500">Hiện tại không có bài thi nào được mở.</p>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {exams.map((exam, index) => (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">{exam.title}</h3>
                      {getStatusBadge(exam.status)}
                    </div>
                    
                    {exam.description && (
                      <p className="text-gray-600 mb-4">{exam.description}</p>
                    )}

                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{exam.duration} phút</span>
                      </div>
                      {exam.total_questions && (
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span>{exam.total_questions} câu hỏi</span>
                        </div>
                      )}
                      {exam.start_time && (
                        <div>
                          <span className="text-gray-400">Bắt đầu: </span>
                          <span>{formatDate(exam.start_time)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleEnterExam(exam.exam_code || exam.id)}
                    disabled={exam.status !== 'active'}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      exam.status === 'active'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {exam.status === 'active' ? 'Vào thi' : 'Không thể thi'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
