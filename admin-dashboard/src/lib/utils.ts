// ============================================================
// 工具函数库
// ============================================================
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 合并 Tailwind CSS 类名（支持 clsx 语法 + 自动去重）
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
