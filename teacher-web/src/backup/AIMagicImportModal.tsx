import { useState, useRef, useCallback } from 'react';
import { X, Sparkles, Upload, Loader2, CheckCircle2, Trash2, Edit3, AlertCircle, Wand2 } from 'lucide-react';
import { aiImportService, AIQuestion } from '../services/aiImportService';

type ImportStep = 'upload' | 'processing' | 'review' | 'done';

interface AIMagicImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with confirmed questions so parent can merge them into its own state */
  onImport: (questions: AIQuestion[]) => void;
  /** Shown in success step, e.g. "exam" | "assignment" */
  importTargetNoun?: string;
}

const cardClass =
  'rounded-2xl border-2 border-[#648777]/28 bg-white shadow-[0_10px_40px_-10px_rgba(36,55,45,0.22)] p-4 sm:p-6 ring-1 ring-slate-900/[0.04]';
const fieldClass =
  'w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-text-primary placeholder:text-text-muted focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5F8D78]/35 focus:border-[#5F8D78] transition-shadow';
const sectionTitle =
  'text-lg sm:text-xl font-semibold text-text-primary pb-3 mb-4 border-b border-[#648777]/18';

const DRAG_ACTIVE_CLASS =
  'border-primary bg-primary/[0.06] ring-4 ring-primary/10 scale-[1.01]';
const DRAG_IDLE_CLASS = 'border-dashed border-[#648777]/35 bg-[#648777]/[0.04]';

