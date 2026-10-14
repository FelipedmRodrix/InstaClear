/**
 * Instagram Data Export Parser
 * Supports ZIP archives, multiple JSON formats, HTML exports, and concatenated text
 */
import JSZip from 'jszip';
import { InstagramAccount, ImportAuditReport } from '../types/instagram';

interface RawAccountItem {
  username: string;
  displayName?: string;
  href?: string;
  timestamp?: number;
}

const RESERVED_WORDS = new Set([
  '_u', 'u', 'p', 'reel', 'reels', 'stories', 'explore', 'direct', 'accounts',
  'about', 'legal', 'privacy', 'help', 'settings', 'following', 'followers',
  'home', 'login', 'signup', 'null', 'undefined'
]);

const IGNORED_PATH_KEYWORDS = [
  'hashtag',
  'recently_unfollowed',
  'pending',
  'recent_follow_requests',
  'follow_requests',
  'blocked',
  'restricted',
  'close_friends',
  'favorited',
  'favorite',
  'hide_story',
  'removed_suggestions',
  'synced_contacts',
  'contacts',
  'start_here',
  'autofill',
  'message',
  'comment',
  'story_sticker'
];

const MONTH_MAP: Record<string, number> = {
  jan: 0, fev: 1, feb: 1, mar: 2, abr: 3, apr: 3, mai: 4, may: 4, jun: 5,
  jul: 6, ago: 7, aug: 7, set: 8, sep: 8, out: 9, oct: 9, nov: 10, dez: 11, dec: 11
};

/**
 * Normalizes an Instagram username, properly extracting from URLs like
 * https://www.instagram.com/_u/username or https://www.instagram.com/username
 */
export function normalizeUsername(input: string): string {
  if (!input) return '';
  let cleaned = input.trim();

  // If input contains instagram.com
  if (cleaned.includes('instagram.com')) {
    // 1. Check for /_u/<username>
    const uMatch = cleaned.match(/instagram\.com\/_u\/([a-zA-Z0-9._]+)/i);
    if (uMatch && uMatch[1] && !RESERVED_WORDS.has(uMatch[1].toLowerCase())) {
      cleaned = uMatch[1];
    } else {
      // 2. Check for regular /<username>
      const match = cleaned.match(/instagram\.com\/([a-zA-Z0-9._]+)/i);
      if (match && match[1]) {
        if (match[1].toLowerCase() === '_u') {
          const nextSeg = cleaned.match(/instagram\.com\/_u\/([a-zA-Z0-9._]+)/i);
          cleaned = nextSeg && nextSeg[1] ? nextSeg[1] : '';
        } else if (!RESERVED_WORDS.has(match[1].toLowerCase())) {
          cleaned = match[1];
        } else {
          cleaned = '';
        }
      }
    }
  }

  // Handle _u/username directly if passed without domain
  if (cleaned.startsWith('_u/')) {
    cleaned = cleaned.slice(3);
  }

  // Strip leading @, trailing slashes, query parameters, hashes
  cleaned = cleaned.replace(/^@/, '').split('/')[0].split('?')[0].split('#')[0].trim();
  const lower = cleaned.toLowerCase();
  if (RESERVED_WORDS.has(lower) || lower.length === 0) {
    return '';
  }
  return lower;
}

/**
 * Parses dates commonly formatted in Instagram HTML/JSON exports
 * Supports Portuguese, English, 12h/24h and ISO strings
 */
