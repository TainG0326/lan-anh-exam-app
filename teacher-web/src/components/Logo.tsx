import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => {
  return (
    <div className={`${className} relative`}>
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer teal circle */}
        <circle cx="60" cy="60" r="58" fill="#14B8A6" stroke="#0D9488" strokeWidth="2" />

        {/* Inner teal circle */}
        <circle cx="60" cy="60" r="48" fill="#2DD4BF" />

        {/* Open book icon at top */}
        <path
          d="M 40 35 Q 50 30 60 35 Q 70 30 80 35 L 80 50 Q 70 45 60 50 Q 50 45 40 50 Z"
          fill="#14B8A6"
          stroke="#0D9488"
          strokeWidth="1.5"
        />
        <path
          d="M 60 35 L 60 50"
          stroke="#0D9488"
          strokeWidth="1.5"
        />

        {/* Letter L - dark blue */}
        <text
          x="45"
          y="75"
          fontSize="32"
          fontWeight="bold"
          fill="#1E40AF"
          fontFamily="Inter, sans-serif"
        >
          L
        </text>

        {/* Letter A - teal */}
        <text
          x="65"
          y="75"
          fontSize="32"
          fontWeight="bold"
          fill="#14B8A6"
          fontFamily="Inter, sans-serif"
        >
          A
        </text>

        {/* Golden arrow going through A */}
        <path
          d="M 55 85 L 75 55"
          stroke="#FCD34D"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 70 60 L 75 55 L 72 58"
          stroke="#1E40AF"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Small golden star at bottom */}
        <path
          d="M 60 90 L 62 95 L 67 95 L 63 98 L 65 103 L 60 100 L 55 103 L 57 98 L 53 95 L 58 95 Z"
          fill="#FCD34D"
          stroke="#1E40AF"
          strokeWidth="0.5"
        />
      </svg>
    </div>
  );
};

export default Logo;
