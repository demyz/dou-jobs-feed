export interface RSSJobItem {
  guid: string;
  link: string;
  title: string;
  contentSnippet?: string;
  content?: string;
  isoDate?: string;
  pubDate?: string;
}

export interface ParsedJobData {
  douId: number;
  title: string;
  url: string;
  companySlug: string;
  companyName: string;
  description: string;
  publishedAt: Date;
}

