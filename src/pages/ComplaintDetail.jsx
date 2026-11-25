import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { COMPLAINT_LOAD_ERROR, STATUSES, getComplaint, updateComplaint } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { formatDate } from "../lib/validation.js";

const STATUS_STYLES = {
  Pending: "bg-amber-100 text-amber-700 border-amber-200",
  "In-Progress": "bg-sky-100 text-sky-700 border-sky-200",
  Resolved: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const CATEGORY_STYLES = {
  Plumbing: "bg-indigo-100 text-indigo-700",
  Electrical: "bg-purple-100 text-purple-700",
  Structural: "bg-violet-100 text-violet-700",
  Appliance: "bg-fuchsia-100 text-fuchsia-700",
  Others: "bg-slate-100 text-slate-700",
};

export default function ComplaintDetail() {
  const { id } = useParams();
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

  const [c, setC] = useState(undefined);
  const [loadFailed, setLoadFailed] = useState(false);
  const [tech, setTech] = useState("");
  const [techError, setTechError] = useState("");
  const [statusError, setStatusError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState("");
  const saveRequest = useRef(null);

  const isManagement = session?.role === "management";
  const backPath = isManagement ? "/management" : "/tenant";
  const backLabel = isManagement
    ? "Back to All Complaints"
    : "Back to Dashboard";

  useEffect(() => {
    const controller = new AbortController();
    setC(undefined);
    setLoadFailed(false);
    setTech("");
    setTechError("");
    setStatusError("");
    setMessage("");
    setSaving("");
    getComplaint(id, { signal: controller.signal }).then((found) => {
      setC(found);
      setTech(found?.technician || "");
    }).catch(() => {
      if (!controller.signal.aborted) setLoadFailed(true);
    });
    return () => {
      controller.abort();
      saveRequest.current?.abort();
      saveRequest.current = null;
    };
  }, [id]);

  const handleLogout = () => {
    signOut();
    navigate("/");
  };

  async function saveChange(field, value, confirmation, onError) {
    if (!isManagement || saveRequest.current) return;
    const controller = new AbortController();
    saveRequest.current = controller;
    setSaving(field);
    setStatusError("");
    setMessage("");
    try {
      const updated = await updateComplaint(id, { [field]: value }, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setC((previous) => ({ ...previous, ...updated }));
      if (field === "technician") setTech(updated.technician);
      setMessage(confirmation);
    } catch {
      if (!controller.signal.aborted) onError("Unable to save the changes. Please try again.");
    } finally {
      if (saveRequest.current === controller) {
        saveRequest.current = null;
        setSaving("");
      }
    }
  }

  const saveTech = (event) => {
    event.preventDefault();
    if (!isManagement || saveRequest.current) return;
    setMessage("");
    const value = tech.trim();
    if ([...value].length > 60) {
      setTechError("Keep the name under 60 characters.");
      return;
    }
    setTechError("");
    saveChange("technician", value, value ? `Technician assigned: ${value}` : "Technician cleared.", setTechError);
  };

  const categories = c
    ? Array.isArray(c.category)
      ? c.category
      : [c.category]
    : [];

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#f4f2ff] text-slate-900 font-sans pb-16">
      {/* Decorative Bottom-Right Lavender Circle */}
      <div
        className="pointer-events-none fixed -bottom-24 -right-24 w-[380px] h-[380px] rounded-full bg-[#ded8fb]/70"
        aria-hidden="true"
      />

      {/* Top Portal Header */}
      <header className="relative z-20 bg-white/95 backdrop-blur border-b border-indigo-100/80">
        <div className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to={backPath} className="flex items-center gap-2.5">
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
              <div>
                <span className="block text-base font-extrabold text-slate-900 leading-none">
                  AOH Portal
                </span>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">
                  {isManagement ? "Management" : `Unit ${session?.unit}`}
                </span>
              </div>
            </Link>

            <span className="hidden sm:inline text-slate-300">|</span>
            <Link
              to={backPath}
              className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#4c24b5] transition"
            >
              ← {backLabel}
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f4f2ff] border border-indigo-200/80 text-xs font-bold text-slate-800">
              <span className="w-2 h-2 rounded-full bg-[#4c24b5]" />
              <span>
                {isManagement ? "Management" : `Unit ${session?.unit}`}
              </span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-full bg-white hover:bg-rose-50 border border-slate-200 text-xs font-bold text-slate-700 hover:text-rose-600 transition cursor-pointer"
            >
              Logout
            </button>
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
            to={backPath}
            className="sm:hidden inline-flex items-center gap-1 text-xs font-bold text-[#4c24b5] mb-3"
          >
            ← {backLabel}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl md:text-[36px] font-extrabold text-slate-900 tracking-tight">
              {c ? `Unit ${c.unit} Complaint` : "Complaint Details"}
            </h1>
            {c && (
              <span
                className={`px-3.5 py-1 rounded-full text-xs font-bold border ${
                  STATUS_STYLES[c.status] ||
                  "bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                {c.status}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-700 mt-1.5">
            {c
              ? `Ticket #${c.id.toUpperCase()} • Submitted on ${formatDate(c.createdAt)}`
              : "Reviewing maintenance ticket details"}
          </p>
          <div className="w-12 h-1 rounded-full bg-[#4c24b5] mt-4" />
        </div>
      </section>

      {/* Main Content Card */}
      <main className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 md:px-8 -mt-11">
        {c === undefined && (
          <div className="bg-white rounded-[26px] shadow-[0_20px_50px_rgba(49,27,146,0.10)] p-10 text-center text-sm text-slate-500">
            {loadFailed ? COMPLAINT_LOAD_ERROR : "Loading complaint details..."}
          </div>
        )}

        {c === null && (
          <div className="bg-white rounded-[26px] shadow-[0_20px_50px_rgba(49,27,146,0.10)] p-10 text-center space-y-3">
            <p className="text-lg font-extrabold text-slate-900">
              This complaint does not exist.
            </p>
            <p className="text-sm text-slate-500">
              It may have been cleared from browser storage.
            </p>
            <Link
              to={backPath}
              className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 rounded-full bg-[#4c24b5] text-white text-xs font-bold"
            >
              ← {backLabel}
            </Link>
          </div>
        )}

        {c && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Full Ticket Details & Photo */}
            <div className="lg:col-span-7 bg-white rounded-[26px] shadow-[0_20px_50px_rgba(49,27,146,0.10)] border border-white p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3 pb-5 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Fault Categories
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {categories.map((cat) => (
                      <span
                        key={cat}
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          CATEGORY_STYLES[cat] ||
                          "bg-indigo-100 text-indigo-700"
                        }`}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Assigned Technician
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-1.5">
                    {c.technician ? c.technician : "Not yet assigned"}
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Issue Description
                </h2>
                <div className="rounded-2xl bg-[#f7f6fd] border border-indigo-100/80 p-4 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {c.description}
                </div>
              </div>

              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Attached Photo
                </h2>
                {c.photo ? (
                  <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                    <img
                      src={c.photo}
                      alt={`Photo of the ${categories.join(", ").toLowerCase()} fault in Unit ${c.unit}`}
                      className="w-full max-h-96 object-contain bg-slate-950/5"
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-[#faf9fe] py-8 px-4 text-center">
                    <p className="text-xs font-medium text-slate-500">
                      No photo was attached to this complaint.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Status & Technician Controls */}
            <div className="lg:col-span-5 bg-white rounded-[26px] shadow-[0_20px_50px_rgba(49,27,146,0.10)] border border-white p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full bg-[#ebe6ff] text-[#4c24b5] flex items-center justify-center shrink-0">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    {isManagement ? "Manage Ticket" : "Ticket Progress"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {isManagement
                      ? "Update repair status and assign technicians"
                      : "Live status updates from property management"}
                  </p>
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                  Repair Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {STATUSES.map((s) => {
                    const active = c.status === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => saveChange("status", s, `Status updated to ${s}.`, setStatusError)}
                        disabled={!isManagement || active || Boolean(saving)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                          active
                            ? "bg-gradient-to-r from-[#4c24b5] to-[#6338d4] text-white border-transparent shadow-md shadow-indigo-900/20"
                            : isManagement
                              ? "bg-[#f7f6fd] hover:bg-[#efecfb] text-slate-700 border-indigo-100 cursor-pointer"
                              : "bg-slate-50 text-slate-400 border-slate-100 cursor-default"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Technician Assignment */}
              {isManagement ? (
                <form onSubmit={saveTech} className="space-y-3" noValidate>
                  <label
                    htmlFor="tech"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    Technician(s) Assigned
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="tech"
                      value={tech}
                      onChange={(event) => setTech(event.target.value)}
                      disabled={saving === "technician"}
                      placeholder="e.g. Mr. Bello, Mr. Ade"
                      className={`flex-1 rounded-xl bg-[#f7f6fd] border px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition ${
                        techError
                          ? "border-rose-500 ring-2 ring-rose-100"
                          : "border-indigo-100 focus:border-[#4c24b5] focus:ring-2 focus:ring-indigo-100"
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={Boolean(saving)}
                      className="px-5 py-2.5 rounded-xl bg-[#4c24b5] hover:bg-[#3f1c9c] text-white text-xs font-bold shadow-sm transition disabled:opacity-60 cursor-pointer"
                    >
                      {saving === "technician" ? "Saving..." : "Save"}
                    </button>
                  </div>
                  {techError && (
                    <p className="text-xs font-medium text-rose-600" role="alert">
                      {techError}
                    </p>
                  )}
                </form>
              ) : (
                <div className="rounded-2xl bg-[#f7f6fd] border border-indigo-100/80 p-4 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Assigned Technician(s)
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    {c.technician || "Awaiting technician assignment"}
                  </p>
                </div>
              )}
              {(message || statusError) && (
                <div
                  role={statusError ? "alert" : "status"}
                  className={`rounded-xl border px-4 py-3 text-xs font-semibold ${
                    statusError
                      ? "bg-rose-50 border-rose-200 text-rose-700"
                      : "bg-emerald-50 border-emerald-200 text-emerald-700"
                  }`}
                >
                  {statusError || `✓ ${message}`}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
