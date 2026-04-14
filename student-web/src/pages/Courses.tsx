import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyClass } from '../services/classService';
import { getExams } from '../services/examService';
import { getAssignments } from '../services/assignmentService';
import { useLanguage } from '../context/LanguageContext';
import { BookOpen, Users, FileText, Calendar, GraduationCap, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, isValid } from 'date-fns';

export default function Courses() {
  const { t } = useLanguage();
  const [myClass, setMyClass] = useState<any>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [classData, examsData, assignmentsData] = await Promise.allSettled([
        getMyClass().catch(() => null),
        getExams(),
        getAssignments(),
      ]);

      if (classData.status === 'fulfilled' && classData.value) {
        setMyClass(classData.value.class || classData.value);
      }

      if (examsData.status === 'fulfilled') {
        setExams(examsData.value || []);
      }

      if (assignmentsData.status === 'fulfilled') {
        setAssignments(assignmentsData.value || []);
      }
    } catch {
      toast.error(t('toast.loadDataFailed') || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-10 w-10 border-3 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!myClass) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            {t('common.noClassesYet') || 'No classes joined yet'}
          </h2>
          <p className="text-text-secondary mb-6">
            {t('courses.emptyDesc') || 'Join a class to view courses and assignments'}
          </p>
          <Link
            to="/join-class"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-white hover:bg-primary-hover transition-colors shadow-button"
          >
            <Users className="w-5 h-5" />
            {t('common.joinClass') || 'Join Class'}
          </Link>
        </div>
      </div>
    );
  }

  const classExams = exams.filter(
    (exam) => (exam.class_id || exam.classId) === (myClass.id || myClass._id)
  );
  const classAssignments = assignments.filter(
    (assignment) => (assignment.class_id || assignment.classId) === (myClass.id || myClass._id)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-1">
          {t('courses.myCourses') || 'My Courses'}
        </h1>
        <p className="text-text-secondary text-sm">
          {t('courses.title') || 'Manage your classes and courses'}
        </p>
      </div>

      {/* Class Info Card */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-lg shrink-0">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-text-primary mb-2">{myClass.name}</h2>
            <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
              <span className="flex items-center gap-1">
                <GraduationCap className="w-4 h-4 text-primary" />
                {myClass.grade} - Level {myClass.level}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4 text-primary" />
                {t('common.classCode') || 'Class Code'}: <span className="font-mono font-semibold text-primary">{myClass.class_code}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Exams Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-primary">
            {t('exams.myExams') || 'Exams in Class'}
          </h2>
          <Link
            to="/exams"
            className="text-sm text-primary font-semibold hover:underline"
          >
            {t('common.viewAll') || 'View All'}
          </Link>
        </div>
        {classExams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classExams.slice(0, 4).map((exam) => {
              const startTime = exam.startTime || exam.start_time;
              const startDate = startTime ? new Date(startTime) : null;
              return (
                <Link
                  key={exam.id || exam._id}
                  to={`/exams/take/${exam.examCode || exam.exam_code}`}
                  className="card p-5 hover:shadow-soft-lg transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-text-primary truncate">{exam.title}</h3>
                      <p className="text-xs text-text-secondary line-clamp-2 mt-0.5">{exam.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        {startDate && isValid(startDate) && (
                          <span className="flex items-center gap-1 text-xs text-text-secondary">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(startDate, 'MMM dd, yyyy')}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          exam.status === 'active' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'
                        }`}>
                          {exam.status === 'active' ? t('common.active') || 'Active' : t('exams.upcoming') || 'Upcoming'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-text-muted shrink-0" />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <FileText className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary">{t('exams.empty') || 'No exams in this class yet'}</p>
          </div>
        )}
      </section>

      {/* Assignments Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-primary">
            {t('assignments.myAssignments') || 'Assignments in Class'}
          </h2>
          <Link
            to="/assignments"
            className="text-sm text-primary font-semibold hover:underline"
          >
            {t('common.viewAll') || 'View All'}
          </Link>
        </div>
        {classAssignments.length > 0 ? (
          <div className="card overflow-hidden">
            <div className="divide-y divide-border">
              {classAssignments.slice(0, 5).map((assignment) => (
                <Link
                  key={assignment.id || assignment._id}
                  to="/assignments"
                  className="flex items-center gap-4 px-5 py-4 hover:bg-background transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-warning" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{assignment.title}</p>
                    <p className="text-xs text-text-secondary line-clamp-1">{assignment.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {assignment.dueDate && (
                      <p className="text-xs text-text-secondary">
                        {format(new Date(assignment.dueDate), 'MMM dd')}
                      </p>
                    )}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold mt-1 ${
                      assignment.submitted ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                    }`}>
                      {assignment.submitted ? t('assignments.submitted') || 'Submitted' : t('common.pending') || 'Pending'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="card p-8 text-center">
            <FileText className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary">{t('assignments.empty') || 'No assignments in this class yet'}</p>
          </div>
        )}
      </section>
    </div>
  );
}
