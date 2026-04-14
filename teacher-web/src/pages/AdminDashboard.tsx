import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Users, Shield, Mail, Trash2, Plus, RefreshCw, Check, X, UserPlus } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface WhitelistEntry {
  id: string;
  email: string;
  name?: string;
  is_active: boolean;
  role?: string;
  created_at: string;
  updated_at: string;
}

interface UserEntry {
  id: string;
  email: string;
  name: string;
  role: string;
  student_id?: string;
  avatar_url?: string;
  two_factor_enabled: boolean;
  created_at: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'whitelist' | 'users'>('whitelist');
  const [whitelistType, setWhitelistType] = useState<'teacher' | 'student'>('teacher');
  
  // Whitelist state
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Users state
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [userFilter, setUserFilter] = useState<'all' | 'teacher' | 'student'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [stats, setStats] = useState({ teachers: 0, students: 0, total: 0 });

  // Check if admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast.error('Bạn không có quyền truy cập trang này');
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch whitelist
  const fetchWhitelist = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/auth/whitelist?type=${whitelistType}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        if (whitelistType === 'teacher') {
          setWhitelist(data.teacherWhitelist || []);
        } else {
          setWhitelist(data.studentWhitelist || []);
        }
      } else {
        toast.error(data.message || 'Không thể tải danh sách whitelist');
      }
    } catch (error) {
      toast.error('Không thể kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        role: userFilter,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await fetch(`${API_URL}/auth/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users || []);
        setPagination(data.pagination || pagination);
        setStats(data.stats || stats);
      } else {
        toast.error(data.message || 'Không thể tải danh sách người dùng');
      }
    } catch (error) {
      toast.error('Không thể kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'whitelist') {
      fetchWhitelist();
    } else {
      fetchUsers();
    }
  }, [activeTab, whitelistType, userFilter, pagination.page, searchQuery]);

  // Add to whitelist
  const handleAddWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) {
      toast.error('Vui lòng nhập email');
      return;
    }
    
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/auth/whitelist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: newEmail,
          name: newName,
          role: whitelistType,
        }),
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message || 'Đã thêm vào whitelist');
        setNewEmail('');
        setNewName('');
        setShowAddModal(false);
        fetchWhitelist();
      } else {
        toast.error(data.message || 'Không thể thêm vào whitelist');
      }
    } catch (error) {
      toast.error('Không thể kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete from whitelist
  const handleDeleteWhitelist = async (email: string) => {
    if (!confirm(`Bạn có chắc muốn xóa "${email}" khỏi whitelist?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/auth/whitelist`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email, role: whitelistType }),
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message || 'Đã xóa khỏi whitelist');
        fetchWhitelist();
      } else {
        toast.error(data.message || 'Không thể xóa khỏi whitelist');
      }
    } catch (error) {
      toast.error('Không thể kết nối máy chủ');
    }
  };

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Quản trị hệ thống</h1>
            <button
              onClick={() => navigate('/')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Quay lại Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tổng người dùng</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Giáo viên</p>
                <p className="text-2xl font-bold text-gray-900">{stats.teachers}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Học sinh</p>
                <p className="text-2xl font-bold text-gray-900">{stats.students}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('whitelist')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'whitelist'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Shield className="inline-block h-4 w-4 mr-2" />
                Quản lý Whitelist
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="inline-block h-4 w-4 mr-2" />
                Quản lý Người dùng
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Whitelist Tab */}
            {activeTab === 'whitelist' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setWhitelistType('teacher')}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        whitelistType === 'teacher'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Giáo viên
                    </button>
                    <button
                      onClick={() => setWhitelistType('student')}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        whitelistType === 'student'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Học sinh
                    </button>
                  </div>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm email
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  </div>
                ) : whitelist.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Chưa có email nào trong whitelist</p>
                    <p className="text-sm mt-1">Click "Thêm email" để bắt đầu</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tên
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Trạng thái
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ngày tạo
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Hành động
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {whitelist.map((entry) => (
                          <tr key={entry.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Mail className="h-5 w-5 text-gray-400 mr-3" />
                                <span className="text-sm font-medium text-gray-900">{entry.email}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {entry.name || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {entry.is_active ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <Check className="h-3 w-3 mr-1" />
                                  Hoạt động
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  <X className="h-3 w-3 mr-1" />
                                  Không hoạt động
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(entry.created_at).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                              <button
                                onClick={() => handleDeleteWhitelist(entry.email)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => { setUserFilter('all'); setPagination(p => ({ ...p, page: 1 })); }}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        userFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      Tất cả
                    </button>
                    <button
                      onClick={() => { setUserFilter('teacher'); setPagination(p => ({ ...p, page: 1 })); }}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        userFilter === 'teacher' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      Giáo viên
                    </button>
                    <button
                      onClick={() => { setUserFilter('student'); setPagination(p => ({ ...p, page: 1 })); }}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        userFilter === 'student' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      Học sinh
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Tìm kiếm email, tên..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Không tìm thấy người dùng</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Người dùng
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Vai trò
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            2FA
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ngày đăng ký
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((u) => (
                          <tr key={u.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {u.avatar_url ? (
                                  <img src={u.avatar_url} alt="" className="h-10 w-10 rounded-full mr-3" />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                                    <span className="text-gray-500 font-medium">{u.name.charAt(0)}</span>
                                  </div>
                                )}
                                <span className="text-sm font-medium text-gray-900">{u.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {u.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                u.role === 'teacher' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                              }`}>
                                {u.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {u.two_factor_enabled ? (
                                <span className="inline-flex items-center text-green-600">
                                  <Check className="h-4 w-4" />
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-gray-400">
                                  <X className="h-4 w-4" />
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(u.created_at).toLocaleDateString('vi-VN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-500">
                      Trang {pagination.page} / {pagination.totalPages} - Tổng: {pagination.total}
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                        disabled={pagination.page <= 1}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                      >
                        Trước
                      </button>
                      <button
                        onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                        disabled={pagination.page >= pagination.totalPages}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Whitelist Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Thêm email vào whitelist</h2>
            <form onSubmit={handleAddWhitelist}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="email@example.com"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên (tùy chọn)
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Tên người dùng"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại tài khoản
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="whitelistType"
                      value="teacher"
                      checked={whitelistType === 'teacher'}
                      onChange={() => setWhitelistType('teacher')}
                      className="mr-2"
                    />
                    Giáo viên
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="whitelistType"
                      value="student"
                      checked={whitelistType === 'student'}
                      onChange={() => setWhitelistType('student')}
                      className="mr-2"
                    />
                    Học sinh
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50"
                >
                  {submitting ? 'Đang thêm...' : 'Thêm vào whitelist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
