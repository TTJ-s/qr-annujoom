// LanguageToggle.jsx
import React from 'react';
import { useLanguage } from './LanguageContext';

const LanguageToggle = () => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <span className={`text-sm font-medium ${language === 'en' ? 'text-gray-900' : 'text-gray-400'}`}>
        EN
      </span>
      <button
        onClick={toggleLanguage}
        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
        style={{ backgroundColor: language === 'ml' ? '#059669' : '#d1d5db' }}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            language === 'ml' ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <span className={`text-sm font-medium ${language === 'ml' ? 'text-gray-900' : 'text-gray-400'}`}>
        മല
      </span>
    </div>
  );
};

export default LanguageToggle;