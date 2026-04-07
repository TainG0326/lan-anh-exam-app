import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAssignment } from '../services/assignmentService';
import { getClasses, Class } from '../services/classService';
import { aiImportService } from '../services/aiImportService';
import { Plus, Trash2, Upload, FileText, ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

interface Question {
  question: string;
  type: 'multiple-choice' | 'fill-blank';
  options: string[];
  correctAnswer: string;
  points: number;
}

export default function CreateAssignment() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classId: '',
    dueDate: '',
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    question: '',
    type: 'multiple-choice',
    options: ['', '', '', ''],
    correctAnswer: '',
    points: 10,
  });

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    setLoadingClasses(true);
    try {
      const data = await getClasses();
      setClasses(data || []);
    } catch {
      toast.error('Không thể tải danh sách lớp');
    } finally {
      setLoadingClasses(false);
    }
  };

  const addQuestion = () => {
    if (!currentQuestion.question.trim()) {
      toast.error('Vui lòng nhập nội dung câu hỏi');
      return;
    }
    if (currentQuestion.type === 'multiple-choice') {
      const filledOptions = currentQuestion.options.filter(o => o.trim());
      if (filledOptions.length < 2) {
        toast.error('Cần ít nhất 2 lựa chọn');
        return;
      }
      if (!currentQuestion.correctAnswer) {
        toast.error('Vui lòng chọn đáp án đúng');
        return;
      }
    } else if (!currentQuestion.correctAnswer.trim()) {
      toast.error('Vui lòng nhập đáp án đúng');
      return;
    }
    setQuestions([...questions, { ...currentQuestion }]);
    setCurrentQuestion({
      question: '',
      type: 'multiple-choice',
      options: ['', '', '', ''],
      correctAnswer: '',
      points: 10,
    });
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExts = ['.pdf', '.docx', '.doc', '.txt', '.jpg', '.jpeg', '.png', '.webp'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExts.includes(ext)) {
      toast.error('Chấp nhận: PDF, DOCX, TXT, JPG, PNG, WEBP');
      return;
    }

    setUploading(true);
    try {
      const result = await aiImportService.importFile(file);
      if (result.questions?.length) {
        const mapped: Question[] = result.questions.map((q) => ({
          question: q.question,
          type: 'multiple-choice' as const,
          options: q.options?.length ? q.options : ['', '', '', ''],
          correctAnswer: q.correctAnswer,
          points: q.points ?? 10,
        }));
        setQuestions((prev) => [...prev, ...mapped]);
        toast.success(`Đã tạo ${result.count} câu bằng AI`);
      } else {
        toast.error('AI không trích xuất được câu hỏi từ file này');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Import AI thất bại';
      toast.error(msg);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề bài tập');
      return;
    }
    if (!formData.classId) {
      toast.error('Vui lòng chọn lớp học');
      return;
    }
    if (questions.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 câu hỏi');
      return;
    }
    if (!formData.dueDate) {
      toast.error('Vui lòng chọn ngày hết hạn');
      return;
    }

    setLoading(true);
    try {
      await createAssignment({
        title: formData.title,
        description: formData.description,
        classId: formData.classId,
        dueDate: formData.dueDate,
        questions,
      });
      toast.success('Tạo bài tập thành công!');
      navigate('/assignments');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Tạo bài tập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-0">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-3 mb-3">
          <button
            type="button"
            onClick={() => navigate('/assignments')}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </button>
          <span className="text-sm text-gray-500">Quay lại danh sách bài tập</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tạo Bài Tập Mới</h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600">
          Tạo bài tập với câu hỏi trắc nghiệm cho học sinh
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Basic Info */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Thông tin cơ bản</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiêu đề bài tập <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="VD: Bài tập Unit 1 - Chào hỏi"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm sm:text-base"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả
              </label>
              <textarea
                rows={2}
                placeholder="Mô tả nội dung bài tập (không bắt buộc)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm sm:text-base resize-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lớp học <span className="text-red-500">*</span>
                </label>
                {loadingClasses ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-500 bg-gray-50">
                    Đang tải...
                  </div>
                ) : (
                  <select
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm sm:text-base"
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  >
                    <option value="">Chọn lớp học</option>
                    {classes.map((cls) => (
                      <option key={cls.id || cls._id} value={cls.id || cls._id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hạn nộp <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm sm:text-base"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
            <h2 className="text-lg sm:text-xl font-semibold">
              Câu hỏi ({questions.length})
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs px-2 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200 font-medium">
                Tổng: {totalPoints} điểm
              </span>
              <label
                className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium bg-white hover:bg-gray-50 cursor-pointer ${
                  uploading ? 'opacity-60 pointer-events-none' : ''
                }`}
              >
                {uploading ? (
                  <span className="flex items-center gap-2 text-green-700">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang xử lý AI...
                  </span>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    AI Import (PDF/DOCX/TXT/IMG)
                  </>
                )}
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Empty state */}
          {questions.length === 0 && (
            <div className="mb-4 p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Chưa có câu hỏi. Thêm thủ công hoặc dùng AI import từ file.
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
                placeholder="Nhập nội dung câu hỏi..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
                value={currentQuestion.question}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Loại</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={currentQuestion.type}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, type: e.target.value as any })}
                >
                  <option value="multiple-choice">Trắc nghiệm</option>
                  <option value="fill-blank">Điền trống</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Điểm</label>
                <input
                  type="number"
                  min={1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={currentQuestion.points}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: parseInt(e.target.value) || 1 })}
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
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctAnswer: e.target.value })}
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
                          const newOpts = [...currentQuestion.options];
                          newOpts[idx] = e.target.value;
                          setCurrentQuestion({ ...currentQuestion, options: newOpts });
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
          {questions.length > 0 && (
            <div className="space-y-2">
              {questions.map((q, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-green-100 text-green-700 text-xs font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 line-clamp-2">{q.question}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                        {q.type === 'multiple-choice' ? 'Trắc nghiệm' : 'Điền trống'}
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
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:space-x-3 pb-6">
          <button
            type="button"
            onClick={() => navigate('/assignments')}
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
                Tạo Bài Tập
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}