import { reply, sameOrigin, readBody, createSupabaseConnection, createAuthorizedRequester } from "../server/supabase.js";
import { CATEGORIES, STATUSES } from "../src/lib/complaintOptions.js";
import { createComplaintPhotoStore, MAX_PHOTO_BASE64, PhotoError, validatePhoto } from "../server/complaintPhotos.js";

const TICKET_COLUMNS = "id,categories,description,status,created_at,technician,resolved_at,photo_path,occupancy:unit_occupancies(unit_number)";
const PAGE_SIZE = 200;
const UUID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

function formatComplaint(row) {
  return {
    id: row.id,
    unit: row.occupancy.unit_number,
    category: row.categories,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
    technician: row.technician ?? "",
    resolvedAt: row.resolved_at,
    ...("photo_path" in row && { photo: row.photo_path ? `/api/complaints?id=${row.id}&photo=1` : "" }),
  };
}

export function createComplaintsHandler(env) {
  const { configured, request } = createSupabaseConnection(env);
  const photos = createComplaintPhotoStore(env);

  return async function complaints(req, res) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", "application/json");
    try {
      if (!sameOrigin(req)) return reply(res, 403, { code: "forbidden" });
      if (!configured) return reply(res, 503, { code: "unavailable" });
      if (!["GET", "POST", "PATCH"].includes(req.method)) {
        res.setHeader("Allow", "GET, POST, PATCH");
        return reply(res, 405, { code: "invalid" });
      }

      const authorizedRequest = createAuthorizedRequester(req, res, request);

      const params = new URL(req.url, "http://localhost").searchParams;
      const id = params.get("id");
      if (id !== null && !UUID.test(id)) return reply(res, 404, null);

      if (req.method === "POST" || req.method === "PATCH") {
        let body;
        try {
          body = await readBody(req, req.method === "POST" ? MAX_PHOTO_BASE64 + 4096 : undefined);
        } catch {
          return reply(res, 400, { code: "invalid" });
        }
        if (!body || typeof body !== "object" || Array.isArray(body)) {
          return reply(res, 400, { code: "invalid" });
        }
        if (req.method === "PATCH") {
          if (!id) return reply(res, 404, null);
          const fields = Object.keys(body);
          const { status, technician } = body;
          if (
            fields.length === 0 || fields.some((field) => field !== "status" && field !== "technician") ||
            (fields.includes("status") && !STATUSES.includes(status)) ||
            (fields.includes("technician") && (typeof technician !== "string" || [...technician.trim()].length > 60))
          ) return reply(res, 400, { code: "invalid" });
          const response = await authorizedRequest("/rest/v1/rpc/update_complaint", {
            p_id: id,
            p_status: status,
            p_technician: technician?.trim(),
          });
          if (!response || response.status === 401) return reply(res, 401, { code: "invalid" });
          if (response.status === 403) return reply(res, 403, { code: "forbidden" });
          if (!response.ok) return reply(res, 503, { code: "unavailable" });
          const updated = await response.json();
          return updated ? reply(res, 200, formatComplaint(updated)) : reply(res, 404, null);
        }

        const { category, description, photo, submissionId } = body;
        const text = typeof description === "string" ? description.trim() : "";
        const length = [...text].length;
        if (
          !Array.isArray(category) || category.length < 1 || category.length > CATEGORIES.length ||
          !category.every((value) => CATEGORIES.includes(value)) || length < 10 || length > 500 ||
          Object.keys(body).some((key) => !["category", "description", "photo", "submissionId"].includes(key)) ||
          (("photo" in body || "submissionId" in body) &&
            (typeof photo !== "string" || typeof submissionId !== "string" || !UUID.test(submissionId)))
        ) return reply(res, 400, { code: "invalid" });

        if (photo !== undefined) {
          const user = await authorizedRequest("/auth/v1/user");
          if (!user || user.status === 401) return reply(res, 401, { code: "invalid" });
          if (!user.ok) return reply(res, 503, { code: "unavailable" });
          const { id: userId } = await user.json();
          if (!UUID.test(userId)) return reply(res, 401, { code: "invalid" });
          const id = await photos.save({
            userId, attemptId: submissionId, categories: category, description: text, photo: await validatePhoto(photo),
          });
          return reply(res, 201, { id });
        }

        const response = await authorizedRequest("/rest/v1/rpc/create_complaint", {
          p_categories: category,
          p_description: text,
        });
        if (!response || response.status === 401) return reply(res, 401, { code: "invalid" });
        if (response.status === 403) return reply(res, 403, { code: "forbidden" });
        if (!response.ok) return reply(res, 503, { code: "unavailable" });
        return reply(res, 201, { id: await response.json() });
      }

      if (params.get("photo") === "1") {
        res.setHeader("Cache-Control", "private, no-store");
        res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
        if (!id) return reply(res, 404, null);
        const query = new URLSearchParams({ select: "photo_path,photo_content_type", id: `eq.${id}`, limit: 1 });
        const complaint = await authorizedRequest(`/rest/v1/complaints?${query}`);
        if (!complaint || complaint.status === 401) return reply(res, 401, { code: "invalid" });
        if (!complaint.ok) return reply(res, 503, { code: "unavailable" });
        const [row] = await complaint.json();
        if (!row?.photo_path) return reply(res, 404, null);
        const file = await photos.download(row.photo_path);
        if (!file.ok) return reply(res, 503, { code: "unavailable" });
        const bytes = Buffer.from(await file.arrayBuffer());
        res.setHeader("Content-Type", row.photo_content_type);
        res.setHeader("Content-Length", bytes.length);
        res.setHeader("X-Content-Type-Options", "nosniff");
        return res.end(bytes);
      }

      const status = params.get("status");
      if (status !== null && !STATUSES.includes(status)) return reply(res, 400, { code: "invalid" });
      const query = new URLSearchParams({ select: TICKET_COLUMNS, order: "created_at.desc,id.desc" });
      if (id !== null) query.set("id", `eq.${id}`);
      if (status !== null) query.set("status", `eq.${status}`);
      const rows = [];
      for (let offset = 0; ; offset += PAGE_SIZE) {
        query.set("limit", id === null ? PAGE_SIZE : 1);
        query.set("offset", offset);
        const response = await authorizedRequest(`/rest/v1/complaints?${query}`);
        if (!response || response.status === 401) return reply(res, 401, { code: "invalid" });
        if (!response.ok) return reply(res, 503, { code: "unavailable" });
        const page = await response.json();
        rows.push(...page);
        if (page.length < PAGE_SIZE) break;
      }
      if (id !== null) return rows.length ? reply(res, 200, formatComplaint(rows[0])) : reply(res, 404, null);
      return reply(res, 200, rows.map(formatComplaint));
    } catch (error) {
      if (error instanceof PhotoError) return reply(res, error.status, { code: error.code });
      return reply(res, 503, { code: "unavailable" });
    }
  };
}

export default createComplaintsHandler(process.env);
