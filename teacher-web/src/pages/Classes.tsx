import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClasses, Class } from '../services/classService';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import ClassCard from '../components/ClassCard';
import GlassCard from '../components/GlassCard';
import BookLoader from '../components/BookLoader';

export default function Classes() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tighter mb-2">
            My Classes
          </h1>
          <p className="text-text-secondary">
            Create and manage your English classes
          </p>
        </div>
        <button
          onClick={() => navigate('/classes/create')}
          className="inline-flex items-center justify-center px-6 py-3 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-full transition-all duration-300 hover:scale-[1.02] shadow-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Class
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
          <p className="text-text-secondary text-sm mb-6">Create your first class to get started</p>
          <button
            onClick={() => navigate('/classes/create')}
            className="px-6 py-3 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-full transition-all duration-300 hover:scale-[1.02]"
          >
            Create Class
          </button>
        </GlassCard>
      )}
    </div>
  );
}