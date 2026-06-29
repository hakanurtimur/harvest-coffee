"use client";

import { Card } from "@/components/ui/card";
import AdminPageHeader from "@/components/AdminPageHeader";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { useOrdersQuery, useRentalsQuery, useUsersQuery } from "@/lib/harvest-query";
import type { Order, Rental, User } from "@/lib/domain";
import { AlertTriangle, BarChart3, CheckCircle, Clock, Package, PieChart as PieChartIcon, TrendingUp, Users } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";

type ReportTab = "rentals" | "sales" | "customers";

type CustomerReport = {
  id: string;
  email: string;
  name: string;
  orders: number;
  spent: number;
  lastOrder: string;
};

type MonthlyReport = {
  month: string;
  count: number;
  revenue: number;
};

const rentalColors = {
  active: "hsl(var(--status-success))",
  upcoming: "hsl(var(--status-info))",
  expiringSoon: "hsl(var(--status-warning))",
  expired: "hsl(var(--status-danger))",
};

const rentalStatusChartConfig = {
  active: { label: "Active", color: rentalColors.active },
  upcoming: { label: "Upcoming", color: rentalColors.upcoming },
  expiringSoon: { label: "Expiring Soon", color: rentalColors.expiringSoon },
  expired: { label: "Expired", color: rentalColors.expired },
} satisfies ChartConfig;

const monthlyOrdersChartConfig = {
  count: { label: "Orders", color: "hsl(var(--chart-1))" },
  revenue: { label: "Revenue", color: "hsl(var(--status-success))" },
} satisfies ChartConfig;

