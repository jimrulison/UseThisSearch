import React from 'react';

const Logo = ({ size = 'default', showText = true, className = '' }) => {
  const sizes = {
    small: { logo: 'w-8 h-8', text: 'text-lg' },
    default: { logo: 'w-12 h-12', text: 'text-2xl' },
    large: { logo: 'w-16 h-16', text: 'text-3xl' },
    hero: { logo: 'w-20 h-20', text: 'text-4xl' }
  };

  const currentSize = sizes[size] || sizes.default;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon */}
      <div className={`${currentSize.logo} relative`}>
        {/* Outer circle with gradient */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500 animate-pulse"></div>
        
        {/* Inner circle */}
        <div className="absolute inset-1 rounded-full bg-white shadow-inner flex items-center justify-center">
          {/* Search magnifying glass */}
          <svg 
            className="w-1/2 h-1/2 text-gray-700" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2.5} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </div>

        {/* Sparkle effect for AI */}
        <div className="absolute -top-1 -right-1 w-3 h-3">
          <div className="absolute inset-0 rounded-full bg-yellow-400 animate-ping"></div>
          <div className="absolute inset-0 rounded-full bg-yellow-300 animate-pulse"></div>
          <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <h1 className={`${currentSize.text} font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent leading-tight`}>
            Use This Search
          </h1>
          <p className="text-xs text-gray-500 font-medium tracking-wide">
            AI-Powered Keyword Research
          </p>
        </div>
      )}
    </div>
  );
};

export default Logo;