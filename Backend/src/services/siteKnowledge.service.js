/**
 * siteKnowledge.service.js
 *
 * Loads the pre-built site-knowledge.json (see Backend/scripts/build-site-knowledge.js)
 * once into memory and exposes a cheap, dependency-free keyword search over it.
 *
 * Design goals:
 *  - No network calls, no external search API, no extra AI tokens spent
 *    fetching pages — the content is already on disk.
 *  - Only a handful of the most relevant snippets are returned per query
 *    (not the whole knowledge base), keeping the prompt small and cheap.
 *  - If the JSON file is ever missing/corrupt, the assistant should degrade
 *    gracefully (fall back to its general persona) rather than crash.
 */

const fs = require('fs');
const path = require('path');

const KNOWLEDGE_FILE = path.resolve(__dirname, '../data/site-knowledge.json');

// How much page text (in characters) we're willing to inject into a single
// prompt. Keeping this small keeps the request cheap regardless of which
// AI provider is behind /ai-chat.
const MAX_CONTEXT_CHARS = 2200;
const MAX_SNIPPETS = 3;

let cache = null; // { generatedAt, pages: [{slug, title, route, content, terms}] }

const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'do', 'does', 'did', 'have', 'has', 'had', 'i', 'you', 'he', 'she', 'it',
  'we', 'they', 'my', 'your', 'our', 'their', 'this', 'that', 'these',
  'those', 'to', 'of', 'in', 'on', 'for', 'with', 'and', 'or', 'but',
  'what', 'when', 'where', 'who', 'why', 'how', 'can', 'could', 'would',
  'should', 'will', 'about', 'tell', 'me', 'please', 'noneaa', 'platform',
]);

function tokenize(text) {
  return (text.toLowerCase().match(/[a-z0-9]+/g) || []).filter(
    (w) => w.length > 2 && !STOPWORDS.has(w)
  );
}

function load() {
  if (cache) return cache;

  try {
    const raw = fs.readFileSync(KNOWLEDGE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    const pages = (parsed.pages || []).map((p) => ({
      ...p,
      terms: tokenize(`${p.title} ${p.content}`),
    }));
    cache = { generatedAt: parsed.generatedAt || null, pages };
  } catch (error) {
    console.warn(
      `[site-knowledge] Could not load ${KNOWLEDGE_FILE}: ${error.message}. ` +
        `Run "npm run build:knowledge" to generate it. Falling back to empty knowledge base.`
    );
    cache = { generatedAt: null, pages: [] };
  }

  return cache;
}

/** Force a reload on the next call — used by the optional admin refresh route. */
function invalidateCache() {
  cache = null;
}

function scorePage(page, queryTerms) {
  if (!queryTerms.length) return 0;
  let score = 0;
  for (const term of queryTerms) {
    // exact term hits
    score += page.terms.filter((t) => t === term).length;
    // partial/substring hits count less (handles simple plurals etc.)
    if (page.terms.some((t) => t.includes(term) || term.includes(t))) score += 0.5;
  }
  return score;
}

/**
 * Return the top few page excerpts relevant to a user's question.
 * @param {string} query - the visitor's message
 * @returns {{ slug: string, title: string, route: string, excerpt: string }[]}
 */
function retrieveRelevantContent(query) {
  const { pages } = load();
  if (!pages.length) return [];

  const queryTerms = tokenize(query);
  if (!queryTerms.length) return [];

  const ranked = pages
    .map((page) => ({ page, score: scorePage(page, queryTerms) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SNIPPETS);

  return ranked.map(({ page }) => ({
    slug: page.slug,
    title: page.title,
    route: page.route,
    excerpt: page.content.slice(0, MAX_CONTEXT_CHARS),
  }));
}

/**
 * Build a ready-to-inject context block for the system prompt.
 * Returns '' when nothing relevant was found (caller should just skip it).
 */
function buildContextBlock(query) {
  const hits = retrieveRelevantContent(query);
  if (!hits.length) return '';

  const sections = hits
    .map(
      (h) =>
        `[Page: ${h.title} (${h.route})]\n${h.excerpt}`
    )
    .join('\n\n');

  return (
    `Here is verified content taken directly from the NONEAA public website ` +
    `that is relevant to the visitor's question. Prefer this over general ` +
    `knowledge when answering. If it doesn't fully answer the question, say ` +
    `so honestly instead of guessing.\n\n${sections}`
  );
}

function getStats() {
  const { pages, generatedAt } = load();
  return { pageCount: pages.length, generatedAt };
}

module.exports = {
  retrieveRelevantContent,
  buildContextBlock,
  invalidateCache,
  getStats,
};
