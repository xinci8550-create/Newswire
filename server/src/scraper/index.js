import { runScrapeCycle } from './worker.js';
import config from '../config.js';

let timer = null;
let running = false;

/**
 * Trigger one scrape cycle, guarding against overlapping runs.
 * Returns the summary. Used by the scheduler and the external /api/cron/trigger.
 */
export async function triggerScrape() {
  if (running) {
    return { skipped: true, reason: 'already-running' };
  }
  running = true;
  try {
    const summary = await runScrapeCycle();
    return summary;
  } finally {
    running = false;
  }
}

/** Start the in-process scheduler (an initial run + periodic runs). */
export function startScheduler() {
  if (!config.scrape.enableInProcessCron) {
    console.log('[scheduler] disabled (ENABLE_IN_PROCESS_CRON=false)');
    return;
  }
  const intervalMs = config.scrape.intervalMinutes * 60 * 1000;
  // First run shortly after boot.
  setTimeout(() => {
    triggerScrape()
      .then((s) => console.log('[scheduler] initial scrape done:', summarize(s)))
      .catch((e) => console.error('[scheduler] initial scrape failed', e));
  }, 5000);

  timer = setInterval(() => {
    triggerScrape()
      .then((s) => console.log(`[scheduler] periodic scrape done:`, summarize(s)))
      .catch((e) => console.error('[scheduler] periodic scrape failed', e));
  }, intervalMs);
  console.log(`[scheduler] started: every ${config.scrape.intervalMinutes} min`);
}

export function stopScheduler() {
  if (timer) clearInterval(timer);
  timer = null;
}

function summarize(s) {
  if (s && s.skipped) return `skipped (${s.reason})`;
  return `fetched=${s.totalFetched} inserted=${s.totalInserted} dup=${s.totalDuplicates} errors=${s.errors.length}`;
}
