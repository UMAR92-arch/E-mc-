import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { useLanguage } from '../../context/LanguageContext';
import { LogIn } from 'lucide-react';

export default function Login() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Special role check based on requirements
  const checkSpecialRoles = async (login, pass) => {
    if (login === 'LSL' && pass === 'Teachers') {
      // Simulate teacher login - In a real app we'd need a real firebase user for this
      // For the sake of this prompt, we'll login to a pre-created teacher account or show how it works
      // But we must use Firebase Auth. The user requested LSL / Teachers. 
      // We can create a dummy email for LSL like lsl@ilmfan.uz
      return { email: 'lsl@ilmfan.uz', pass: 'Teachers' };
    }
    if (login === 'ADMIN' && pass === 'Admin2025') {
      return { email: 'admin@ilmfan.uz', pass: 'Admin2025' };
    }
    // Normal email login
    return { email: login, pass };
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const credentials = await checkSpecialRoles(email, password);
      
      // Attempt Firebase login
      const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.pass);
      
      // Get role
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        const role = userDoc.data().role;
        if (role === 'admin') navigate('/admin');
        else if (role === 'teacher') navigate('/teacher');
        else navigate('/');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      setError('Login yoki parol xato!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-blue-500/20 text-blue-500 rounded-full mb-4">
            <LogIn size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white">{t('login')}</h2>
        </div>

        {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-center">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-slate-400 mb-1 text-sm">{t('email')}</label>
            <input 
              type="text" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Foydalanuvchi nomi yoki Email"
              required 
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1 text-sm">{t('password')}</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="••••••••"
              required 
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors flex justify-center items-center h-10"
          >
            {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : t('login')}
          </button>
        </form>

        <div className="mt-6 text-center text-slate-400 text-sm">
          {t('no_account')} <Link to="/register" className="text-blue-500 hover:underline">{t('register_here')}</Link>
        </div>
      </div>
    </div>
  );
}
