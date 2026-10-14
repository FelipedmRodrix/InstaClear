import { InstagramAccount, ImportAuditReport, ActionHistoryEntry, ReviewSession, ReviewStatus } from '../types/instagram';
import { normalizeSession, getStartOfHour, getTodayKey } from '../utils/safetyLimits';

const STORAGE_KEYS = {
  ACCOUNTS: 'instaclean_accounts_v1',
  REPORT: 'instaclean_report_v1',
  HISTORY: 'instaclean_history_v1',
  SESSION: 'instaclean_session_v1',
  DARK_MODE: 'instaclean_darkmode_v1',
};

export function loadSavedAccounts(): InstagramAccount[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load accounts from storage:', err);
    return null;
  }
}

export function saveAccounts(accounts: InstagramAccount[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  } catch (err) {
    console.error('Failed to save accounts to storage:', err);
  }
}

export function loadSavedReport(): ImportAuditReport | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REPORT);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load report from storage:', err);
    return null;
  }
}

export function saveReport(report: ImportAuditReport): void {
  try {
    localStorage.setItem(STORAGE_KEYS.REPORT, JSON.stringify(report));
  } catch (err) {
    console.error('Failed to save report to storage:', err);
  }
}

export function loadActionHistory(): ActionHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load history from storage:', err);
    return [];
  }
}

export function saveActionHistory(history: ActionHistoryEntry[]): void {
  try {
    // Keep last 150 entries
    const trimmed = history.slice(-150);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(trimmed));
  } catch (err) {
    console.error('Failed to save history to storage:', err);
  }
}

export function loadReviewSession(): ReviewSession {
  const now = Date.now();
  const defaultSession: ReviewSession = {
    startedAt: now,
    completedThisSession: 0,
    hourlySafetyLimit: 15,
    dailySafetyLimit: 100,
    unfollowsThisHour: 0,
    unfollowsToday: 0,
    hourBucketStart: getStartOfHour(now),
    dayBucket: getTodayKey(now),
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!raw) return defaultSession;
    const parsed = JSON.parse(raw);
    const merged = { ...defaultSession, ...parsed };
    return normalizeSession(merged);
  } catch (err) {
    return defaultSession;
  }
}

export function saveReviewSession(session: ReviewSession): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  } catch (err) {
    console.error('Failed to save session to storage:', err);
  }
}

export function clearAllLocalData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.ACCOUNTS);
    localStorage.removeItem(STORAGE_KEYS.REPORT);
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  } catch (err) {
    console.error('Failed to clear storage:', err);
  }
}
