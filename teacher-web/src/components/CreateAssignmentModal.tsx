import { useState } from 'react';
import { X, Plus, Trash2, BookOpen, Clock, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { createAssignment } from '../services/assignmentService';
import { getClasses, Class } from '../services/classService';

interface Question {
  question: string;
  type: 'multiple-choice' | 'fill-blank';
  options: string[];
  correctAnswer: string;
  points: number;
}

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateAssignmentModal({ isOpen, onClose, onSuccess }: CreateAssignmentModalProps) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
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

  const openModal = () => {
    loadClasses();
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
      onSuccess();
      onClose();
      setFormData({ title: '', description: '', classId: '', dueDate: '' });
      setQuestions([]);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Tạo bài tập thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onMouseEnter={openModal}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{
          background: 'linear-gradient(145deg, #1a1f2e 0%, #0f1318 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 rounded-t-2xl"
          style={{
            background: 'linear-gradient(145deg, rgba(123,163,137,0.15) 0%, rgba(15,20,30,0.95) 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(123,163,137,0.2)' }}
            >
              <BookOpen className="w-5 h-5" style={{ color: '#7BA389' }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Tạo Bài Tập Mới</h2>
              <p className="text-xs text-gray-400">
                {questions.length} câu hỏi • {totalPoints} điểm
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Tiêu đề bài tập <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="VD: Bài tập Unit 1 - Chào hỏi"
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Mô tả
              </label>
              <textarea
                rows={2}
                placeholder="Mô tả nội dung bài tập (không bắt buộc)"
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none resize-none"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Lớp học <span className="text-red-400">*</span>
                </label>
                {loadingClasses ? (
                  <div className="w-full px-4 py-2.5 rounded-xl text-sm text-gray-400" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    Đang tải...
                  </div>
                ) : (
                  <select
                    required
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-white focus:outline-none"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  >
                    <option value="" style={{ background: '#1a1f2e' }}>Chọn lớp học</option>
                    {classes.map((cls) => (
                      <option key={cls.id || cls._id} value={cls.id || cls._id} style={{ background: '#1a1f2e' }}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Hạn nộp <span className="text-red-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white focus:outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />

          {/* Questions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-200">
                Câu hỏi ({questions.length})
              </h3>
              <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(123,163,137,0.15)', color: '#7BA389' }}>
                Tổng: {totalPoints} điểm
              </span>
            </div>

            {/* Add Question Form */}
            <div
              className="p-4 rounded-xl space-y-3 mb-4"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Câu hỏi</label>
                <textarea
                  rows={2}
                  placeholder="Nhập nội dung câu hỏi..."
                  className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none resize-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  value={currentQuestion.question}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Loại</label>
                  <select
                    className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    value={currentQuestion.type}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, type: e.target.value as any })}
                  >
                    <option value="multiple-choice" style={{ background: '#1a1f2e' }}>Trắc nghiệm</option>
                    <option value="fill-blank" style={{ background: '#1a1f2e' }}>Điền trống</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Điểm</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    value={currentQuestion.points}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Đáp án đúng</label>
                  {currentQuestion.type === 'multiple-choice' ? (
                    <select
                      className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                      value={currentQuestion.correctAnswer}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctAnswer: e.target.value })}
                    >
                      <option value="" style={{ background: '#1a1f2e' }}>Chọn đáp án</option>
                      {currentQuestion.options.map((opt, idx) => (
                        opt.trim() && <option key={idx} value={idx.toString()} style={{ background: '#1a1f2e' }}>
                          {String.fromCharCode(65 + idx)}. {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Đáp án"
                      className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                      value={currentQuestion.correctAnswer}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctAnswer: e.target.value })}
                    />
                  )}
                </div>
              </div>

              {currentQuestion.type === 'multiple-choice' && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Các lựa chọn</label>
                  <div className="grid grid-cols-2 gap-2">
                    {currentQuestion.options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-4">{String.fromCharCode(65 + idx)}.</span>
                        <input
                          type="text"
                          placeholder={`Lựa chọn ${idx + 1}`}
                          className="flex-1 px-2 py-1.5 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
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
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ background: 'rgba(123,163,137,0.2)', color: '#7BA389' }}
              >
                <Plus className="w-4 h-4" />
                Thêm câu hỏi
              </button>
            </div>

            {/* Question List */}
            {questions.length > 0 ? (
              <div className="space-y-2">
                {questions.map((q, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5"
                      style={{ background: 'rgba(123,163,137,0.15)', color: '#7BA389' }}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 line-clamp-2">{q.question}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: '#9CA3AF' }}>
                          {q.type === 'multiple-choice' ? 'Trắc nghiệm' : 'Điền trống'}
                        </span>
                        <span className="text-xs" style={{ color: '#7BA389' }}>{q.points} điểm</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeQuestion(idx)}
                      className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center py-8 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}
              >
                <FileText className="w-8 h-8 text-gray-600 mb-2" />
                <p className="text-sm text-gray-500">Chưa có câu hỏi nào</p>
                <p className="text-xs text-gray-600 mt-1">Thêm câu hỏi bên trên để tạo bài tập</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #7BA389 0%, #5A7A63 100%)', boxShadow: '0 4px 15px rgba(123,163,137,0.3)' }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Đang tạo...
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4" />
                  Tạo Bài Tập
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
