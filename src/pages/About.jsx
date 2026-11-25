import { useState } from "react";
import { Link } from "react-router-dom";

export default function About() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f6fe] text-slate-900 font-sans overflow-x-hidden">
      {/* Matching Responsive Top Navbar */}
      <header className="relative z-20 w-full bg-[#130e33] text-white border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-3.5 md:py-4 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <svg
              className="w-9 h-9 sm:w-11 sm:h-11 shrink-0"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient
                  id="houseGradAbout"
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
                stroke="url(#houseGradAbout)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M11 20V38C11 39.1046 11.8954 40 13 40H35C36.1046 40 37 39.1046 37 38V20"
                stroke="url(#houseGradAbout)"
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
                fill="url(#houseGradAbout)"
              />
              <rect
                x="25"
                y="23"
                width="4"
                height="4"
                rx="0.8"
                fill="url(#houseGradAbout)"
              />
              <rect
                x="19"
                y="29"
                width="4"
                height="4"
                rx="0.8"
                fill="url(#houseGradAbout)"
              />
              <rect
                x="25"
                y="29"
                width="4"
                height="4"
                rx="0.8"
                fill="url(#houseGradAbout)"
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
              className="flex items-center gap-2 text-sm font-medium text-indigo-100 hover:text-white transition pb-1.5"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z" />
              </svg>
              Home
            </Link>

            <Link
              to="/about"
              className="flex items-center gap-1.5 text-sm font-semibold text-white border-b-2 border-indigo-400 pb-1.5"
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
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-indigo-100 hover:bg-white/10 hover:text-white text-sm font-medium transition"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z" />
              </svg>
              Home
            </Link>
            <Link
              to="/about"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/10 text-white text-sm font-semibold"
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

      {/* Hero Section (Dark Purple Overlay Behind Text on Mobile like Entry.jsx, Curved Split on Desktop) */}
      <section className="relative bg-[#130e33] lg:bg-gradient-to-br lg:from-[#ece8ff] lg:via-[#f4f1ff] lg:to-[#e4ddff] overflow-hidden border-b border-indigo-100/80">
        {/* Mobile & Tablet Building Image + Strong Dark Indigo Gradient Under Text */}
        <div
          className="lg:hidden absolute inset-0 bg-cover bg-right"
          style={{ backgroundImage: "url('/building.png')" }}
        />
        <div className="lg:hidden absolute inset-0 bg-gradient-to-r from-[#110c2e] via-[#171142]/92 to-[#130e33]/45" />
        <div className="lg:hidden absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#f7f6fe] via-[#130e33]/35 to-transparent" />

        {/* Desktop Right Curved Building Photo Container */}
        <div className="hidden lg:block absolute inset-y-0 right-0 w-[56%] overflow-hidden">
          <div
            className="w-full h-full bg-cover bg-center rounded-bl-[140px] shadow-inner"
            style={{ backgroundImage: "url('/building.png')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#f0edff] via-transparent to-transparent w-32" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 md:px-10 py-14 pb-20 md:py-20">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 lg:bg-[#dfd8fc] text-white lg:text-[#3b1c99] backdrop-blur-sm text-xs font-bold mb-5">
              <span className="w-4 h-4 rounded-full bg-[#6e59f7] lg:bg-[#4c24b5] text-white text-[10px] font-extrabold flex items-center justify-center">
                i
              </span>
              <span>About Us</span>
            </div>

            <h1 className="text-[34px] sm:text-5xl font-extrabold leading-[1.15] tracking-tight text-white lg:text-slate-900">
              <span className="block">About Our</span>
              <span className="block pb-1 text-transparent bg-clip-text bg-gradient-to-r from-[#a78bfa] via-[#c4b5fd] to-[#818cf8] drop-shadow-[0_2px_16px_rgba(139,92,246,0.45)] lg:text-[#4c24b5] lg:bg-none lg:drop-shadow-none">
                Complaint Management
              </span>
              <span className="block text-white lg:text-[#4c24b5]">System</span>
            </h1>

            <div className="hidden lg:block w-12 h-1 rounded-full bg-[#4c24b5] my-5" />

            {/* Left Purple Vertical Line + Readable Text (Matches Entry.jsx) */}
            <div className="mt-6 pl-4 border-l-[3px] border-[#6e59f7] lg:border-none lg:pl-0 max-w-md text-indigo-100/95 lg:text-slate-700 text-sm sm:text-[15px] leading-relaxed font-medium lg:font-normal">
              We are committed to making apartment living better, simpler and
              more responsive at{" "}
              <strong className="text-white lg:text-slate-900">
                Asiawu Oyenihun Holdings
              </strong>
              . Our Complaint Management System helps tenants report issues
              easily and allows management to resolve them efficiently.
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#5b46e8] to-[#7c3aed] lg:from-[#4c24b5] lg:to-[#6d28d9] hover:opacity-95 text-white text-sm font-bold shadow-md shadow-indigo-950/50 lg:shadow-indigo-900/20 transition"
              >
                <span>Get Started</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mission, Vision, Values Cards Row */}
      <section className="max-w-7xl w-full mx-auto px-5 sm:px-6 md:px-10 pt-8 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Our Mission */}
          <div className="bg-[#f0edfc] rounded-2xl p-6 border border-indigo-100/80 flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#dfd7fb] text-[#4c24b5] flex items-center justify-center shrink-0">
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Our Mission
              </h2>
              <p className="text-xs sm:text-[13px] text-slate-600 mt-1.5 leading-relaxed">
                To provide a seamless and transparent way for tenants and
                management to communicate and resolve apartment issues.
              </p>
            </div>
          </div>

          {/* Our Vision */}
          <div className="bg-[#f0edfc] rounded-2xl p-6 border border-indigo-100/80 flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#dfd7fb] text-[#4c24b5] flex items-center justify-center shrink-0">
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
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Our Vision
              </h2>
              <p className="text-xs sm:text-[13px] text-slate-600 mt-1.5 leading-relaxed">
                To create a well-managed, peaceful and comfortable living
                environment across all 5 residential units.
              </p>
            </div>
          </div>

          {/* Our Values */}
          <div className="bg-[#f0edfc] rounded-2xl p-6 border border-indigo-100/80 flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#dfd7fb] text-[#4c24b5] flex items-center justify-center shrink-0">
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
                  d="M12 3l8 6-8 12L4 9l8-6z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 9h16M12 3v18"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Our Values
              </h2>
              <p className="text-xs sm:text-[13px] text-slate-600 mt-1.5 leading-relaxed">
                Transparency, Responsiveness, and Excellence in every repair and
                resident interaction.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us? Section */}
      <section className="max-w-7xl w-full mx-auto px-5 sm:px-6 md:px-10 py-10 mb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div>
              <div className="w-10 h-1 rounded-full bg-[#4c24b5] mb-3" />
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Why Choose Us?
              </h2>
              <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                We designed this platform with you in mind — for a more
                organized, responsive and comfortable living experience.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-full bg-[#ebe6ff] text-[#4c24b5] flex items-center justify-center shrink-0">
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Report Issues Easily
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Submit complaints in just a few clicks with photos.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-full bg-[#ebe6ff] text-[#4c24b5] flex items-center justify-center shrink-0">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.1"
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
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Track Progress
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Know the status of your complaint in real-time.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-full bg-[#ebe6ff] text-[#4c24b5] flex items-center justify-center shrink-0">
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2l8 4v6c0 5.25-3.4 10.1-8 11-4.6-.9-8-5.75-8-11V6l8-4zm-1.2 13.2l5.2-5.2-1.4-1.4-3.8 3.8-1.8-1.8-1.4 1.4 3.2 3.2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Fast Resolution
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Get issues assigned to technicians and resolved promptly.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-full bg-[#ebe6ff] text-[#4c24b5] flex items-center justify-center shrink-0">
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
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Better Living
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    A well-maintained home for a happier community.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 relative">
            <div
              className="hidden sm:block absolute -left-6 top-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-[#cfc5fa]"
              aria-hidden="true"
            />
            <div className="relative rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-white">
              <img
                src="/interior.jpg"
                alt="Asiawu Oyenihun Holdings Residential Property"
                className="w-full h-72 sm:h-80 object-cover"
              />
              <div className="bg-gradient-to-r from-[#1a1045] to-[#341c8c] text-white px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-extrabold">
                    Asiawu Oyenihun Holdings
                  </p>
                  <p className="text-xs text-indigo-200">
                    Ahindero Area, Fate/Tanke, Ilorin • Units 1–5
                  </p>
                </div>
                <Link
                  to="/"
                  className="self-start sm:self-auto px-4 py-2 rounded-full bg-white text-[#4c24b5] text-xs font-extrabold hover:bg-indigo-50 transition shrink-0"
                >
                  Select Unit →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Matching Curved Footer */}
      <footer className="relative bg-[#140f33] text-white pt-10 pb-6 px-6 mt-auto overflow-hidden">
        <svg
          className="absolute top-0 left-0 w-full h-6 text-[#f7f6fe] fill-current"
          viewBox="0 0 1440 48"
          preserveAspectRatio="none"
        >
          <path d="M0,0 L1440,0 L1440,12 Q1080,48 720,24 Q360,0 0,32 Z" />
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
