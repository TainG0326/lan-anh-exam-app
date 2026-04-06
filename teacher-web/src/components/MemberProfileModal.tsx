import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Calendar, Award, TrendingUp } from 'lucide-react';
import SoftCard from './SoftCard';
import { Avatar, Badge, Button } from './SoftCard';

interface MemberProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: {
    name: string;
    email: string;
    avatar?: string;
    joinedAt: string;
    completionPercent?: number;
    averageScore?: number;
    status?: 'active' | 'inactive';
  } | null;
}

const MemberProfileModal: React.FC<MemberProfileModalProps> = ({
  isOpen,
  onClose,
  member
}) => {
  if (!isOpen || !member) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative w-full max-w-md"
        >
          <SoftCard padding="none" className="overflow-hidden">
            {/* Header with gradient accent */}
            <div className="relative h-24 bg-gradient-to-r from-slate-50 to-slate-100">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/50 hover:bg-white transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Avatar */}
            <div className="relative px-6 -mt-12">
              <Avatar
                src={member.avatar}
                name={member.name}
                size="lg"
              />
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-800 mb-1">
                  {member.name}
                </h2>
                <div className="flex items-center gap-2 text-slate-500">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{member.email}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-slate-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Average Score
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">
                    {member.averageScore || '-'}%
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Completion
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">
                    {member.completionPercent || 0}%
                  </p>
                </div>
              </div>

              {/* Joined Date */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 mb-6">
                <Calendar className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Joined
                  </p>
                  <p className="text-sm font-medium text-slate-700">
                    {new Date(member.joinedAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Status</span>
                <Badge variant={member.status === 'active' ? 'success' : 'default'}>
                  {member.status === 'active' ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </SoftCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MemberProfileModal;





