export default function AdminReportsModernWorkspace() {
  const rentalsQuery = useRentalsQuery();
  const ordersQuery = useOrdersQuery();
  const usersQuery = useUsersQuery();
  const [activeTab, setActiveTab] = useState<ReportTab>("rentals");
  const rentals = rentalsQuery.data ?? [];
  const orders = ordersQuery.data ?? [];
  const users = usersQuery.data ?? [];
  const isLoading = rentalsQuery.isLoading || ordersQuery.isLoading || usersQuery.isLoading;

  const activeRentals = rentals.filter((rental) => rental.status === "active");
  const upcomingRentals = rentals.filter((rental) => rental.status === "upcoming");
  const expiringRentals = getExpiringRentals(rentals);
  const expiredRentals = rentals.filter((rental) => rental.status === "expired");
  const rentalStatusData = [
    { key: "active", name: "Active", value: activeRentals.length, fill: "var(--color-active)" },
    { key: "upcoming", name: "Upcoming", value: upcomingRentals.length, fill: "var(--color-upcoming)" },
    { key: "expiringSoon", name: "Expiring Soon", value: expiringRentals.length, fill: "var(--color-expiringSoon)" },
    { key: "expired", name: "Expired", value: expiredRentals.length, fill: "var(--color-expired)" },
  ];
  const monthlyData = getMonthlyOrderData(orders);
  const customerData = getCustomerData(orders, users);
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const nonAdminUsers = users.filter((user) => user.role !== "admin");
  const maxCustomerSpent = Math.max(...customerData.map((customer) => customer.spent), 1);

  return (
    <div className="harvest-theme space-y-5 text-foreground">
      <AdminPageHeader title="Reports" description="Analytics, rentals, and customer insights" />

      <section className="rounded-2xl border border-border bg-card p-2 shadow-sm shadow-primary/5">
        <div className="flex gap-2 overflow-x-auto">
          <ReportTabButton active={activeTab === "rentals"} onClick={() => setActiveTab("rentals")}>Rental Reports</ReportTabButton>
          <ReportTabButton active={activeTab === "sales"} onClick={() => setActiveTab("sales")}>Sales Reports</ReportTabButton>
          <ReportTabButton active={activeTab === "customers"} onClick={() => setActiveTab("customers")}>Customer Analysis</ReportTabButton>
        </div>
      </section>

      {isLoading ? (
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
      ) : (
        <>
          {activeTab === "rentals" && (
            <div className="space-y-5">
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <ReportMetric label="Active Rentals" value={String(activeRentals.length)} icon={CheckCircle} tone="green" />
                <ReportMetric label="Upcoming" value={String(upcomingRentals.length)} icon={Clock} tone="blue" />
                <ReportMetric label="Expiring Soon" value={String(expiringRentals.length)} icon={AlertTriangle} tone="yellow" />
                <ReportMetric label="Expired" value={String(expiredRentals.length)} icon={Package} tone="red" />
              </section>

              <ReportCard title="Rental Status Distribution" icon={PieChartIcon}>
                <ChartFrame empty={rentals.length === 0} emptyText="No rental data yet.">
                  <ChartContainer className="h-full w-full" config={rentalStatusChartConfig}>
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="key" />} />
                      <Pie data={rentalStatusData} cx="50%" cy="50%" dataKey="value" innerRadius={62} nameKey="name" outerRadius={104} paddingAngle={2} strokeWidth={4}>
                        {rentalStatusData.map((row) => (
                          <Cell fill={row.fill} key={row.name} />
                        ))}
                      </Pie>
                      <ChartLegend content={<ChartLegendContent nameKey="key" />} />
                    </PieChart>
                  </ChartContainer>
                </ChartFrame>
              </ReportCard>

              <ReportCard title="Expiring Rentals (Next 3 Days)" icon={AlertTriangle}>
                {expiringRentals.length > 0 ? (
                  <div className="space-y-3">
                    {expiringRentals.map((rental) => (
                      <article className="flex items-center justify-between rounded-xl border border-[hsl(var(--status-warning)/0.24)] bg-[hsl(var(--status-warning)/0.08)] p-4" key={rental.id}>
                        <div>
                          <p className="font-black text-foreground">{rental.productName}</p>
                          <p className="text-sm font-semibold text-muted-foreground">{rental.customerName || rental.customerEmail}</p>
                          <p className="mt-1 text-xs font-bold text-[hsl(var(--status-warning))]">Expires: {rental.endDate}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="py-4 text-center text-sm font-semibold text-muted-foreground">No rentals expiring soon</p>
                )}
              </ReportCard>
            </div>
          )}

          {activeTab === "sales" && (
            <ReportCard title="Monthly Orders & Revenue" icon={BarChart3}>
              <ChartFrame empty={monthlyData.length === 0} emptyText="No sales data yet.">
                <ChartContainer className="h-full w-full" config={monthlyOrdersChartConfig}>
                  <BarChart data={monthlyData} margin={{ left: 4, right: 4, top: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis axisLine={false} dataKey="month" tickLine={false} />
                    <YAxis axisLine={false} tickFormatter={(value) => `${value}`} tickLine={false} yAxisId="left" />
                    <YAxis axisLine={false} orientation="right" tickFormatter={(value) => `£${value}`} tickLine={false} yAxisId="right" />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => (
                            <div className="flex w-full items-center justify-between gap-4">
                              <span className="font-semibold text-muted-foreground">{name === "revenue" ? "Revenue" : "Orders"}</span>
                              <span className="font-mono font-black text-foreground">{name === "revenue" ? `£${Number(value).toFixed(2)}` : Number(value).toLocaleString()}</span>
                            </div>
                          )}
                        />
                      }
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" name="Orders" radius={[5, 5, 0, 0]} yAxisId="left" />
                    <Bar dataKey="revenue" fill="var(--color-revenue)" name="Revenue" radius={[5, 5, 0, 0]} yAxisId="right" />
                  </BarChart>
                </ChartContainer>
              </ChartFrame>
            </ReportCard>
          )}

          {activeTab === "customers" && (
            <div className="space-y-5">
              <section className="grid gap-4 md:grid-cols-3">
                <ReportMetric label="Total Customers" value={String(nonAdminUsers.length)} icon={Users} tone="blue" />
                <ReportMetric label="Total Orders" value={String(orders.length)} icon={Package} tone="purple" />
                <ReportMetric label="Total Revenue" value={`£${totalRevenue.toFixed(2)}`} icon={TrendingUp} tone="green" />
              </section>

              <ReportCard title="Top Customers by Revenue" icon={Users}>
                {customerData.length > 0 ? (
                  <div className="space-y-3">
                    {customerData.map((customer, index) => (
                      <article className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted p-4" key={customer.id}>
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-[hsl(var(--chart-2)/0.14)] text-sm font-black text-[hsl(var(--chart-2))]">
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-black text-foreground">{customer.name}</p>
                            {customer.email && <p className="text-xs font-semibold text-muted-foreground">{customer.email}</p>}
                            <p className="text-xs font-semibold text-muted-foreground">{customer.orders} orders</p>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(8, (customer.spent / maxCustomerSpent) * 100)}%` }} />
                            </div>
                          </div>
                        </div>
                        <span className="flex-shrink-0 font-black text-[hsl(var(--status-success))]">£{customer.spent.toFixed(2)}</span>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="py-4 text-center text-sm font-semibold text-muted-foreground">No customers yet.</p>
                )}
              </ReportCard>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ReportTabButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      className={`h-11 min-w-[170px] rounded-md px-4 text-sm font-black transition-colors ${
        active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function ReportMetric({ icon: Icon, label, tone, value }: { icon: React.ComponentType<{ className?: string }>; label: string; tone: "green" | "blue" | "yellow" | "red" | "purple"; value: string }) {
  const tones = {
    green: "border-[hsl(var(--status-success)/0.24)] bg-[hsl(var(--status-success)/0.08)] text-[hsl(var(--status-success))]",
    blue: "border-[hsl(var(--status-info)/0.24)] bg-[hsl(var(--status-info)/0.08)] text-[hsl(var(--status-info))]",
    yellow: "border-[hsl(var(--status-warning)/0.24)] bg-[hsl(var(--status-warning)/0.08)] text-[hsl(var(--status-warning))]",
    red: "border-[hsl(var(--status-danger)/0.24)] bg-[hsl(var(--status-danger)/0.08)] text-[hsl(var(--status-danger))]",
    purple: "border-[hsl(var(--chart-4)/0.24)] bg-[hsl(var(--chart-4)/0.08)] text-[hsl(var(--chart-4))]",
  };

  return (
    <Card className={`rounded-lg p-5 shadow-none ${tones[tone]}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold opacity-70">{label}</p>
          <strong className="mt-2 block text-3xl font-black">{value}</strong>
        </div>
        <Icon className="h-10 w-10 flex-shrink-0 opacity-45" />
      </div>
    </Card>
  );
}

function ReportCard({ children, icon: Icon, title }: { children: React.ReactNode; icon: React.ComponentType<{ className?: string }>; title: string }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm shadow-primary/5">
      <header className="flex items-center gap-2 border-b border-border px-5 py-4">
        <Icon className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-black text-foreground">{title}</h2>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function ChartFrame({ children, empty, emptyText }: { children: React.ReactNode; empty: boolean; emptyText: string }) {
  if (empty) {
    return <div className="rounded-lg bg-muted p-4 text-sm font-semibold text-muted-foreground">{emptyText}</div>;
  }

  return <div className="h-80">{children}</div>;
}

function getExpiringRentals(rentals: Rental[]) {
  const today = new Date();
  return rentals.filter((rental) => {
    const daysUntil = Math.floor((new Date(rental.endDate).getTime() - today.getTime()) / 86400000);
    return rental.status === "active" && daysUntil <= 3 && daysUntil > 0;
  });
}

function getMonthlyOrderData(orders: Order[]): MonthlyReport[] {
  const data = new Map<string, MonthlyReport>();
  orders.forEach((order) => {
    const month = new Date(order.createdAt).toLocaleString("en-US", { month: "short" });
    const current = data.get(month) ?? { month, count: 0, revenue: 0 };
    current.count += 1;
    current.revenue += order.totalAmount;
    data.set(month, current);
  });
  return [...data.values()].slice(-6);
}

function getCustomerData(orders: Order[], users: User[]): CustomerReport[] {
  const customers = new Map<string, CustomerReport>();
  orders.forEach((order) => {
    const customer = getOrderCustomer(order, users);
    const key = customer?.id || order.createdById || order.customerEmail || order.id;
    const current = customers.get(key) ?? {
      id: key,
      email: customer?.email || order.customerEmail || "",
      name: customer?.fullName || customer?.companyName || customer?.email || order.customerEmail || "Unknown customer",
      orders: 0,
      spent: 0,
      lastOrder: order.createdAt,
    };
    current.orders += 1;
    current.spent += order.totalAmount;
    if (new Date(order.createdAt) > new Date(current.lastOrder)) current.lastOrder = order.createdAt;
    customers.set(key, current);
  });
  return [...customers.values()].sort((a, b) => b.spent - a.spent).slice(0, 10);
}

function getOrderCustomer(order: Order, users: User[]) {
  if (order.createdById) {
    const byId = users.find((user) => user.id === order.createdById);
    if (byId) return byId;
  }
  if (order.customerEmail) {
    return users.find((user) => sameEmail(user.email, order.customerEmail));
  }
  return undefined;
}

function sameEmail(left?: string, right?: string) {
  return Boolean(left && right && left.trim().toLowerCase() === right.trim().toLowerCase());
}
