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

  // Strip leading @, trailing slashes, query parameters
  cleaned = cleaned.replace(/^@/, '').split('/')[0].split('?')[0].trim();
  const lower = cleaned.toLowerCase();
  if (RESERVED_WORDS.has(lower) || lower.length === 0) {
    return '';
  }
  return lower;
}

/**
 * Parses dates commonly formatted in Instagram HTML exports
 */
function parseInstagramDate(text: string): number | undefined {
  if (!text) return undefined;
  const match = text.match(/(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\s+(\d{1,2}),\s+(\d{4})/i);
  if (!match) return undefined;

  const monthMap: Record<string, number> = {
    jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5,
    jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11,
  };

  const m = monthMap[match[1].toLowerCase()];
  const d = parseInt(match[2], 10);
  const y = parseInt(match[3], 10);
  if (m === undefined || isNaN(d) || isNaN(y)) return undefined;

  let hour = 12;
  let min = 0;
  const timeMatch = text.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    hour = parseInt(timeMatch[1], 10);
    min = parseInt(timeMatch[2], 10);
    if (text.includes('tarde') || text.includes('noite')) {
      if (hour < 12) hour += 12;
    } else if (text.includes('manh') || text.includes('madrugada')) {
      if (hour === 12) hour = 0;
    }
  }

  return new Date(y, m, d, hour, min).getTime();
}

/**
 * Extracts account items from parsed JSON object/array
 */
function extractAccountsFromJson(data: any): RawAccountItem[] {
  const results: RawAccountItem[] = [];
  if (!data) return results;

  if (Array.isArray(data)) {
    for (const item of data) {
      if (item && item.string_list_data && Array.isArray(item.string_list_data)) {
        for (const sld of item.string_list_data) {
          const val = sld.value || item.title;
          const norm = normalizeUsername(val);
          if (norm) {
            results.push({
              username: norm,
              displayName: item.title || norm,
              href: sld.href || `https://www.instagram.com/${norm}/`,
              timestamp: sld.timestamp ? sld.timestamp * 1000 : undefined,
            });
          }
        }
      } else if (item && typeof item === 'object') {
        const username = item.username || item.value || item.title;
        const norm = normalizeUsername(username);
        if (norm) {
          results.push({
            username: norm,
            displayName: item.title || norm,
            href: item.href || `https://www.instagram.com/${norm}/`,
            timestamp: item.timestamp ? item.timestamp * 1000 : undefined,
          });
        }
      }
    }
    return results;
  }

  if (data.relationships_followers && Array.isArray(data.relationships_followers)) {
    for (const item of data.relationships_followers) {
      if (item && item.string_list_data && Array.isArray(item.string_list_data)) {
        for (const sld of item.string_list_data) {
          const val = sld.value || item.title;
          const norm = normalizeUsername(val);
          if (norm) {
            results.push({
              username: norm,
              displayName: item.title || norm,
              href: sld.href || `https://www.instagram.com/${norm}/`,
              timestamp: sld.timestamp ? sld.timestamp * 1000 : undefined,
            });
          }
        }
      } else if (item && item.title) {
        const norm = normalizeUsername(item.title);
        if (norm) {
          results.push({ username: norm, displayName: item.title });
        }
      }
    }
    return results;
  }

  if (data.relationships_following && Array.isArray(data.relationships_following)) {
    for (const item of data.relationships_following) {
      if (item && item.string_list_data && Array.isArray(item.string_list_data)) {
        for (const sld of item.string_list_data) {
          const val = sld.value || item.title;
          const norm = normalizeUsername(val);
          if (norm) {
            results.push({
              username: norm,
              displayName: item.title || norm,
              href: sld.href || `https://www.instagram.com/${norm}/`,
              timestamp: sld.timestamp ? sld.timestamp * 1000 : undefined,
            });
          }
        }
      } else if (item && item.title) {
        const norm = normalizeUsername(item.title);
        if (norm) {
          results.push({ username: norm, displayName: item.title });
        }
      }
    }
    return results;
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
          results.push({
            username: norm,
            displayName: node.title && !node.title.includes('http') ? node.title : norm,
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
 */
export function extractAccountsFromHtml(htmlContent: string): RawAccountItem[] {
  const results: RawAccountItem[] = [];
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    const blocks = doc.querySelectorAll('div.pam, div._a6-g, div._a6-p');
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
        }

        const cells = block.querySelectorAll('td');
        for (let i = 0; i < cells.length; i++) {
          const label = cells[i].textContent?.trim().toLowerCase() || '';
          if (label.includes('nome de usu') && i + 1 < cells.length) {
            const val = cells[i + 1].textContent?.trim() || '';
            const norm = normalizeUsername(val);
            if (norm) {
              username = norm;
            }
          }
          if (label === 'nome' && i + 1 < cells.length && !displayName) {
            displayName = cells[i + 1].textContent?.trim() || '';
          }
        }

        const blockText = block.textContent || '';
        timestamp = parseInstagramDate(blockText);

        if (username && !RESERVED_WORDS.has(username)) {
          results.push({
            username,
            displayName: displayName || username,
            href: href || `https://www.instagram.com/${username}/`,
            timestamp,
          });
        }
      });
    }

    if (results.length === 0) {
      const links = doc.querySelectorAll('a[href*="instagram.com"]');
      links.forEach((link) => {
        const href = link.getAttribute('href') || '';
        const text = link.textContent?.trim() || '';
        const norm = normalizeUsername(text) || normalizeUsername(href);
        if (norm && !RESERVED_WORDS.has(norm)) {
          const parentText = link.closest('div')?.textContent || '';
          const timestamp = parseInstagramDate(parentText);
          results.push({
            username: norm,
            displayName: norm,
            href: href || `https://www.instagram.com/${norm}/`,
            timestamp,
          });
        }
      });
    }
  } catch (err) {
    console.error('Error parsing HTML export content:', err);
  }

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

