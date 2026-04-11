// ============================================================
// Supabase Admin Client
// Lazy initialization - tránh lỗi khi Next.js prerender pages
// ============================================================
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseAdminInstance: SupabaseClient | null = null;

/**
 * Lấy Supabase admin client (lazy init).
 * Chỉ khởi tạo khi được gọi ở client-side, tránh lỗi build time.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (supabaseAdminInstance) {
    return supabaseAdminInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !supabaseServiceKey) {
    // Trả về mock client để dev không bị crash
    console.warn("[Admin Dashboard] Supabase env vars missing - using mock client");
    // Return a dummy client that will show errors on actual queries
    supabaseAdminInstance = createClient(
      supabaseUrl || "https://placeholder.supabase.co",
      supabaseServiceKey || "placeholder",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    return supabaseAdminInstance;
  }

  supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseAdminInstance;
}

// Export mặc định để tương thích ngược
export default getSupabaseAdmin;
