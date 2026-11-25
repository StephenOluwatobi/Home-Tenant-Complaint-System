import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { COMPLAINT_LOAD_ERROR, getPropertySettings, listAnnouncements, listComplaints } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { formatDate } from "../lib/validation.js";
import { ANNOUNCEMENT_LOAD_ERROR, EMPTY_ANNOUNCEMENTS } from "../lib/announcementOptions.js";

const STATUS_STYLES = {
  Pending: "bg-amber-100 text-amber-700",
  "In-Progress": "bg-sky-100 text-sky-700",
  Resolved: "bg-emerald-100 text-emerald-700",
};

const CATEGORY_STYLES = {
  Plumbing: "bg-indigo-100 text-indigo-700",
  Electrical: "bg-purple-100 text-purple-700",
  Structural: "bg-violet-100 text-violet-700",
  Appliance: "bg-fuchsia-100 text-fuchsia-700",
  Others: "bg-slate-100 text-slate-700",
};

const formatNoticeDate = (iso) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default function TenantDashboard() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementError, setAnnouncementError] = useState(false);
  const [propertySettings, setPropertySettings] = useState(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [statusFilter, setStatusFilter] = useState("All");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setItems(null);
    setLoadFailed(false);
    listComplaints({ signal: controller.signal }).then(setItems).catch(() => {
      if (!controller.signal.aborted) setLoadFailed(true);
    });
    return () => controller.abort();
  }, [session.unit]);

  useEffect(() => {
    const controller = new AbortController();
    setAnnouncements([]);
    setAnnouncementError(false);
    listAnnouncements({ signal: controller.signal }).then(setAnnouncements).catch(() => {
      if (!controller.signal.aborted) setAnnouncementError(true);
    });
    return () => controller.abort();
  }, [session.unit]);

  useEffect(() => {
    if (activeTab !== "unit") return;
    const controller = new AbortController();
    getPropertySettings({ signal: controller.signal }).then(setPropertySettings).catch(() => {
      if (!controller.signal.aborted) setPropertySettings(null);
    });
    return () => controller.abort();
  }, [activeTab, session.unit]);

  const noticeMessage = announcementError ? ANNOUNCEMENT_LOAD_ERROR : EMPTY_ANNOUNCEMENTS;

  const handleLogout = () => {
    signOut();
    navigate("/");
  };

  // Live metrics computed directly from unit's complaints
  const totalCount = items ? items.length : 0;
  const inProgressCount = items
    ? items.filter((c) => c.status === "In-Progress").length
    : 0;
  const resolvedCount = items
    ? items.filter((c) => c.status === "Resolved").length
    : 0;
  const pendingCount = items
    ? items.filter((c) => c.status === "Pending").length
    : 0;

  // Search + Status filter (supports both single string and multi-category arrays)
  const filteredItems = items
    ? items.filter((c) => {
        const matchesStatus =
          activeTab !== "complaints" ||
          statusFilter === "All" ||
          c.status === statusFilter;
        const q = search.trim().toLowerCase();
        if (!q) return matchesStatus;
        const cats = Array.isArray(c.category)
          ? c.category.join(" ")
          : c.category;
        return (
          matchesStatus &&
          (c.description.toLowerCase().includes(q) ||
            cats.toLowerCase().includes(q) ||
            c.status.toLowerCase().includes(q))
        );
      })
    : null;

  const displayedItems =
    activeTab === "complaints" ? filteredItems : filteredItems?.slice(0, 4);

  const openFilteredComplaints = (status = "All") => {
    setStatusFilter(status);
    setActiveTab("complaints");
  };

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      action: () => {
        setStatusFilter("All");
        setActiveTab("dashboard");
      },
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      ),
    },
    {
      id: "complaints",
      label: "My Complaints",
      action: () => openFilteredComplaints("All"),
      icon: (
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
      ),
    },
    {
      id: "new",
      label: "New Complaint",
      action: () => navigate("/tenant/new"),
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.9"
        >
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" d="M12 8v8m-4-4h8" />
        </svg>
      ),
    },
    {
      id: "announcements",
      label: "Announcements",
      action: () => setActiveTab("announcements"),
      icon: (
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
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      ),
    },
    {
      id: "unit",
      label: "My Unit",
      action: () => setActiveTab("unit"),
      icon: (
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
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
  ];

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
        {/* Subtle Bottom House Watermark inside Sidebar */}
        <svg
          className="absolute bottom-0 left-0 w-56 h-48 text-indigo-400/10 pointer-events-none"
          viewBox="0 0 200 180"
          fill="currentColor"
        >
          <path d="M100 20L15 88h26v72h118V88h26L100 20zm-18 78h14v14H82V98zm22 0h14v14h-14V98zm-22 22h14v14H82v-14zm22 0h14v14h-14v-14z" />
        </svg>

        <div className="relative z-10 px-4 pt-6">
          {/* Top White House Emblem + Styled AOH Wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab("dashboard")}
            className="w-full group flex flex-col items-center text-center mb-7 cursor-pointer"
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
          </button>

          {/* Sidebar Nav Items */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    item.action();
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-[#5a35d5] to-[#6d46e8] text-white font-semibold shadow-lg shadow-indigo-950/50"
                      : "text-indigo-100/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
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
            {/* Mobile Hamburger Button */}
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
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (activeTab !== "dashboard" && activeTab !== "complaints") {
                    setActiveTab("complaints");
                  }
                }}
                placeholder="Search complaints..."
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

          {/* Right Notification Bell & Unit Profile Badge */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveTab("announcements")}
              className="relative p-2 rounded-full text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              aria-label="View all announcements"
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
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {announcements.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("unit")}
              className="flex items-center gap-2.5 pl-2 border-l border-slate-200 text-left hover:opacity-85 transition cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4c24b5] to-[#7c3aed] text-white font-bold text-sm flex items-center justify-center shadow-sm">
                U{session.unit}
              </div>
              <div className="hidden sm:block leading-tight">
                <span className="block text-xs font-bold text-slate-900">
                  Unit {session.unit}
                </span>
                <span className="block text-[11px] text-slate-500">
                  Resident
                </span>
              </div>
            </button>
          </div>
        </header>

        {/* TAB VIEW: ANNOUNCEMENTS */}
        {activeTab === "announcements" && (
          <main className="flex-1 p-5 md:p-7 max-w-5xl w-full mx-auto space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <button
                  type="button"
                  onClick={() => setActiveTab("dashboard")}
                  className="text-xs font-bold text-[#4c24b5] hover:underline cursor-pointer"
                >
                  ← Back to Dashboard
                </button>
                <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
                  Estate Announcements
                </h1>
                <p className="text-sm text-slate-500">
                  Official notices from Asiawu Oyenihun Holdings Management
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {announcements.length === 0 && (
                <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-slate-200">
                  <p className="font-bold text-slate-800">{noticeMessage}</p>
                </div>
              )}
              {announcements.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#4c24b5]" />
                      <h2 className="text-base font-extrabold text-slate-900">
                        {item.title}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-[#4c24b5]">
                        {item.tag}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-slate-400">
                      {formatNoticeDate(item.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 mt-3 leading-relaxed">
                    {item.details}
                  </p>
                </div>
              ))}
            </div>
          </main>
        )}

        {/* TAB VIEW: MY UNIT DETAILS */}
        {activeTab === "unit" && (
          <main className="flex-1 p-5 md:p-7 max-w-5xl w-full mx-auto space-y-6">
            <div>
              <button
                type="button"
                onClick={() => setActiveTab("dashboard")}
                className="text-xs font-bold text-[#4c24b5] hover:underline cursor-pointer"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
                Unit {session.unit} Overview
              </h1>
              <p className="text-sm text-slate-500">
                Property and maintenance details for your apartment
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              <div className="md:col-span-7 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
                <div className="h-44 rounded-xl overflow-hidden bg-slate-100">
                  <img
                    src="/building.png"
                    alt="Asiawu Oyenihun Holdings"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 text-sm">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">
                      Apartment Unit
                    </p>
                    <p className="font-bold text-slate-900 mt-0.5">
                      Unit {session.unit} (of 5 Units)
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">
                      Property Name
                    </p>
                    <p className="font-bold text-slate-900 mt-0.5">
                      {propertySettings?.propertyName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">
                      Location
                    </p>
                    <p className="font-bold text-slate-900 mt-0.5">
                      {propertySettings?.propertyAddress}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">
                      Portal Status
                    </p>
                    <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                      Active Resident
                    </span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between space-y-5">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Maintenance Support
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Need urgent repairs or password assistance? Submit a ticket
                    or switch to another unit below.
                  </p>

                  <div className="mt-4 p-4 rounded-xl bg-[#f5f4fb] space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">
                        Total Reports Filed
                      </span>
                      <span className="font-bold text-slate-900">
                        {totalCount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Open Tickets</span>
                      <span className="font-bold text-amber-600">
                        {pendingCount + inProgressCount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Resolved Tickets</span>
                      <span className="font-bold text-emerald-600">
                        {resolvedCount}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Link
                    to="/tenant/new"
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-[#4c24b5] hover:bg-[#3f1c9c] text-white text-xs font-bold transition"
                  >
                    + Report a New Fault
                  </Link>
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="w-full py-2.5 px-4 rounded-full bg-[#f1effc] hover:bg-[#e5e0fa] text-[#4c24b5] text-xs font-bold transition cursor-pointer"
                  >
                    Switch Unit
                  </button>
                </div>
              </div>
            </div>
          </main>
        )}

        {/* TAB VIEW: DASHBOARD & MY COMPLAINTS */}
        {(activeTab === "dashboard" || activeTab === "complaints") && (
          <main className="flex-1 p-5 md:p-7 max-w-7xl w-full mx-auto space-y-6">
            {/* Row 1: Hero Welcome Banner + Your Unit Card (Shown on Dashboard tab) */}
            {activeTab === "dashboard" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left Welcome Banner with Building Photo */}
                <div className="lg:col-span-8 relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#dfd8fc] via-[#ebe6fe] to-[#d9d1fa] shadow-sm border border-white min-h-[175px] flex items-center">
                  <div
                    className="hidden sm:block absolute inset-y-0 right-0 w-[56%] bg-cover bg-center"
                    style={{ backgroundImage: "url('/building.png')" }}
                  />
                  <div className="hidden sm:block absolute inset-y-0 right-0 w-[58%] bg-gradient-to-r from-[#e5dffd] via-[#e5dffd]/55 to-transparent" />

                  <div className="relative z-10 p-6 md:p-8 max-w-md">
                    <h1 className="text-2xl md:text-[28px] font-extrabold text-slate-900 tracking-tight">
                      Welcome back, Unit {session.unit}! 👋
                    </h1>
                    <p className="text-sm text-slate-700 mt-1">
                      Here&apos;s what&apos;s happening with your apartment.
                    </p>
                    <Link
                      to="/tenant/new"
                      className="inline-flex items-center gap-2 mt-5 bg-[#4c24b5] hover:bg-[#3e1c99] text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-md shadow-indigo-900/20 transition"
                    >
                      <span>Report a Complaint</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>

                {/* Right "Your Unit" Card */}
                <div className="lg:col-span-4 relative rounded-2xl bg-white p-6 shadow-sm border border-slate-100 overflow-hidden flex flex-col justify-between min-h-[175px]">
                  <div
                    className="absolute inset-y-0 right-0 w-[46%] bg-cover bg-center opacity-90"
                    style={{ backgroundImage: "url('/building.png')" }}
                  />
                  <div className="absolute inset-y-0 right-0 w-[48%] bg-gradient-to-r from-white via-white/70 to-transparent" />

                  <div className="relative z-10">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                      <svg
                        className="w-5 h-5 text-[#4c24b5]"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z" />
                      </svg>
                      <span>Your Unit</span>
                    </div>

                    <div className="mt-3">
                      <p className="text-2xl font-extrabold text-slate-900">
                        Unit {session.unit}
                      </p>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">
                        Asiawu Oyenihun Holdings
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab("unit")}
                      className="inline-flex items-center gap-1.5 mt-4 bg-[#ebe6ff] hover:bg-[#dfd7ff] text-[#4c24b5] text-xs font-bold px-4 py-2 rounded-full transition cursor-pointer"
                    >
                      <span>View Details</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Row 2: 4 Clickable KPI Status Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                type="button"
                onClick={() => openFilteredComplaints("All")}
                className="bg-white hover:ring-2 hover:ring-[#4c24b5]/30 rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4 text-left transition cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-[#4c24b5] text-white flex items-center justify-center shrink-0">
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-slate-900">
                    {totalCount}
                  </p>
                  <p className="text-xs font-medium text-slate-500">
                    Total Complaints
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => openFilteredComplaints("In-Progress")}
                className="bg-white hover:ring-2 hover:ring-sky-400/40 rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4 text-left transition cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 7v5l3 2"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-slate-900">
                    {inProgressCount}
                  </p>
                  <p className="text-xs font-medium text-slate-500">
                    In Progress
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => openFilteredComplaints("Resolved")}
                className="bg-white hover:ring-2 hover:ring-emerald-400/40 rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4 text-left transition cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
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
                    {resolvedCount}
                  </p>
                  <p className="text-xs font-medium text-slate-500">Resolved</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => openFilteredComplaints("Pending")}
                className="bg-white hover:ring-2 hover:ring-amber-400/40 rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4 text-left transition cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-amber-400 text-white flex items-center justify-center shrink-0">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.2"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-slate-900">
                    {pendingCount}
                  </p>
                  <p className="text-xs font-medium text-slate-500">
                    Pending Response
                  </p>
                </div>
              </button>
            </div>

            {/* Row 3: Complaints Table + Announcements */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: Complaints Table + Quick Actions */}
              <div
                className={`${activeTab === "complaints" ? "lg:col-span-12" : "lg:col-span-8"} space-y-5`}
              >
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2.5">
                      <svg
                        className="w-5 h-5 text-[#4c24b5]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <h2 className="text-base font-extrabold text-slate-900">
                        {activeTab === "complaints"
                          ? `All Unit ${session.unit} Complaints`
                          : "Recent Complaints"}
                      </h2>
                    </div>

                    {activeTab === "complaints" ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {["All", "Pending", "In-Progress", "Resolved"].map(
                          (st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => setStatusFilter(st)}
                              className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                                statusFilter === st
                                  ? "bg-[#4c24b5] text-white"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              {st}
                            </button>
                          ),
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openFilteredComplaints("All")}
                        className="text-xs font-bold text-[#4c24b5] hover:underline cursor-pointer"
                      >
                        View All →
                      </button>
                    )}
                  </div>

                  {displayedItems === null && (
                    <p className="py-8 text-center text-sm text-slate-500">
                      {loadFailed ? COMPLAINT_LOAD_ERROR : "Loading complaints..."}
                    </p>
                  )}

                  {displayedItems?.length === 0 && (
                    <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl">
                      <p className="font-bold text-slate-800">
                        No complaints found
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {search || statusFilter !== "All"
                          ? "Try clearing your search or status filter."
                          : "When something breaks, report it here."}
                      </p>
                    </div>
                  )}

                  {displayedItems && displayedItems.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200/80 text-xs font-semibold text-slate-500">
                            <th className="py-3 pr-3">#</th>
                            <th className="py-3 px-3">Issue</th>
                            <th className="py-3 px-3">Category</th>
                            <th className="py-3 px-3">Status</th>
                            <th className="py-3 px-3">Date</th>
                            <th className="py-3 pl-2 text-right"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {displayedItems.map((c, idx) => (
                            <tr
                              key={c.id}
                              onClick={() =>
                                navigate(`/tenant/complaints/${c.id}`)
                              }
                              className="hover:bg-indigo-50/40 transition cursor-pointer group"
                            >
                              <td className="py-3.5 pr-3 font-medium text-slate-500">
                                {idx + 1}
                              </td>
                              <td className="py-3.5 px-3 font-semibold text-slate-900 max-w-[260px]">
                                <p className="line-clamp-2">{c.description}</p>
                              </td>
                              <td className="py-3.5 px-3">
                                <div className="flex flex-wrap gap-1">
                                  {(Array.isArray(c.category)
                                    ? c.category
                                    : [c.category]
                                  ).map((cat) => (
                                    <span
                                      key={cat}
                                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                        CATEGORY_STYLES[cat] ||
                                        "bg-indigo-100 text-indigo-700"
                                      }`}
                                    >
                                      {cat}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="py-3.5 px-3 whitespace-nowrap">
                                <span
                                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                    STATUS_STYLES[c.status] ||
                                    "bg-slate-100 text-slate-700"
                                  }`}
                                >
                                  {c.status}
                                </span>
                              </td>
                              <td className="py-3.5 px-3 whitespace-nowrap text-xs font-medium text-slate-600">
                                {formatDate(c.createdAt)}
                              </td>
                              <td className="py-3.5 pl-2 text-right text-slate-400 group-hover:text-[#4c24b5] font-bold">
                                ›
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Quick Actions Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-2 mb-4">
                    <svg
                      className="w-5 h-5 text-[#4c24b5]"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
                    </svg>
                    <h2 className="text-base font-extrabold text-slate-900">
                      Quick Actions
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <Link
                      to="/tenant/new"
                      className="flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#4c24b5] to-[#6338d4] hover:from-[#5832c9] hover:to-[#7044e3] text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-900/15 transition"
                    >
                      <span className="w-5 h-5 rounded-full bg-white text-[#4c24b5] flex items-center justify-center font-extrabold text-sm leading-none">
                        +
                      </span>
                      <span>Report a Complaint</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => openFilteredComplaints("All")}
                      className="flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl bg-[#f2f0fc] hover:bg-[#e7e2fb] text-slate-800 text-xs sm:text-sm font-bold transition cursor-pointer"
                    >
                      <svg
                        className="w-4 h-4 text-[#4c24b5]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span>View My Complaints</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("unit")}
                      className="flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl bg-[#f2f0fc] hover:bg-[#e7e2fb] text-slate-800 text-xs sm:text-sm font-bold transition cursor-pointer"
                    >
                      <svg
                        className="w-4 h-4 text-[#4c24b5]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3"
                        />
                      </svg>
                      <span>View Unit Details</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Announcements Card (Shown on Dashboard tab) */}
              {activeTab === "dashboard" && (
                <div className="lg:col-span-4 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-[#4c24b5]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                        />
                      </svg>
                      <h2 className="text-base font-extrabold text-slate-900">
                        Announcements
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("announcements")}
                      className="text-xs font-bold text-[#4c24b5] hover:underline cursor-pointer"
                    >
                      View All →
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {announcements.length === 0 && <p className="text-xs text-slate-500">{noticeMessage}</p>}
                    {announcements.slice(0, 2).map((item, i) => (
                      <div
                        key={item.id}
                        onClick={() => setActiveTab("announcements")}
                        className={`${i === 0 ? "pb-4" : "pt-4"} cursor-pointer group`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#4c24b5] shrink-0" />
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#4c24b5] transition">
                            {item.title}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed pl-4 line-clamp-2">
                          {item.details}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2 pl-4">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect x="3" y="4" width="18" height="18" rx="2" />
                            <path d="M16 2v4M8 2v4M3 10h18" />
                          </svg>
                          <span>{formatNoticeDate(item.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
