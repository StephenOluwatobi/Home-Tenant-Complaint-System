import {
  createAuthorizedRequester, createSupabaseConnection, readBody, reply, sameOrigin, saveCookies,
} from "../server/supabase.js";

const MANAGEMENT_COLUMNS = "admin_name,admin_email,property_name,property_address,contact_phone,updated_at";
const SETTINGS_ERROR = "Unable to load property settings. Please try again.";
const PROFILE_ERROR = "Unable to save the property settings. Please try again.";
const PASSWORD_ERROR = "Unable to change the management password. Please try again.";
const WRONG_PASSWORD = "Current management password is incorrect.";

class SettingsError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function readResponse(response) {
  if (!response || response.status === 401) throw new SettingsError(401, "Please sign in again.");
  if (response.status === 403) throw new SettingsError(403, "Management access is required.");
  if (!response.ok) throw new Error("Settings request failed");
  return response.json();
}

const formatProperty = (row) => ({
  propertyName: row.property_name,
  propertyAddress: row.property_address,
});
const formatManagement = (row) => ({
  ...formatProperty(row),
  adminName: row.admin_name,
  adminEmail: row.admin_email,
  contactPhone: row.contact_phone,
  updatedAt: row.updated_at,
});
const trimField = (value) => typeof value === "string" ? value.trim() : "";

function readProfile(body) {
  const adminName = trimField(body?.adminName);
  const adminEmail = trimField(body?.adminEmail).toLowerCase();
  const propertyName = trimField(body?.propertyName);
  if ([...adminName].length < 2) throw new SettingsError(400, "Enter an administrator or landlord name.");
  if (adminEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
    throw new SettingsError(400, "Enter a valid Gmail or email address.");
  }
  if ([...propertyName].length < 2) throw new SettingsError(400, "Enter the property or holdings name.");
  return {
    p_admin_name: adminName,
    p_admin_email: adminEmail,
    p_property_name: propertyName,
    p_property_address: trimField(body.propertyAddress),
    p_contact_phone: trimField(body.contactPhone),
  };
}

async function updatePassword(body, authorized, request, res) {
  const current = trimField(body?.currentPassword);
  const next = trimField(body?.newPassword);
  if (!current) throw new SettingsError(400, WRONG_PASSWORD);
  if ([...next].length < 6) throw new SettingsError(400, "New password must be at least 6 characters long.");
  if (next !== trimField(body?.confirmPassword)) {
    throw new SettingsError(400, "New password and confirmation do not match.");
  }
  if (next === current) throw new SettingsError(400, "New password must be different from your current password.");
  if (Buffer.byteLength(next, "utf8") > 72) throw new SettingsError(400, "Choose a shorter password.");

  const account = await readResponse(await authorized("/auth/v1/user"));
  if (!account?.email) throw new Error("Management Auth account has no email identifier");
  const verification = await request("/auth/v1/token?grant_type=password", {
    body: { email: account.email, password: current },
  });
  if ([400, 401].includes(verification.status)) throw new SettingsError(400, WRONG_PASSWORD);
  const session = await readResponse(verification);
  if (session?.user?.id !== account.id || !session.access_token || !session.refresh_token ||
      !Number.isFinite(session.expires_in)) throw new Error("Could not reauthenticate the same account");

  try {
    const result = await request("/auth/v1/user", {
      method: "PUT",
      body: { password: next, current_password: current },
      token: session.access_token,
    });
    if (!result.ok) {
      const { code, error_code: errorCode } = await result.json().catch(() => ({}));
      if ([code, errorCode].includes("weak_password")) {
        throw new SettingsError(422, "Choose a stronger management password.");
      }
      throw new Error("Supabase rejected the password update");
    }
    saveCookies(res, session);
  } catch (error) {
    await request("/auth/v1/logout?scope=local", { body: {}, token: session.access_token }).catch(() => null);
    throw error;
  }
}

export function createSettingsHandler(env) {
  const { configured, request } = createSupabaseConnection(env);
  return async function settings(req, res) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", "application/json");
    try {
      if (!sameOrigin(req)) return reply(res, 403, { message: "Management access is required." });
      if (!["GET", "PATCH", "POST"].includes(req.method)) {
        res.setHeader("Allow", "GET, PATCH, POST");
        return reply(res, 405, null);
      }
      if (!configured) throw new Error("Settings are unavailable");
      const authorized = createAuthorizedRequester(req, res, request);
      const rpc = (name, body) => authorized(`/rest/v1/rpc/${name}`, body).then(readResponse);
      const access = await rpc("get_portal_access", {});

      if (req.method === "GET" && access?.role === "tenant") {
        const property = await rpc("get_resident_property_settings", {});
        return property ? reply(res, 200, formatProperty(property)) : reply(res, 403, null);
      }
      if (access?.role !== "management") throw new SettingsError(403, "Management access is required.");

      if (req.method === "GET") {
        const [row] = await readResponse(await authorized(`/rest/v1/property_settings?select=${MANAGEMENT_COLUMNS}&limit=1`));
        if (!row) throw new Error("Property settings row is missing");
        return reply(res, 200, formatManagement(row));
      }

      const body = await readBody(req).catch(() => null);
      if (req.method === "PATCH") {
        const saved = await rpc("update_property_settings", readProfile(body));
        return reply(res, 200, formatManagement(saved));
      }

      await updatePassword(body, authorized, request, res);
      return reply(res, 200, null);
    } catch (error) {
      if (error instanceof SettingsError) return reply(res, error.status, { message: error.message });
      const message = { GET: SETTINGS_ERROR, PATCH: PROFILE_ERROR, POST: PASSWORD_ERROR }[req.method];
      return reply(res, 503, { message });
    }
  };
}

export default createSettingsHandler(process.env);
