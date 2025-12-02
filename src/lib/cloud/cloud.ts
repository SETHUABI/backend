// File: src/lib/cloud/cloud.ts
// Base helpers for communicating with Google Apps Script Web App

const API_URL = "https://script.google.com/macros/s/AKfycbxYqEe6xYNArVayPU44CZm9Ir_wp7lVef2HxdQxTlPuzi12oaqyyburHTv-eBkprOAcJw/exec";

export async function getFromCloud(action: string) {
  const url = `${API_URL}?action=${encodeURIComponent(action)}`;
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) throw new Error(`Cloud GET failed: ${res.status}`);
  return await res.json();
}

export async function postToCloud(payload: any) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Cloud POST failed: ${res.status}`);
  return await res.json();
}

// Convenience wrappers
export async function loadCloudBills() {
  return await getFromCloud('listBills');
}

export async function loadCloudMenu() {
  return await getFromCloud('listMenu');
}

export async function loadCloudSettings() {
  return await getFromCloud('getSettings');
}

export async function pushBillToCloud(bill: any) {
  return await postToCloud({ action: 'addBill', bill });
}

export async function pushMenuItemToCloud(item: any) {
  return await postToCloud({ action: 'addMenu', item });
}

export async function pushSettingsToCloud(settings: any) {
  return await postToCloud({ action: 'saveSettings', settings });
}

export async function pushFullSync(data: { bills: any[]; menu: any[]; settings: any }) {
  return await postToCloud({ action: 'syncAll', ...data });
}

// End of cloud.ts


// File: src/lib/cloud/cloud-bills.ts
import {
  getAllBills,
  getUnsyncedBills,
  updateBill,
  createBill,
  deleteBill,
} from '@/lib/db';
import { pushBillToCloud, loadCloudBills } from './cloud';

/**
 * Push a single bill to Google Sheets and mark synced locally.
 */
export async function syncSingleBill(bill: any) {
  try {
    await pushBillToCloud(bill);
    // mark synced locally
    const updated = { ...bill, syncedToCloud: 1 };
    await updateBill(updated);
    return { ok: true };
  } catch (err) {
    console.error('syncSingleBill error', err);
    return { ok: false, error: err };
  }
}

/**
 * Push all unsynced bills to cloud.
 */
export async function syncUnsyncedBills() {
  const unsynced = await getUnsyncedBills();
  const results = [];
  for (const b of unsynced) {
    const r = await syncSingleBill(b);
    results.push({ id: b.id, ...r });
  }
  return results;
}

/**
 * Replace local bills with cloud bills (overwrite mode).
 * This will: upsert cloud bills locally and delete local bills not present in cloud.
 */
export async function overwriteLocalBillsFromCloud() {
  const cloudBills = await loadCloudBills();
  if (!Array.isArray(cloudBills)) return { ok: false, error: 'invalid cloud bills' };

  const local = await getAllBills();
  const localIds = new Set(local.map((x: any) => x.id));
  const cloudIds = new Set(cloudBills.map((x: any) => x.id));

  // Upsert cloud bills locally
  for (const cb of cloudBills) {
    // ensure synced flag
    const billLocal = { ...cb, syncedToCloud: 1 };
    await createBill(billLocal).catch(async (e) => {
      // if add fails because exists, fallback to update
      await updateBill(billLocal);
    });
  }

  // Delete local bills not on cloud
  for (const l of local) {
    if (!cloudIds.has(l.id)) {
      await deleteBill(l.id).catch(() => {});
    }
  }

  return { ok: true };
}

// End of cloud-bills.ts


// File: src/lib/cloud/cloud-menu.ts
import {
  getAllMenuItems,
  updateMenuItem,
  createMenuItem,
  deleteMenuItem,
} from '@/lib/db';
import { loadCloudMenu, pushMenuItemToCloud } from './cloud';

export async function overwriteLocalMenuFromCloud() {
  const cloudMenu = await loadCloudMenu();
  if (!Array.isArray(cloudMenu)) return { ok: false, error: 'invalid cloud menu' };

  const local = await getAllMenuItems();
  const localIds = new Set(local.map((x: any) => x.id));
  const cloudIds = new Set(cloudMenu.map((x: any) => x.id));

  // Upsert cloud menu locally
  for (const mi of cloudMenu) {
    const itemLocal = {
      ...mi,
      isAvailable: !!mi.isAvailable,
    };
    await createMenuItem(itemLocal).catch(async () => {
      await updateMenuItem(itemLocal);
    });
  }

  // Delete local menu items not on cloud
  for (const l of local) {
    if (!cloudIds.has(l.id)) {
      await deleteMenuItem(l.id).catch(() => {});
    }
  }

  return { ok: true };
}

export async function pushMenuItem(item: any) {
  try {
    const res = await pushMenuItemToCloud(item);
    return res;
  } catch (err) {
    console.error('pushMenuItem', err);
    throw err;
  }
}

// End of cloud-menu.ts


// File: src/lib/cloud/cloud-settings.ts
import { getSettings, saveSettings } from '@/lib/db';
import { loadCloudSettings, pushSettingsToCloud } from './cloud';

export async function overwriteLocalSettingsFromCloud() {
  const cloud = await loadCloudSettings();
  if (!cloud) return { ok: false, error: 'no settings in cloud' };

  // ensure id for local storage
  const localSettings = { ...cloud, id: 'settings-1' };
  await saveSettings(localSettings as any);
  return { ok: true };
}

export async function pushLocalSettingsToCloud() {
  const local = await getSettings();
  if (!local) return { ok: false, error: 'no local settings' };
  await pushSettingsToCloud(local);
  return { ok: true };
}

// End of cloud-settings.ts


// File: src/lib/cloud/cloud-load.ts
import { overwriteLocalBillsFromCloud } from './cloud-bills';
import { overwriteLocalMenuFromCloud } from './cloud-menu';
import { overwriteLocalSettingsFromCloud } from './cloud-settings';

/**
 * Load everything from cloud and overwrite local data stores.
 */
export async function loadAllFromCloudAndOverwriteLocal() {
  // Bills
  await overwriteLocalBillsFromCloud();
  // Menu
  await overwriteLocalMenuFromCloud();
  // Settings
  await overwriteLocalSettingsFromCloud();
  return { ok: true };
}

// End of cloud-load.ts


// File: src/lib/cloud/cloud-auto.ts
import { syncUnsyncedBills } from './cloud-bills';
import { pushLocalSettingsToCloud } from './cloud-settings';
import { overwriteLocalMenuFromCloud } from './cloud-menu';
import { pushFullSync } from './cloud';
import { getAllBills, getAllMenuItems, getSettings } from '@/lib/db';

let autoSyncTimer: number | null = null;

/**
 * Start auto-sync every intervalMs milliseconds. Default 10 minutes.
 */
export function startAutoSync(intervalMs = 10 * 60 * 1000) {
  stopAutoSync();
  autoSyncTimer = window.setInterval(async () => {
    try {
      // First push unsynced bills
      await syncUnsyncedBills();

      // Also push settings
      await pushLocalSettingsToCloud();

      // Optionally perform full push of everything (lightweight: can be commented out)
      // const bills = await getAllBills();
      // const menu = await getAllMenuItems();
      // const settings = await getSettings();
      // await pushFullSync({ bills, menu, settings });
    } catch (err) {
      console.error('auto-sync error', err);
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
  return autoSyncTimer != null;
}

// End of cloud-auto.ts


// File: src/lib/cloud/README.md
/*
  Installation notes:

  1. Copy these files into your repo under src/lib/cloud/.
  2. Ensure existing db.ts exports/imports used above are available:
     - getAllBills, getUnsyncedBills, updateBill, createBill, deleteBill
     - getAllMenuItems, updateMenuItem, createMenuItem, deleteMenuItem
     - getSettings, saveSettings
  3. Settings integration:
     - Add a "Sync Now" button in your Settings.tsx that calls
       import { loadAllFromCloudAndOverwriteLocal, pushFullSync } from '@/lib/cloud/cloud-load'
       and
       import { getAllBills, getAllMenuItems, getSettings } from '@/lib/db'
       Then call:
         const data = { bills: await getAllBills(), menu: await getAllMenuItems(), settings: await getSettings() };
         await pushFullSync(data);
       For loading from cloud and overwriting locally:
         await loadAllFromCloudAndOverwriteLocal();
  4. Billing integration:
     - After creating a bill locally, call syncSingleBill(bill) from '@/lib/cloud/cloud-bills' if settings.autoSync is true.
  5. Auto-sync:
     - Call startAutoSync() when user enables auto-sync (and stopAutoSync() if disabled).

*/
