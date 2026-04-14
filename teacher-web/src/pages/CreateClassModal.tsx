import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/Dialog';
import { createClass } from '../services/classService';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateClassModal({ isOpen, onClose, onSuccess }: CreateClassModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    grade: 'THCS' as 'THCS' | 'THPT',
    level: '',
  });

  useEffect(() => {
    if (!isOpen) {
      setFormData({ name: '', grade: 'THCS', level: '' });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please enter class name');
      return;
    }
    if (!formData.level.trim()) {
      toast.error('Please select grade level');
      return;
    }

    setLoading(true);
    try {
      await createClass(formData);
      toast.success('Class created successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create class');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Tạo Lớp Học Mới</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Class Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên lớp học <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Tiếng Anh 10A, Luyện ngữ pháp nâng cao..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Grade & Level */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bậc học <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm"
                value={formData.grade}
                onChange={(e) => {
                  setFormData({ ...formData, grade: e.target.value as 'THCS' | 'THPT', level: '' });
                }}
              >
                <option value="THCS">THCS</option>
                <option value="THPT">THPT</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Khối lớp <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              >
                <option value="">Chọn khối</option>
                {formData.grade === 'THCS' ? (
                  <>
                    <option value="6">Lớp 6</option>
                    <option value="7">Lớp 7</option>
                    <option value="8">Lớp 8</option>
                    <option value="9">Lớp 9</option>
                  </>
                ) : (
                  <>
                    <option value="10">Lớp 10</option>
                    <option value="11">Lớp 11</option>
                    <option value="12">Lớp 12</option>
                  </>
                )}
              </select>
            </div>
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
              ) : 'Tạo Lớp Học'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
