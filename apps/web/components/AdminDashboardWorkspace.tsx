"use client";

import AdminDashboardV2Workspace from "@/components/AdminDashboardV2Workspace";
import LoadingState from "@/components/LoadingState";
import { getHarvestApi } from "@/lib/harvest-api";
import { useV2Enabled } from "@/lib/v2-pages";
import { Order, PaymentMethod, Product, User, orderStatusLabels, paymentMethodLabels } from "@/lib/domain";
import { BarChart3, CheckCircle, Clock, CreditCard, DollarSign, Package, ShoppingBag, Truck, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TimeRange = "week" | "month" | "all";

type ProductSales = {
  name: string;
  quantity: number;
  revenue: number;
};

type CustomerStat = {
  email: string;
  orderCount: number;
  totalSpent: number;
  pendingPayment: number;
};

type PaymentStat = {
  method: PaymentMethod;
  count: number;
  amount: number;
};

type CategoryStat = {
  category: string;
  quantity: number;
  revenue: number;
};

const chartColors = ["#8b4513", "#d97706", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444"];

export default function AdminDashboardWorkspace() {
  const v2Enabled = useV2Enabled("/admin");

  if (v2Enabled) {
    return <AdminDashboardV2Workspace />;
  }

  return <LegacyAdminDashboardWorkspace />;
}

function LegacyAdminDashboardWorkspace() {
  const api = useMemo(() => getHarvestApi(), []);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    const [nextOrders, nextProducts, nextUsers] = await Promise.all([
      api.getOrders(),
      api.getProducts(),
      api.getUsers(),
    ]);
    setOrders([...nextOrders].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)));
    setProducts(nextProducts);
    setUsers(nextUsers);
    setIsLoading(false);
  };

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const paidRevenue = orders.filter((order) => order.paymentStatus === "paid").reduce((sum, order) => sum + order.totalAmount, 0);
  const pendingRevenue = totalRevenue - paidRevenue;
  const lowStockProducts = products.filter((product) => product.stockQuantity <= product.lowStockThreshold && product.stockQuantity > 0);
  const outOfStockProducts = products.filter((product) => product.stockQuantity === 0);
  const productSales = getTopProducts(orders);
  const topCustomers = getTopCustomers(orders);
  const paymentStats = getPaymentStats(orders);
  const statusStats = getStatusStats(orders);
  const categorySales = getCategorySales(orders, products);
  const salesTrend = getSalesTrendData(orders, timeRange);
  const paymentChartData = paymentStats.map((row) => ({
    name: paymentMethodLabels[row.method],
    value: row.amount,
    count: row.count,
  }));
  const statusChartData = statusStats.map((row) => ({
    name: orderStatusLabels[row.status],
    orders: row.count,
    revenue: row.revenue,
  }));
  const maxProductRevenue = Math.max(...productSales.map((product) => product.revenue), 1);
  const maxCustomerSpent = Math.max(...topCustomers.map((customer) => customer.totalSpent), 1);

  if (isLoading) {
    return (
      <LoadingState
        description="Fetching orders, products, customers, and dashboard metrics."
        title="Loading dashboard"
      />
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-5xl font-bold text-amber-900 mb-1" style={{ fontFamily: "Georgia, serif" }}>
          Admin Panel
        </h1>
        <p className="text-amber-600 text-sm font-medium">Business statistics and reports</p>
      </div>

      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <section className="rounded-xl border border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Package className="w-6 h-6 text-yellow-700" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-yellow-900 mb-2">Stock Alerts</h2>
              <div className="space-y-1 text-sm">
                {lowStockProducts.length > 0 && (
                  <p className="text-yellow-800">
                    <span className="font-bold">{lowStockProducts.length}</span> products in low stock
                  </p>
                )}
                {outOfStockProducts.length > 0 && (
                  <p className="text-red-800">
                    <span className="font-bold">{outOfStockProducts.length}</span> products out of stock
                  </p>
                )}
              </div>
              <Link href="/stockmanagement" className="mt-3 inline-flex rounded-md bg-amber-900 px-3 py-2 text-sm font-medium text-white hover:bg-amber-800">
                Go to Stock Management
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Revenue" value={`£${totalRevenue.toFixed(2)}`} icon={<DollarSign className="w-12 h-12 text-green-600 opacity-50" />} className="from-green-50 to-green-100 text-green-900" />
        <MetricCard label="Collected" value={`£${paidRevenue.toFixed(2)}`} icon={<CheckCircle className="w-12 h-12 text-purple-600 opacity-50" />} className="from-purple-50 to-purple-100 text-purple-900" />
        <MetricCard label="Pending Payment" value={`£${pendingRevenue.toFixed(2)}`} icon={<Clock className="w-12 h-12 text-orange-600 opacity-50" />} className="from-orange-50 to-orange-100 text-orange-900" />
        <MetricCard label="Total Orders" value={String(orders.length)} icon={<ShoppingBag className="w-12 h-12 text-blue-600 opacity-50" />} className="from-blue-50 to-blue-100 text-blue-900" />
      </section>

      <section className="rounded-xl border border-amber-100 bg-white">
        <header className="p-6 border-b border-amber-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-amber-900">Sales Trends</h2>
          <div className="flex gap-2">
            <RangeButton active={timeRange === "week"} onClick={() => setTimeRange("week")}>7 Days</RangeButton>
            <RangeButton active={timeRange === "month"} onClick={() => setTimeRange("month")}>30 Days</RangeButton>
            <RangeButton active={timeRange === "all"} onClick={() => setTimeRange("all")}>90 Days</RangeButton>
          </div>
        </header>
        <div className="p-6">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend}>
                <defs>
                  <linearGradient id="salesTrendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b4513" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8b4513" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3e8d8" />
                <XAxis dataKey="date" tick={{ fill: "#92400e", fontSize: 12 }} />
                <YAxis tick={{ fill: "#92400e", fontSize: 12 }} />
                <Tooltip formatter={(value, name) => [name === "revenue" ? `£${Number(value).toFixed(2)}` : value, name === "revenue" ? "Revenue" : "Orders"]} />
                <Legend />
                <Area type="monotone" dataKey="revenue" stroke="#8b4513" fill="url(#salesTrendFill)" name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard title="Sales by Category" icon={<BarChart3 className="w-5 h-5" />}>
          <ChartFrame empty={categorySales.length === 0} emptyText="No category sales yet.">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categorySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3e8d8" />
                <XAxis dataKey="category" tick={{ fill: "#92400e", fontSize: 12 }} />
                <YAxis tick={{ fill: "#92400e", fontSize: 12 }} />
                <Tooltip formatter={(value, name) => [name === "revenue" ? `£${Number(value).toFixed(2)}` : value, name === "revenue" ? "Revenue" : "Units"]} />
                <Legend />
                <Bar dataKey="revenue" fill="#8b4513" name="Revenue" radius={[4, 4, 0, 0]} />
                <Bar dataKey="quantity" fill="#d97706" name="Units" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartFrame>
        </DashboardCard>

        <DashboardCard title="Order Status" icon={<Truck className="w-5 h-5" />}>
          <ChartFrame empty={statusChartData.every((row) => row.orders === 0)} emptyText="No order status data yet.">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3e8d8" />
                <XAxis dataKey="name" tick={{ fill: "#92400e", fontSize: 12 }} />
                <YAxis tick={{ fill: "#92400e", fontSize: 12 }} />
                <Tooltip formatter={(value, name) => [name === "revenue" ? `£${Number(value).toFixed(2)}` : value, name === "revenue" ? "Revenue" : "Orders"]} />
                <Legend />
                <Bar dataKey="orders" fill="#3b82f6" name="Orders" radius={[4, 4, 0, 0]} />
                <Bar dataKey="revenue" fill="#10b981" name="Revenue" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartFrame>
        </DashboardCard>
      </section>

      <DashboardCard title="Payment Methods Distribution" icon={<CreditCard className="w-5 h-5" />}>
        <ChartFrame empty={paymentChartData.length === 0} emptyText="No payment data yet.">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={paymentChartData} cx="50%" cy="50%" dataKey="value" nameKey="name" outerRadius={110} label={({ name, value }) => `${name}: £${Number(value).toFixed(0)}`}>
                {paymentChartData.map((row, index) => (
                  <Cell fill={chartColors[index % chartColors.length]} key={row.name} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `£${Number(value).toFixed(2)}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartFrame>
      </DashboardCard>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard title="Top Products" icon={<ShoppingBag className="w-5 h-5" />}>
          <RankedBars
            rows={productSales.slice(0, 8).map((product, index) => ({
              key: product.name,
              title: product.name,
              subtitle: `${product.quantity} units`,
              value: `£${product.revenue.toFixed(2)}`,
              index,
              width: (product.revenue / maxProductRevenue) * 100,
            }))}
            empty="No product sales yet."
          />
        </DashboardCard>

        <DashboardCard title="Best Customers" icon={<Users className="w-5 h-5" />}>
          <RankedBars
            rows={topCustomers.map((customer, index) => ({
              key: customer.email,
              title: customer.email ? customer.email.split("@")[0] : "Unknown",
              subtitle: `${customer.orderCount} Orders`,
              value: `£${customer.totalSpent.toFixed(2)}`,
              index,
              width: (customer.totalSpent / maxCustomerSpent) * 100,
            }))}
            empty="No customers yet."
          />
        </DashboardCard>
      </section>

      <section className="rounded-xl border border-amber-100 bg-white">
        <header className="p-6 border-b border-amber-100">
          <h2 className="text-xl font-semibold text-amber-900">Recent Activities</h2>
        </header>
        <div className="p-6 space-y-3">
          {orders.slice(0, 10).map((order) => (
            <Link className="flex items-center justify-between gap-4 rounded-lg bg-amber-50/50 p-3 hover:bg-amber-50" href={`/orderdetails?id=${order.id}`} key={order.id}>
              <div className="flex items-center gap-3 min-w-0">
                <Package className="w-5 h-5 text-blue-600" />
                <span className="truncate font-medium text-amber-900">Order #{order.orderNumber} · {order.customerEmail}</span>
              </div>
              <strong className="text-green-700">£{order.totalAmount.toFixed(2)}</strong>
            </Link>
          ))}
        </div>
      </section>

      <p className="text-sm text-slate-300">{users.length} users loaded for admin reporting.</p>
    </div>
  );
}

function MetricCard({ label, value, icon, className }: { label: string; value: string; icon: React.ReactNode; className: string }) {
  return (
    <article className={`rounded-xl border border-amber-100 bg-gradient-to-br p-6 ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm opacity-80 mb-1">{label}</p>
          <strong className="text-3xl font-bold">{value}</strong>
        </div>
        {icon}
      </div>
    </article>
  );
}

function RangeButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
        active ? "border-amber-900 bg-amber-900 text-white" : "border-amber-200 text-amber-900 hover:bg-amber-50"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function DashboardCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-amber-100 bg-white">
      <header className="p-6 border-b border-amber-100">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-amber-900">
          {icon}
          {title}
        </h2>
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

function RankedBars({
  rows,
  empty,
}: {
  rows: Array<{ key: string; title: string; subtitle: string; value: string; width: number; index?: number }>;
  empty: string;
}) {
  if (rows.length === 0) {
    return <div className="rounded-lg bg-amber-50/50 p-4 text-sm text-gray-600">{empty}</div>;
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <article className="flex items-center justify-between gap-3 rounded-lg bg-amber-50/50 p-3" key={row.key}>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {typeof row.index === "number" && (
              <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-amber-900 font-semibold text-sm">{row.index + 1}</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium text-amber-900 text-sm truncate">{row.title}</p>
              <p className="text-xs text-gray-600">{row.subtitle}</p>
              <div className="mt-2 h-1.5 rounded-full bg-amber-100 overflow-hidden">
                <div className="h-full rounded-full bg-amber-700" style={{ width: `${Math.max(8, row.width)}%` }} />
              </div>
            </div>
          </div>
          <strong className="text-green-700">{row.value}</strong>
        </article>
      ))}
    </div>
  );
}

function getTopProducts(orders: Order[]): ProductSales[] {
  const sales = new Map<string, ProductSales>();
  orders.forEach((order) => {
    order.items.forEach((item) => {
      const current = sales.get(item.productName) ?? { name: item.productName, quantity: 0, revenue: 0 };
      current.quantity += item.quantity;
      current.revenue += item.subtotal;
      sales.set(item.productName, current);
    });
  });
  return [...sales.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 10);
}

function getTopCustomers(orders: Order[]): CustomerStat[] {
  const customers = new Map<string, CustomerStat>();
  orders.forEach((order) => {
    const key = order.customerEmail || order.createdById || order.id;
    const current = customers.get(key) ?? {
      email: order.customerEmail || key,
      orderCount: 0,
      totalSpent: 0,
      pendingPayment: 0,
    };
    current.orderCount += 1;
    current.totalSpent += order.totalAmount;
    if (order.paymentStatus === "pending") current.pendingPayment += order.totalAmount;
    customers.set(key, current);
  });
  return [...customers.values()].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
}

function getPaymentStats(orders: Order[]): PaymentStat[] {
  const methods: PaymentMethod[] = ["bank_transfer", "credit_card", "paypal"];
  return methods
    .map((method) => {
      const matchingOrders = orders.filter((order) => order.paymentMethod === method);
      return {
        method,
        count: matchingOrders.length,
        amount: matchingOrders.reduce((sum, order) => sum + order.totalAmount, 0),
      };
    })
    .filter((row) => row.count > 0);
}

function getStatusStats(orders: Order[]) {
  const statuses: Order["status"][] = ["preparing", "in_transit", "delivered"];
  return statuses.map((status) => {
    const matchingOrders = orders.filter((order) => order.status === status);
    return {
      status,
      count: matchingOrders.length,
      revenue: matchingOrders.reduce((sum, order) => sum + order.totalAmount, 0),
    };
  });
}

function getCategorySales(orders: Order[], products: Product[]): CategoryStat[] {
  const sales = new Map<string, CategoryStat>();
  orders.forEach((order) => {
    order.items.forEach((item) => {
      const product = products.find((candidate) => candidate.name === item.productName);
      const category = product?.category || "Other";
      const current = sales.get(category) ?? { category, quantity: 0, revenue: 0 };
      current.quantity += item.quantity;
      current.revenue += item.subtotal;
      sales.set(category, current);
    });
  });
  return [...sales.values()].sort((a, b) => b.revenue - a.revenue);
}

function getSalesTrendData(orders: Order[], timeRange: TimeRange) {
  const now = new Date();
  const daysToShow = timeRange === "week" ? 7 : timeRange === "month" ? 30 : 90;
  const rows: Array<{ date: string; revenue: number; orders: number }> = [];

  for (let index = daysToShow - 1; index >= 0; index -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - index);
    date.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const dayOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= date && orderDate <= dayEnd;
    });

    rows.push({
      date: new Intl.DateTimeFormat("en-GB", timeRange === "week" ? { weekday: "short" } : { month: "short", day: "2-digit" }).format(date),
      revenue: dayOrders.reduce((sum, order) => sum + order.totalAmount, 0),
      orders: dayOrders.length,
    });
  }

  return rows;
}
