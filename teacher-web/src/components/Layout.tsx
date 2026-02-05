import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
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
  User
} from 'lucide-react';
import Logo from './Logo';

export default function Layout() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
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
    { id: 1, text: "New student joined class", time: "5m ago" },
    { id: 2, text: "Exam submission received", time: "1h ago" },
  ];

  return (
    <div className="flex h-screen font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Glass Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-[280px] 
        bg-white/30 backdrop-blur-2xl border-r border-white/20 
        shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out 
        lg:translate-x-0 lg:static lg:ml-4 lg:mt-4 lg:rounded-3xl
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo Section */}
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Logo className="w-10 h-10" />
              {/* Subtle glow behind logo */}
              <div className="absolute inset-0 w-10 h-10 bg-primary/20 blur-xl rounded-full -z-10" />
            </div>
            <h1 className="text-2xl font-bold tracking-tighter text-text-primary">
              Lan Anh
            </h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`
                  w-full flex items-center px-4 py-3 text-sm font-semibold rounded-2xl transition-all duration-300 relative
                  ${isActive 
                    ? 'bg-white/40 shadow-lg text-text-primary' 
                    : 'text-text-secondary hover:bg-white/20 hover:text-text-primary'
                  }
                  ${isActive ? 'glow-primary' : ''}
                `}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-primary rounded-r-full shadow-glow-primary" />
                )}
                
                <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-text-primary' : ''}`} />
                
                <span className="flex-1 text-left">{item.label}</span>
                
                {/* Soft glow on active */}
                {isActive && (
                  <div className="absolute inset-0 rounded-2xl bg-primary/5 pointer-events-none" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-white/20 space-y-2">
          <button 
            className="flex items-center w-full px-4 py-3 text-sm font-semibold text-text-secondary rounded-2xl hover:bg-white/20 hover:text-text-primary transition-all duration-300"
          >
            <Settings className="mr-3 h-5 w-5" />
            Settings
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-semibold text-text-secondary rounded-2xl hover:bg-red-50/50 hover:text-red-600 transition-all duration-300"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 h-screen overflow-y-auto lg:p-4">
        {/* Floating Header */}
        <header className="
          sticky top-4 z-20 
          bg-white/40 backdrop-blur-2xl border border-white/30 
          shadow-xl rounded-2xl 
          px-6 py-4 mb-6
        ">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            {/* Mobile Menu */}
            <div className="lg:hidden flex items-center gap-3">
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="p-2 rounded-xl hover:bg-white/30 transition-all"
              >
                <Menu className="w-5 h-5 text-text-primary" />
              </button>
              <div className="flex items-center gap-2">
                <Logo className="w-8 h-8" />
                <span className="text-lg font-bold text-text-primary">Lan Anh</span>
              </div>
            </div>

            {/* Desktop Search */}
            <div className="hidden lg:flex items-center gap-4 flex-1 max-w-2xl mx-auto">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Search classes, exams, students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="
                    w-full pl-10 pr-4 py-3 
                    bg-white/30 backdrop-blur-lg 
                    border border-white/40 
                    rounded-full text-sm text-text-primary 
                    placeholder:text-text-muted 
                    focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50
                    transition-all duration-300
                  "
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <div className="relative">
                <button 
                  className="
                    p-2.5 rounded-xl 
                    bg-white/20 hover:bg-white/40 
                    backdrop-blur-lg border border-white/30
                    transition-all duration-300 hover:scale-[1.05]
                    relative
                  "
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="w-5 h-5 text-text-secondary" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white/40"></span>
                </button>

                {/* Notification Dropdown - Glass */}
                {showNotifications && (
                  <div className="absolute right-0 top-14 w-80">
                    <div className="
                      bg-white/80 backdrop-blur-2xl 
                      border border-white/40 
                      shadow-2xl rounded-2xl 
                      overflow-hidden animate-fade-in-down
                    ">
                      <div className="flex justify-between items-center p-4 border-b border-white/20">
                        <h3 className="font-bold text-text-primary text-sm">Notifications</h3>
                        <button 
                          onClick={() => setShowNotifications(false)} 
                          className="p-1 rounded-lg hover:bg-white/40 transition-colors"
                        >
                          <X className="w-4 h-4 text-text-secondary" />
                        </button>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.map(n => (
                          <div 
                            key={n.id} 
                            className="p-4 border-b border-white/20 hover:bg-white/30 cursor-pointer transition-all"
                          >
                            <p className="text-sm font-medium text-text-primary mb-1">{n.text}</p>
                            <p className="text-xs text-text-secondary">{n.time}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Avatar */}
              <div className="relative z-50" ref={profileMenuRef}>
                <button 
                  className="
                    h-10 w-10 rounded-full overflow-hidden 
                    border-2 border-white/40 shadow-lg
                    hover:ring-2 hover:ring-primary/30 hover:scale-105
                    transition-all duration-300 cursor-pointer
                  "
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowProfileMenu(!showProfileMenu);
                  }}
                >
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl.startsWith('http') 
                        ? user.avatarUrl 
                        : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.avatarUrl}`}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center">
                      <span className="text-primary-foreground font-bold text-sm">
                        {user?.name?.charAt(0).toUpperCase() || 'T'}
                      </span>
                    </div>
                  )}
                </button>

                {/* Profile Dropdown - Glass */}
                {showProfileMenu && (
                  <div 
                    className="absolute right-0 top-14 w-56"
                  >
                    <div className="
                      bg-white/80 backdrop-blur-2xl 
                      border border-white/40 
                      shadow-2xl rounded-2xl 
                      overflow-hidden animate-fade-in-down
                    ">
                      <div className="p-2">
                        <div className="px-4 py-3 border-b border-white/20 mb-2">
                          <p className="text-sm font-semibold text-text-primary">{user?.name || 'User'}</p>
                          <p className="text-xs text-text-secondary truncate">{user?.email || ''}</p>
                        </div>
                        <Link
                          to="/profile"
                          onClick={() => {
                            setShowProfileMenu(false);
                          }}
                          className="w-full flex items-center px-4 py-2 text-sm text-text-secondary hover:bg-white/40 rounded-xl transition-all"
                        >
                          <User className="w-4 h-4 mr-3" />
                          Profile Settings
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setShowProfileMenu(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50/50 rounded-xl transition-all mt-1 text-left"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        
        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-6 pb-6">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Click outside to close notifications */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowNotifications(false);
          }}
        />
      )}
    </div>
  );
}
