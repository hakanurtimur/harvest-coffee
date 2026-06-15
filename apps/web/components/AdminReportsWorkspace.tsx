"use client";

import AdminReportsV2Workspace from "@/components/AdminReportsV2Workspace";
import { getHarvestApi } from "@/lib/harvest-api";
import { useV2Enabled } from "@/lib/v2-pages";
import type { Order, Rental, User } from "@/lib/domain";
import { AlertTriangle, CheckCircle, Clock, Package, TrendingUp, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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
  active: "#10b981",
  upcoming: "#3b82f6",
  expiringSoon: "#f59e0b",
  expired: "#ef4444",
};

export default function AdminReportsWorkspace() {
  const v2Enabled = useV2Enabled("/reports");

  if (v2Enabled) {
    return <AdminReportsV2Workspace />;
  }

  return <LegacyAdminReportsWorkspace />;
}

function LegacyAdminReportsWorkspace() {
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
    { name: "Active", value: activeRentals.length, color: rentalColors.active },
    { name: "Upcoming", value: upcomingRentals.length, color: rentalColors.upcoming },
    { name: "Expiring Soon", value: expiringRentals.length, color: rentalColors.expiringSoon },
    { name: "Expired", value: expiredRentals.length, color: rentalColors.expired },
  ];
  const monthlyData = getMonthlyOrderData(orders);
  const customerData = getCustomerData(orders);
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const nonAdminUsers = users.filter((user) => user.role !== "admin");
  const maxCustomerSpent = Math.max(...customerData.map((customer) => customer.spent), 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-amber-900 mb-2" style={{ fontFamily: "Georgia, serif" }}>
          Reports
        </h1>
        <p className="text-amber-700">Analytics, rentals, and customer insights</p>
      </div>

      <div className="w-full">
        <div className="grid w-full grid-cols-3 rounded-lg bg-amber-100/70 p-1">
          <ReportTabButton active={activeTab === "rentals"} onClick={() => setActiveTab("rentals")}>Rental Reports</ReportTabButton>
          <ReportTabButton active={activeTab === "sales"} onClick={() => setActiveTab("sales")}>Sales Reports</ReportTabButton>
          <ReportTabButton active={activeTab === "customers"} onClick={() => setActiveTab("customers")}>Customer Analysis</ReportTabButton>
        </div>

        {isLoading ? (
          <div className="mt-6 h-48 rounded-xl bg-gray-100 animate-pulse" />
        ) : (
          <div className="mt-6">
            {activeTab === "rentals" && (
              <div className="space-y-6">
                <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <ReportMetric label="Active Rentals" value={String(activeRentals.length)} icon={<CheckCircle className="w-12 h-12 text-green-600 opacity-30" />} className="border-green-200 bg-green-50 text-green-900" />
                  <ReportMetric label="Upcoming" value={String(upcomingRentals.length)} icon={<Clock className="w-12 h-12 text-blue-600 opacity-30" />} className="border-blue-200 bg-blue-50 text-blue-900" />
                  <ReportMetric label="Expiring Soon" value={String(expiringRentals.length)} icon={<AlertTriangle className="w-12 h-12 text-yellow-600 opacity-30" />} className="border-yellow-200 bg-yellow-50 text-yellow-900" />
                  <ReportMetric label="Expired" value={String(expiredRentals.length)} icon={<Package className="w-12 h-12 text-red-600 opacity-30" />} className="border-red-200 bg-red-50 text-red-900" />
                </section>

                <ReportCard title="Rental Status Distribution">
                  <ChartFrame empty={rentals.length === 0} emptyText="No rental data yet.">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={rentalStatusData} cx="50%" cy="50%" dataKey="value" nameKey="name" outerRadius={110} label={({ name, value }) => `${name}: ${value}`}>
                          {rentalStatusData.map((row) => (
                            <Cell fill={row.color} key={row.name} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartFrame>
                </ReportCard>

                <ReportCard title="Expiring Rentals (Next 3 Days)">
                  {expiringRentals.length > 0 ? (
                    <div className="space-y-3">
                      {expiringRentals.map((rental) => (
                        <article className="flex items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50 p-3" key={rental.id}>
                          <div>
                            <p className="font-semibold text-amber-900">{rental.productName}</p>
                            <p className="text-sm text-gray-600">{rental.customerName || rental.customerEmail}</p>
                            <p className="text-xs text-yellow-700 mt-1">Expires: {rental.endDate}</p>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No rentals expiring soon</p>
                  )}
                </ReportCard>
              </div>
            )}

            {activeTab === "sales" && (
              <ReportCard title="Monthly Orders & Revenue">
                <ChartFrame empty={monthlyData.length === 0} emptyText="No sales data yet.">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3e8d8" />
                      <XAxis dataKey="month" tick={{ fill: "#92400e", fontSize: 12 }} />
                      <YAxis yAxisId="left" tick={{ fill: "#92400e", fontSize: 12 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fill: "#047857", fontSize: 12 }} />
                      <Tooltip formatter={(value, name) => [name === "revenue" ? `£${Number(value).toFixed(2)}` : value, name === "revenue" ? "Revenue" : "Orders"]} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="count" fill="#3b82f6" name="Orders" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="revenue" fill="#10b981" name="Revenue" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartFrame>
              </ReportCard>
            )}

            {activeTab === "customers" && (
              <div className="space-y-6">
                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ReportMetric label="Total Customers" value={String(nonAdminUsers.length)} icon={<Users className="w-12 h-12 text-blue-600 opacity-30" />} className="border-blue-200 bg-blue-50 text-blue-900" />
                  <ReportMetric label="Total Orders" value={String(orders.length)} icon={<Package className="w-12 h-12 text-purple-600 opacity-30" />} className="border-purple-200 bg-purple-50 text-purple-900" />
                  <ReportMetric label="Total Revenue" value={`£${totalRevenue.toFixed(2)}`} icon={<TrendingUp className="w-12 h-12 text-green-600 opacity-30" />} className="border-green-200 bg-green-50 text-green-900" />
                </section>

                <ReportCard title="Top Customers by Revenue">
                  <div className="space-y-3">
                    {customerData.map((customer, index) => (
                      <article className="flex items-center justify-between rounded-lg bg-amber-50 p-3" key={customer.email}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center font-semibold text-amber-900 flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-amber-900 truncate">{customer.email}</p>
                            <p className="text-xs text-gray-600">{customer.orders} orders</p>
                            <div className="mt-2 h-1.5 rounded-full bg-amber-100 overflow-hidden">
                              <div className="h-full rounded-full bg-amber-700" style={{ width: `${Math.max(8, (customer.spent / maxCustomerSpent) * 100)}%` }} />
                            </div>
                          </div>
                        </div>
                        <span className="font-bold text-green-700">£{customer.spent.toFixed(2)}</span>
                      </article>
                    ))}
                  </div>
                </ReportCard>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ReportTabButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${active ? "bg-white text-amber-900 shadow-sm" : "text-amber-900 hover:bg-white/60"}`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function ReportMetric({ label, value, icon, className }: { label: string; value: string; icon: React.ReactNode; className: string }) {
  return (
    <article className={`rounded-xl border p-6 ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm opacity-80">{label}</p>
          <strong className="text-3xl font-bold">{value}</strong>
        </div>
        {icon}
      </div>
    </article>
  );
}

function ReportCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-amber-100 bg-white">
      <header className="border-b border-amber-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-amber-900">{title}</h2>
      </header>
      <div className="p-6">{children}</div>
    </section>
  );
}

function ChartFrame({ children, empty, emptyText }: { children: React.ReactNode; empty: boolean; emptyText: string }) {
  if (empty) {
    return <div className="rounded-lg bg-amber-50/50 p-4 text-sm text-gray-600">{emptyText}</div>;
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
