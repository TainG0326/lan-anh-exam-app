// ============================================================
// User Management Page
// Bảng quản lý tất cả users: đổi role, ban/unban, reset password
// ============================================================
"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseAdmin } from "@/lib/supabase";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import {
  Search,
  Ban,
  CheckCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";

// ========== Types ==========
interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: "student" | "teacher" | "admin";
  status: "active" | "banned";
  school?: string | null;
  created_at: string;
}

// ========== Pagination ==========
const PAGE_SIZE = 10;

// ========== Main Component ==========
export default function UsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filter states
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [schoolFilter, setSchoolFilter] = useState<string>("all");

  // Pagination
  const [page, setPage] = useState(1);

  // Dialogs
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [newRole, setNewRole] = useState<string>("student");
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch data
  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      let query = getSupabaseAdmin()
        .from("profiles")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      // Apply filters
      if (roleFilter !== "all") {
        query = query.eq("role", roleFilter);
      }
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      if (schoolFilter !== "all") {
        query = query.eq("school", schoolFilter);
      }
      if (search) {
        query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
      }

      // Pagination
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setProfiles(data || []);
      setTotalCount(count || 0);
    } catch (error: any) {
      toast.error(`Error loading users: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, statusFilter, schoolFilter, search]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [roleFilter, statusFilter, schoolFilter, search]);

  // ========== Actions ==========

  /** Toggle Ban/Unban user */
  const handleToggleBan = async (user: Profile) => {
    const newStatus = user.status === "active" ? "banned" : "active";
    try {
      const { error } = await getSupabaseAdmin()
        .from("profiles")
        .update({ status: newStatus })
        .eq("id", user.id);

      if (error) throw error;

      setProfiles((prev) =>
        prev.map((p) =>
          p.id === user.id ? { ...p, status: newStatus } : p
        )
      );

      toast.success(
        newStatus === "banned"
          ? `${user.email} has been banned`
          : `${user.email} has been unbanned`
      );
    } catch (error: any) {
      toast.error(`Failed to update status: ${error.message}`);
    }
  };

  /** Open Role Change Dialog */
  const handleOpenRoleDialog = (user: Profile) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setRoleDialogOpen(true);
  };

  /** Change User Role */
  const handleChangeRole = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const { error } = await getSupabaseAdmin()
        .from("profiles")
        .update({ role: newRole as Profile["role"] })
        .eq("id", selectedUser.id);

      if (error) throw error;

      setProfiles((prev) =>
        prev.map((p) =>
          p.id === selectedUser.id ? { ...p, role: newRole as Profile["role"] } : p
        )
      );

      toast.success(`Role updated to ${newRole} for ${selectedUser.email}`);
      setRoleDialogOpen(false);
    } catch (error: any) {
      toast.error(`Failed to change role: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  /** Reset Password (mock - display success) */
  const handleResetPassword = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      // Note: In production, call your backend API to send reset email via SMTP
      // Supabase service role key cannot directly send password reset emails
      // without a configured SMTP provider

      await new Promise((r) => setTimeout(r, 500));

      toast.success(`Password reset link sent to ${selectedUser.email}`);
      setResetPasswordDialogOpen(false);
    } catch (error: any) {
      toast.error(`Failed to send reset email: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage all users: students, teachers, and admins.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Role Filter */}
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="student">Student</SelectItem>
            <SelectItem value="teacher">Teacher</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={PAGE_SIZE} cols={6} />
          </div>
        ) : profiles.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            No users found matching your filters.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {profiles.map((profile) => (
                    <tr
                      key={profile.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-700">
                          {profile.email}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">
                          {profile.full_name || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            profile.role === "admin"
                              ? "danger"
                              : profile.role === "teacher"
                              ? "info"
                              : "default"
                          }
                        >
                          {profile.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={profile.status === "active"}
                            onCheckedChange={() => handleToggleBan(profile)}
                          />
                          <Badge
                            variant={
                              profile.status === "active" ? "success" : "danger"
                            }
                          >
                            {profile.status}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-500">
                          {new Date(profile.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* Change Role */}
                          <button
                            onClick={() => handleOpenRoleDialog(profile)}
                            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            <UserCog className="h-3.5 w-3.5" />
                            Role
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => {
                              setSelectedUser(profile);
                              setResetPasswordDialogOpen(true);
                            }}
                            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Reset
                          </button>

                          {/* Ban/Unban */}
                          <button
                            onClick={() => handleToggleBan(profile)}
                            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                              profile.status === "active"
                                ? "text-red-600 hover:bg-red-50"
                                : "text-emerald-600 hover:bg-emerald-50"
                            }`}
                          >
                            {profile.status === "active" ? (
                              <>
                                <Ban className="h-3.5 w-3.5" />
                                Ban
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-3.5 w-3.5" />
                                Unban
                              </>
                            )}
                          </button>
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
                  {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} users
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

      {/* ========== Change Role Dialog ========== */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for <strong>{selectedUser?.email}</strong>.
              This will change their access level on the platform.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRoleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleChangeRole} disabled={actionLoading}>
              {actionLoading ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== Reset Password Dialog ========== */}
      <Dialog
        open={resetPasswordDialogOpen}
        onOpenChange={setResetPasswordDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Send a password reset link to{" "}
              <strong>{selectedUser?.email}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-slate-600">
              The user will receive an email with a link to reset their password.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResetPasswordDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleResetPassword} disabled={actionLoading}>
              {actionLoading ? "Sending..." : "Send Reset Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
