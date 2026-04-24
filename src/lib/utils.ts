import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// 通用 className 合并工具，shadcn/ui 标准实现
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
