import { useEffect, useState } from 'react';
import { getClasses, createClass, Class } from '../services/classService';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import ClassCard from '../components/ClassCard';
import GlassCard from '../components/GlassCard';

export default function Classes() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    grade: 'THCS' as 'THCS' | 'THPT',
    level: '',
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createClass(formData);
      toast.success('Class created successfully!');
      setShowModal(false);
      setFormData({ name: '', grade: 'THCS', level: '' });
      loadClasses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create class');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-text-secondary text-lg">Loading...</div>
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
          onClick={() => setShowModal(true)}
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
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-full transition-all duration-300 hover:scale-[1.02]"
          >
            Create Class
          </button>
        </GlassCard>
      )}

      {/* Create Class Modal - Glass */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-md p-6 animate-fade-in-down" hover={false}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-text-primary tracking-tight">Create New Class</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-full hover:bg-white/40 transition-colors"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Class Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-white/30 backdrop-blur-lg border border-white/40 rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  placeholder="e.g., English 10A"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Grade Level
                </label>
                <select
                  required
                  className="w-full px-4 py-3 bg-white/30 backdrop-blur-lg border border-white/40 rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  value={formData.grade}
                  onChange={(e) =>
                    setFormData({ ...formData, grade: e.target.value as 'THCS' | 'THPT' })
                  }
                >
                  <option value="THCS">THCS (Middle School)</option>
                  <option value="THPT">THPT (High School)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Class Level
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 6, 7, 8, 9, 10, 11, 12"
                  className="w-full px-4 py-3 bg-white/30 backdrop-blur-lg border border-white/40 rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-white/40 rounded-full text-sm font-semibold text-text-secondary hover:bg-white/40 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-full transition-all duration-300 hover:scale-[1.02]"
                >
                  Create
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
