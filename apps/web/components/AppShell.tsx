"use client";

import { clearHarvestSession, getHarvestAccessToken, getHarvestApi, hasHarvestSession, isHarvestMockAuthEnabled, syncHarvestSessionFromUrl } from "@/lib/harvest-api";
import { useNotificationsQuery } from "@/lib/harvest-query";
import type { User, UserRole } from "@/lib/domain";
import { BarChart3, Bell, Boxes, CalendarDays, ClipboardList, LayoutDashboard, LogOut, Menu, PackagePlus, Settings, ShoppingCart, UserCircle, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const dealerNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Place Order", icon: Boxes },
  { href: "/orders", label: "My Orders", icon: ClipboardList },
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
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(true);

  useEffect(() => {
    let mounted = true;
    setIsRedirecting(false);
    syncHarvestSessionFromUrl();

    if (!hasHarvestSession()) {
      setUser(null);
      setRole(null);
      setIsRedirecting(true);
      router.replace(`/login?next=${encodeURIComponent(pathname || "/home")}`);
      return () => {
        mounted = false;
      };
    }

    const storedMockRole = window.localStorage.getItem("harvest_mock_role");
    if (isHarvestMockAuthEnabled() && !getHarvestAccessToken() && hasHarvestSession() && (storedMockRole === "admin" || storedMockRole === "dealer")) {
      const mockUser = createMockShellUser(storedMockRole);
      setUser(mockUser);
      setRole(mockUser.role);
      return () => {
        mounted = false;
      };
    }

    void api.getCurrentUser().then((user) => {
      if (!mounted) return;
      if (!user) {
        setUser(null);
        setRole(null);
        setIsRedirecting(true);
        router.replace(`/login?next=${encodeURIComponent(pathname || "/home")}`);
        return;
      }
      setUser(user);
      setRole(user.role ?? "user");
    }).catch(() => {
      if (!mounted) return;
      setUser(null);
      setRole(null);
      setIsRedirecting(true);
      router.replace(`/login?next=${encodeURIComponent(pathname || "/home")}`);
    });
    return () => {
      mounted = false;
    };
  }, [api, pathname, router]);

  const isAdminRoute = adminRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const isAdmin = role === "admin";
  const adminRedirectTarget = isAdmin ? getAdminRedirectTarget(pathname) : null;

  useEffect(() => {
    if (role && isAdminRoute && !isAdmin) {
      router.replace("/home");
    }
  }, [isAdmin, isAdminRoute, role, router]);

  useEffect(() => {
    if (adminRedirectTarget) {
      router.replace(adminRedirectTarget);
    }
  }, [adminRedirectTarget, router]);

  if (isRedirecting || !role || (isAdminRoute && !isAdmin) || adminRedirectTarget) {
    return <AdminLoading />;
  }

  if (isAdmin) {
    const handleLogout = () => {
      clearHarvestSession();
      router.push("/home");
    };

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

  const handleLogout = () => {
    clearHarvestSession();
    router.push("/home");
  };

  return (
    <ModernDealerShell
      handleLogout={handleLogout}
      mobileMenuOpen={mobileMenuOpen}
      pathname={pathname}
      setMobileMenuOpen={setMobileMenuOpen}
      user={user}
    >
      {children}
    </ModernDealerShell>
  );
}

function isDealerRouteActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/products") return pathname === "/products";
  if (href === "/orders") return pathname === "/orders" || pathname.startsWith("/orderdetails") || pathname.startsWith("/trackorder");
  if (href === "/rentals") return pathname === "/rentals" || pathname.startsWith("/CreateRental");
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getAdminRedirectTarget(pathname: string) {
  if (pathname === "/dashboard") return "/admin";
  if (pathname === "/products") return "/adminproducts";
  if (pathname === "/orders") return "/adminorders";
  if (pathname === "/rentals" || pathname.startsWith("/CreateRental")) return "/adminrentals";
  if (pathname === "/profile") return "/adminsettings";
  return null;
}

function getDealerRouteTitle(pathname: string) {
  if (pathname.startsWith("/dashboard")) return "Dashboard";
  if (pathname.startsWith("/orderdetails")) return "Order details";
  if (pathname.startsWith("/trackorder")) return "Track order";
  if (pathname.startsWith("/CreateRental")) return "Start rental";
  if (pathname.startsWith("/orders")) return "My orders";
  if (pathname.startsWith("/rentals")) return "My rentals";
  if (pathname.startsWith("/notifications")) return "Notifications";
  if (pathname.startsWith("/profile")) return "Profile";
  return "Dealer portal";
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
  const notificationsQuery = useNotificationsQuery();
  const unreadNotifications = (notificationsQuery.data ?? []).filter((notification) => !notification.read).length;

  return (
    <div className="harvest-theme min-h-screen bg-background text-foreground">
      <div className="relative min-h-screen overflow-hidden bg-background">
        <div className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-background/95 p-4 backdrop-blur sm:hidden">
          <Link href="/admin" className="flex items-center gap-3">
            <img src="https://media.base44.com/images/public/691daa20af5806873f836b87/d851d43b8_image.png" alt="Harvest Coffee" className="h-10 w-10 object-contain" />
            <span className="text-lg font-black text-foreground">Harvest Coffee</span>
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell count={unreadNotifications} />
            <button
              aria-label="Toggle admin navigation"
              className="rounded-xl border border-border bg-card p-2 text-primary shadow-sm"
              onClick={() => setMobileMenuOpen((open) => !open)}
              type="button"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r border-border bg-card px-4 py-6 transition-transform sm:translate-x-0 ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Link href="/admin" className="mb-8 flex items-center gap-3 px-2">
            <img src="https://media.base44.com/images/public/691daa20af5806873f836b87/d851d43b8_image.png" alt="Harvest Coffee" className="h-12 w-12 object-contain" />
            <div>
              <h1 className="text-lg font-black uppercase leading-5 text-foreground">Harvest Coffee</h1>
              <p className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-primary">Premium B2B Supply</p>
            </div>
          </Link>

          <nav className="grid gap-2">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
              return (
                <Link
                  className={`flex h-12 items-center gap-3 rounded-lg px-4 text-sm font-bold transition-colors ${
                    isActive ? "bg-muted text-primary" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
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

          <CoffeeBranchMask className="pointer-events-none absolute bottom-28 left-0 h-56 w-56 bg-primary/[0.055]" />

          <div className="relative mt-auto grid gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
              <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-muted text-sm font-black text-primary">
                {(user?.fullName || user?.email || "HU").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-black text-foreground">{user?.fullName || user?.email}</p>
                <p className="text-[11px] font-semibold text-muted-foreground">Administrator</p>
              </div>
            </div>
            <button
              className="flex h-11 items-center gap-3 rounded-xl border border-border bg-background px-4 text-sm font-bold text-primary transition-colors hover:bg-muted"
              onClick={handleLogout}
              type="button"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>

        {mobileMenuOpen && <button aria-label="Close navigation backdrop" className="fixed inset-0 z-40 bg-black/30 sm:hidden" onClick={() => setMobileMenuOpen(false)} type="button" />}

        <main className="min-h-screen sm:ml-56 sm:pt-20">
          <header className="fixed right-0 top-0 z-30 hidden h-20 items-center justify-end gap-3 border-b border-border bg-background/95 px-7 backdrop-blur lg:px-10 sm:left-56 sm:flex">
            <NotificationBell count={unreadNotifications} />
            <div className="flex h-11 items-center gap-3 rounded-xl border border-border bg-card px-3 shadow-sm">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-xs font-black uppercase text-primary">
                {(user?.fullName || user?.email || "OA").slice(0, 2)}
              </div>
              <div className="hidden min-w-0 sm:block">
                <p className="max-w-44 truncate text-xs font-black text-foreground">{user?.fullName || user?.email}</p>
                <p className="text-[11px] font-semibold text-muted-foreground">Administrator</p>
              </div>
            </div>
          </header>
          <div className="px-5 py-6 sm:px-7 lg:px-10">{children}</div>
        </main>
      </div>
    </div>
  );
}

function ModernDealerShell({
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
  const notificationsQuery = useNotificationsQuery();
  const unreadNotifications = (notificationsQuery.data ?? []).filter((notification) => !notification.read).length;

  return (
    <div className="harvest-theme min-h-screen bg-background text-foreground">
      <div className="relative min-h-screen overflow-hidden bg-background">
        <div className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-background/95 p-4 backdrop-blur sm:hidden">
          <Link href="/dashboard" className="flex items-center gap-3">
            <img src="https://media.base44.com/images/public/691daa20af5806873f836b87/d851d43b8_image.png" alt="Harvest Coffee" className="h-10 w-10 object-contain" />
            <span className="text-lg font-black text-foreground">Dealer Portal</span>
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell count={unreadNotifications} />
            <button
              aria-label="Toggle dealer navigation"
              className="rounded-xl border border-border bg-card p-2 text-primary shadow-sm"
              onClick={() => setMobileMenuOpen((open) => !open)}
              type="button"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-border bg-card px-4 py-6 transition-transform sm:translate-x-0 ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Link href="/dashboard" className="mb-8 flex items-center gap-3 px-2">
            <img src="https://media.base44.com/images/public/691daa20af5806873f836b87/d851d43b8_image.png" alt="Harvest Coffee" className="h-12 w-12 object-contain" />
            <div>
              <h1 className="text-lg font-black uppercase leading-5 text-foreground">Harvest Coffee</h1>
              <p className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-primary">Dealer Portal</p>
            </div>
          </Link>

          <nav className="grid gap-2">
            {dealerNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = isDealerRouteActive(pathname, item.href);
              return (
                <Link
                  className={`flex h-12 items-center gap-3 rounded-lg px-4 text-sm font-bold transition-colors ${
                    isActive ? "bg-muted text-primary" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  }`}
                  href={item.href}
                  key={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.href === "/notifications" && unreadNotifications > 0 && (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-black text-primary-foreground">
                      {unreadNotifications > 9 ? "9+" : unreadNotifications}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <CoffeeBranchMask className="pointer-events-none absolute bottom-28 left-0 h-56 w-56 bg-primary/[0.045]" />

          <div className="relative mt-auto grid gap-3">
            <div className="rounded-xl border border-border bg-background p-3">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-muted text-sm font-black text-primary">
                  {(user?.fullName || user?.email || "DU").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-black text-foreground">{user?.fullName || user?.email}</p>
                  <p className="text-[11px] font-semibold text-muted-foreground">{user?.companyName || "B2B partner"}</p>
                </div>
              </div>
            </div>
            <button
              className="flex h-11 items-center gap-3 rounded-xl border border-border bg-background px-4 text-sm font-bold text-primary transition-colors hover:bg-muted"
              onClick={handleLogout}
              type="button"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>

        {mobileMenuOpen && <button aria-label="Close navigation backdrop" className="fixed inset-0 z-40 bg-black/30 sm:hidden" onClick={() => setMobileMenuOpen(false)} type="button" />}

        <main className="min-h-screen sm:ml-60 sm:pt-20">
          <header className="fixed right-0 top-0 z-30 hidden h-20 items-center justify-between border-b border-border bg-background/95 px-7 backdrop-blur lg:px-10 sm:left-60 sm:flex">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Dealer</p>
              <h2 className="text-lg font-black text-foreground">{getDealerRouteTitle(pathname)}</h2>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell count={unreadNotifications} />
              <div className="flex h-11 items-center gap-3 rounded-xl border border-border bg-card px-3 shadow-sm">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-xs font-black uppercase text-primary">
                  {(user?.fullName || user?.email || "DU").slice(0, 2)}
                </div>
                <div className="hidden min-w-0 sm:block">
                  <p className="max-w-44 truncate text-xs font-black text-foreground">{user?.fullName || user?.email}</p>
                  <p className="text-[11px] font-semibold text-muted-foreground">Dealer</p>
                </div>
              </div>
            </div>
          </header>
          <div className="px-5 py-6 sm:px-7 lg:px-10">{children}</div>
        </main>
      </div>
    </div>
  );
}

function NotificationBell({ count }: { count: number }) {
  return (
    <Link
      aria-label={count > 0 ? `${count} unread notifications` : "Open notifications"}
      className="relative grid h-11 w-11 place-items-center rounded-xl border border-border bg-card text-primary shadow-sm transition-colors hover:bg-muted"
      href="/notifications"
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-black text-primary-foreground ring-2 ring-background">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}

function AdminLoading() {
  return (
    <div className="harvest-theme relative grid min-h-screen place-items-center overflow-hidden bg-background px-6 text-foreground">
      <CoffeeBranchMask className="pointer-events-none absolute -left-24 top-16 h-72 w-72 bg-primary/[0.055]" />
      <CoffeeBranchMask className="pointer-events-none absolute -right-20 bottom-10 h-80 w-80 -scale-x-100 bg-primary/[0.045]" />
      <section className="relative w-full max-w-sm rounded-2xl border border-border bg-card/95 p-7 text-center shadow-2xl shadow-primary/10">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-xl border border-border bg-muted text-primary">
          <LayoutDashboard className="h-7 w-7" />
        </div>
        <div className="mx-auto mb-5 h-9 w-9 animate-spin rounded-full border-2 border-border border-t-primary" />
        <p className="text-[11px] font-black uppercase tracking-[0.26em] text-primary">Harvest Coffee</p>
        <h1 className="mt-2 text-2xl font-black tracking-normal text-foreground">Preparing workspace</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-muted-foreground">Checking your session and loading the right workspace.</p>
      </section>
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

function createMockShellUser(role: Extract<UserRole, "admin" | "dealer">): User {
  if (role === "admin") {
    return {
      id: "user-demo-3",
      email: "ops@example.com",
      fullName: "Ops Admin",
      role: "admin",
      customerSegment: "regular",
      addresses: [],
    };
  }

  return {
    id: "user-demo-1",
    email: "dealer@example.com",
    fullName: "Hakan Urtimur",
    companyName: "North Quarter Cafe",
    role: "dealer",
    customerSegment: "regular",
    addresses: [{ title: "Main cafe", address: "Unit 4, Roastery Lane" }],
  };
}
