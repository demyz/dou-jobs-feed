// Category type
export interface Category {
  id: string;
  name: string;
  slug: string;
}

// Location type
export interface Location {
  id: string;
  name: string;
  slug: string;
}

// Subscription type
export interface Subscription {
  categoryId: string;
  category: Category;
  locations: Location[];
}

// Job type
export interface Job {
  id: string;
  douId: number;
  title: string;
  url: string;
  description: string;
  fullDescription?: string;
  publishedAt: string;
  company: {
    id: string;
    name: string;
    slug: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  locations: Location[];
}


