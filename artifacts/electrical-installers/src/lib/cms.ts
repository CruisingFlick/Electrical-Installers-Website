export type Faq = {
  id: number;
  question: string;
  answer: string;
  sortOrder: number;
};

export type PricingItem = {
  id: number;
  label: string;
  priceRange: string;
  description?: string | null;
  sortOrder: number;
};

export type ServicePage = {
  id: number;
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  bullets: string[];
  pricingBlurb?: string | null;
  portfolioCategory?: string | null;
  heroImageUrl?: string | null;
  externalPath?: string | null;
  sortOrder: number;
};

export type SuburbPage = {
  id: number;
  slug: string;
  suburb: string;
  heading: string;
  intro: string;
  portfolioSuburb?: string | null;
  sortOrder: number;
};

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const data = await res.json() as { error?: string };
      if (data.error) msg = data.error;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`, { credentials: "same-origin" });
  return handle<T>(res);
}

export async function apiSend<T>(method: "POST" | "PUT" | "DELETE", path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: "same-origin",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return handle<T>(res);
}
