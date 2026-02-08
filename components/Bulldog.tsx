import React from 'react';

const Bulldog: React.FC = () => {
  return (
    <div className="w-48 h-48 md:w-64 md:h-64 relative animate-bounce-slow">
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl">
        <g id="cat-head" className="origin-bottom animate-head-bop">
          {/* Head */}
          <ellipse cx="100" cy="110" rx="62" ry="58" fill="#F2C27B" stroke="#111" strokeWidth="3" />

          {/* Ears */}
          <path d="M48 70 L30 30 L78 52 Z" fill="#E8A95C" stroke="#111" strokeWidth="3" />
          <path d="M152 70 L170 30 L122 52 Z" fill="#E8A95C" stroke="#111" strokeWidth="3" />
          <path d="M52 68 L40 40 L72 55 Z" fill="#F7D6A6" />
          <path d="M148 68 L160 40 L128 55 Z" fill="#F7D6A6" />

          {/* Sunglasses */}
          <rect x="48" y="82" width="44" height="26" rx="6" fill="#111" stroke="#000" strokeWidth="2" />
          <rect x="108" y="82" width="44" height="26" rx="6" fill="#111" stroke="#000" strokeWidth="2" />
          <rect x="92" y="92" width="16" height="6" rx="3" fill="#111" />
          <path d="M48 90 L30 86" stroke="#111" strokeWidth="4" />
          <path d="M152 90 L170 86" stroke="#111" strokeWidth="4" />

          {/* Nose */}
          <path d="M96 118 L104 118 L100 126 Z" fill="#D66C6C" stroke="#111" strokeWidth="2" />

          {/* Mouth */}
          <path d="M100 126 Q95 134 88 136" stroke="#111" strokeWidth="2" fill="none" />
          <path d="M100 126 Q105 134 112 136" stroke="#111" strokeWidth="2" fill="none" />

          {/* Whiskers */}
          <path d="M70 120 L30 114" stroke="#111" strokeWidth="2" />
          <path d="M70 128 L30 130" stroke="#111" strokeWidth="2" />
          <path d="M130 120 L170 114" stroke="#111" strokeWidth="2" />
          <path d="M130 128 L170 130" stroke="#111" strokeWidth="2" />

          {/* Neck + Chain */}
          <path d="M60 162 L140 162 L145 180 L55 180 Z" fill="#222" stroke="#111" strokeWidth="2" />
          <circle cx="100" cy="172" r="8" fill="#FACC15" stroke="#111" strokeWidth="2" />
        </g>
      </svg>
      <style>{`
        @keyframes head-bop {
          0%, 100% { transform: rotate(0deg) translateY(0); }
          50% { transform: rotate(3deg) translateY(5px); }
        }
        .animate-head-bop {
          animation: head-bop 0.6s ease-in-out infinite;
        }
        .animate-bounce-slow {
          animation: bounce 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default Bulldog;