import { createHash, randomUUID } from "node:crypto";
import sharp from "sharp";
import { MAX_IMAGE_BYTES } from "../src/lib/complaintOptions.js";
import { createSupabaseAdminConnection } from "./supabase.js";

const BUCKET = "complaint-photos";
const FORMATS = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
const MAX_PIXELS = 25_000_000;
export const MAX_PHOTO_BASE64 = Math.ceil(MAX_IMAGE_BYTES / 3) * 4;

export class PhotoError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

export async function validatePhoto(data) {
  if (typeof data !== "string" || !data.length) throw new PhotoError(422, "photo_invalid");
  if (data.length > MAX_PHOTO_BASE64) throw new PhotoError(413, "photo_too_large");
  if (data.length % 4 !== 0 || /[^A-Za-z0-9+/]/.test(data.replace(/={1,2}$/, ""))) {
    throw new PhotoError(422, "photo_invalid");
  }
  const bytes = Buffer.from(data, "base64");
  if (bytes.length > MAX_IMAGE_BYTES) throw new PhotoError(413, "photo_too_large");

  try {
    const image = sharp(bytes, { animated: true, failOn: "warning", limitInputPixels: MAX_PIXELS });
    const { format, width, height, pageHeight, pages } = await image.metadata();
    const contentType = FORMATS[format];
    const pixels = width * (pageHeight ? pageHeight * (pages ?? 1) : height);
    if (!contentType || pixels > MAX_PIXELS) throw new Error("Unsupported image");
    // Metadata alone does not detect a truncated or corrupt image body.
    await image.timeout({ seconds: 4 }).raw().toBuffer();
    return { bytes, contentType };
  } catch {
    throw new PhotoError(422, "photo_invalid");
  }
}

export function createComplaintPhotoStore(env) {
  const { configured, request: admin } = createSupabaseAdminConnection(env);
  const rpc = async (name, body) => {
    const response = await admin(`/rest/v1/rpc/${name}`, { body });
    if (response.status === 403) throw new PhotoError(403, "forbidden");
    if (response.status === 409) throw new PhotoError(409, "unavailable");
    if (!response.ok) throw new Error("Photo submission request failed");
    return response.json();
  };
  const storagePath = (path) => `${BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`;

  return {
    async save({ userId, attemptId, categories, description, photo }) {
      if (!configured) throw new Error("Photo storage is unavailable");
      const lease = { p_id: attemptId, p_lease: randomUUID() };
      const hash = createHash("sha256").update(JSON.stringify([categories, description]))
        .update(photo.bytes).digest("hex");
      let uploadUncertain = false;

      try {
        const attempt = await rpc("reserve_complaint_photo", { ...lease, p_user_id: userId, p_hash: hash });
        if (!attempt) throw new PhotoError(409, "unavailable");
        if (attempt.id) return attempt.id;

        uploadUncertain = true;
        const uploaded = await admin(`/storage/v1/object/${storagePath(attempt.path)}`, {
          bytes: photo.bytes,
          headers: { "Content-Type": photo.contentType, "x-upsert": "true" },
          timeoutMs: 20000,
        });
        uploadUncertain = false;
        if (!uploaded.ok) throw new Error("Photo upload failed");

        return await rpc("finish_complaint_photo", {
          ...lease,
          p_user_id: userId,
          p_categories: categories,
          p_description: description,
          p_content_type: photo.contentType,
          p_size: photo.bytes.length,
        });
      } catch (error) {
        try {
          // A timed-out upload may still finish remotely. Only the same payload
          // may retry against that path, so it can safely replace the object.
          const path = await rpc("discard_complaint_photo", { ...lease, p_retry: uploadUncertain });
          if (path) {
            const removed = await admin(`/storage/v1/object/${BUCKET}`, {
              method: "DELETE", body: { prefixes: [path] },
            });
            if (removed.ok) await rpc("discard_complaint_photo", { ...lease, p_removed: true });
          }
        } catch {
          // The reservation keeps a deterministic path for recovery on retry.
        }
        throw error;
      }
    },

    async download(path) {
      if (!configured) throw new Error("Photo storage is unavailable");
      return admin(`/storage/v1/object/authenticated/${storagePath(path)}`);
    },
  };
}
