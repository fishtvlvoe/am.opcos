export function initAnismileCron() {
	// Legacy no-op: AM now uses Vercel cron via /api/cron/sync and @repo/sync/runSync.
	// Keep this export to avoid stale imports accidentally reviving the old partial-sync scheduler.
}
