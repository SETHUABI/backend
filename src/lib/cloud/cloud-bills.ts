// File: src/lib/cloud/cloud-bills.ts

import {
  getAllBills,
  getUnsyncedBills,
  updateBill,
  createBill,
  deleteBill,
} from "@/lib/db";

import { pushBillToCloud, loadCloudBills } from "./cloud";

/**
 * Push a single bill to cloud and mark as synced locally.
 */
export async function syncSingleBill(bill: any) {
  try {
    await pushBillToCloud(bill);

    const updated = { ...bill, syncedToCloud: 1 };
    await updateBill(updated);

    return { ok: true };
  } catch (err) {
    console.error("syncSingleBill error", err);
    return { ok: false, error: err };
  }
}

/**
 * Sync all unsynced bills.
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
 * Overwrite local bills with cloud bills.
 */
export async function overwriteLocalBillsFromCloud() {
  const cloudBills = await loadCloudBills();
  if (!Array.isArray(cloudBills))
    return { ok: false, error: "Invalid cloud bills" };

  const localBills = await getAllBills();
  const cloudIds = new Set(cloudBills.map((x: any) => x.id));

  // UPSERT
  for (const cb of cloudBills) {
    const billLocal = { ...cb, syncedToCloud: 1 };

    await createBill(billLocal).catch(async () => {
      await updateBill(billLocal);
    });
  }

  // Delete local bills not in cloud
  for (const lb of localBills) {
    if (!cloudIds.has(lb.id)) {
      await deleteBill(lb.id).catch(() => {});
    }
  }

  return { ok: true };
}
