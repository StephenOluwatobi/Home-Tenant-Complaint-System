import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CATEGORIES, addComplaint } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { validateComplaint } from "../lib/validation.js";

const CATEGORY_ICONS = {
  Plumbing: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  ),
  Electrical: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
    </svg>
  ),
  Structural: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z" />
    </svg>
  ),
  Appliance: (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2.1"
    >
      <rect x="4" y="3" width="16" height="18" rx="2.5" />
      <line x1="4" y1="8" x2="20" y2="8" />
      <circle cx="8" cy="5.5" r="0.8" fill="currentColor" />
      <circle cx="11" cy="5.5" r="0.8" fill="currentColor" />
    </svg>
  ),
  Others: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="6" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="18" cy="12" r="2" />
    </svg>
  ),
};

export default function NewComplaint() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const photoSubmission = useRef(null);

  const [categories, setCategories] = useState([]);
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const toggleCategory = (cat) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((item) => item !== cat) : [...prev, cat],
    );
    if (errors.category) {
      setErrors((prev) => ({ ...prev, category: undefined }));
    }
  };

  const handleFileSelect = (selected) => {
    if (!selected) return;
    setFile(selected);
    if (errors.photo) {
      setErrors((prev) => ({ ...prev, photo: undefined }));
    }
  };

  const removeFile = () => {
    setFile(null);
    setErrors((prev) => ({ ...prev, photo: undefined }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = validateComplaint({
      category: categories,
      description,
      file,
    });
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      const text = description.trim();
      const details = JSON.stringify([categories, text]);
      if (file && (photoSubmission.current?.file !== file || photoSubmission.current.details !== details)) {
        photoSubmission.current = { id: crypto.randomUUID(), file, details };
      }
      await addComplaint({
        category: categories,
        description: text,
        file,
        submissionId: file ? photoSubmission.current.id : undefined,
      });
      navigate("/tenant");
    } catch (err) {
      setErrors({ [err.field === "photo" ? "photo" : "form"]: err.message });
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#f4f2ff] text-slate-900 font-sans pb-16">
      {/* Subtle Bottom-Right Decorative Lavender Curve */}
      <div
        className="pointer-events-none fixed -bottom-24 -right-24 w-[380px] h-[380px] rounded-full bg-[#ded8fb]/70"
        aria-hidden="true"
      />

      {/* Top White Portal Bar */}
      <header className="relative z-20 bg-white/95 backdrop-blur border-b border-indigo-100/80">
        <div className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/tenant" className="flex items-center gap-2.5 group">
              <svg className="w-9 h-8" viewBox="0 0 64 56" fill="none">
                <path
                  d="M12 27L32 10L52 27"
                  stroke="#140f33"
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M18 24V42M46 24V42"
                  stroke="#140f33"
                  strokeWidth="3.8"
                  strokeLinecap="round"
                />
                <rect
                  x="27"
                  y="25"
                  width="4"
                  height="4"
                  rx="0.6"
                  fill="#5b21b6"
                />
                <rect
                  x="33"
                  y="25"
                  width="4"
                  height="4"
                  rx="0.6"
                  fill="#5b21b6"
                />
                <rect
                  x="27"
                  y="31"
                  width="4"
                  height="4"
                  rx="0.6"
                  fill="#5b21b6"
                />
                <rect
                  x="33"
                  y="31"
                  width="4"
                  height="4"
                  rx="0.6"
                  fill="#5b21b6"
                />
                <path
                  d="M10 47C22 41 42 41 54 47"
                  stroke="#6d28d9"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-lg font-extrabold text-slate-900 tracking-tight">
                Tenant Portal
              </span>
            </Link>

            <span className="hidden sm:inline text-slate-300">|</span>
            <Link
              to="/tenant"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#4c24b5] transition"
            >
              ← Back to Dashboard
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f4f2ff] border border-indigo-200/80 text-xs font-bold text-slate-800">
              <svg
                className="w-4 h-4 text-[#4c24b5]"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z" />
              </svg>
              <span>Unit {session.unit}</span>
            </div>

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-indigo-50 border border-slate-200 text-xs font-bold text-[#4c24b5] transition"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Change Unit</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner with Right Building Photo */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#dfd8fc] via-[#ebe6fe] to-[#d9d1fa] border-b border-indigo-100">
        <div
          className="hidden md:block absolute -left-16 -bottom-24 w-72 h-72 rounded-full bg-[#cfc5fa]/75 pointer-events-none"
          aria-hidden="true"
        />

        <div
          className="hidden md:block absolute inset-y-0 right-0 w-[56%] bg-cover bg-center"
          style={{ backgroundImage: "url('/building.png')" }}
        />
        <div className="hidden md:block absolute inset-y-0 right-0 w-[58%] bg-gradient-to-r from-[#e5dffd] via-[#e5dffd]/55 to-transparent" />

        <div className="relative z-10 max-w-5xl mx-auto px-5 md:px-8 pt-10 pb-20">
          <Link
            to="/tenant"
            className="sm:hidden inline-flex items-center gap-1 text-xs font-bold text-[#4c24b5] mb-3"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl md:text-[38px] font-extrabold text-slate-900 tracking-tight">
            New Complaint
          </h1>
          <p className="text-sm md:text-[15px] text-slate-700 mt-1.5">
            Report any issue with your apartment. We&apos;ll get it checked.
          </p>
          <div className="w-12 h-1 rounded-full bg-[#4c24b5] mt-4" />
        </div>
      </section>

      {/* Overlapping White Form Card */}
      <main className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 md:px-8 -mt-11">
        <div className="bg-white rounded-[26px] shadow-[0_20px_50px_rgba(49,27,146,0.10)] border border-white p-6 sm:p-8 md:p-10">
          {/* Card Header */}
          <div className="flex items-start gap-3.5 pb-6 border-b border-slate-100">
            <div className="w-10 h-10 rounded-full bg-[#4c24b5] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <span className="font-extrabold text-lg leading-none">!</span>
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Complaint Details
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Fill in the form below to submit your complaint.
              </p>
            </div>
          </div>

          <form onSubmit={submit} className="mt-7 space-y-6" noValidate>
            {/* Row 1: Unit (Read-only) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-6 items-start">
              <label className="md:col-span-3 text-sm font-bold text-slate-800 md:pt-3">
                Unit <span className="text-rose-500">*</span>
              </label>
              <div className="md:col-span-9">
                <div className="w-full rounded-xl bg-[#f1effa] border border-indigo-100/80 px-4 py-3 text-sm font-semibold text-slate-800">
                  Unit {session.unit}
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  Your selected unit is already set.
                </p>
              </div>
            </div>

            {/* Row 2: Multi-Select Fault Category Pill Selector */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-6 items-start">
              <div className="md:col-span-3 md:pt-2">
                <label className="block text-sm font-bold text-slate-800">
                  Fault Category <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] font-medium text-slate-500">
                  Select one or more
                </span>
              </div>
              <div className="md:col-span-9">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {CATEGORIES.map((cat) => {
                    const selected = categories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        aria-pressed={selected}
                        className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          selected
                            ? "bg-gradient-to-r from-[#4c24b5] to-[#6338d4] text-white border-transparent shadow-md shadow-indigo-900/20"
                            : "bg-[#f7f6fd] hover:bg-[#efecfb] text-slate-800 border-indigo-100/80"
                        }`}
                      >
                        <span
                          className={selected ? "text-white" : "text-[#4c24b5]"}
                        >
                          {CATEGORY_ICONS[cat]}
                        </span>
                        <span>{cat}</span>
                      </button>
                    );
                  })}
                </div>
                {errors.category && (
                  <p
                    className="mt-1.5 text-xs font-medium text-rose-600"
                    role="alert"
                  >
                    {errors.category}
                  </p>
                )}
              </div>
            </div>

            {/* Row 3: Issue Description */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-6 items-start">
              <label
                htmlFor="desc"
                className="md:col-span-3 text-sm font-bold text-slate-800 md:pt-3"
              >
                Issue Description <span className="text-rose-500">*</span>
              </label>
              <div className="md:col-span-9">
                <div
                  className={`relative rounded-xl bg-[#f7f6fd] border transition ${
                    errors.description
                      ? "border-rose-500 ring-2 ring-rose-100"
                      : "border-indigo-100/80 focus-within:border-[#4c24b5] focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100"
                  }`}
                >
                  <textarea
                    id="desc"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the issue in detail..."
                    className="w-full bg-transparent px-4 pt-3.5 pb-7 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none resize-y"
                  />
                  <span className="absolute bottom-2.5 right-3.5 text-[11px] font-medium text-slate-400">
                    {description.trim().length}/500
                  </span>
                </div>
                {errors.description && (
                  <p
                    className="mt-1.5 text-xs font-medium text-rose-600"
                    role="alert"
                  >
                    {errors.description}
                  </p>
                )}
              </div>
            </div>

            {/* Row 4: Upload Image (Optional) + Preview Box */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-6 items-start">
              <div className="md:col-span-3 md:pt-2">
                <label
                  htmlFor="photo"
                  className="block text-sm font-bold text-slate-800"
                >
                  Upload Image
                </label>
                <span className="text-xs font-medium text-slate-500">
                  (Optional)
                </span>
              </div>

              <div className="md:col-span-9">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragActive(true);
                    }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex-1 rounded-xl border-2 border-dashed px-5 py-6 flex items-center justify-center gap-3.5 cursor-pointer transition ${
                      dragActive
                        ? "border-[#4c24b5] bg-indigo-50/70"
                        : "border-indigo-200 bg-[#f9f8fe] hover:border-[#4c24b5]/60 hover:bg-[#f3f0fc]"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleFileSelect(e.target.files[0] || null)
                      }
                      className="hidden"
                    />

                    <svg
                      className="w-7 h-7 text-[#4c24b5] shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.9"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>

                    <div className="text-left">
                      <p className="text-xs sm:text-sm font-semibold text-slate-800">
                        {file
                          ? file.name
                          : "Click to upload or drag and drop an image"}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        (Only images, Max size: 2 MB)
                      </p>
                    </div>
                  </div>

                  {previewUrl && (
                    <div className="relative w-32 h-24 rounded-xl overflow-hidden border border-slate-200 shadow-sm shrink-0 bg-slate-100">
                      <img
                        src={previewUrl}
                        alt="Complaint attachment preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={removeFile}
                        aria-label="Remove selected image"
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/95 hover:bg-rose-50 text-slate-700 hover:text-rose-600 shadow flex items-center justify-center text-xs font-bold cursor-pointer transition"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {errors.photo && (
                  <p
                    className="mt-1.5 text-xs font-medium text-rose-600"
                    role="alert"
                  >
                    {errors.photo}
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button + Pending Info Notice */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-6 pt-2">
              <div className="hidden md:block md:col-span-3" />
              <div className="md:col-span-9 space-y-3">
                {errors.form && (
                  <p role="alert" className="text-xs font-medium text-rose-600">
                    {errors.form}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#4c24b5] to-[#6338d4] hover:from-[#5832c9] hover:to-[#7044e3] text-white font-bold text-sm sm:text-[15px] shadow-[0_10px_24px_rgba(76,36,181,0.3)] flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer"
                >
                  {!busy && (
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  )}
                  <span>
                    {busy ? "Submitting Complaint..." : "Submit Complaint"}
                  </span>
                </button>

                <div className="w-full rounded-full bg-[#efecfb] px-4 py-2.5 flex items-center justify-center gap-2 text-center">
                  <span className="w-4 h-4 rounded-full bg-[#4c24b5] text-white text-[10px] font-extrabold flex items-center justify-center shrink-0">
                    i
                  </span>
                  <p className="text-xs font-medium text-slate-700">
                    Your complaint will be saved as{" "}
                    <span className="font-bold text-slate-900">Pending</span>{" "}
                    and will be reviewed by the management.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
