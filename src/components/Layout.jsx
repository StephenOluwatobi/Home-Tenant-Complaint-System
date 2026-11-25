import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";

export default function Layout({ children }) {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    signOut();
    navigate("/");
  };

  // Render full-bleed on all styled AOH Management Systems views
  if (
    location.pathname === "/" ||
    location.pathname === "/about" ||
    location.pathname.endsWith("/login") ||
    location.pathname === "/tenant" ||
    location.pathname === "/tenant/new" ||
    location.pathname === "/management" ||
    location.pathname === "/management/history" ||
    location.pathname.includes("/complaints/")
  ) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <span
              className="flex h-8 w-6 items-end justify-center rounded-t-full border-2 border-door bg-door-soft"
              aria-hidden="true"
            />
            Tenant Complaints
          </Link>
          {session && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-slate-600">
                {session.role === "tenant"
                  ? `Unit ${session.unit}`
                  : "Management"}
              </span>
              <button onClick={logout} className="btn-ghost !py-1.5">
                Log out
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {children}
      </main>
      <footer className="border-t border-line py-4 text-center text-xs text-slate-500">
        Asiawu Oyenihun Holdings, Ilorin
      </footer>
    </div>
  );
}
