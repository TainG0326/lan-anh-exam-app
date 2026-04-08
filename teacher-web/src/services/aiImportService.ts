export interface AIQuestion {
  question: string;
  type: 'multiple-choice';
  options: string[];
  correctAnswer: string;
  points: number;
  explanation?: string;
}

export interface AIImportResponse {
  success: boolean;
  questions: AIQuestion[];
  count: number;
  message?: string;
  /** Batch-specific fields */
  filesProcessed?: number;
  filesWithErrors?: number;
  errors?: { file: string; message: string }[];
}

function aiImportUrl(token: string | null): string {
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
  let url = `${base}/ai/import`;
  if (token) {
    url += `${url.includes('?') ? '&' : '?'}access_token=${encodeURIComponent(token)}`;
  }
  return url;
}

function aiImportBatchUrl(token: string | null): string {
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
  let url = `${base}/ai/import-batch`;
  if (token) {
    url += `${url.includes('?') ? '&' : '?'}access_token=${encodeURIComponent(token)}`;
  }
  return url;
}

/** Header auth + query access_token — một số môi trường tước Authorization trên multipart. */
function authHeadersForUpload(token: string | null): HeadersInit {
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
    'X-Access-Token': token,
  };
}

/** Gợi ý làm nóng server: bỏ hậu tố /api rồi nối /health */
function apiHealthUrl(): string | null {
  const raw = import.meta.env.VITE_API_URL;
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.replace(/\/$/, '');
  const origin = trimmed.replace(/\/api\/?$/, '');
  return origin ? `${origin}/health` : null;
}

/** Render cold start + Gemini (ảnh/PDF) có thể > 30s; không có timeout thì UI xoay vô hạn */
const AI_IMPORT_TIMEOUT_MS = Number(import.meta.env.VITE_AI_IMPORT_TIMEOUT_MS) || 180000;

export const aiImportService = {
  importFile: async (file: File): Promise<AIImportResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');
    const headers: HeadersInit = authHeadersForUpload(token);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_IMPORT_TIMEOUT_MS);

    let response: Response;
    try {
      // fetch + FormData: không set Content-Type để trình duyệt tự gắn boundary (multipart).
      response = await fetch(aiImportUrl(token), {
        method: 'POST',
        body: formData,
        headers,
        mode: 'cors',
        signal: controller.signal,
      });
    } catch (e: unknown) {
      clearTimeout(timeoutId);
      const name = e instanceof Error ? e.name : '';
      if (name === 'AbortError') {
        const health = apiHealthUrl();
        const warmHint = health
          ? `Hoặc mở trước ${health} để “làm nóng” server, rồi import lại.`
          : 'Hoặc mở trước endpoint /health của API để làm nóng server, rồi import lại.';
        throw new Error(
          `Hết thời gian chờ (${AI_IMPORT_TIMEOUT_MS / 1000}s). ` +
            'Server (ví dụ Render) có thể đang cold start hoặc Gemini xử lý lâu — hãy thử lại sau 1–2 phút. ' +
            warmHint
        );
      }
      throw e;
    }
    clearTimeout(timeoutId);

    const data = (await response.json().catch(() => ({}))) as AIImportResponse & { message?: string };

    if (!response.ok) {
      const msg =
        (data as { message?: string }).message ||
        `HTTP ${response.status}: ${response.statusText || 'Request failed'}`;
      throw new Error(msg);
    }

    return data;
  },

  /** Gửi nhiều ảnh cùng lúc, mỗi ảnh xử lý bằng Gemini Vision, gộp kết quả */
  importFiles: async (files: File[]): Promise<AIImportResponse> => {
    if (files.length === 0) {
      throw new Error('No files selected');
    }
    if (files.length === 1) {
      return aiImportService.importFile(files[0]);
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    const token = localStorage.getItem('token');
    const headers: HeadersInit = authHeadersForUpload(token);

    const controller = new AbortController();
    const batchTimeout = AI_IMPORT_TIMEOUT_MS * Math.ceil(files.length / 5);
    const timeoutId = setTimeout(() => controller.abort(), batchTimeout);

    let response: Response;
    try {
      response = await fetch(aiImportBatchUrl(token), {
        method: 'POST',
        body: formData,
        headers,
        mode: 'cors',
        signal: controller.signal,
      });
    } catch (e: unknown) {
      clearTimeout(timeoutId);
      const name = e instanceof Error ? e.name : '';
      if (name === 'AbortError') {
        const health = apiHealthUrl();
        const warmHint = health
          ? `Hoặc mở trước ${health} để "làm nóng" server, rồi import lại.`
          : 'Hoặc mở trước endpoint /health của API để làm nóng server, rồi import lại.';
        throw new Error(
          `Hết thời gian chờ. Đang xử lý ${files.length} ảnh — có thể mất đến ${Math.round(batchTimeout / 60000)} phút. ` +
            `Vui lòng đợi hoặc thử ít ảnh hơn. ${warmHint}`
        );
      }
      throw e;
    }
    clearTimeout(timeoutId);

    const data = (await response.json().catch(() => ({}))) as AIImportResponse & { message?: string };

    if (!response.ok) {
      const msg =
        (data as { message?: string }).message ||
        `HTTP ${response.status}: ${response.statusText || 'Request failed'}`;
      throw new Error(msg);
    }

    return data;
  },
};
