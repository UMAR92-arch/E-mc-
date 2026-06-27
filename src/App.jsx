import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useState } from 'react';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Home from './pages/Home';
import SubjectPage from './pages/SubjectPage';
import TeacherPanel from './pages/TeacherPanel';
import AdminPanel from './pages/AdminPanel';
import QuestionsPage from './pages/QuestionsPage';


const ProtectedRoute = ({ children, roles }) => {
  const { currentUser, userData, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div className="flex justify-center items-center h-screen" style={{ background: '#05080f' }}>
      <div className="text-center">
        <div style={{
          width: 60, height: 60, borderRadius: '50%',
          border: '3px solid rgba(0,212,255,0.2)',
          borderTopColor: '#00d4ff',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px'
        }} />
        <div className="gradient-text font-bold text-lg">IlmFan</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!currentUser) return <Navigate to="/login" replace />;

  if (roles && userData && !roles.includes(userData.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen" style={{ background: '#05080f', color: '#f0f4f8' }}>
        <Routes>
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/questions" element={<ProtectedRoute><QuestionsPage /></ProtectedRoute>} />
          <Route path="/subject/:subjectId" element={<ProtectedRoute><SubjectPage /></ProtectedRoute>} />
          <Route path="/teacher" element={<ProtectedRoute roles={['teacher', 'admin']}><TeacherPanel /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminPanel /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
