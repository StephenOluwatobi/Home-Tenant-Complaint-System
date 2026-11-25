import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CATEGORIES,
  COMPLAINT_LOAD_ERROR,
  STATUSES,
  UNITS,
  addAnnouncement,
  changeManagementPassword,
  deleteAnnouncement,
  getPropertySettings,
  listAnnouncements,
  listComplaints,
  listTenants,
  removeTenant,
  updateManagementProfile,
  upsertTenant,
} from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { formatDate } from "../lib/validation.js";
import { ANNOUNCEMENT_TAGS, EMPTY_ANNOUNCEMENTS } from "../lib/announcementOptions.js";

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

const CATEGORY_COLORS = {
  Plumbing: { hex: "#4c24b5", dot: "bg-[#4c24b5]" },
  Electrical: { hex: "#0ea5e9", dot: "bg-sky-500" },
  Structural: { hex: "#f59e0b", dot: "bg-amber-500" },
  Appliance: { hex: "#10b981", dot: "bg-emerald-500" },
  Others: { hex: "#a78bfa", dot: "bg-violet-400" },
};

export default function ManagementDashboard() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [tenantDirectoryReady, setTenantDirectoryReady] = useState(false);
  const [tenantDirectoryError, setTenantDirectoryError] = useState("");

  // Announcement form state
  const [annTitle, setAnnTitle] = useState("");
  const [annTag, setAnnTag] = useState("Maintenance");
  const [annDetails, setAnnDetails] = useState("");
  const [annError, setAnnError] = useState("");
  const [annMessage, setAnnMessage] = useState("");
  const [annMutation, setAnnMutation] = useState("");
  const [announcementsReady, setAnnouncementsReady] = useState(false);
  const announcementAttempt = useRef(null);

  // Tenant provisioning form state
  const [tenantUnit, setTenantUnit] = useState(1);
  const [tenantName, setTenantName] = useState("");
  const [tenantContact, setTenantContact] = useState("");
  const [tenantPassword, setTenantPassword] = useState("");
  const [showTenantPw, setShowTenantPw] = useState(false);
  const [tenantError, setTenantError] = useState("");
  const [tenantSuccess, setTenantSuccess] = useState("");
  const [savingTenant, setSavingTenant] = useState(false);
  const [copiedUnit, setCopiedUnit] = useState(null);
  const [issuedPassword, setIssuedPassword] = useState(null);
  const [revealedPassword, setRevealedPassword] = useState(false);
  const [editingOccupancyId, setEditingOccupancyId] = useState(null);
  const tenantAttempt = useRef(null);

  // Management Settings & Password state
  const [adminName, setAdminName] = useState("Landlord / Management");
  const [adminEmail, setAdminEmail] = useState("");
  const [propertyName, setPropertyName] = useState("Asiawu Oyenihun Holdings");
  const [propertyAddress, setPropertyAddress] = useState(
    "Ahindero Area, Fate/Tanke, Ilorin",
  );
  const [contactPhone, setContactPhone] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileReady, setProfileReady] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showMgmtPasswords, setShowMgmtPasswords] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  const [unit, setUnit] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    listComplaints({ signal: controller.signal }).then(setItems).catch(() => {
      if (!controller.signal.aborted) setLoadFailed(true);
    });
    listAnnouncements({ signal: controller.signal })
      .then(setAnnouncements)
      .catch((error) => {
        if (!controller.signal.aborted) setAnnError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setAnnouncementsReady(true);
      });
    getPropertySettings({ signal: controller.signal }).then((profile) => {
      setAdminName(profile.adminName);
      setAdminEmail(profile.adminEmail || "");
      setPropertyName(profile.propertyName);
      setPropertyAddress(profile.propertyAddress);
      setContactPhone(profile.contactPhone);
      setProfileReady(true);
    }).catch((error) => {
      if (!controller.signal.aborted) setProfileError(error.message);
    });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (activeTab !== "tenants" && activeTab !== "units") return;
    const controller = new AbortController();
    setTenantDirectoryReady(false);
    setTenantDirectoryError("");
    listTenants({ signal: controller.signal })
      .then((rows) => {
        if (controller.signal.aborted) return;
        setTenants(rows);
        setTenantDirectoryReady(true);
      })
      .catch(() => {
        if (!controller.signal.aborted) setTenantDirectoryError("Unable to load tenant accounts. Please try again.");
      });
    return () => controller.abort();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "tenants") return;
    setIssuedPassword(null);
    setRevealedPassword(false);
    setTenantPassword("");
    setShowTenantPw(false);
    tenantAttempt.current = null;
  }, [activeTab, issuedPassword]);

  const handleLogout = () => {
    signOut();
    navigate("/");
  };

  const refreshAnnouncementsAfterError = async (error) => {
    setAnnError(error.message);
    try {
      setAnnouncements(await listAnnouncements());
    } catch {
      // Keep the last confirmed feed if it cannot be read.
    }
  };

  const handlePostAnnouncement = async (event) => {
    event.preventDefault();
    if (annMutation || !announcementsReady) return;
    const title = annTitle.trim();
    const details = annDetails.trim();
    if ([...title].length < 3) {
      setAnnError("Enter an announcement title (at least 3 characters).");
      return;
    }
    if ([...details].length < 10) {
      setAnnError("Write a clear notice message (at least 10 characters).");
      return;
    }
    setAnnError("");
    setAnnMessage("");
    setAnnMutation("post");
    try {
      const input = JSON.stringify([title, annTag, details]);
      if (announcementAttempt.current?.input !== input) {
        announcementAttempt.current = { input, id: crypto.randomUUID() };
      }
      const created = await addAnnouncement({ id: announcementAttempt.current.id, title, tag: annTag, details });
      setAnnouncements((previous) => [created, ...previous.filter(({ id }) => id !== created.id)]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)));
      announcementAttempt.current = null;
      setAnnTitle((current) => current === annTitle ? "" : current);
      setAnnDetails((current) => current === annDetails ? "" : current);
      setAnnMessage("Announcement published to all 5 units.");
    } catch (error) {
      await refreshAnnouncementsAfterError(error);
    } finally {
      setAnnMutation("");
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (annMutation) return;
    setAnnError("");
    setAnnMessage("");
    setAnnMutation("delete");
    try {
      await deleteAnnouncement(id);
      setAnnouncements((previous) => previous.filter((notice) => notice.id !== id));
    } catch (error) {
      await refreshAnnouncementsAfterError(error);
    } finally {
      setAnnMutation("");
    }
  };

  const handleSaveTenant = async (event) => {
    event.preventDefault();
    if (savingTenant || !tenantDirectoryReady) return;
    setTenantError("");
    setTenantSuccess("");
    setSavingTenant(true);
    try {
      const details = {
        unit: tenantUnit,
        fullName: tenantName.trim(),
        contact: tenantContact.trim(),
        password: tenantPassword.trim(),
      };
      if (editingOccupancyId) {
        details.occupancyId = editingOccupancyId;
      } else {
        const input = JSON.stringify(details);
        if (tenantAttempt.current?.input !== input) {
          tenantAttempt.current = { input, id: crypto.randomUUID() };
        }
        details.requestId = tenantAttempt.current.id;
      }
      const saved = await upsertTenant(details);
      setTenants((previous) => [...previous.filter((tenant) => tenant.unit !== saved.unit), saved]);
      setEditingOccupancyId(saved.id);
      setTenantName(saved.fullName);
      setTenantContact(saved.contact);
      setTenantPassword("");
      setShowTenantPw(false);
      tenantAttempt.current = null;
      if (details.password) {
        setIssuedPassword({ occupancyId: saved.id, value: details.password });
        setRevealedPassword(false);
        setCopiedUnit(null);
      }
      setTenantSuccess(details.password
        ? `Unit ${saved.unit} account ${editingOccupancyId ? "updated" : "registered"} for ${saved.fullName}. Copy the credentials below to share with the tenant.`
        : `Unit ${saved.unit} tenant details updated.`);
    } catch (err) {
      setTenantError(err.message);
    } finally {
      setSavingTenant(false);
    }
  };

  const openTenantForm = (unitNumber, tenant) => {
    setTenantUnit(unitNumber);
    setEditingOccupancyId(tenant?.id ?? null);
    setTenantName(tenant?.fullName ?? "");
    setTenantContact(tenant?.contact ?? "");
    setTenantPassword("");
    setShowTenantPw(false);
    setTenantError("");
    setTenantSuccess("");
    tenantAttempt.current = null;
    setActiveTab("tenants");
  };

  const handleVacateUnit = async (tenant) => {
    if (savingTenant || !tenantDirectoryReady) return;
    setTenantError("");
    setTenantSuccess("");
    setSavingTenant(true);
    try {
      await removeTenant(tenant);
      if (tenantUnit === tenant.unit) openTenantForm(tenant.unit);
      setTenants((previous) => previous.filter((record) => record.id !== tenant.id));
      setIssuedPassword((previous) => previous?.occupancyId === tenant.id ? null : previous);
      setTenantSuccess(`Unit ${tenant.unit} marked as vacant and login revoked.`);
    } catch (err) {
      setTenantError(err.message);
    } finally {
      setSavingTenant(false);
    }
  };

  const handleCopyCredentials = async (tenant, password) => {
    const loginUrl = `${window.location.origin}/unit/${tenant.unit}/login`;
    const msg = `AOH Management Systems — Tenant Portal Login\nTenant: ${tenant.fullName}\nApartment: Unit ${tenant.unit}\nLogin Link: ${loginUrl}\nPassword: ${password}`;
    try {
      await navigator.clipboard.writeText(msg);
      setCopiedUnit(tenant.unit);
      setTimeout(() => setCopiedUnit(null), 2500);
    } catch {
      setTenantError("Unable to copy the login information.");
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileReady || savingProfile) return;
    setProfileError("");
    setProfileSuccess("");
    setSavingProfile(true);
    try {
      const updated = await updateManagementProfile({
        adminName,
        adminEmail,
        propertyName,
        propertyAddress,
        contactPhone,
      });
      setAdminName(updated.adminName);
      setAdminEmail(updated.adminEmail || "");
      setPropertyName(updated.propertyName);
      setPropertyAddress(updated.propertyAddress);
      setContactPhone(updated.contactPhone);
      setProfileSuccess("Property & administrator details updated.");
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");
    setSavingPw(true);
    try {
      await changeManagementPassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwSuccess(
        "Management password updated! Use your new password the next time you log in.",
      );
    } catch (err) {
      setPwError(err.message);
    } finally {
      setSavingPw(false);
    }
  };

  const counts = useMemo(
    () =>
      Object.fromEntries(
        STATUSES.map((s) => [
          s,
          (items || []).filter((c) => c.status === s).length,
        ]),
      ),
    [items],
  );
  const totalCount = items ? items.length : 0;

  const categoryStats = useMemo(() => {
    const list = items || [];
    const rawCounts = Object.fromEntries(CATEGORIES.map((cat) => [cat, 0]));
    let totalMentions = 0;

    list.forEach((c) => {
      const cats = Array.isArray(c.category) ? c.category : [c.category];
      cats.forEach((cat) => {
        if (rawCounts[cat] !== undefined) {
          rawCounts[cat] += 1;
          totalMentions += 1;
        }
      });
    });

    let cumulative = 0;
    return CATEGORIES.map((cat) => {
      const count = rawCounts[cat];
      const pct = totalMentions > 0 ? (count / totalMentions) * 100 : 0;
      const start = cumulative;
      cumulative += pct;
      return {
        category: cat,
        count,
        pct,
        start,
        color: CATEGORY_COLORS[cat],
      };
    });
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!items) return null;
    const q = search.trim().toLowerCase();
    return items.filter((c) => {
      if (unit && c.unit !== Number(unit)) return false;
      if (status && c.status !== status) return false;
      if (!q) return true;
      const cats = Array.isArray(c.category)
        ? c.category.join(" ")
        : c.category;
      return (
        c.description.toLowerCase().includes(q) ||
        cats.toLowerCase().includes(q) ||
        c.status.toLowerCase().includes(q) ||
        `unit ${c.unit}`.includes(q) ||
        (c.technician || "").toLowerCase().includes(q)
      );
    });
  }, [items, unit, status, search]);

  const displayedItems =
    activeTab === "complaints" ? filteredItems : filteredItems?.slice(0, 5);

  const openFilteredComplaints = ({ nextStatus = "", nextUnit = "" } = {}) => {
    setStatus(nextStatus);
    setUnit(nextUnit);
    setActiveTab("complaints");
  };

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      action: () => {
        setStatus("");
        setUnit("");
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
      label: "Complaints",
      action: () => setActiveTab("complaints"),
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
      id: "tenants",
      label: "Tenants",
      action: () => {
        setTenantError("");
        setTenantSuccess("");
        setActiveTab("tenants");
      },
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
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
    {
      id: "units",
      label: "Units (1–5)",
      action: () => setActiveTab("units"),
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
            d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
          />
        </svg>
      ),
    },
    {
      id: "history",
      label: "Resolved History",
      action: () => navigate("/management/history"),
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
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      id: "settings",
      label: "Settings",
      action: () => {
        setPwError("");
        setPwSuccess("");
        setProfileError("");
        setProfileSuccess("");
        setActiveTab("settings");
      },
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
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
    },
  ];

  const radius = 38;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="min-h-screen flex bg-[#f5f4fb] text-slate-900 font-sans">
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
        <svg
          className="absolute bottom-0 left-0 w-56 h-48 text-indigo-400/10 pointer-events-none"
          viewBox="0 0 200 180"
          fill="currentColor"
        >
          <path d="M100 20L15 88h26v72h118V88h26L100 20zm-18 78h14v14H82V98zm22 0h14v14h-14V98zm-22 22h14v14H82v-14zm22 0h14v14h-14v-14z" />
        </svg>

        <div className="relative z-10 px-4 pt-6">
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
              <rect x="27" y="25" width="4" height="4" rx="0.6" fill="#c4b5fd" />
              <rect x="33" y="25" width="4" height="4" rx="0.6" fill="#c4b5fd" />
              <rect x="27" y="31" width="4" height="4" rx="0.6" fill="#c4b5fd" />
              <rect x="33" y="31" width="4" height="4" rx="0.6" fill="#c4b5fd" />
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
                placeholder="Search units, complaints or technicians..."
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

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => openFilteredComplaints({ nextStatus: "Pending" })}
              className="relative p-2 rounded-full text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Pending complaints"
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
                {counts.Pending || 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              title="Account Settings & Password"
              className="flex items-center gap-2.5 pl-2 border-l border-slate-200 hover:opacity-85 transition cursor-pointer text-left"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4c24b5] to-[#7c3aed] text-white font-bold text-xs flex items-center justify-center shadow-sm">
                AOH
              </div>
              <div className="hidden sm:block leading-tight">
                <span className="block text-xs font-bold text-slate-900">
                  {adminName}
                </span>
                <span className="block text-[11px] text-slate-500">
                  {adminEmail || "Settings & Security"}
                </span>
              </div>
            </button>
          </div>
        </header>

        {/* TAB VIEW: ACCOUNT SETTINGS & PASSWORD */}
        {activeTab === "settings" && (
          <main className="flex-1 p-5 md:p-7 max-w-6xl w-full mx-auto space-y-6">
            <div>
              <button
                type="button"
                onClick={() => setActiveTab("dashboard")}
                className="text-xs font-bold text-[#4c24b5] hover:underline cursor-pointer"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
                Account Settings & Security
              </h1>
              <p className="text-sm text-slate-500">
                Change your management login password and update property details
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Change Management Password */}
              <div className="lg:col-span-6 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-full bg-[#ebe6ff] text-[#4c24b5] flex items-center justify-center shrink-0">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="5" y="11" width="14" height="10" rx="2" />
                      <path d="M8 11V7a4 4 0 018 0v4" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">
                      Change Management Password
                    </h2>
                    <p className="text-xs text-slate-500">
                      Update the password used to sign in to the Management Portal
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={handleChangePassword}
                  className="mt-5 space-y-4"
                  noValidate
                >
                  <div>
                    <label
                      htmlFor="mgmt-current-pw"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      Current Password *
                    </label>
                    <input
                      id="mgmt-current-pw"
                      type={showMgmtPasswords ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current management password"
                      className="w-full rounded-xl bg-[#f7f6fd] border border-indigo-100 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#4c24b5] focus:ring-2 focus:ring-indigo-100 transition"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="mgmt-new-pw"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      New Password *
                    </label>
                    <input
                      id="mgmt-new-pw"
                      type={showMgmtPasswords ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full rounded-xl bg-[#f7f6fd] border border-indigo-100 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#4c24b5] focus:ring-2 focus:ring-indigo-100 transition"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="mgmt-confirm-pw"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      Confirm New Password *
                    </label>
                    <input
                      id="mgmt-confirm-pw"
                      type={showMgmtPasswords ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full rounded-xl bg-[#f7f6fd] border border-indigo-100 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#4c24b5] focus:ring-2 focus:ring-indigo-100 transition"
                    />
                  </div>

                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showMgmtPasswords}
                      onChange={(e) => setShowMgmtPasswords(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#4c24b5] focus:ring-[#4c24b5]"
                    />
                    <span>Show passwords</span>
                  </label>

                  {pwError && (
                    <p
                      role="alert"
                      className="text-xs font-semibold text-rose-600"
                    >
                      {pwError}
                    </p>
                  )}

                  {pwSuccess && (
                    <p
                      role="status"
                      className="rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-xs font-semibold text-emerald-700"
                    >
                      ✓ {pwSuccess}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={savingPw}
                    className="w-full py-3 px-5 rounded-full bg-gradient-to-r from-[#4c24b5] to-[#6338d4] hover:from-[#5832c9] hover:to-[#7044e3] text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-900/15 transition disabled:opacity-60 cursor-pointer"
                  >
                    {savingPw ? "Updating Password..." : "Update Management Password"}
                  </button>
                </form>
              </div>

              {/* Right Column: Landlord & Property Profile */}
              <div className="lg:col-span-6 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-full bg-[#ebe6ff] text-[#4c24b5] flex items-center justify-center shrink-0">
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
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">
                      Landlord & Property Profile
                    </h2>
                    <p className="text-xs text-slate-500">
                      Administrative contact information for {propertyName}
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={handleSaveProfile}
                  className="mt-5 space-y-4"
                  noValidate
                >
                  <div>
                    <label
                      htmlFor="mgmt-admin-name"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      Administrator / Landlord Name *
                    </label>
                    <input
                      id="mgmt-admin-name"
                      type="text"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="w-full rounded-xl bg-[#f7f6fd] border border-indigo-100 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-[#4c24b5] focus:ring-2 focus:ring-indigo-100 transition"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="mgmt-admin-email"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      Registered Property Gmail / Email
                    </label>
                    <input
                      id="mgmt-admin-email"
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="e.g. asiawuoyenihun@gmail.com"
                      className="w-full rounded-xl bg-[#f7f6fd] border border-indigo-100 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#4c24b5] focus:ring-2 focus:ring-indigo-100 transition"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Used as the official management contact and for complaint notifications.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="mgmt-property-name"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      Property / Holdings Name *
                    </label>
                    <input
                      id="mgmt-property-name"
                      type="text"
                      value={propertyName}
                      onChange={(e) => setPropertyName(e.target.value)}
                      className="w-full rounded-xl bg-[#f7f6fd] border border-indigo-100 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-[#4c24b5] focus:ring-2 focus:ring-indigo-100 transition"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="mgmt-property-address"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      Property Location
                    </label>
                    <input
                      id="mgmt-property-address"
                      type="text"
                      value={propertyAddress}
                      onChange={(e) => setPropertyAddress(e.target.value)}
                      className="w-full rounded-xl bg-[#f7f6fd] border border-indigo-100 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-[#4c24b5] focus:ring-2 focus:ring-indigo-100 transition"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="mgmt-contact-phone"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      Management Contact Phone
                    </label>
                    <input
                      id="mgmt-contact-phone"
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="e.g. 0803 000 0000"
                      className="w-full rounded-xl bg-[#f7f6fd] border border-indigo-100 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#4c24b5] focus:ring-2 focus:ring-indigo-100 transition"
                    />
                  </div>

                  {profileError && (
                    <p
                      role="alert"
                      className="text-xs font-semibold text-rose-600"
                    >
                      {profileError}
                    </p>
                  )}

                  {profileSuccess && (
                    <p
                      role="status"
                      className="rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-xs font-semibold text-emerald-700"
                    >
                      ✓ {profileSuccess}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={!profileReady || savingProfile}
                    className="w-full py-3 px-5 rounded-full bg-[#f4f2ff] hover:bg-[#e5dffd] text-[#4c24b5] text-xs sm:text-sm font-bold transition disabled:opacity-60 cursor-pointer"
                  >
                    {savingProfile ? "Saving Profile..." : "Save Profile Changes"}
                  </button>
                </form>
              </div>
            </div>
          </main>
        )}

        {/* TAB VIEW: TENANT PROVISIONING (REGISTER & MANAGE TENANT ACCOUNTS) */}
        {activeTab === "tenants" && (
          <main className="flex-1 p-5 md:p-7 max-w-6xl w-full mx-auto space-y-6">
            <div>
              <button
                type="button"
                onClick={() => setActiveTab("dashboard")}
                className="text-xs font-bold text-[#4c24b5] hover:underline cursor-pointer"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
                Tenant Accounts & Credentials
              </h1>
              <p className="text-sm text-slate-500">
                Register tenant details and assign unit passwords before sharing
                login access with residents
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Register / Update Tenant Form */}
              <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-full bg-[#ebe6ff] text-[#4c24b5] flex items-center justify-center shrink-0">
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
                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">
                      Register / Assign Tenant
                    </h2>
                    <p className="text-xs text-slate-500">
                      Creates or updates login credentials for a unit
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={handleSaveTenant}
                  className="mt-5 space-y-4"
                  noValidate
                >
                  <div>
                    <label
                      htmlFor="tenant-unit"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      Select Apartment Unit *
                    </label>
                    <select
                      id="tenant-unit"
                      value={tenantUnit}
                      onChange={(e) => {
                        const unitNumber = Number(e.target.value);
                        openTenantForm(unitNumber, tenants.find((tenant) => tenant.unit === unitNumber));
                      }}
                      disabled={savingTenant || !tenantDirectoryReady}
                      className="w-full rounded-xl bg-[#f7f6fd] border border-indigo-100 px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-[#4c24b5] focus:ring-2 focus:ring-indigo-100 transition"
                    >
                      {UNITS.map((u) => {
                        const existing = tenants.find((t) => t.unit === u);
                        return (
                          <option key={u} value={u}>
                            Unit {u}{" "}
                            {existing
                              ? `— Occupied (${existing.fullName})`
                              : "— Vacant"}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="tenant-name"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      Tenant Full Name *
                    </label>
                    <input
                      id="tenant-name"
                      type="text"
                      value={tenantName}
                      onChange={(e) => setTenantName(e.target.value)}
                      placeholder="e.g. Mr. Abdullahi Suleiman"
                      className="w-full rounded-xl bg-[#f7f6fd] border border-indigo-100 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#4c24b5] focus:ring-2 focus:ring-indigo-100 transition"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="tenant-contact"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      Phone Number or Email (Optional)
                    </label>
                    <input
                      id="tenant-contact"
                      type="text"
                      value={tenantContact}
                      onChange={(e) => setTenantContact(e.target.value)}
                      placeholder="e.g. 0803 000 0000"
                      className="w-full rounded-xl bg-[#f7f6fd] border border-indigo-100 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#4c24b5] focus:ring-2 focus:ring-indigo-100 transition"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="tenant-password"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      Assign Unit Login Password{editingOccupancyId ? "" : " *"}
                    </label>
                    <div className="flex items-center rounded-xl bg-[#f7f6fd] border border-indigo-100 px-4 py-2.5 focus-within:bg-white focus-within:border-[#4c24b5] focus-within:ring-2 focus-within:ring-indigo-100 transition">
                      <input
                        id="tenant-password"
                        type={showTenantPw ? "text" : "password"}
                        autoComplete="new-password"
                        value={tenantPassword}
                        onChange={(e) => setTenantPassword(e.target.value)}
                        placeholder="e.g. suleiman1"
                        className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowTenantPw((prev) => !prev)}
                        className="text-xs font-bold text-[#4c24b5] ml-2 cursor-pointer"
                      >
                        {showTenantPw ? "Hide" : "Show"}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {editingOccupancyId
                        ? "Leave blank to keep the current password. New passwords need at least 6 characters."
                        : "Minimum 6 characters. You will share this password with the tenant."}
                    </p>
                  </div>

                  {(tenantError || tenantDirectoryError) && (
                    <p
                      role="alert"
                      className="text-xs font-semibold text-rose-600"
                    >
                      {tenantError || tenantDirectoryError}
                    </p>
                  )}

                  {tenantSuccess && (
                    <p
                      role="status"
                      className="rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-xs font-semibold text-emerald-700"
                    >
                      ✓ {tenantSuccess}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={savingTenant || !tenantDirectoryReady}
                    className="w-full py-3 px-5 rounded-full bg-gradient-to-r from-[#4c24b5] to-[#6338d4] hover:from-[#5832c9] hover:to-[#7044e3] text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-900/15 transition disabled:opacity-60 cursor-pointer"
                  >
                    {savingTenant
                      ? "Saving Tenant..."
                      : `Save Unit ${tenantUnit} Account`}
                  </button>
                </form>
              </div>

              {/* Right Column: All 5 Units Tenant Directory & Credentials */}
              <div className="lg:col-span-7 space-y-3.5">
                {UNITS.map((u) => {
                  const tenant = tenants.find((t) => t.unit === u);
                  const canShare = tenant && issuedPassword?.occupancyId === tenant.id;
                  const isRevealed = canShare && revealedPassword;

                  return (
                    <div
                      key={u}
                      className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-[#ebe6ff] text-[#4c24b5] flex items-center justify-center font-extrabold text-sm shrink-0">
                          U{u}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-extrabold text-slate-900">
                              Unit {u}
                            </h3>
                            {tenant ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
                                Active Account
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500">
                                Vacant
                              </span>
                            )}
                          </div>

                          {tenant ? (
                            <div className="mt-1 space-y-1">
                              <p className="text-sm font-bold text-slate-800">
                                {tenant.fullName}
                              </p>
                              {tenant.contact && (
                                <p className="text-xs text-slate-500">
                                  Contact: {tenant.contact}
                                </p>
                              )}
                              <div className="flex items-center gap-2 pt-0.5">
                                <span className="text-xs text-slate-500">
                                  Password:
                                </span>
                                <code className="px-2 py-0.5 rounded bg-[#f4f2ff] text-xs font-bold text-[#4c24b5]">
                                  {isRevealed ? issuedPassword.value : "••••••••"}
                                </code>
                                <button
                                  type="button"
                                  onClick={() => setRevealedPassword((current) => !current)}
                                  disabled={!canShare}
                                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                                >
                                  {isRevealed ? "Hide" : "Show"}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 mt-1">
                              No tenant registered yet. Assign a tenant using
                              the form.
                            </p>
                          )}
                        </div>
                      </div>

                      {tenant ? (
                        <div className="flex flex-wrap sm:flex-col items-stretch sm:items-end gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopyCredentials(tenant, issuedPassword.value)}
                            disabled={!canShare}
                            className="px-3.5 py-1.5 rounded-full bg-[#4c24b5] hover:bg-[#3f1c9c] text-white text-xs font-bold transition cursor-pointer"
                          >
                            {copiedUnit === u
                              ? "✓ Copied Login!"
                              : "Copy Login Info"}
                          </button>

                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => openTenantForm(u, tenant)}
                              disabled={savingTenant || !tenantDirectoryReady}
                              className="text-xs font-bold text-[#4c24b5] hover:underline cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleVacateUnit(tenant)}
                              disabled={savingTenant || !tenantDirectoryReady}
                              className="text-xs font-bold text-rose-500 hover:underline cursor-pointer"
                            >
                              Vacate
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openTenantForm(u)}
                          disabled={savingTenant || !tenantDirectoryReady}
                          className="self-start sm:self-center px-4 py-2 rounded-full bg-[#f4f2ff] hover:bg-[#e5dffd] text-[#4c24b5] text-xs font-bold transition cursor-pointer shrink-0"
                        >
                          + Assign Tenant
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </main>
        )}

        {/* TAB VIEW: UNITS OVERVIEW */}
        {activeTab === "units" && (
          <main className="flex-1 p-5 md:p-7 max-w-6xl w-full mx-auto space-y-6">
            <div>
              <button
                type="button"
                onClick={() => setActiveTab("dashboard")}
                className="text-xs font-bold text-[#4c24b5] hover:underline cursor-pointer"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
                Units Overview (5 Residential Units)
              </h1>
              <p className="text-sm text-slate-500">
                {propertyName} • {propertyAddress}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {UNITS.map((u) => {
                const unitList = (items || []).filter((c) => c.unit === u);
                const tenant = tenants.find((t) => t.unit === u);
                const pending = unitList.filter(
                  (c) => c.status === "Pending",
                ).length;
                const inProg = unitList.filter(
                  (c) => c.status === "In-Progress",
                ).length;
                const resolved = unitList.filter(
                  (c) => c.status === "Resolved",
                ).length;

                return (
                  <div
                    key={u}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-[#ebe6ff] text-[#4c24b5] flex items-center justify-center font-extrabold text-sm">
                            U{u}
                          </div>
                          <div>
                            <h2 className="text-base font-extrabold text-slate-900">
                              Unit {u}
                            </h2>
                            <p className="text-xs text-slate-500">
                              {tenant ? tenant.fullName : "No tenant assigned"}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            tenant
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {tenant ? "Occupied" : "Vacant"}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2 text-center bg-[#f7f6fd] rounded-xl p-3">
                        <div>
                          <p className="text-base font-extrabold text-amber-600">
                            {pending}
                          </p>
                          <p className="text-[11px] text-slate-500">Pending</p>
                        </div>
                        <div>
                          <p className="text-base font-extrabold text-sky-600">
                            {inProg}
                          </p>
                          <p className="text-[11px] text-slate-500">Active</p>
                        </div>
                        <div>
                          <p className="text-base font-extrabold text-emerald-600">
                            {resolved}
                          </p>
                          <p className="text-[11px] text-slate-500">Resolved</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() =>
                          openFilteredComplaints({ nextUnit: String(u) })
                        }
                        className="w-full py-2.5 px-4 rounded-full bg-[#4c24b5] hover:bg-[#3f1c9c] text-white text-xs font-bold transition cursor-pointer"
                      >
                        View Unit {u} Tickets ({unitList.length}) →
                      </button>
                      <button
                        type="button"
                        onClick={() => openTenantForm(u, tenant)}
                        disabled={savingTenant || !tenantDirectoryReady}
                        className="w-full py-2 px-4 rounded-full bg-[#f4f2ff] hover:bg-[#e7e2fb] text-[#4c24b5] text-xs font-bold transition cursor-pointer"
                      >
                        {tenant ? "Manage Tenant Login" : "+ Assign Tenant"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </main>
        )}

        {/* TAB VIEW: ANNOUNCEMENTS (WITH POST ANNOUNCEMENT FORM) */}
        {activeTab === "announcements" && (
          <main className="flex-1 p-5 md:p-7 max-w-6xl w-full mx-auto space-y-6">
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
                Post notices and maintenance alerts visible to all 5 residential
                units
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-full bg-[#ebe6ff] text-[#4c24b5] flex items-center justify-center shrink-0">
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
                        d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">
                      Post New Announcement
                    </h2>
                    <p className="text-xs text-slate-500">
                      Broadcasts immediately to Units 1–5
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={handlePostAnnouncement}
                  className="mt-5 space-y-4"
                  noValidate
                >
                  <div>
                    <label
                      htmlFor="ann-title"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      Announcement Title *
                    </label>
                    <input
                      id="ann-title"
                      type="text"
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      placeholder="e.g. Generator Servicing Schedule"
                      className="w-full rounded-xl bg-[#f7f6fd] border border-indigo-100 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#4c24b5] focus:ring-2 focus:ring-indigo-100 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Category Tag
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {ANNOUNCEMENT_TAGS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setAnnTag(tag)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                            annTag === tag
                              ? "bg-[#4c24b5] text-white"
                              : "bg-[#f4f2ff] text-slate-700 hover:bg-[#e7e2fb]"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="ann-details"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      Message Details *
                    </label>
                    <textarea
                      id="ann-details"
                      rows={4}
                      value={annDetails}
                      onChange={(e) => setAnnDetails(e.target.value)}
                      placeholder="Write the notice details for tenants..."
                      className="w-full rounded-xl bg-[#f7f6fd] border border-indigo-100 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#4c24b5] focus:ring-2 focus:ring-indigo-100 transition resize-y"
                    />
                  </div>

                  {annError && (
                    <p
                      role="alert"
                      className="text-xs font-semibold text-rose-600"
                    >
                      {annError}
                    </p>
                  )}

                  {annMessage && (
                    <p
                      role="status"
                      className="rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-xs font-semibold text-emerald-700"
                    >
                      ✓ {annMessage}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={!announcementsReady || Boolean(annMutation)}
                    className="w-full py-3 px-5 rounded-full bg-gradient-to-r from-[#4c24b5] to-[#6338d4] hover:from-[#5832c9] hover:to-[#7044e3] text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-900/15 transition disabled:opacity-60 cursor-pointer"
                  >
                    {annMutation === "post" ? "Publishing..." : "Publish Announcement"}
                  </button>
                </form>
              </div>

              <div className="lg:col-span-7 space-y-4">
                {announcements.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-slate-200">
                    <p className="font-bold text-slate-800">
                      {EMPTY_ANNOUNCEMENTS}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Use the form on the left to send a notice to all tenants.
                    </p>
                  </div>
                ) : (
                  announcements.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#4c24b5]" />
                          <h2 className="text-base font-extrabold text-slate-900">
                            {item.title}
                          </h2>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-[#4c24b5]">
                            {item.tag}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-slate-400">
                            {formatDate(item.createdAt)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteAnnouncement(item.id)}
                            disabled={Boolean(annMutation)}
                            className="text-xs font-bold text-rose-500 hover:text-rose-700 cursor-pointer"
                            title="Delete announcement"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 mt-3 leading-relaxed">
                        {item.details}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </main>
        )}

        {/* TAB VIEW: DASHBOARD & ALL COMPLAINTS */}
        {(activeTab === "dashboard" || activeTab === "complaints") && (
          <main className="flex-1 p-5 md:p-7 max-w-7xl w-full mx-auto space-y-6">
            {activeTab === "dashboard" && (
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#dfd8fc] via-[#ebe6fe] to-[#d9d1fa] shadow-sm border border-white min-h-[165px] flex items-center">
                <div
                  className="hidden sm:block absolute inset-y-0 right-0 w-[56%] bg-cover bg-center"
                  style={{ backgroundImage: "url('/building.png')" }}
                />
                <div className="hidden sm:block absolute inset-y-0 right-0 w-[58%] bg-gradient-to-r from-[#e5dffd] via-[#e5dffd]/55 to-transparent" />

                <div className="relative z-10 p-6 md:p-8 max-w-lg">
                  <h1 className="text-2xl md:text-[30px] font-extrabold text-slate-900 tracking-tight">
                    Management Dashboard 👋
                  </h1>
                  <p className="text-sm text-slate-700 mt-1">
                    Overview of apartment activities and maintenance tickets
                    across Units 1–5.
                  </p>
                  <div className="w-12 h-1 rounded-full bg-[#4c24b5] mt-4" />
                </div>
              </div>
            )}

            {/* 4 Clickable KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                type="button"
                onClick={() => openFilteredComplaints({ nextStatus: "" })}
                className={`bg-white rounded-2xl p-5 shadow-sm border text-left flex items-center gap-4 transition cursor-pointer ${
                  activeTab === "complaints" && !status
                    ? "border-[#4c24b5] ring-2 ring-[#4c24b5]/25"
                    : "border-slate-100 hover:border-indigo-200"
                }`}
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
                onClick={() =>
                  openFilteredComplaints({ nextStatus: "In-Progress" })
                }
                className={`bg-white rounded-2xl p-5 shadow-sm border text-left flex items-center gap-4 transition cursor-pointer ${
                  status === "In-Progress"
                    ? "border-sky-500 ring-2 ring-sky-400/30"
                    : "border-slate-100 hover:border-sky-200"
                }`}
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
                    {counts["In-Progress"] || 0}
                  </p>
                  <p className="text-xs font-medium text-slate-500">
                    In Progress
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  openFilteredComplaints({ nextStatus: "Resolved" })
                }
                className={`bg-white rounded-2xl p-5 shadow-sm border text-left flex items-center gap-4 transition cursor-pointer ${
                  status === "Resolved"
                    ? "border-emerald-500 ring-2 ring-emerald-400/30"
                    : "border-slate-100 hover:border-emerald-200"
                }`}
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
                    {counts.Resolved || 0}
                  </p>
                  <p className="text-xs font-medium text-slate-500">Resolved</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  openFilteredComplaints({ nextStatus: "Pending" })
                }
                className={`bg-white rounded-2xl p-5 shadow-sm border text-left flex items-center gap-4 transition cursor-pointer ${
                  status === "Pending"
                    ? "border-amber-500 ring-2 ring-amber-400/30"
                    : "border-slate-100 hover:border-amber-200"
                }`}
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
                    {counts.Pending || 0}
                  </p>
                  <p className="text-xs font-medium text-slate-500">
                    Pending Response
                  </p>
                </div>
              </button>
            </div>

            {/* Complaints Overview Donut + Recent Complaints Table */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {activeTab === "dashboard" && (
                <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-[#4c24b5]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                      <h2 className="text-base font-extrabold text-slate-900">
                        Complaints Overview
                      </h2>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-[#f4f2ff] text-xs font-bold text-[#4c24b5]">
                      By Category
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
                    <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
                      <svg
                        className="w-full h-full -rotate-90"
                        viewBox="0 0 100 100"
                      >
                        <circle
                          cx="50"
                          cy="50"
                          r={radius}
                          fill="transparent"
                          stroke="#ede9fe"
                          strokeWidth="14"
                        />
                        {totalCount > 0 &&
                          categoryStats.map((seg) => {
                            if (seg.pct <= 0) return null;
                            const dash = (seg.pct / 100) * circumference;
                            const offset = -((seg.start / 100) * circumference);
                            return (
                              <circle
                                key={seg.category}
                                cx="50"
                                cy="50"
                                r={radius}
                                fill="transparent"
                                stroke={seg.color.hex}
                                strokeWidth="14"
                                strokeDasharray={`${dash} ${circumference}`}
                                strokeDashoffset={offset}
                              />
                            );
                          })}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-2xl font-extrabold text-slate-900 leading-none">
                          {totalCount}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 mt-1">
                          Total
                        </span>
                      </div>
                    </div>

                    <div className="w-full space-y-2.5">
                      {categoryStats.map((seg) => (
                        <div
                          key={seg.category}
                          className="flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${seg.color.dot}`}
                            />
                            <span className="font-semibold text-slate-700">
                              {seg.category}
                            </span>
                          </div>
                          <span className="font-bold text-slate-900">
                            {seg.count}{" "}
                            <span className="text-slate-400 font-medium">
                              ({Math.round(seg.pct)}%)
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div
                className={`${
                  activeTab === "complaints"
                    ? "lg:col-span-12"
                    : "lg:col-span-7"
                } bg-white rounded-2xl p-6 shadow-sm border border-slate-100`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-[#4c24b5]"
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
                    <h2 className="text-base font-extrabold text-slate-900">
                      {activeTab === "complaints"
                        ? "All Complaints"
                        : "Recent Complaints"}
                    </h2>
                  </div>

                  {activeTab === "complaints" ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        aria-label="Filter by unit"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="rounded-full bg-[#f4f2ff] border border-indigo-100 px-3.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#4c24b5]"
                      >
                        <option value="">All Units</option>
                        {UNITS.map((u) => (
                          <option key={u} value={u}>
                            Unit {u}
                          </option>
                        ))}
                      </select>

                      <select
                        aria-label="Filter by status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="rounded-full bg-[#f4f2ff] border border-indigo-100 px-3.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#4c24b5]"
                      >
                        <option value="">All Statuses</option>
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>

                      {(unit || status || search) && (
                        <button
                          type="button"
                          onClick={() => {
                            setUnit("");
                            setStatus("");
                            setSearch("");
                          }}
                          className="px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition cursor-pointer"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveTab("complaints")}
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
                  <div className="py-10 text-center border border-dashed border-slate-200 rounded-xl">
                    <p className="font-bold text-slate-800">
                      No complaints match these filters
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Clear the filters to see every complaint across Units 1–5.
                    </p>
                  </div>
                )}

                {displayedItems && displayedItems.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200/80 text-xs font-semibold text-slate-500">
                          <th className="py-3 pr-2">#</th>
                          <th className="py-3 px-2.5">Issue</th>
                          <th className="py-3 px-2.5">Unit</th>
                          <th className="py-3 px-2.5">Category</th>
                          <th className="py-3 px-2.5">Status</th>
                          <th className="py-3 px-2.5">Date</th>
                          <th className="py-3 pl-2 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {displayedItems.map((c, idx) => (
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
                            <td className="py-3.5 px-2.5 font-semibold text-slate-900 max-w-[200px]">
                              <p className="line-clamp-2">{c.description}</p>
                            </td>
                            <td className="py-3.5 px-2.5 whitespace-nowrap text-xs font-bold text-slate-700">
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
                            <td className="py-3.5 px-2.5 whitespace-nowrap">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                                  STATUS_STYLES[c.status] ||
                                  "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {c.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-2.5 whitespace-nowrap text-xs text-slate-500">
                              {formatDate(c.createdAt)}
                            </td>
                            <td className="py-3.5 pl-2 text-center">
                              <span
                                title="Inspect & update ticket"
                                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#f4f2ff] group-hover:bg-[#4c24b5] text-[#4c24b5] group-hover:text-white transition"
                              >
                                <svg
                                  className="w-4 h-4"
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
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Latest Announcements + Quick Actions */}
            {activeTab === "dashboard" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
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
                        Latest Announcements
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("announcements")}
                      className="text-xs font-bold text-[#4c24b5] hover:underline cursor-pointer"
                    >
                      Post / View All →
                    </button>
                  </div>

                  {announcements.length > 0 ? (
                    <div
                      onClick={() => setActiveTab("announcements")}
                      className="flex items-start gap-4 p-3.5 rounded-xl bg-[#f8f7fe] hover:bg-[#f1effc] transition cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-[#ebe6ff] text-[#4c24b5] flex items-center justify-center shrink-0">
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
                            d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {announcements[0].title}
                        </h3>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                          {announcements[0].details}
                        </p>
                        <p className="text-[11px] font-medium text-slate-400 mt-1.5">
                          {formatDate(announcements[0].createdAt)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveTab("announcements")}
                      className="py-6 rounded-xl border border-dashed border-indigo-200 text-xs font-bold text-[#4c24b5] hover:bg-indigo-50/50 transition cursor-pointer"
                    >
                      + Post First Announcement
                    </button>
                  )}
                </div>

                <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
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

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab("tenants")}
                      className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl bg-[#f4f2ff] hover:bg-[#e8e3fe] text-slate-800 transition cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#4c24b5] text-white flex items-center justify-center">
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
                            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                          />
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-center">
                        Register Tenant
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openFilteredComplaints({ nextStatus: "" })}
                      className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl bg-[#f4f2ff] hover:bg-[#e8e3fe] text-slate-800 transition cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-white text-[#4c24b5] shadow-sm flex items-center justify-center">
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
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-center">
                        View Complaints
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("announcements")}
                      className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl bg-[#f4f2ff] hover:bg-[#e8e3fe] text-slate-800 transition cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-white text-[#4c24b5] shadow-sm flex items-center justify-center">
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
                            d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                          />
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-center">
                        Post Announcement
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("settings")}
                      className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl bg-[#f4f2ff] hover:bg-[#e8e3fe] text-slate-800 transition cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-white text-[#4c24b5] shadow-sm flex items-center justify-center">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect x="5" y="11" width="14" height="10" rx="2" />
                          <path d="M8 11V7a4 4 0 018 0v4" strokeLinecap="round" />
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-center">
                        Change Password
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        )}
      </div>
    </div>
  );
}
