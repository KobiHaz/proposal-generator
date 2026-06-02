import { format, parseISO } from 'date-fns';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format YYYY-MM-DD to DD/MM/YYYY for display. Returns placeholder if empty or invalid. */
export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '_________';
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy');
  } catch {
    return dateStr;
  }
}
