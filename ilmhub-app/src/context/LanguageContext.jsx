import React, { createContext, useContext, useState, useEffect } from 'react';
import uz from '../locales/uz.json';
import ru from '../locales/ru.json';
import en from '../locales/en.json';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'uz';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const translations = { uz, ru, en };
  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
