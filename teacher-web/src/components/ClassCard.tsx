import React from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen } from 'lucide-react';
import GlassCard from './GlassCard';

interface ClassCardProps {
  id: string;
  name: string;
  code: string;
  studentCount?: number;
  description?: string;
  image?: string;
  category?: string;
}

const ClassCard: React.FC<ClassCardProps> = ({
  id,
  name,
  code,
  studentCount = 0,
  description,
  image,
  category = 'English'
}) => {
  return (
    <Link to={`/classes/${id}`}>
      <GlassCard
        className="h-full p-0 overflow-hidden"
        hover={true}
        glow={true}
      >
        {/* Image Thumbnail - aspect-video */}
        <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-blue-500/10 overflow-hidden">
          {image ? (
            <img 
              src={image} 
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-primary/30" />
            </div>
          )}
          
          {/* Category Badge - Glass */}
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 bg-white/40 backdrop-blur-md text-xs font-semibold text-text-secondary rounded-full border border-white/30">
              {category}
            </span>
          </div>
          
          {/* Code Badge */}
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1 bg-white/40 backdrop-blur-md font-mono text-xs font-semibold text-text-primary rounded-full border border-white/30">
              {code}
            </span>
          </div>
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        </div>

        {/* Card Content */}
        <div className="p-6 space-y-4">
          {/* Title - Bold Navy */}
          <div>
            <h3 className="text-lg font-bold text-text-primary tracking-tight mb-1 group-hover:text-primary transition-colors">
              {name}
            </h3>
            {description && (
              <p className="text-sm text-text-secondary line-clamp-2">
                {description}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-text-secondary">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{studentCount} students</span>
            </div>
          </div>

          {/* CTA Button - Glass */}
          <button className="w-full bg-white/30 hover:bg-white/40 backdrop-blur-lg border border-white/40 shadow-lg font-bold py-3 px-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] text-sm text-text-primary">
            View Class
          </button>
        </div>
      </GlassCard>
    </Link>
  );
};

export default ClassCard;
