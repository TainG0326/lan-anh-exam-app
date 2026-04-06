import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getClassById } from '../services/classService';
import { ArrowLeft, Users, BookOpen, GraduationCap, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import BookLoader from '../components/BookLoader';

export default function ClassDetail() {
  const { id } = useParams<{ id: string }>();
  const [classData, setClassData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      loadClass();
    }
  }, [id]);

  const loadClass = async () => {
    try {
      const data = await getClassById(id!);
      setClassData(data);
    } catch (error: any) {
      toast.error('Failed to load class details');
    } finally {
      setLoading(false);
    }
  };

  const copyClassCode = () => {
    if (classData?.class_code) {
      navigator.clipboard.writeText(classData.class_code);
      setCopied(true);
      toast.success('Class code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <BookLoader />
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="text-center py-20">
        <p className="text-text-secondary">Class not found</p>
        <Link to="/classes" className="text-primary hover:underline mt-4 inline-block">
          Back to Classes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <Link
          to="/classes"
          className="inline-flex items-center text-primary hover:text-primary-hover mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Classes
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary tracking-tighter mb-2">
              {classData.name}
            </h1>
            <p className="text-text-secondary">
              {classData.grade} - Grade {classData.level}
            </p>
          </div>
        </div>
      </div>

      {/* Class Info Card */}
      <div className="bg-background-light rounded-3xl border border-border shadow-soft p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-1">Class Name</p>
              <p className="text-lg font-semibold text-text-primary">{classData.name}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-1">Grade Level</p>
              <p className="text-lg font-semibold text-text-primary">
                {classData.grade} - Grade {classData.level}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-1">Total Students</p>
              <p className="text-lg font-semibold text-text-primary">
                {classData.students?.length || 0} students
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Copy className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-text-secondary mb-1">Class Code</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-mono font-semibold text-text-primary">
                  {classData.class_code || 'N/A'}
                </p>
                {classData.class_code && (
                  <button
                    onClick={copyClassCode}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Copy class code"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-text-secondary" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="bg-background-light rounded-3xl border border-border shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-gray-50">
          <h2 className="text-xl font-bold text-text-primary tracking-tight">Students</h2>
        </div>
        {classData.students && classData.students.length > 0 ? (
          <div className="divide-y divide-border">
            {classData.students.map((student: any, index: number) => (
              <div
                key={student.id || student._id || index}
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {student.name?.charAt(0)?.toUpperCase() || 'S'}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary">{student.name || 'Unknown'}</p>
                      <p className="text-sm text-text-secondary">{student.email || ''}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-text-secondary">No students in this class yet</p>
            <p className="text-sm text-text-muted mt-1">
              Students can join using the class code above
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


