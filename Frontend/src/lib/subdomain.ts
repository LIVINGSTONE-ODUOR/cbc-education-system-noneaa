// src/lib/subdomain.ts
//
// Detects whether the visitor is on a school's subdomain
// (e.g. ekwanda.noneaa.com) as opposed to the bare root domain,
// a Vercel preview URL, or localhost — and resolves it to that
// school's basic info via the backend.

import { RESERVED_PAGE_SUBDOMAINS } from '@/utils/hostRouting';

export interface SubdomainSchool {
  id: string;
  name: string;
  code: string;
  subdomain: string;
  level: string;
  school_type: string;
  county: string;
}

// Hostnames that should never be treated as a school subdomain lookup.
const NON_SCHOOL_HOSTS = new Set(['noneaa.com', 'www.noneaa.com', 'localhost']);

/**
 * Returns the school subdomain segment of the current hostname, or
 * null if the visitor isn't on a school-specific subdomain (e.g.
 * they're on the bare root domain, a Vercel preview deploy, or
 * localhost during development).
 */
export const getCurrentSubdomain = (): string | null => {
  const host = window.location.hostname;

  if (NON_SCHOOL_HOSTS.has(host)) return null;
  if (host.endsWith('.vercel.app')) return null; // preview/staging deploys
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return null; // raw IP

  if (host.endsWith('.noneaa.com')) {
    const sub = host.replace('.noneaa.com', '');
    if (!sub || sub === 'www') return null;
    // status.noneaa.com, terms.noneaa.com, etc. are reserved pages,
    // never school subdomains — don't attempt a school lookup for them.
    if ((RESERVED_PAGE_SUBDOMAINS as readonly string[]).includes(sub)) return null;
    return sub;
  }

  return null;
};

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return '';
};

/**
 * Resolves a subdomain to the school it belongs to. Returns null if
 * no active school is found at that subdomain (e.g. it was deleted,
 * or mistyped).
 */
export const resolveSchoolBySubdomain = async (
  subdomain: string
): Promise<SubdomainSchool | null> => {
  try {
    const res = await fetch(
      `${getApiUrl()}/api/v1/school/by-subdomain/${encodeURIComponent(subdomain)}`
    );
    if (!res.ok) return null;
    const result = await res.json();
    return result?.data?.school ?? null;
  } catch {
    return null;
  }
};
