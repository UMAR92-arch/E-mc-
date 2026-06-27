import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../firebase/config';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserPlus, BookOpen } from 'lucide-react';

const REGIONS = [
  'Toshkent shahar','Toshkent viloyati','Andijon viloyati','Buxoro viloyati',
  'Farg\'ona viloyati','Jizzax viloyati','Xorazm viloyati','Namangan viloyati',
  'Navoiy viloyati','Qashqadaryo viloyati','Qoraqalpog\'iston Respublikasi',
  'Samarqand viloyati','Sirdaryo viloyati','Surxondaryo viloyati'
];
const GRADES = Array.from({ length: 11 }, (_, i) => i + 1);

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName:'', lastName:'', school:'', region:'', district:'',
    phone:'', age:'', grade:'', login:'', password:''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let email = form.login.includes('@') ? form.login : `${form.login}@ilmfan.uz`;
      const cred = await createUserWithEmailAndPassword(auth, email, form.password);
      await setDoc(doc(db, 'users', cred.user.uid), {
        firstName: form.firstName, lastName: form.lastName,
        school: form.school, region: form.region, district: form.district,
        phone: form.phone || '', age: Number(form.age), grade: Number(form.grade),
        role: 'student', streak: 0, points: 0, badges: [],
        createdAt: serverTimestamp()
      });
      navigate('/');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setError('Bu login band!');
      else if (err.code === 'auth/weak-password') setError('Parol kamida 6 ta belgi bo\'lishi kerak!');
      else setError("Ro'yxatdan o'tishda xatolik yuz berdi.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative" style={{ background: '#05080f' }}>
      <div className="stars-bg" />
      <div className="floating-shape bg-green-500" style={{ width: 350, height: 350, top: '-5%', left: '-5%', opacity: 0.08 }} />
      <div className="floating-shape bg-blue-500" style={{ width: 300, height: 300, bottom: '-5%', right: '-5%', opacity: 0.08, animationDelay: '-10s' }} />

      <div className="glass-panel rounded-3xl p-8 w-full max-w-2xl relative z-10 slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-2xl mb-4" style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)' }}>
            <UserPlus size={30} style={{ color: '#00ff88' }} />
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk' }}>
            <span className="gradient-text">IlmFan</span> — Ro'yxatdan o'tish
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>O'quvchi sifatida qo'shiling</p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl text-sm text-center"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Ism', key: 'firstName', type: 'text', placeholder: 'Ismingiz' },
            { label: 'Familiya', key: 'lastName', type: 'text', placeholder: 'Familiyangiz' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{f.label}</label>
              <input className="input-field" type={f.type} placeholder={f.placeholder}
                value={form[f.key]} onChange={e => set(f.key, e.target.value)} required />
            </div>
          ))}

          <div className="md:col-span-2">
            <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Maktab</label>
            <input className="input-field" placeholder="Masalan: 1-IDUM" value={form.school} onChange={e => set('school', e.target.value)} required />
          </div>

          <div>
            <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Viloyat</label>
            <select className="input-field" value={form.region} onChange={e => set('region', e.target.value)} required>
              <option value="">Viloyat tanlang</option>
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Tuman</label>
            <input className="input-field" placeholder="Tuman..." value={form.district} onChange={e => set('district', e.target.value)} required />
          </div>

          <div>
            <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Yosh</label>
            <input className="input-field" type="number" min="6" max="100" value={form.age} onChange={e => set('age', e.target.value)} required />
          </div>

          <div>
            <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Sinf</label>
            <select className="input-field" value={form.grade} onChange={e => set('grade', e.target.value)} required>
              <option value="">Sinf tanlang</option>
              {GRADES.map(g => <option key={g} value={g}>{g}-sinf</option>)}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Telefon (ixtiyoriy)</label>
            <input className="input-field" placeholder="+998 90 123 45 67" value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>

          <div>
            <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Login (o'zingiz o'ylab toping)</label>
            <input className="input-field" value={form.login} onChange={e => set('login', e.target.value)} required placeholder="mylogin123" id="reg-login" />
          </div>

          <div>
            <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Parol (min 6 belgi)</label>
            <input className="input-field" type="password" value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} placeholder="••••••••" id="reg-password" />
          </div>

          <div className="md:col-span-2 mt-2">
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3" id="reg-submit">
              {loading
                ? <span style={{ display:'inline-block',width:18,height:18,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',animation:'spin 0.8s linear infinite'}} />
                : <><UserPlus size={18} /> Ro'yxatdan o'tish</>}
            </button>
          </div>
        </form>

        <p className="text-center text-sm mt-5" style={{ color: 'var(--text-muted)' }}>
          Akkauntingiz bormi?{' '}
          <Link to="/login" style={{ color: '#00d4ff' }} className="font-medium">Kirish</Link>
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