export function parseInstagramDate(text: string): number | undefined {
  if (!text) return undefined;

  // Try pattern: "out 14, 2026 4:42 da manhã" or "Oct 14, 2026, 4:42 AM" or "14 de out. de 2026"
  const match =
    text.match(/(jan|fev|feb|mar|abr|apr|mai|may|jun|jul|ago|aug|set|sep|out|oct|nov|dez|dec)\.?\s+(\d{1,2}),?\s+(\d{4})/i) ||
    text.match(/(\d{1,2})\s+de\s+(jan|fev|feb|mar|abr|apr|mai|may|jun|jul|ago|aug|set|sep|out|oct|nov|dez|dec)\.?\s+de\s+(\d{4})/i);

  if (!match) {
    const isoMatch = text.match(/\d{4}-\d{2}-\d{2}(?:T|\s)\d{2}:\d{2}/);
    if (isoMatch) {
      const parsed = Date.parse(isoMatch[0]);
      if (!isNaN(parsed)) return parsed;
    }
    return undefined;
  }

  let monthStr: string;
  let dayStr: string;
  let yearStr: string;

  if (match[1] && isNaN(parseInt(match[1], 10))) {
    monthStr = match[1].toLowerCase();
    dayStr = match[2];
    yearStr = match[3];
  } else {
    dayStr = match[1];
    monthStr = match[2].toLowerCase();
    yearStr = match[3];
  }

  const m = MONTH_MAP[monthStr];
  const d = parseInt(dayStr, 10);
  const y = parseInt(yearStr, 10);
  if (m === undefined || isNaN(d) || isNaN(y)) return undefined;

  let hour = 12;
  let min = 0;
  const timeMatch = text.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    hour = parseInt(timeMatch[1], 10);
    min = parseInt(timeMatch[2], 10);
    const lower = text.toLowerCase();
    if (lower.includes('tarde') || lower.includes('noite') || lower.includes('pm')) {
      if (hour < 12) hour += 12;
    } else if (lower.includes('manh') || lower.includes('madrugada') || lower.includes('am')) {
      if (hour === 12) hour = 0;
    }
  }

  return new Date(y, m, d, hour, min).getTime();
}

/**
 * Extracts account items from parsed JSON object/array
 */
export function extractAccountsFromJson(data: any): RawAccountItem[] {
  const results: RawAccountItem[] = [];
  if (!data) return results;

  if (Array.isArray(data)) {
    for (const item of data) {
      if (item && item.string_list_data && Array.isArray(item.string_list_data)) {
        for (const sld of item.string_list_data) {
          const val = sld.value || sld.href || item.title;
          const norm = normalizeUsername(val);
          if (norm) {
            const rawTitle = item.title && !item.title.startsWith('http') ? item.title : norm;
            results.push({
              username: norm,
              displayName: rawTitle,
              href: sld.href || `https://www.instagram.com/${norm}/`,
              timestamp: sld.timestamp ? sld.timestamp * 1000 : undefined,
            });
          }
        }
      } else if (item && typeof item === 'object') {
        const username = item.username || item.value || item.title || item.href;
        const norm = normalizeUsername(username);
        if (norm) {
          const rawTitle = item.title && !item.title.startsWith('http') ? item.title : norm;
          results.push({
            username: norm,
            displayName: rawTitle,
            href: item.href || `https://www.instagram.com/${norm}/`,
            timestamp: item.timestamp ? item.timestamp * 1000 : undefined,
          });
        }
      }
    }
    return results;
  }

  if (data.relationships_followers && Array.isArray(data.relationships_followers)) {
    return extractAccountsFromJson(data.relationships_followers);
  }

  if (data.relationships_following && Array.isArray(data.relationships_following)) {
    return extractAccountsFromJson(data.relationships_following);
  }

  if (data.following && Array.isArray(data.following)) {
    return extractAccountsFromJson(data.following);
  }
  if (data.followers && Array.isArray(data.followers)) {
    return extractAccountsFromJson(data.followers);
  }

  function searchDeep(node: any) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const el of node) searchDeep(el);
      return;
    }
    if (node.string_list_data && Array.isArray(node.string_list_data)) {
      for (const sld of node.string_list_data) {
        const val = sld.value || sld.href || node.title;
        const norm = normalizeUsername(val);
        if (norm) {
          const rawTitle = node.title && !node.title.startsWith('http') ? node.title : norm;
          results.push({
            username: norm,
            displayName: rawTitle,
            href: sld.href || `https://www.instagram.com/${norm}/`,
            timestamp: sld.timestamp ? sld.timestamp * 1000 : undefined,
          });
        }
      }
    }
    const directVal = node.username || node.value || node.href || (typeof node.title === 'string' && !node.title.includes(' ') ? node.title : '');
    const directNorm = normalizeUsername(directVal);
    if (directNorm) {
      results.push({
        username: directNorm,
        displayName: node.title && !node.title.includes('http') ? node.title : directNorm,
        href: node.href || `https://www.instagram.com/${directNorm}/`,
        timestamp: node.timestamp ? node.timestamp * 1000 : undefined,
      });
    }

    for (const key of Object.keys(node)) {
      if (typeof node[key] === 'object') {
        searchDeep(node[key]);
      }
    }
  }

  searchDeep(data);
  return results;
}

