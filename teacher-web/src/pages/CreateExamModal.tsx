import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/Dialog';
import { createExam } from '../services/examService';
import { getClasses, Class } from '../services/classService';
import { aiImportService, AIQuestion } from '../services/aiImportService';
import AIMagicImportModal from '../components/AIMagicImportModal';
import { Plus, Trash2, FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface CreateExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateExamModal({ isOpen, onClose, onSuccess }: CreateExamModalProps) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
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
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    type: 'multiple-choice' as 'multiple-choice' | 'fill-blank' | 'reading-comprehension',
    options: ['', '', '', ''],
    correctAnswer: '',
    points: 1,
    explanation: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadClasses();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
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
      setQuestions([]);
      setCurrentQuestion({
        question: '',
        type: 'multiple-choice',
        options: ['', '', '', ''],
        correctAnswer: '',
        points: 1,
        explanation: '',
      });
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
    if (currentQuestion.type === 'multiple-choice' && !currentQuestion.correctAnswer) {
      toast.error('Vui lòng chọn đáp án đúng');
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
    toast.success('Đã thêm câu hỏi');
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
    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề bài thi');
      return;
    }
    if (!formData.classId) {
      toast.error('Vui lòng chọn lớp học');
      return;
    }
    if (!formData.startTime) {
      toast.error('Vui lòng chọn thời gian bắt đầu');
      return;
    }
    if (!formData.endTime) {
      toast.error('Vui lòng chọn thời gian kết thúc');
      return;
    }
    if (questions.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 câu hỏi');
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
      toast.success('Tạo bài thi thành công!');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Tạo bài thi thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Tạo Bài Thi Mới</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Info */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiêu đề bài thi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Bài thi Unit 1 - Chào hỏi"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  rows={2}
                  placeholder="Mô tả nội dung bài thi (không bắt buộc)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
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
                    {classes.map((classItem) => (
                      <option key={classItem.id || classItem._id} value={classItem.id || classItem._id}>
                        {classItem.name} - {classItem.grade} Grade {classItem.level}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thời gian bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                />
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700">Cài đặt</h3>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={formData.shuffleQuestions}
                  onChange={(e) => setFormData({ ...formData, shuffleQuestions: e.target.checked })}
                />
                <span className="text-sm text-gray-700">Xáo câu hỏi</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={formData.shuffleOptions}
                  onChange={(e) => setFormData({ ...formData, shuffleOptions: e.target.checked })}
                />
                <span className="text-sm text-gray-700">Xáo đáp án</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={formData.requireWebcam}
                  onChange={(e) => setFormData({ ...formData, requireWebcam: e.target.checked })}
                />
                <span className="text-sm text-gray-700">Yêu cầu webcam</span>
              </label>
            </div>

            {/* Questions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">
                  Câu hỏi ({questions.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAiModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#a78bfa] via-[#f472b6] to-[#fbbf24] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:scale-[1.02]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>
                  AI Import
                </button>
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
                    <option value="reading-comprehension">Đọc hiểu</option>
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
                            const newOptions = [...currentQuestion.options];
                            newOptions[idx] = e.target.value;
                            setCurrentQuestion({ ...currentQuestion, options: newOptions });
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
                          {q.type === 'multiple-choice' ? 'Trắc nghiệm' : q.type === 'fill-blank' ? 'Điền trống' : 'Đọc hiểu'} · {q.points} điểm
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
                    Tạo Bài Thi
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
        importTargetNoun="exam"
      />
    </>
  );
}
