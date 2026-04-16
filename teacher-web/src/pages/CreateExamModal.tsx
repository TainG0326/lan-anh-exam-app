import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/Dialog';
import { createExam } from '../services/examService';
import { getClasses, Class } from '../services/classService';
import { aiImportService, AIQuestion } from '../services/aiImportService';
import AIMagicImportModal from '../components/AIMagicImportModal';
import { Plus, Trash2, FileText, Loader2, Check, Copy, Key } from 'lucide-react';
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
  const [publishMode, setPublishMode] = useState<'save_draft' | 'publish'>('save_draft');
  const [successModal, setSuccessModal] = useState<{ show: boolean; examCode: string; accessKey: string; title: string } | null>(null);
  const [copied, setCopied] = useState(false);
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
      setPublishMode('save_draft');
      setSuccessModal(null);
      setCopied(false);
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

  const handleSubmit = async (e: React.FormEvent, mode: 'save_draft' | 'publish') => {
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
      const result = await createExam({
        title: formData.title,
        description: formData.description,
        classId: formData.classId,
        questions,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        duration: formData.duration,
        shuffleQuestions: formData.shuffleQuestions,
        shuffleOptions: formData.shuffleOptions,
        requireWebcam: formData.requireWebcam,
        status: mode === 'publish' ? 'active' : 'draft',
      });

      const examData = result.data;
      const examCode = examData.exam_code || examData.examCode;
      const accessKey = examData.access_key || examData.accessKey;

      if (mode === 'publish') {
        setSuccessModal({
          show: true,
          examCode: examCode || '',
          accessKey: accessKey || '',
          title: formData.title,
        });
      } else {
        toast.success('Đã lưu bài thi dạng nháp!');
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Tạo bài thi thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAccessKey = () => {
    if (successModal?.accessKey) {
      navigator.clipboard.writeText(successModal.accessKey);
      setCopied(true);
      toast.success('Đã sao chép Access Key!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSuccessModalClose = () => {
    setSuccessModal(null);
    onSuccess();
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Tạo Bài Thi Mới</DialogTitle>
          </DialogHeader>

          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e as any, 'save_draft'); }} className="space-y-4">
            {/* Basic Info */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">
                  Tiêu đề bài thi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Bài thi Unit 1 - Chào hỏi"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-slate-800"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">Mô tả</label>
                <textarea
                  rows={2}
                  placeholder="Mô tả nội dung bài thi (không bắt buộc)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none text-slate-800"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">
                  Lớp học <span className="text-red-500">*</span>
                </label>
                {loadingClasses ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-slate-800 bg-gray-50">
                    Đang tải...
                  </div>
                ) : (
                  <select
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-slate-800 bg-white"
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
                  <label className="block text-sm font-medium text-slate-800 mb-1">
                    Thời gian bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-slate-800"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1">
                    Thời gian kết thúc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-slate-800"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">
                  Thời gian làm bài (phút) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-slate-800"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                />
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-semibold text-slate-800">Cài đặt</h3>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={formData.shuffleQuestions}
                  onChange={(e) => setFormData({ ...formData, shuffleQuestions: e.target.checked })}
                />
                <span className="text-sm text-slate-800">Xáo câu hỏi</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={formData.shuffleOptions}
                  onChange={(e) => setFormData({ ...formData, shuffleOptions: e.target.checked })}
                />
                <span className="text-sm text-slate-800">Xáo đáp án</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={formData.requireWebcam}
                  onChange={(e) => setFormData({ ...formData, requireWebcam: e.target.checked })}
                />
                <span className="text-sm text-slate-800">Yêu cầu webcam</span>
              </label>
            </div>

            {/* Questions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none text-slate-800"
                  value={currentQuestion.question}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                />
                <div className="grid grid-cols-3 gap-2">
                  <select
                    className="px-2 py-1.5 border border-gray-300 rounded-md text-xs text-slate-800"
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
                    className="px-2 py-1.5 border border-gray-300 rounded-md text-xs text-slate-800"
                    value={currentQuestion.points}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: parseInt(e.target.value) || 1 })}
                  />
                  {currentQuestion.type === 'multiple-choice' ? (
                    <select
                      className="px-2 py-1.5 border border-gray-300 rounded-md text-xs text-slate-800"
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
                      className="px-2 py-1.5 border border-gray-300 rounded-md text-xs text-slate-800"
                      value={currentQuestion.correctAnswer}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctAnswer: e.target.value })}
                    />
                  )}
                </div>

                {currentQuestion.type === 'multiple-choice' && (
                  <div className="grid grid-cols-2 gap-1.5">
                    {currentQuestion.options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-600 w-4 shrink-0">{String.fromCharCode(65 + idx)}.</span>
                        <input
                          type="text"
                          placeholder={`Lựa chọn ${idx + 1}`}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded-md text-xs text-slate-800"
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
                        <p className="text-xs text-slate-800 line-clamp-1">{q.question}</p>
                        <span className="text-[10px] text-slate-500">
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
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-slate-800 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e as any, 'save_draft')}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-slate-800 hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Lưu nháp
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e as any, 'publish')}
                disabled={loading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang xuất bản...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Xuất bản
                  </>
                )}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Success Modal - Show Access Key after publishing */}
      {successModal?.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 animate-fade-in overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Xuất bản thành công!</h3>
              <p className="text-green-100 mt-1 text-sm">{successModal.title}</p>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Exam Code (Mã đề thi)
                </label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                  <span className="font-mono font-bold text-slate-800 text-lg tracking-widest flex-1">
                    {successModal.examCode}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(successModal.examCode);
                      toast.success('Đã sao chép Exam Code!');
                    }}
                    className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Access Key (Mã truy cập)
                </label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                  <Key className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-mono font-bold text-slate-800 text-lg tracking-widest flex-1">
                    {successModal.accessKey}
                  </span>
                  <button
                    onClick={handleCopyAccessKey}
                    className={`p-1.5 rounded-lg transition-colors ${copied ? 'bg-green-100' : 'hover:bg-slate-200'}`}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  Chia sẻ Access Key này cho học sinh để họ tham gia thi
                </p>
              </div>

              <button
                onClick={handleSuccessModalClose}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-500/25"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}

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
