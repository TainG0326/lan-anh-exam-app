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
}

function aiImportUrl(): string {
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
  return `${base}/ai/import`;
}

export const aiImportService = {
  importFile: async (file: File): Promise<AIImportResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');
    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // fetch + FormData: không set Content-Type để trình duyệt tự gắn boundary (multipart).
    // axios với 'Content-Type': 'multipart/form-data' không có boundary hay gây lỗi gửi file.
    const response = await fetch(aiImportUrl(), {
      method: 'POST',
      body: formData,
      headers,
      mode: 'cors',
    });

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
