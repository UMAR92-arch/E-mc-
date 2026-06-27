import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase/config';
import {
  BookOpen, Video, FileText, Search, LogOut,
  Flame, Trophy, ChevronRight, Zap, Users, Star,
  LayoutDashboard, Shield, MessageCircle
} from 'lucide-react';

const useCountUp = (end, duration = 2000) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime = null;
    const animate = (time) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(ease * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration]);
  return count;
};

const useTypewriter = (text, speed = 60) => {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    let i = 0;
    setDisplayed('');
    const iv = setInterval(() => {
      setDisplayed(text.substring(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(iv);
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed]);
  return displayed;
};

const SUBJECTS = [
  { id: 'matematika', name: 'Matematika', icon: '📐', color: '#3b82f6', glow: 'rgba(59,130,246,0.4)' },
  { id: 'fizika',     name: 'Fizika',     icon: '⚡', color: '#eab308', glow: 'rgba(234,179,8,0.4)' },
  { id: 'kimyo',      name: 'Kimyo',      icon: '🧪', color: '#22c55e', glow: 'rgba(34,197,94,0.4)' },
  { id: 'biologiya',  name: 'Biologiya',  icon: '🧬', color: '#10b981', glow: 'rgba(16,185,129,0.4)' },
  { id: 'geografiya', name: 'Geografiya', icon: '🌍', color: '#06b6d4', glow: 'rgba(6,182,212,0.4)' },
  { id: 'tarix',      name: 'Tarix',      icon: '🏛️', color: '#f59e0b', glow: 'rgba(245,158,11,0.4)' },
  { id: 'ona-tili',   name: 'Ona tili',   icon: '📝', color: '#8b5cf6', glow: 'rgba(139,92,246,0.4)' },
  { id: 'ingliz',     name: 'Ingliz tili',icon: '🇬🇧', color: '#ef4444', glow: 'rgba(239,68,68,0.4)' },
  { id: 'informatika',name: 'Informatika',icon: '💻', color: '#00d4ff', glow: 'rgba(0,212,255,0.4)' },
  { id: 'adabiyot',   name: 'Adabiyot',   icon: '📖', color: '#ec4899', glow: 'rgba(236,72,153,0.4)' },
];

export { SUBJECTS };

export default function Home() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState('');

  const videoCount = useCountUp(1247);
  const resourceCount = useCountUp(5830);
  const studentCount = useCountUp(12400);
  const heroText = useTypewriter("O'z bilimingizni kosmosga olib chiqing");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleMouseMove = (e) => {
    setMousePos({
      x: (e.clientX / window.innerWidth - 0.5) * 20,
      y: (e.clientY / window.innerHeight - 0.5) * 20
    });
  };

  useEffect(() => {
    const handleMouseMoveOrb = (e) => {
      const { clientX, clientY } = e;
      const orbs = document.querySelectorAll('.interactive-orb');
      orbs.forEach(orb => {
        const rect = orb.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        const distX = clientX - x;
        const distY = clientY - y;
        const dist = Math.sqrt(distX * distX + distY * distY);
        
        if (dist < 300) {
          const force = (300 - dist) / 300;
          const moveX = -(distX / dist) * force * 100;
          const moveY = -(distY / dist) * force * 100;
          orb.style.transform = `translate(${moveX}px, ${moveY}px) scale(${1 + force * 0.1})`;
        } else {
          orb.style.transform = `translate(0px, 0px) scale(1)`;
        }
      });
    };
    window.addEventListener('mousemove', handleMouseMoveOrb);
    return () => window.removeEventListener('mousemove', handleMouseMoveOrb);
  }, []);

  const handleLogout = () => auth.signOut();

  const filteredSubjects = SUBJECTS.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isTeacher = userData?.role === 'teacher';
  const isAdmin = userData?.role === 'admin';

  return (
    <div className="relative min-h-screen" onMouseMove={handleMouseMove}>
      <div className="stars-bg" />
      <div className="interactive-orb floating-shape bg-purple-500 transition-transform duration-300 ease-out" style={{ width: 400, height: 400, top: '5%', left: '-10%' }} />
      <div className="interactive-orb floating-shape bg-blue-400 transition-transform duration-300 ease-out" style={{ width: 300, height: 300, top: '50%', right: '-5%', animationDelay: '-7s' }} />
      <div className="interactive-orb floating-shape transition-transform duration-300 ease-out" style={{ width: 250, height: 250, bottom: '10%', left: '40%', animationDelay: '-14s', background: '#00ff88' }} />

      {/* NAVBAR */}
      <nav className={`fixed w-full top-0 z-50 transition-all duration-400 ${scrolled ? 'glass-panel py-3 shadow-lg' : 'bg-transparent py-5'}`}>
        <div className="container mx-auto px-4 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer logo-pulse" onClick={() => navigate('/')}>
            <div className="p-2 rounded-xl neon-blue" style={{ background: 'linear-gradient(135deg,#00d4ff,#0084a3)' }}>
              <BookOpen size={22} color="white" />
            </div>
            <span className="text-xl font-bold gradient-text" style={{ fontFamily: 'Space Grotesk' }}>IlmFan</span>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="search-bar" style={{ width: 280 }}>
              <Search size={16} color="var(--text-muted)" />
              <input
                placeholder="Fan qidirish..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/questions')} className="btn-secondary flex items-center gap-2 text-sm py-2 px-3">
              <MessageCircle size={15} />
              <span className="hidden sm:inline">Savollar</span>
            </button>
            {isAdmin && (
              <button onClick={() => navigate('/admin')} className="btn-secondary flex items-center gap-2 text-sm py-2 px-3">
                <Shield size={15} />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}
            {(isAdmin) && (
              <button onClick={() => navigate('/teacher')} className="btn-secondary flex items-center gap-2 text-sm py-2 px-3">
                <LayoutDashboard size={15} />
                <span className="hidden sm:inline">Panel</span>
              </button>
            )}
            <div className="hidden sm:block text-right">
              <div className="text-sm font-semibold">{userData?.firstName} {userData?.lastName}</div>
              <div className="text-xs" style={{ color: '#00ff88' }}>
                {userData?.role === 'student' ? "O'quvchi" : userData?.role === 'teacher' ? "O'qituvchi" : 'Admin'}
              </div>
            </div>
            <button onClick={handleLogout} className="p-2 rounded-full transition-all hover:bg-red-500/20 text-red-400" title="Chiqish">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* TEACHER TOP MENU */}
      {isTeacher && userData?.subject && (
        <div className="fixed w-full z-40 transition-all duration-400" style={{ top: scrolled ? '65px' : '85px' }}>
          <div className="container mx-auto px-4 lg:px-8">
            <div className="glass-panel py-2 px-4 rounded-xl flex items-center gap-2 overflow-x-auto hide-scrollbar border border-[#7c3aed44] shadow-[0_0_20px_rgba(124,58,237,0.15)]">
              <span className="text-xs font-bold uppercase tracking-wider gradient-text-purple mr-2 hidden sm:inline">Mening Fanim:</span>
              <button onClick={() => navigate(`/subject/${userData.subject}?tab=teacher`)} className="btn-secondary whitespace-nowrap text-xs py-1.5 px-3">Profilim</button>
              <button onClick={() => navigate(`/subject/${userData.subject}?tab=videos`)} className="btn-secondary whitespace-nowrap text-xs py-1.5 px-3">Video Darsliklar</button>
              <button onClick={() => navigate(`/subject/${userData.subject}?tab=resources`)} className="btn-secondary whitespace-nowrap text-xs py-1.5 px-3">Resurslar</button>
              <button onClick={() => navigate(`/subject/${userData.subject}?tab=docs`)} className="btn-secondary whitespace-nowrap text-xs py-1.5 px-3">Hujjatlar</button>
              <button onClick={() => navigate(`/subject/${userData.subject}?tab=tests`)} className="btn-secondary whitespace-nowrap text-xs py-1.5 px-3">Testlar</button>
              <button onClick={() => navigate(`/subject/${userData.subject}?tab=qa`)} className="btn-secondary whitespace-nowrap text-xs py-1.5 px-3">Savollar</button>
            </div>
          </div>
        </div>
      )}

      <main className={`container mx-auto px-4 lg:px-8 pb-20 relative z-10 ${isTeacher ? 'pt-40' : 'pt-28'}`}>

        {/* HERO */}
        <div
          className="glass-panel rounded-3xl p-8 md:p-12 mb-14 overflow-hidden relative fade-in-up"
          style={{ transform: `translate(${-mousePos.x * 0.3}px, ${-mousePos.y * 0.3}px)` }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'linear-gradient(135deg, rgba(0,212,255,0.06) 0%, rgba(124,58,237,0.04) 50%, transparent 100%)'
          }} />

          <div className="flex flex-col lg:flex-row items-center justify-between gap-10 relative z-10">
            <div className="max-w-2xl">
              <div className="badge badge-blue mb-4">🚀 O'zbekistonning #1 o'quv platformasi</div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5 leading-tight" style={{ fontFamily: 'Space Grotesk', minHeight: '72px' }}>
                <span className="gradient-text">{heroText}</span>
                <span style={{ display: 'inline-block', width: 3, height: '1em', background: '#00d4ff', marginLeft: 4, verticalAlign: 'middle', animation: 'blink 1s step-end infinite' }} />
              </h1>
              <p className="text-lg mb-8" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                Video darsliklar, qo'shimcha resurslar va interaktiv testlar orqali bilimingizni{' '}
                <span style={{ color: '#00ff88', fontWeight: 600 }}>oshiring.</span>
              </p>

              <div className="flex flex-wrap gap-3">
                <div className="glass-panel flex items-center gap-3 px-5 py-3 rounded-xl hover-glow transition-all cursor-default">
                  <span style={{ fontSize: 24, animation: 'fireFloat 1.5s ease-in-out infinite' }}>🔥</span>
                  <div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Streak</div>
                    <div className="font-bold text-lg">{userData?.streak || 0} kun</div>
                  </div>
                </div>
                <div className="glass-panel flex items-center gap-3 px-5 py-3 rounded-xl hover-glow transition-all cursor-default">
                  <Trophy size={24} style={{ color: '#00ff88' }} />
                  <div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Ball</div>
                    <div className="font-bold text-lg" style={{ color: '#00ff88' }}>{userData?.points || 0}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex gap-6">
              <div className="glass-panel p-8 rounded-2xl text-center hover-glow transition-all" style={{ transform: 'rotate(-6deg)', boxShadow: '0 10px 40px rgba(0,212,255,0.15)' }}>
                <div className="p-4 rounded-xl inline-block mb-4" style={{ background: 'rgba(0,212,255,0.15)' }}>
                  <Video size={40} style={{ color: '#00d4ff' }} />
                </div>
                <div className="text-3xl font-bold">{videoCount}+</div>
                <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Video darslar</div>
              </div>
              <div className="glass-panel p-8 rounded-2xl text-center hover-glow transition-all" style={{ transform: 'rotate(6deg) translateY(24px)', boxShadow: '0 10px 40px rgba(0,255,136,0.15)' }}>
                <div className="p-4 rounded-xl inline-block mb-4" style={{ background: 'rgba(0,255,136,0.12)' }}>
                  <Users size={40} style={{ color: '#00ff88' }} />
                </div>
                <div className="text-3xl font-bold">{studentCount}+</div>
                <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>O'quvchilar</div>
              </div>
            </div>
          </div>
        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 fade-in-up delay-200">
          {[
            { label: 'Video darslar', value: `${videoCount}+`, icon: <Video size={20} style={{ color: '#00d4ff' }} />, color: '#00d4ff' },
            { label: 'Resurslar', value: `${resourceCount}+`, icon: <FileText size={20} style={{ color: '#00ff88' }} />, color: '#00ff88' },
            { label: "O'quvchilar", value: `${studentCount}+`, icon: <Users size={20} style={{ color: '#a78bfa' }} />, color: '#a78bfa' },
            { label: 'Fanlar', value: `${SUBJECTS.length}+`, icon: <Star size={20} style={{ color: '#fbbf24' }} />, color: '#fbbf24' },
          ].map((s, i) => (
            <div key={i} className={`stat-card flex items-center gap-4 fade-in-up delay-${(i+2)*100}`}>
              <div className="p-3 rounded-xl" style={{ background: `${s.color}18` }}>{s.icon}</div>
              <div>
                <div className="text-xl font-bold" style={{ color: s.color, fontFamily: 'JetBrains Mono' }}>{s.value}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* SUBJECTS */}
        <div className="flex items-center justify-between mb-6 fade-in-up delay-300">
          <div className="flex items-center gap-3">
            <BookOpen style={{ color: '#00d4ff' }} size={26} />
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>Barcha Fanlar</h2>
          </div>
          <div className="md:hidden search-bar" style={{ width: 160 }}>
            <Search size={14} color="var(--text-muted)" />
            <input placeholder="Qidirish..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ fontSize: 12 }} />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredSubjects.map((sub, i) => {
            const isMySubject = isTeacher && userData?.subject === sub.id;
            return (
              <div
                key={sub.id}
                onClick={() => navigate(`/subject/${sub.id}`)}
                className={`subject-card p-6 rounded-2xl fade-in-up ${isMySubject ? 'teacher-card' : ''}`}
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                <div className="flex flex-col items-center text-center">
                  {isMySubject && (
                    <div className="badge badge-blue mb-3 text-xs">⭐ Mening Fanim</div>
                  )}
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 subject-icon"
                    style={{ background: `${sub.color}22`, boxShadow: `0 0 20px ${sub.glow}` }}>
                    {sub.icon}
                  </div>
                  <h3 className="font-bold text-base mb-1">{sub.name}</h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Darslar, testlar, resurslar</p>
                  <ChevronRight size={16} className="mt-3" style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>
            );
          })}
        </div>

        {filteredSubjects.length === 0 && (
          <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
            <Search size={48} className="mx-auto mb-4 opacity-30" />
            <p>"{searchQuery}" bo'yicha fan topilmadi</p>
          </div>
        )}
      </main>

      <style>{`
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0; } }
        @keyframes fireFloat { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-4px); } }
      `}</style>
    </div>
  );
}
