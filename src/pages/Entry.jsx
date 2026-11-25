import { useState } from "react";
import { Link } from "react-router-dom";
import { UNITS } from "../lib/api.js";

export default function Entry() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#ebe6ff] via-[#f2efff] to-[#e4ddff] text-slate-900 font-sans overflow-x-hidden">
      {/* Top Hero + Building Section */}
      <div className="relative bg-[#130e33] text-white pb-36">
        {/* Building Photo */}
        <div
          className="absolute inset-0 bg-cover bg-center md:bg-[position:right_center]"
          style={{
            backgroundImage: "url('/building.png')",
          }}
        />

        {/* Smooth Left-to-Right Dark Indigo Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#110c2e]/90 via-[#171142]/75 to-[#130e33]/35 md:from-[#110c2e] md:via-[#171142]/88 md:to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#ebe6ff] via-[#130e33]/35 to-transparent" />

        {/* Top Navbar */}
        <header className="relative z-20 w-full bg-[#130e33]/75 backdrop-blur-md border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-3.5 md:py-4 flex items-center justify-between gap-3">
            <Link
              to="/"
              className="flex items-center gap-2.5 sm:gap-3.5 min-w-0"
            >
              <svg
                className="w-9 h-9 sm:w-11 sm:h-11 shrink-0"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient
                    id="houseGrad"
                    x1="4"
                    y1="8"
                    x2="44"
                    y2="42"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="55%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
                <path
                  d="M6 23L24 8L42 23"
                  stroke="url(#houseGrad)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M11 20V38C11 39.1046 11.8954 40 13 40H35C36.1046 40 37 39.1046 37 38V20"
                  stroke="url(#houseGrad)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <rect
                  x="19"
                  y="23"
                  width="4"
                  height="4"
                  rx="0.8"
                  fill="url(#houseGrad)"
                />
                <rect
                  x="25"
                  y="23"
                  width="4"
                  height="4"
                  rx="0.8"
                  fill="url(#houseGrad)"
                />
                <rect
                  x="19"
                  y="29"
                  width="4"
                  height="4"
                  rx="0.8"
                  fill="url(#houseGrad)"
                />
                <rect
                  x="25"
                  y="29"
                  width="4"
                  height="4"
                  rx="0.8"
                  fill="url(#houseGrad)"
                />
              </svg>

              <div className="leading-tight truncate">
                <span className="block font-bold text-[15px] sm:text-[17px] tracking-tight text-white">
                  AOH Management
                </span>
                <span className="block text-[12px] sm:text-[13px] text-indigo-200 font-medium">
                  Systems
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-8">
              <Link
                to="/"
                className="flex items-center gap-2 text-sm font-semibold text-white border-b-2 border-indigo-400 pb-1.5"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z" />
                </svg>
                Home
              </Link>
              <Link
                to="/about"
                className="flex items-center gap-1.5 text-sm font-medium text-indigo-100 hover:text-white transition pb-1.5"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path strokeLinecap="round" d="M12 11v5m0-8h.01" />
                </svg>
                About
              </Link>
              <Link
                to="/management/login"
                className="flex items-center gap-2 bg-gradient-to-r from-[#5b46e8] to-[#7c3aed] hover:from-[#6d59f0] hover:to-[#8b5cf6] text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-lg shadow-indigo-950/60 transition"
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
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                Management Login
                <span className="text-base leading-none">→</span>
              </Link>
            </nav>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              aria-expanded={menuOpen}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-indigo-100 hover:text-white hover:bg-white/10 transition shrink-0"
            >
              {menuOpen ? (
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
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
              )}
            </button>
          </div>

          {/* Mobile Dropdown Menu */}
          {menuOpen && (
            <div className="md:hidden bg-[#16103b]/95 border-t border-white/10 px-4 py-4 space-y-2.5">
              <Link
                to="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/10 text-white text-sm font-semibold"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z" />
                </svg>
                Home
              </Link>
              <Link
                to="/about"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-indigo-100 hover:bg-white/10 hover:text-white text-sm font-medium transition"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path strokeLinecap="round" d="M12 11v5m0-8h.01" />
                </svg>
                About
              </Link>
              <Link
                to="/management/login"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#5b46e8] to-[#7c3aed] text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-md mt-2"
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
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                Management Login →
              </Link>
            </div>
          )}
        </header>

        {/* Hero Typography */}
        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 md:px-10 pt-12 md:pt-20 pb-6">
          <h1 className="text-[34px] sm:text-5xl md:text-[54px] font-extrabold leading-[1.15] tracking-tight max-w-xl">
            <span className="block text-white">Welcome to</span>
            <span className="block pb-2 -mb-2 text-transparent bg-clip-text bg-gradient-to-r from-[#a78bfa] via-[#c4b5fd] to-[#818cf8] drop-shadow-[0_2px_16px_rgba(139,92,246,0.45)]">
              AOH Management
            </span>
            <span className="block text-white">Systems</span>
          </h1>

          <div className="mt-6 pl-4 border-l-[3px] border-[#6e59f7] max-w-md text-indigo-100/95 text-sm sm:text-[15px] leading-relaxed font-medium">
            Report maintenance issues, track their status, and help us keep your
            home in the best condition.
          </div>
        </div>
      </div>

      {/* Overlapping "Select Your Apartment" Glass Card Section */}
      <main
        id="units-section"
        className="relative z-20 flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 -mt-20 mb-20"
      >
        <div className="bg-white/75 backdrop-blur-xl rounded-[28px] shadow-[0_20px_50px_rgba(79,70,229,0.12)] border border-white p-5 sm:p-6 md:p-9 pt-11 relative">
          <div className="absolute -top-5 left-1/2 -translate-x-1/2">
            <span className="inline-block bg-gradient-to-r from-[#4f39d6] to-[#6d28d9] text-white text-xs sm:text-sm md:text-base font-bold px-6 sm:px-8 py-2.5 rounded-full shadow-lg shadow-indigo-500/30 whitespace-nowrap">
              Select Your Apartment
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5 mt-1">
            {UNITS.map((u) => (
              <Link
                key={u}
                to={`/unit/${u}/login`}
                aria-label={`Unit ${u}`}
                className="group bg-white/95 hover:bg-white border border-indigo-100/80 hover:border-indigo-400 rounded-2xl p-6 flex flex-col items-center text-center shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_25px_rgba(79,70,229,0.15)] hover:-translate-y-1 transition-all duration-200"
              >
                <div className="w-12 h-12 flex items-center justify-center mb-2.5 text-[#432dd7] group-hover:scale-105 transition-transform">
                  <svg
                    className="w-10 h-10"
                    viewBox="0 0 40 40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                  >
                    <path d="M6 34H34" strokeLinecap="round" />
                    <rect x="9" y="12" width="11" height="22" rx="1" />
                    <rect x="20" y="7" width="11" height="27" rx="1" />
                    <line
                      x1="13"
                      y1="16"
                      x2="16"
                      y2="16"
                      strokeLinecap="round"
                    />
                    <line
                      x1="13"
                      y1="20"
                      x2="16"
                      y2="20"
                      strokeLinecap="round"
                    />
                    <line
                      x1="13"
                      y1="24"
                      x2="16"
                      y2="24"
                      strokeLinecap="round"
                    />
                    <line
                      x1="13"
                      y1="28"
                      x2="16"
                      y2="28"
                      strokeLinecap="round"
                    />
                    <line
                      x1="24"
                      y1="12"
                      x2="27"
                      y2="12"
                      strokeLinecap="round"
                    />
                    <line
                      x1="24"
                      y1="16"
                      x2="27"
                      y2="16"
                      strokeLinecap="round"
                    />
                    <line
                      x1="24"
                      y1="20"
                      x2="27"
                      y2="20"
                      strokeLinecap="round"
                    />
                    <line
                      x1="24"
                      y1="24"
                      x2="27"
                      y2="24"
                      strokeLinecap="round"
                    />
                    <line
                      x1="24"
                      y1="28"
                      x2="27"
                      y2="28"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <h2 className="text-[19px] font-extrabold text-slate-900 tracking-tight">
                  Unit {u}
                </h2>
                <p className="text-xs font-medium text-slate-500 mt-0.5 mb-4">
                  Tenant Access
                </p>
                <span className="w-8 h-8 rounded-full bg-[#432dd7] group-hover:bg-[#6d28d9] text-white flex items-center justify-center shadow-sm transition">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Curved Footer */}
      <footer className="relative bg-[#140f33] text-white pt-10 pb-6 px-6 mt-auto overflow-hidden">
        <svg
          className="absolute top-0 left-0 w-full h-6 text-[#e4ddff] fill-current"
          viewBox="0 0 1440 48"
          preserveAspectRatio="none"
        >
          <path d="M0,0 L1440,0 L1440,12 Q1080,48 720,24 Q360,0 0,32 Z" />
        </svg>

        <svg
          className="absolute bottom-0 right-4 w-72 h-20 text-indigo-500/40 pointer-events-none"
          viewBox="0 0 300 90"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect x="20" y="35" width="35" height="55" />
          <line x1="28" y1="45" x2="28" y2="85" />
          <line x1="38" y1="45" x2="38" y2="85" />
          <line x1="47" y1="45" x2="47" y2="85" />
          <rect x="65" y="15" width="42" height="75" />
          <line x1="75" y1="25" x2="97" y2="25" />
          <line x1="75" y1="35" x2="97" y2="35" />
          <line x1="75" y1="45" x2="97" y2="45" />
          <line x1="75" y1="55" x2="97" y2="55" />
          <rect x="115" y="42" width="38" height="48" />
          <rect x="162" y="22" width="45" height="68" />
          <line x1="172" y1="32" x2="172" y2="82" />
          <line x1="184" y1="32" x2="184" y2="82" />
          <line x1="196" y1="32" x2="196" y2="82" />
          <rect x="216" y="38" width="40" height="52" />
        </svg>

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2.5 text-white font-medium">
            <svg
              className="w-6 h-6 text-[#7c69ef]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3l7 4v5c0 4.5-3 8.4-7 9-4-.6-7-4.5-7-9V7l7-4z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4"
              />
            </svg>
            <span>Your home. Our priority.</span>
          </div>
          <p className="text-xs text-indigo-300/75 text-center sm:text-right">
            Asiawu Oyenihun Holdings • Fate/Tanke, Ilorin
          </p>
        </div>
      </footer>
    </div>
  );
}
