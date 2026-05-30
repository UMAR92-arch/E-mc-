import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Basic placeholders for now
const Home = () => <div className="p-8 text-2xl font-bold">Home Page (Tez orada...)</div>;
const Login = () => <div className="p-8 text-2xl font-bold">Login Page (Tez orada...)</div>;
const Register = () => <div className="p-8 text-2xl font-bold">Register Page (Tez orada...)</div>;
const TeacherPanel = () => <div className="p-8 text-2xl font-bold">Teacher Panel</div>;
const AdminPanel = () => <div className="p-8 text-2xl font-bold">Admin Panel</div>;

const ProtectedRoute = ({ children, roles }) => {
  const { currentUser, userData, loading } = useAuth();

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div></div>;

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (roles && userData && !roles.includes(userData.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-white font-sans">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/teacher" element={
            <ProtectedRoute roles={['teacher', 'admin']}>
              <TeacherPanel />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}>
              <AdminPanel />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
