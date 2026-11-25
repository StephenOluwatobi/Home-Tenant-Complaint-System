import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CATEGORIES, COMPLAINT_LOAD_ERROR, UNITS, listComplaints } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { formatDate } from "../lib/validation.js";

const CATEGORY_STYLES = {
  Plumbing: "bg-indigo-100 text-indigo-700",
  Electrical: "bg-purple-100 text-purple-700",
  Structural: "bg-violet-100 text-violet-700",
  Appliance: "bg-fuchsia-100 text-fuchsia-700",
  Others: "bg-slate-100 text-slate-700",
};

export default function History() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [unitFilter, setUnitFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [search, setSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    listComplaints({ signal: controller.signal, status: "Resolved" }).then(setItems).catch(() => {
      if (!controller.signal.aborted) setLoadFailed(true);
    });
    return () => controller.abort();
  }, []);

  const handleLogout = () => {
    signOut();
    navigate("/");
  };

  // Live KPI stats
  const totalResolved = items ? items.length : 0;

  const thisMonthCount = useMemo(() => {
    if (!items) return 0;
    const now = new Date();
    return items.filter((c) => {
      const d = new Date(c.createdAt);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    }).length;
  }, [items]);

  const withTechnicianCount = useMemo(() => {
    if (!items) return 0;
    return items.filter((c) => (c.technician || "").trim().length > 0).length;
  }, [items]);

  // Filtered list (Unit + Category + Date Range + Search)
  const filteredItems = useMemo(() => {
    if (!items) return null;
    const now = Date.now();
    const q = search.trim().toLowerCase();

    return items.filter((c) => {
      if (unitFilter && c.unit !== Number(unitFilter)) return false;

      const cats = Array.isArray(c.category) ? c.category : [c.category];
      if (categoryFilter && !cats.includes(categoryFilter)) return false;

      if (dateRange === "7d") {
        if (now - new Date(c.createdAt).getTime() > 7 * 86400000) return false;
      } else if (dateRange === "30d") {
        if (now - new Date(c.createdAt).getTime() > 30 * 86400000) return false;
      }

      if (!q) return true;
      return (
        c.description.toLowerCase().includes(q) ||
        cats.join(" ").toLowerCase().includes(q) ||
        `unit ${c.unit}`.includes(q) ||
        c.id.toLowerCase().includes(q) ||
        (c.technician || "").toLowerCase().includes(q)
      );
    });
  }, [items, unitFilter, categoryFilter, dateRange, search]);

  const hasFilters = Boolean(
    unitFilter || categoryFilter || dateRange !== "all" || search,
  );

  const resetFilters = () => {
    setUnitFilter("");
    setCategoryFilter("");
    setDateRange("all");
    setSearch("");
  };

  // Export filtered resolved complaints to CSV
  const exportCsv = () => {
    if (!filteredItems || filteredItems.length === 0) return;
    const headers = [
      "Ticket ID",
      "Unit",
      "Category",
      "Issue Description",
      "Technician",
      "Date Reported",
      "Status",
    ];
    const rows = filteredItems.map((c) => {
      const cats = (Array.isArray(c.category) ? c.category : [c.category]).join(
        " / ",
      );
      const cleanDesc = `"${c.description.replace(/"/g, '""')}"`;
      const cleanTech = `"${(c.technician || "Unassigned").replace(/"/g, '""')}"`;
      return [
        c.id.toUpperCase(),
        `Unit ${c.unit}`,
        `"${cats}"`,
        cleanDesc,
        cleanTech,
        formatDate(c.createdAt),
        c.status,
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `AOH-Resolved-History-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex bg-[#f5f4fb] text-slate-900 font-sans">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden"
        />
      )}

      {/* Left Deep-Indigo Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-[240px] shrink-0 bg-gradient-to-b from-[#1a1045] via-[#211554] to-[#291a68] text-white flex flex-col justify-between transition-transform duration-200 overflow-hidden ${
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Subtle Bottom House Watermark */}
        <svg
          className="absolute bottom-0 left-0 w-56 h-48 text-indigo-400/10 pointer-events-none"
          viewBox="0 0 200 180"
          fill="currentColor"
        >
          <path d="M100 20L15 88h26v72h118V88h26L100 20zm-18 78h14v14H82V98zm22 0h14v14h-14V98zm-22 22h14v14H82v-14zm22 0h14v14h-14v-14z" />
        </svg>

        <div className="relative z-10 px-4 pt-6">
          {/* Top White House Emblem + Styled AOH Wordmark */}
          <Link
            to="/management"
            className="w-full group flex flex-col items-center text-center mb-7"
          >
            <svg className="w-12 h-11" viewBox="0 0 64 56" fill="none">
              <path
                d="M12 27L32 10L52 27"
                stroke="#ffffff"
                strokeWidth="3.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M18 24V42M46 24V42"
                stroke="#ffffff"
                strokeWidth="3.8"
                strokeLinecap="round"
              />
              <rect
                x="27"
                y="25"
                width="4"
                height="4"
                rx="0.6"
                fill="#c4b5fd"
              />
              <rect
                x="33"
                y="25"
                width="4"
                height="4"
                rx="0.6"
                fill="#c4b5fd"
              />
              <rect
                x="27"
                y="31"
                width="4"
                height="4"
                rx="0.6"
                fill="#c4b5fd"
              />
              <rect
                x="33"
                y="31"
                width="4"
                height="4"
                rx="0.6"
                fill="#c4b5fd"
              />
              <path
                d="M10 47C22 41 42 41 54 47"
                stroke="#a78bfa"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </svg>

            <span className="mt-1.5 text-[23px] font-black tracking-[0.22em] pl-[0.22em] bg-gradient-to-r from-white via-[#ddd6fe] to-[#a78bfa] bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(167,139,250,0.35)]">
              AOH
            </span>
            <span className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-[0.24em] pl-[0.24em] text-indigo-200/75">
              Management Systems
            </span>
          </Link>

          {/* Sidebar Nav Links */}
          <nav className="space-y-1.5">
            <Link
              to="/management"
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium text-indigo-100/80 hover:text-white hover:bg-white/10 transition"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
              <span>Dashboard</span>
            </Link>

            <Link
              to="/management"
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium text-indigo-100/80 hover:text-white hover:bg-white/10 transition"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.9"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>Complaints</span>
            </Link>

            <div className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm bg-gradient-to-r from-[#5a35d5] to-[#6d46e8] text-white font-semibold shadow-lg shadow-indigo-950/50">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <circle cx="12" cy="12" r="9" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4"
                />
              </svg>
              <span>Resolved History</span>
            </div>
          </nav>
        </div>

        {/* Bottom Logout Button */}
        <div className="relative z-10 px-4 pb-8 pt-6 border-t border-white/10">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium text-indigo-100/85 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.9"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top White Header Bar */}
        <header className="bg-white border-b border-slate-200/70 px-5 md:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Open menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Search Pill Input */}
            <div className="flex items-center w-full rounded-full bg-[#f1f2f7] px-4 py-2 text-sm focus-within:ring-2 focus-within:ring-indigo-200 focus-within:bg-white transition">
              <svg
                className="w-4 h-4 text-slate-500 mr-2.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search resolved complaints, units, or technicians..."
                className="w-full bg-transparent text-slate-800 placeholder:text-slate-400 focus:outline-none text-sm"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-xs text-slate-400 hover:text-slate-700 ml-1 cursor-pointer"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Right Admin Profile Pill */}
          <div className="flex items-center gap-3">
            <Link
              to="/management"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#f4f2ff] hover:bg-[#e8e3fe] text-[#4c24b5] text-xs font-bold transition"
            >
              ← Back to Dashboard
            </Link>

            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4c24b5] to-[#7c3aed] text-white font-bold text-xs flex items-center justify-center shadow-sm">
                AOH
              </div>
              <div className="hidden sm:block leading-tight">
                <span className="block text-xs font-bold text-slate-900">
                  Admin
                </span>
                <span className="block text-[11px] text-slate-500">
                  Management
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 p-5 md:p-7 max-w-7xl w-full mx-auto space-y-6">
          {/* Hero Banner with Building Photo (Matches Mockup) */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#dfd8fc] via-[#ebe6fe] to-[#d9d1fa] shadow-sm border border-white min-h-[155px] flex items-center">
            <div
              className="hidden sm:block absolute inset-y-0 right-0 w-[56%] bg-cover bg-center"
              style={{ backgroundImage: "url('/building.png')" }}
            />
            <div className="hidden sm:block absolute inset-y-0 right-0 w-[58%] bg-gradient-to-r from-[#e5dffd] via-[#e5dffd]/55 to-transparent" />

            <div className="relative z-10 p-6 md:p-8 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#4c24b5] text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-900/20">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl md:text-[32px] font-extrabold text-slate-900 tracking-tight">
                  Resolved History
                </h1>
                <p className="text-sm text-slate-700 mt-0.5">
                  View all completed and resolved complaints across Asiawu
                  Oyenihun Holdings.
                </p>
              </div>
            </div>
          </div>

          {/* Row 2: 3 Live Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#4c24b5] text-white flex items-center justify-center shrink-0">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900">
                  {totalResolved}
                </p>
                <p className="text-xs font-medium text-slate-500">
                  Total Resolved
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#ebe6ff] text-[#4c24b5] flex items-center justify-center shrink-0">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-extrabold text-slate-900">
                  This Month
                </p>
                <p className="text-xs font-semibold text-[#4c24b5]">
                  {thisMonthCount} Resolved
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-lg font-extrabold text-slate-900">
                  Artisans Logged
                </p>
                <p className="text-xs font-semibold text-emerald-600">
                  {withTechnicianCount} of {totalResolved} Tickets
                </p>
              </div>
            </div>
          </div>

          {/* Row 3: Filter Bar + Export CSV Button */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                aria-label="Filter by unit"
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
                className="rounded-xl bg-[#f7f6fd] border border-indigo-100 px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#4c24b5]"
              >
                <option value="">All Units</option>
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    Unit {u}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter by category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-xl bg-[#f7f6fd] border border-indigo-100 px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#4c24b5]"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter by date range"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="rounded-xl bg-[#f7f6fd] border border-indigo-100 px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#4c24b5]"
              >
                <option value="all">All Time</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>

              {hasFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={exportCsv}
              disabled={!filteredItems || filteredItems.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4c24b5] hover:bg-[#3f1c9c] text-white text-xs font-bold shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              <span>Export Report</span>
            </button>
          </div>

          {/* Row 4: Resolved Complaints Table Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#4c24b5] text-white flex items-center justify-center text-xs font-bold">
                  ✓
                </span>
                <h2 className="text-base font-extrabold text-slate-900">
                  Resolved Complaints
                </h2>
              </div>

              {filteredItems && (
                <span className="px-3 py-1 rounded-full bg-[#f4f2ff] text-xs font-bold text-[#4c24b5]">
                  {filteredItems.length}{" "}
                  {filteredItems.length === 1 ? "result" : "results"}
                </span>
              )}
            </div>

            {filteredItems === null && (
              <p className="py-10 text-center text-sm text-slate-500">
                {loadFailed ? COMPLAINT_LOAD_ERROR : "Loading resolved history..."}
              </p>
            )}

            {filteredItems?.length === 0 && (
              <div className="py-10 text-center border border-dashed border-slate-200 rounded-xl">
                <p className="font-bold text-slate-800">
                  {hasFilters
                    ? "No resolved complaints match your filters"
                    : "Nothing resolved yet"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {hasFilters
                    ? "Try resetting your filters to view all completed tickets."
                    : "Complaints appear here once management marks them Resolved."}
                </p>
              </div>
            )}

            {filteredItems && filteredItems.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 text-xs font-semibold text-slate-500">
                      <th className="py-3 pr-2">#</th>
                      <th className="py-3 px-2.5">Ticket ID</th>
                      <th className="py-3 px-2.5">Unit</th>
                      <th className="py-3 px-2.5">Category</th>
                      <th className="py-3 px-2.5">Issue Description</th>
                      <th className="py-3 px-2.5">Technician</th>
                      <th className="py-3 px-2.5">Date</th>
                      <th className="py-3 px-2.5">Status</th>
                      <th className="py-3 pl-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredItems.map((c, idx) => (
                      <tr
                        key={c.id}
                        onClick={() =>
                          navigate(`/management/complaints/${c.id}`)
                        }
                        className="hover:bg-indigo-50/40 transition cursor-pointer group"
                      >
                        <td className="py-3.5 pr-2 text-xs font-semibold text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-2.5 whitespace-nowrap font-mono text-xs font-bold text-slate-600">
                          #{c.id.toUpperCase()}
                        </td>
                        <td className="py-3.5 px-2.5 whitespace-nowrap text-xs font-bold text-slate-800">
                          Unit {c.unit}
                        </td>
                        <td className="py-3.5 px-2.5">
                          <div className="flex flex-wrap gap-1">
                            {(Array.isArray(c.category)
                              ? c.category
                              : [c.category]
                            ).map((cat) => (
                              <span
                                key={cat}
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                  CATEGORY_STYLES[cat] ||
                                  "bg-indigo-100 text-indigo-700"
                                }`}
                              >
                                {cat}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-2.5 max-w-[240px]">
                          <div className="flex items-center gap-2.5">
                            {c.photo && (
                              <img
                                src={c.photo}
                                alt=""
                                className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                              />
                            )}
                            <p className="font-semibold text-slate-900 line-clamp-2">
                              {c.description}
                            </p>
                          </div>
                        </td>
                        <td className="py-3.5 px-2.5 whitespace-nowrap text-xs font-semibold text-slate-700">
                          {c.technician || (
                            <span className="text-slate-400 font-normal">
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-2.5 whitespace-nowrap text-xs text-slate-500">
                          {formatDate(c.createdAt)}
                        </td>
                        <td className="py-3.5 px-2.5 whitespace-nowrap">
                          <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
                            Resolved
                          </span>
                        </td>
                        <td className="py-3.5 pl-2 text-right whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f4f2ff] group-hover:bg-[#4c24b5] text-[#4c24b5] group-hover:text-white text-xs font-bold transition">
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            <span>View</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
