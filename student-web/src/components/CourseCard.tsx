import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock } from 'lucide-react';

interface CourseCardProps {
  id: string;
  title: string;
  category?: string;
  progress?: number;
  timeLeft?: string;
  image?: string;
  status?: 'in-progress' | 'not-started';
}

const CourseCard: React.FC<CourseCardProps> = ({
  id,
  title,
  category = 'English',
  progress = 0,
  timeLeft,
  image,
  status = 'not-started'
}) => {
  const isStarted = status === 'in-progress';

  return (
    <Link
      to={`/courses/${id}`}
      className="group bg-background-light rounded-3xl border border-border shadow-soft overflow-hidden hover:shadow-md transition-all duration-300 animate-fade-in-up"
    >
      {/* Image Thumbnail - aspect-video */}
      <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-primary/10 overflow-hidden">
        {image ? (
          <img 
            src={image} 
            alt={title}
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
          <h3 className="text-lg font-bold text-text-primary tracking-tight mb-1 group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </h3>
          {timeLeft && (
            <p className="text-xs text-text-secondary mt-1">{timeLeft}</p>
          )}
        </div>

        {/* Progress Bar - Horizontal, Lime Green */}
        {isStarted && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-text-secondary font-medium">
                Progress: <span className="text-text-primary font-bold">{progress}%</span>
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-primary h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* CTA Button - Full width, rounded-full, Lime Green */}
        <button className="w-full bg-primary hover:bg-primary-hover text-primary-foreground font-bold py-3 px-4 rounded-full transition-colors text-sm">
          {isStarted ? 'Continue' : 'Start Course'}
        </button>
      </div>
    </Link>
  );
};

export default CourseCard;





