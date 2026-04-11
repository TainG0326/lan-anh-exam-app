import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import ExamLogin from './pages/ExamLogin';
import Exams from './pages/Exams';
import ExamRoom from './pages/ExamRoom';
import ExamResult from './pages/ExamResult';

// Security: Check for suspicious conditions
const SecurityChecker = () => {
  useEffect(() => {
    // Block iframes
    if (window.self !== window.top && window.top) {
      window.top.location.href = window.location.href;
    }
    
    // Prevent going back
    window.history.pushState(null, '', window.location.href);
    window.onpopstate = () => {
      window.history.pushState(null, '', window.location.href);
    };
  }, []);

  return null;
};

export default function App() {
  return (
    <>
      <SecurityChecker />
      <Routes>
        <Route path="/login" element={<ExamLogin />} />
        <Route path="/exams" element={<Exams />} />
        <Route path="/exam/:examCode" element={<ExamRoom />} />
        <Route path="/result/:examId" element={<ExamResult />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

