import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getClassById, updateClass, removeStudentFromClass } from '../services/classService';
import { ArrowLeft, Users, BookOpen, GraduationCap, Copy, Check, Pencil, Trash2, Lock, Unlock, X } from 'lucide-react';
import toast from 'react-hot-toast';
import BookLoader from '../components/BookLoader';

export default function ClassDetail() {
  const { id } = useParams<{ id: string }>();
  const [classData, setClassData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', grade: '', level: '', is_locked: false });
  const [saving, setSaving] = useState(false);

  const [showRemoveConfirm, setShowRemoveConfirm] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removingStudentName, setRemovingStudentName] = useState('');

  useEffect(() => {
    if (id) {
      loadClass();
    }
  }, [id]);

  const loadClass = async () => {
    try {
      const data = await getClassById(id!);
      setClassData(data);
    } catch (error: any) {
      toast.error('Failed to load class details');
    } finally {
      setLoading(false);
    }
  };

  const copyClassCode = () => {
    if (classData?.class_code) {
      navigator.clipboard.writeText(classData.class_code);
      setCopied(true);
      toast.success('Class code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openEditModal = () => {
    setEditForm({
      name: classData.name || '',
      grade: classData.grade || 'THCS',
      level: classData.level || '',
      is_locked: classData.is_locked || false,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editForm.name.trim()) {
      toast.error('Tên lớp không được để trống');
      return;
    }

    setSaving(true);
    try {
      const result = await updateClass(id!, {
        name: editForm.name,
        grade: editForm.grade,
        level: editForm.level,
        is_locked: editForm.is_locked,
      });
      if (result.success) {
        setClassData(result.class);
        setShowEditModal(false);
        toast.success('Cập nhật lớp học thành công!');
      }
    } catch (error: any) {
      const serverMessage = error.response?.data?.message;
      const serverDetail = error.response?.data;
      console.error('[ClassDetail] updateClass error:', serverDetail);
      const message = serverMessage || 'Không thể cập nhật lớp học';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const confirmRemoveStudent = (studentId: string) => {
    const student = classData.students.find(
      (s: any) => (s.id || s._id) === studentId
    );
    setRemovingStudentName(student?.name || 'học sinh này');
    setShowRemoveConfirm(studentId);
  };

  const handleRemoveStudent = async (studentId: string) => {
    setRemoving(true);
    try {
      const result = await removeStudentFromClass(id!, studentId);
      if (result.success) {
        setClassData((prev: any) => ({
          ...prev,
          students: prev.students.filter(
            (s: any) => (s.id || s._id) !== studentId
          ),
        }));
        setShowRemoveConfirm(null);
        toast.success('Đã xóa học sinh khỏi lớp');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Không thể xóa học sinh';
      toast.error(message);
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <BookLoader />
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="text-center py-20">
        <p className="text-text-secondary">Class not found</p>
        <Link to="/classes" className="text-primary hover:underline mt-4 inline-block">
          Back to Classes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <Link
          to="/classes"
          className="inline-flex items-center text-[#5F8D78] hover:text-[#4A6F5E] mb-4 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại danh sách lớp
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1A2E1F] tracking-tighter mb-2">
              {classData.name}
            </h1>
            <p className="text-[#4A5568] text-base">
              {classData.grade} — Khối {classData.level}
              {classData.is_locked && (
                <span className="ml-2 inline-flex items-center text-red-500 text-sm font-semibold">
                  <Lock className="w-3.5 h-3.5 mr-1" />
                  Đã khóa
                </span>
              )}
            </p>
          </div>
          <button
            onClick={openEditModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#5F8D78] to-[#4A6F5E] hover:from-[#4A6F5E] hover:to-[#3D5C4E] text-white text-sm font-semibold rounded-xl shadow-md shadow-[#5F8D78]/20 transition-all"
          >
            <Pencil className="w-4 h-4" />
            Chỉnh sửa
          </button>
        </div>
      </div>

      {/* Class Info Card */}
      <div className="bg-white/30 backdrop-blur-sm rounded-3xl border border-white/40 shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#5F8D78]/10 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-[#5F8D78]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#6B7F75] mb-1">Tên lớp</p>
              <p className="text-lg font-bold text-[#1A2E1F]">{classData.name}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#6B7F75] mb-1">Bậc học & Khối</p>
              <p className="text-lg font-bold text-[#1A2E1F]">
                {classData.grade} — Khối {classData.level}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#6B7F75] mb-1">Số học sinh</p>
              <p className="text-lg font-bold text-[#1A2E1F]">
                {classData.students?.length || 0} học sinh
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Copy className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#6B7F75] mb-1">Mã lớp</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-mono font-bold text-[#1A2E1F]">
                  {classData.class_code || 'N/A'}
                </p>
                {classData.class_code && (
                  <button
                    onClick={copyClassCode}
                    className="p-1.5 hover:bg-[#5F8D78]/10 rounded-lg transition-colors"
                    title="Sao chép mã lớp"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-[#6B7F75]" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="bg-white/30 backdrop-blur-sm rounded-3xl border border-white/40 shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-white/30 bg-white/20">
          <h2 className="text-xl font-bold text-[#1A2E1F] tracking-tight">Danh sách học sinh</h2>
        </div>
        {classData.students && classData.students.length > 0 ? (
          <div className="divide-y divide-white/20">
            {classData.students.map((student: any, index: number) => (
              <div
                key={student.id || student._id || index}
                className="px-6 py-4 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5F8D78] to-[#4A6F5E] flex items-center justify-center shadow-sm">
                      <span className="text-white font-bold text-sm">
                        {student.name?.charAt(0)?.toUpperCase() || 'S'}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-[#1A2E1F]">{student.name || 'Không rõ'}</p>
                      <p className="text-sm text-[#6B7F75]">{student.email || ''}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => confirmRemoveStudent(student.id || student._id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="Xóa khỏi lớp"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-[#9CB3A6] mx-auto mb-3" />
            <p className="text-[#4A5568] font-medium">Chưa có học sinh trong lớp</p>
            <p className="text-sm text-[#9CB3A6] mt-1">
              Học sinh có thể tham gia bằng mã lớp ở trên
            </p>
          </div>
        )}
      </div>

      {/* Edit Class Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]" onClick={() => setShowEditModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-fade-in overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-[#1A2E1F]">Chỉnh sửa lớp học</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[#6B7F75]" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#1A2E1F] mb-1.5">
                  Tên lớp
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5F8D78]/30 focus:border-[#5F8D78] transition-all text-[#1A2E1F] bg-white"
                  placeholder="Nhập tên lớp"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1A2E1F] mb-1.5">
                  Bậc học
                </label>
                <select
                  value={editForm.grade}
                  onChange={(e) => setEditForm({ ...editForm, grade: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5F8D78]/30 focus:border-[#5F8D78] transition-all bg-white text-[#1A2E1F]"
                >
                  <option value="THCS">THCS (Trung học cơ sở)</option>
                  <option value="THPT">THPT (Trung học phổ thông)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1A2E1F] mb-1.5">
                  Khối lớp
                </label>
                <select
                  value={editForm.level}
                  onChange={(e) => setEditForm({ ...editForm, level: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5F8D78]/30 focus:border-[#5F8D78] transition-all bg-white text-[#1A2E1F]"
                >
                  {editForm.grade === 'THCS' ? (
                    <>
                      <option value="6">Khối 6</option>
                      <option value="7">Khối 7</option>
                      <option value="8">Khối 8</option>
                      <option value="9">Khối 9</option>
                    </>
                  ) : (
                    <>
                      <option value="10">Khối 10</option>
                      <option value="11">Khối 11</option>
                      <option value="12">Khối 12</option>
                    </>
                  )}
                </select>
              </div>

              <div className="flex items-center justify-between py-3 px-4 bg-[#F0F5F3] rounded-xl border border-[#DCE6E1]">
                <div className="flex items-center gap-3">
                  {editForm.is_locked ? (
                    <Lock className="w-5 h-5 text-red-500" />
                  ) : (
                    <Unlock className="w-5 h-5 text-[#5F8D78]" />
                  )}
                  <div>
                    <p className="font-semibold text-[#1A2E1F]">Khóa lớp học</p>
                    <p className="text-xs text-[#6B7F75]">
                      {editForm.is_locked ? 'Ngăn học sinh tham gia' : 'Cho phép học sinh tham gia'}
                    </p>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={editForm.is_locked}
                    onChange={(e) => setEditForm({ ...editForm, is_locked: e.target.checked })}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-[#6B7F75] hover:bg-gray-100 rounded-xl transition-colors font-medium"
                disabled={saving}
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="px-5 py-2 bg-gradient-to-r from-[#5F8D78] to-[#4A6F5E] hover:from-[#4A6F5E] hover:to-[#3D5C4E] text-white font-semibold rounded-xl transition-all shadow-md shadow-[#5F8D78]/20 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  'Lưu thay đổi'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Student Confirmation Modal */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]" onClick={() => setShowRemoveConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 animate-fade-in overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-red-100">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-[#1A2E1F] mb-2">Xóa học sinh</h3>
              <p className="text-[#4A5568] mb-1">
                Bạn có chắc chắn muốn xóa
              </p>
              <p className="text-[#1A2E1F] font-semibold mb-4">
                "{removingStudentName}"
              </p>
              <p className="text-sm text-[#9CB3A6] mb-6">
                khỏi lớp này? Hành động này không thể hoàn tác.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowRemoveConfirm(null)}
                  disabled={removing}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-[#4A5568] hover:bg-gray-50 rounded-xl transition-colors font-semibold"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleRemoveStudent(showRemoveConfirm)}
                  disabled={removing}
                  className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors font-semibold shadow-md shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {removing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang xóa...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Xóa
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
