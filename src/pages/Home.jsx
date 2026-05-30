import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LogOut, BookOpen, Video, FileText, Search } from 'lucide-react';
import { auth } from '../firebase/config';

// Custom Hook for Count Up Animation
const useCountUp = (end, duration = 2000) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  
  useEffect(() => {
    let startTime = null;
    const animate = (time) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      
      // Easing function (easeOutQuart)
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      
      countRef.current = Math.floor(easeProgress * end);
      setCount(countRef.current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [end, duration]);
  
  return count;
};

// Custom Hook for Typewriter Effect
const useTypewriter = (text, speed = 50) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    let i = 0;
    setDisplayedText('');
    
    const interval = setInterval(() => {
      setDisplayedText(text.substring(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, speed);
    
    return () => clearInterval(interval);
  }, [text, speed]);
  
  return displayedText;
};

export default function Home() {
  const { currentUser, userData } = useAuth();
  const { t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const videoCount = useCountUp(1000);
  const resourceCount = useCountUp(5000);
  const heroText = useTypewriter("O'zbekistonning barcha maktab fanlari bitta joyda");

  // Scroll listener for Navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mouse move listener for Parallax / Tilt
  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const x = (clientX / window.innerWidth - 0.5) * 20;
    const y = (clientY / window.innerHeight - 0.5) * 20;
    setMousePos({ x, y });
  };

  const handleLogout = async () => {
    await auth.signOut();
  };

  const subjects = [
    { name: 'Matematika', icon: '📐', color: 'bg-blue-600' },
    { name: 'Fizika', icon: '⚡', color: 'bg-yellow-500' },
    { name: 'Kimyo', icon: '🧪', color: 'bg-green-500' },
    { name: 'Biologiya', icon: '🧬', color: 'bg-emerald-500' },
    { name: 'Geografiya', icon: '🌍', color: 'bg-cyan-500' },
    { name: 'Tarix', icon: '🏛️', color: 'bg-amber-600' },
    { name: 'Ona tili', icon: '📝', color: 'bg-indigo-500' },
    { name: 'Ingliz tili', icon: '🇬🇧', color: 'bg-red-500' }
  ];

  return (
    <div className="relative" onMouseMove={handleMouseMove}>
      <div className="stars-bg"></div>
      
      {/* Floating background shapes */}
      <div className="floating-shape bg-blue-500/20 w-64 h-64 rounded-full blur-3xl" style={{ top: '10%', left: '20%' }}></div>
      <div className="floating-shape bg-emerald-500/20 w-96 h-96 rounded-full blur-3xl" style={{ top: '40%', right: '10%', animationDelay: '-5s' }}></div>
      <div className="floating-shape bg-purple-500/20 w-80 h-80 rounded-full blur-3xl" style={{ bottom: '10%', left: '30%', animationDelay: '-10s' }}></div>

      {/* Navbar */}
      <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${scrolled ? 'glass-panel py-3' : 'bg-transparent py-5'}`}>
        <div className="container mx-auto px-4 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-3 logo-pulse cursor-pointer">
            <div className="bg-gradient-to-br from-[#00D4FF] to-blue-600 p-2 rounded-xl shadow-[0_0_15px_rgba(0,212,255,0.5)]">
              <BookOpen className="text-white" size={24} />
            </div>
            <span className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-[#00D4FF]">
              Ilm Fan
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center glass-panel rounded-full px-4 py-2 w-72 lg:w-96 focus-within:ring-1 focus-within:ring-[#00D4FF] transition-all">
              <Search className="text-slate-400 mr-2" size={18} />
              <input 
                type="text" 
                placeholder={t('search_placeholder')}
                className="bg-transparent border-none outline-none w-full text-sm text-white placeholder-slate-400"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-white">{userData?.firstName} {userData?.lastName}</div>
                <div className="text-xs text-[#00FF88] capitalize">{userData?.role === 'student' ? 'O\'quvchi' : userData?.role}</div>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 glass-panel hover:bg-red-500/20 rounded-full transition-colors text-red-400 hover:text-red-300 ripple-btn"
                title={t('logout')}
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 lg:px-8 pt-32 pb-20 relative z-10">
        {/* Hero Section */}
        <div 
          className="glass-panel rounded-3xl p-8 md:p-12 mb-16 flex flex-col lg:flex-row items-center justify-between overflow-hidden relative fade-in-up"
          style={{ transform: `translate(${-mousePos.x * 0.5}px, ${-mousePos.y * 0.5}px)` }}
        >
          <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-[#00D4FF]/10 to-transparent pointer-events-none"></div>
          
          <div className="max-w-2xl relative z-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-white min-h-[120px] lg:min-h-0">
              {heroText}
              <span className="animate-pulse inline-block w-1 h-10 lg:h-14 bg-[#00D4FF] ml-1 align-middle"></span>
            </h1>
            <p className="text-slate-300 text-lg md:text-xl mb-8">
              Video darsliklar, qo'shimcha resurslar va interaktiv testlar orqali bilimingizni <span className="text-[#00FF88] font-semibold">oshiring.</span>
            </p>
            
            <div className="flex flex-row gap-4">
              <div className="flex items-center gap-3 glass-panel px-5 py-3 rounded-xl border border-slate-700/50 hover-glow transition-all">
                <span className="text-2xl">🔥</span>
                <div>
                  <div className="text-xs text-slate-400">Streak</div>
                  <div className="font-bold text-lg text-white">{userData?.streak || 0} kun</div>
                </div>
              </div>
              <div className="flex items-center gap-3 glass-panel px-5 py-3 rounded-xl border border-slate-700/50 hover-glow transition-all">
                <span className="text-2xl">🏆</span>
                <div>
                  <div className="text-xs text-slate-400">Umumiy ball</div>
                  <div className="font-bold text-lg text-[#00FF88]">{userData?.points || 0}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex gap-6 mt-12 lg:mt-0 relative z-10">
            <div className="glass-panel p-8 rounded-2xl rotate-[-6deg] hover:rotate-0 transition-transform duration-500 shadow-[0_10px_40px_rgba(0,212,255,0.2)]">
              <div className="bg-[#00D4FF]/20 p-4 rounded-xl inline-block mb-4">
                <Video size={48} className="text-[#00D4FF]" />
              </div>
              <div className="text-3xl font-bold text-white">{videoCount}+</div>
              <div className="text-slate-400 mt-1">Video darsliklar</div>
            </div>
            
            <div className="glass-panel p-8 rounded-2xl rotate-[6deg] translate-y-8 hover:rotate-0 hover:translate-y-4 transition-transform duration-500 shadow-[0_10px_40px_rgba(0,255,136,0.2)]">
              <div className="bg-[#00FF88]/20 p-4 rounded-xl inline-block mb-4">
                <FileText size={48} className="text-[#00FF88]" />
              </div>
              <div className="text-3xl font-bold text-white">{resourceCount}+</div>
              <div className="text-slate-400 mt-1">O'quv resurslar</div>
            </div>
          </div>
        </div>

        {/* Subjects Grid */}
        <div className="flex items-center gap-3 mb-8 fade-in-up delay-200">
          <BookOpen className="text-[#00D4FF]" size={28} />
          <h2 className="text-2xl md:text-3xl font-bold text-white">Barcha Fanlar</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
          {subjects.map((sub, i) => (
            <div 
              key={i} 
              className={`subject-card glass-panel rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover-glow fade-in-up delay-${(i % 5 + 1) * 100}`}
              style={{
                transform: `perspective(1000px) rotateX(${mousePos.y * 0.2}deg) rotateY(${-mousePos.x * 0.2}deg)`
              }}
            >
              <div className="flex flex-col items-center text-center">
                <div className={`${sub.color} w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-5 shadow-lg subject-icon`}>
                  {sub.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{sub.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Video darslar, resurslar va testlar to'plami
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
