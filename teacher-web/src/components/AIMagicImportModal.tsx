import { useState, useRef, useCallback } from 'react';
import { X, Sparkles, Loader2, CheckCircle2, Trash2, Edit3, AlertCircle, Wand2, FileImage, ImagePlus } from 'lucide-react';
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

const IMAGE_EXT = /\.(jpg|jpeg|png|webp)$/i;
const MAX_FILES = 50;

function isImageFile(f: File): boolean {
  return IMAGE_EXT.test(f.name) || /^image\/(jpeg|png|webp)$/i.test(f.type);
}

/** Đọc 1 file entry (Chrome khi kéo file/thư mục). */
function fileEntryToFile(entry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => {
    entry.file(resolve, reject);
  });
}

/** Đọc đệ quy thư mục từ drag-and-drop (webkit). */
async function readDirectoryEntry(dir: FileSystemDirectoryEntry): Promise<File[]> {
  const reader = dir.createReader();
  const out: File[] = [];
  // readEntries có thể trả nhiều lần; gọi đến khi mảng rỗng
  for (;;) {
    const batch = await new Promise<FileSystemEntry[]>((resolve, reject) => {
      reader.readEntries(resolve, reject);
    });
    if (batch.length === 0) break;
    for (const ent of batch) {
      if (ent.isFile) {
        try {
          out.push(await fileEntryToFile(ent as FileSystemFileEntry));
        } catch {
          /* bỏ qua file lỗi */
        }
      } else if (ent.isDirectory) {
        out.push(...(await readDirectoryEntry(ent as FileSystemDirectoryEntry)));
      }
    }
  }
  return out;
}

async function entryToFiles(entry: FileSystemEntry): Promise<File[]> {
  if (entry.isFile) {
    try {
      return [await fileEntryToFile(entry as FileSystemFileEntry)];
    } catch {
      return [];
    }
  }
  if (entry.isDirectory) {
    return readDirectoryEntry(entry as FileSystemDirectoryEntry);
  }
  return [];
}

