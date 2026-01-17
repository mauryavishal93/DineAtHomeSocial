import { Link, NavLink } from "react-router-dom";

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `hidden sm:inline text-sm ${isActive ? "text-ink-900" : "text-ink-700 hover:text-ink-900"}`
      }
    >
      {children}
    </NavLink>
  );
}

export function AppShell({ children }) {
  return (
    <div className="min-h-screen text-ink-900">
      <header className="sticky top-0 z-20 border-b border-sand-200 bg-sand-50/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-lg font-semibold tracking-tight">DineAtHome Social</span>
            <span className="hidden rounded-full border border-sand-200 bg-white/60 px-2 py-0.5 text-xs text-ink-700 sm:inline">
              Home-hosted dining, made social.
            </span>
          </Link>
          <nav className="flex items-center gap-3">
            <NavItem to="/events">Explore</NavItem>
            <NavItem to="/host">Become a host</NavItem>
            <NavItem to="/about">About</NavItem>
            <Link
              to="/auth/login"
              className="rounded-full px-3 py-1.5 text-sm text-ink-800 hover:bg-sand-100"
            >
              Login
            </Link>
            <Link
              to="/auth/register"
              className="shine rounded-full bg-gradient-to-r from-coral-500 via-violet-500 to-sky-500 px-4 py-1.5 text-sm font-medium text-white shadow-soft hover:shadow-card"
            >
              Join
            </Link>
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="mt-16 border-t border-sand-200 bg-sand-50/60">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
          <div className="space-y-2">
            <div className="text-lg font-semibold tracking-tight">DineAtHome Social</div>
            <div className="text-sm text-ink-700">Home-hosted dining, made social.</div>
          </div>
          <div className="text-sm text-ink-700">
            <div className="mb-2 font-medium text-ink-900">Explore</div>
            <div className="space-y-1">
              <Link className="block hover:text-ink-900" to="/events">
                Events
              </Link>
              <Link className="block hover:text-ink-900" to="/host">
                Become a host
              </Link>
              <Link className="block hover:text-ink-900" to="/how-it-works">
                How it works
              </Link>
            </div>
          </div>
          <div className="text-sm text-ink-700">
            <div className="mb-2 font-medium text-ink-900">Account</div>
            <div className="space-y-1">
              <Link className="block hover:text-ink-900" to="/auth/login">
                Login
              </Link>
              <Link className="block hover:text-ink-900" to="/auth/register">
                Register
              </Link>
              <Link className="block hover:text-ink-900" to="/guest/profile">
                Guest profile
              </Link>
            </div>
          </div>
          <div className="md:col-span-3 border-t border-sand-200 pt-6 text-xs text-ink-600">
            © {new Date().getFullYear()} DineAtHome Social.
          </div>
        </div>
      </footer>
    </div>
  );
}

