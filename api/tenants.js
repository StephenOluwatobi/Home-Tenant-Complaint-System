import {
  createAuthorizedRequester, createSupabaseAdminConnection, createSupabaseConnection,
  readBody, reply, sameOrigin,
} from "../server/supabase.js";

const UUID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const PROFILE_FIELDS = "id,unit_number,full_name,contact";
const VALID_METHODS = ["GET", "POST", "PATCH", "DELETE"];
const validUnit = (unit) => Number.isInteger(unit) && unit >= 1 && unit <= 5;

class TenantActionError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function formatTenant(row) {
  return {
    id: row.id,
    unit: row.unit_number,
    fullName: row.full_name ?? `Unit ${row.unit_number} Tenant`,
    contact: row.contact,
  };
}

async function data(response) {
  if (!response || response.status === 401) throw new TenantActionError(401, "Sign in as management to continue.");
  if (response.status === 403) throw new TenantActionError(403, "Management access is required.");
  if (response.status === 409) throw new TenantActionError(409, "This unit already has an active tenant.");
  if (!response.ok) throw new Error("Request failed");
  return response.json();
}

function readProfile(body) {
  const { unit, fullName, contact, password } = body ?? {};
  if (!validUnit(unit) || typeof fullName !== "string" || typeof contact !== "string" || typeof password !== "string") {
    throw new TenantActionError(400, "Enter valid tenant details.");
  }
  const name = fullName.trim();
  const address = contact.trim();
  const nextPassword = password.trim();
  if ([...name].length < 2) throw new TenantActionError(400, "Enter the tenant's full name.");
  if ([...name].length > 160 || [...address].length > 160) {
    throw new TenantActionError(400, "Keep the tenant name and contact to 160 characters each.");
  }
  if (nextPassword && [...nextPassword].length < 6) {
    throw new TenantActionError(400, "Password must be at least 6 characters.");
  }
  if (Buffer.byteLength(nextPassword, "utf8") > 72) throw new TenantActionError(400, "Choose a shorter password.");
  return { unit, name, address, nextPassword };
}

async function checkAuthWrite(response) {
  if (response.ok) return;
  const { code, error_code: errorCode } = await response.json().catch(() => ({}));
  if (code === "weak_password" || errorCode === "weak_password") {
    throw new TenantActionError(422, "Choose a stronger tenant password.");
  }
  throw new Error("Auth account could not be saved");
}

