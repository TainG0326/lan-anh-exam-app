import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Classes from './pages/Classes';
import ClassDetail from './pages/ClassDetail';
import Exams from './pages/Exams';
import CreateExam from './pages/CreateExam';
import ExamResults from './pages/ExamResults';
import Assignments from './pages/Assignments';
import Gradebook from './pages/Gradebook';
import Profile from './pages/Profile';
import Layout from './components/Layout';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'teacher') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="classes" element={<Classes />} />
        <Route path="classes/:id" element={<ClassDetail />} />
        <Route path="exams" element={<Exams />} />
        <Route path="exams/create" element={<CreateExam />} />
        <Route path="exams/:examId/results" element={<ExamResults />} />
        <Route path="assignments" element={<Assignments />} />
        <Route path="gradebook" element={<Gradebook />} />
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

