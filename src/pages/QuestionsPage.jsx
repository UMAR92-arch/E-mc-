import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { SUBJECTS } from './Home';
import { ArrowLeft, MessageCircle, Send, X, Search } from 'lucide-react';

export default function QuestionsPage() {
  const { userData, currentUser } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');

  useEffect(() => {
    const q = query(collection(db, 'questions'), orderBy('createdAt', 'desc'));
    const un = onSnapshot(q, snap => {
      setQuestions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return un;
  }, []);

  const filtered = questions.filter(q => {
    const matchSearch = q.title?.toLowerCase().includes(search.toLowerCase()) || q.body?.toLowerCase().includes(search.toLowerCase());
    const matchSubject = filterSubject === 'all' || q.subjectId === filterSubject;
    return matchSearch && matchSubject;
  });

  return (
    <div className="min-h-screen relative" style={{ background: '#05080f' }}>
      <div className="stars-bg" />
      <div className="container mx-auto px-4 lg:px-8 py-8 relative z-10">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 fade-in-up">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="btn-secondary p-2 rounded-xl">
              <ArrowLeft size={18} />
            </button>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
              💬
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">Barcha Savollar</h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                O'quvchilar tomonidan berilgan barcha savollar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="search-bar" style={{ width: 220 }}>
              <Search size={16} color="var(--text-muted)" />
              <input placeholder="Savol qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="input-field" style={{ width: 160 }} value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
              <option value="all">Barcha fanlar</option>
              {SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {filtered.length === 0 && (
            <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
              <MessageCircle size={48} className="mx-auto mb-4 opacity-20" />
              <p>Savollar topilmadi</p>
            </div>
          )}
          {filtered.map((q, i) => (
            <QuestionCard key={q.id} question={q} userData={userData} currentUser={currentUser} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function QuestionCard({ question, userData, currentUser, index }) {
  const [answers, setAnswers] = useState([]);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const subject = SUBJECTS.find(s => s.id === question.subjectId) || { name: question.subjectId, color: '#00d4ff' };

  useEffect(() => {
    const un = onSnapshot(
      query(collection(db, 'answers'), where('questionId', '==', question.id)),
      s => {
        const ans = s.docs.map(d => ({ id: d.id, ...d.data() }));
        ans.sort((a,b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));
        setAnswers(ans);
      }
    );
    return un;
  }, [question.id]);

  const submitReply = async () => {
    if (!replyText.trim()) return;
    await addDoc(collection(db, 'answers'), {
      questionId: question.id,
      subjectId: question.subjectId,
      body: replyText,
      authorId: currentUser.uid,
      authorName: `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim(),
      isTeacher: userData?.role === 'teacher',
      createdAt: serverTimestamp()
    });
    setReplyText('');
    setShowReply(false);
  };

  return (
    <div className={`question-card fade-in-up delay-${Math.min(index * 100, 500)}`} style={{ borderLeft: `3px solid ${subject.color}` }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span className="badge mb-2" style={{ background: `${subject.color}22`, color: subject.color, border: `1px solid ${subject.color}44` }}>
            {subject.name}
          </span>
          <h4 className="font-bold text-lg text-white mb-2">{question.title}</h4>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{question.body}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
        <span className="flex items-center gap-1">👤 {question.authorName}</span>
        <span>•</span>
        <span>{question.createdAt?.toDate?.().toLocaleDateString('uz-UZ') || 'Yaqinda'}</span>
      </div>

      {answers.length > 0 && (
        <div className="mt-4 space-y-3 pl-4 border-l-2 border-white/10">
          {answers.map(ans => (
            <div key={ans.id} className={ans.isTeacher ? 'teacher-answer' : 'bg-white/[0.02] rounded-xl p-4 border border-white/5'}>
              {ans.isTeacher && <div className="badge badge-gold mb-2">👨‍🏫 Ustoz javobi</div>}
              {ans.title && <h5 className="font-semibold text-sm mb-1">{ans.title}</h5>}
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{ans.body}</p>
              {ans.fileUrl && (
                <a href={ans.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs mt-2 badge badge-blue hover-glow">
                  📎 Qo'shimcha fayl/resurs
                </a>
              )}
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>— {ans.authorName}</p>
            </div>
          ))}
        </div>
      )}

      {!showReply ? (
        <button onClick={() => setShowReply(true)} className="btn-secondary text-xs flex items-center gap-2 mt-4 hover-glow">
          <MessageCircle size={14} /> Fikr bildirish ({answers.length})
        </button>
      ) : (
        <div className="modal-overlay">
          <div className="modal-box slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Fikr bildirish</h3>
              <button onClick={() => setShowReply(false)} className="btn-secondary p-2 rounded-lg"><X size={16} /></button>
            </div>
            <textarea className="input-field mb-4" rows={4} placeholder="O'z fikringiz yoki javobingizni yozing..."
              value={replyText}
              onChange={e => setReplyText(e.target.value)} />
            <button onClick={submitReply} className="btn-primary w-full flex items-center justify-center gap-2">
              <Send size={15} /> Yuborish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