export default function AIMagicImportModal({
  isOpen,
  onClose,
  onImport,
  importTargetNoun = 'exam',
}: AIMagicImportModalProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedQuestions, setExtractedQuestions] = useState<AIQuestion[]>([]);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<AIQuestion | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep('upload');
    setSelectedFile(null);
    setExtractedQuestions([]);
    setEditIdx(null);
    setEditForm(null);
    setError('');
    setDragOver(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setSelectedFile(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleProcess = async () => {
    if (!selectedFile) return;
    setStep('processing');
    setError('');
    try {
      const res = await aiImportService.importFile(selectedFile);
      if (res.success && res.questions.length > 0) {
        setExtractedQuestions(res.questions);
        setStep('review');
      } else {
        setError(res.message || 'No questions could be extracted.');
        setStep('upload');
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } }; message?: string };
      const base =
        ax?.response?.data?.message ||
        ax?.message ||
        'Import failed. Please try again.';
      const isNetwork =
        /network|fetch|failed to load|access denied|ERR_/i.test(String(base));
      setError(
        isNetwork
          ? `${base} Thử tắt extension (ad block, FB AIO…), dùng cửa sổ ẩn danh, hoặc kiểm tra VPN/firewall.`
          : base
      );
      setStep('upload');
    }
  };

  const startEdit = (idx: number) => {
    setEditIdx(idx);
    setEditForm({ ...extractedQuestions[idx] });
  };

  const saveEdit = () => {
    if (editIdx !== null && editForm) {
      const updated = [...extractedQuestions];
      updated[editIdx] = editForm;
      setExtractedQuestions(updated);
    }
    setEditIdx(null);
    setEditForm(null);
  };

  const cancelEdit = () => {
    setEditIdx(null);
    setEditForm(null);
  };

  const deleteQuestion = (idx: number) => {
    setExtractedQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleConfirmImport = () => {
    onImport(extractedQuestions);
    setStep('done');
    setTimeout(() => handleClose(), 1200);
  };

  if (!isOpen) return null;

  const ACCEPTED = '.pdf,.docx,.jpg,.jpeg,.png';
  const fileName = selectedFile?.name || '';
  const fileSize = selectedFile
    ? `${(selectedFile.size / 1024 / 1024).toFixed(1)} MB`
    : '';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-8"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border-2 border-[#648777]/20 bg-white shadow-[0_20px_60px_-15px_rgba(36,55,45,0.25)] ring-1 ring-slate-900/[0.04]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-[#648777]/18 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#a78bfa] via-[#f472b6] to-[#fbbf24] shadow-md">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary sm:text-2xl">
                AI Smart Import
              </h2>
              <p className="text-sm text-text-secondary">
                Extract questions from PDF, DOCX, JPG, or PNG
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl p-2 text-text-secondary transition-colors hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* ─── STEP 1: Upload ─── */}
          {step === 'upload' && (
            <>
              {/* Drop zone */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`
                  relative flex flex-col items-center justify-center rounded-2xl border-2 p-10 cursor-pointer
                  transition-all duration-200
                  ${dragOver ? DRAG_ACTIVE_CLASS : DRAG_IDLE_CLASS}
                  hover:border-primary/50 hover:bg-primary/[0.05]
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED}
                  onChange={handleFileChange}
                  className="hidden"
                />

                {selectedFile ? (
                  <>
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
                      <CheckCircle2 className="h-7 w-7 text-primary" />
                    </div>
                    <p className="mb-1 text-base font-semibold text-text-primary">{fileName}</p>
                    <p className="text-sm text-text-secondary">{fileSize}</p>
                    <p className="mt-3 text-xs text-text-muted">Click to change file</p>
                  </>
                ) : (
                  <>
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#648777]/10">
                      <Upload className="h-7 w-7 text-primary" />
                    </div>
                    <p className="mb-1 text-base font-semibold text-text-primary">
                      Drop your file here, or <span className="text-primary underline">browse</span>
                    </p>
                    <p className="text-sm text-text-secondary">
                      PDF, DOCX, JPG, PNG supported · Max 20 MB
                    </p>
                  </>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleProcess}
                  disabled={!selectedFile}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#a78bfa] via-[#f472b6] to-[#fbbf24] px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <Wand2 className="h-4 w-4" />
                  Analyze with AI
                </button>
              </div>
            </>
          )}

          {/* ─── STEP 2: Processing ─── */}
          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-16">
              {/* Animated ring */}
              <div className="relative mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#a78bfa] via-[#f472b6] to-[#fbbf24] shadow-lg">
                  <Sparkles className="h-9 w-9 text-white" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-20 w-20 animate-ping rounded-full bg-gradient-to-br from-[#a78bfa] via-[#f472b6] to-[#fbbf24] opacity-20" />
                </div>
              </div>
              <h3 className="mb-2 text-xl font-bold text-text-primary">AI is analyzing…</h3>
              <p className="max-w-sm text-center text-sm text-text-secondary">
                {fileName ? `Processing "${fileName}" — extracting questions and answers` : 'Extracting questions and answers'}
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm text-text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                Gemini 2.5 Flash · PDF / DOCX / OCR
              </div>
            </div>
          )}

          {/* ─── STEP 3: Review ─── */}
          {step === 'review' && (
            <>
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className={sectionTitle}>Review Extracted Questions</h3>
                  <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                    {extractedQuestions.length} questions
                  </span>
                </div>

                {extractedQuestions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#648777]/35 bg-[#648777]/[0.04] py-10 text-center">
                    <AlertCircle className="mb-3 h-10 w-10 text-text-muted" />
                    <p className="text-sm font-medium text-text-primary">No questions extracted</p>
                    <p className="mt-1 text-xs text-text-secondary">Try a clearer document or add questions manually</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                    {extractedQuestions.map((q, idx) => (
                      <div key={idx} className={cardClass}>
                        {editIdx === idx && editForm ? (
                          /* Edit mode */
                          <div className="space-y-3">
                            <div>
                              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                Question {idx + 1}
                              </label>
                              <textarea
                                rows={2}
                                className={fieldClass}
                                value={editForm.question}
                                onChange={(e) => setEditForm({ ...editForm, question: e.target.value })}
                              />
                            </div>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {editForm.options.map((opt, oi) => (
                                <div key={oi} className="flex items-center gap-2">
                                  <span className="w-5 shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-center text-xs font-bold text-text-secondary">
                                    {String.fromCharCode(65 + oi)}
                                  </span>
                                  <input
                                    type="text"
                                    className={fieldClass}
                                    value={opt}
                                    onChange={(e) => {
                                      const opts = [...editForm.options];
                                      opts[oi] = e.target.value;
                                      setEditForm({ ...editForm, options: opts });
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                  Correct answer
                                </label>
                                <select
                                  className={fieldClass}
                                  value={editForm.correctAnswer}
                                  onChange={(e) => setEditForm({ ...editForm, correctAnswer: e.target.value })}
                                >
                                  <option value="">—</option>
                                  {editForm.options.map((_, oi) => (
                                    <option key={oi} value={String(oi)}>
                                      {String.fromCharCode(65 + oi)}. {editForm.options[oi] || '—'}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                  Points
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  className={fieldClass}
                                  value={editForm.points}
                                  onChange={(e) => setEditForm({ ...editForm, points: parseInt(e.target.value) || 1 })}
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={saveEdit}
                                className="flex-1 rounded-xl bg-primary py-2 text-sm font-semibold text-white hover:bg-primary-hover"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="flex-1 rounded-xl border border-border py-2 text-sm font-semibold text-text-secondary hover:bg-background"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* View mode */
                          <div className="flex items-start gap-3">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#648777]/10 text-xs font-bold text-primary">
                              {idx + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="mb-2 text-sm font-medium text-text-primary line-clamp-2">
                                {q.question}
                              </p>
                              <div className="mb-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                                {q.options.map((opt, oi) => {
                                  const isCorrect = String(q.correctAnswer) === String(oi);
                                  return (
                                    <div
                                      key={oi}
                                      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                                        isCorrect
                                          ? 'bg-success-light text-success border border-success/20'
                                          : 'bg-slate-50 text-text-secondary border border-slate-100'
                                      }`}
                                    >
                                      <span className="font-bold">{String.fromCharCode(65 + oi)}.</span>
                                      <span className="truncate">{opt || '—'}</span>
                                      {isCorrect && <CheckCircle2 className="ml-auto h-3.5 w-3.5 shrink-0" />}
                                    </div>
                                  );
                                })}
                              </div>
                              {q.explanation && (
                                <p className="mb-2 rounded-lg border border-info/20 bg-info/5 px-3 py-2 text-xs text-info">
                                  💡 {q.explanation}
                                </p>
                              )}
                              <div className="flex items-center gap-2">
                                <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
                                  {q.points} pt{q.points !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => startEdit(idx)}
                                className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-white text-text-secondary transition-colors hover:bg-background hover:text-text-primary"
                                title="Edit"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteQuestion(idx)}
                                className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500 transition-colors hover:bg-red-100"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-3">
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-xl border-2 border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-slate-50"
                >
                  Try another file
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={extractedQuestions.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-button hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Import {extractedQuestions.length} question{extractedQuestions.length !== 1 ? 's' : ''}
                </button>
              </div>
            </>
          )}

          {/* ─── STEP 4: Done ─── */}
          {step === 'done' && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-light">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-text-primary">Questions imported!</h3>
              <p className="text-sm text-text-secondary">
                {extractedQuestions.length} questions added to your {importTargetNoun}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
