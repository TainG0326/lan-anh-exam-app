import React from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen } from 'lucide-react';

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
    <Link to={`/classes/${id}`} className="block group">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-300">
        {/* Image Thumbnail */}
        <div className="relative aspect-video bg-gradient-to-br from-primary/10 to-blue-500/10 overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-primary/20" />
            </div>
          )}

          {/* Category Badge */}
          <div className="absolute top-3 left-3">
            <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold text-slate-600 rounded-full border border-gray-200 shadow-sm">
              {category}
            </span>
          </div>

          {/* Code Badge */}
          <div className="absolute top-3 right-3">
            <span className="px-3 py-1 bg-white/90 backdrop-blur-sm font-mono text-xs font-semibold text-slate-700 rounded-full border border-gray-200 shadow-sm">
              {code}
            </span>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-5 space-y-3">
          {/* Title */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-1 group-hover:text-primary transition-colors">
              {name}
            </h3>
            {description && (
              <p className="text-sm text-slate-500 line-clamp-2">
                {description}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{studentCount} students</span>
            </div>
          </div>

          {/* CTA Button */}
          <button className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 font-semibold py-2.5 px-4 rounded-xl transition-all duration-300 text-sm text-slate-700">
            View Class
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ClassCard;
