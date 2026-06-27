import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../firebase/config';
import {
  collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, setDoc, getDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  ArrowLeft, Video, BookOpen, FileText, ClipboardList,
  User, MessageCircle, Send, Download, Play, Clock,
  Eye, ChevronRight, X, Plus, CheckCircle, XCircle, Settings, Upload
} from 'lucide-react';
import { SUBJECTS } from './Home';

const TABS = [
  { id: 'videos',    label: 'Video Darsliklar', icon: <Video size={15} /> },
  { id: 'resources', label: 'Resurslar',         icon: <BookOpen size={15} /> },
  { id: 'docs',      label: 'Hujjatlar',         icon: <FileText size={15} /> },
  { id: 'tests',     label: 'Testlar',            icon: <ClipboardList size={15} /> },
  { id: 'qa',        label: 'Savol-Javob',        icon: <MessageCircle size={15} /> },
  { id: 'teacher',   label: "O'qituvchi",         icon: <User size={15} /> },
];

export default function SubjectPage() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const { userData, currentUser } = useAuth();
  const subject = SUBJECTS.find(s => s.id === subjectId) || { name: subjectId, icon: '📚', color: '#00d4ff' };

  const isMySubject = userData?.role === 'teacher' && userData?.subject === subjectId;

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab') || 'videos';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [videos, setVideos] = useState([]);
  const [resources, setResources] = useState([]);
  const [docs, setDocs] = useState([]);
  const [tests, setTests] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [teacherInfo, setTeacherInfo] = useState(null);
  
  const [playingVideo, setPlayingVideo] = useState(null);
  const [activeTest, setActiveTest] = useState(null);
  const [testAnswers, setTestAnswers] = useState({});
  const [testDone, setTestDone] = useState(false);
  
  const [showAskModal, setShowAskModal] = useState(false);
  const [askForm, setAskForm] = useState({ title: '', body: '' });
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyText, setReplyText] = useState('');
  
  // Teacher profile modal
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [pForm, setPForm] = useState({ firstName: userData?.firstName||'', lastName: userData?.lastName||'', age: '', bio: '', telegram: '', phone: '' });

  // Teacher Upload Modals
  const [showUploadModal, setShowUploadModal] = useState(null); // 'video', 'resource', 'doc'
  const [uploadForm, setUploadForm] = useState({ title: '', description: '', type: 'pdf', file: null, url: '' });
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Fetch all data
  useEffect(() => {
    const col = (name) => query(collection(db, name), where('subjectId', '==', subjectId));

    const unV = onSnapshot(col('videos'), s => {
      const arr = s.docs.map(d => ({ id: d.id, ...d.data() }));
      arr.sort((a,b)=>(b.createdAt?.toMillis?.()||0)-(a.createdAt?.toMillis?.()||0));
      setVideos(arr);
    });
    const unR = onSnapshot(col('resources'), s => {
      const arr = s.docs.map(d => ({ id: d.id, ...d.data() }));
      arr.sort((a,b)=>(b.createdAt?.toMillis?.()||0)-(a.createdAt?.toMillis?.()||0));
      setResources(arr);
    });
    const unD = onSnapshot(col('docs'), s => {
      const arr = s.docs.map(d => ({ id: d.id, ...d.data() }));
      arr.sort((a,b)=>(b.createdAt?.toMillis?.()||0)-(a.createdAt?.toMillis?.()||0));
      setDocs(arr);
    });
    const unT = onSnapshot(col('tests'), s => {
      const arr = s.docs.map(d => ({ id: d.id, ...d.data() }));
      arr.sort((a,b)=>(b.createdAt?.toMillis?.()||0)-(a.createdAt?.toMillis?.()||0));
      setTests(arr);
    });
    const unQ = onSnapshot(col('questions'), s => {
      const arr = s.docs.map(d => ({ id: d.id, ...d.data() }));
      arr.sort((a,b)=>(b.createdAt?.toMillis?.()||0)-(a.createdAt?.toMillis?.()||0));
      setQuestions(arr);
    });

    const unTI = onSnapshot(query(collection(db, 'teachers'), where('subjectId', '==', subjectId)),
      s => { if (!s.empty) setTeacherInfo({ id: s.docs[0].id, ...s.docs[0].data() }); });

    return () => { unV(); unR(); unD(); unT(); unQ(); unTI(); };
  }, [subjectId]);

  // Submit question
  const submitQuestion = async () => {
    if (!askForm.title.trim() || !askForm.body.trim()) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'questions'), {
        subjectId,
        title: askForm.title,
        body: askForm.body,
        authorId: currentUser.uid,
        authorName: `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim(),
        createdAt: serverTimestamp(),
      });
      setAskForm({ title: '', body: '' });
      setShowAskModal(false);
      setPlayingVideo(null); // Close video modal if open
      setActiveTab('qa');
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  // Submit reply
  const submitReply = async (questionId) => {
    if (!replyText.trim()) return;
    await addDoc(collection(db, 'answers'), {
      questionId, subjectId, body: replyText,
      authorId: currentUser.uid,
      authorName: `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim(),
      isTeacher: userData?.role === 'teacher',
      createdAt: serverTimestamp()
    });
    setReplyText('');
    setReplyTarget(null);
  };

  // Profile Save
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      await setDoc(doc(db, 'teachers', currentUser.uid), { ...pForm, subjectId, createdAt: serverTimestamp() }, { merge: true });
      setShowProfileModal(false);
    } catch(e) { console.error(e); }
    setUploading(false);
  };

  // Content Uploads
  const handleUpload = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      if (showUploadModal === 'video') {
        if (!uploadForm.file) return;
        const r = ref(storage, `videos/${Date.now()}_${uploadForm.file.name}`);
        await uploadBytes(r, uploadForm.file);
        const url = await getDownloadURL(r);
        await addDoc(collection(db, 'videos'), {
          subjectId, title: uploadForm.title, description: uploadForm.description, url, views: 0, teacherId: currentUser.uid, createdAt: serverTimestamp()
        });
      } else if (showUploadModal === 'resource') {
        let url = uploadForm.url;
        if (uploadForm.file) {
          const r = ref(storage, `resources/${Date.now()}_${uploadForm.file.name}`);
          await uploadBytes(r, uploadForm.file);
          url = await getDownloadURL(r);
        }
        await addDoc(collection(db, 'resources'), {
          subjectId, title: uploadForm.title, type: uploadForm.type, url,
          size: uploadForm.file ? `${(uploadForm.file.size/1024).toFixed(0)} KB` : '—', teacherId: currentUser.uid, createdAt: serverTimestamp()
        });
      }
      setShowUploadModal(null);
      setUploadForm({ title: '', description: '', type: 'pdf', file: null, url: '' });
    } catch (e) { console.error(e); }
    setUploading(false);
  };

  // Test logic
  const startTest = (test) => { setActiveTest(test); setTestAnswers({}); setTestDone(false); };
  const score = activeTest ? activeTest.questions?.filter((q, i) => testAnswers[i] === q.correct).length : 0;

  return (
    <div className="min-h-screen relative" style={{ background: '#05080f' }}>
      <div className="stars-bg" />
      <div className="container mx-auto px-4 lg:px-8 py-8 relative z-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 fade-in-up">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="btn-secondary p-2 rounded-xl">
              <ArrowLeft size={18} />
            </button>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: `${subject.color}22`, border: `1px solid ${subject.color}44`, boxShadow: `0 0 20px ${subject.glow||subject.color+'44'}` }}>
              {subject.icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">{subject.name}</h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {videos.length} video · {resources.length} resurs · {tests.length} test
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={() => { setAskForm({ title: '', body: '' }); setShowAskModal(true); }}
              className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={16} /> Savol berish
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-list mb-8 fade-in-up delay-100">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* VIDEOS */}
        {activeTab === 'videos' && (
          <div>
            {isMySubject && (
              <div className="mb-6 flex justify-end">
                <button onClick={() => setShowUploadModal('video')} className="btn-primary flex items-center gap-2 text-sm"><Upload size={14}/> Yangi video darslik qo'shish</button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {videos.length === 0 && <EmptyState icon={<Video size={40} />} text="Hali video yuklanmagan" />}
              {videos.map((v, i) => (
                <div key={v.id} className={`video-card fade-in-up delay-${Math.min(i*100,500)}`}
                  onClick={() => setPlayingVideo(v)}>
                  <div className="relative" style={{ background: '#0d1117', aspectRatio: '16/9' }}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(0,212,255,0.2)', border: '2px solid rgba(0,212,255,0.4)' }}>
                        <Play size={22} style={{ color: '#00d4ff' }} />
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-2">{v.title}</h3>
                    <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span className="flex items-center gap-1"><Clock size={12} /> {new Date(v.createdAt?.toMillis()||Date.now()).toLocaleDateString('uz-UZ')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RESOURCES */}
        {activeTab === 'resources' && (
          <div>
            {isMySubject && (
              <div className="mb-6 flex justify-end">
                <button onClick={() => setShowUploadModal('resource')} className="btn-primary flex items-center gap-2 text-sm"><Upload size={14}/> Yangi resurs qo'shish</button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resources.length === 0 && <EmptyState icon={<BookOpen size={40} />} text="Hali resurs yuklanmagan" />}
              {resources.map((r, i) => (
                <div key={r.id} className={`file-card fade-in-up delay-${Math.min(i*100,500)}`} onClick={() => {
                  if(r.type === 'link') window.open(r.url, '_blank');
                  else window.open(r.url, '_blank');
                }}>
                  <div className="p-3 rounded-xl flex-shrink-0"
                    style={{ background: 'rgba(0,212,255,0.12)', fontSize: 24 }}>
                    {r.type === 'pdf' ? '📄' : r.type === 'link' ? '🔗' : '🖼️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{r.title}</div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {r.type?.toUpperCase()} · Yuklangan: {new Date(r.createdAt?.toMillis()||Date.now()).toLocaleDateString('uz-UZ')}
                    </div>
                  </div>
                  <button onClick={(e) => {
                    e.stopPropagation();
                    setAskForm({ title: `Resurs: ${r.title}`, body: '' });
                    setShowAskModal(true);
                  }} className="btn-secondary text-xs px-3 py-1 flex items-center gap-1">
                    <MessageCircle size={12}/> Savol
                  </button>
                  <a href={r.url} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} className="btn-secondary p-2 rounded-lg flex-shrink-0">
                    <Download size={16} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DOCS */}
        {activeTab === 'docs' && (
          <div>
            {isMySubject && (
              <div className="mb-6 flex justify-end">
                <button onClick={() => setShowUploadModal('doc')} className="btn-primary flex items-center gap-2 text-sm"><Upload size={14}/> Yangi hujjat qo'shish</button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {docs.length === 0 && <EmptyState icon={<FileText size={40} />} text="Hali hujjat yuklanmagan" />}
              {docs.map((d, i) => (
                <div key={d.id} className={`file-card fade-in-up delay-${Math.min(i*100,500)}`}>
                  <div className="p-3 rounded-xl flex-shrink-0 text-2xl"
                    style={{ background: 'rgba(139,92,246,0.12)' }}>
                    {d.type === 'pdf' ? '📕' : d.type === 'word' ? '📘' : '📊'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{d.title}</div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{d.type?.toUpperCase()} · {new Date(d.createdAt?.toMillis()||Date.now()).toLocaleDateString('uz-UZ')}</div>
                  </div>
                  <a href={d.url} target="_blank" rel="noreferrer" className="btn-secondary p-2 rounded-lg flex-shrink-0">
                    <Download size={16} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TESTS */}
        {activeTab === 'tests' && !activeTest && (
          <div>
            {isMySubject && (
              <div className="mb-6 flex justify-end">
                <button onClick={() => navigate('/teacher')} className="btn-primary flex items-center gap-2 text-sm"><Plus size={14}/> Yangi test qo'shish</button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {tests.length === 0 && <EmptyState icon={<ClipboardList size={40} />} text="Hali test yaratilmagan" />}
              {tests.map((t, i) => (
                <div key={t.id} className={`stat-card fade-in-up delay-${Math.min(i*100,500)}`}>
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-bold text-base">{t.title}</h3>
                    <span className={`badge ${t.level === 'easy' ? 'badge-green' : t.level === 'hard' ? 'badge-purple' : 'badge-blue'}`}>
                      {t.level === 'easy' ? 'Oson' : t.level === 'hard' ? 'Qiyin' : "O'rtacha"}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
                    <span>📝 {t.questions?.length || 0} savol</span>
                    <span>⏱ {t.timeLimit || 10} daqiqa</span>
                    <span>⭐ {t.maxScore || 100} ball</span>
                  </div>
                  <button onClick={() => startTest(t)} className="btn-primary w-full text-sm py-2">
                    Boshlash →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ACTIVE TEST */}
        {activeTab === 'tests' && activeTest && (
          <div className="max-w-2xl mx-auto">
            {!testDone ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">{activeTest.title}</h2>
                  <button onClick={() => setActiveTest(null)} className="btn-secondary text-sm">Bekor</button>
                </div>
                {activeTest.questions?.map((q, qi) => (
                  <div key={qi} className="question-card mb-4 fade-in-up">
                    <p className="font-medium mb-4">{qi + 1}. {q.text}</p>
                    <div className="grid gap-2">
                      {q.options?.map((opt, oi) => (
                        <div key={oi} onClick={() => setTestAnswers({ ...testAnswers, [qi]: oi })}
                          className={`test-option ${testAnswers[qi] === oi ? 'selected' : ''}`}>
                          {String.fromCharCode(65 + oi)}. {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <button onClick={() => setTestDone(true)} className="btn-primary w-full py-3 mt-4">
                  Yakunlash
                </button>
              </>
            ) : (
              <div className="text-center glass-panel rounded-2xl p-12 slide-up">
                <div className="text-6xl mb-4">{score / activeTest.questions?.length >= 0.7 ? '🎉' : '💪'}</div>
                <h2 className="text-3xl font-bold gradient-text mb-2">{score}/{activeTest.questions?.length}</h2>
                <p className="text-lg mb-2">
                  {score / activeTest.questions?.length >= 0.7 ? 'Ajoyib natija!' : 'Davom eting, yaxshi bo\'lasiz!'}
                </p>
                <p style={{ color: 'var(--text-muted)' }} className="mb-8">
                  Ball: {Math.round((score / activeTest.questions?.length) * (activeTest.maxScore || 100))} / {activeTest.maxScore || 100}
                </p>
                <button onClick={() => setActiveTest(null)} className="btn-primary">← Testlarga qaytish</button>
              </div>
            )}
          </div>
        )}

        {/* Q&A */}
        {activeTab === 'qa' && (
          <div className="max-w-3xl mx-auto space-y-4">
            {questions.length === 0 && <EmptyState icon={<MessageCircle size={40} />} text="Hali savol berilmagan. Birinchi bo'lib savol bering!" />}
            {questions.map((q, i) => (
              <QuestionCard key={q.id} question={q} subjectId={subjectId}
                userData={userData} currentUser={currentUser}
                replyTarget={replyTarget} setReplyTarget={setReplyTarget}
                replyText={replyText} setReplyText={setReplyText}
                submitReply={submitReply} index={i} />
            ))}
          </div>
        )}

        {/* TEACHER */}
        {activeTab === 'teacher' && (
          <div className="max-w-xl mx-auto">
            {isMySubject && (
              <div className="flex justify-end mb-4">
                <button onClick={() => setShowProfileModal(true)} className="btn-primary flex items-center gap-2 text-sm">
                  <Settings size={15} /> Ma'lumotnomani to'ldirish
                </button>
              </div>
            )}
            {teacherInfo ? (
              <div className="glass-panel rounded-2xl p-8 text-center fade-in-up border border-white/5" style={{ boxShadow: `0 0 40px ${subject.color}11` }}>
                <div className="w-28 h-28 rounded-full mx-auto mb-5 flex items-center justify-center text-5xl"
                  style={{ background: `${subject.color}22`, border: `2px solid ${subject.color}44` }}>
                  {teacherInfo.avatar ? <img src={teacherInfo.avatar} className="w-full h-full rounded-full object-cover" /> : '👨‍🏫'}
                </div>
                <h2 className="text-3xl font-bold mb-2">{teacherInfo.firstName} {teacherInfo.lastName}</h2>
                <div className="badge badge-blue mx-auto mb-5 text-sm">{subject.name} o'qituvchisi</div>
                {teacherInfo.age && <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Yosh: {teacherInfo.age}</p>}
                {teacherInfo.bio && <p className="text-sm mb-6 px-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>"{teacherInfo.bio}"</p>}
                
                <div className="flex flex-col gap-3 text-sm max-w-xs mx-auto">
                  {teacherInfo.telegram && (
                    <a href={`https://t.me/${teacherInfo.telegram.replace('@','')}`} target="_blank" rel="noreferrer"
                      className="btn-secondary flex items-center justify-center gap-2 py-3 hover-glow">
                      📨 @{teacherInfo.telegram.replace('@','')}
                    </a>
                  )}
                  {teacherInfo.phone && (
                    <a href={`tel:${teacherInfo.phone}`} className="btn-secondary flex items-center justify-center gap-2 py-3 hover-glow">
                      📞 {teacherInfo.phone}
                    </a>
                  )}
                </div>
              </div>
            ) : <EmptyState icon={<User size={40} />} text="O'qituvchi ma'lumotlari hali to'ldirilmagan" />}
          </div>
        )}
      </div>

      {/* VIDEO MODAL */}
      {playingVideo && (
        <div className="modal-overlay" onClick={() => setPlayingVideo(null)}>
          <div onClick={e => e.stopPropagation()} className="slide-up" style={{ width: '100%', maxWidth: 800, background: '#0d1117', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ aspectRatio: '16/9', background: '#000' }}>
              <video src={playingVideo.url} controls autoPlay className="w-full h-full" />
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-xl mb-2">{playingVideo.title}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{playingVideo.description || 'Tavsif yo\'q'}</p>
                </div>
                <button onClick={() => setPlayingVideo(null)} className="btn-secondary p-2 rounded-xl ml-4 flex-shrink-0 bg-white/5 hover:bg-white/10">
                  <X size={20} />
                </button>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-2">
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Yuklangan: {new Date(playingVideo.createdAt?.toMillis()||Date.now()).toLocaleDateString('uz-UZ')}
                </div>
                {/* Ask Question right inside the video modal */}
                <button onClick={() => {
                  setAskForm({ title: `Video: ${playingVideo.title}`, body: '' });
                  setShowAskModal(true);
                }} className="btn-primary px-4 py-2 text-sm flex items-center gap-2 hover-glow">
                  <MessageCircle size={15} /> Shu dars bo'yicha savol yuborish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ASK QUESTION MODAL */}
      {showAskModal && (
        <div className="modal-overlay">
          <div className="modal-box slide-up" style={{ maxWidth: 500 }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2"><MessageCircle size={20} color="#00d4ff"/> Savol Yuborish</h3>
              <button onClick={() => setShowAskModal(false)} className="btn-secondary p-2 rounded-lg"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Savolning nomi (sarlavha)</label>
                <input className="input-field" placeholder="Mavzu qisqacha..." value={askForm.title}
                  onChange={e => setAskForm({ ...askForm, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Savol (To'liq yozing)</label>
                <textarea className="input-field" rows={5} placeholder="Tushunmagan joyingizni batafsil yozing..."
                  value={askForm.body} onChange={e => setAskForm({ ...askForm, body: e.target.value })} />
              </div>
              <button onClick={submitQuestion} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
                {loading ? 'Yuborilmoqda...' : <><Send size={16} /> Savolni yuborish</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEACHER PROFILE FILL MODAL */}
      {showProfileModal && (
        <div className="modal-overlay">
          <div className="modal-box slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2"><Settings size={20} color="#00ff88"/> Ma'lumotnomani to'ldirish</h3>
              <button onClick={() => setShowProfileModal(false)} className="btn-secondary p-2 rounded-lg"><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1 text-gray-400">Ism</label>
                  <input className="input-field" value={pForm.firstName} onChange={e=>setPForm({...pForm,firstName:e.target.value})} required/>
                </div>
                <div>
                  <label className="block text-sm mb-1 text-gray-400">Familiya</label>
                  <input className="input-field" value={pForm.lastName} onChange={e=>setPForm({...pForm,lastName:e.target.value})} required/>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1 text-gray-400">Yosh</label>
                <input type="number" className="input-field" value={pForm.age} onChange={e=>setPForm({...pForm,age:e.target.value})} />
              </div>
              <div>
                <label className="block text-sm mb-1 text-gray-400">Bio / O'zingiz haqingizda</label>
                <textarea className="input-field" rows={3} value={pForm.bio} onChange={e=>setPForm({...pForm,bio:e.target.value})} />
              </div>
              <div>
                <label className="block text-sm mb-1 text-gray-400">Telegram (@ username)</label>
                <input className="input-field" value={pForm.telegram} onChange={e=>setPForm({...pForm,telegram:e.target.value})} />
              </div>
              <div>
                <label className="block text-sm mb-1 text-gray-400">Telefon raqam</label>
                <input className="input-field" value={pForm.phone} onChange={e=>setPForm({...pForm,phone:e.target.value})} placeholder="+998..." />
              </div>
              <button type="submit" disabled={uploading} className="btn-primary w-full py-3 mt-2">
                {uploading ? 'Saqlanmoqda...' : 'Ma\'lumotlarni Saqlash'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TEACHER UPLOAD CONTENT MODAL */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-box slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Upload size={20} color="#00d4ff"/> {showUploadModal === 'video' ? "Yangi video darslik qo'shish" : showUploadModal === 'resource' ? "Yangi resurs qo'shish" : "Yangi hujjat qo'shish"}
              </h3>
              <button onClick={() => setShowUploadModal(null)} className="btn-secondary p-2 rounded-lg"><X size={16} /></button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm mb-1 text-gray-400">Sarlavha</label>
                <input className="input-field" value={uploadForm.title} onChange={e=>setUploadForm({...uploadForm,title:e.target.value})} required />
              </div>
              {showUploadModal === 'video' && (
                <div>
                  <label className="block text-sm mb-1 text-gray-400">Batafsil ma'lumot (Tavsif)</label>
                  <textarea className="input-field" rows={3} value={uploadForm.description} onChange={e=>setUploadForm({...uploadForm,description:e.target.value})} />
                </div>
              )}
              {(showUploadModal === 'resource' || showUploadModal === 'doc') && (
                <div>
                  <label className="block text-sm mb-1 text-gray-400">Turi</label>
                  <select className="input-field" value={uploadForm.type} onChange={e=>setUploadForm({...uploadForm,type:e.target.value})}>
                    <option value="pdf">PDF / Hujjat</option>
                    {showUploadModal === 'resource' && <option value="link">Havola (Link)</option>}
                    {showUploadModal === 'resource' && <option value="image">Rasm</option>}
                    {showUploadModal === 'doc' && <option value="word">Word</option>}
                    {showUploadModal === 'doc' && <option value="excel">Excel</option>}
                  </select>
                </div>
              )}
              {uploadForm.type === 'link' ? (
                <div>
                  <label className="block text-sm mb-1 text-gray-400">Link URL</label>
                  <input className="input-field" type="url" value={uploadForm.url} onChange={e=>setUploadForm({...uploadForm,url:e.target.value})} required />
                </div>
              ) : (
                <div>
                  <label className="block text-sm mb-1 text-gray-400">Fayl</label>
                  <label className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black/40 border border-dashed border-white/20 hover:border-[#00d4ff] text-slate-300 hover:text-white rounded-xl cursor-pointer transition-all text-sm">
                    <Upload size={16} />
                    <span className="truncate max-w-[200px]">{uploadForm.file ? uploadForm.file.name : (showUploadModal === 'video' ? "Video yuklash" : "Fayl yuklash")}</span>
                    <input type="file" className="hidden" accept={showUploadModal === 'video' ? 'video/*' : '*/*'} onChange={e=>setUploadForm({...uploadForm,file:e.target.files[0]})} required />
                  </label>
                </div>
              )}
              <button type="submit" disabled={uploading} className="btn-primary w-full py-3 mt-2">
                {uploading ? 'Yuklanmoqda...' : 'Yuklash'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function QuestionCard({ question, subjectId, userData, currentUser, replyTarget, setReplyTarget, replyText, setReplyText, submitReply, index }) {
  const [answers, setAnswers] = useState([]);
  const [showReply, setShowReply] = useState(false);

  useEffect(() => {
    const un = onSnapshot(
      query(collection(db, 'answers'), where('questionId', '==', question.id)),
      s => {
        const ans = s.docs.map(d => ({ id: d.id, ...d.data() }));
        ans.sort((a,b)=>(a.createdAt?.toMillis?.()||0)-(b.createdAt?.toMillis?.()||0));
        setAnswers(ans);
      }
    );
    return un;
  }, [question.id]);

  return (
    <div className={`question-card fade-in-up delay-${Math.min(index * 100, 500)} border border-white/10`}>
      <div className="mb-3">
        <h4 className="font-semibold text-lg text-white mb-2">{question.title}</h4>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{question.body}</p>
      </div>
      <div className="flex items-center gap-3 text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
        <span>👤 {question.authorName}</span>
        <span>•</span>
        <span>{new Date(question.createdAt?.toMillis()||Date.now()).toLocaleDateString('uz-UZ')}</span>
      </div>

      {answers.length > 0 && (
        <div className="mt-4 space-y-3 pl-4 border-l-2 border-white/10 pt-2">
          {answers.map(ans => (
            <div key={ans.id} className={ans.isTeacher ? 'teacher-answer mb-3' : 'bg-white/[0.03] rounded-xl p-3 mb-3 border border-white/5'}>
              {ans.isTeacher && <div className="badge badge-gold mb-2">👨‍🏫 Ustoz javobi</div>}
              {ans.title && <h5 className="font-semibold text-sm mb-2 text-white">{ans.title}</h5>}
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{ans.body}</p>
              {ans.fileUrl && (
                <a href={ans.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs mt-3 badge badge-blue hover-glow">
                  📎 Qo'shimcha fayl/resurs ochish
                </a>
              )}
              <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>— {ans.authorName}</p>
            </div>
          ))}
        </div>
      )}

      {!showReply ? (
        <button onClick={() => setShowReply(true)} className="btn-secondary text-xs flex items-center gap-2 mt-4 hover-glow border border-white/10">
          <MessageCircle size={14} /> Maslahat berish ({answers.length})
        </button>
      ) : (
        <div className="modal-overlay">
          <div className="modal-box slide-up" style={{ maxWidth: 500 }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold flex items-center gap-2"><MessageCircle size={18} color="#00ff88"/> Maslahat berish</h3>
              <button onClick={() => setShowReply(false)} className="btn-secondary p-2 rounded-lg"><X size={16} /></button>
            </div>
            <textarea className="input-field mb-4" rows={5} placeholder="Boshqalarga yordam bering. Sizning maslahatingiz..."
              value={replyTarget === question.id ? replyText : ''}
              onChange={e => { setReplyTarget(question.id); setReplyText(e.target.value); }} />
            <button onClick={() => { submitReply(question.id); setShowReply(false); }} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              <Send size={15} /> Maslahatni yuborish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div className="col-span-full text-center py-20" style={{ color: 'var(--text-muted)' }}>
      <div className="opacity-20 mb-4 flex justify-center">{icon}</div>
      <p>{text}</p>
    </div>
  );
}
