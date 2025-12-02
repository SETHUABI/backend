// File: src/lib/cloud/cloud-settings.ts

import { getSettings, saveSettings } from "@/lib/db";
import { loadCloudSettings, pushSettingsToCloud } from "./cloud";

export async function overwriteLocalSettingsFromCloud() {
  const cloud = await loadCloudSettings();
  if (!cloud) return { ok: false, error: "No settings found in cloud" };

  await saveSettings({ ...cloud, id: "settings-1" } as any);

  return { ok: true };
}

export async function pushLocalSettingsToCloud() {
  const local = await getSettings();
  if (!local) return { ok: false, error: "No local settings" };

  await pushSettingsToCloud(local);
  return { ok: true };
}
