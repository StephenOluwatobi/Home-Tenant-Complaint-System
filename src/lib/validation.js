import { CATEGORIES, MAX_IMAGE_BYTES } from "./complaintOptions.js";

export function validateComplaint({ category, description, file }) {
  const errors = {};
  const list = Array.isArray(category) ? category : category ? [category] : [];
  if (list.length === 0 || !list.every((c) => CATEGORIES.includes(c))) {
    errors.category = "Select at least one fault category.";
  }
  const text = (description || "").trim();
  if (text.length < 10)
    errors.description = "Describe the fault in at least 10 characters.";
  else if (text.length > 500)
    errors.description = "Keep the description under 500 characters.";
  if (file) {
    if (!file.type.startsWith("image/"))
      errors.photo = "Attach an image file (JPG, PNG or WebP).";
    else if (file.size > MAX_IMAGE_BYTES)
      errors.photo = "The photo is larger than 2 MB. Choose a smaller one.";
  }
  return errors;
}

export function validatePassword(value) {
  if (!value) return "Enter the password.";
  return "";
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () =>
      reject(new Error("The photo could not be read. Try another file."));
    reader.readAsDataURL(file);
  });
}

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
