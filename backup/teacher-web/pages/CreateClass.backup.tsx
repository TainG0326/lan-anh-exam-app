import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClass, Class } from '../services/classService';
import { ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CreateClass() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    grade: 'THCS' as 'THCS' | 'THPT',
    level: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên lớp');
      return;
    }
    if (!formData.level.trim()) {
      toast.error('Vui lòng nhập khối lớp');
      return;
    }

    setLoading(true);
    try {
      await createClass(formData);
      toast.success('Tạo lớp thành công!');
      navigate('/classes');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Tạo lớp thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-0">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-3 mb-3">
          <button
            type="button"
            onClick={() => navigate('/classes')}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </button>
          <span className="text-sm text-gray-500">Quay lại danh sách lớp học</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tạo Lớp Học Mới</h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600">
          Tạo lớp học mới để quản lý học sinh và bài tập
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-4 sm:p-6 space-y-5">
        {/* Class Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tên lớp học <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="VD: Tiếng Anh 10A, Luyện ngữ pháp nâng cao..."
            className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm sm:text-base"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        {/* Grade & Level */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bậc học <span className="text-red-500">*</span>
            </label>
            <select
              required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm sm:text-base"
              value={formData.grade}
              onChange={(e) => setFormData({ ...formData, grade: e.target.value as 'THCS' | 'THPT' })}
            >
              <option value="THCS">THCS (Trung học cơ sở)</option>
              <option value="THPT">THPT (Trung học phổ thông)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Khối lớp <span className="text-red-500">*</span>
            </label>
            <select
              required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm sm:text-base"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value })}
            >
              <option value="">Chọn khối lớp</option>
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

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/classes')}
            className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang tạo...
              </>
            ) : 'Tạo Lớp Học'}
          </button>
        </div>
      </form>
    </div>
  );
}
