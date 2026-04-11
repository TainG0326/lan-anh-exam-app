import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/Dialog';
import { createAssignment } from '../services/assignmentService';
import { getClasses, Class } from '../services/classService';
import { aiImportService, AIQuestion } from '../services/aiImportService';
import AIMagicImportModal from '../components/AIMagicImportModal';
import { Plus, Trash2, FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Question {
  question: string;
  type: 'multiple-choice' | 'fill-blank';
  options: string[];
  correctAnswer: string;
  points: number;
}

export default function CreateAssignmentModal({ isOpen, onClose, onSuccess }: CreateAssignmentModalProps) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
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
    if (isOpen) {
      loadClasses();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setFormData({ title: '', description: '', classId: '', dueDate: '' });
      setQuestions([]);
      setCurrentQuestion({ question: '', type: 'multiple-choice', options: ['', '', '', ''], correctAnswer: '', points: 10 });
    }
  }, [isOpen]);

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
    setCurrentQuestion({ question: '', type: 'multiple-choice', options: ['', '', '', ''], correctAnswer: '', points: 10 });
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleAiImport = (aiQuestions: AIQuestion[]) => {
    const mapped: Question[] = aiQuestions.map((q) => ({
      question: q.question,
      type: 'multiple-choice' as const,
      options: q.options?.length ? q.options : ['', '', '', ''],
      correctAnswer: q.correctAnswer,
      points: q.points ?? 10,
    }));
    setQuestions((prev) => [...prev, ...mapped]);
    toast.success(`Đã thêm ${aiQuestions.length} câu bằng AI`);
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
    if (!formData.dueDate) {
      toast.error('Vui lòng chọn ngày hết hạn');
      return;
    }
    if (questions.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 câu hỏi');
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
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Tạo bài tập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Tạo Bài Tập Mới</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Info */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiêu đề bài tập <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Bài tập Unit 1 - Chào hỏi"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  rows={2}
                  placeholder="Mô tả nội dung bài tập (không bắt buộc)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">
                  Câu hỏi ({questions.length})
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200 font-medium">
                    Tổng: {totalPoints} điểm
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAiModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#a78bfa] via-[#f472b6] to-[#fbbf24] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:scale-[1.02]"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>
                    AI Import
                  </button>
                </div>
              </div>

              {questions.length === 0 && (
                <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <FileText className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-600">Chưa có câu hỏi</p>
                </div>
              )}

              {/* Add Question Form */}
              <div className="space-y-2 p-3 border border-gray-200 rounded-lg">
                <textarea
                  rows={2}
                  placeholder="Nhập nội dung câu hỏi..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
                  value={currentQuestion.question}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                />
                <div className="grid grid-cols-3 gap-2">
                  <select
                    className="px-2 py-1.5 border border-gray-300 rounded-md text-xs"
                    value={currentQuestion.type}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, type: e.target.value as any })}
                  >
                    <option value="multiple-choice">Trắc nghiệm</option>
                    <option value="fill-blank">Điền trống</option>
                  </select>
                  <input
                    type="number"
                    min={1}
                    placeholder="Điểm"
                    className="px-2 py-1.5 border border-gray-300 rounded-md text-xs"
                    value={currentQuestion.points}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: parseInt(e.target.value) || 1 })}
                  />
                  {currentQuestion.type === 'multiple-choice' ? (
                    <select
                      className="px-2 py-1.5 border border-gray-300 rounded-md text-xs"
                      value={currentQuestion.correctAnswer}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctAnswer: e.target.value })}
                    >
                      <option value="">Chọn đáp án</option>
                      {currentQuestion.options.map((opt, idx) => (
                        opt.trim() && <option key={idx} value={idx.toString()}>
                          {String.fromCharCode(65 + idx)}. {opt.substring(0, 15)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Đáp án"
                      className="px-2 py-1.5 border border-gray-300 rounded-md text-xs"
                      value={currentQuestion.correctAnswer}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctAnswer: e.target.value })}
                    />
                  )}
                </div>

                {currentQuestion.type === 'multiple-choice' && (
                  <div className="grid grid-cols-2 gap-1.5">
                    {currentQuestion.options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-500 w-4 shrink-0">{String.fromCharCode(65 + idx)}.</span>
                        <input
                          type="text"
                          placeholder={`Lựa chọn ${idx + 1}`}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded-md text-xs"
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
                )}

                <button
                  type="button"
                  onClick={addQuestion}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Thêm câu hỏi
                </button>
              </div>

              {/* Question List */}
              {questions.length > 0 && (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {questions.map((q, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 border border-gray-200 rounded-lg">
                      <div className="w-5 h-5 rounded flex items-center justify-center bg-green-100 text-green-700 text-xs font-bold shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-800 line-clamp-1">{q.question}</p>
                        <span className="text-[10px] text-gray-500">
                          {q.type === 'multiple-choice' ? 'Trắc nghiệm' : 'Điền trống'} · {q.points} điểm
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeQuestion(idx)}
                        className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-md disabled:opacity-50 flex items-center justify-center gap-2"
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
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AI Magic Import Modal */}
      <AIMagicImportModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        onImport={handleAiImport}
        importTargetNoun="assignment"
      />
    </>
  );
}
