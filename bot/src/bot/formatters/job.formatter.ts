import type { JobWithRelations } from '../types.js';

/**
 * Format job for Telegram message (short version)
 */
export function formatJobMessage(job: JobWithRelations): string {
  const locationNames = job.locations.map((jl) => jl.location.name).join(', ');
  const publishDate = new Date(job.publishedAt).toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return `
<b>${escapeHtml(job.title)}</b>

🏢 <b>Company:</b> ${escapeHtml(job.company.name)}
📂 <b>Category:</b> ${escapeHtml(job.category.name)}
📍 <b>Location:</b> ${escapeHtml(locationNames || 'Not specified')}
📅 <b>Published:</b> ${publishDate}

${escapeHtml(truncateText(stripHtml(job.description), 200))}
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


