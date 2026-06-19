"use client";

import { getHarvestApi } from "@/lib/harvest-api";
import { useV2Enabled } from "@/lib/v2-pages";
import type { User, UserRole } from "@/lib/domain";
import { BarChart3, Boxes, CalendarDays, ChevronLeft, ChevronRight, ClipboardList, LayoutDashboard, LogOut, Menu, PackagePlus, Settings, ShoppingCart, UserCircle, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const dealerNavItems = [
  { href: "/orders", label: "My Orders", icon: ClipboardList },
  { href: "/products", label: "Place Order", icon: Boxes },
  { href: "/rentals", label: "My Rentals", icon: CalendarDays },
  { href: "/profile", label: "Profile", icon: UserCircle },
];

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/adminorders", label: "Orders", icon: ShoppingCart },
  { href: "/adminproducts", label: "Products", icon: PackagePlus },
  { href: "/stockmanagement", label: "Stock", icon: PackagePlus },
  { href: "/customermanagement", label: "Customers", icon: Users },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/adminsettings", label: "Settings", icon: Settings },
  { href: "/adminrentals", label: "Rentals", icon: CalendarDays },
];

const adminRoutePrefixes = [
  "/admin",
  "/adminorders",
  "/adminproducts",
  "/stockmanagement",
  "/customermanagement",
  "/reports",
  "/adminsettings",
  "/adminrentals",
  "/rentalcalendar",
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const api = useMemo(() => getHarvestApi(), []);
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<UserRole | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(true);
  const currentV2Enabled = useV2Enabled(pathname);

  useEffect(() => {
    let mounted = true;
    const url = new URL(window.location.href);
    const mockRole = url.searchParams.get("mockRole");
    if (url.searchParams.get("mockAuth") === "1") {
      window.localStorage.setItem("harvest_mock_auth", "logged-in");
      if (mockRole === "admin" || mockRole === "dealer") {
        window.localStorage.setItem("harvest_mock_role", mockRole);
      }
      url.searchParams.delete("mockAuth");
      url.searchParams.delete("mockRole");
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }

    void api.getCurrentUser().then((user) => {
      if (!mounted) return;
      setUser(user);
      setRole(user?.role ?? "user");
    });
    return () => {
      mounted = false;
    };
  }, [api]);

  const isAdminRoute = adminRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const isAdmin = role === "admin";

  useEffect(() => {
    if (role && isAdminRoute && !isAdmin) {
      router.replace("/home");
    }
  }, [isAdmin, isAdminRoute, role, router]);

  const navItems = isAdmin ? adminNavItems : dealerNavItems;

  if (!role || (isAdminRoute && !isAdmin)) {
    return <AdminLoading />;
  }

  if (isAdmin) {
    const handleLogout = () => {
      window.localStorage.setItem("harvest_mock_auth", "logged-out");
      window.localStorage.removeItem("harvest_mock_role");
      window.dispatchEvent(new Event("harvest_mock_auth_changed"));
      router.push("/home");
    };

    if (isModernAdminV2Route(pathname) && currentV2Enabled) {
      return (
        <ModernAdminShell
          handleLogout={handleLogout}
          mobileMenuOpen={mobileMenuOpen}
          pathname={pathname}
          setMobileMenuOpen={setMobileMenuOpen}
          user={user}
        >
          {children}
        </ModernAdminShell>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="md:hidden bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between sticky top-0 z-50">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="p-2 bg-purple-600 rounded-lg">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white">Admin</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="p-2 text-slate-400 hover:bg-slate-700 rounded-lg"
            type="button"
            aria-label="Toggle admin navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <aside
          className={`fixed top-0 left-0 h-full bg-slate-800 border-r border-slate-700 z-50 transition-all duration-300 ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 ${sidebarCollapsed ? "w-20" : "w-64"}`}
        >
          <div className="h-20 flex items-center justify-between px-4 border-b border-slate-700">
            <div className={`flex items-center gap-3 ${sidebarCollapsed ? "justify-center w-full" : ""}`}>
              <div className="p-2 bg-purple-600 rounded-lg">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              {!sidebarCollapsed && (
                <div>
                  <h1 className="text-lg font-bold text-white">Admin Panel</h1>
                  <p className="text-xs text-purple-300">MANAGEMENT</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
              className="hidden md:flex p-2 text-slate-400 hover:bg-slate-700 rounded-lg"
              type="button"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-2 text-slate-400 hover:bg-slate-700 rounded-lg"
              type="button"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-4 space-y-2">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
              return (
                <Link
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                    sidebarCollapsed ? "justify-center" : ""
                  } ${isActive ? "bg-purple-600 text-white shadow-md" : "text-slate-400 hover:text-white hover:bg-slate-700"}`}
                  href={item.href}
                  key={item.href}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
            <div className={`flex items-center gap-3 ${sidebarCollapsed ? "justify-center" : ""}`}>
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {user?.fullName?.charAt(0) || user?.email?.charAt(0) || "U"}
                </span>
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user?.fullName || user?.email}</p>
                  <p className="text-xs text-slate-400">Administrator</p>
                </div>
              )}
              {!sidebarCollapsed && (
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
                  type="button"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </aside>

        <main className={`transition-all duration-300 ${sidebarCollapsed ? "md:ml-20" : "md:ml-64"} min-h-screen`}>
          <div className="p-6 md:p-8">{children}</div>
        </main>
      </div>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link href="/products" className="brand">
          <img src="https://media.base44.com/images/public/691daa20af5806873f836b87/d851d43b8_image.png" alt="Harvest Coffee" />
          <div>
            <strong>{isAdmin ? "Admin Panel" : "Dealer Portal"}</strong>
            <span>{isAdmin ? "Management" : "B2B partner access"}</span>
          </div>
        </Link>
        <nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/products" && item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
            return (
              <Link className={isActive ? "active" : ""} href={item.href} key={item.href}>
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <section className="workspace">{children}</section>
    </main>
  );
}

function isModernAdminV2Route(pathname: string) {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/adminorders") ||
    pathname.startsWith("/adminproducts") ||
    pathname.startsWith("/stockmanagement") ||
    pathname.startsWith("/customermanagement") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/adminsettings") ||
    pathname.startsWith("/adminrentals") ||
    pathname.startsWith("/rentalcalendar") ||
    pathname.startsWith("/notifications")
  );
}

function ModernAdminShell({
  children,
  handleLogout,
  mobileMenuOpen,
  pathname,
  setMobileMenuOpen,
  user,
}: {
  children: React.ReactNode;
  handleLogout: () => void;
  mobileMenuOpen: boolean;
  pathname: string;
  setMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  user: User | null;
}) {
  return (
    <div className="min-h-screen bg-[#fffaf1] text-[#3a2619]">
      <div className="relative min-h-screen overflow-hidden bg-[#fffaf1]">
        <div className="sticky top-0 z-50 flex items-center justify-between border-b border-[#e6d8c9] bg-[#fffaf1]/95 p-4 backdrop-blur sm:hidden">
          <Link href="/admin" className="flex items-center gap-3">
            <img src="https://media.base44.com/images/public/691daa20af5806873f836b87/d851d43b8_image.png" alt="Harvest Coffee" className="h-10 w-10 object-contain" />
            <span className="text-lg font-black text-[#3a2619]">Harvest Coffee</span>
          </Link>
          <button
            aria-label="Toggle admin navigation"
            className="rounded-md border border-[#e4d4c2] bg-[#f7ecdd] p-2 text-[#8a461c]"
            onClick={() => setMobileMenuOpen((open) => !open)}
            type="button"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r border-[#e6d8c9] bg-[#fff8ed] px-4 py-6 transition-transform sm:translate-x-0 ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Link href="/admin" className="mb-8 flex items-center gap-3 px-2">
            <img src="https://media.base44.com/images/public/691daa20af5806873f836b87/d851d43b8_image.png" alt="Harvest Coffee" className="h-12 w-12 object-contain" />
            <div>
              <h1 className="text-lg font-black uppercase leading-5 text-[#3a2619]">Harvest Coffee</h1>
              <p className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#8a461c]">Premium B2B Supply</p>
            </div>
          </Link>

          <nav className="grid gap-2">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
              return (
                <Link
                  className={`flex h-12 items-center gap-3 rounded-lg px-4 text-sm font-bold transition-colors ${
                    isActive ? "bg-[#f0dfca] text-[#7c3514]" : "text-[#6d5444] hover:bg-[#f6eadb] hover:text-[#7c3514]"
                  }`}
                  href={item.href}
                  key={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <CoffeeBranchMask className="pointer-events-none absolute bottom-28 left-0 h-56 w-56 bg-[#8a461c]/[0.08]" />

          <div className="relative mt-auto grid gap-3">
            <div className="flex items-center gap-3 rounded-lg border border-[#e8daca] bg-[#fffdf8] p-3">
              <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-[#f0dfca] text-sm font-black text-[#8a461c]">
                {(user?.fullName || user?.email || "HU").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-black text-[#3a2619]">{user?.fullName || user?.email}</p>
                <p className="text-[11px] font-semibold text-[#7f6554]">Administrator</p>
              </div>
            </div>
            <button
              className="flex h-11 items-center gap-3 rounded-lg border border-[#e8daca] bg-[#fffdf8] px-4 text-sm font-bold text-[#7c3514] transition-colors hover:bg-[#f6eadb]"
              onClick={handleLogout}
              type="button"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>

        {mobileMenuOpen && <button aria-label="Close navigation backdrop" className="fixed inset-0 z-40 bg-black/30 sm:hidden" onClick={() => setMobileMenuOpen(false)} type="button" />}

        <main className="min-h-screen sm:ml-56">
          <div className="px-5 py-6 sm:px-7 lg:px-10">{children}</div>
        </main>
      </div>
    </div>
  );
}

function AdminLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white">Loading...</p>
      </div>
    </div>
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
