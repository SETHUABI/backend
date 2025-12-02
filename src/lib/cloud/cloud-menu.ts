// File: src/lib/cloud/cloud-menu.ts

import {
  getAllMenuItems,
  updateMenuItem,
  createMenuItem,
  deleteMenuItem,
} from "@/lib/db";

import { loadCloudMenu, pushMenuItemToCloud } from "./cloud";

/**
 * Overwrite local menu with cloud menu.
 */
export async function overwriteLocalMenuFromCloud() {
  const cloudMenu = await loadCloudMenu();
  if (!Array.isArray(cloudMenu))
    return { ok: false, error: "Invalid cloud menu" };

  const localMenu = await getAllMenuItems();
  const cloudIds = new Set(cloudMenu.map((i: any) => i.id));

  // UPSERT cloud items
  for (const cm of cloudMenu) {
    const itemLocal = {
      ...cm,
      isAvailable: !!cm.isAvailable,
    };

    await createMenuItem(itemLocal).catch(async () => {
      await updateMenuItem(itemLocal);
    });
  }

  // Delete local items missing in cloud
  for (const lm of localMenu) {
    if (!cloudIds.has(lm.id)) {
      await deleteMenuItem(lm.id).catch(() => {});
    }
  }

  return { ok: true };
}

export async function pushMenuItem(item: any) {
  try {
    return await pushMenuItemToCloud(item);
  } catch (err) {
    console.error("pushMenuItem error", err);
    throw err;
  }
}
