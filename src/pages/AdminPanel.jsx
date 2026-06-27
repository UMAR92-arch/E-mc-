import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase/config';
import {
  collection, query, onSnapshot, addDoc, serverTimestamp, doc, setDoc, orderBy, where, deleteDoc
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updatePassword, updateEmail, deleteUser } from 'firebase/auth';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, ClipboardList,
  Settings, LogOut, Home, Plus, X, TrendingUp, UserCheck, Activity, Search
} from 'lucide-react';
import { SUBJECTS } from './Home';

const SIDEBAR = [
  { id: 'dashboard',  label: 'Bosh Oyna',     icon: <LayoutDashboard size={16} /> },
  { id: 'students',   label: "O'quvchilar",   icon: <GraduationCap size={16} /> },
  { id: 'teachers',   label: "O'qituvchilar", icon: <Users size={16} /> },
  { id: 'admins',     label: 'Adminlar',      icon: <Settings size={16} /> },
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
  const [admins, setAdmins] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [questions, setQuestions] = useState([]);
  
  const [searchS, setSearchS] = useState('');
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [tForm, setTForm] = useState({ firstName: '', lastName: '', login: '', password: '', subject: '', role: 'teacher' });
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState('');

  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showTeacherDetails, setShowTeacherDetails] = useState(false);
  const [credForm, setCredForm] = useState({ adminPassword: '', newEmail: '', newPassword: '' });
  const [credLoading, setCredLoading] = useState(false);
  
  // O'chirish uchun statelar
  const [deleteStep, setDeleteStep] = useState(0); 
  const [deleteAdminPass, setDeleteAdminPass] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const unUsers = onSnapshot(collection(db, 'users'), snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllUsers(all);
      setStudents(all.filter(u => u.role === 'student'));
      setTeachers(all.filter(u => u.role === 'teacher'));
      setAdmins(all.filter(u => u.role === 'admin'));
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
        email, password: tForm.password, passwordHistory: [tForm.password], 
        streak: 0, points: 0, createdAt: serverTimestamp()
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

  const handleChangeTeacherCreds = async (e) => {
    e.preventDefault();
    if (!credForm.adminPassword || !credForm.newEmail || !credForm.newPassword) {
      return notify("❌ Barcha maydonlarni to'ldiring!");
    }
    setCredLoading(true);
    const adminEmail = auth.currentUser.email;
    
    try {
      // 1. Admin parolini tasdiqlash uchun admin bo'lib qayta kiramiz
      await signInWithEmailAndPassword(auth, adminEmail, credForm.adminPassword);
      
      // 2. O'qituvchining hozirgi paroli bilan uning profiliga yashirincha kiramiz
      const oldPassword = selectedTeacher.password;
      if (!oldPassword) throw new Error("O'qituvchining oldingi paroli bazada topilmadi. Parolni o'zgartirib bo'lmaydi.");
      
      await signInWithEmailAndPassword(auth, selectedTeacher.email, oldPassword);
      
      // 3. O'qituvchining ma'lumotlarini yangilaymiz
      if (auth.currentUser.email !== credForm.newEmail) {
        await updateEmail(auth.currentUser, credForm.newEmail);
      }
      await updatePassword(auth.currentUser, credForm.newPassword);
      
      // 4. Firestore ni yangilaymiz
      const newHistory = [...(selectedTeacher.passwordHistory || [oldPassword]), credForm.newPassword];
      await setDoc(doc(db, 'users', selectedTeacher.id), {
        email: credForm.newEmail,
        password: credForm.newPassword,
        passwordHistory: newHistory
      }, { merge: true });
      
      // 5. Adminga qaytamiz
      await signInWithEmailAndPassword(auth, adminEmail, credForm.adminPassword);
      
      notify("✅ Parol va Login muvaffaqiyatli o'zgartirildi!");
      setShowTeacherDetails(false);
      setCredForm({ adminPassword: '', newEmail: '', newPassword: '' });
      setSelectedTeacher(null);
    } catch (err) {
      console.error(err);
      notify("❌ Xatolik: " + err.message);
      // Xatolik bo'lsa, baribir Adminga qaytishga harakat qilamiz
      try {
        if (auth.currentUser?.email !== adminEmail) {
          await signInWithEmailAndPassword(auth, adminEmail, credForm.adminPassword);
        }
      } catch (e) {
        console.error("Adminga qaytishda xatolik", e);
      }
    }
    setCredLoading(false);
  };

  const handleDeleteUser = async (e) => {
    e.preventDefault();
    if (!deleteAdminPass) return notify("❌ Admin parolini kiriting!");
    setDeleteLoading(true);
    const adminEmail = auth.currentUser.email;

    try {
      // 1. Admin parolini tasdiqlash uchun admin bo'lib qayta kiramiz
      await signInWithEmailAndPassword(auth, adminEmail, deleteAdminPass);
      
      // 2. O'qituvchining hozirgi paroli bilan uning profiliga yashirincha kiramiz
      const oldPassword = selectedTeacher.password;
      if (!oldPassword) throw new Error("O'qituvchining oldingi paroli bazada topilmadi. Firebase Auth orqali o'chirib bo'lmaydi.");
      
      await signInWithEmailAndPassword(auth, selectedTeacher.email, oldPassword);
      
      // 3. Foydalanuvchini Auth dan o'chiramiz
      await deleteUser(auth.currentUser);
      
      // 4. Firestore dan o'chiramiz
      await deleteDoc(doc(db, 'users', selectedTeacher.id));
      await deleteDoc(doc(db, 'teachers', selectedTeacher.id));
      
      // 5. Adminga qaytamiz
      await signInWithEmailAndPassword(auth, adminEmail, deleteAdminPass);
      
      notify("✅ Akkaunt butunlay o'chirib yuborildi!");
      setShowTeacherDetails(false);
      setSelectedTeacher(null);
      setDeleteStep(0);
      setDeleteAdminPass('');
    } catch (err) {
      console.error(err);
      notify("❌ Xatolik: " + err.message);
      try {
        if (auth.currentUser?.email !== adminEmail) {
          await signInWithEmailAndPassword(auth, adminEmail, deleteAdminPass);
        }
      } catch (e) {}
    }
    setDeleteLoading(false);
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
  const chartStudents = useMemo(() => generateChart(students), [students]);
  const chartTeachers = useMemo(() => generateChart(teachers), [teachers]);
  const chartAdmins = useMemo(() => generateChart(admins), [admins]);

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
              <button onClick={() => { setTForm({...tForm, role: 'teacher'}); setShowAddTeacher(true); }} className="btn-primary flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', border: 'none' }}>
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
                        <tr key={t.id} onClick={() => { setSelectedTeacher(t); setShowTeacherDetails(true); }} className="cursor-pointer hover:bg-white/[0.02] transition-colors">
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

        {/* ADMINS */}
        {activeTab === 'admins' && (
          <div className="fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-bold gradient-text mb-1" style={{ fontFamily: 'Space Grotesk', color: '#ef4444' }}>Adminlar Bazasi</h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Jami: {admins.length} ta admin ({allUsers.length ? Math.round(admins.length/allUsers.length*100) : 0}%)</p>
              </div>
              <button onClick={() => { setTForm({...tForm, role: 'admin'}); setShowAddTeacher(true); }} className="btn-primary flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)', border: 'none' }}>
                <Plus size={18} /> Yangi Admin Qo'shish
              </button>
            </div>

            <div className="glass-panel rounded-2xl p-6 mb-8 hover-glow">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Activity className="text-red-500"/> Adminlar ro'yxatdan o'tish dinamikasi</h3>
              <div className="w-full bg-black/30 rounded-xl p-4 border border-white/5">
                <MiniChart data={chartAdmins} color="#ef4444" />
              </div>
            </div>

            <div className="glass-panel rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="data-table w-full text-left">
                  <thead>
                    <tr>
                      <th>Ism va Familiya</th>
                      <th>Login (Email)</th>
                      <th>Huquq</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map(t => (
                      <tr key={t.id} onClick={() => { setSelectedTeacher(t); setShowTeacherDetails(true); }} className="cursor-pointer hover:bg-white/[0.02] transition-colors">
                        <td className="font-medium flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                            {t.firstName?.[0]?.toUpperCase()||'A'}
                          </div>
                          {t.firstName} {t.lastName}
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{t.email}</td>
                        <td>
                          <span className="badge badge-red">ADMIN</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* QUESTIONS */}
        {activeTab === 'questions' && (
          <div className="fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-bold gradient-text-purple mb-1" style={{ fontFamily: 'Space Grotesk' }}>Barcha Savollar va Maslahatlar</h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Butun saytdan kelib tushgan barcha savollar va muhokamalar</p>
              </div>
            </div>

            <div className="space-y-4">
              {questions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">Hech qanday savol yo'q.</div>
              ) : (
                questions.map(q => {
                  const sub = SUBJECTS.find(s => s.id === q.subjectId);
                  return (
                    <div key={q.id} className="glass-panel p-5 rounded-2xl hover-glow transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-[#00d4ff] font-bold text-lg">{q.title}</span>
                          <span className="badge badge-blue text-xs">{sub ? sub.name : q.subjectId}</span>
                        </div>
                        <span className="text-xs text-gray-500">{q.createdAt?.toDate ? q.createdAt.toDate().toLocaleString('uz-UZ') : ''}</span>
                      </div>
                      <p className="text-gray-300 text-sm mb-4">{q.body}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <UserCheck size={14} className="text-[#00ff88]" /> Muallif: <span className="text-white font-medium">{q.authorName}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

      </main>

      {/* ADD USER MODAL */}
      {showAddTeacher && (
        <div className="modal-overlay">
          <div className="modal-box slide-up" style={{ maxWidth: 500, borderColor: tForm.role === 'admin' ? '#ef444444' : '#7c3aed44', boxShadow: tForm.role === 'admin' ? '0 0 50px rgba(239,68,68,0.15)' : '0 0 50px rgba(124,58,237,0.15)' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold flex items-center gap-2 ${tForm.role === 'admin' ? 'text-red-500' : 'text-[#7c3aed]'}`}>
                <UserCheck size={20}/> {tForm.role === 'admin' ? "Yangi Admin Qo'shish" : "Yangi O'qituvchi Qo'shish"}
              </h3>
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
              {tForm.role === 'teacher' && (
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Biriktiriladigan Fan</label>
                  <select className="input-field" value={tForm.subject} onChange={e => setTForm({...tForm,subject:e.target.value})} required>
                    <option value="">Fanni tanlang...</option>
                    {SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}
              <button type="submit" disabled={adding} className="btn-primary w-full py-3 mt-4" style={{ background: tForm.role === 'admin' ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : 'linear-gradient(135deg, #7c3aed, #5b21b6)', border: 'none' }}>
                {adding ? 'Saqlanmoqda...' : "Ma'lumotlarni Saqlash"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TEACHER DETAILS MODAL */}
      {showTeacherDetails && selectedTeacher && (
        <div className="modal-overlay">
          <div className="modal-box slide-up" style={{ maxWidth: 500, borderColor: '#7c3aed44', boxShadow: '0 0 50px rgba(124,58,237,0.15)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#7c3aed] flex items-center gap-2"><UserCheck size={20}/> O'qituvchi Ma'lumotlari</h3>
              <button onClick={() => {setShowTeacherDetails(false); setSelectedTeacher(null); setCredForm({adminPassword:'', newEmail:'', newPassword:''}); setDeleteStep(0); setDeleteAdminPass('');}} className="btn-secondary p-2 rounded-lg"><X size={16} /></button>
            </div>
            
            <div className="mb-6 bg-black/20 p-4 rounded-xl border border-white/5 space-y-2 text-sm">
              <p><span className="text-gray-400">Ism:</span> {selectedTeacher.firstName} {selectedTeacher.lastName}</p>
              <p><span className="text-gray-400">Joriy Login (Email):</span> <span className="text-[#00d4ff] font-mono">{selectedTeacher.email}</span></p>
              <p><span className="text-gray-400">Joriy Parol:</span> <span className="text-[#00ff88] font-mono">{selectedTeacher.password || "Kiritilmagan/Eski"}</span></p>
              <div>
                <span className="text-gray-400 block mb-1">Parollar Tarixi:</span>
                <div className="flex flex-wrap gap-2">
                  {selectedTeacher.passwordHistory?.map((p, i) => (
                     <span key={i} className="px-2 py-1 bg-white/5 rounded text-xs font-mono border border-white/10">{p}</span>
                  )) || <span className="text-xs text-gray-500">Tarix yo'q</span>}
                </div>
              </div>
            </div>

            <h4 className="font-bold text-red-400 mb-3 border-b border-red-500/20 pb-2">Parol va Loginni Majburiy O'zgartirish</h4>
            <form onSubmit={handleChangeTeacherCreds} className="space-y-4">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>O'qituvchining Yangi Logini (Emaili)</label>
                <input className="input-field" value={credForm.newEmail} onChange={e => setCredForm({...credForm,newEmail:e.target.value})} required placeholder="yangi@ilmfan.uz" />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>O'qituvchining Yangi Paroli</label>
                <input type="password" className="input-field" value={credForm.newPassword} onChange={e => setCredForm({...credForm,newPassword:e.target.value})} required minLength={6} placeholder="Yangi parol..." />
              </div>
              <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <label className="block text-xs mb-2 text-red-300">XAVFSIZLIK: O'zgartirishni tasdiqlash uchun *Sizning* (Admin) parolingiz:</label>
                <input type="password" className="input-field border-red-500/30 focus:border-red-500" value={credForm.adminPassword} onChange={e => setCredForm({...credForm,adminPassword:e.target.value})} required placeholder="Admin paroli..." />
              </div>
              <button type="submit" disabled={credLoading} className="w-full py-3 mt-2 rounded-xl text-white font-medium transition-all" style={{ background: credLoading ? '#333' : 'linear-gradient(135deg, #ef4444, #b91c1c)' }}>
                {credLoading ? "O'zgartirilmoqda (Kuting)..." : "Majburiy O'zgartirish"}
              </button>
            </form>

            {/* DELETE ACCOUNT SECTION */}
            <div className="mt-8 pt-4 border-t border-red-500/20">
              <h4 className="font-bold text-red-500 flex items-center gap-2 mb-3"><Activity size={18}/> Xavfli Hudud: Akkauntni O'chirish</h4>
              {deleteStep === 0 && (
                <button onClick={() => setDeleteStep(1)} className="btn-secondary w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/20">
                  Foydalanuvchini Butunlay O'chirish
                </button>
              )}
              {deleteStep === 1 && (
                <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/30 slide-up">
                  <p className="text-sm text-red-300 mb-4 text-center">Rostdan ham bu akkauntni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi!</p>
                  <div className="flex gap-3">
                    <button onClick={() => setDeleteStep(0)} className="btn-secondary flex-1">Bekor qilish</button>
                    <button onClick={() => setDeleteStep(2)} className="bg-red-600 text-white rounded-xl flex-1 py-2 font-medium hover:bg-red-500 transition-colors">Ha, O'chirilsin</button>
                  </div>
                </div>
              )}
              {deleteStep === 2 && (
                <form onSubmit={handleDeleteUser} className="p-4 bg-red-500/20 rounded-xl border border-red-500/50 slide-up">
                  <p className="text-xs text-red-300 mb-2 font-bold uppercase tracking-wider text-center">So'nggi Tasdiq (2/2)</p>
                  <p className="text-xs text-red-200 mb-3 text-center">Tasdiqlash uchun O'zingizning (Admin) parolingizni kiriting:</p>
                  <input type="password" required value={deleteAdminPass} onChange={e => setDeleteAdminPass(e.target.value)} className="input-field border-red-500/50 mb-4 text-center" placeholder="Admin parolini yozing..." />
                  <div className="flex gap-3">
                    <button type="button" onClick={() => {setDeleteStep(0); setDeleteAdminPass('');}} className="btn-secondary flex-1">Bekor qilish</button>
                    <button type="submit" disabled={deleteLoading} className="bg-red-700 text-white rounded-xl flex-1 py-2 font-bold hover:bg-red-600 transition-colors">
                      {deleteLoading ? "O'chirilmoqda..." : "BUTUNLAY O'CHIRISH"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
