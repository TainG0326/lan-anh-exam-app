import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { logout } from '../services/authService';
import {
  LayoutDashboard,
  Users,
  FileText,
  BookOpen,
  GraduationCap,
  LogOut,
  Menu,
  Settings,
  User,
} from 'lucide-react';
import Logo from './Logo';

export default function Layout() {
  const { user, setUser } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
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
    setUser(null);
  };

  const navItems = [
    { path: '/', label: t('nav.dashboard'), icon: LayoutDashboard },
    { path: '/classes', label: t('nav.classes'), icon: Users },
    { path: '/exams', label: t('nav.exams'), icon: FileText },
    { path: '/assignments', label: t('nav.assignments'), icon: BookOpen },
    { path: '/gradebook', label: t('nav.gradebook'), icon: GraduationCap },
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
        {/* Logo - click to dashboard */}
        <div className="p-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Logo className="w-12 h-12" />
            <h1 className="text-2xl font-bold tracking-tighter text-text-primary">
              Lan Anh
            </h1>
          </button>
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
          <Link
            to="/profile"
            onClick={() => setIsSidebarOpen(false)}
            className={`
              relative flex w-full items-center rounded-full px-4 py-3 text-sm font-medium transition-colors
              ${location.pathname === '/profile'
                ? 'bg-primary/20 text-text-primary'
                : 'text-text-secondary hover:bg-background'}
            `}
          >
            {location.pathname === '/profile' && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
            )}
            <Settings className={`mr-3 h-5 w-5 ${location.pathname === '/profile' ? 'text-text-primary' : 'text-text-secondary'}`} />
            Profile Settings
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center rounded-full px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
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
          <div className="flex items-center justify-between max-w-7xl mx-auto w-full gap-3">
            {/* Mobile Menu */}
            <div className="flex items-center gap-3 lg:hidden">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-background"
              >
                <Menu className="w-5 h-5 text-text-primary" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <Logo className="w-9 h-9" />
                <span className="text-lg font-bold text-text-primary">Lan Anh</span>
              </button>
            </div>

            <div className="hidden lg:block flex-1 min-w-0" aria-hidden="true" />

            {/* Avatar */}
            <div className="flex items-center gap-3 ml-auto">
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

      </div>
    </div>
  );
}
