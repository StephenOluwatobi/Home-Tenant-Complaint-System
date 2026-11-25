const ACCESS_COOKIE = "__Host-tcms-access";
const REFRESH_COOKIE = "__Host-tcms-refresh";
const REFRESH_MAX_AGE = 30 * 24 * 60 * 60;

function cookie(name, value, maxAge) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

export function readCookie(req, name) {
  const entry = req.headers.cookie?.split(";").map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : "";
}

export function clearCookies(res) {
  res.setHeader("Set-Cookie", [cookie(ACCESS_COOKIE, "", 0), cookie(REFRESH_COOKIE, "", 0)]);
}

export function saveCookies(res, tokens) {
  if (!tokens.access_token || !tokens.refresh_token || !Number.isFinite(tokens.expires_in)) {
    throw new Error("Invalid Auth session");
  }
  res.setHeader("Set-Cookie", [
    cookie(ACCESS_COOKIE, tokens.access_token, Math.max(0, Math.floor(tokens.expires_in) - 10)),
    cookie(REFRESH_COOKIE, tokens.refresh_token, REFRESH_MAX_AGE),
  ]);
}

export function reply(res, status, body) {
  res.statusCode = status;
  res.end(JSON.stringify(body));
}

export function sameOrigin(req) {
  const origin = req.headers.origin;
  if (origin === "null") return false;
  if (origin) {
    const { host, protocol, hostname } = new URL(origin);
    const local = hostname === "localhost" || hostname === "127.0.0.1";
    return host === req.headers.host && (protocol === "https:" || (local && protocol === "http:"));
  }
  return req.method === "GET" && !["cross-site", "same-site"].includes(req.headers["sec-fetch-site"]);
}

export async function readBody(req, maxBytes = 4096) {
  if (Number(req.headers["content-length"]) > maxBytes) throw new Error("Invalid request");
  if (req.body !== undefined) {
    const body = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : req.body;
    return typeof body === "string" ? JSON.parse(body) : body;
  }
  const chunks = [];
  let length = 0;
  for await (const chunk of req) {
    const bytes = Buffer.from(chunk);
    length += bytes.length;
    if (length > maxBytes) throw new Error("Invalid request");
    chunks.push(bytes);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export { ACCESS_COOKIE, REFRESH_COOKIE };

export function createSupabaseConnection(env, key = env.TCMS_SUPABASE_PUBLISHABLE_KEY) {
  const url = env.TCMS_SUPABASE_URL?.replace(/\/$/, "");

  function request(path, {
    body, bytes, token, headers, timeoutMs = 5000,
    method = body === undefined && bytes === undefined ? "GET" : "POST",
  } = {}) {
    return fetch(`${url}${path}`, {
      method,
      headers: {
        apikey: key,
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...headers,
      },
      body: bytes ?? (body === undefined ? undefined : JSON.stringify(body)),
      redirect: "error",
      signal: AbortSignal.timeout(timeoutMs),
    });
  }

  return { configured: Boolean(url && key), request };
}

export function createSupabaseAdminConnection(env) {
  const key = env.TCMS_SUPABASE_STORAGE_SECRET_KEY || "";
  const { configured, request } = createSupabaseConnection(env, key);
  return {
    configured,
    request: (path, options) => request(path, {
      ...options,
      token: key.startsWith("eyJ") ? key : undefined,
    }),
  };
}

export function createAuthorizedRequester(req, res, request) {
  let token = readCookie(req, ACCESS_COOKIE);
  const refreshToken = readCookie(req, REFRESH_COOKIE);
  let refreshed = false;

  return async function authorizedRequest(path, body) {
    const response = token && await request(path, { body, token });
    if (response && response.status !== 401) return response;
    if (refreshed) return null;
    refreshed = true;
    const session = await refreshSession(request, refreshToken);
    if (!session) {
      clearCookies(res);
      return null;
    }
    saveCookies(res, session);
    token = session.access_token;
    return request(path, { body, token });
  };
}

export async function refreshSession(request, refreshToken) {
  if (!refreshToken) return null;
  const response = await request("/auth/v1/token?grant_type=refresh_token", {
    body: { refresh_token: refreshToken },
  });
  if (response.ok) return response.json();
  if (response.status === 400 || response.status === 401) return null;
  throw new Error("Could not refresh session");
}
