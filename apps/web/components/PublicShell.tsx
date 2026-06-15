"use client";

import { getHarvestApi } from "@/lib/harvest-api";
import { useV2Enabled } from "@/lib/v2-pages";
import { CalendarDays, CircleUserRound, ClipboardList, LogIn, LogOut, MapPin, Menu, ShoppingBag, User, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type PublicShellProps = {
  children: React.ReactNode;
};

type NavigationItem = {
  label: string;
  href: string;
  pageNames: string[];
  icon?: React.ComponentType<{ className?: string }>;
  authenticatedOnly?: boolean;
};

const navItems: NavigationItem[] = [
  { label: "Home", href: "/home", pageNames: ["Home"] },
  { label: "About", href: "/about", pageNames: ["About"] },
  { label: "Contact", href: "/contact", pageNames: ["Contact"] },
  { label: "Products", href: "/products", pageNames: ["Products"], icon: ShoppingBag },
  { label: "My Orders", href: "/orders", pageNames: ["Orders", "OrderDetails"], icon: ClipboardList, authenticatedOnly: true },
  { label: "Rentals", href: "/rentals", pageNames: ["Rentals", "CreateRental"], icon: CalendarDays, authenticatedOnly: true },
  { label: "Profile", href: "/profile", pageNames: ["Profile"], icon: CircleUserRound, authenticatedOnly: true },
];

const footerCupImage = "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=520&q=85";

export default function PublicShell({ children }: PublicShellProps) {
  const api = useMemo(() => getHarvestApi(), []);
  const pathname = usePathname();
  const router = useRouter();
  const currentPageName = getCurrentPageName(pathname);
  const currentV2Enabled = useV2Enabled(pathname || "/home");
  const isModernPublicV2 =
    ["Home", "About", "Contact", "Products", "Login", "TrackOrder", "Orders", "OrderDetails", "Rentals", "CreateRental", "Profile"].includes(currentPageName) &&
    currentV2Enabled;
  const [userLabel, setUserLabel] = useState("Harvest User");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const syncAuth = () => {
      const url = new URL(window.location.href);
      const hasMockAuthParam = url.searchParams.get("mockAuth") === "1";
      const mockRole = url.searchParams.get("mockRole");
      if (hasMockAuthParam) {
        window.localStorage.setItem("harvest_mock_auth", "logged-in");
        if (mockRole === "admin" || mockRole === "dealer") {
          window.localStorage.setItem("harvest_mock_role", mockRole);
        }
        url.searchParams.delete("mockAuth");
        url.searchParams.delete("mockRole");
        window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
      }

      const authenticated = hasMockAuthParam || window.localStorage.getItem("harvest_mock_auth") === "logged-in";
      setIsAuthenticated(authenticated);
      if (!authenticated) {
        setUserLabel("Harvest User");
        return;
      }

      void api.getCurrentUser().then((user) => {
        setUserLabel(user?.fullName || user?.email || "Harvest User");
      });
    };

    syncAuth();
    window.addEventListener("harvest_mock_auth_changed", syncAuth);
    window.addEventListener("storage", syncAuth);
    return () => {
      window.removeEventListener("harvest_mock_auth_changed", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, [api]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent | { matches: boolean }) => {
      document.documentElement.classList.toggle("dark", event.matches);
    };

    handleChange({ matches: mediaQuery.matches });
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const handleLogout = () => {
    window.localStorage.setItem("harvest_mock_auth", "logged-out");
    window.localStorage.removeItem("harvest_mock_role");
    setIsAuthenticated(false);
    setUserLabel("Harvest User");
    window.dispatchEvent(new Event("harvest_mock_auth_changed"));
    router.push("/home");
  };

  const loginHref = `/login?next=${encodeURIComponent(pathname || "/home")}`;

  if (isModernPublicV2) {
    return (
      <div
        className="harvest-theme flex min-h-screen flex-col bg-background text-foreground"
        style={{
          overscrollBehavior: "none",
          paddingTop: "max(0px, env(safe-area-inset-top))",
        }}
      >
        <nav className="fixed left-0 right-0 top-0 z-50 hidden px-6 pt-6 md:block">
          <div className="motion-nav-shell mx-auto flex h-16 max-w-7xl items-center justify-between gap-5 rounded-full border border-border/80 bg-card/90 px-4 shadow-2xl shadow-primary/10 backdrop-blur-xl">
            <Link href="/home" className="flex min-w-[220px] items-center gap-3">
              <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-background shadow-sm ring-1 ring-border">
                <img
                  src="https://media.base44.com/images/public/691daa20af5806873f836b87/d851d43b8_image.png"
                  alt="Harvest Coffee Logo"
                  className="h-9 w-9 object-contain"
                />
              </span>
              <div>
                <h1 className="font-display text-sm font-bold text-foreground">Harvest Coffee</h1>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Premium B2B</p>
              </div>
            </Link>

            <div className="flex min-w-0 flex-1 items-center justify-center gap-1">
              {navItems
                .filter((item) => !item.authenticatedOnly || isAuthenticated)
                .map((item) => {
                  const Icon = item.icon;
                  const active = item.pageNames.includes(currentPageName);
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition-colors ${
                        active ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/72 hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      {Icon && <Icon className="h-3.5 w-3.5" />}
                      {item.label}
                    </Link>
                  );
                })}
            </div>

            {isAuthenticated ? (
              <div className="flex min-w-[220px] items-center justify-end gap-2">
                <div className="flex max-w-[150px] items-center gap-2 rounded-full border border-border bg-secondary/70 px-3 py-2 text-xs font-bold text-foreground/85">
                  <User className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                  <span className="truncate">{userLabel}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-border bg-secondary/70 px-3 text-xs font-bold text-foreground/75 transition-colors hover:bg-secondary hover:text-foreground"
                  type="button"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href={loginHref}
                className="inline-flex h-10 min-w-[150px] items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/15 transition-colors hover:bg-primary/90"
              >
                <LogIn className="h-4 w-4" />
                Dealer Login
              </Link>
            )}
          </div>
        </nav>

        <nav className="fixed left-0 right-0 top-0 z-50 px-4 pt-4 md:hidden">
          <div className="motion-nav-shell rounded-2xl border border-border/80 bg-card/95 px-3 py-3 shadow-xl shadow-primary/10 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <Link href="/home" className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-background shadow-sm ring-1 ring-border">
                <img
                  src="https://media.base44.com/images/public/691daa20af5806873f836b87/d851d43b8_image.png"
                  alt="Harvest Coffee Logo"
                  className="h-9 w-9 object-contain"
                />
              </span>
              <span className="font-semibold text-foreground">Harvest Coffee</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="rounded-full bg-secondary p-2 text-foreground shadow-sm ring-1 ring-border"
              type="button"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="mt-3 grid gap-1 rounded-2xl border border-border bg-card p-2 shadow-lg">
              {navItems
                .filter((item) => !item.authenticatedOnly || isAuthenticated)
                .map((item) => {
                  const Icon = item.icon;
                  const active = item.pageNames.includes(currentPageName);
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold ${
                        active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"
                      }`}
                    >
                      {Icon && <Icon className="h-4 w-4" />}
                      {item.label}
                    </Link>
                  );
                })}
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-foreground hover:bg-secondary"
                  type="button"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              ) : (
                <Link
                  href={loginHref}
                  className="flex items-center gap-2 rounded-xl bg-primary px-3 py-3 text-sm font-semibold text-primary-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LogIn className="h-4 w-4" />
                  Dealer Login
                </Link>
              )}
            </div>
          )}
          </div>
        </nav>

        <main className="flex-1">{children}</main>

        <footer className="relative mt-auto overflow-hidden border-y border-border bg-card text-foreground">
          <div className="relative mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 sm:px-8 md:min-h-28 md:grid-cols-[minmax(0,1fr)_auto_minmax(170px,0.75fr)] md:gap-8 lg:px-10">
            <div className="relative z-10">
              <h3 className="font-display text-2xl font-black leading-none text-foreground md:text-3xl">Harvest Coffee</h3>
              <p className="mt-1.5 text-xs font-extrabold text-primary sm:text-sm">Premium B2B Coffee Supply</p>
              <p className="mt-2 flex max-w-[260px] items-start gap-2 text-xs font-semibold leading-5 text-foreground/68 sm:text-sm">
                <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary sm:h-4 sm:w-4" />
                <span>The Breeches, Galleyhill Road, Waltham Abbey, EN9 2AQ</span>
              </p>
            </div>

            <div className="relative z-10 flex items-center justify-center gap-7">
              <div className="hidden h-16 w-px bg-border md:block" />
              <FooterStamp />
            </div>

            <div className="relative z-10 hidden h-28 items-center justify-end md:flex">
              <CoffeeBranchMask className="absolute bottom-0 left-2 h-24 w-24 bg-primary/[0.075] lg:left-6" />
              <div className="relative h-24 w-24 overflow-hidden rounded-full border-[7px] border-card bg-secondary shadow-xl shadow-primary/10 ring-1 ring-border lg:h-28 lg:w-28">
                <img alt="Coffee cup" className="h-full w-full object-cover" src={footerCupImage} />
              </div>
            </div>
          </div>

          <div className="relative border-t border-primary/20 bg-primary px-5 py-2.5 text-center text-sm font-semibold text-primary-foreground sm:px-8">
            © 2026 Harvest Coffee. All rights reserved.
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 md:pb-0 pb-20"
      style={{
        overscrollBehavior: "none",
        paddingTop: "max(0px, env(safe-area-inset-top))",
        paddingBottom: "max(5rem, env(safe-area-inset-bottom))",
      }}
    >
      <nav className="hidden md:block bg-white dark:bg-gray-900 border-b border-amber-100 dark:border-gray-700 sticky top-0 z-50 shadow-sm dark:shadow-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/home" className="flex items-center gap-3 group">
              <img
                src="https://media.base44.com/images/public/691daa20af5806873f836b87/d851d43b8_image.png"
                alt="Harvest Coffee Logo"
                className="w-16 h-16 object-contain group-hover:scale-105 transition-transform"
              />
              <div>
                <h1 className="text-2xl font-bold text-amber-900" style={{ fontFamily: "Georgia, serif" }}>
                  Harvest Coffee
                </h1>
                <p className="text-xs text-amber-700 tracking-wide">PREMIUM B2B</p>
              </div>
            </Link>

            <button
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="md:hidden p-2 text-amber-900 hover:bg-amber-50 rounded-lg"
              type="button"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div
              className={`fixed md:relative top-20 md:top-auto left-0 right-0 md:flex items-center gap-2 bg-white md:bg-transparent border-b md:border-0 border-amber-100 ${
                mobileMenuOpen ? "flex flex-col p-4 gap-1 z-40" : "hidden md:flex"
              }`}
            >
              {navItems
                .filter((item) => !item.authenticatedOnly || isAuthenticated)
                .map((item) => {
                  const Icon = item.icon;
                  const active = item.pageNames.includes(currentPageName);
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${
                        mobileMenuOpen ? "w-full" : ""
                      } ${active ? "bg-amber-900 text-white shadow-md" : "text-amber-900 hover:bg-amber-50"}`}
                    >
                      {Icon && <Icon className="w-4 h-4" />}
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}

              {isAuthenticated ? (
                <div className="flex items-center gap-2 ml-2">
                  <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-lg">
                    <User className="w-4 h-4 text-amber-700" />
                    <span className="text-sm font-medium text-amber-900">{userLabel}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center px-4 py-2 text-amber-900 hover:bg-amber-50 rounded-lg transition-colors"
                    type="button"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              ) : (
                <Link
                  href={loginHref}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-amber-900 hover:bg-amber-800 text-white ml-2 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Dealer Login</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:pb-0 pb-24">
        <div>{children}</div>
      </main>

      <footer className="hidden md:block bg-amber-900 dark:bg-gray-900 text-amber-50 dark:text-gray-300 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "Georgia, serif" }}>
                Harvest Coffee
              </h3>
              <p className="text-amber-200 text-sm">Premium B2B Coffee Supply</p>
              <p className="text-amber-300 text-xs mt-2">The Breeches, Galleyhill Road, Waltham Abbey, EN9 2AQ</p>
            </div>
            <div className="text-center md:text-right text-amber-200 text-sm">
              <p>© 2026 Harvest Coffee. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>

      <footer className="md:hidden bg-amber-900 dark:bg-gray-900 text-amber-50 dark:text-gray-300 py-8 px-4 border-t border-amber-800 dark:border-gray-700 mb-16">
        <div className="text-center">
          <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "Georgia, serif" }}>
            Harvest Coffee
          </h3>
          <p className="text-amber-200 text-xs">© 2026 All rights reserved</p>
        </div>
      </footer>
    </div>
  );
}

function FooterStamp() {
  return (
    <svg aria-hidden="true" className="footer-stamp h-20 w-20 flex-shrink-0 text-primary/50 sm:h-24 sm:w-24 md:h-28 md:w-28" viewBox="0 0 160 160">
      <defs>
        <path d="M 34 80 A 46 46 0 1 1 126 80" id="footer-stamp-top" />
        <path d="M 126 80 A 46 46 0 1 1 34 80" id="footer-stamp-bottom" />
      </defs>
      <circle cx="80" cy="80" fill="transparent" r="58" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="80" cy="80" fill="transparent" r="36" stroke="currentColor" strokeOpacity="0.58" strokeWidth="1.1" />
      <text fill="currentColor" fontSize="8.7" fontWeight="900" letterSpacing="3.1">
        <textPath href="#footer-stamp-top" startOffset="50%" textAnchor="middle">
          HARVEST COFFEE
        </textPath>
      </text>
      <text fill="currentColor" fontSize="7" fontWeight="900" letterSpacing="2.3">
        <textPath href="#footer-stamp-bottom" startOffset="50%" textAnchor="middle">
          PREMIUM B2B SUPPLY
        </textPath>
      </text>
      <image height="36" href="/assets/coffee-branch-clean.svg" opacity="0.58" width="36" x="62" y="61" />
    </svg>
  );
}

function CoffeeBranchMask({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        display: "block",
        maskImage: "url('/assets/coffee-branch-clean.svg')",
        maskPosition: "center",
        maskRepeat: "no-repeat",
        maskSize: "contain",
        WebkitMaskImage: "url('/assets/coffee-branch-clean.svg')",
        WebkitMaskPosition: "center",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
      }}
    />
  );
}

function getCurrentPageName(pathname: string) {
  if (pathname === "/" || pathname === "/home") return "Home";
  if (pathname.startsWith("/about")) return "About";
  if (pathname.startsWith("/contact")) return "Contact";
  if (pathname.startsWith("/products") || pathname.startsWith("/Products") || pathname.startsWith("/catalog")) return "Products";
  if (pathname.startsWith("/login")) return "Login";
  if (pathname.startsWith("/trackorder")) return "TrackOrder";
  if (pathname.startsWith("/orderdetails")) return "OrderDetails";
  if (pathname.startsWith("/orders")) return "Orders";
  if (pathname.startsWith("/CreateRental")) return "CreateRental";
  if (pathname.startsWith("/rentals/new")) return "CreateRental";
  if (pathname.startsWith("/rentals")) return "Rentals";
  if (pathname.startsWith("/profile")) return "Profile";
  return "";
}
