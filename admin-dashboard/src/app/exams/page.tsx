// ============================================================
// Exam Review Page
// Duyệt / từ chối exam được tạo bởi giáo viên
// ============================================================
"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseAdmin } from "@/lib/supabase";
import { TableSkeleton } from "@/components/ui/Skeleton";
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
  FileCheck,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

// ========== Types ==========
interface Exam {
  id: string;
  title: string;
  description?: string;
  exam_code: string;
  class_id: string;
  teacher_id: string;
  teacher_email?: string;
  teacher_name?: string;
  status: "draft" | "active" | "completed";
  question_count: number;
  start_time: string;
  end_time: string;
  duration: number;
  total_points: number;
  created_at: string;
  updated_at: string;
}

// ========== Pagination ==========
const PAGE_SIZE = 10;

// ========== Main Component ==========
export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filter states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Pagination
  const [page, setPage] = useState(1);

  // Detail Dialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch data - join exams with users to get teacher info
  const fetchExams = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseAdmin();

      // Build query with join to get teacher email
      let query = supabase
        .from("exams")
        .select(`
          id,
          title,
          description,
          exam_code,
          class_id,
          teacher_id,
          status,
          questions,
          start_time,
          end_time,
          duration,
          total_points,
          created_at,
          updated_at,
          users:teacher_id ( email, name )
        `, { count: "exact" })
        .order("created_at", { ascending: false });

      // Apply filters
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      if (search) {
        query = query.or(`title.ilike.%${search}%,exam_code.ilike.%${search}%`);
      }

      // Pagination
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Transform data to add question_count and flatten teacher info
      const transformed: Exam[] = (data || []).map((exam: any) => ({
        ...exam,
        teacher_email: exam.users?.email || "Unknown",
        teacher_name: exam.users?.name || undefined,
        question_count: Array.isArray(exam.questions) ? exam.questions.length : 0,
      }));

      setExams(transformed);
      setTotalCount(count || 0);
    } catch (error: any) {
      toast.error(`Error loading exams: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, search]);

  // ========== Actions ==========

  /** Duyệt exam (set status = active) */
  const handleApprove = async (exam: Exam) => {
    setActionLoading(true);
    try {
      const { error } = await getSupabaseAdmin()
        .from("exams")
        .update({ status: "active", updated_at: new Date().toISOString() })
        .eq("id", exam.id);

      if (error) throw error;

      setExams((prev) =>
        prev.map((e) =>
          e.id === exam.id ? { ...e, status: "active" } : e
        )
      );

      toast.success(`"${exam.title}" has been activated — students can now see and take this exam`);
    } catch (error: any) {
      toast.error(`Failed to activate exam: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  /** Mở dialog từ chối */
  const handleOpenRejectDialog = (exam: Exam) => {
    setSelectedExam(exam);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  /** Từ chối exam (set status = draft) */
  const handleReject = async () => {
    if (!selectedExam) return;
    setActionLoading(true);
    try {
      const { error } = await getSupabaseAdmin()
        .from("exams")
        .update({
          status: "draft",
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedExam.id);

      if (error) throw error;

      setExams((prev) =>
        prev.map((e) =>
          e.id === selectedExam.id ? { ...e, status: "draft" } : e
        )
      );

      toast.success(`"${selectedExam.title}" has been reverted to draft`);
      setRejectDialogOpen(false);
    } catch (error: any) {
      toast.error(`Failed to reject exam: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const getStatusBadge = (status: Exam["status"]) => {
    switch (status) {
      case "draft":
        return <Badge variant="warning">Draft</Badge>;
      case "active":
        return <Badge variant="success">Active</Badge>;
      case "completed":
        return <Badge variant="default">Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Exam Management</h1>
        <p className="mt-1 text-sm text-slate-500">
          Review and manage exams created by teachers.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Draft", value: "draft", color: "border-amber-400 bg-amber-50" },
          { label: "Active", value: "active", color: "border-emerald-400 bg-emerald-50" },
          { label: "Completed", value: "completed", color: "border-slate-400 bg-slate-50" },
        ].map((item) => (
          <button
            key={item.value}
            onClick={() => setStatusFilter(item.value === statusFilter ? "all" : item.value)}
            className={`rounded-2xl border p-4 text-left transition-all hover:shadow-md ${
              statusFilter === item.value
                ? item.color + " shadow-md"
                : "border-slate-200 bg-white shadow-sm"
            }`}
          >
            <p className="text-sm text-slate-500">{item.label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by title or exam code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={PAGE_SIZE} cols={5} />
          </div>
        ) : exams.length === 0 ? (
          <div className="p-12 text-center">
            <FileCheck className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-sm font-medium text-slate-600">
              No exams found
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {statusFilter !== "all"
                ? `No ${statusFilter} exams at the moment`
                : "No exams have been created yet"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Exam
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Teacher
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Schedule
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {exams.map((exam) => (
                    <tr
                      key={exam.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 shadow-sm">
                            <BookOpen className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700">
                              {exam.title}
                            </p>
                            <p className="text-xs text-slate-400">
                              {exam.question_count} questions · {exam.total_points} pts · {exam.duration} min
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {exam.exam_code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600">
                          {exam.teacher_email}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(exam.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(exam.start_time), "dd/MM/yyyy HH:mm")}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Details */}
                          <button
                            onClick={() => {
                              setSelectedExam(exam);
                              setDetailDialogOpen(true);
                            }}
                            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </button>

                          {/* Approve (draft -> active) */}
                          {exam.status === "draft" && (
                            <button
                              onClick={() => handleApprove(exam)}
                              disabled={actionLoading}
                              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              Activate
                            </button>
                          )}

                          {/* Revert to Draft */}
                          {exam.status === "active" && (
                            <button
                              onClick={() => handleOpenRejectDialog(exam)}
                              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Deactivate
                            </button>
                          )}
                        </div>
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
                  {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} exams
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

      {/* ========== Exam Detail Dialog ========== */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedExam?.title}</DialogTitle>
            <DialogDescription>
              Exam code: <span className="font-mono font-semibold">{selectedExam?.exam_code}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Description</p>
              <p className="text-sm text-slate-700">
                {selectedExam?.description || "No description provided"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Teacher</p>
                <p className="text-sm text-slate-700">{selectedExam?.teacher_email}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Status</p>
                <div className="mt-1">{selectedExam && getStatusBadge(selectedExam.status)}</div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Start</p>
                <p className="text-sm text-slate-700">
                  {selectedExam && format(new Date(selectedExam.start_time), "dd/MM/yyyy HH:mm")}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">End</p>
                <p className="text-sm text-slate-700">
                  {selectedExam && format(new Date(selectedExam.end_time), "dd/MM/yyyy HH:mm")}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Duration</p>
                <p className="text-sm text-slate-700">{selectedExam?.duration} minutes</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Questions</p>
                <p className="text-sm text-slate-700">
                  {selectedExam?.question_count} ({selectedExam?.total_points} pts)
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Created</p>
                <p className="text-sm text-slate-700">
                  {selectedExam && new Date(selectedExam.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            {selectedExam?.status === "draft" ? (
              <div className="flex w-full justify-between">
                <Button
                  variant="outline"
                  onClick={() => setDetailDialogOpen(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    handleApprove(selectedExam);
                    setDetailDialogOpen(false);
                  }}
                >
                  <CheckCircle className="h-4 w-4" />
                  Activate Exam
                </Button>
              </div>
            ) : selectedExam?.status === "active" ? (
              <div className="flex w-full justify-between">
                <Button
                  variant="destructive"
                  onClick={() => {
                    setDetailDialogOpen(false);
                    handleOpenRejectDialog(selectedExam);
                  }}
                >
                  <XCircle className="h-4 w-4" />
                  Deactivate
                </Button>
                <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
                  Close
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== Deactivate Dialog ========== */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Exam</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate &quot;{selectedExam?.title}&quot;? Students will no longer be able to access this exam.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Reason (optional)
            </label>
            <textarea
              className="flex w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 min-h-24 resize-none"
              placeholder="e.g., Questions contain errors, exam rescheduled..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading}
            >
              {actionLoading ? "Deactivating..." : "Deactivate Exam"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
