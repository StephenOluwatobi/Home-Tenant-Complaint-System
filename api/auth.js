import {
  ACCESS_COOKIE, REFRESH_COOKIE, readCookie, clearCookies, saveCookies,
  reply, sameOrigin, readBody, createSupabaseConnection, createSupabaseAdminConnection, refreshSession,
} from "../server/supabase.js";

export function createAuthHandler(env) {
  const { configured, request } = createSupabaseConnection(env);
  const admin = createSupabaseAdminConnection(env);
  const supabase = (path, body, token) => request(path, { method: "POST", body, token });

  async function accessFor(token) {
    const response = await supabase("/rest/v1/rpc/get_portal_access", {}, token);
    if (response.status === 401) return undefined;
    if (!response.ok) throw new Error("Could not check portal access");
    const access = await response.json();
    if (access?.role === "management") return { role: "management" };
    if (
      access?.role === "tenant" &&
      Number.isInteger(access.unit) && access.unit >= 1 && access.unit <= 5 &&
      typeof access.occupancy_id === "string" && access.occupancy_id
    ) return { role: "tenant", unit: access.unit };
    return null;
  }

  async function login(req, res) {
    let body;
    try {
      body = await readBody(req);
    } catch {
      return reply(res, 400, { code: "invalid" });
    }
    const { role, unit, password } = body ?? {};
    const isTenant = role === "tenant" && Number.isInteger(unit) && unit >= 1 && unit <= 5;
    if ((!isTenant && role !== "management") || typeof password !== "string" || password.length > 1024) {
      return reply(res, 400, { code: "invalid" });
    }
    let email = env.TCMS_MANAGEMENT_AUTH_EMAIL;
    if (isTenant) {
      if (!admin.configured) return reply(res, 503, { code: "unavailable" });
      const account = await admin.request("/rest/v1/rpc/tenant_login_email", { body: { p_unit: unit } });
      if (!account.ok) throw new Error("Could not resolve tenant login");
      email = await account.json();
    }
    if (!email) return reply(res, 401, { code: "invalid" });

    const response = await supabase("/auth/v1/token?grant_type=password", { email, password: password.trim() });
    if (response.status === 429) return reply(res, 429, { code: "unavailable" });
    if (response.status === 400 || response.status === 401) return reply(res, 401, { code: "invalid" });
    if (!response.ok) throw new Error("Could not authenticate");
    const tokens = await response.json();
    const access = await accessFor(tokens.access_token);
    if (access?.role !== role || (isTenant && access.unit !== unit)) {
      return reply(res, 401, { code: "invalid" });
    }
    saveCookies(res, tokens);
    return reply(res, 200, access);
  }

  async function restore(req, res) {
    const accessToken = readCookie(req, ACCESS_COOKIE);
    const refreshToken = readCookie(req, REFRESH_COOKIE);
    if (accessToken) {
      const access = await accessFor(accessToken);
      if (access) return reply(res, 200, access);
      if (access === null) {
        clearCookies(res);
        return reply(res, 401, { code: "invalid" });
      }
    }
    const tokens = await refreshSession(request, refreshToken);
    if (tokens) {
      const access = await accessFor(tokens.access_token);
      if (access) {
        saveCookies(res, tokens);
        return reply(res, 200, access);
      }
    }
    if (accessToken || refreshToken) clearCookies(res);
    return reply(res, 401, { code: "invalid" });
  }

  async function logout(req, res) {
    const access = readCookie(req, ACCESS_COOKIE);
    const refresh = readCookie(req, REFRESH_COOKIE);
    clearCookies(res);
    let token = access;
    if (!token && refresh && configured) {
      const response = await supabase("/auth/v1/token?grant_type=refresh_token", { refresh_token: refresh });
      if (response.ok) token = (await response.json()).access_token;
    }
    if (token && configured) await supabase("/auth/v1/logout?scope=local", {}, token);
    return reply(res, 200, null);
  }

  return async function auth(req, res) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", "application/json");
    try {
      if (!sameOrigin(req)) return reply(res, 403, { code: "invalid" });
      if (req.method === "DELETE") return await logout(req, res);
      if (!configured) return reply(res, 503, { code: "unavailable" });
      if (req.method === "GET") return await restore(req, res);
      if (req.method === "POST") return await login(req, res);
      res.setHeader("Allow", "GET, POST, DELETE");
      return reply(res, 405, { code: "invalid" });
    } catch {
      return reply(res, 503, { code: "unavailable" });
    }
  };
}

export default createAuthHandler(process.env);
