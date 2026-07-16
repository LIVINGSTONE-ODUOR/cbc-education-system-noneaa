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

export type ReservedPage = (typeof RESERVED_PAGE_SUBDOMAINS)[number];

// Subdomains that are neither a reserved page nor a school (skip entirely)
const OTHER_RESERVED = ['www', 'api', 'app'];

const ROOT_DOMAIN = 'noneaa.com';

// Equivalent internal route for each reserved page — used as the link
// target when NOT on the real production domain (localhost, Vercel
// preview URLs), since e.g. status.noneaa.com won't resolve there.
const RESERVED_PAGE_PATHS: Record<ReservedPage, string> = {
  status: '/status',
  terms: '/terms',
  privacy: '/privacy',
  security: '/security',
  methodology: '/methodology',
  'teacher-resources': '/teacher/resources',
  standards: '/standards',
};

/**
 * Returns the URL a reserved-page nav link (Footer, etc.) should point to.
 * - On the real production domain: absolute URL to the subdomain
 *   (e.g. "https://status.noneaa.com") — meant to be opened in a new tab.
 * - Everywhere else (localhost, Vercel previews): the internal route
 *   (e.g. "/status") so links still work while developing/previewing.
 */
export function getReservedPageUrl(page: ReservedPage): string {
  const hostname = window.location.hostname;
  const isProdRootDomain =
    hostname === ROOT_DOMAIN || hostname.endsWith(`.${ROOT_DOMAIN}`);

  if (isProdRootDomain) {
    return `${window.location.protocol}//${page}.${ROOT_DOMAIN}`;
  }

  return RESERVED_PAGE_PATHS[page];
}

/** True if the URL from getReservedPageUrl() is an absolute external link
 *  (i.e. should be opened with a plain <a target="_blank">) rather than
 *  an internal route (i.e. should use React Router's <Link>). */
export function isExternalReservedUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

/** Path to the status page's own root. "/" on status.noneaa.com (it already
 *  IS the status page there), "/status" everywhere else. Use this for any
 *  "back to status" navigation from within the status pages. */
export function getStatusHomePath(): string {
  const host = getHostContext();
  return host.type === 'reserved' && host.page === 'status' ? '/' : '/status';
}

/** Path to the report-incident page. "/report-incident" on status.noneaa.com,
 *  "/status/report-incident" everywhere else. Use this instead of a hardcoded
 *  path so the link stays on the current host instead of bouncing through
 *  ReservedSubdomainGate to the main domain. */
export function getReportIncidentPath(): string {
  const host = getHostContext();
  return host.type === 'reserved' && host.page === 'status' ? '/report-incident' : '/status/report-incident';
}

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
