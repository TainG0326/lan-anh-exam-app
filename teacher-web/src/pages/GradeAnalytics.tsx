import { TrendingUp, TrendingDown, Users, Award, FileText, BookOpen } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { ClassStatistics } from '../services/gradeService';

interface Props {
  stats: ClassStatistics;
  t: (key: string) => string;
}

export default function GradeAnalytics({ stats, t }: Props) {
  const cards = [
    {
      label: t('grades.analytics.average'),
      value: stats.average.toFixed(1),
      icon: Award,
      bgColor: 'bg-rose-100',
      iconColor: 'text-rose-600',
    },
    {
      label: t('grades.analytics.highest'),
      value: stats.highest.toFixed(1),
      icon: TrendingUp,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      label: t('grades.analytics.lowest'),
      value: stats.lowest.toFixed(1),
      icon: TrendingDown,
      bgColor: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
    {
      label: t('grades.analytics.totalStudents'),
      value: stats.totalStudents,
      icon: Users,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      label: t('grades.analytics.totalExams'),
      value: stats.totalExams,
      icon: FileText,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      label: t('grades.analytics.totalAssignments'),
      value: stats.totalAssignments,
      icon: BookOpen,
      bgColor: 'bg-cyan-100',
      iconColor: 'text-cyan-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <GlassCard key={index} hover={true} className="p-4">
            <div className="flex flex-col items-center text-center">
              <div className={`w-12 h-12 rounded-xl ${card.bgColor} flex items-center justify-center mb-3`}>
                <Icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
              <p className="text-2xl font-bold text-text-primary">{card.value}</p>
              <p className="text-xs text-text-secondary mt-1">{card.label}</p>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}
