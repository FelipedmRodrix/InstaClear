/**
 * Types and interfaces for InstaClean - Instagram Assisted Unfollow Application
 */

export type ReviewStatus = 'pending' | 'in_review' | 'completed' | 'kept' | 'ignored' | 'error';

export interface InstagramAccount {
  id: string; // normalized username
  username: string; // original username
  displayName?: string;
  profileUrl: string;
  followedAt?: number; // epoch timestamp in ms if available in export
  avatarUrl?: string; // only if available from authorized source, otherwise undefined
  bio?: string; // profile biography if available from data export
  status: ReviewStatus;
  statusUpdatedAt?: number;
  notes?: string;
  isWhitelisted?: boolean; // Protect from unfollow
}

export interface ImportAuditReport {
  fileName: string;
  importedAt: number;
  totalFollowing: number;
  totalFollowers: number;
  notFollowingBackCount: number;
  mutualCount: number;
  followersNotFollowedBackCount: number;
  duplicateCount: number;
  filesScanned: string[];
  warnings: string[];
  errors: string[];
}

export interface ReviewSession {
  startedAt: number;
  completedThisSession: number;
  hourlySafetyLimit: number; // default 15-20
  dailySafetyLimit: number; // default 100-150
  lastActionTimestamp?: number;
  unfollowsThisHour: number;
  unfollowsToday: number;
  hourBucketStart: number; // epoch ms of the start of the current hour bucket
  dayBucket: string; // YYYY-MM-DD string for the current day
}

export interface ActionHistoryEntry {
  id: string;
  timestamp: number;
  username: string;
  previousStatus: ReviewStatus;
  newStatus: ReviewStatus;
  actionDescription: string;
}

export type ViewMode = 'cards' | 'table';

export type SortField = 'username' | 'followedAt' | 'status';
export type SortDirection = 'asc' | 'desc';

export interface FilterOptions {
  search: string;
  status: ReviewStatus | 'all';
  onlyNonFollowers: boolean;
  sortField: SortField;
  sortDirection: SortDirection;
}
