import { pushFullSync } from "./cloud";
import { getAllBills, getAllMenuItems, getSettings } from "@/lib/db";

let interval: any = null;

export function startAutoSync() {
  stopAutoSync(); // Clear old interval

  interval = setInterval(async () => {
    const settings = await getSettings();
    if (!settings?.googleSheetsUrl) return;

    const [bills, menu] = await Promise.all([
      getAllBills(),
      getAllMenuItems(),
    ]);

    await pushFullSync({
      bills,
      menu,
      settings,
    });

  }, 10 * 60 * 1000); // Every 10 minutes
}

export function stopAutoSync() {
  if (interval) clearInterval(interval);
  interval = null;
}
