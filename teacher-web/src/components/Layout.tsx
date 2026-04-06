import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout } from '../services/authService';
import {
  LayoutDashboard,
  Users,
  FileText,
  BookOpen,
  GraduationCap,
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  Settings,
  User,
} from 'lucide-react';
import Logo from './Logo';

export default function Layout() {
  const { user } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/classes', label: 'My Classes', icon: Users },
    { path: '/exams', label: 'Exams', icon: FileText },
    { path: '/assignments', label: 'Assignments', icon: BookOpen },
    { path: '/gradebook', label: 'Gradebook', icon: GraduationCap },
  ];

  const notifications = [
    { id: 1, text: 'New student joined class', time: '5m ago' },
    { id: 2, text: 'Exam submission received', time: '1h ago' },
  ];

  return (
    <div className="teacher-app-bg h-screen">
      <div className="teacher-app-bg-overlay flex h-screen text-text-primary font-sans dark:text-white">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - 280px, white background — y chang student-web */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-[280px]
          bg-background-light border-r border-border
          flex flex-col transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="p-6">
          <div className="flex items-center gap-3">
            <Logo className="w-10 h-10" />
            <h1 className="text-2xl font-bold tracking-tighter text-text-primary">
              Lan Anh
            </h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`
                  relative flex w-full items-center rounded-full px-4 py-3 text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-primary/20 text-text-primary'
                    : 'text-text-secondary hover:bg-background'
                  }
                `}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                )}
                <Icon
                  className={`mr-3 h-5 w-5 ${isActive ? 'text-text-primary' : 'text-text-secondary'}`}
                />
                <span className="flex-1 text-left">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="p-4 border-t border-border space-y-1">
          <button
            type="button"
            className="flex w-full items-center rounded-full px-4 py-3 text-sm font-medium text-text-secondary transition-colors hover:bg-background"
          >
            <Settings className="mr-3 h-5 w-5" />
            Settings
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center rounded-full px-4 py-3 text-sm font-medium text-text-secondary transition-colors hover:bg-background"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        {/* Minimalist Header */}
        <header className="sticky top-0 z-20 bg-background-light border-b border-border px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            {/* Mobile Menu */}
            <div className="flex items-center gap-3 lg:hidden">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-background"
              >
                <Menu className="w-5 h-5 text-text-primary" />
              </button>
              <div className="flex items-center gap-2">
                <Logo className="w-8 h-8" />
                <span className="text-lg font-bold text-text-primary">Lan Anh</span>
              </div>
            </div>

            {/* Desktop: Search */}
            <div className="hidden lg:flex items-center gap-4 flex-1 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="
                    w-full pl-10 pr-4 py-2 bg-gray-50 border border-border rounded-full
                    text-sm text-text-primary placeholder:text-text-muted
                    focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                  "
                />
              </div>
            </div>

            {/* Right: Notifications + Avatar */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <div className="relative">
                <button
                  type="button"
                  className="relative rounded-full p-2 transition-colors hover:bg-background"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="w-5 h-5 text-text-secondary" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-background-light" />
                </button>

                {showNotifications && (
                  <div className="absolute right-0 top-12 z-50 w-80 rounded-3xl border border-border bg-background-light shadow-soft animate-fade-in-down">
                    <div className="flex items-center justify-between border-b border-border p-4">
                      <h3 className="text-sm font-bold text-text-primary">Notifications</h3>
                      <button
                        type="button"
                        onClick={() => setShowNotifications(false)}
                        className="text-text-muted hover:text-text-primary"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className="cursor-pointer border-b border-border p-4 transition-colors hover:bg-background"
                        >
                          <p className="mb-1 text-sm font-medium text-text-primary">{n.text}</p>
                          <p className="text-xs text-text-secondary">{n.time}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Avatar */}
              <div className="relative z-50" ref={profileMenuRef}>
                <button
                  type="button"
                  className="h-10 w-10 cursor-pointer overflow-hidden rounded-full border-2 border-border shadow-soft transition-all hover:ring-2 hover:ring-primary/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowProfileMenu(!showProfileMenu);
                  }}
                >
                  {user?.avatarUrl ? (
                    <img
                      src={
                        user.avatarUrl.startsWith('http')
                          ? user.avatarUrl
                          : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.avatarUrl}`
                      }
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-primary-hover">
                      <span className="text-sm font-bold text-white">
                        {user?.name?.charAt(0).toUpperCase() || 'T'}
                      </span>
                    </div>
                  )}
                </button>

                {showProfileMenu && (
                  <div className="animate-fade-in-down absolute right-0 top-12 z-[60] w-56 rounded-2xl border border-border bg-background-light shadow-soft">
                    <div className="p-2">
                      <div className="mb-2 border-b border-border px-4 py-3">
                        <p className="text-sm font-semibold text-text-primary">{user?.name || 'User'}</p>
                        <p className="truncate text-xs text-text-secondary">{user?.email || ''}</p>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex w-full items-center rounded-lg px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-background"
                      >
                        <User className="mr-3 h-4 w-4" />
                        Profile Settings
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileMenu(false);
                          handleLogout();
                        }}
                        className="mt-1 flex w-full items-center rounded-lg px-4 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Click outside to close notifications */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
      </div>
    </div>
  );
}
