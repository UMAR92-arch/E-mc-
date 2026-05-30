import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { useLanguage } from '../../context/LanguageContext';
import { UserPlus } from 'lucide-react';

export default function Register() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    school: '',
    region: '',
    district: '',
    phone: '',
    age: '',
    grade: '',
    login: '', // email
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const regions = [
    'Toshkent shahar', 'Toshkent viloyati', 'Andijon viloyati', 'Buxoro viloyati', 
    'Fargʻona viloyati', 'Jizzax viloyati', 'Xorazm viloyati', 'Namangan viloyati', 
    'Navoiy viloyati', 'Qashqadaryo viloyati', 'Qoraqalpogʻiston Respublikasi', 
    'Samarqand viloyati', 'Sirdaryo viloyati', 'Surxondaryo viloyati'
  ];
  
  const grades = Array.from({length: 11}, (_, i) => i + 1);

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Create user in Firebase Auth
      // We use the provided login as email. Since Firebase requires email format,
      // if they just type a word, we append a dummy domain like @ilmfan.uz
      let userEmail = formData.login;
      if (!userEmail.includes('@')) {
        userEmail = `${userEmail}@ilmfan.uz`;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, userEmail, formData.password);
      const user = userCredential.user;

      // Save additional user info in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        school: formData.school,
        region: formData.region,
        district: formData.district,
        phone: formData.phone || '',
        age: parseInt(formData.age),
        grade: parseInt(formData.grade),
        role: 'student',
        streak: 0,
        points: 0,
        badges: [],
        createdAt: new Date().toISOString()
      });

      navigate('/'); // Redirect to home (which is now protected)
    } catch (err) {
      console.error(err);
      setError("Ro'yxatdan o'tishda xatolik yuz berdi. Login band bo'lishi mumkin yoki parol juda qisqa (kamida 6 ta belgi).");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-blue-500/20 text-blue-500 rounded-full mb-4">
            <UserPlus size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white">{t('create_account')}</h2>
        </div>

        {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-6 text-center">{error}</div>}

        <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 mb-1 text-sm">{t('first_name')}</label>
            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors" />
          </div>
          <div>
            <label className="block text-slate-400 mb-1 text-sm">{t('last_name')}</label>
            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-slate-400 mb-1 text-sm">{t('school')}</label>
            <input type="text" name="school" value={formData.school} onChange={handleChange} required placeholder="Masalan: 1-IDUM"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors" />
          </div>
          <div>
            <label className="block text-slate-400 mb-1 text-sm">{t('region')}</label>
            <select name="region" value={formData.region} onChange={handleChange} required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors">
              <option value="">{t('select_region')}</option>
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 mb-1 text-sm">{t('district')}</label>
            <input type="text" name="district" value={formData.district} onChange={handleChange} required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors" />
          </div>
          <div>
            <label className="block text-slate-400 mb-1 text-sm">{t('age')}</label>
            <input type="number" name="age" min="6" max="100" value={formData.age} onChange={handleChange} required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors" />
          </div>
          <div>
            <label className="block text-slate-400 mb-1 text-sm">{t('grade')}</label>
            <select name="grade" value={formData.grade} onChange={handleChange} required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors">
              <option value="">{t('select_grade')}</option>
              {grades.map(g => <option key={g} value={g}>{g}-sinf</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-slate-400 mb-1 text-sm">Telefon raqam (Ixtiyoriy)</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="+998 90 123 45 67"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors" />
          </div>
          <div>
            <label className="block text-slate-400 mb-1 text-sm">Login (O'zingiz o'ylab toping)</label>
            <input type="text" name="login" value={formData.login} onChange={handleChange} required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors" />
          </div>
          <div>
            <label className="block text-slate-400 mb-1 text-sm">{t('password')} (Kamida 6 belgi)</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength="6"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors" />
          </div>
          
          <div className="md:col-span-2 mt-4">
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors flex justify-center items-center h-12">
              {loading ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div> : t('create_account')}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-slate-400 text-sm">
          {t('have_account')} <Link to="/login" className="text-blue-500 hover:underline">{t('login_here')}</Link>
        </div>
      </div>
    </div>
  );
}
