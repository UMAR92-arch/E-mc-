import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { LogIn, BookOpen, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let loginEmail = email;
      if (!email.includes('@')) loginEmail = `${email}@ilmfan.uz`;

      const cred = await signInWithEmailAndPassword(auth, loginEmail, password);
      const snap = await getDoc(doc(db, 'users', cred.user.uid));
      const role = snap.exists() ? snap.data().role : 'student';
      if (role === 'admin') navigate('/admin');
      else if (role === 'teacher') navigate('/teacher');
      else navigate('/');
    } catch {
      setError("Login yoki parol xato!");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative" style={{ background: '#05080f' }}>
      <div className="stars-bg" />
      <div className="floating-shape bg-blue-500" style={{ width: 400, height: 400, top: '-10%', right: '-10%', opacity: 0.08 }} />
      <div className="floating-shape bg-purple-500" style={{ width: 300, height: 300, bottom: '-5%', left: '-5%', opacity: 0.08, animationDelay: '-8s' }} />

      <div className="glass-panel rounded-3xl p-8 w-full max-w-md relative z-10 slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-2xl mb-4 neon-blue" style={{ background: 'linear-gradient(135deg,#00d4ff22,#00d4ff08)', border: '1px solid rgba(0,212,255,0.3)' }}>
            <BookOpen size={32} style={{ color: '#00d4ff' }} />
          </div>
          <h1 className="text-2xl font-bold gradient-text mb-1" style={{ fontFamily: 'Space Grotesk' }}>IlmFan</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Platformaga xush kelibsiz</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl text-sm text-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Login yoki Email</label>
            <input
              className="input-field"
              type="text"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="login yoki email@..."
              required
              id="login-email"
            />
          </div>
          <div>
            <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Parol</label>
            <div className="relative">
              <input
                className="input-field pr-10"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                id="login-password"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2"
            id="login-submit"
          >
            {loading
              ? <span style={{ display:'inline-block',width:18,height:18,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',animation:'spin 0.8s linear infinite'}} />
              : <><LogIn size={18} /> Kirish</>}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
          Akkaunt yo'qmi?{' '}
          <Link to="/register" className="font-medium" style={{ color: '#00d4ff' }}>Ro'yxatdan o'tish</Link>
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
