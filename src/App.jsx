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

const SecretAdminBtn = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [pass, setPass] = useState('');
  const [err, setErr] = useState(false);

  // Butunlay yashirish
  if (location.pathname.startsWith('/admin')) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pass === "xacker_uzb_01") {
      sessionStorage.setItem('admin_unlocked', 'true'); // Parol to'g'ri bo'lsa sessionga saqlaymiz
      setShowModal(false);
      setPass('');
      navigate('/admin');
    } else {
      setErr(true);
      setTimeout(() => setErr(false), 2000);
    }
  };

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        className="fixed bottom-3 left-3 w-10 h-10 z-[9999] transition-all duration-300 rounded-full cursor-default"
        style={{
          background: '#05080f', border: 'none', outline: 'none', color: 'transparent'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, #7c3aed, #000000)';
          e.currentTarget.style.boxShadow = '0 0 20px rgba(124,58,237,0.8)';
          e.currentTarget.style.cursor = 'pointer';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#05080f';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.cursor = 'default';
        }}
      />
      
      {showModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="bg-[#0d1117] border border-[#7c3aed44] rounded-2xl p-7 w-80 slide-up" style={{ boxShadow: '0 0 50px rgba(124,58,237,0.15)' }}>
            <h3 className="text-xl font-bold mb-5 text-center text-[#7c3aed]">Maxfiy Kirish</h3>
            <form onSubmit={handleSubmit}>
              <input 
                type="password" autoFocus 
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white mb-3 focus:outline-none focus:border-[#7c3aed]" 
                placeholder="Parolni kiriting..." 
                value={pass} onChange={e => setPass(e.target.value)} 
              />
              {err && <p className="text-red-400 text-xs mb-3 text-center font-medium">Noto'g'ri parol!</p>}
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => {setShowModal(false); setPass('');}} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-sm">Bekor qilish</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#5b21b6] font-medium transition-transform hover:scale-105 text-white text-sm">Tizimga kirish</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

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
    // Agar foydalanuvchi Admin Panelga kirmoqchi bo'lsa va parolni to'g'ri yozgan bo'lsa (sessionStorage), ruxsat beramiz.
    if (location.pathname.startsWith('/admin') && sessionStorage.getItem('admin_unlocked') === 'true') {
      return children;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen" style={{ background: '#05080f', color: '#f0f4f8' }}>
        <SecretAdminBtn />
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