/**
 * Parse an Instagram ZIP archive with strict file filtering
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

  const zipFiles = Object.keys(zipContent.files);

  const dataFiles = zipFiles.filter((path) => {
    const lower = path.toLowerCase();
    if (zipContent.files[path].dir) return false;
    if (lower.includes('hashtag') || lower.includes('recently_unfollowed') || lower.includes('pending') || lower.includes('blocked') || lower.includes('restricted')) {
      return false;
    }
    return lower.endsWith('.json') || lower.endsWith('.html');
  });

  let followingFileCandidates = dataFiles.filter((path) => path.toLowerCase().includes('following'));
  let followerFileCandidates = dataFiles.filter((path) => {
    const lower = path.toLowerCase();
    return lower.includes('follower') || lower.includes('followers') || lower.includes('seguidor');
  });

  if (followingFileCandidates.length === 0 && dataFiles.length > 0) {
    followingFileCandidates.push(dataFiles[0]);
  }
  if (followerFileCandidates.length === 0 && dataFiles.length > 1) {
    const remaining = dataFiles.filter((p) => !followingFileCandidates.includes(p));
    if (remaining.length > 0) {
      followerFileCandidates.push(remaining[0]);
    } else {
      followerFileCandidates.push(dataFiles[1]);
    }
  }

  let processed = 0;
  const totalFilesToProcess = followingFileCandidates.length + followerFileCandidates.length;

  for (const path of followingFileCandidates) {
    if (filesScanned.includes(path)) continue; // avoid duplicates
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
    if (filesScanned.includes(path)) continue; // avoid duplicates
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

  onProgress?.(85, 'Comparando listas e calculando contas que não seguem de volta...');

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

  // Set of followers (normalized username)
  const followersSet = new Set<string>();
  for (const item of followersItems) {
    const norm = normalizeUsername(item.username);
    if (norm) {
      followersSet.add(norm);
    }
  }

  // Map of following accounts (normalized username -> account details)
  const followingMap = new Map<string, InstagramAccount>();
  let duplicateCount = 0;

  for (const item of followingItems) {
    const norm = normalizeUsername(item.username);
    if (!norm) continue;

    if (followingMap.has(norm)) {
      duplicateCount++;
      continue;
    }

    const cleanUsername = item.username.trim().replace(/^@/, '');
    const account: InstagramAccount = {
      id: norm,
      username: cleanUsername,
      displayName: item.displayName || cleanUsername,
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
      `O arquivo de seguidores não foi detectado. Todas as contas seguidas estão sendo exibidas. Adicione o arquivo de seguidores para filtrar automaticamente quem não te segue de volta.`
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
    errors.push('Nenhuma conta foi identificada no arquivo enviado. Verifique se o arquivo corresponde à exportação do Instagram.');
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
