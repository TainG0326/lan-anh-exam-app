import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * Reusable Glassmorphism Card Component
 * 
 * Features:
 * - Frosted glass effect with backdrop-blur
 * - Semi-transparent white background
 * - Soft borders and shadows
 * - Hover elevation and glow effects
 * - Smooth transitions
 */
const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hover = true,
  glow = false,
  onClick,
  style,
}) => {
  return (
    <div
      onClick={onClick}
      style={style}
      className={`
        relative
        bg-white/20
        backdrop-blur-sm
        border border-white/30
        shadow-xl
        rounded-3xl
        p-6
        transition-all duration-300
        ${hover ? 'hover:scale-[1.02] hover:shadow-2xl hover:bg-white/25' : ''}
        ${glow ? 'hover:shadow-primary/20 hover:shadow-primary/10' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {/* Subtle inner glow gradient */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default GlassCard;


