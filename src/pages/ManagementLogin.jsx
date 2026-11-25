import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { validatePassword } from "../lib/validation.js";

export default function ManagementLogin() {
  const { signInManagement } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const problem = validatePassword(password);
    if (problem) return setError(problem);
    setBusy(true);
    setError("");
    try {
      await signInManagement(password);
      navigate("/management");
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#f4f2ff] flex items-center justify-center lg:justify-end font-sans">
      {/* Full-Bleed Left Building Photo */}
      <div
        className="absolute inset-0 bg-cover bg-left lg:w-[72%]"
        style={{
          backgroundImage: "url('/building.png')",
        }}
      />

      {/* Mobile/Tablet Soft Backdrop */}
      <div className="absolute inset-0 bg-[#f4f2ff]/85 lg:hidden" />

      {/* Smooth Two-Tone Curved Backdrop on the Right */}
      <svg
        className="hidden lg:block absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
      >
        <path
          d="M840,0 C740,260 760,620 880,900 L1440,900 L1440,0 Z"
          fill="#f4f2ff"
        />
        <path d="M875,0 C820,210 960,430 1440,560 L1440,0 Z" fill="#dcd6fa" />
      </svg>

      {/* Bottom-Left Deep Purple Curved Corner + Tagline */}
      <div className="hidden md:block absolute bottom-0 left-0 z-10 w-[460px] h-[265px] pointer-events-none">
        <svg
          className="w-full h-full"
          viewBox="0 0 460 265"
          fill="none"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient
              id="mgmtCornerWave"
              x1="0"
              y1="60"
              x2="380"
              y2="265"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#37198a" stopOpacity="0.96" />
              <stop offset="100%" stopColor="#5620b8" stopOpacity="0.97" />
            </linearGradient>
          </defs>
          <path
            d="M0,42 C155,75 305,152 448,265 L0,265 Z"
            fill="url(#mgmtCornerWave)"
          />
        </svg>

        <div className="absolute bottom-7 left-8 text-white max-w-[300px]">
          <svg
            className="w-12 h-12 mb-2.5 text-white"
            viewBox="0 0 48 48"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.2"
          >
            <path
              d="M6 23L24 8L42 23"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M12 20V39M36 20V39" strokeLinecap="round" />
            <rect
              x="20"
              y="22"
              width="3.5"
              height="3.5"
              fill="currentColor"
              stroke="none"
            />
            <rect
              x="25.5"
              y="22"
              width="3.5"
              height="3.5"
              fill="currentColor"
              stroke="none"
            />
            <rect
              x="20"
              y="27.5"
              width="3.5"
              height="3.5"
              fill="currentColor"
              stroke="none"
            />
            <rect
              x="25.5"
              y="27.5"
              width="3.5"
              height="3.5"
              fill="currentColor"
              stroke="none"
            />
          </svg>
          <h2 className="text-[22px] font-bold leading-snug tracking-tight">
            Your Home. Our Priority.
          </h2>
          <p className="text-xs text-indigo-100/90 mt-1 leading-relaxed">
            Assign technicians, track maintenance tickets, and keep every unit
            running smoothly.
          </p>
        </div>
      </div>

      {/* Main White Login Card on the Right */}
      <div className="relative z-20 w-full max-w-[440px] mx-4 lg:mr-20 xl:mr-28 my-10">
        <div className="bg-white rounded-[30px] shadow-[0_24px_60px_rgba(49,27,146,0.14)] px-8 py-10 sm:px-10 sm:py-12">
          {/* Top Management Shield-House Emblem with Curved Purple Swoosh */}
          <div className="flex flex-col items-center text-center">
            <svg
              className="w-16 h-16 mb-3"
              viewBox="0 0 64 56"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M32 7L49 14.5V26.5C49 36.2 41.7 44.5 32 46.5C22.3 44.5 15 36.2 15 26.5V14.5L32 7Z"
                stroke="#140f33"
                strokeWidth="3.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M25.5 26.5L30 31L39 21.5"
                stroke="#5b21b6"
                strokeWidth="3.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10 49C22 43 42 43 54 49"
                stroke="#6d28d9"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </svg>

            <h1 className="text-[28px] font-extrabold text-slate-900 tracking-tight">
              Management Portal
            </h1>
            <p className="text-[14px] text-slate-600 mt-1">
              Authorized access for{" "}
              <span className="font-semibold text-[#4c24b5]">
                Landlord &amp; Caretaker
              </span>
            </p>
          </div>

          {/* Single Management Password Form */}
          <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
            <div>
              <label htmlFor="pw" className="sr-only">
                Management Password
              </label>
              <div
                className={`flex items-center rounded-xl bg-[#f1f2f6] border px-4 py-3.5 transition ${
                  error
                    ? "border-red-500 ring-2 ring-red-100"
                    : "border-transparent focus-within:border-[#4c24b5] focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100"
                }`}
              >
                <svg
                  className="w-5 h-5 text-slate-600 shrink-0 mr-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.9"
                >
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 018 0v4" strokeLinecap="round" />
                  <circle cx="12" cy="16" r="1" fill="currentColor" />
                </svg>

                <input
                  id="pw"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Management Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-slate-600 hover:text-slate-900 ml-2 focus:outline-none cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
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
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  ) : (
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
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {error && (
                <p
                  className="mt-2 text-xs font-medium text-red-600"
                  role="alert"
                >
                  {error}
                </p>
              )}
            </div>

            {/* Remember Me Checkbox + Back to Units Link */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="inline-flex items-center gap-2 text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#4c24b5] focus:ring-[#4c24b5]"
                />
                <span>Remember me</span>
              </label>

              <Link
                to="/"
                className="font-semibold text-[#4c24b5] hover:underline"
              >
                Back to units
              </Link>
            </div>

            {/* Solid Deep-Purple Pill Login Button */}
            <button
              type="submit"
              disabled={busy}
              className="w-full py-3.5 px-6 rounded-full bg-[#4c24b5] hover:bg-[#3f1c9c] text-white font-bold text-[15px] shadow-[0_8px_20px_rgba(76,36,181,0.3)] flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer mt-2"
            >
              <span>{busy ? "Logging in..." : "Login"}</span>
              {!busy && (
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
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
              )}
            </button>
          </form>

          {/* Bottom Divider & Tenant Portal Link */}
          <div className="mt-6">
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-xs text-slate-400">or</span>
              <div className="border-t border-slate-200 w-full" />
            </div>

            <p className="mt-4 text-center text-xs text-slate-700">
              Are you a resident?{" "}
              <Link to="/" className="font-bold text-[#4c24b5] hover:underline">
                Select Your Unit
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
