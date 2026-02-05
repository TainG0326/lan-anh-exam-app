import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.classList.toggle('dark', newMode);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log('Login: Starting login attempt for:', email);

    try {
      console.log('Login: Calling API...');
      const response = await login(email, password);
      console.log('Login: API response:', response);

      if (response.success) {
        console.log('Login: Success, setting user and navigating...');
        setUser(response.user);
        toast.success('Login successful!');
        navigate('/');
      }
    } catch (error: any) {
      console.error('Login: Error:', error);
      console.error('Login: Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log('Register: Starting registration for:', email);

    try {
      console.log('Register: Calling API...');
      const response = await register({
        email,
        password,
        name,
        role: 'student',
      });
      console.log('Register: API response:', response);

      if (response.success) {
        console.log('Register: Success, setting user and navigating...');
        setUser(response.user);
        toast.success('Registration successful!');
        navigate('/');
      }
    } catch (error: any) {
      console.error('Register: Error:', error);
      console.error('Register: Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .mesh-gradient {
          background-color: #fcfcf9;
          background-image: 
            radial-gradient(at 12% 18%, hsla(138,41%,88%,1) 0px, transparent 50%),
            radial-gradient(at 89% 13%, hsla(60,28%,93%,1) 0px, transparent 50%),
            radial-gradient(at 19% 89%, hsla(138,41%,92%,1) 0px, transparent 50%),
            radial-gradient(at 85% 82%, hsla(60,28%,91%,1) 0px, transparent 50%),
            radial-gradient(at 50% 50%, hsla(138,20%,95%,1) 0px, transparent 50%);
        }
        .dark .mesh-gradient {
          background-color: #1A2321;
          background-image: 
            radial-gradient(at 12% 18%, hsla(138,20%,15%,1) 0px, transparent 50%),
            radial-gradient(at 89% 13%, hsla(138,25%,12%,1) 0px, transparent 50%),
            radial-gradient(at 19% 89%, hsla(138,20%,18%,1) 0px, transparent 50%),
            radial-gradient(at 85% 82%, hsla(138,25%,14%,1) 0px, transparent 50%),
            radial-gradient(at 50% 50%, hsla(138,15%,20%,1) 0px, transparent 50%);
        }
      `}</style>

      <div className="mesh-gradient min-h-screen flex items-center justify-center font-sans text-gray-800 dark:text-gray-200 transition-colors duration-300">
        <div className="w-full max-w-md p-8 sm:p-10 bg-white/80 dark:bg-gray-900/60 backdrop-blur-md shadow-xl rounded-lg border border-white/50 dark:border-gray-700/50 transition-all duration-300">
          <div className="text-center mb-8">
            <h1 className="font-serif text-4xl text-gray-900 dark:text-white mb-2 tracking-tight">
              {isLogin ? 'Student Portal' : 'Join Us'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-light tracking-wide uppercase text-xs">
              {isLogin ? 'English Learning & Online Exam System' : 'Create Your Student Account'}
            </p>
          </div>

          {/* Toggle between Login and Register */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={`px-6 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  isLogin
                    ? 'bg-white dark:bg-gray-700 text-[#5F8D78] shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className={`px-6 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  !isLogin
                    ? 'bg-white dark:bg-gray-700 text-[#5F8D78] shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Register
              </button>
            </div>
          </div>

          {isLogin ? (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-5">
                <div className="relative group">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1" htmlFor="email">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full px-4 py-3 bg-transparent border border-gray-300 dark:border-gray-600 rounded-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#5F8D78] focus:border-[#5F8D78] sm:text-sm transition-colors duration-200"
                    placeholder="student@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="relative group">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1" htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="block w-full px-4 py-3 bg-transparent border border-gray-300 dark:border-gray-600 rounded-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#5F8D78] focus:border-[#5F8D78] sm:text-sm transition-colors duration-200"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <input
                  className="h-4 w-4 text-[#5F8D78] focus:ring-[#5F8D78] border-gray-300 rounded"
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                />
                <label className="ml-2 block text-gray-600 dark:text-gray-400" htmlFor="remember-me">
                  Remember me
                </label>
              </div>
            </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-sm text-white bg-gradient-to-r from-[#6B9080] to-[#5F8D78] hover:from-[#5F8D78] hover:to-[#4A6F5E] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5F8D78] shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                >
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <svg className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path clipRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" fillRule="evenodd"></path>
                    </svg>
                  </span>
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>
          ) : (
            /* Registration Form */
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-5">
                <div className="relative group">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1" htmlFor="reg-name">
                    Full Name
                  </label>
                  <input
                    id="reg-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    className="block w-full px-4 py-3 bg-transparent border border-gray-300 dark:border-gray-600 rounded-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#5F8D78] focus:border-[#5F8D78] sm:text-sm transition-colors duration-200"
                    placeholder="Nguyen Van A"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="relative group">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1" htmlFor="reg-email">
                    Email Address
                  </label>
                  <input
                    id="reg-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full px-4 py-3 bg-transparent border border-gray-300 dark:border-gray-600 rounded-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#5F8D78] focus:border-[#5F8D78] sm:text-sm transition-colors duration-200"
                    placeholder="student@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="relative group">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1" htmlFor="reg-password">
                    Password
                  </label>
                  <input
                    id="reg-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className="block w-full px-4 py-3 bg-transparent border border-gray-300 dark:border-gray-600 rounded-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#5F8D78] focus:border-[#5F8D78] sm:text-sm transition-colors duration-200"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-sm text-white bg-gradient-to-r from-[#6B9080] to-[#5F8D78] hover:from-[#5F8D78] hover:to-[#4A6F5E] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5F8D78] shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                >
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <svg className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016 6zM1 7h2a1 1 0 011 1v2a1 1 0 01-1 1H1V7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                  </span>
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="fixed top-4 right-4 z-50">
          <button
            className="p-2 rounded-full bg-white/50 dark:bg-black/50 hover:bg-white dark:hover:bg-black text-gray-800 dark:text-white transition-all shadow-sm backdrop-blur-sm"
            onClick={toggleDarkMode}
          >
            {darkMode ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
