#!/usr/bin/env node
/**
 * build-site-knowledge.js
 *
 * Reads the PUBLIC website pages (Frontend/src/pages/website-pages/*.tsx),
 * strips away JSX/code and extracts the human-readable copy (headings,
 * paragraphs, list items, FAQ text, etc.), and writes it to
 * Backend/src/data/site-knowledge.json.
 *
 * Why this exists:
 *  - The chat widget ("Anna") needs to answer questions like "what is your
 *    mission?" using the REAL copy that is on the website, not a guess.
 *  - Doing this once, offline, means the chat endpoint never has to fetch or
 *    search the internet (no Tavily/Google calls, no extra AI tokens spent
 *    "reading" pages on every message) — it just looks up already-extracted
 *    text. This keeps AI-provider costs low and answers accurate.
 *  - It intentionally only reads the `website-pages` folder and explicitly
 *    skips anything owner/admin related (BlogAdminPage, OwnerLoginPage,
 *    OwnerSupportInboxPage, etc.) so internal tooling copy never leaks into
 *    public chat answers.
 *
 * Usage:
 *   node Backend/scripts/build-site-knowledge.js
 *   (or: npm run build:knowledge   -- see Backend/package.json)
 *
 * Re-run this any time the marketing/website pages change, then redeploy
 * the backend so the assistant picks up the new copy.
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_PAGES_DIR = path.resolve(
  __dirname,
  '../../Frontend/src/pages/website-pages'
);
const OUTPUT_FILE = path.resolve(__dirname, '../src/data/site-knowledge.json');

// Maps each PUBLIC page component to the real route it renders at and a
// human title. Anything not listed here (owner/admin/auth pages) is never
// read into the assistant's knowledge base.
const PUBLIC_PAGES = [
  { file: 'HomePage.tsx', route: '/', title: 'Home' },
  { file: 'AboutPage.tsx', route: '/about', title: 'About Us (Mission & Vision)' },
  { file: 'Educationalresourcespage.tsx', route: '/resources', title: 'Educational Resources' },
  { file: 'Platform.tsx', route: '/analytics', title: 'Platform Overview' },
  { file: 'ClientsPage.tsx', route: '/company/client', title: 'Clients' },
  { file: 'SupportPage.tsx', route: '/support', title: 'Support' },
  { file: 'PrivacyPage.tsx', route: '/privacy', title: 'Privacy Policy' },
  { file: 'TermsPage.tsx', route: '/terms', title: 'Terms of Service' },
  { file: 'SecurityPage.tsx', route: '/security', title: 'Security' },
  { file: 'SystemStatusPage.tsx', route: '/status', title: 'System Status' },
  { file: 'ReportIncidentPage.tsx', route: '/status/report-incident', title: 'Report an Incident' },
  { file: 'TeamPage.tsx', route: '/company/our-team', title: 'Our Team / Leadership' },
  { file: 'CBEStandardsPage.tsx', route: '/cbc-standards', title: 'CBC Standards' },
  { file: 'Contact.tsx', route: '/contact', title: 'Contact Us' },
  { file: 'Features.tsx', route: '/features', title: 'Features' },
  { file: 'BlogPage.tsx', route: '/blog', title: 'Blog' },
  { file: 'CareersPage.tsx', route: '/careers', title: 'Careers' },
  { file: 'PricingPage.tsx', route: '/pricing', title: 'Pricing' },
  { file: 'TestimonialsPage.tsx', route: '/testimonials', title: 'Testimonials' },
  { file: 'DemoPage.tsx', route: '/demo', title: 'Request a Demo' },
  { file: 'GettingStartedPage.tsx', route: '/getting-started', title: 'Getting Started' },
  { file: 'CurriculumPage.tsx', route: '/curriculum', title: 'Curriculum' },
  { file: 'ProgressTrackingPage.tsx', route: '/progress', title: 'Progress Tracking' },
  { file: 'AssessmentToolsPage.tsx', route: '/assessments', title: 'Assessment Tools' },
  { file: 'CBEMethodologyPage.tsx', route: '/methodology', title: 'CBE Methodology' },
  { file: 'TeacherResourcesPage.tsx', route: '/teacher/resources', title: 'Teacher Resources' },
  { file: 'GlobalStandardsPage.tsx', route: '/standards', title: 'Global Standards' },
  { file: 'signup.tsx', route: '/get-started', title: 'Get Started' },
];

// Explicitly-excluded owner/admin/auth pages (kept here only for clarity /
// documentation — they are simply never added to PUBLIC_PAGES above):
//   BlogAdminPage.tsx, OwnerLoginPage.tsx, OwnerSupportInboxPage.tsx,
//   NotFound.tsx, BlogPostPage.tsx (dynamic, no static copy to extract)

const STOPWORD_LINE = /^(use client|import |export default|export const|const |let |var |function |return \(|\)\s*;?\s*$|\/\/|\/\*|\*\/)/;

/** Remove single-line and block comments. */
function stripComments(src) {
  return src
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, ' ') // {/* jsx comment */}
    .replace(/\/\*[\s\S]*?\*\//g, ' ') // /* block comment */
    .replace(/(^|\s)\/\/.*$/gm, ' '); // // line comment
}

