// ============================================================
// Dashboard Overview Page
// Hiển thị: Summary Cards + Activity Feed (dữ liệu thật từ Supabase)
// ============================================================
"use client";

import { getSupabaseAdmin } from "@/lib/supabase";
import { useEffect, useState, useCallback } from "react";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { Badge } from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import {
  Users,
  GraduationCap,
  FileText,
  BrainCircuit,
  UserPlus,
  CheckCircle,
  Clock,
  BookOpen,
  Activity,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Stats {
  totalStudents: number;
  totalTeachers: number;
  activeExams: number;
  aiTokensUsed: number;
}

interface Activity {
  id: string;
  type: "registration" | "exam_completed" | "exam_created" | "teacher_joined";
  description: string;
  timestamp: string;
  email?: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const supabase = getSupabaseAdmin();

      // Fetch all stats and activities in parallel
      const [
        studentsRes,
        teachersRes,
        examsRes,
        aiTokensRes,
        recentProfilesRes,
        recentExamsRes,
        recentAttemptsRes,
      ] = await Promise.all([
        // Counts
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "teacher"),
        supabase.from("exams").select("id", { count: "exact", head: true }).eq("status", "active"),
        // AI tokens - sum from ai_usage_logs
        supabase.from("ai_usage_logs").select("total_tokens", { count: "total" }),

        // Recent profile registrations (last 10)
        supabase
          .from("profiles")
          .select("id, email, role, created_at")
          .order("created_at", { ascending: false })
          .limit(8),

        // Recent exams created (last 5)
        supabase
          .from("exams")
          .select("id, title, teacher_id, created_at")
          .order("created_at", { ascending: false })
          .limit(5),

        // Recent exam attempts completed (last 5)
        supabase
          .from("exam_attempts")
          .select("id, student_id, exam_id, submitted_at, exams(title)")
          .not("submitted_at", "is", null)
          .order("submitted_at", { ascending: false })
          .limit(5),
      ]);

      // Set stats
      const totalTokens = aiTokensRes.data?.reduce((acc: number, log: any) => acc + (log.total_tokens || 0), 0) || 0;

      setStats({
        totalStudents: studentsRes.count || 0,
        totalTeachers: teachersRes.count || 0,
        activeExams: examsRes.count || 0,
        aiTokensUsed: totalTokens,
      });

      // Build real activities from multiple sources
      const activityList: Activity[] = [];

      // 1. Profile registrations
      for (const profile of (recentProfilesRes.data || [])) {
        const type = profile.role === "teacher" ? "teacher_joined" : "registration";
        activityList.push({
          id: `profile-${profile.id}`,
          type,
          description: type === "teacher_joined"
            ? `Teacher ${profile.email} joined the platform`
            : `New student ${profile.email} registered`,
          timestamp: profile.created_at,
          email: profile.email,
        });
      }

      // 2. Exams created
      for (const exam of (recentExamsRes.data || [])) {
        activityList.push({
          id: `exam-${exam.id}`,
          type: "exam_created",
          description: `New exam "${exam.title}" was created`,
          timestamp: exam.created_at,
        });
      }

      // 3. Exam attempts completed
      for (const attempt of (recentAttemptsRes.data || [])) {
        const examTitle = (attempt as any).exams?.title || "an exam";
        activityList.push({
          id: `attempt-${attempt.id}`,
          type: "exam_completed",
          description: `Student completed exam "${examTitle}"`,
          timestamp: attempt.submitted_at,
        });
      }

      // Sort by timestamp, newest first
      activityList.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // Keep only latest 10
      setActivities(activityList.slice(0, 10));

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "registration":
        return <UserPlus className="h-4 w-4 text-emerald-600" />;
      case "teacher_joined":
        return <UserPlus className="h-4 w-4 text-blue-600" />;
      case "exam_completed":
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case "exam_created":
        return <BookOpen className="h-4 w-4 text-amber-600" />;
      default:
        return <Activity className="h-4 w-4 text-slate-400" />;
    }
  };

  const getActivityBadge = (type: Activity["type"]) => {
    switch (type) {
      case "registration":
        return <Badge variant="success">New Student</Badge>;
      case "teacher_joined":
        return <Badge variant="info">New Teacher</Badge>;
      case "exam_completed":
        return <Badge variant="success">Exam Done</Badge>;
      case "exam_created":
        return <Badge variant="warning">New Exam</Badge>;
      default:
        return <Badge>Activity</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-slate-500">
          Welcome back! Here&apos;s what&apos;s happening with your platform.
        </p>
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Total Students"
            value={stats?.totalStudents || 0}
            subtitle="All registered students"
            icon={GraduationCap}
            iconColor="text-blue-600"
          />
          <SummaryCard
            title="Total Teachers"
            value={stats?.totalTeachers || 0}
            subtitle="Active teachers"
            icon={Users}
            iconColor="text-emerald-600"
          />
          <SummaryCard
            title="Active Exams"
            value={stats?.activeExams || 0}
            subtitle="Currently open"
            icon={FileText}
            iconColor="text-amber-600"
          />
          <SummaryCard
            title="AI Tokens Used"
            value={stats?.aiTokensUsed?.toLocaleString() || "0"}
            subtitle="Total all time"
            icon={BrainCircuit}
            iconColor="text-purple-600"
          />
        </div>
      )}

      {/* Activity Feed */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-800">Recent Activity</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Latest registrations, exams created, and exam completions
          </p>
        </div>
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-slate-200 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 rounded bg-slate-200 animate-pulse" />
                    <div className="h-2 w-1/4 rounded bg-slate-100 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              No recent activity yet
            </div>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 shadow-sm">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 truncate">
                    {activity.description}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
                {getActivityBadge(activity.type)}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
