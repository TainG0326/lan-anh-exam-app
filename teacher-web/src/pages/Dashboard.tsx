import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getExams } from '../services/examService';
import { getClasses } from '../services/classService';
import { FileText, Users, BookOpen, TrendingUp, BarChart3, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalExams: 0,
    activeExams: 0,
    totalAssignments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [exams, classes] = await Promise.all([
          getExams(),
          getClasses(),
        ]);

        const activeExams = exams.filter(
          (exam) => exam.status === 'active'
        ).length;

        setStats({
          totalClasses: classes.length,
          totalExams: exams.length,
          activeExams,
          totalAssignments: 0, // TODO: implement when assignments API is ready
        });
      } catch (error: any) {
        toast.error('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-text-secondary">Loading...</div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Classes',
      value: stats.totalClasses,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      link: '/classes',
    },
    {
      title: 'Total Exams',
      value: stats.totalExams,
      icon: FileText,
      color: 'from-green-500 to-green-600',
      link: '/exams',
    },
    {
      title: 'Active Exams',
      value: stats.activeExams,
      icon: TrendingUp,
      color: 'from-yellow-500 to-orange-500',
      link: '/exams',
    },
    {
      title: 'Total Assignments',
      value: stats.totalAssignments,
      icon: BookOpen,
      color: 'from-purple-500 to-purple-600',
      link: '/assignments',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary tracking-tighter mb-2">
          Dashboard
        </h1>
        <p className="text-text-secondary">
          Overview of your English learning management system
        </p>
      </div>

      {/* Summary Cards - Simple, clean cards with large numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.title}
              to={stat.link}
              className="group bg-background-light rounded-3xl border border-border shadow-soft p-6 hover:shadow-md transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-sm`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <ArrowRight className="w-5 h-5 text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-secondary mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-text-primary tracking-tight">{stat.value}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-background-light rounded-3xl border border-border shadow-soft p-8">
        <h2 className="text-xl font-bold text-text-primary tracking-tight mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/classes"
            className="group p-6 rounded-2xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-text-primary mb-1">Create New Class</h3>
                  <p className="text-sm text-text-secondary">Set up a new English class</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          <Link
            to="/exams/create"
            className="group p-6 rounded-2xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-text-primary mb-1">Create New Exam</h3>
                  <p className="text-sm text-text-secondary">Design and schedule an exam</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
