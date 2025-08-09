import React, { useState, useEffect } from 'react';
import { ChevronDown, Globe } from 'lucide-react';

const LanguageSelector = ({ onLanguageChange, className = "" }) => {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
    { code: 'fr', name: 'French', flag: '🇫🇷', nativeName: 'Français' },
    { code: 'de', name: 'German', flag: '🇩🇪', nativeName: 'Deutsch' },
    { code: 'it', name: 'Italian', flag: '🇮🇹', nativeName: 'Italiano' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹', nativeName: 'Português' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺', nativeName: 'Русский' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳', nativeName: '中文' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵', nativeName: '日本語' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷', nativeName: '한국어' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦', nativeName: 'العربية' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳', nativeName: 'हिन्दी' }
  ];

  const selectedLang = languages.find(lang => lang.code === selectedLanguage) || languages[0];

  useEffect(() => {
    // Load saved language preference
    const savedLanguage = localStorage.getItem('useThisSearch_language');
    if (savedLanguage && languages.find(lang => lang.code === savedLanguage)) {
      setSelectedLanguage(savedLanguage);
      if (onLanguageChange) {
        onLanguageChange(savedLanguage);
      }
    }
  }, [onLanguageChange]);

  const handleLanguageSelect = (languageCode) => {
    setSelectedLanguage(languageCode);
    setIsOpen(false);
    
    // Save language preference
    localStorage.setItem('useThisSearch_language', languageCode);
    
    if (onLanguageChange) {
      onLanguageChange(languageCode);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg shadow-sm hover:bg-white hover:shadow-md transition-all duration-200"
        aria-label="Select Language"
      >
        <Globe className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">
          {selectedLang.flag} {selectedLang.nativeName}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
            <div className="py-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b">
                Select Language
              </div>
              
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageSelect(language.code)}
                  className={`w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors duration-150 flex items-center gap-3 ${
                    selectedLanguage === language.code 
                      ? 'bg-blue-50 text-blue-700 font-medium' 
                      : 'text-gray-700'
                  }`}
                >
                  <span className="text-lg">{language.flag}</span>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{language.nativeName}</span>
                    <span className="text-xs text-gray-500">{language.name}</span>
                  </div>
                  {selectedLanguage === language.code && (
                    <span className="ml-auto text-blue-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;