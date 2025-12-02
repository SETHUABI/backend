// File: src/lib/cloud/cloud-load.ts

import { overwriteLocalBillsFromCloud } from "./cloud-bills";
import { overwriteLocalMenuFromCloud } from "./cloud-menu";
import { overwriteLocalSettingsFromCloud } from "./cloud-settings";

/**
 * Reload EVERYTHING from cloud and overwrite local IndexedDB.
 */
export async function loadAllFromCloudAndOverwriteLocal() {
  await overwriteLocalBillsFromCloud();
  await overwriteLocalMenuFromCloud();
  await overwriteLocalSettingsFromCloud();

  return { ok: true };
}
