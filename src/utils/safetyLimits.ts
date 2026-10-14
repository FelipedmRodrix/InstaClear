import { ReviewSession } from '../types/instagram';

export function getStartOfHour(timestamp: number): number {
  const d = new Date(timestamp);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours());
}

export function getTodayKey(timestamp: number): string {
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizeSession(session: ReviewSession): ReviewSession {
  const now = Date.now();
  const hourStart = getStartOfHour(now);
  const todayKey = getTodayKey(now);

  let unfollowsThisHour = session.unfollowsThisHour ?? 0;
  let unfollowsToday = session.unfollowsToday ?? 0;
  let hourBucketStart = session.hourBucketStart ?? now;
  let dayBucket = session.dayBucket ?? todayKey;

  if (hourBucketStart < hourStart) {
    unfollowsThisHour = 0;
    hourBucketStart = hourStart;
  }

  if (dayBucket !== todayKey) {
    unfollowsToday = 0;
    dayBucket = todayKey;
  }

  return {
    ...session,
    unfollowsThisHour,
    unfollowsToday,
    hourBucketStart,
    dayBucket,
  };
}
