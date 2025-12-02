// File: src/lib/cloud/cloud.ts
// Base helpers for communicating with Google Apps Script Web App

// HARD-CODED URL — OPTION 1
export const API_URL =
  "https://script.google.com/macros/s/AKfycbzoC9exO2UzR01KdjU8OzAtQdz58RzA80trFvWZHLUvy9sSlrHgSBAnG13lFTssynuj7g/exec";

export async function getFromCloud(action: string) {
  const url = `${API_URL}?action=${encodeURIComponent(action)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Cloud GET failed: ${res.status} → ${url}`);
  }

  return await res.json();
}

export async function postToCloud(payload: any) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(
      `Cloud POST failed: ${res.status} → ${JSON.stringify(payload)}`
    );
  }

  return await res.json();
}

// ------------ CLOUD ACTION HELPERS -----------------

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
