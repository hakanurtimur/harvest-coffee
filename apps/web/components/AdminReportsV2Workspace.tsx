"use client";

import { Card } from "@/components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { getHarvestApi } from "@/lib/harvest-api";
import type { Order, Rental, User } from "@harvest/domain";
import { AlertTriangle, BarChart3, CheckCircle, Clock, Package, PieChart as PieChartIcon, TrendingUp, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";

type ReportTab = "rentals" | "sales" | "customers";

type CustomerReport = {
  email: string;
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
  active: "#15803d",
  upcoming: "#2563eb",
  expiringSoon: "#b45309",
  expired: "#be123c",
};

const rentalStatusChartConfig = {
  active: { label: "Active", color: rentalColors.active },
  upcoming: { label: "Upcoming", color: rentalColors.upcoming },
  expiringSoon: { label: "Expiring Soon", color: rentalColors.expiringSoon },
  expired: { label: "Expired", color: rentalColors.expired },
} satisfies ChartConfig;

const monthlyOrdersChartConfig = {
  count: { label: "Orders", color: "#7c3514" },
  revenue: { label: "Revenue", color: "#15803d" },
} satisfies ChartConfig;

export default function AdminReportsV2Workspace() {
  const api = useMemo(() => getHarvestApi(), []);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<ReportTab>("rentals");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      setIsLoading(true);
      const [nextRentals, nextOrders, nextUsers] = await Promise.all([
        api.getRentals(),
        api.getOrders(),
        api.getUsers(),
      ]);
      setRentals(nextRentals);
      setOrders(nextOrders);
      setUsers(nextUsers);
      setIsLoading(false);
    };

    void loadReports();
  }, [api]);

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
  const customerData = getCustomerData(orders);
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const nonAdminUsers = users.filter((user) => user.role !== "admin");
  const maxCustomerSpent = Math.max(...customerData.map((customer) => customer.spent), 1);

  return (
    <div className="space-y-5 text-[#3a2619]">
      <section className="rounded-lg border border-[#e8daca] bg-[#fffdf8] p-5 shadow-sm shadow-[#8a461c]/5 md:p-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#b3692c]">Admin</p>
        <h1 className="mt-2 text-3xl font-black tracking-normal text-[#3a2619] md:text-4xl">Reports</h1>
        <p className="mt-2 text-sm font-semibold text-[#8f7461]">Analytics, rentals, and customer insights</p>
      </section>

      <section className="rounded-lg border border-[#e8daca] bg-[#fffdf8] p-2 shadow-sm shadow-[#8a461c]/5">
        <div className="flex gap-2 overflow-x-auto">
          <ReportTabButton active={activeTab === "rentals"} onClick={() => setActiveTab("rentals")}>Rental Reports</ReportTabButton>
          <ReportTabButton active={activeTab === "sales"} onClick={() => setActiveTab("sales")}>Sales Reports</ReportTabButton>
          <ReportTabButton active={activeTab === "customers"} onClick={() => setActiveTab("customers")}>Customer Analysis</ReportTabButton>
        </div>
      </section>

      {isLoading ? (
        <div className="h-48 animate-pulse rounded-lg bg-[#f3e8da]" />
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
                      <article className="flex items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50 p-4" key={rental.id}>
                        <div>
                          <p className="font-black text-[#3a2619]">{rental.productName}</p>
                          <p className="text-sm font-semibold text-[#7f6554]">{rental.customerName || rental.customerEmail}</p>
                          <p className="mt-1 text-xs font-bold text-yellow-800">Expires: {rental.endDate}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="py-4 text-center text-sm font-semibold text-[#8f7461]">No rentals expiring soon</p>
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
                              <span className="font-semibold text-[#8f7461]">{name === "revenue" ? "Revenue" : "Orders"}</span>
                              <span className="font-mono font-black text-[#3a2619]">{name === "revenue" ? `£${Number(value).toFixed(2)}` : Number(value).toLocaleString()}</span>
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
                      <article className="flex items-center justify-between gap-4 rounded-lg border border-[#f0e2d4] bg-[#fff8ed] p-4" key={customer.email}>
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-[#f0dfca] text-sm font-black text-[#8a461c]">
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-black text-[#3a2619]">{customer.email}</p>
                            <p className="text-xs font-semibold text-[#7f6554]">{customer.orders} orders</p>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eadccf]">
                              <div className="h-full rounded-full bg-[#8a461c]" style={{ width: `${Math.max(8, (customer.spent / maxCustomerSpent) * 100)}%` }} />
                            </div>
                          </div>
                        </div>
                        <span className="flex-shrink-0 font-black text-green-700">£{customer.spent.toFixed(2)}</span>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="py-4 text-center text-sm font-semibold text-[#8f7461]">No customers yet.</p>
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
        active ? "bg-[#7c3514] text-white shadow-sm" : "text-[#6d5444] hover:bg-[#fff8ed] hover:text-[#7c3514]"
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
    green: "border-green-100 bg-green-50 text-green-950",
    blue: "border-blue-100 bg-blue-50 text-blue-950",
    yellow: "border-yellow-100 bg-yellow-50 text-yellow-950",
    red: "border-red-100 bg-red-50 text-red-950",
    purple: "border-purple-100 bg-purple-50 text-purple-950",
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
    <section className="overflow-hidden rounded-lg border border-[#e8daca] bg-[#fffdf8] shadow-sm shadow-[#8a461c]/5">
      <header className="flex items-center gap-2 border-b border-[#eadccf] px-5 py-4">
        <Icon className="h-5 w-5 text-[#8a461c]" />
        <h2 className="text-lg font-black text-[#3a2619]">{title}</h2>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function ChartFrame({ children, empty, emptyText }: { children: React.ReactNode; empty: boolean; emptyText: string }) {
  if (empty) {
    return <div className="rounded-lg bg-[#fff8ed] p-4 text-sm font-semibold text-[#7f6554]">{emptyText}</div>;
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

function getCustomerData(orders: Order[]): CustomerReport[] {
  const customers = new Map<string, CustomerReport>();
  orders.forEach((order) => {
    const current = customers.get(order.customerEmail) ?? {
      email: order.customerEmail,
      orders: 0,
      spent: 0,
      lastOrder: order.createdAt,
    };
    current.orders += 1;
    current.spent += order.totalAmount;
    if (new Date(order.createdAt) > new Date(current.lastOrder)) current.lastOrder = order.createdAt;
    customers.set(order.customerEmail, current);
  });
  return [...customers.values()].sort((a, b) => b.spent - a.spent).slice(0, 10);
}
