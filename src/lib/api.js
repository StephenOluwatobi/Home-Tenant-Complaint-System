import { fileToDataUrl } from "./validation.js";
import { ANNOUNCEMENT_LOAD_ERROR } from "./announcementOptions.js";

export const UNITS = [1, 2, 3, 4, 5];
export { CATEGORIES, STATUSES } from "./complaintOptions.js";

const TENANTS_KEY = "tcms.tenants.v1";
const MGMT_SETTINGS_KEY = "tcms.mgmt.settings.v1";

// --- Property Settings & Management Password ---
async function settingsRequest(options, fallbackMessage) {
  let response;
  try {
    response = await fetch("/api/settings", options);
  } catch {
    throw new Error(fallbackMessage);
  }
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.message || fallbackMessage);
  return result;
}

export function getPropertySettings({ signal } = {}) {
  return settingsRequest({ signal }, "Unable to load property settings. Please try again.");
}

export function updateManagementProfile(profile) {
  return settingsRequest({
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  }, "Unable to save the property settings. Please try again.");
}

export function changeManagementPassword(passwords) {
  return settingsRequest({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(passwords),
  }, "Unable to change the management password. Please try again.");
}

// --- Tenant Provisioning (Landlord Managed) ---
async function tenantRequest(path, options) {
  let response;
  try {
    response = await fetch(path, options);
  } catch {
    throw new Error("Unable to complete the tenant action. Please try again.");
  }
  const result = await response.json();
  if (!response.ok) throw new Error(result?.message || "Unable to complete the tenant action. Please try again.");
  return result;
}

export function listTenants({ signal } = {}) {
  return tenantRequest("/api/tenants", { signal });
}

export function upsertTenant(details) {
  return tenantRequest("/api/tenants", {
    method: details.occupancyId ? "PATCH" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(details),
  });
}

export function removeTenant(tenant) {
  const query = new URLSearchParams({ unit: tenant.unit, occupancyId: tenant.id });
  return tenantRequest(`/api/tenants?${query}`, { method: "DELETE" });
}

export function clearLegacyCredentials() {
  try {
    localStorage.removeItem("tcms.session.v1");
    localStorage.removeItem(TENANTS_KEY);
    localStorage.removeItem(MGMT_SETTINGS_KEY);
  } catch {
    // Browser storage may be unavailable or contain invalid demo data.
  }

}

// --- Complaints ---
export const COMPLAINT_LOAD_ERROR = "Unable to load complaints. Please try again.";

export async function listComplaints({ signal, status } = {}) {
  const path = status ? `/api/complaints?status=${encodeURIComponent(status)}` : "/api/complaints";
  const response = await fetch(path, { signal });
  if (!response.ok) throw new Error(COMPLAINT_LOAD_ERROR);
  return response.json();
}

export async function getComplaint(id, { signal } = {}) {
  const response = await fetch(`/api/complaints?id=${encodeURIComponent(id)}`, { signal });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(COMPLAINT_LOAD_ERROR);
  return response.json();
}

export async function addComplaint({ category, description, file, submissionId }) {
  const attachment = file ? {
    photo: (await fileToDataUrl(file)).split(",", 2)[1],
    submissionId,
  } : {};
  let response;
  try {
    response = await fetch("/api/complaints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, description, ...attachment }),
    });
  } catch {
    throw new Error("Unable to submit the complaint. Please try again.");
  }
  if (response.status === 401 || response.status === 403) {
    throw new Error("Sign in to an active tenant account to submit a complaint.");
  }
  if (file && (response.status === 413 || response.status === 422)) {
    const message = response.status === 413
      ? "The photo is larger than 2 MB. Choose a smaller one."
      : "Attach an image file (JPG, PNG or WebP).";
    throw Object.assign(new Error(message), { field: "photo" });
  }
  if (!response.ok) throw new Error("Unable to submit the complaint. Please try again.");
  return response.json();
}

export async function updateComplaint(id, patch, { signal } = {}) {
  const response = await fetch(`/api/complaints?id=${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
    signal,
  });
  if (!response.ok) throw new Error("Unable to save the changes. Please try again.");
  return response.json();
}

// --- Announcements ---
async function announcementRequest(path, options, errorMessage) {
  try {
    const response = await fetch(path, options);
    if (response.ok) return await response.json();
  } catch {
    // Use the same form feedback for network failures and failed API responses.
  }
  throw new Error(errorMessage);
}

export function listAnnouncements({ signal } = {}) {
  return announcementRequest("/api/announcements", { signal }, ANNOUNCEMENT_LOAD_ERROR);
}

export function addAnnouncement(notice) {
  return announcementRequest("/api/announcements", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(notice),
  }, "Unable to confirm that the announcement was published. Please try again.");
}

export function deleteAnnouncement(id) {
  return announcementRequest(`/api/announcements?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  }, "Unable to confirm that the announcement was deleted. Please try again.");
}
