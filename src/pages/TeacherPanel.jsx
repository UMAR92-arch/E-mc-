import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../firebase/config';
import {
  collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, setDoc, getDoc, orderBy
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  Home, Video, BookOpen, FileText, ClipboardList, MessageCircle,
  User, Plus, Send, X, Upload, ChevronRight, LogOut
} from 'lucide-react';
import { auth } from '../firebase/config';
import { SUBJECTS } from './Home';

const TABS = [
  { id: 'videos',    label: 'Video Darsliklar', icon: <Video size={16} /> },
  { id: 'resources', label: 'Resurslar',         icon: <BookOpen size={16} /> },
  { id: 'docs',      label: 'Hujjatlar',         icon: <FileText size={16} /> },
  { id: 'tests',     label: 'Test Yaratish',      icon: <ClipboardList size={16} /> },
  { id: 'qa',        label: 'Savollar',           icon: <MessageCircle size={16} /> },
  { id: 'profile',   label: 'Profilim',           icon: <User size={16} /> },
];

export default function TeacherPanel() {
  const { userData, currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('videos');
  const [videos, setVideos] = useState([]);
  const [resources, setResources] = useState([]);
  const [docs, setDocs] = useState([]);
  const [tests, setTests] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');

  // Video form
  const [vForm, setVForm] = useState({ title: '', description: '', file: null });
  // Resource form
  const [rForm, setRForm] = useState({ title: '', type: 'pdf', file: null, url: '' });
  // Doc form
  const [dForm, setDForm] = useState({ title: '', type: 'pdf', file: null });
  // Test form
  const [tForm, setTForm] = useState({ title: '', level: 'medium', timeLimit: 10, maxScore: 100, questions: [] });
  const [testQ, setTestQ] = useState({ text: '', options: ['','','',''], correct: 0 });
  // Profile form
  const [pForm, setPForm] = useState({ firstName: '', lastName: '', bio: '', telegram: '', phone: '' });
  // Q&A
  const [ansModal, setAnsModal] = useState(null);
  const [ansForm, setAnsForm] = useState({ title: '', body: '', file: null });

  const subjectId = userData?.subject;
  const subject = SUBJECTS.find(s => s.id === subjectId) || { name: 'Fan', icon: '📚', color: '#00d4ff' };

  useEffect(() => {
    if (!subjectId) return;
    const col = (n) => query(collection(db, n), where('subjectId', '==', subjectId), orderBy('createdAt', 'desc'));
    const unV = onSnapshot(col('videos'),    s => setVideos(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unR = onSnapshot(col('resources'), s => setResources(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unD = onSnapshot(col('docs'),      s => setDocs(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unT = onSnapshot(col('tests'),     s => setTests(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unQ = onSnapshot(
      query(collection(db, 'questions'), where('subjectId', '==', subjectId)),
      s => {
        const qs = s.docs.map(d => ({ id: d.id, ...d.data() }));
        qs.sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        setQuestions(qs);
      }
    );
    // Load teacher info
    const loadTeacher = async () => {
      const snap = await getDoc(doc(db, 'teachers', currentUser.uid));
      if (snap.exists()) {
        const data = snap.data();
        setTeacherInfo(data);
        setPForm({ firstName: data.firstName||'', lastName: data.lastName||'', bio: data.bio||'', telegram: data.telegram||'', phone: data.phone||'' });
      } else {
        setPForm({ firstName: userData?.firstName||'', lastName: userData?.lastName||'', bio:'', telegram:'', phone:'' });
      }
    };
    loadTeacher();
    return () => { unV(); unR(); unD(); unT(); unQ(); };
  }, [subjectId, currentUser.uid]);

  const notify = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const uploadFile = async (file, folder) => {
    const r = ref(storage, `${folder}/${Date.now()}_${file.name}`);
    await uploadBytes(r, file);
    return getDownloadURL(r);
  };

  // Upload video
  const handleVideoUpload = async (e) => {
    e.preventDefault();
    if (!vForm.file) return;
    setUploading(true);
    try {
      const url = await uploadFile(vForm.file, 'videos');
      await addDoc(collection(db, 'videos'), {
        subjectId, title: vForm.title, description: vForm.description,
        url, views: 0, teacherId: currentUser.uid, createdAt: serverTimestamp()
      });
      setVForm({ title: '', description: '', file: null });
      notify('✅ Video muvaffaqiyatli yuklandi!');
    } catch (e) { notify('❌ Xatolik yuz berdi'); }
    setUploading(false);
  };

  // Upload resource
  const handleResourceUpload = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      let url = rForm.url;
      if (rForm.file) url = await uploadFile(rForm.file, 'resources');
      await addDoc(collection(db, 'resources'), {
        subjectId, title: rForm.title, type: rForm.type,
        url, size: rForm.file ? `${(rForm.file.size/1024).toFixed(0)} KB` : '—',
        teacherId: currentUser.uid, createdAt: serverTimestamp()
      });
      setRForm({ title: '', type: 'pdf', file: null, url: '' });
      notify('✅ Resurs yuklandi!');
    } catch (e) { notify('❌ Xatolik yuz berdi'); }
    setUploading(false);
  };

  // Upload doc
  const handleDocUpload = async (e) => {
    e.preventDefault();
    if (!dForm.file) return;
    setUploading(true);
    try {
      const url = await uploadFile(dForm.file, 'docs');
      await addDoc(collection(db, 'docs'), {
        subjectId, title: dForm.title, type: dForm.type,
        url, size: `${(dForm.file.size/1024).toFixed(0)} KB`,
        teacherId: currentUser.uid, createdAt: serverTimestamp()
      });
      setDForm({ title: '', type: 'pdf', file: null });
      notify('✅ Hujjat yuklandi!');
    } catch (e) { notify('❌ Xatolik yuz berdi'); }
    setUploading(false);
  };

  // Add test question
  const addTestQuestion = () => {
    if (!testQ.text.trim()) return;
    setTForm(prev => ({ ...prev, questions: [...prev.questions, { ...testQ }] }));
    setTestQ({ text: '', options: ['','','',''], correct: 0 });
  };

  // Save test
  const handleSaveTest = async (e) => {
    e.preventDefault();
    if (tForm.questions.length === 0) return notify('❌ Kamida 1 ta savol qo\'shing');
    setUploading(true);
    try {
      await addDoc(collection(db, 'tests'), {
        subjectId, title: tForm.title, level: tForm.level,
        timeLimit: Number(tForm.timeLimit), maxScore: Number(tForm.maxScore),
        questions: tForm.questions, teacherId: currentUser.uid, createdAt: serverTimestamp()
      });
      setTForm({ title: '', level: 'medium', timeLimit: 10, maxScore: 100, questions: [] });
      notify('✅ Test saqlandi!');
    } catch (e) { notify('❌ Xatolik yuz berdi'); }
    setUploading(false);
  };

  // Save profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      await setDoc(doc(db, 'teachers', currentUser.uid), { ...pForm, subjectId, createdAt: serverTimestamp() }, { merge: true });
      notify('✅ Profil saqlandi!');
    } catch (e) { notify('❌ Xatolik yuz berdi'); }
    setUploading(false);
  };

  // Reply to question
  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!ansForm.body.trim()) return;
    setUploading(true);
    try {
      let fileUrl = '';
      if (ansForm.file) {
        fileUrl = await uploadFile(ansForm.file, 'answers');
      }
      await addDoc(collection(db, 'answers'), {
        questionId: ansModal, subjectId, 
        title: ansForm.title, body: ansForm.body, fileUrl,
        authorId: currentUser.uid,
        authorName: `${userData?.firstName||''} ${userData?.lastName||''}`.trim(),
        isTeacher: true, createdAt: serverTimestamp()
      });
      setAnsModal(null);
      setAnsForm({ title: '', body: '', file: null });
      notify('✅ Javob yuborildi!');
    } catch(err) {
      notify('❌ Xatolik yuz berdi');
    }
    setUploading(false);
  };

  return (
    <div className="flex min-h-screen" style={{ background: '#05080f' }}>
      <div className="stars-bg" />

      {/* SIDEBAR */}
      <aside className="sidebar w-64 fixed top-0 left-0 h-full z-40 flex flex-col py-6 px-4">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="p-2 rounded-xl neon-blue" style={{ background: 'linear-gradient(135deg,#00d4ff,#0084a3)' }}>
            <BookOpen size={20} color="white" />
          </div>
          <span className="font-bold text-lg gradient-text" style={{ fontFamily: 'Space Grotesk' }}>IlmFan</span>
        </div>

        <div className="glass-panel rounded-xl p-4 mb-6 text-center" style={{ border: `1px solid ${subject.color}44` }}>
          <div className="text-3xl mb-2">{subject.icon}</div>
          <div className="font-bold text-sm">{subject.name}</div>
          <div className="badge badge-blue mt-2 text-xs">Mening Fanim</div>
        </div>

        <nav className="flex-1">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`sidebar-item w-full text-left ${activeTab === tab.id ? 'active' : ''}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-white/10 pt-4 space-y-2">
          <button onClick={() => navigate('/')} className="sidebar-item w-full">
            <Home size={16} /> Bosh sahifa
          </button>
          <button onClick={() => auth.signOut()} className="sidebar-item w-full text-red-400 hover:text-red-300">
            <LogOut size={16} /> Chiqish
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="ml-64 flex-1 p-8 relative z-10">
        {msg && (
          <div className="fixed top-6 right-6 z-50 glass-panel rounded-xl px-5 py-3 text-sm font-medium slide-up">
            {msg}
          </div>
        )}

        {/* ===== VIDEOS TAB ===== */}
        {activeTab === 'videos' && (
          <div>
            <h2 className="text-2xl font-bold gradient-text mb-6">Video Darslik Yuklash</h2>
            <form onSubmit={handleVideoUpload} className="glass-panel rounded-2xl p-6 mb-8 space-y-4 max-w-xl">
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Sarlavha</label>
                <input className="input-field" value={vForm.title} onChange={e => setVForm({...vForm, title:e.target.value})} required placeholder="Video sarlavhasi..." />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Tavsif</label>
                <textarea className="input-field" rows={3} value={vForm.description} onChange={e => setVForm({...vForm, description:e.target.value})} placeholder="Qisqacha tavsif..." />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Video fayl</label>
                <label className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black/40 border border-dashed border-white/20 hover:border-[#00d4ff] text-slate-300 hover:text-white rounded-xl cursor-pointer transition-all text-sm">
                  <Upload size={16} />
                  <span className="truncate max-w-[200px]">{vForm.file ? vForm.file.name : "Video faylini yuklash"}</span>
                  <input type="file" accept="video/*" className="hidden" onChange={e => setVForm({...vForm, file:e.target.files[0]})} required />
                </label>
              </div>
              <button type="submit" disabled={uploading} className="btn-primary flex items-center gap-2">
                <Upload size={16} /> {uploading ? 'Yuklanmoqda...' : 'Yuklash'}
              </button>
            </form>
            <h3 className="font-bold mb-4" style={{ color: 'var(--text-secondary)' }}>Yuklangan Videolar ({videos.length})</h3>
            <div className="grid gap-3">
              {videos.map(v => (
                <div key={v.id} className="glass-panel rounded-xl p-4 flex items-center gap-4">
                  <Video size={20} style={{ color: '#00d4ff' }} />
                  <div className="flex-1"><div className="font-medium text-sm">{v.title}</div><div className="text-xs" style={{ color: 'var(--text-muted)' }}>{v.views || 0} ko'rish</div></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== RESOURCES TAB ===== */}
        {activeTab === 'resources' && (
          <div>
            <h2 className="text-2xl font-bold gradient-text mb-6">Resurs Yuklash</h2>
            <form onSubmit={handleResourceUpload} className="glass-panel rounded-2xl p-6 mb-8 space-y-4 max-w-xl">
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Sarlavha</label>
                <input className="input-field" value={rForm.title} onChange={e => setRForm({...rForm, title:e.target.value})} required placeholder="Resurs nomi..." />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Tur</label>
                <select className="input-field" value={rForm.type} onChange={e => setRForm({...rForm, type:e.target.value})}>
                  <option value="pdf">PDF</option>
                  <option value="image">Rasm</option>
                  <option value="link">Havola</option>
                </select>
              </div>
              {rForm.type === 'link' ? (
                <input className="input-field" placeholder="https://..." value={rForm.url} onChange={e => setRForm({...rForm, url:e.target.value})} />
              ) : (
                <label className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black/40 border border-dashed border-white/20 hover:border-[#00ff88] text-slate-300 hover:text-white rounded-xl cursor-pointer transition-all text-sm mb-4">
                  <Upload size={16} />
                  <span className="truncate max-w-[200px]">{rForm.file ? rForm.file.name : "Resurs faylini yuklash"}</span>
                  <input type="file" className="hidden" onChange={e => setRForm({...rForm, file:e.target.files[0]})} />
                </label>
              )}
              <button type="submit" disabled={uploading} className="btn-primary flex items-center gap-2">
                <Upload size={16} /> {uploading ? 'Yuklanmoqda...' : 'Yuklash'}
              </button>
            </form>
            <div className="grid gap-3">
              {resources.map(r => (
                <div key={r.id} className="glass-panel rounded-xl p-4 flex items-center gap-4">
                  <BookOpen size={20} style={{ color: '#00ff88' }} />
                  <div className="flex-1"><div className="font-medium text-sm">{r.title}</div><div className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.type} · {r.size}</div></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== DOCS TAB ===== */}
        {activeTab === 'docs' && (
          <div>
            <h2 className="text-2xl font-bold gradient-text mb-6">Hujjat Yuklash</h2>
            <form onSubmit={handleDocUpload} className="glass-panel rounded-2xl p-6 mb-8 space-y-4 max-w-xl">
              <input className="input-field" value={dForm.title} onChange={e => setDForm({...dForm, title:e.target.value})} required placeholder="Hujjat nomi..." />
              <select className="input-field" value={dForm.type} onChange={e => setDForm({...dForm, type:e.target.value})}>
                <option value="pdf">PDF</option>
                <option value="word">Word</option>
                <option value="excel">Excel</option>
              </select>
              <label className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black/40 border border-dashed border-white/20 hover:border-[#a78bfa] text-slate-300 hover:text-white rounded-xl cursor-pointer transition-all text-sm">
                <Upload size={16} />
                <span className="truncate max-w-[200px]">{dForm.file ? dForm.file.name : "Hujjat faylini yuklash"}</span>
                <input type="file" className="hidden" onChange={e => setDForm({...dForm, file:e.target.files[0]})} required />
              </label>
              <button type="submit" disabled={uploading} className="btn-primary flex items-center gap-2">
                <Upload size={16} /> {uploading ? 'Yuklanmoqda...' : 'Yuklash'}
              </button>
            </form>
            <div className="grid gap-3">
              {docs.map(d => (
                <div key={d.id} className="glass-panel rounded-xl p-4 flex items-center gap-4">
                  <FileText size={20} style={{ color: '#a78bfa' }} />
                  <div className="font-medium text-sm">{d.title}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== TEST TAB ===== */}
        {activeTab === 'tests' && (
          <div>
            <h2 className="text-2xl font-bold gradient-text mb-6">Test Yaratish</h2>
            <form onSubmit={handleSaveTest} className="glass-panel rounded-2xl p-6 mb-6 space-y-4 max-w-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Test nomi</label>
                  <input className="input-field" value={tForm.title} onChange={e => setTForm({...tForm,title:e.target.value})} required placeholder="Test sarlavhasi..." />
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Daraja</label>
                  <select className="input-field" value={tForm.level} onChange={e => setTForm({...tForm,level:e.target.value})}>
                    <option value="easy">Oson</option>
                    <option value="medium">O'rtacha</option>
                    <option value="hard">Qiyin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Vaqt (daqiqa)</label>
                  <input type="number" className="input-field" value={tForm.timeLimit} onChange={e => setTForm({...tForm,timeLimit:e.target.value})} min={1} />
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <h4 className="font-semibold mb-3 text-sm">Savol qo'shish</h4>
                <input className="input-field mb-3" placeholder="Savol matni..." value={testQ.text} onChange={e => setTestQ({...testQ,text:e.target.value})} />
                {testQ.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2 mb-2">
                    <input type="radio" name="correct" checked={testQ.correct === oi} onChange={() => setTestQ({...testQ,correct:oi})} />
                    <input className="input-field text-sm" placeholder={`${String.fromCharCode(65+oi)} variant...`} value={opt}
                      onChange={e => { const ops=[...testQ.options]; ops[oi]=e.target.value; setTestQ({...testQ,options:ops}); }} />
                  </div>
                ))}
                <button type="button" onClick={addTestQuestion} className="btn-secondary text-sm mt-2">+ Savol qo'shish</button>
              </div>

              {tForm.questions.length > 0 && (
                <div className="border-t border-white/10 pt-3">
                  <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{tForm.questions.length} ta savol qo'shildi</p>
                </div>
              )}
              <button type="submit" disabled={uploading} className="btn-primary w-full">
                {uploading ? 'Saqlanmoqda...' : '💾 Testni Saqlash'}
              </button>
            </form>
          </div>
        )}

        {/* ===== Q&A TAB ===== */}
        {activeTab === 'qa' && (
          <div>
            <h2 className="text-2xl font-bold gradient-text mb-6">O'quvchilar Savollari ({questions.length})</h2>
            {questions.length === 0 && (
              <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
                <MessageCircle size={48} className="mx-auto mb-4 opacity-20" />
                <p>Hali savol berilmagan</p>
              </div>
            )}
            <div className="space-y-4 max-w-2xl">
              {questions.map(q => (
                <div key={q.id} className="question-card">
                  <h4 className="font-semibold mb-1">{q.title}</h4>
                  <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{q.body}</p>
                  <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>— {q.authorName}</p>
                  <div className="flex justify-end">
                    <button onClick={() => setAnsModal(q.id)} className="btn-primary px-4 flex items-center gap-2 text-sm mt-2">
                      <Send size={14} /> Javob berish
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Answer Modal */}
            {ansModal && (
              <div className="modal-overlay">
                <div className="modal-box slide-up">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">Ustoz Javobi</h3>
                    <button onClick={() => setAnsModal(null)} className="btn-secondary p-2 rounded-lg"><X size={16} /></button>
                  </div>
                  <form onSubmit={handleReplySubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Javob sarlavhasi (ixtiyoriy)</label>
                      <input className="input-field" placeholder="Masalan: Yechim qoidalari..." 
                        value={ansForm.title} onChange={e => setAnsForm({...ansForm, title: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Javob matni</label>
                      <textarea className="input-field" rows={4} placeholder="Batafsil tushuntirish..." required
                        value={ansForm.body} onChange={e => setAnsForm({...ansForm, body: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Qo'shimcha fayl/video/rasm yuklash</label>
                      <input type="file" className="input-field" onChange={e => setAnsForm({...ansForm, file: e.target.files[0]})} />
                    </div>
                    <button type="submit" disabled={uploading} className="btn-primary w-full flex items-center justify-center gap-2">
                      <Send size={16} /> {uploading ? 'Yuborilmoqda...' : 'Javob Yuborish'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== PROFILE TAB ===== */}
        {activeTab === 'profile' && (
          <div>
            <h2 className="text-2xl font-bold gradient-text mb-6">Mening Profilim</h2>
            <form onSubmit={handleSaveProfile} className="glass-panel rounded-2xl p-6 space-y-4 max-w-xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Ism</label>
                  <input className="input-field" value={pForm.firstName} onChange={e => setPForm({...pForm,firstName:e.target.value})} placeholder="Ism..." />
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Familiya</label>
                  <input className="input-field" value={pForm.lastName} onChange={e => setPForm({...pForm,lastName:e.target.value})} placeholder="Familiya..." />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Bio</label>
                <textarea className="input-field" rows={3} value={pForm.bio} onChange={e => setPForm({...pForm,bio:e.target.value})} placeholder="O'zingiz haqingizda..." />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Telegram (@ belgisisiz)</label>
                <input className="input-field" value={pForm.telegram} onChange={e => setPForm({...pForm,telegram:e.target.value})} placeholder="username" />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Telefon</label>
                <input className="input-field" value={pForm.phone} onChange={e => setPForm({...pForm,phone:e.target.value})} placeholder="+998 90 123 45 67" />
              </div>
              <button type="submit" disabled={uploading} className="btn-primary w-full">
                {uploading ? 'Saqlanmoqda...' : '💾 Saqlash'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