/**
 * Robust extraction of accounts from Instagram HTML export documents
 * Uses DOMParser when in browser environment with regex fallback
 */
export function extractAccountsFromHtml(htmlContent: string): RawAccountItem[] {
  const results: RawAccountItem[] = [];

  // 1. Try DOMParser when available in browser
  if (typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');

      // Instagram wraps each entry in a top-level div with class "pam" or "_a6-g"
      let blocks = doc.querySelectorAll('div.pam, div._a6-g');
      if (blocks.length === 0) {
        blocks = doc.querySelectorAll('div._a6-p');
      }

      if (blocks.length > 0) {
        blocks.forEach((block) => {
          let username = '';
          let displayName = '';
          let href = '';
          let timestamp: number | undefined;

          const h2 = block.querySelector('h2');
          if (h2 && h2.textContent?.trim()) {
            const rawH2 = h2.textContent.trim();
            const normH2 = normalizeUsername(rawH2);
            if (normH2) {
              username = normH2;
              displayName = rawH2;
            }
          }

          const link = block.querySelector('a[href*="instagram.com"]');
          if (link) {
            href = link.getAttribute('href') || '';
            const linkText = link.textContent?.trim() || '';
            if (!username) {
              username = normalizeUsername(linkText) || normalizeUsername(href);
            }
            if (!displayName && linkText && !linkText.startsWith('http') && !linkText.includes('instagram.com')) {
              displayName = linkText;
            }
          }

          const blockText = block.textContent || '';
          timestamp = parseInstagramDate(blockText);

          if (username && !RESERVED_WORDS.has(username)) {
            results.push({
              username,
              displayName: displayName || username,
              href: href.startsWith('http') ? href : `https://www.instagram.com/${username}/`,
              timestamp,
            });
          }
        });
      }

      // If blocks yielded nothing, search direct links
      if (results.length === 0) {
        const links = doc.querySelectorAll('a[href*="instagram.com"]');
        links.forEach((link) => {
          const href = link.getAttribute('href') || '';
          const text = link.textContent?.trim() || '';
          const norm = normalizeUsername(text) || normalizeUsername(href);
          if (norm && !RESERVED_WORDS.has(norm)) {
            const parentContainer = link.closest('div.pam, div._a6-g, div._a6-p, li, td') || link.parentElement;
            const parentText = parentContainer?.textContent || '';
            const timestamp = parseInstagramDate(parentText);
            const displayName = text && !text.startsWith('http') && !text.includes('instagram.com') ? text : norm;
            results.push({
              username: norm,
              displayName,
              href: href.startsWith('http') ? href : `https://www.instagram.com/${norm}/`,
              timestamp,
            });
          }
        });
      }
    } catch (err) {
      console.warn('DOMParser failed, falling back to regex block parser:', err);
    }
  }

  // 2. Fallback to regex block extraction if DOMParser produced 0 items
  if (results.length === 0) {
    const pamBlocks = htmlContent.split(/<div class="pam/i).slice(1);
    if (pamBlocks.length > 0) {
      for (const block of pamBlocks) {
        const h2Match = block.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
        const linkMatch = block.match(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);

        const rawH2 = h2Match ? h2Match[1].replace(/<[^>]+>/g, '').trim() : '';
        const href = linkMatch ? linkMatch[1] : '';
        const linkText = linkMatch ? linkMatch[2].replace(/<[^>]+>/g, '').trim() : '';

        const norm = normalizeUsername(rawH2) || normalizeUsername(linkText) || normalizeUsername(href);
        if (!norm || RESERVED_WORDS.has(norm)) continue;

        const timestamp = parseInstagramDate(block);
        const displayName = rawH2 && !rawH2.startsWith('http')
          ? rawH2
          : linkText && !linkText.startsWith('http') && !linkText.includes('instagram.com')
            ? linkText
            : norm;

        results.push({
          username: norm,
          displayName,
          href: href.startsWith('http') ? href : `https://www.instagram.com/${norm}/`,
          timestamp,
        });
      }
    } else {
      // General regex search for links
      const linkRegex = /<a\s+[^>]*href=["'](https?:\/\/(?:www\.)?instagram\.com\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      let match: RegExpExecArray | null;
      while ((match = linkRegex.exec(htmlContent)) !== null) {
        const href = match[1];
        const linkText = match[2].replace(/<[^>]+>/g, '').trim();
        const norm = normalizeUsername(linkText) || normalizeUsername(href);
        if (!norm || RESERVED_WORDS.has(norm)) continue;

        const afterSnippet = htmlContent.slice(match.index + match[0].length, match.index + match[0].length + 300);
        const timestamp = parseInstagramDate(afterSnippet);
        const displayName = linkText && !linkText.startsWith('http') && !linkText.includes('instagram.com') ? linkText : norm;

        results.push({
          username: norm,
          displayName,
          href: `https://www.instagram.com/${norm}/`,
          timestamp,
        });
      }
    }
  }

  // Deduplicate within the single file
  const uniqueMap = new Map<string, RawAccountItem>();
  for (const item of results) {
    const norm = normalizeUsername(item.username);
    if (norm && !uniqueMap.has(norm)) {
      uniqueMap.set(norm, { ...item, username: norm });
    }
  }

  return Array.from(uniqueMap.values());
}

export interface ParseResult {
  accounts: InstagramAccount[];
  report: ImportAuditReport;
}

function getBasename(filePath: string): string {
  return filePath.split('/').pop()?.toLowerCase() || '';
}

function isIgnoredFile(path: string): boolean {
  const lower = path.toLowerCase();
  return IGNORED_PATH_KEYWORDS.some((kw) => lower.includes(kw));
}

function isFollowingFile(path: string): boolean {
  if (isIgnoredFile(path)) return false;
  const base = getBasename(path);
  if (!base.endsWith('.json') && !base.endsWith('.html') && !base.endsWith('.htm')) return false;

  // Strict match: following.html, following.json, following_1.json, seguindo.html, etc.
  if (/^(following|seguindo)(_\d+)?\.(json|html?)$/i.test(base)) {
    return true;
  }
  return false;
}

function isFollowersFile(path: string): boolean {
  if (isIgnoredFile(path)) return false;
  const base = getBasename(path);
  if (!base.endsWith('.json') && !base.endsWith('.html') && !base.endsWith('.htm')) return false;

  // Strict match: followers_1.html, followers.json, seguidores_1.html, etc.
  if (/^(followers?|seguidores?)(_\d+)?\.(json|html?)$/i.test(base)) {
    return true;
  }
  return false;
}

/**
 * Parse an Instagram ZIP archive with strict file filtering and accurate metrics
 */
export async function parseInstagramZip(
  file: File,
  onProgress?: (percent: number, status: string) => void
): Promise<ParseResult> {
  onProgress?.(10, 'Lendo arquivo compactado (.zip)...');

  const zip = new JSZip();
  let zipContent: JSZip;
  try {
    zipContent = await zip.loadAsync(file);
  } catch (err) {
    throw new Error('Não foi possível descompactar o arquivo. Certifique-se de que é um arquivo .ZIP válido do Instagram.');
  }

  onProgress?.(30, 'Localizando listas de seguidores e seguidos...');

  const filesScanned: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  const followingItems: RawAccountItem[] = [];
  const followersItems: RawAccountItem[] = [];

  const zipFiles = Object.keys(zipContent.files).filter((path) => !zipContent.files[path].dir);

  // Identify Following files
  let followingFileCandidates = zipFiles.filter(isFollowingFile);

  // Identify Followers files
  let followerFileCandidates = zipFiles.filter(isFollowersFile);

  // Fallback if no exact match found: search files where basename contains following or follower
  if (followingFileCandidates.length === 0) {
    followingFileCandidates = zipFiles.filter((p) => {
      if (isIgnoredFile(p)) return false;
      const base = getBasename(p);
      return (base.includes('following') || base.includes('seguindo')) && (base.endsWith('.json') || base.endsWith('.html'));
    });
  }

  if (followerFileCandidates.length === 0) {
    followerFileCandidates = zipFiles.filter((p) => {
      if (isIgnoredFile(p)) return false;
      const base = getBasename(p);
      return (base.includes('follower') || base.includes('seguidor')) && (base.endsWith('.json') || base.endsWith('.html'));
    });
  }

  if (followingFileCandidates.length === 0) {
    warnings.push('Nenhum arquivo de contas seguidas ("following.html" ou "following.json") foi localizado automaticamente no ZIP.');
  }

  if (followerFileCandidates.length === 0) {
    warnings.push('Nenhum arquivo de seguidores ("followers_*.html" ou "followers_*.json") foi localizado automaticamente no ZIP.');
  }

  let processed = 0;
  const totalFilesToProcess = followingFileCandidates.length + followerFileCandidates.length;

  for (const path of followingFileCandidates) {
    if (filesScanned.includes(path)) continue;
    filesScanned.push(path);
    try {
      const content = await zipContent.files[path].async('string');
      if (path.endsWith('.json')) {
        const json = JSON.parse(content);
        followingItems.push(...extractAccountsFromJson(json));
      } else {
        followingItems.push(...extractAccountsFromHtml(content));
      }
    } catch (err: any) {
      errors.push(`Erro ao processar ${path}: ${err.message || 'formato inválido'}`);
    }
    processed++;
    onProgress?.(30 + Math.floor((processed / (totalFilesToProcess || 1)) * 40), `Processando ${path}...`);
  }

  for (const path of followerFileCandidates) {
    if (filesScanned.includes(path)) continue;
    filesScanned.push(path);
    try {
      const content = await zipContent.files[path].async('string');
      if (path.endsWith('.json')) {
        const json = JSON.parse(content);
        followersItems.push(...extractAccountsFromJson(json));
      } else {
        followersItems.push(...extractAccountsFromHtml(content));
      }
    } catch (err: any) {
      errors.push(`Erro ao processar ${path}: ${err.message || 'formato inválido'}`);
    }
    processed++;
    onProgress?.(30 + Math.floor((processed / (totalFilesToProcess || 1)) * 40), `Processando ${path}...`);
  }

  onProgress?.(85, 'Comparando listas e calculando contas que não te seguem de volta...');

  return processExtractedLists({
    fileName: file.name,
    followingItems,
    followersItems,
    filesScanned,
    warnings,
    errors,
  });
}

/**
 * Parses individual JSON or HTML files dropped or selected by the user
 */
export async function parseIndividualFiles(
  followingFile?: File,
  followersFiles?: File[]
): Promise<ParseResult> {
  const filesScanned: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  const followingItems: RawAccountItem[] = [];
  const followersItems: RawAccountItem[] = [];

  if (followingFile) {
    filesScanned.push(followingFile.name);
    try {
      const text = await followingFile.text();
      if (followingFile.name.endsWith('.json')) {
        followingItems.push(...extractAccountsFromJson(JSON.parse(text)));
      } else {
        followingItems.push(...extractAccountsFromHtml(text));
      }
    } catch (err: any) {
      errors.push(`Erro ao ler ${followingFile.name}: ${err.message}`);
    }
  }

  if (followersFiles && followersFiles.length > 0) {
    for (const f of followersFiles) {
      filesScanned.push(f.name);
      try {
        const text = await f.text();
        if (f.name.endsWith('.json')) {
          followersItems.push(...extractAccountsFromJson(JSON.parse(text)));
        } else {
          followersItems.push(...extractAccountsFromHtml(text));
        }
      } catch (err: any) {
        errors.push(`Erro ao ler ${f.name}: ${err.message}`);
      }
    }
  }

  return processExtractedLists({
    fileName: followingFile?.name || 'Arquivos avulsos',
    followingItems,
    followersItems,
    filesScanned,
    warnings,
    errors,
  });
}

/**
 * Parses raw text or concatenated files
 */
export function parseCombinedTextOrHtml(rawText: string, fileName = 'Texto Colado'): ParseResult {
  const filesScanned: string[] = ['Texto/Conteúdo Direto'];
  const warnings: string[] = [];
  const errors: string[] = [];
  let followingItems: RawAccountItem[] = [];
  let followersItems: RawAccountItem[] = [];

  const hasFollowingSection =
    rawText.includes('following.html') ||
    rawText.includes('<title>Seguindo</title>') ||
    rawText.includes('u_0_4_T3');

  const hasFollowersSection =
    rawText.includes('followers_1.html') ||
    rawText.includes('followers.html') ||
    rawText.includes('<title>Seguidores</title>') ||
    rawText.includes('u_0_2_ts');

  if (hasFollowingSection && hasFollowersSection) {
    let followingPart = '';
    let followersPart = '';

    const splitIndex = rawText.indexOf('followers_1.html');
    if (splitIndex !== -1) {
      let followingIndex = rawText.indexOf('following.html');
      if (followingIndex === -1) {
        followingIndex = rawText.indexOf('<title>Seguindo</title>');
      }
      if (followingIndex > splitIndex) {
        followersPart = rawText.slice(splitIndex, followingIndex);
        followingPart = rawText.slice(followingIndex);
      } else if (followingIndex !== -1) {
        followingPart = rawText.slice(followingIndex, splitIndex);
        followersPart = rawText.slice(splitIndex);
      } else {
        followingPart = rawText.slice(0, splitIndex);
        followersPart = rawText.slice(splitIndex);
      }
    } else {
      const titleFollowers = rawText.indexOf('<title>Seguidores</title>');
      const titleFollowing = rawText.indexOf('<title>Seguindo</title>');
      if (titleFollowers !== -1 && titleFollowing !== -1) {
        if (titleFollowers < titleFollowing) {
          followersPart = rawText.slice(titleFollowers, titleFollowing);
          followingPart = rawText.slice(titleFollowing);
        } else {
          followingPart = rawText.slice(titleFollowing, titleFollowers);
          followersPart = rawText.slice(titleFollowers);
        }
      } else if (titleFollowers !== -1) {
        followersPart = rawText.slice(titleFollowers);
      } else if (titleFollowing !== -1) {
        followingPart = rawText.slice(titleFollowing);
      } else {
        followingPart = rawText;
      }
    }

    followingItems = extractAccountsFromHtml(followingPart);
    followersItems = extractAccountsFromHtml(followersPart);
    filesScanned.push('Seção de Contas Seguidas (following.html)');
    filesScanned.push('Seção de Seguidores (followers_1.html)');
  } else if (hasFollowingSection || rawText.includes('<title>Seguindo</title>')) {
    followingItems = extractAccountsFromHtml(rawText);
    filesScanned.push('Lista de Contas Seguidas (following.html)');
  } else if (hasFollowersSection || rawText.includes('<title>Seguidores</title>')) {
    followersItems = extractAccountsFromHtml(rawText);
    filesScanned.push('Lista de Seguidores (followers_1.html)');
  } else {
    try {
      const json = JSON.parse(rawText);
      const extracted = extractAccountsFromJson(json);
      followingItems = extracted;
    } catch {
      const extracted = extractAccountsFromHtml(rawText);
      followingItems = extracted;
    }
  }

  return processExtractedLists({
    fileName,
    followingItems,
    followersItems,
    filesScanned,
    warnings,
    errors,
  });
}

/**
 * Normalizes, deduplicates, and compares following vs followers
 * Exclusively calculates all metrics from the real extracted data
 */
function processExtractedLists(params: {
  fileName: string;
  followingItems: RawAccountItem[];
  followersItems: RawAccountItem[];
  filesScanned: string[];
  warnings: string[];
  errors: string[];
}): ParseResult {
  const { fileName, followingItems, followersItems, filesScanned, warnings, errors } = params;

  let duplicateCount = 0;

  // Set of followers (normalized username)
  const followersSet = new Set<string>();
  for (const item of followersItems) {
    const norm = normalizeUsername(item.username);
    if (norm) {
      if (followersSet.has(norm)) {
        duplicateCount++;
      } else {
        followersSet.add(norm);
      }
    }
  }

  // Map of following accounts (normalized username -> account details)
  const followingMap = new Map<string, InstagramAccount>();

  for (const item of followingItems) {
    const norm = normalizeUsername(item.username);
    if (!norm) continue;

    if (followingMap.has(norm)) {
      duplicateCount++;
      continue;
    }

    const cleanUsername = item.username && !item.username.includes('/') && !item.username.includes(':')
      ? item.username.trim().replace(/^@/, '')
      : norm;

    const rawDisplay = item.displayName?.trim() || cleanUsername;
    const cleanDisplay = rawDisplay.startsWith('http://') || rawDisplay.startsWith('https://') || rawDisplay.includes('instagram.com')
      ? cleanUsername
      : rawDisplay;

    const account: InstagramAccount = {
      id: norm,
      username: cleanUsername,
      displayName: cleanDisplay,
      profileUrl: item.href || `https://www.instagram.com/${norm}/`,
      followedAt: item.timestamp,
      status: 'pending',
      isWhitelisted: false,
    };

    followingMap.set(norm, account);
  }

  // Calculate stats & not following back
  let notFollowingBackCount = 0;
  let mutualCount = 0;
  const accounts: InstagramAccount[] = [];

  if (followingMap.size > 0 && followersSet.size > 0) {
    for (const [norm, account] of followingMap.entries()) {
      const followsBack = followersSet.has(norm);
      if (followsBack) {
        mutualCount++;
      } else {
        notFollowingBackCount++;
        accounts.push(account);
      }
    }
  } else if (followingMap.size > 0 && followersSet.size === 0) {
    warnings.push(
      'O arquivo de seguidores não foi detectado. Todas as contas seguidas estão sendo exibidas. Adicione o arquivo de seguidores para filtrar automaticamente quem não te segue de volta.'
    );
    for (const account of followingMap.values()) {
      accounts.push(account);
    }
    notFollowingBackCount = accounts.length;
  } else if (followingMap.size === 0 && followersSet.size > 0) {
    errors.push(
      `Identificamos ${followersSet.size} seguidores, mas nenhuma lista de contas seguidas ("following.html" ou "following.json"). Por favor, adicione o arquivo de quem você segue para realizar a comparação.`
    );
  }

  let followersNotFollowedBackCount = 0;
  for (const follower of followersSet) {
    if (!followingMap.has(follower)) {
      followersNotFollowedBackCount++;
    }
  }

  if (followingMap.size === 0 && followersSet.size === 0) {
    errors.push('Nenhuma conta foi identificada no arquivo enviado. Verifique se o arquivo corresponde à exportação oficial do Instagram.');
  }

  const report: ImportAuditReport = {
    fileName,
    importedAt: Date.now(),
    totalFollowing: followingMap.size,
    totalFollowers: followersSet.size,
    notFollowingBackCount,
    mutualCount,
    followersNotFollowedBackCount,
    duplicateCount,
    filesScanned,
    warnings,
    errors,
  };

  return {
    accounts,
    report,
  };
}
