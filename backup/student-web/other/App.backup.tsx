import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import AuthCallback from './pages/AuthCallback';
import Verify2FA from './pages/Verify2FA';
import Dashboard from './pages/Dashboard';
import Notifications from './pages/Notifications';
import Exams from './pages/Exams';
import TakeExam from './pages/TakeExam';
import ExamResult from './pages/ExamResult';
import Assignments from './pages/Assignments';
import Grades from './pages/Grades';
import Profile from './pages/Profile';
import JoinClass from './pages/JoinClass';
import Layout from './components/Layout';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const hasToken = !!localStorage.getItem('token');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user && !hasToken) {
    return <Navigate to="/login" replace />;
  }

  if (user && user.role !== 'student') {
    return <Navigate to="/login" replace />;
  }

  if (!user && hasToken) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/verify-2fa" element={<Verify2FA />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="join-class" element={<JoinClass />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="exams" element={<Exams />} />
        <Route path="exams/take/:examCode" element={<TakeExam />} />
        <Route path="exams/result/:examId" element={<ExamResult />} />
        <Route path="assignments" element={<Assignments />} />
        <Route path="grades" element={<Grades />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AppRoutes />
          <Toaster position="top-right" />
        </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
