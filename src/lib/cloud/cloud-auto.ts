// File: src/lib/cloud/cloud-auto.ts

import { syncUnsyncedBills } from "./cloud-bills";
import { pushLocalSettingsToCloud } from "./cloud-settings";

let autoSyncTimer: number | null = null;

/**
 * Auto-sync every intervalMs (default = 10 minutes)
 */
export function startAutoSync(intervalMs = 10 * 60 * 1000) {
  stopAutoSync();

  autoSyncTimer = window.setInterval(async () => {
    try {
      await syncUnsyncedBills();
      await pushLocalSettingsToCloud();
    } catch (err) {
      console.error("AUTO SYNC ERROR:", err);
    }
  }, intervalMs);
}

export function stopAutoSync() {
  if (autoSyncTimer) {
    clearInterval(autoSyncTimer);
    autoSyncTimer = null;
  }
}

export function isAutoSyncRunning() {
  return autoSyncTimer !== null;
}
