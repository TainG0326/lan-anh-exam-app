// ============================================================
// Whitelist Management Page
// Uses server API (adminWhitelistApi) for all operations
// ============================================================
"use client";

import { useEffect, useState, useCallback } from "react";
import { adminWhitelistApi, WhitelistEntry } from "@/lib/api";
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
  ShieldCheck,
  Plus,
  Trash2,
  Search,
  Mail,
  CheckCircle,
  Copy,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

// ========== Pagination ==========
const PAGE_SIZE = 15;

// ========== Main Component ==========
export default function WhitelistPage() {
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Search
  const [search, setSearch] = useState("");

  // Pagination
  const [page, setPage] = useState(1);

  // Add Dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"student" | "teacher" | "any">("student");
  const [bulkEmails, setBulkEmails] = useState("");
  const [addMode, setAddMode] = useState<"single" | "bulk">("single");
  const [actionLoading, setActionLoading] = useState(false);

  // ========== Fetch data from server API ==========
  const fetchWhitelist = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminWhitelistApi.list(
        undefined, // all roles
        page,
        search || undefined,
        PAGE_SIZE
      );
      setWhitelist(result.data || []);
      setTotalCount(result.total || 0);
    } catch (error: any) {
      toast.error(`Error loading whitelist: ${error.message}`);
      setWhitelist([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchWhitelist();
  }, [fetchWhitelist]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  // ========== Actions ==========

  /** Add single email */
  const handleAddEmail = async () => {
    setActionLoading(true);
    try {
      if (addMode === "single") {
        if (!newEmail.trim()) {
          toast.error("Please enter an email address");
          setActionLoading(false);
          return;
        }

        await adminWhitelistApi.add(
          newEmail.trim().toLowerCase(),
          newRole
        );
        toast.success(`${newEmail} has been added to the whitelist`);
        setNewEmail("");
      } else {
        // Bulk add
        const emails = bulkEmails
          .split(/[\n,]+/)
          .map((e) => e.trim().toLowerCase())
          .filter((e) => e.includes("@"));

        if (emails.length === 0) {
          toast.error("No valid emails found");
          setActionLoading(false);
          return;
        }

        const result = await adminWhitelistApi.bulkAdd(emails, newRole);
        toast.success(`${result.added} emails added. ${result.failed} failed.`);
        setBulkEmails("");
      }

      setAddDialogOpen(false);
      fetchWhitelist();
    } catch (error: any) {
      toast.error(`Failed to add email: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  /** Delete email */
  const handleDeleteEmail = async (email: string, role?: string) => {
    try {
      await adminWhitelistApi.remove(email, role || "student");
      setWhitelist((prev) => prev.filter((item) => item.email !== email));
      setTotalCount((prev) => prev - 1);
      toast.success(`${email} has been removed from the whitelist`);
    } catch (error: any) {
      toast.error(`Failed to delete email: ${error.message}`);
    }
  };

  /** Copy email to clipboard */
  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast.success("Email copied to clipboard");
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "student":
        return <Badge variant="info">Student</Badge>;
      case "teacher":
        return <Badge variant="success">Teacher</Badge>;
      default:
        return <Badge>Any</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Whitelist Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Control which email addresses are allowed to register on the platform.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchWhitelist}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Email
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
        <ShieldCheck className="h-5 w-5 flex-shrink-0 text-emerald-600 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-emerald-800">
            Access Control Active
          </p>
          <p className="mt-0.5 text-xs text-emerald-700">
            Only emails in the whitelist can register. Students and teachers with existing accounts are not affected.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search emails..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={PAGE_SIZE} cols={4} />
          </div>
        ) : whitelist.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-sm font-medium text-slate-600">
              No emails in whitelist
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Add emails to control who can register
            </p>
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
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Added
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {whitelist.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 shadow-sm">
                            <Mail className="h-4 w-4 text-emerald-600" />
                          </div>
                          <span className="text-sm font-medium text-slate-700">
                            {item.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getRoleBadge(item.role)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-500">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleCopyEmail(item.email)}
                            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Copy
                          </button>
                          <button
                            onClick={() => handleDeleteEmail(item.email, item.role)}
                            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
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
                  {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} emails
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

      {/* ========== Add Email Dialog ========== */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Email to Whitelist</DialogTitle>
            <DialogDescription>
              Add one or more email addresses that are allowed to register.
            </DialogDescription>
          </DialogHeader>

          {/* Mode Toggle */}
          <div className="flex gap-2 py-2">
            <button
              onClick={() => setAddMode("single")}
              className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                addMode === "single"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Single Email
            </button>
            <button
              onClick={() => setAddMode("bulk")}
              className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                addMode === "bulk"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Bulk Import
            </button>
          </div>

          <div className="py-4 space-y-4">
            {addMode === "single" ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="teacher@school.edu.vn"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email List
                </label>
                <textarea
                  className="flex w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 min-h-32 resize-none"
                  placeholder="teacher1@school.edu.vn&#10;teacher2@school.edu.vn&#10;student@student.edu.vn"
                  value={bulkEmails}
                  onChange={(e) => setBulkEmails(e.target.value)}
                />
                <p className="mt-1.5 text-xs text-slate-400">
                  Separate emails by newline or comma
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Allowed Role
              </label>
              <div className="flex gap-2">
                {(["student", "teacher", "any"] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => setNewRole(role)}
                    className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium capitalize transition-colors ${
                      newRole === role
                        ? "bg-emerald-600 text-white shadow-md"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddEmail} disabled={actionLoading}>
              {actionLoading ? (
                "Adding..."
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Add to Whitelist
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
