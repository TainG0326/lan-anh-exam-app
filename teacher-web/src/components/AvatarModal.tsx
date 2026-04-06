import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Image, Trash2, X, Upload, Check, Loader2 } from 'lucide-react';

interface AvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
  uploading?: boolean;
}

export default function AvatarModal({
  isOpen,
  onClose,
  currentAvatar,
  onUpload,
  onRemove,
  uploading = false
}: AvatarModalProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleFileSelect = useCallback((file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('Image size must be less than 50MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      alert('Please select an image first');
      return;
    }

    setIsUploading(true);
    try {
      await onUpload(file);
      setPreview(null);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCameraCapture = () => {
    const input = cameraInputRef.current;
    if (input) {
      input.click();
    }
  };

  const handleCameraFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
      // Also update the main file input for upload
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInputRef.current.files = dataTransfer.files;
      }
    }
  };

  const handleRemove = async () => {
    setIsUploading(true);
    try {
      await onRemove();
      setPreview(null);
      onClose();
    } catch (error) {
      console.error('Remove failed:', error);
      alert('Failed to remove avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileSelect(file);
      // Update file input
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInputRef.current.files = dataTransfer.files;
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const resetPreview = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (!isUploading && !uploading) {
      resetPreview();
      onClose();
    }
  };

  const isLoading = isUploading || uploading;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md animate-fade-in-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Profile Picture</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* Current/Preview Avatar */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              {(preview || currentAvatar) ? (
                <img
                  src={preview || currentAvatar || undefined}
                  alt="Avatar preview"
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-lg">
                  <Camera className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                </div>
              )}

              {/* Loading overlay */}
              {isLoading && (
                <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Hidden File Inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraFileSelect}
            className="hidden"
            disabled={isLoading}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
            className="hidden"
            disabled={isLoading}
          />

          {/* Upload Area */}
          {!preview ? (
            <div className="space-y-4">
              {/* Drag & Drop Area - Desktop only */}
              {!isMobile && (
                <div
                  className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
                    dragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                      <Upload className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                    </div>
                    <p className="text-sm font-medium text-slate-700 mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-slate-500">
                      PNG, JPG up to 5MB
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                {/* Gallery Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-primary/10 text-primary rounded-xl font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
                >
                  <Image className="w-5 h-5" />
                  <span>Gallery</span>
                </button>

                {/* Camera Button - Mobile only */}
                {isMobile && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCameraCapture();
                    }}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Camera</span>
                  </button>
                )}

                {/* Upload Button - Desktop only */}
                {!isMobile && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary to-primary-hover text-white rounded-xl font-medium hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50"
                  >
                    <Upload className="w-5 h-5" />
                    <span>Upload</span>
                  </button>
                )}

                {/* Remove Button */}
                {currentAvatar && (
                  <button
                    onClick={handleRemove}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-500 rounded-xl font-medium hover:bg-red-100 transition-colors disabled:opacity-50 col-span-2 sm:col-span-1"
                  >
                    <Trash2 className="w-5 h-5" />
                    Remove
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Preview Actions */
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    resetPreview();
                  }}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary to-primary-hover text-white rounded-xl font-medium hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Check className="w-5 h-5" />
                  )}
                  Save
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 bg-slate-50 border-t border-slate-100">
          <p className="text-xs text-slate-500 text-center">
            For best results, use a square image at least 200x200 pixels.
          </p>
        </div>
      </div>
    </div>
  );
}
