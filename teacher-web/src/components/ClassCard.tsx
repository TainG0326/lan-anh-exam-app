import React from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, Clock } from 'lucide-react';

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
    <Link
      to={`/classes/${id}`}
      className="group bg-background-light rounded-3xl border border-border shadow-soft overflow-hidden hover:shadow-md transition-all duration-300 animate-fade-in-up"
    >
      {/* Image Thumbnail - aspect-video */}
      <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-primary/10 overflow-hidden">
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
        
        {/* Category Badge - top-left */}
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-background-light/90 backdrop-blur-sm text-xs font-semibold text-text-secondary rounded-full border border-border">
            {category}
          </span>
        </div>
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
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs bg-gray-50 px-2 py-1 rounded border border-border">
              {code}
            </span>
          </div>
        </div>

        {/* CTA Button - Full width, rounded-full, Lime Green */}
        <button className="w-full bg-primary hover:bg-primary-hover text-primary-foreground font-bold py-3 px-4 rounded-full transition-colors text-sm">
          View Class
        </button>
      </div>
    </Link>
  );
};

export default ClassCard;