function mergeUniqueFiles(prev: File[], incoming: File[]): File[] {
  const key = (f: File) =>
    `${f.webkitRelativePath || f.name}\0${f.size}\0${f.lastModified}`;
  const seen = new Set(prev.map(key));
  const added = incoming.filter((f) => {
    const k = key(f);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return [...prev, ...added];
}

interface FileError {
  fileName: string;
  message: string;
}

export default function AIMagicImportModal({
  isOpen,
  onClose,
  onImport,
  importTargetNoun = 'exam',
}: AIMagicImportModalProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [extractedQuestions, setExtractedQuestions] = useState<AIQuestion[]>([]);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<AIQuestion | null>(null);
  const [error, setError] = useState('');
  const [batchInfo, setBatchInfo] = useState<{ filesProcessed?: number; filesWithErrors?: number } | null>(null);
  const [fileErrors, setFileErrors] = useState<FileError[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep('upload');
    setSelectedFiles([]);
    setExtractedQuestions([]);
    setEditIdx(null);
    setEditForm(null);
    setError('');
    setDragOver(false);
    setBatchInfo(null);
    setFileErrors([]);
    setShowErrors(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dt = e.dataTransfer;
    const entries: FileSystemEntry[] = [];
    const looseFiles: File[] = [];

    if (dt.items?.length) {
      for (let i = 0; i < dt.items.length; i++) {
        const item = dt.items[i];
        if (item.kind !== 'file') continue;
        const wk = item as DataTransferItem & {
          webkitGetAsEntry?: () => FileSystemEntry | null;
        };
        const entry = typeof wk.webkitGetAsEntry === 'function' ? wk.webkitGetAsEntry() : null;
        if (entry) entries.push(entry);
        else {
          const f = item.getAsFile();
          if (f) looseFiles.push(f);
        }
      }
    }

    const applyMerge = (incoming: File[]) => {
      const imageFiles = incoming.filter(isImageFile);
      if (imageFiles.length === 0) return;
      setSelectedFiles((prev) => mergeUniqueFiles(prev, imageFiles).slice(0, MAX_FILES));
    };

    if (entries.length > 0) {
      void Promise.all(entries.map(entryToFiles))
        .then((chunks) => applyMerge([...looseFiles, ...chunks.flat()]))
        .catch(() => applyMerge([...looseFiles, ...Array.from(dt.files)]));
      return;
    }
    if (looseFiles.length > 0) {
      applyMerge(looseFiles);
      return;
    }
    applyMerge(Array.from(dt.files));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(isImageFile);
    if (imageFiles.length > 0) {
      setSelectedFiles((prev) => mergeUniqueFiles(prev, imageFiles).slice(0, MAX_FILES));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(isImageFile);
    if (imageFiles.length > 0) {
      setSelectedFiles((prev) => mergeUniqueFiles(prev, imageFiles).slice(0, MAX_FILES));
    }
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  const handleSelectFolder = (ev: React.MouseEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    folderInputRef.current?.click();
  };

  const handleProcess = async () => {
    if (selectedFiles.length === 0) return;
    setStep('processing');
    setError('');
    setFileErrors([]);
    setShowErrors(false);
    try {
      const res = await aiImportService.importFiles(selectedFiles);
      if (res.success && res.questions.length > 0) {
        setExtractedQuestions(res.questions);
        setBatchInfo({
          filesProcessed: res.filesProcessed,
          filesWithErrors: res.filesWithErrors,
        });
        // Capture errors from server if any
        if (res.errors && res.errors.length > 0) {
          setFileErrors(res.errors.map((e) => ({ fileName: e.file, message: e.message })));
        }
        setStep('review');
      } else {
        // Check if server returned errors in the response
        if (res.errors && res.errors.length > 0) {
          setFileErrors(res.errors.map((e) => ({ fileName: e.file, message: e.message })));
          setError(`Đã xử lý ${res.filesProcessed || selectedFiles.length} file. ${res.filesWithErrors || 0} file thất bại. Xem chi tiết bên dưới.`);
        } else {
          setError(res.message || 'Không trích xuất được câu hỏi nào.');
        }
        setStep('upload');
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string; errors?: { file: string; message: string }[] } }; message?: string };
      const base =
        ax?.response?.data?.message ||
        ax?.message ||
        'Import thất bại. Vui lòng thử lại.';
      // Capture errors from error response if available
      if (ax?.response?.data?.errors) {
        setFileErrors(ax.response.data.errors.map((e: { file: string; message: string }) => ({ fileName: e.file, message: e.message })));
      }
      const isNetwork =
        /network|fetch|failed to load|access denied|ERR_/i.test(String(base));
      setError(
        isNetwork
          ? `${base} Kiểm tra VPN/firewall hoặc dùng cửa sổ ẩn danh.`
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

  const ACCEPTED = '.jpg,.jpeg,.png,.webp';
  const hasFiles = selectedFiles.length > 0;
  const totalSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);
  const totalSizeLabel = totalSize >= 1024 * 1024
    ? `${(totalSize / 1024 / 1024).toFixed(1)} MB`
    : `${(totalSize / 1024).toFixed(0)} KB`;
  const isOverLimit = selectedFiles.length > 30;

  const processingLabel = selectedFiles.length > 1
    ? `Processing ${selectedFiles.length} images — extracting questions`
    : `Processing "${selectedFiles[0]?.name || ''}" — extracting questions`;

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
                Extract questions from multiple images
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
                  relative flex flex-col items-center justify-center rounded-2xl border-2 p-8 cursor-pointer
                  transition-all duration-200
                  ${dragOver ? DRAG_ACTIVE_CLASS : DRAG_IDLE_CLASS}
                  hover:border-primary/50 hover:bg-primary/[0.05]
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED}
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <input
                  ref={folderInputRef}
                  type="file"
                  multiple
                  onChange={handleFolderChange}
                  className="hidden"
                  {...({
                    webkitdirectory: '',
                    directory: '',
                  } as React.InputHTMLAttributes<HTMLInputElement>)}
                />

                {hasFiles ? (
                  <>
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
                      <FileImage className="h-7 w-7 text-primary" />
                    </div>
                    <p className="mb-1 text-base font-semibold text-text-primary">
                      {selectedFiles.length} image{selectedFiles.length !== 1 ? 's' : ''} selected
                    </p>
                    <p className="text-sm text-text-secondary">{totalSizeLabel}</p>
                    <p className="mt-2 text-xs text-text-muted">Click or drag to add more</p>
                  </>
                ) : (
                  <>
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#648777]/10">
                      <ImagePlus className="h-7 w-7 text-primary" />
                    </div>
                    <p className="mb-1 text-base font-semibold text-text-primary">
                      Drop images here, or <span className="text-primary underline">browse</span>
                    </p>
                    <p className="text-sm text-text-secondary">
                      JPG, PNG, WEBP · {selectedFiles.length === 0 ? 'Max 50 images at once' : 'Add more images'}
                    </p>
                  </>
                )}
              </div>

              {/* Folder + file buttons */}
              <div className="flex gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleSelectFolder}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-slate-50 hover:border-primary hover:text-primary transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  Select Folder
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-slate-50 hover:border-primary hover:text-primary transition-colors"
                >
                  <FileImage className="h-4 w-4" />
                  Select Files
                </button>
                {selectedFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllFiles}
                    className="flex items-center gap-2 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear All
                  </button>
                )}
              </div>

              {/* Selected files list */}
              {hasFiles && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2 max-h-40 overflow-y-auto">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileImage className="h-4 w-4 shrink-0 text-text-muted" />
                        <span className="text-sm text-text-primary truncate">{file.name}</span>
                        <span className="text-xs text-text-muted shrink-0">
                          ({(file.size / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                        className="rounded-lg p-1 text-text-muted hover:bg-red-50 hover:text-red-500 shrink-0"
                        title="Remove"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); clearAllFiles(); }}
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium mt-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    Clear all
                  </button>
                </div>
              )}

              {/* Limit note */}
              {isOverLimit && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    <strong>{selectedFiles.length} images selected</strong> — this may take several minutes and could timeout.
                    Consider splitting into batches of ~30 images for best results.
                  </span>
                </div>
              )}

              {!isOverLimit && (
                <div className="flex items-start gap-2 rounded-xl border border-[#648777]/20 bg-[#648777]/[0.05] px-4 py-3 text-xs text-text-secondary">
                  <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    <strong>Recommended: max 30 images per import</strong> for best performance.
                    Each image is processed by AI (Gemini) and may take 2–3 seconds.
                  </span>
                </div>
              )}

              {error && (
                <div className="space-y-2">
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {error}
                  </div>
                  {fileErrors.length > 0 && (
                    <div className="rounded-xl border border-red-300 bg-white overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setShowErrors(!showErrors)}
                        className="w-full flex items-center justify-between px-4 py-2 text-left bg-red-50 hover:bg-red-100 transition-colors"
                      >
                        <span className="text-xs font-semibold text-red-700">
                          Xem chi tiet {fileErrors.length} file that bai
                        </span>
                        <span className="text-xs text-red-500">{showErrors ? 'An' : 'Hien'} thi</span>
                      </button>
                      {showErrors && (
                        <div className="px-3 py-2 max-h-48 overflow-y-auto space-y-1">
                          {fileErrors.map((err, idx) => (
                            <div key={idx} className="text-xs p-2 bg-red-50 rounded border border-red-100">
                              <p className="font-semibold text-red-600">{err.fileName}</p>
                              <p className="text-red-500 mt-0.5 break-words">{err.message}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleProcess}
                  disabled={!hasFiles}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#a78bfa] via-[#f472b6] to-[#fbbf24] px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <Wand2 className="h-4 w-4" />
                  {selectedFiles.length > 1 ? `Analyze ${selectedFiles.length} images with AI` : 'Analyze with AI'}
                </button>
              </div>
            </>
          )}

          {/* ─── STEP 2: Processing ─── */}
          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#a78bfa] via-[#f472b6] to-[#fbbf24] shadow-lg">
                  <Sparkles className="h-9 w-9 text-white" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-20 w-20 animate-ping rounded-full bg-gradient-to-br from-[#a78bfa] via-[#f472b6] to-[#fbbf24] opacity-20" />
                </div>
              </div>
              <h3 className="mb-2 text-xl font-bold text-text-primary">AI is analyzing...</h3>
              <p className="max-w-sm text-center text-sm text-text-secondary">{processingLabel}</p>
              <p className="mt-3 max-w-md text-center text-xs text-text-muted leading-relaxed">
                First time after server sleeps may take <strong>1–3 minutes</strong> (Render cold start + Gemini).
                Please wait, do not close this window.
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm text-text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                Gemini 2.5 Flash · Vision OCR
              </div>
            </div>
          )}

          {/* ─── STEP 3: Review ─── */}
          {step === 'review' && (
            <>
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className={sectionTitle}>Review Extracted Questions</h3>
                  <div className="flex items-center gap-2">
                    {batchInfo && batchInfo.filesProcessed && (
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        {batchInfo.filesProcessed} files
                        {batchInfo.filesWithErrors ? ` (${batchInfo.filesWithErrors} errors)` : ''}
                      </span>
                    )}
                    <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                      {extractedQuestions.length} questions
                    </span>
                  </div>
                </div>

                {/* Error Details Section */}
                {fileErrors.length > 0 && (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowErrors(!showErrors)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-red-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <span className="text-sm font-semibold text-red-700">
                          {fileErrors.length} file{fileErrors.length !== 1 ? 's' : ''} failed to process
                        </span>
                      </div>
                      <span className="text-xs text-red-500">{showErrors ? 'Hide' : 'Show'} details</span>
                    </button>
                    {showErrors && (
                      <div className="px-4 pb-4 space-y-2">
                        {fileErrors.map((err, idx) => (
                          <div key={idx} className="bg-white rounded-lg border border-red-100 p-3">
                            <p className="text-xs font-semibold text-red-600 truncate">{err.fileName}</p>
                            <p className="text-xs text-red-500 mt-1">{err.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {extractedQuestions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#648777]/35 bg-[#648777]/[0.04] py-10 text-center">
                    <AlertCircle className="mb-3 h-10 w-10 text-text-muted" />
                    <p className="text-sm font-medium text-text-primary">No questions extracted</p>
                    <p className="mt-1 text-xs text-text-secondary">Try clearer images or add questions manually</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                    {extractedQuestions.map((q, idx) => (
                      <div key={idx} className={cardClass}>
                        {editIdx === idx && editForm ? (
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
                                  {q.explanation}
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
