import { createAuthorizedRequester, createSupabaseConnection, readBody, reply, sameOrigin } from "../server/supabase.js";
import { ANNOUNCEMENT_TAGS } from "../src/lib/announcementOptions.js";

const UUID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const PAGE_SIZE = 200;
const formatNotice = ({ id, title, tag, details, created_at }) => ({ id, title, tag, details, createdAt: created_at });

export function createAnnouncementsHandler(env) {
  const { configured, request } = createSupabaseConnection(env);

  return async function announcements(req, res) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", "application/json");
    try {
      if (!sameOrigin(req)) return reply(res, 403, null);
      if (!["GET", "POST", "DELETE"].includes(req.method)) {
        res.setHeader("Allow", "GET, POST, DELETE");
        return reply(res, 405, null);
      }
      if (!configured) return reply(res, 503, null);

      const authorized = createAuthorizedRequester(req, res, request);
      const session = await authorized("/rest/v1/rpc/get_portal_access", {});
      if (!session || session.status === 401) return reply(res, 401, null);
      if (!session.ok) return reply(res, 503, null);
      const access = await session.json();
      if (!access || (req.method !== "GET" && access.role !== "management")) return reply(res, 403, null);

      if (req.method === "GET") {
        const query = new URLSearchParams({
          select: "id,title,tag,details,created_at", order: "created_at.desc,id.desc", limit: PAGE_SIZE,
        });
        const notices = [];
        for (let offset = 0; ; offset += PAGE_SIZE) {
          query.set("offset", offset);
          const response = await authorized(`/rest/v1/announcements?${query}`);
          if (!response || response.status === 401) return reply(res, 401, null);
          if (!response.ok) return reply(res, 503, null);
          const page = await response.json();
          notices.push(...page.map(formatNotice));
          if (page.length < PAGE_SIZE) return reply(res, 200, notices);
        }
      }

      let response;
      if (req.method === "POST") {
        const { id, title, tag, details } = (await readBody(req, 64 * 1024).catch(() => null)) ?? {};
        if (
          !UUID.test(id) || typeof title !== "string" || [...title.trim()].length < 3 ||
          !ANNOUNCEMENT_TAGS.includes(tag) || typeof details !== "string" || [...details.trim()].length < 10
        ) return reply(res, 400, null);
        response = await authorized("/rest/v1/rpc/publish_announcement", {
          p_id: id, p_title: title.trim(), p_tag: tag, p_details: details.trim(),
        });
      } else {
        const id = new URL(req.url, "http://localhost").searchParams.get("id");
        if (!UUID.test(id)) return reply(res, 400, null);
        response = await authorized("/rest/v1/rpc/delete_announcement", { p_id: id });
      }
      if (!response || response.status === 401) return reply(res, 401, null);
      if ([403, 409].includes(response.status)) return reply(res, response.status, null);
      if (!response.ok) return reply(res, 503, null);
      return req.method === "POST" ? reply(res, 201, formatNotice(await response.json())) : reply(res, 200, null);
    } catch {
      return reply(res, 503, null);
    }
  };
}

export default createAnnouncementsHandler(process.env);
