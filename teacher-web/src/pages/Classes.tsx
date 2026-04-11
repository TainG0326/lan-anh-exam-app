import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClasses, Class } from '../services/classService';
import toast from 'react-hot-toast';
import ClassCard from '../components/ClassCard';
import GlassCard from '../components/GlassCard';
import BookLoader from '../components/BookLoader';
import { Plus, Users } from 'lucide-react';
import CreateClassModal from './CreateClassModal';

export default function Classes() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const data = await getClasses();
      setClasses(data);
    } catch (error: any) {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <BookLoader />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tighter mb-2">
            My Classes
          </h1>
          <p className="text-text-secondary">
            Create and manage your English classes
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="group relative inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
        >
          <span className="absolute -inset-0.5 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition-opacity duration-300" />
          <Users className="w-5 h-5 relative z-10" />
          <span className="relative z-10">Create Class</span>
        </button>
      </div>

      {/* Grid Layout - Glass Cards */}
      {classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {classes.map((classItem) => (
            <ClassCard
              key={classItem._id || classItem.id}
              id={classItem._id || classItem.id || ''}
              name={classItem.name}
              code={classItem.class_code || ''}
              studentCount={classItem.students?.length || 0}
              description={`${classItem.grade} - Grade ${classItem.level}`}
              category="English"
            />
          ))}
        </div>
      ) : (
        <GlassCard className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Plus className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-2">No classes yet</h3>
          <p className="text-text-secondary text-sm">No class data available</p>
        </GlassCard>
      )}

      {/* Create Class Modal */}
      <CreateClassModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadClasses}
      />
    </div>
  );
}