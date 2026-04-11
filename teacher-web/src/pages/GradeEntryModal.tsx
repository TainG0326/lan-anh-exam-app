import { useState } from 'react';
import { X, Save } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (score: number, feedback: string) => void;
  type: 'exam' | 'assignment';
  title: string;
  studentName: string;
  maxScore: number;
  initialScore?: number;
  initialFeedback?: string;
  loading?: boolean;
  t: (key: string) => string;
}

export default function GradeEntryModal({
  isOpen,
  onClose,
  onSave,
  type,
  title,
  studentName,
  maxScore,
  initialScore = 0,
  initialFeedback = '',
  loading = false,
  t,
}: Props) {
  const [score, setScore] = useState(initialScore.toString());
  const [feedback, setFeedback] = useState(initialFeedback);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericScore = parseFloat(score);
    if (isNaN(numericScore) || numericScore < 0 || numericScore > maxScore) {
      return;
    }
    onSave(numericScore, feedback);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-background-light rounded-3xl border border-border shadow-2xl animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-text-primary">
              {type === 'exam' ? t('grades.grading.examGrade') : t('grades.grading.assignmentGrade')}
            </h2>
            <p className="text-sm text-text-secondary mt-1 truncate max-w-[250px]">{title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Student Info */}
          <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20">
            <p className="text-sm text-text-secondary">{t('grades.student')}</p>
            <p className="font-semibold text-text-primary">{studentName}</p>
          </div>

          {/* Score Input */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('grades.score')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                min={0}
                max={maxScore}
                step={0.1}
                className="w-full px-4 py-3 pr-12 bg-white border border-border rounded-2xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder={`0 - ${maxScore}`}
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-secondary">
                / {maxScore}
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              {t('grades.scoreRange')} 0 - {maxScore}
            </p>
          </div>

          {/* Feedback Input */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('grades.feedback')}
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-white border border-border rounded-2xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
              placeholder={t('grades.feedbackPlaceholder')}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-text-primary font-semibold rounded-2xl transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 group relative inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold rounded-2xl shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {loading ? t('common.saving') : t('grades.saveGrade')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
