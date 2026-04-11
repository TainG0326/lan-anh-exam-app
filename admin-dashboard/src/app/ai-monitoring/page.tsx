// ============================================================
// AI Monitoring Page
// Theo dõi usage AI token / chi phí theo từng giáo viên
// ============================================================
"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseAdmin } from "@/lib/supabase";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { TableSkeleton, CardSkeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import {
  BrainCircuit,
  Search,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Activity,
  ChevronLeft,
  ChevronRight,
  Ban,
  Zap,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format } from "date-fns";

// ========== Types ==========
interface TeacherUsage {
  teacher_id: string;
  teacher_email: string;
  teacher_name?: string;
  total_requests: number;
  total_tokens: number;
  total_cost: number;
  last_used: string;
  ai_status: "active" | "restricted" | "blocked";
}

interface UsageLog {
  id: string;
  teacher_id: string;
  action: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost_usd: number;
  response_time_ms: number;
  status: string;
  created_at: string;
}

// ========== Pagination ==========
const PAGE_SIZE = 10;

const COLORS = ["#10b981", "#f59e0b", "#ef4444"];

// ========== Main Component ==========
export default function AIMonitoringPage() {
  const [teachersUsage, setTeachersUsage] = useState<TeacherUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalTokens, setTotalTokens] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);
  const [chartData, setChartData] = useState<{ name: string; tokens: number }[]>([]);

  // Filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Pagination
  const [page, setPage] = useState(1);

  // Block Dialog
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherUsage | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch data from real tables
  const fetchUsageData = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseAdmin();

      // Fetch AI usage logs with teacher info
      const { data: logs, error: logsError } = await supabase
        .from("ai_usage_logs")
        .select(`
          id,
          teacher_id,
          action,
          model,
          input_tokens,
          output_tokens,
          total_tokens,
          cost_usd,
          response_time_ms,
          status,
          created_at,
          users:teacher_id ( email, name )
        `)
        .order("created_at", { ascending: false });

      if (logsError) throw logsError;

      // Fetch profiles to get AI status
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name, role")
        .eq("role", "teacher");

      if (profilesError) throw profilesError;

      // Aggregate usage by teacher
      const usageMap = new Map<string, TeacherUsage>();

      // Initialize all teachers from profiles
      for (const profile of (profilesData || [])) {
        usageMap.set(profile.id, {
          teacher_id: profile.id,
          teacher_email: profile.email,
          teacher_name: profile.full_name || undefined,
          total_requests: 0,
          total_tokens: 0,
          total_cost: 0,
          last_used: "",
          ai_status: "active",
        });
      }

      // Aggregate logs
      let grandTotalTokens = 0;
      let grandTotalCost = 0;
      let grandTotalRequests = 0;

      for (const log of (logs || [])) {
        const teacherId = log.teacher_id;
        const teacher = usageMap.get(teacherId);

        if (teacher) {
          teacher.total_requests += 1;
          teacher.total_tokens += log.total_tokens || 0;
          teacher.total_cost += log.cost_usd || 0;
          if (!teacher.last_used || new Date(log.created_at) > new Date(teacher.last_used)) {
            teacher.last_used = log.created_at;
          }
        } else {
          // Teacher not in profiles but has logs
          usageMap.set(teacherId, {
            teacher_id: teacherId,
            teacher_email: (log as any).users?.email || "Unknown",
            teacher_name: (log as any).users?.name || undefined,
            total_requests: 1,
            total_tokens: log.total_tokens || 0,
            total_cost: log.cost_usd || 0,
            last_used: log.created_at,
            ai_status: "active",
          });
        }

        grandTotalTokens += log.total_tokens || 0;
        grandTotalCost += log.cost_usd || 0;
        grandTotalRequests += 1;
      }

      setTotalTokens(grandTotalTokens);
      setTotalCost(grandTotalCost);
      setTotalRequests(grandTotalRequests);

      // Generate chart data (last 4 weeks)
      const weeks = ["Week 1", "Week 2", "Week 3", "Week 4"];
      const now = new Date();
      const weeklyTokens = [0, 0, 0, 0];

      for (const log of (logs || [])) {
        const logDate = new Date(log.created_at);
        const daysDiff = Math.floor((now.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff < 7) weeklyTokens[3] += log.total_tokens || 0;
        else if (daysDiff < 14) weeklyTokens[2] += log.total_tokens || 0;
        else if (daysDiff < 21) weeklyTokens[1] += log.total_tokens || 0;
        else if (daysDiff < 28) weeklyTokens[0] += log.total_tokens || 0;
      }

      setChartData(weeks.map((name, i) => ({ name, tokens: weeklyTokens[i] })));

      // Filter
      let result = Array.from(usageMap.values());

      if (search) {
        result = result.filter(
          (t) =>
            t.teacher_email.toLowerCase().includes(search.toLowerCase()) ||
            t.teacher_name?.toLowerCase().includes(search.toLowerCase())
        );
      }

      if (statusFilter !== "all") {
        result = result.filter((t) => t.ai_status === statusFilter);
      }

      setTeachersUsage(result);
    } catch (error: any) {
      toast.error(`Error loading usage data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchUsageData();
  }, [fetchUsageData]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  // ========== Actions ==========

  /** Update teacher AI status */
  const handleUpdateStatus = async (teacher: TeacherUsage, newStatus: TeacherUsage["ai_status"]) => {
    setActionLoading(true);
    try {
      // Update ai_status in profiles table
      const { error } = await getSupabaseAdmin()
        .from("profiles")
        .update({ ai_status: newStatus })
        .eq("id", teacher.teacher_id);

      if (error) throw error;

      setTeachersUsage((prev) =>
        prev.map((t) =>
          t.teacher_id === teacher.teacher_id ? { ...t, ai_status: newStatus } : t
        )
      );

      toast.success(`${teacher.teacher_email} AI access set to ${newStatus}`);
      setBlockDialogOpen(false);
    } catch (error: any) {
      toast.error(`Failed to update status: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const paginatedData = teachersUsage.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(teachersUsage.length / PAGE_SIZE);

  const getStatusBadge = (status: TeacherUsage["ai_status"]) => {
    switch (status) {
      case "active":
        return <Badge variant="success">Active</Badge>;
      case "restricted":
        return <Badge variant="warning">Restricted</Badge>;
      case "blocked":
        return <Badge variant="danger">Blocked</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">AI Monitoring</h1>
        <p className="mt-1 text-sm text-slate-500">
          Monitor AI API usage and costs per teacher.
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
            title="Total Tokens"
            value={totalTokens.toLocaleString()}
            subtitle="All time"
            icon={BrainCircuit}
            iconColor="text-purple-600"
          />
          <SummaryCard
            title="Total Cost"
            value={`$${totalCost.toFixed(4)}`}
            subtitle="AI API expenses"
            icon={DollarSign}
            iconColor="text-emerald-600"
          />
          <SummaryCard
            title="Total Requests"
            value={totalRequests.toLocaleString()}
            subtitle="API calls made"
            icon={Zap}
            iconColor="text-blue-600"
          />
          <SummaryCard
            title="Active Teachers"
            value={teachersUsage.filter((t) => t.ai_status === "active").length}
            subtitle="Using AI features"
            icon={TrendingUp}
            iconColor="text-amber-600"
          />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Usage Trend Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Monthly Token Usage</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="tokens" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Usage by Status</h3>
          <div className="flex items-center justify-center gap-8">
            <ResponsiveContainer width="50%" height={220}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Active", value: teachersUsage.filter((t) => t.ai_status === "active").length || 1 },
                    { name: "Restricted", value: teachersUsage.filter((t) => t.ai_status === "restricted").length },
                    { name: "Blocked", value: teachersUsage.filter((t) => t.ai_status === "blocked").length },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {[
                { label: "Active", color: "#10b981", count: teachersUsage.filter((t) => t.ai_status === "active").length },
                { label: "Restricted", color: "#f59e0b", count: teachersUsage.filter((t) => t.ai_status === "restricted").length },
                { label: "Blocked", color: "#ef4444", count: teachersUsage.filter((t) => t.ai_status === "blocked").length },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-slate-600">{item.label}</span>
                  <span className="text-sm font-semibold text-slate-800">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by teacher email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="restricted">Restricted</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* Usage Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={PAGE_SIZE} cols={6} />
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            {teachersUsage.length === 0 ? "No AI usage data yet. Teachers haven't used AI features." : "No results match your filter."}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Teacher
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Requests
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Tokens
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Last Used
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedData.map((teacher) => (
                    <tr
                      key={teacher.teacher_id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-slate-700">
                            {teacher.teacher_email}
                          </p>
                          {teacher.teacher_name && (
                            <p className="text-xs text-slate-400">
                              {teacher.teacher_name}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-700">
                          {teacher.total_requests}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-700">
                          {teacher.total_tokens.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-emerald-600">
                          ${teacher.total_cost.toFixed(4)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(teacher.ai_status)}
                      </td>
                      <td className="px-6 py-4">
                        {teacher.last_used ? (
                          <span className="text-sm text-slate-500">
                            {format(new Date(teacher.last_used), "dd/MM/yyyy HH:mm")}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">Never</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {teacher.ai_status !== "blocked" ? (
                          <button
                            onClick={() => {
                              setSelectedTeacher(teacher);
                              setBlockDialogOpen(true);
                            }}
                            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Ban className="h-3.5 w-3.5" />
                            Restrict
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(teacher, "active")}
                            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            Unblock
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
                <p className="text-sm text-slate-500">
                  Showing {(page - 1) * PAGE_SIZE + 1} to{" "}
                  {Math.min(page * PAGE_SIZE, teachersUsage.length)} of {teachersUsage.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-slate-600">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ========== Restrict Dialog ========== */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restrict AI Access</DialogTitle>
            <DialogDescription>
              Restrict AI access for <strong>{selectedTeacher?.teacher_email}</strong>?
              They will not be able to use AI-powered features.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
              <p className="text-sm text-amber-800">
                <strong>Current Usage:</strong> {selectedTeacher?.total_tokens.toLocaleString()} tokens
                (${selectedTeacher?.total_cost.toFixed(4)}) · {selectedTeacher?.total_requests} requests
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedTeacher && handleUpdateStatus(selectedTeacher, "blocked")}
              disabled={actionLoading}
            >
              <Ban className="h-4 w-4" />
              {actionLoading ? "Restricting..." : "Restrict Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
