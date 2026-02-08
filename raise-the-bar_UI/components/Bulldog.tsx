import React from 'react';

const Bulldog: React.FC = () => {
  return (
    <div className="w-48 h-48 md:w-64 md:h-64 relative animate-bounce-slow">
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl">
        <g id="bulldog-head" className="origin-bottom animate-head-bop">
          {/* Collar */}
          <path d="M60 160 L140 160 L145 180 L55 180 Z" fill="#333" stroke="white" strokeWidth="2" />
          <circle cx="70" cy="170" r="5" fill="#ccc" />
          <circle cx="90" cy="170" r="5" fill="#ccc" />
          <circle cx="110" cy="170" r="5" fill="#ccc" />
          <circle cx="130" cy="170" r="5" fill="#ccc" />

          {/* Head Base */}
          <ellipse cx="100" cy="110" rx="60" ry="55" fill="#D2B48C" stroke="black" strokeWidth="3" />
          
          {/* Jowls */}
          <path d="M60 130 Q100 170 140 130" fill="#C19A6B" stroke="black" strokeWidth="2" />
          <path d="M80 130 Q100 150 120 130" fill="none" stroke="black" strokeWidth="2" />

          {/* Nose */}
          <ellipse cx="100" cy="115" rx="15" ry="10" fill="black" />
          
          {/* Eyes */}
          <ellipse cx="75" cy="95" rx="12" ry="14" fill="white" stroke="black" />
          <circle cx="75" cy="95" r="5" fill="black" />
          
          <ellipse cx="125" cy="95" rx="12" ry="14" fill="white" stroke="black" />
          <circle cx="125" cy="95" r="5" fill="black" />

          {/* Brows */}
          <path d="M60 80 Q75 70 90 85" stroke="black" strokeWidth="3" fill="none" />
          <path d="M110 85 Q125 70 140 80" stroke="black" strokeWidth="3" fill="none" />

          {/* Ears */}
          <path d="M40 90 Q30 60 60 50" fill="#8B4513" stroke="black" strokeWidth="3" />
          <path d="M160 90 Q170 60 140 50" fill="#8B4513" stroke="black" strokeWidth="3" />

          {/* Backwards Cap */}
          <path d="M50 60 Q100 10 150 60" fill="#ff0040" stroke="black" strokeWidth="3" />
          <path d="M50 60 L150 60" fill="none" stroke="black" strokeWidth="3" />
          <rect x="70" y="30" width="60" height="20" rx="5" fill="#cc0033" />
          
          {/* Mouth */}
          <path d="M90 140 Q100 145 110 140" fill="none" stroke="black" strokeWidth="2" />
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