export function createTenantsHandler(env) {
  const { configured, request } = createSupabaseConnection(env);
  const { configured: adminConfigured, request: admin } = createSupabaseAdminConnection(env);
  const adminRpc = (name, body) => admin(`/rest/v1/rpc/${name}`, { body }).then(data);

  async function assign(managerId, requestId, profile) {
    const { unit, name, address, nextPassword } = profile;
    const email = `tenant-${unit}-${requestId}@aoh-tenant.example.com`;
    const details = { p_manager: managerId, p_unit: unit, p_request: requestId };
    const find = () => adminRpc("tenant_provisioning_state", { ...details, p_email: email });
    const occupied = () => new TenantActionError(409, "This unit already has an active tenant.");
    const cleanUnassigned = async (state) => {
      if (!state.user_id || state.occupancy_id) return;
      // An occupancy FK also prevents deletion if another retry finished assigning this identity.
      await admin(`/auth/v1/admin/users/${state.user_id}`, { method: "DELETE" }).catch(() => null);
    };

    let state = await find();
    if (state.ended || (state.occupied && !state.occupancy_id)) {
      await cleanUnassigned(state);
      throw occupied();
    }

    let userId = state.user_id;
    if (!userId) {
      const created = await admin("/auth/v1/admin/users", {
        body: {
          email, password: nextPassword, email_confirm: true,
          app_metadata: { tcms_assignment: requestId, tcms_unit: unit },
        },
      }).catch(() => null);
      if (created?.ok) {
        userId = (await created.json()).id;
      } else {
        // A successful Auth create may have lost its response or raced an identical retry.
        state = await find();
        if (!state.user_id) {
          if (created) await checkAuthWrite(created);
          throw new Error("Auth account could not be created");
        }
      }
    }
    if (!userId) userId = state.user_id;
    if (state.user_id) {
      const verified = await request("/auth/v1/token?grant_type=password", { body: { email, password: nextPassword } });
      if ([400, 401].includes(verified.status)) {
        throw new TenantActionError(409, "Retry this assignment with the same password.");
      }
      if (!verified.ok) throw new Error("Assignment password could not be verified");
      const { access_token: token } = await verified.json();
      if (token) await request("/auth/v1/logout?scope=local", { body: {}, token }).catch(() => null);
    }

    try {
      return await adminRpc("assign_unit_tenant", {
        ...details, p_user: userId, p_full_name: name, p_contact: address,
      });
    } catch (error) {
      if (error.status === 409) await cleanUnassigned(await find());
      throw error;
    }
  }

  return async function tenants(req, res) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", "application/json");
    try {
      if (!sameOrigin(req)) throw new TenantActionError(403, "Management access is required.");
      if (!VALID_METHODS.includes(req.method)) {
        res.setHeader("Allow", VALID_METHODS.join(", "));
        return reply(res, 405, null);
      }
      if (!configured) throw new Error("Tenant management is unavailable");
      const authorized = createAuthorizedRequester(req, res, request);
      const rpc = (name, body) => authorized(`/rest/v1/rpc/${name}`, body).then(data);
      const access = await rpc("get_portal_access", {});
      if (access?.role !== "management") throw new TenantActionError(403, "Management access is required.");

      if (req.method === "GET") {
        const rows = await data(await authorized(
          `/rest/v1/unit_occupancies?select=${PROFILE_FIELDS}&ended_at=is.null&order=unit_number.asc`,
        ));
        return reply(res, 200, rows.map(formatTenant));
      }

      if (req.method === "DELETE") {
        const params = new URL(req.url, "http://localhost").searchParams;
        const unit = Number(params.get("unit"));
        const id = params.get("occupancyId");
        if (!validUnit(unit) || !UUID.test(id)) throw new TenantActionError(400, "Select a valid tenant account.");
        if (!await rpc("vacate_unit_tenant", { p_id: id, p_unit: unit })) {
          throw new TenantActionError(404, "The tenant account could not be found.");
        }
        return reply(res, 200, null);
      }

      const body = await readBody(req).catch(() => null);
      const profile = readProfile(body);
      const { unit, name, address, nextPassword } = profile;
      if ((req.method === "POST" || nextPassword) && !adminConfigured) {
        throw new Error("Tenant account actions are unavailable");
      }
      if (req.method === "POST") {
        const { requestId } = body;
        if (!UUID.test(requestId)) throw new TenantActionError(400, "Enter valid tenant details.");
        if (!nextPassword) throw new TenantActionError(400, "Enter the password.");
        const { id: managerId } = await data(await authorized("/auth/v1/user"));
        if (!UUID.test(managerId)) throw new TenantActionError(401, "Sign in as management to continue.");
        return reply(res, 201, formatTenant(await assign(managerId, requestId.toLowerCase(), profile)));
      }

      const { occupancyId } = body;
      if (!UUID.test(occupancyId)) throw new TenantActionError(400, "Select a valid tenant account.");
      const edit = { p_id: occupancyId, p_unit: unit, p_full_name: name, p_contact: address };
      if (nextPassword) {
        const query = new URLSearchParams({
          select: "user_id", id: `eq.${occupancyId}`, unit_number: `eq.${unit}`, ended_at: "is.null",
        });
        const [occupancy] = await data(await authorized(`/rest/v1/unit_occupancies?${query}`));
        if (!occupancy) throw new TenantActionError(409, "This tenant account is no longer active.");
        await checkAuthWrite(await admin(`/auth/v1/admin/users/${occupancy.user_id}`, {
          method: "PUT", body: { password: nextPassword },
        }));
      }
      const saved = await rpc("edit_unit_tenant", edit);
      if (!saved) throw new TenantActionError(409, "This tenant account is no longer active.");
      return reply(res, 200, formatTenant(saved));
    } catch (error) {
      if (error instanceof TenantActionError) return reply(res, error.status, { message: error.message });
      return reply(res, 503, { message: "Unable to complete the tenant action. Please try again." });
    }
  };
}

export default createTenantsHandler(process.env);
