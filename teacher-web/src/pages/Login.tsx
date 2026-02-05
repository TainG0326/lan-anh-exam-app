import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, register } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight,
  Sparkles,
  BookOpen,
  GraduationCap
} from 'lucide-react';

type AuthMode = 'login' | 'register';

export default function Login() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let response;
      
      if (mode === 'register') {
        response = await register(name, email, password);
        if (response.success) {
          toast.success('Account created successfully!');
          // Auto login after registration
          const loginResponse = await login(email, password);
          if (loginResponse.success) {
            setUser(loginResponse.user);
            navigate('/');
          }
        }
      } else {
        response = await login(email, password);
        if (response.success) {
          setUser(response.user);
          toast.success('Welcome back!');
          navigate('/');
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || `${mode === 'register' ? 'Registration' : 'Login'} failed`);
    } finally {
      setLoading(false);
    }
  };

  // Floating orbs for background decoration
  const Orbs = () => (
    <>
      <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" />
      
      {/* Small floating particles */}
      <div className="absolute top-32 right-1/3 w-4 h-4 bg-primary/40 rounded-full animate-float" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-40 left-1/4 w-3 h-3 bg-blue-500/40 rounded-full animate-float" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-purple-500/40 rounded-full animate-float" style={{ animationDelay: '2s' }} />
    </>
  );

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
      {/* Animated Background Orbs */}
      <Orbs />

      {/* Glass Card Container */}
      <div className="relative w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            {/* Glow effect behind logo */}
            <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full" />
            <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-primary to-primary-hover rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/30">
              <BookOpen className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="mt-4 text-3xl font-bold text-text-primary tracking-tight">
            Lan Anh
          </h1>
          <p className="mt-2 text-text-secondary">
            English Learning & Exam System
          </p>
        </div>

        {/* Main Glass Card */}
        <div className="
          relative
          bg-white/20 backdrop-blur-2xl
          border border-white/30
          shadow-2xl
          rounded-3xl
          p-8
          overflow-hidden
        ">
          {/* Subtle inner glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

          {/* Decorative gradient line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-text-secondary text-sm">
              {mode === 'login' 
                ? 'Sign in to continue your journey' 
                : 'Join us and start learning today'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name field - Only for register */}
            {mode === 'register' && (
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-text-muted group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required={mode === 'register'}
                  className="
                    w-full pl-12 pr-4 py-4
                    bg-white/30 backdrop-blur-lg
                    border border-white/40
                    rounded-2xl
                    text-text-primary placeholder:text-text-muted
                    focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50
                    transition-all duration-300
                  "
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            {/* Email field */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-text-muted group-focus-within:text-primary transition-colors" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="
                  w-full pl-12 pr-4 py-4
                  bg-white/30 backdrop-blur-lg
                  border border-white/40
                  rounded-2xl
                  text-text-primary placeholder:text-text-muted
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50
                  transition-all duration-300
                "
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password field */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-text-muted group-focus-within:text-primary transition-colors" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="
                  w-full pl-12 pr-12 py-4
                  bg-white/30 backdrop-blur-lg
                  border border-white/40
                  rounded-2xl
                  text-text-primary placeholder:text-text-muted
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50
                  transition-all duration-300
                "
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-muted hover:text-text-primary transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Remember me & Forgot password - Login only */}
            {mode === 'login' && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center text-text-secondary cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-white/40 bg-white/30 text-primary focus:ring-primary/30 mr-2"
                  />
                  Remember me
                </label>
                <a href="#" className="text-primary hover:text-primary-hover font-medium transition-colors">
                  Forgot password?
                </a>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="
                w-full py-4 px-6
                bg-gradient-to-r from-primary to-primary-hover
                hover:from-primary-hover hover:to-primary
                text-primary-foreground font-bold rounded-2xl
                shadow-lg shadow-primary/30
                hover:shadow-xl hover:shadow-primary/40
                transform hover:scale-[1.02] active:scale-[0.98]
                transition-all duration-300
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
              "
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-xs text-text-muted uppercase tracking-wider">or continue with</span>
            <div className="flex-1 h-px bg-white/20" />
          </div>

          {/* Social Login Buttons */}
          <div className="flex gap-4">
            <button className="flex-1 py-3 px-4 bg-white/20 hover:bg-white/40 backdrop-blur-lg border border-white/30 rounded-2xl font-semibold text-text-primary transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
            <button className="flex-1 py-3 px-4 bg-white/20 hover:bg-white/40 backdrop-blur-lg border border-white/30 rounded-2xl font-semibold text-text-primary transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </button>
          </div>

          {/* Toggle Mode */}
          <div className="mt-8 text-center">
            <p className="text-text-secondary">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="ml-2 text-primary hover:text-primary-hover font-bold transition-colors"
              >
                {mode === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>

        {/* Features highlight */}
        <div className="mt-6 flex items-center justify-center gap-6 text-text-muted text-sm">
          <div className="flex items-center gap-1">
            <Sparkles className="w-4 h-4" />
            <span>Secure</span>
          </div>
          <div className="flex items-center gap-1">
            <GraduationCap className="w-4 h-4" />
            <span>Easy to Use</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            <span>English Learning</span>
          </div>
        </div>

        {/* Demo credentials hint */}
        {mode === 'login' && (
          <div className="mt-4 p-4 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20">
            <p className="text-xs text-text-secondary text-center">
              <span className="font-semibold text-text-primary">Demo Account:</span>{' '}
              teacher@example.com / teacher123
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
