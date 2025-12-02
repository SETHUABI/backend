// Download all data from Google Sheets and overwrite local IndexedDB

import { saveSettings, createMenuItem, createBill } from "@/lib/db";

export async function loadAllFromCloudAndOverwriteLocal(url?: string) {
  if (!url) return;

  const res = await fetch(url + "?action=LOAD_ALL");
  const data = await res.json();

  // Overwrite local Settings
  if (data.settings) {
    await saveSettings({ ...data.settings, id: "settings-1" });
  }

  // Overwrite Menu
  if (data.menu && Array.isArray(data.menu)) {
    for (const item of data.menu) {
      await createMenuItem(item);
    }
  }

  // Overwrite Bills
  if (data.bills && Array.isArray(data.bills)) {
    for (const b of data.bills) {
      await createBill(b);
    }
  }

  return true;
}