/** Remove import/require statements entirely. */
function stripImports(src) {
  return src
    .replace(/^import[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^import\s+['"][^'"]+['"];?\s*$/gm, '');
}

/**
 * Pull out human-readable strings:
 *  1) Text sitting between JSX tags: `>Some copy here<`
 *  2) String values assigned to common "content" keys in data arrays, e.g.
 *     `text: 'Real-time competency tracking...'`, `title: "..."`,
 *     `question: '...'`, `answer: "..."`, `description: \`...\``
 */
function extractReadableText(src) {
  const found = [];

  // 1) JSX text nodes between > and < (allow multi-line indented text, e.g.
  //    <p className="...">\n  Some copy across the next line\n</p>)
  const jsxTextRe = />([^<>{}]+)</g;
  let m;
  while ((m = jsxTextRe.exec(src))) {
    const text = m[1].replace(/\s+/g, ' ').trim();
    if (isUsefulText(text)) found.push(text);
  }

  // 2) key: 'value' / key: "value" / key: `value` for content-ish keys
  const keyValueRe =
    /\b(text|title|heading|subtitle|desc|description|question|answer|label|content|name|role|quote|summary)\s*:\s*(['"`])((?:(?!\2)[^\\]|\\.)*)\2/gi;
  while ((m = keyValueRe.exec(src))) {
    const text = m[3].replace(/\s+/g, ' ').trim();
    if (isUsefulText(text)) found.push(text);
  }

  return dedupe(found);
}

function isUsefulText(text) {
  if (!text || text.length < 3) return false;
  if (text.length > 600) return false; // likely accidentally captured code
  if (/^[{}[\]#0-9.,\s'"()%-]*$/.test(text)) return false; // pure symbols/numbers
  if (/^(w-|h-|bg-|text-|p-|m-|px-|py-|flex|grid|rounded|border|opacity|transition|hover:|font-|from-|to-|via-)/.test(text)) return false; // tailwind classes
  if (/^#[0-9a-fA-F]{3,8}$/.test(text)) return false; // hex colors
  if (/^https?:\/\//.test(text)) return false; // raw urls
  if (/^[A-Za-z0-9_-]+\.(png|jpe?g|svg|webp|gif)$/i.test(text)) return false; // filenames
  if (!/[a-zA-Z]{3,}/.test(text)) return false; // needs actual words
  if (/[;{}]|=>|\bconst\b|\blet\b|\bfunction\b|\bfor\s*\(|\bif\s*\(|canvas|particle/i.test(text)) return false; // stray JS expression fragments
  if (/\.\w+\s*[<>=]/.test(text)) return false; // e.g. "particle.x" comparisons
  return true;
}

function dedupe(arr) {
  return Array.from(new Set(arr));
}

function extractPage({ file, route, title }) {
  const fullPath = path.join(FRONTEND_PAGES_DIR, file);
  if (!fs.existsSync(fullPath)) {
    console.warn(`[build-site-knowledge] Skipping missing file: ${file}`);
    return null;
  }

  const raw = fs.readFileSync(fullPath, 'utf8');
  const cleaned = stripImports(stripComments(raw));
  const lines = extractReadableText(cleaned).filter(
    (line) => !STOPWORD_LINE.test(line)
  );

  const content = lines.join('\n');
  if (!content.trim()) {
    console.warn(`[build-site-knowledge] No readable content extracted from: ${file}`);
    return null;
  }

  return {
    slug: file.replace(/\.tsx?$/, ''),
    title,
    route,
    content,
    charCount: content.length,
  };
}

function main() {
  if (!fs.existsSync(FRONTEND_PAGES_DIR)) {
    console.error(
      `[build-site-knowledge] Frontend pages directory not found at ${FRONTEND_PAGES_DIR}. ` +
        `Run this script from a checkout that contains both Backend/ and Frontend/.`
    );
    process.exitCode = 1;
    return;
  }

  const pages = PUBLIC_PAGES.map(extractPage).filter(Boolean);

  const output = {
    generatedAt: new Date().toISOString(),
    pageCount: pages.length,
    pages,
  };

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8');

  console.log(
    `[build-site-knowledge] Wrote ${pages.length} pages (${pages
      .reduce((sum, p) => sum + p.charCount, 0)
      .toLocaleString()} chars) to ${OUTPUT_FILE}`
  );
}

main();
