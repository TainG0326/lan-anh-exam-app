import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createExam } from '../services/examService';
import { getClasses, Class } from '../services/classService';
import { aiImportService, AIQuestion } from '../services/aiImportService';
import AIMagicImportModal from '../components/AIMagicImportModal';
import { Plus, Trash2, FileText, ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEffect } from 'react';
import BookLoader from '../components/BookLoader';

export default function CreateExam() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classId: '',
    startTime: '',
    endTime: '',
    duration: 60,
    shuffleQuestions: false,
    shuffleOptions: false,
    requireWebcam: false,
  });
  const [questions, setQuestions] = useState<any[]>([]);
  const [showAiModal, setShowAiModal] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    type: 'multiple-choice' as 'multiple-choice' | 'fill-blank' | 'reading-comprehension',
    options: ['', '', '', ''],
    correctAnswer: '',
    points: 1,
    explanation: '',
  });

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const data = await getClasses();
      setClasses(data);
    } catch (error: any) {
      toast.error('Failed to load classes');
    }
  };

  const addQuestion = () => {
    if (!currentQuestion.question) {
      toast.error('Please enter a question');
      return;
    }

    if (currentQuestion.type === 'multiple-choice' && !currentQuestion.correctAnswer) {
      toast.error('Please select the correct answer');
      return;
    }

    setQuestions([...questions, { ...currentQuestion }]);
    setCurrentQuestion({
      question: '',
      type: 'multiple-choice',
      options: ['', '', '', ''],
      correctAnswer: '',
      points: 1,
      explanation: '',
    });
    toast.success('Question added');
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleAiImport = (aiQuestions: AIQuestion[]) => {
    const mapped = aiQuestions.map((q) => ({
      question: q.question,
      type: q.type || ('multiple-choice' as const),
      options: q.options?.length ? q.options : ['', '', '', ''],
      correctAnswer: q.correctAnswer,
      points: q.points ?? 1,
      explanation: q.explanation || '',
    }));
    setQuestions((prev) => [...prev, ...mapped]);
    toast.success(`Đã thêm ${aiQuestions.length} câu bằng AI`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (questions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }

    setLoading(true);
    try {
      await createExam({
        ...formData,
        questions,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
      });
      toast.success('Exam created successfully!');
      navigate('/exams');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-0">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-3 mb-3">
          <button
            type="button"
            onClick={() => navigate('/exams')}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </button>
          <span className="text-sm text-gray-500">Quay lại danh sách bài thi</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tạo Bài Thi Mới</h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600">Tạo bài thi trắc nghiệm online</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Basic Info */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Thông tin cơ bản</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiêu đề bài thi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lớp học <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
              >
                <option value="">Chọn lớp học</option>
                {classes.map((classItem) => (
                  <option key={classItem.id || classItem._id} value={classItem.id || classItem._id}>
                    {classItem.name} - {classItem.grade} Grade {classItem.level}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thời gian bắt đầu <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thời gian kết thúc <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thời gian làm bài (phút) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              />
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Cài đặt</h2>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={formData.shuffleQuestions}
                onChange={(e) =>
                  setFormData({ ...formData, shuffleQuestions: e.target.checked })
                }
              />
              <span className="ml-2 text-sm text-gray-700">Xáo câu hỏi</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={formData.shuffleOptions}
                onChange={(e) =>
                  setFormData({ ...formData, shuffleOptions: e.target.checked })
                }
              />
              <span className="ml-2 text-sm text-gray-700">Xáo đáp án</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={formData.requireWebcam}
                onChange={(e) =>
                  setFormData({ ...formData, requireWebcam: e.target.checked })
                }
              />
              <span className="ml-2 text-sm text-gray-700">Yêu cầu webcam</span>
            </label>
          </div>
        </div>

        {/* Questions */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
            <h2 className="text-lg sm:text-xl font-semibold">
              Câu hỏi ({questions.length})
            </h2>
            <button
              type="button"
              onClick={() => setShowAiModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#a78bfa] via-[#f472b6] to-[#fbbf24] px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold text-white shadow-md transition-all hover:scale-[1.02]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>
              AI Smart Import
            </button>
          </div>

          {questions.length === 0 && (
            <div className="mb-4 p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Chưa có câu hỏi. Thêm thủ công hoặc dùng AI Smart Import.
              </p>
            </div>
          )}

          {/* Add Question Form */}
          <div className="space-y-3 mb-4 p-4 border border-gray-200 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Câu hỏi
              </label>
              <textarea
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
                value={currentQuestion.question}
                onChange={(e) =>
                  setCurrentQuestion({ ...currentQuestion, question: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Loại</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={currentQuestion.type}
                  onChange={(e) =>
                    setCurrentQuestion({
                      ...currentQuestion,
                      type: e.target.value as any,
                    })
                  }
                >
                  <option value="multiple-choice">Trắc nghiệm</option>
                  <option value="fill-blank">Điền trống</option>
                  <option value="reading-comprehension">Đọc hiểu</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Điểm</label>
                <input
                  type="number"
                  min={1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={currentQuestion.points}
                  onChange={(e) =>
                    setCurrentQuestion({
                      ...currentQuestion,
                      points: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Đáp án đúng</label>
                {currentQuestion.type === 'multiple-choice' ? (
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={currentQuestion.correctAnswer}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctAnswer: e.target.value })}
                  >
                    <option value="">Chọn đáp án</option>
                    {currentQuestion.options.map((opt, idx) => (
                      opt.trim() && <option key={idx} value={idx.toString()}>
                        {String.fromCharCode(65 + idx)}. {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Đáp án"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={currentQuestion.correctAnswer}
                    onChange={(e) =>
                      setCurrentQuestion({ ...currentQuestion, correctAnswer: e.target.value })
                    }
                  />
                )}
              </div>
            </div>

            {currentQuestion.type === 'multiple-choice' && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Các lựa chọn</label>
                <div className="grid grid-cols-2 gap-2">
                  {currentQuestion.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-4 shrink-0">{String.fromCharCode(65 + idx)}.</span>
                      <input
                        type="text"
                        placeholder={`Lựa chọn ${idx + 1}`}
                        className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                        value={opt}
                        onChange={(e) => {
                          const newOptions = [...currentQuestion.options];
                          newOptions[idx] = e.target.value;
                          setCurrentQuestion({ ...currentQuestion, options: newOptions });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={addQuestion}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              Thêm câu hỏi
            </button>
          </div>

          {/* Question List */}
          <div className="space-y-2">
            {questions.map((q, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg"
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-green-100 text-green-700 text-xs font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 line-clamp-2">{q.question}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                      {q.type === 'multiple-choice' ? 'Trắc nghiệm' : q.type === 'fill-blank' ? 'Điền trống' : 'Đọc hiểu'}
                    </span>
                    <span className="text-xs text-green-600 font-medium">{q.points} điểm</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeQuestion(idx)}
                  className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:space-x-3 pb-6">
          <button
            type="button"
            onClick={() => navigate('/exams')}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang tạo...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Tạo Bài Thi
              </>
            )}
          </button>
        </div>
      </form>

      {/* AI Magic Import Modal */}
      <AIMagicImportModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        onImport={handleAiImport}
        importTargetNoun="exam"
      />
    </div>
  );
}
