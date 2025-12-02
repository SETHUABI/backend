// File: src/lib/cloud/cloud.ts
// Hard-coded Google Apps Script URL

export const API_URL =
  "https://script.google.com/macros/s/AKfycbxYqEe6xYNArVayPU44CZm9Ir_wp7lVef2HxdQxTlPuzi12oaqyyburHTv-eBkprOAcJw/exec";

// -------------------- HTTP GET --------------------
export async function getFromCloud(action: string) {
  const url = `${API_URL}?action=${encodeURIComponent(action)}`;

  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`Cloud GET failed: ${res.status}`);

  return await res.json();
}

// -------------------- HTTP POST -------------------
export async function postToCloud(payload: any) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Cloud POST failed: ${res.status}`);

  return await res.json();
}

// -------------------- Helpers ---------------------
export async function loadCloudBills() {
  return await getFromCloud("listBills");
}

export async function loadCloudMenu() {
  return await getFromCloud("listMenu");
}

export async function loadCloudSettings() {
  return await getFromCloud("getSettings");
}

export async function pushBillToCloud(bill: any) {
  return await postToCloud({ action: "addBill", bill });
}

export async function pushMenuItemToCloud(item: any) {
  return await postToCloud({ action: "addMenu", item });
}

export async function pushSettingsToCloud(settings: any) {
  return await postToCloud({ action: "saveSettings", settings });
}

export async function pushFullSync(data: {
  bills: any[];
  menu: any[];
  settings: any;
}) {
  return await postToCloud({ action: "syncAll", ...data });
}
