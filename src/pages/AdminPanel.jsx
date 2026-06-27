import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase/config';
import {
  collection, query, onSnapshot, addDoc, serverTimestamp, doc, setDoc, orderBy, where
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, ClipboardList,
  Settings, LogOut, Home, Plus, X, TrendingUp, UserCheck, Activity, Search
} from 'lucide-react';
import { SUBJECTS } from './Home';

const SIDEBAR = [
  { id: 'dashboard',  label: 'Bosh Oyna',     icon: <LayoutDashboard size={16} /> },
  { id: 'students',   label: "O'quvchilar",   icon: <GraduationCap size={16} /> },
  { id: 'teachers',   label: "O'qituvchilar", icon: <Users size={16} /> },
  { id: 'subjects',   label: 'Fanlar',        icon: <BookOpen size={16} /> },
  { id: 'questions',  label: 'Savollar',       icon: <ClipboardList size={16} /> },
];

function MiniChart({ data, color = '#00d4ff' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !data.length) return;
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    ctx.clearRect(0, 0, W, H);
    
    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for(let i=1; i<4; i++){
      ctx.beginPath();
      ctx.moveTo(0, H*(i/4));
      ctx.lineTo(W, H*(i/4));
      ctx.stroke();
    }

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, color + '66');
    grad.addColorStop(1, color + '00');
    
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - ((v - min) / range) * H * 0.8 - H * 0.1;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
  }, [data, color]);
  return <canvas ref={ref} width={600} height={200} className="w-full h-[200px]" />;
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [questions, setQuestions] = useState([]);
  
  const [searchS, setSearchS] = useState('');
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [tForm, setTForm] = useState({ firstName: '', lastName: '', login: '', password: '', subject: '', role: 'teacher' });
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const unUsers = onSnapshot(collection(db, 'users'), snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllUsers(all);
      setStudents(all.filter(u => u.role === 'student'));
      setTeachers(all.filter(u => u.role === 'teacher' || u.role === 'admin'));
    });
    const unQ = onSnapshot(collection(db, 'questions'), snap => {
      const allQ = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      allQ.sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setQuestions(allQ);
    });
    return () => { unUsers(); unQ(); };
  }, []);

  const notify = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      const email = tForm.login.includes('@') ? tForm.login : `${tForm.login}@ilmfan.uz`;
      const cred = await createUserWithEmailAndPassword(auth, email, tForm.password);
      await setDoc(doc(db, 'users', cred.user.uid), {
        firstName: tForm.firstName, lastName: tForm.lastName,
        role: tForm.role, subject: tForm.subject,
        email, streak: 0, points: 0, createdAt: serverTimestamp()
      });
      setTForm({ firstName: '', lastName: '', login: '', password: '', subject: '', role: 'teacher' });
      setShowAddTeacher(false);
      notify(`✅ ${tForm.firstName} muvaffaqiyatli qo'shildi!`);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') notify('❌ Bu login band!');
      else notify('❌ Xatolik: ' + err.message);
    }
    setAdding(false);
  };

  const filteredStudents = students.filter(s =>
    `${s.firstName} ${s.lastName} ${s.school}`.toLowerCase().includes(searchS.toLowerCase())
  );

  const generateChart = (userList) => {
    const data = new Array(14).fill(0);
    const now = Date.now();
    userList.forEach(u => {
      let time = now;
      if (u.createdAt?.toDate) time = u.createdAt.toDate().getTime();
      else if (u.createdAt?.toMillis) time = u.createdAt.toMillis();
      
      const diffDays = Math.floor((now - time) / (1000 * 60 * 60 * 24));
      if (diffDays < 14 && diffDays >= 0) data[13 - diffDays]++;
      else if (diffDays >= 14) data[0]++; 
    });
    let sum = 0;
    return data.map(val => { sum += val; return sum; });
  };

  const chartAll = generateChart(allUsers);
  const chartStudents = generateChart(students);
  const chartTeachers = generateChart(teachers);

  return (
    <div className="flex min-h-screen text-gray-200" style={{ background: '#05080f' }}>
      <div className="stars-bg" />
      
      {msg && (
        <div className="fixed top-6 right-6 z-50 glass-panel rounded-xl px-5 py-3 text-sm font-medium slide-up" style={{ zIndex: 99999 }}>
          {msg}
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="w-64 fixed top-0 left-0 h-full border-r border-white/5 z-40 flex flex-col py-6 px-4" style={{ background: 'rgba(5,8,15,0.7)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-3 mb-10 px-2 cursor-pointer logo-pulse" onClick={() => navigate('/')}>
          <div className="p-2 rounded-xl neon-purple" style={{ background: 'linear-gradient(135deg, #7c3aed, #4c1d95)' }}>
            <LayoutDashboard size={22} color="white" />
          </div>
          <div>
            <div className="font-bold text-lg gradient-text-purple tracking-wide" style={{ fontFamily: 'Space Grotesk' }}>ADMIN</div>
            <div className="text-[10px] text-purple-300 font-semibold uppercase">Superuser Mode</div>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {SIDEBAR.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`sidebar-item w-full text-left flex items-center gap-3 ${activeTab === item.id ? 'active' : ''}`}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-white/10 pt-4 space-y-2 mt-auto">
          <button onClick={() => navigate('/')} className="sidebar-item w-full flex items-center gap-3">
            <Home size={16} /> Bosh sahifa
          </button>
          <button onClick={() => auth.signOut()} className="sidebar-item w-full flex items-center gap-3 text-red-400 hover:text-red-300">
            <LogOut size={16} /> Tizimdan chiqish
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="ml-64 flex-1 p-8 md:p-10 relative z-10 overflow-y-auto h-screen">

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="fade-in-up">
            <h1 className="text-3xl font-bold gradient-text-purple mb-2" style={{ fontFamily: 'Space Grotesk' }}>Umumiy Ko'rsatkichlar</h1>
            <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>Platformaning real-time holati va statistikasi</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="glass-panel rounded-2xl p-6 hover-glow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl neon-blue border border-blue-500/30"><Users size={24} /></div>
                </div>
                <div className="text-4xl font-bold text-white mb-1" style={{ fontFamily: 'JetBrains Mono' }}>{allUsers.length}</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Jami Foydalanuvchilar</div>
              </div>
              <div className="glass-panel rounded-2xl p-6 hover-glow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-500/20 text-green-400 rounded-xl border border-green-500/30"><GraduationCap size={24} /></div>
                  <span className="text-sm font-semibold text-green-400">{allUsers.length ? Math.round(students.length/allUsers.length*100) : 0}%</span>
                </div>
                <div className="text-4xl font-bold text-white mb-1" style={{ fontFamily: 'JetBrains Mono' }}>{students.length}</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Jami O'quvchilar</div>
              </div>
              <div className="glass-panel rounded-2xl p-6 hover-glow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl neon-purple border border-purple-500/30"><UserCheck size={24} /></div>
                  <span className="text-sm font-semibold text-purple-400">{allUsers.length ? Math.round(teachers.length/allUsers.length*100) : 0}%</span>
                </div>
                <div className="text-4xl font-bold text-white mb-1" style={{ fontFamily: 'JetBrains Mono' }}>{teachers.length}</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Jami O'qituvchilar</div>
              </div>
              <div className="glass-panel rounded-2xl p-6 hover-glow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30"><ClipboardList size={24} /></div>
                </div>
                <div className="text-4xl font-bold text-white mb-1" style={{ fontFamily: 'JetBrains Mono' }}>{questions.length}</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Berilgan Savollar</div>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6 mb-8 hover-glow">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <TrendingUp size={20} className="text-[#00d4ff]" />
                  <h3 className="font-bold text-white text-lg">Umumiy o'sish dinamikasi (14 kun)</h3>
                </div>
                <span className="badge badge-green flex items-center gap-2">
                  <Activity size={12} /> Live
                </span>
              </div>
              <div className="w-full bg-black/30 rounded-xl p-4 border border-white/5">
                <MiniChart data={chartAll} color="#00d4ff" />
              </div>
            </div>
          </div>
        )}

        {/* STUDENTS */}
        {activeTab === 'students' && (
          <div className="fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-3xl font-bold gradient-text mb-1" style={{ fontFamily: 'Space Grotesk' }}>O'quvchilar Bazasi</h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Jami: {students.length} ta o'quvchi ({allUsers.length ? Math.round(students.length/allUsers.length*100) : 0}%)</p>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6 mb-8 hover-glow">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2"><GraduationCap className="text-[#00ff88]"/> O'quvchilar ro'yxatdan o'tish dinamikasi</h3>
              <div className="w-full bg-black/30 rounded-xl p-4 border border-white/5">
                <MiniChart data={chartStudents} color="#00ff88" />
              </div>
            </div>

            <div className="glass-panel rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <h3 className="font-bold text-white">Ro'yxat</h3>
                <div className="search-bar" style={{ width: 220 }}>
                  <Search size={14} color="var(--text-muted)" />
                  <input placeholder="Ism orqali qidirish..." value={searchS} onChange={e => setSearchS(e.target.value)} />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="data-table w-full text-left">
                  <thead>
                    <tr>
                      <th>Ism va Familiya</th>
                      <th>Email/Login</th>
                      <th>Rol</th>
                      <th>Sana</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map(s => (
                      <tr key={s.id}>
                        <td className="font-medium flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold" style={{ background: 'rgba(0,255,136,0.15)', color: '#00ff88' }}>
                            {s.firstName?.[0]?.toUpperCase()||'O'}
                          </div>
                          {s.firstName} {s.lastName}
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{s.email}</td>
                        <td><span className="badge badge-green">O'quvchi</span></td>
                        <td style={{ color: 'var(--text-muted)' }}>{s.createdAt?.toDate ? s.createdAt.toDate().toLocaleDateString('uz-UZ') : 'Yaqinda'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredStudents.length === 0 && <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Hech narsa topilmadi</div>}
            </div>
          </div>
        )}

        {/* TEACHERS */}
        {activeTab === 'teachers' && (
          <div className="fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-bold gradient-text-purple mb-1" style={{ fontFamily: 'Space Grotesk' }}>O'qituvchilar Bazasi</h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Jami: {teachers.length} ta o'qituvchi ({allUsers.length ? Math.round(teachers.length/allUsers.length*100) : 0}%)</p>
              </div>
              <button onClick={() => setShowAddTeacher(true)} className="btn-primary flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', border: 'none' }}>
                <Plus size={18} /> Yangi O'qituvchi Qo'shish
              </button>
            </div>

            <div className="glass-panel rounded-2xl p-6 mb-8 hover-glow">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2"><UserCheck className="text-[#7c3aed]"/> O'qituvchilar ro'yxatdan o'tish dinamikasi</h3>
              <div className="w-full bg-black/30 rounded-xl p-4 border border-white/5">
                <MiniChart data={chartTeachers} color="#7c3aed" />
              </div>
            </div>

            <div className="glass-panel rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="data-table w-full text-left">
                  <thead>
                    <tr>
                      <th>Ism va Familiya</th>
                      <th>Biriktirilgan Fan</th>
                      <th>Login (Email)</th>
                      <th>Huquq</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map(t => {
                      const sub = SUBJECTS.find(s => s.id === t.subject);
                      return (
                        <tr key={t.id}>
                          <td className="font-medium flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold" style={{ background: 'rgba(124,58,237,0.15)', color: '#7c3aed' }}>
                              {t.firstName?.[0]?.toUpperCase()||'O'}
                            </div>
                            {t.firstName} {t.lastName}
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>{sub ? `${sub.icon} ${sub.name}` : 'Admin'}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{t.email}</td>
                          <td>
                            <span className={`badge ${t.role==='admin' ? 'badge-purple' : 'badge-blue'}`}>
                              {t.role.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ADD TEACHER MODAL */}
      {showAddTeacher && (
        <div className="modal-overlay">
          <div className="modal-box slide-up" style={{ maxWidth: 500, borderColor: '#7c3aed44', boxShadow: '0 0 50px rgba(124,58,237,0.15)' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#7c3aed] flex items-center gap-2"><UserCheck size={20}/> Yangi O'qituvchi Qo'shish</h3>
              <button onClick={() => setShowAddTeacher(false)} className="btn-secondary p-2 rounded-lg"><X size={16} /></button>
            </div>
            <form onSubmit={handleAddTeacher} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Ism (Majburiy emas)</label>
                  <input className="input-field" value={tForm.firstName} onChange={e => setTForm({...tForm,firstName:e.target.value})} placeholder="Alisher..." />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Familiya (Majburiy emas)</label>
                  <input className="input-field" value={tForm.lastName} onChange={e => setTForm({...tForm,lastName:e.target.value})} placeholder="Navoiy..." />
                </div>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Login (Email sifatida saqlanadi)</label>
                <input className="input-field" value={tForm.login} onChange={e => setTForm({...tForm,login:e.target.value})} required placeholder="Ustoz123" />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Maxfiy Parol (min 6 belgi)</label>
                <input type="password" className="input-field" value={tForm.password} onChange={e => setTForm({...tForm,password:e.target.value})} required minLength={6} placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Biriktiriladigan Fan</label>
                <select className="input-field" value={tForm.subject} onChange={e => setTForm({...tForm,subject:e.target.value})} required>
                  <option value="">Fanni tanlang...</option>
                  {SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Foydalanuvchi Roli</label>
                <select className="input-field" value={tForm.role} onChange={e => setTForm({...tForm,role:e.target.value})}>
                  <option value="teacher">Oddiy O'qituvchi</option>
                  <option value="admin">Tizim Administratori (Admin)</option>
                </select>
              </div>
              <button type="submit" disabled={adding} className="btn-primary w-full py-3 mt-2" style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', border: 'none' }}>
                {adding ? 'Saqlanmoqda...' : "Ma'lumotlarni Saqlash"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
