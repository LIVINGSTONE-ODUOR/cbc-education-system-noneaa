// Frontend/src/utils/hostRouting.ts

// Subdomains that map to a standalone page instead of a school tenant.
// Add new ones here in future (e.g. "blog", "docs") without touching App.tsx.
export const RESERVED_PAGE_SUBDOMAINS = [
  'status',
  'terms',
  'privacy',
  'security',
  'methodology',
  'teacher-resources',
  'standards',
] as const;

type ReservedPage = (typeof RESERVED_PAGE_SUBDOMAINS)[number];

// Subdomains that are neither a reserved page nor a school (skip entirely)
const OTHER_RESERVED = ['www', 'api', 'app'];

export type HostContext =
  | { type: 'reserved'; page: ReservedPage; subdomain: null }
  | { type: 'school'; page: null; subdomain: string }
  | { type: 'main'; page: null; subdomain: null };

export function getHostContext(): HostContext {
  const hostname = window.location.hostname; // e.g. status.noneaa.com

  // Local dev fallback (localhost, 127.0.0.1, vercel preview URLs)
  if (
    hostname === 'localhost' ||
    hostname.startsWith('127.') ||
    hostname.endsWith('.vercel.app')
  ) {
    return { type: 'main', page: null, subdomain: null };
  }

  const parts = hostname.split('.');
  // e.g. ["status","noneaa","com"] or ["noneaa","com"]
  if (parts.length <= 2) {
    return { type: 'main', page: null, subdomain: null }; // noneaa.com itself
  }

  const subdomain = parts[0];

  if ((RESERVED_PAGE_SUBDOMAINS as readonly string[]).includes(subdomain)) {
    return { type: 'reserved', page: subdomain as ReservedPage, subdomain: null };
  }

  if (OTHER_RESERVED.includes(subdomain)) {
    return { type: 'main', page: null, subdomain: null };
  }

  // anything else (e.g. "maseno") is treated as a school slug
  return { type: 'school', page: null, subdomain };
}
