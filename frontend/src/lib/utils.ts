import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format amounts in Indian Rupees (₹)
 * Example: 50000 -> "₹50,000"
 */
export function formatRupees(amount?: number | null): string {
  if (amount === undefined || amount === null) return 'Unpaid / Not Disclosed';
  if (amount === 0) return 'Free / Unpaid';
  return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * Format dates in Indian-friendly DD MMM YYYY format
 * Example: 2026-11-15 -> "15 Nov 2026"
 */
export function formatDate(dateString?: string | null): string {
  if (!dateString) return 'Not published';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Check if a date has passed
 */
export function isDatePassed(dateString?: string | null): boolean {
  if (!dateString) return false;
  try {
    const date = new Date(dateString);
    return date.getTime() < Date.now();
  } catch {
    return false;
  }
}
