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
    <div className="flex h-screen bg-background text-text-primary font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar - 280px width, white background */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-[280px] bg-background-light border-r border-border flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
          <div className="flex items-center gap-3">
            <Logo className="w-10 h-10" />
            <h1 className="text-2xl font-bold tracking-tighter text-text-primary">
              Lan Anh
            </h1>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-full transition-colors relative
                  ${isActive 
                    ? 'bg-primary/20 text-text-primary' 
                    : 'text-text-secondary hover:bg-gray-50'
                  }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full"></span>
                )}
                
                <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-text-primary' : 'text-text-secondary'}`} />
                
                <span className="flex-1 text-left">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-1">
          <button 
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-text-secondary rounded-full hover:bg-gray-50 transition-colors"
          >
            <Settings className="mr-3 h-5 w-5" />
            Settings
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-text-secondary rounded-full hover:bg-gray-50 transition-colors"
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
            <div className="lg:hidden flex items-center gap-3">
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-50">
                <Menu className="w-5 h-5 text-text-primary" />
              </button>
              <div className="flex items-center gap-2">
                <Logo className="w-8 h-8" />
                <span className="text-lg font-bold text-text-primary">Lan Anh</span>
              </div>
            </div>

            {/* Desktop: Search, Notifications, Avatar */}
            <div className="hidden lg:flex items-center gap-4 flex-1 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-border rounded-full text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <button 
                  className="p-2 rounded-full hover:bg-gray-50 transition-colors relative"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="w-5 h-5 text-text-secondary" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-background-light"></span>
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 top-12 w-80 bg-background-light rounded-3xl shadow-soft border border-border z-50 animate-fade-in-down">
                    <div className="flex justify-between items-center p-4 border-b border-border">
                      <h3 className="font-bold text-text-primary text-sm">Notifications</h3>
                      <button onClick={() => setShowNotifications(false)} className="text-text-muted hover:text-text-primary">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map(n => (
                        <div key={n.id} className="p-4 border-b border-border hover:bg-gray-50 cursor-pointer transition-colors">
                          <p className="text-sm text-text-primary font-medium mb-1">{n.text}</p>
                          <p className="text-xs text-text-secondary">{n.time}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative z-50" ref={profileMenuRef}>
              <button 
                className="h-10 w-10 rounded-full overflow-hidden border-2 border-border shadow-soft hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer"
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

                {/* Profile Dropdown Menu */}
                {showProfileMenu && (
                  <div 
                    className="absolute right-0 top-12 w-56 bg-background-light rounded-2xl shadow-soft border border-border z-[60] animate-fade-in-down"
                  >
                    <div className="p-2">
                      <div className="px-4 py-3 border-b border-border mb-2">
                        <p className="text-sm font-semibold text-text-primary">{user?.name || 'User'}</p>
                        <p className="text-xs text-text-secondary truncate">{user?.email || ''}</p>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => {
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center px-4 py-2 text-sm text-text-secondary hover:bg-gray-50 rounded-lg transition-colors"
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
                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1 text-left"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Logout
              </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        
        {/* Main Area - Centered with max-width, gap-8 */}
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
          onClick={() => {
            setShowNotifications(false);
          }}
        />
      )}
    </div>
  );
}
