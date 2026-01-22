# 🎨 Code UI/UX Student Web - Tổng hợp

## 📁 Cấu trúc Files

### 1. **CSS Global** (`student-web/src/index.css`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

body {
  margin: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}

/* Custom animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}

.animate-slide-in {
  animation: slideIn 0.3s ease-out;
}

/* Gradient backgrounds */
.gradient-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.gradient-success {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.gradient-warning {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.gradient-info {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

/* Card hover effects */
.card-hover {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

/* Glass morphism effect */
.glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

/* Prevent text selection during exam */
.exam-mode {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.exam-mode * {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
```

---

### 2. **Layout Component** (`student-web/src/components/Layout.tsx`)

```tsx
import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout } from '../services/authService';
import { LayoutDashboard, FileText, BookOpen, LogOut, Menu, X, Users } from 'lucide-react';

export default function Layout() {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/join-class', label: 'Tham gia lớp', icon: Users },
    { path: '/exams', label: 'Kỳ thi', icon: FileText },
    { path: '/assignments', label: 'Bài tập', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50">
      <nav className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-sm">S</span>
                  </div>
                  <h1 className="text-lg sm:text-xl font-bold text-slate-700">
                    Student Portal
                  </h1>
                </div>
              </div>
              {/* Desktop Navigation */}
              <div className="hidden sm:ml-8 sm:flex sm:space-x-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-emerald-500 text-white shadow-md'
                          : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-600'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
            {/* Desktop User Menu */}
            <div className="hidden sm:flex sm:items-center sm:space-x-4">
              <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-slate-50">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm">
                  <span className="text-white font-semibold text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-slate-700">{user?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 hover:shadow-md transition-all duration-200"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">Đăng xuất</span>
              </button>
            </div>
            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                {mobileMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1 border-t border-gray-200">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-2 text-base font-medium rounded-r-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-emerald-500 text-white shadow-md border-l-4 border-emerald-600'
                        : 'border-transparent text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 border-l-4 border-transparent hover:border-emerald-300'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Link>
                );
              })}
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="flex items-center px-4 py-3 bg-slate-50 rounded-lg mx-2 mb-3">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md">
                      <span className="text-white font-semibold text-lg">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="text-base font-semibold text-slate-800">{user?.name}</div>
                    <div className="text-sm text-slate-500">{user?.email}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1 px-2">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 text-base font-medium text-gray-700 bg-white rounded-lg hover:bg-gray-50 hover:shadow-md transition-all duration-200"
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    Đăng xuất
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
```

---

### 3. **Dashboard Page** (`student-web/src/pages/Dashboard.tsx`)

```tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getExams } from '../services/examService';
import { FileText, Clock, CheckCircle, TrendingUp, Award, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function Dashboard() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const data = await getExams();
      setExams(data);
    } catch (error: any) {
      toast.error('Lỗi khi tải danh sách kỳ thi');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-emerald-400 h-12 w-12"></div>
        </div>
      </div>
    );
  }

  const upcomingExams = exams.filter(
    (exam) => new Date(exam.startTime) > new Date() && exam.status === 'draft'
  );
  const activeExams = exams.filter((exam) => exam.status === 'active');
  const completedExams = exams.filter((exam) => exam.status === 'completed');

  const stats = [
    {
      title: 'Kỳ thi sắp tới',
      value: upcomingExams.length,
      icon: Clock,
      color: 'from-amber-400 to-orange-400',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
    },
    {
      title: 'Đang diễn ra',
      value: activeExams.length,
      icon: TrendingUp,
      color: 'from-emerald-400 to-teal-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
    },
    {
      title: 'Đã hoàn thành',
      value: completedExams.length,
      icon: Award,
      color: 'from-sky-400 to-cyan-500',
      bgColor: 'bg-sky-50',
      textColor: 'text-sky-700',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 p-8 text-white shadow-xl">
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Chào mừng trở lại! 👋
          </h1>
          <p className="text-emerald-50 text-lg">
            Sẵn sàng cho những thử thách mới hôm nay?
          </p>
        </div>
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="card-hover bg-white rounded-xl p-6 shadow-lg border border-gray-100 animate-slide-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Exams */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-400 to-orange-400 px-6 py-4">
            <div className="flex items-center">
              <Clock className="w-6 h-6 text-white mr-3" />
              <h2 className="text-xl font-bold text-white">Kỳ thi sắp tới</h2>
            </div>
          </div>
          <div className="p-6">
            {upcomingExams.length > 0 ? (
              <div className="space-y-4">
                {upcomingExams.slice(0, 5).map((exam, index) => (
                  <div
                    key={exam._id || exam.id}
                    className="card-hover p-4 rounded-lg border border-amber-200 bg-amber-50"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-md">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <p className="text-base font-semibold text-gray-900 mb-1">{exam.title}</p>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>{format(new Date(exam.startTime), 'dd/MM/yyyy HH:mm')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Chưa có kỳ thi sắp tới</p>
                <p className="text-sm text-gray-400 mt-1">Hãy kiểm tra lại sau nhé!</p>
              </div>
            )}
          </div>
        </div>

        {/* Active Exams */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-400 to-teal-500 px-6 py-4">
            <div className="flex items-center">
              <TrendingUp className="w-6 h-6 text-white mr-3" />
              <h2 className="text-xl font-bold text-white">Kỳ thi đang diễn ra</h2>
            </div>
          </div>
          <div className="p-6">
            {activeExams.length > 0 ? (
              <div className="space-y-4">
                {activeExams.map((exam, index) => (
                  <Link
                    key={exam._id || exam.id}
                    to={`/exams/take/${exam.examCode}`}
                    className="block"
                  >
                    <div
                      className="card-hover p-4 rounded-lg border-2 border-emerald-200 bg-emerald-50 hover:border-emerald-400 transition-all duration-200"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md animate-pulse">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div className="ml-4 flex-1 min-w-0">
                          <p className="text-base font-semibold text-gray-900 mb-1">{exam.title}</p>
                          <div className="flex items-center space-x-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                              Đang diễn ra
                            </span>
                            <span className="text-sm text-gray-600 font-mono">{exam.examCode}</span>
                          </div>
                        </div>
                        <div className="ml-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                            <span className="text-white text-sm">→</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Không có kỳ thi đang diễn ra</p>
                <p className="text-sm text-gray-400 mt-1">Hãy chờ giáo viên mở kỳ thi mới</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Thao tác nhanh</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/join-class"
            className="card-hover p-4 rounded-lg border-2 border-sky-200 bg-sky-50 hover:border-sky-400 transition-all duration-200"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center shadow-md mr-4">
                <span className="text-white text-xl">👥</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Tham gia lớp học</p>
                <p className="text-sm text-gray-600">Nhập mã lớp để tham gia</p>
              </div>
            </div>
          </Link>
          <Link
            to="/exams"
            className="card-hover p-4 rounded-lg border-2 border-teal-200 bg-teal-50 hover:border-teal-400 transition-all duration-200"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-md mr-4">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Xem tất cả kỳ thi</p>
                <p className="text-sm text-gray-600">Danh sách đầy đủ các kỳ thi</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
```

---

### 4. **JoinClass Page** (`student-web/src/pages/JoinClass.tsx`)

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinClassByCode } from '../services/classService';
import toast from 'react-hot-toast';
import { Users, Key, Sparkles } from 'lucide-react';

export default function JoinClass() {
  const [classCode, setClassCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classCode.trim()) {
      toast.error('Vui lòng nhập mã lớp');
      return;
    }

    setLoading(true);
    try {
      const response = await joinClassByCode(classCode.toUpperCase());
      if (response.success) {
        toast.success(response.message || 'Tham gia lớp thành công!');
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Mã lớp không hợp lệ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mr-4 shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold">Tham gia lớp học</h2>
                <p className="text-emerald-50 mt-1">Kết nối với lớp học của bạn</p>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        </div>

        {/* Form */}
        <div className="p-6 sm:p-8">
          <div className="mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                <Key className="w-10 h-10 text-emerald-600" />
              </div>
            </div>
            <p className="text-center text-gray-600 mb-2">
              Nhập mã lớp do giáo viên cung cấp
            </p>
            <p className="text-center text-sm text-gray-500">
              Mã lớp thường có 6 ký tự (VD: ABC123)
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mã lớp học
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Key className="w-5 h-5 text-emerald-500" />
                </div>
                <input
                  type="text"
                  className="w-full pl-12 pr-4 py-4 text-lg font-mono text-center border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                  placeholder="ABC123"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  maxLength={10}
                  required
                  autoFocus
                />
              </div>
              {classCode && (
                <p className="mt-2 text-sm text-gray-500 text-center">
                  Mã lớp: <span className="font-mono font-bold text-emerald-600">{classCode}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !classCode.trim()}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Đang tham gia...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Tham gia lớp học ngay
                </>
              )}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-8 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <p className="text-sm text-emerald-800 text-center">
              💡 <strong>Mẹo:</strong> Mã lớp thường được giáo viên chia sẻ qua email hoặc trong lớp học
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### 5. **Exams Page** (`student-web/src/pages/Exams.tsx`)

```tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getExams } from '../services/examService';
import { FileText, Clock, Key, ArrowRight, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function Exams() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [examCode, setExamCode] = useState('');

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const data = await getExams();
      setExams(data);
    } catch (error: any) {
      toast.error('Lỗi khi tải danh sách kỳ thi');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterCode = () => {
    if (examCode.trim()) {
      window.location.href = `/exams/take/${examCode.trim().toUpperCase()}`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-emerald-400 h-12 w-12"></div>
        </div>
      </div>
    );
  }

  const now = new Date();
  const availableExams = exams.filter(
    (exam) =>
      exam.status === 'active' &&
      new Date(exam.startTime) <= now &&
      new Date(exam.endTime) >= now
  );

  const upcomingExams = exams.filter(
    (exam) => new Date(exam.startTime) > now && exam.status === 'draft'
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-400 via-cyan-400 to-teal-400 p-8 text-white shadow-xl">
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Kỳ thi của tôi 📝</h1>
          <p className="text-sky-50 text-lg">Tham gia và hoàn thành các kỳ thi</p>
        </div>
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      </div>

      {/* Quick Enter Code */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center shadow-lg mr-4">
            <Key className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Nhập mã kỳ thi</h2>
            <p className="text-sm text-gray-600">Có mã thi từ giáo viên? Nhập ngay!</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Key className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Nhập mã kỳ thi (VD: ABC123)"
              className="w-full pl-12 pr-4 py-3 text-lg font-mono border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
              value={examCode}
              onChange={(e) => setExamCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              onKeyPress={(e) => e.key === 'Enter' && handleEnterCode()}
              maxLength={10}
            />
          </div>
          <button
            onClick={handleEnterCode}
            disabled={!examCode.trim()}
            className="px-8 py-3 bg-gradient-to-r from-sky-400 to-cyan-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
          >
            <Zap className="w-5 h-5 mr-2" />
            Vào thi ngay
          </button>
        </div>
      </div>

      {/* Available Exams */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-400 to-teal-500 px-6 py-4">
          <div className="flex items-center">
            <FileText className="w-6 h-6 text-white mr-3" />
            <h2 className="text-xl font-bold text-white">Kỳ thi đang diễn ra</h2>
            <span className="ml-auto px-3 py-1 bg-white/20 rounded-full text-sm font-semibold text-white">
              {availableExams.length} kỳ thi
            </span>
          </div>
        </div>
        {availableExams.length > 0 ? (
          <div className="p-6 space-y-4">
            {availableExams.map((exam, index) => (
              <Link
                key={exam._id || exam.id}
                to={`/exams/take/${exam.examCode}`}
                className="block"
              >
                <div
                  className="card-hover p-5 rounded-xl border-2 border-emerald-200 bg-emerald-50 hover:border-emerald-400 transition-all duration-200"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start flex-1">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg mr-4">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{exam.title}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                          <div className="flex items-center">
                            <span className="font-mono font-semibold text-emerald-600 bg-emerald-100 px-2 py-1 rounded">
                              {exam.examCode}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>Còn lại đến {format(new Date(exam.endTime), 'dd/MM HH:mm')}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-semibold">{exam.questions?.length || 0} câu</span>
                            <span className="mx-1">•</span>
                            <span>{exam.duration} phút</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
                        <ArrowRight className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium text-lg mb-2">Chưa có kỳ thi đang diễn ra</p>
            <p className="text-sm text-gray-400">Hãy kiểm tra lại sau hoặc nhập mã kỳ thi ở trên</p>
          </div>
        )}
      </div>

      {/* Upcoming Exams */}
      {upcomingExams.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-400 to-orange-400 px-6 py-4">
            <div className="flex items-center">
              <Clock className="w-6 h-6 text-white mr-3" />
              <h2 className="text-xl font-bold text-white">Kỳ thi sắp tới</h2>
              <span className="ml-auto px-3 py-1 bg-white/20 rounded-full text-sm font-semibold text-white">
                {upcomingExams.length} kỳ thi
              </span>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {upcomingExams.slice(0, 5).map((exam, index) => (
              <div
                key={exam._id || exam.id}
                className="p-5 rounded-xl border border-amber-200 bg-amber-50"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-lg mr-4">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{exam.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>Bắt đầu: {format(new Date(exam.startTime), 'dd/MM/yyyy HH:mm')}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-semibold">{exam.questions?.length || 0} câu</span>
                        <span className="mx-1">•</span>
                        <span>{exam.duration} phút</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### 6. **Tailwind Config** (`student-web/tailwind.config.js`)

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

---

## 🎨 Color Palette

### Primary Colors (Tự nhiên, ấm áp)
- **Emerald/Teal**: `emerald-400`, `emerald-500`, `teal-400`, `teal-500`
- **Sky/Cyan**: `sky-400`, `sky-500`, `cyan-400`, `cyan-500`
- **Amber/Orange**: `amber-400`, `orange-400`

### Background
- **Gradient**: `from-slate-50 via-blue-50 to-teal-50`
- **Cards**: `bg-white` với `shadow-lg` và `border-gray-100`

### Text Colors
- **Primary**: `text-slate-700`, `text-gray-900`
- **Secondary**: `text-gray-600`, `text-slate-600`
- **Muted**: `text-gray-500`, `text-slate-500`

---

## ✨ Key UI Features

1. **Animations**:
   - `animate-fade-in`: Fade in với slide up
   - `animate-slide-in`: Slide in từ trái
   - `card-hover`: Hover effect với transform và shadow

2. **Responsive Design**:
   - Mobile-first approach
   - Breakpoints: `sm:`, `md:`, `lg:`
   - Mobile menu với hamburger icon

3. **Visual Elements**:
   - Gradient backgrounds
   - Rounded corners (`rounded-xl`, `rounded-2xl`)
   - Shadow effects (`shadow-lg`, `shadow-xl`)
   - Blur effects cho decorative elements

4. **Typography**:
   - Font: Inter (Google Fonts)
   - Font weights: 400, 500, 600, 700, 800
   - Responsive text sizes

---

## 📱 Responsive Breakpoints

- **Mobile**: Default (< 640px)
- **Tablet**: `sm:` (≥ 640px)
- **Desktop**: `lg:` (≥ 1024px)

---

## 🎯 Design Principles

1. **Màu sắc tự nhiên**: Emerald, Teal, Sky, Amber - không quá rực rỡ
2. **Spacing nhất quán**: Sử dụng Tailwind spacing scale
3. **Shadows layered**: Tạo depth và hierarchy
4. **Smooth transitions**: Tất cả interactions có transition
5. **Accessibility**: Contrast ratios tốt, focus states rõ ràng

