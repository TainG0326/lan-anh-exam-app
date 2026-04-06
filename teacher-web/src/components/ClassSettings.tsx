import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Unlock, Save, Copy, Link2, Check } from 'lucide-react';
import SoftCard from './SoftCard';
import { Button, Input } from './SoftCard';
import toast from 'react-hot-toast';

interface ClassSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  classData: {
    id?: string;
    _id?: string;
    name: string;
    class_code: string;
    isLocked?: boolean;
  } | null;
  onSave: (settings: {
    name: string;
    class_code?: string;
    isLocked?: boolean;
  }) => Promise<void>;
  onDelete?: () => void;
}

// Custom Toggle Switch Component
const CustomToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void }> = ({ 
  checked, 
  onChange 
}) => {
  return (
    <label className="toggle-switch" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ display: 'none' }}
      />
      <div 
        className="toggle-switch-background"
        style={{
          backgroundColor: checked ? '#05c46b' : '#ddd',
          boxShadow: `inset 0 0 0 2px ${checked ? '#04b360' : '#ccc'}`,
        }}
      />
      <div 
        className="toggle-switch-handle"
        style={{
          transform: checked ? 'translateX(30px)' : 'translateX(2px)',
          boxShadow: checked 
            ? '0 2px 4px rgba(0, 0, 0, 0.2), 0 0 0 2px #05c46b'
            : '0 2px 4px rgba(0, 0, 0, 0.2)',
        }}
      />
    </label>
  );
};

const ClassSettings: React.FC<ClassSettingsProps> = ({
  isOpen,
  onClose,
  classData,
  onSave,
  onDelete
}) => {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    isLocked: false
  });

  React.useEffect(() => {
    if (classData) {
      setFormData({
        name: classData.name,
        isLocked: classData.isLocked || false
      });
    }
  }, [classData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (classData?.class_code) {
      navigator.clipboard.writeText(classData.class_code);
      setCopied(true);
      toast.success('Class code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/join/${classData?.class_code}`;
    navigator.clipboard.writeText(link);
    toast.success('Join link copied!');
  };

  if (!isOpen || !classData) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-md"
        >
          <SoftCard padding="none" className="overflow-hidden shadow-xl">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Cài đặt lớp học</h2>
                <p className="text-sm text-slate-500 mt-0.5">Quản lý thông tin lớp học</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Class Name */}
              <Input
                label="Tên lớp học"
                placeholder="e.g., English 10A"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />

              {/* Copy Class Code & Link */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-600">
                  Mã lớp & Link tham gia
                </label>
                
                {/* Copy Code */}
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 mb-1">Mã lớp</p>
                    <p className="font-mono font-semibold text-slate-700">
                      {classData.class_code || 'N/A'}
                    </p>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="p-2 rounded-lg hover:bg-white transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>

                {/* Copy Link */}
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <Link2 className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">Sao chép link tham gia</span>
                </button>
              </div>

              {/* Lock Class Toggle - Custom Design */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    formData.isLocked ? 'bg-green-100' : 'bg-slate-100'
                  }`}>
                    {formData.isLocked ? (
                      <Lock className="w-5 h-5 text-green-600" />
                    ) : (
                      <Unlock className="w-5 h-5 text-slate-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">Khóa lớp học</p>
                    <p className="text-sm text-slate-500">
                      {formData.isLocked ? 'Ngăn học sinh tham gia' : 'Cho phép học sinh tham gia'}
                    </p>
                  </div>
                </div>
                <CustomToggleSwitch
                  checked={formData.isLocked}
                  onChange={(checked) => setFormData({ ...formData, isLocked: checked })}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6">
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="flex-1"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  onClick={handleSubmit}
                  className="flex-1"
                >
                  <Save className="w-4 h-4" />
                  Lưu thay đổi
                </Button>
              </div>
            </div>
          </SoftCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ClassSettings;
