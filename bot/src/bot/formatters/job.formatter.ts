import type { JobWithRelations } from '../types.js';

/**
 * Format job for Telegram message (short version)
 */
export function formatJobMessage(job: JobWithRelations): string {
  const companyPart = job.company.name ? ` <i>${escapeHtml(job.company.name)}.</i>` : '';
  const salaryPart = job.salary ? ` ${escapeHtml(job.salary)}` : '';
  const shortText = truncateText(stripHtml(job.description), 220);    // ${escapeHtml(truncateText(stripHtml(job.description), 200))}

  return `
<b>${escapeHtml(job.title)}.${companyPart}${salaryPart}</b>

${escapeHtml(shortText)}
<a href="${job.url}">${job.url}</a>
  `.trim();
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Strip HTML tags from text
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Truncate text to specified length with ellipsis
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}


