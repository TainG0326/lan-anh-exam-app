// ============================================================
// Settings Page
// ============================================================
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Settings,
  Shield,
  Bell,
  Database,
  Key,
} from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    // Simulate save
    await new Promise((r) => setTimeout(r, 1000));
    toast.success("Settings saved successfully");
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage application settings and configuration.
        </p>
      </div>

      {/* Database Settings */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 shadow-sm">
            <Database className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-800">Database</h2>
            <p className="text-xs text-slate-500">Supabase connection settings</p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Supabase URL</label>
            <Input value={process.env.NEXT_PUBLIC_SUPABASE_URL || "•••••••••••••••"} disabled />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Service Role Key</label>
            <Input value="•••••••••••••••••••••••••••••••" disabled />
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 shadow-sm">
            <Shield className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-800">Security</h2>
            <p className="text-xs text-slate-500">Access control and whitelist settings</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">Whitelist Enforcement</p>
              <p className="text-xs text-slate-400">Only allow registered emails</p>
            </div>
            <span className="rounded-xl bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Active</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">RLS Policies</p>
              <p className="text-xs text-slate-400">Row Level Security (bypassed via service role)</p>
            </div>
            <span className="rounded-xl bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Service Mode</span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 shadow-sm">
            <Bell className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-800">Notifications</h2>
            <p className="text-xs text-slate-500">Admin notification preferences</p>
          </div>
        </div>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
            <span className="text-sm text-slate-700">Email on new teacher registration</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
            <span className="text-sm text-slate-700">Email on exam submission</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
            <span className="text-sm text-slate-700">Alert on high AI usage (&gt;1000 tokens/day)</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
