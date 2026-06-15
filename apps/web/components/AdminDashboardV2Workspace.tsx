"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { getHarvestApi } from "@/lib/harvest-api";
import type { Order, PaymentMethod, Product, User } from "@harvest/domain";
import { orderStatusLabels, paymentMethodLabels } from "@harvest/domain";
import { AlertTriangle, BarChart3, CheckCircle, Clock, CreditCard, DollarSign, Package, ShoppingBag, TrendingUp, Truck, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
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

const adminChartColors = ["#7c2d12", "#b45309", "#15803d", "#2563eb", "#6d28d9", "#be123c"];

const salesTrendChartConfig = {
  revenue: { label: "Revenue", color: "#7c3514" },
} satisfies ChartConfig;

const categorySalesChartConfig = {
  revenue: { label: "Revenue", color: "#7c3514" },
  quantity: { label: "Units", color: "#b45309" },
} satisfies ChartConfig;

const orderStatusChartConfig = {
  orders: { label: "Orders", color: "#2563eb" },
  revenue: { label: "Revenue", color: "#15803d" },
} satisfies ChartConfig;

const paymentMethodsChartConfig = {
  bank_transfer: { label: "Bank transfer", color: adminChartColors[0] },
  credit_card: { label: "Credit card", color: adminChartColors[1] },
  paypal: { label: "PayPal", color: adminChartColors[2] },
  cash_on_delivery: { label: "Cash on delivery", color: adminChartColors[3] },
} satisfies ChartConfig;

export default function AdminDashboardV2Workspace() {
  const api = useMemo(() => getHarvestApi(), []);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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

    void loadDashboard();
  }, [api]);

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
    key: row.method,
    name: paymentMethodLabels[row.method],
    value: row.amount,
    count: row.count,
    fill: `var(--color-${row.method})`,
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
      <div className="grid min-h-[520px] place-items-center rounded-2xl border border-slate-700 bg-slate-900/70 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-950">
      <section className="rounded-lg border border-[#e8daca] bg-[#fffdf8] p-5 shadow-sm shadow-[#8a461c]/5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-normal text-slate-950 md:text-4xl">Admin Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">Business statistics and reports</p>
          </div>
          <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-1">
            <RangeButton active={timeRange === "week"} onClick={() => setTimeRange("week")}>7 Days</RangeButton>
            <RangeButton active={timeRange === "month"} onClick={() => setTimeRange("month")}>30 Days</RangeButton>
            <RangeButton active={timeRange === "all"} onClick={() => setTimeRange("all")}>90 Days</RangeButton>
          </div>
        </div>
      </section>

      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <Card className="rounded-lg border-[#ead7b8] bg-[#fff8e8] p-5 text-[#3a2619] shadow-none">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-yellow-100 text-yellow-800">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-black">Stock Alerts</h2>
                <div className="mt-1 space-y-1 text-sm font-semibold">
                  {lowStockProducts.length > 0 && <p>{lowStockProducts.length} products in low stock</p>}
                  {outOfStockProducts.length > 0 && <p className="text-red-800">{outOfStockProducts.length} products out of stock</p>}
                </div>
              </div>
            </div>
            <Button asChildShim className="rounded-md px-4" size="sm">
              <Link href="/stockmanagement">Go to Stock Management</Link>
            </Button>
          </div>
        </Card>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Revenue" value={`£${totalRevenue.toFixed(2)}`} icon={DollarSign} tone="green" />
        <MetricCard label="Collected" value={`£${paidRevenue.toFixed(2)}`} icon={CheckCircle} tone="purple" />
        <MetricCard label="Pending Payment" value={`£${pendingRevenue.toFixed(2)}`} icon={Clock} tone="orange" />
        <MetricCard label="Total Orders" value={String(orders.length)} icon={ShoppingBag} tone="blue" />
      </section>

      <DashboardCard title="Sales Trends" icon={TrendingUp}>
        <ChartFrame empty={salesTrend.every((row) => row.revenue === 0 && row.orders === 0)} emptyText="No sales trend data yet.">
          <ChartContainer className="h-full w-full" config={salesTrendChartConfig}>
            <AreaChart data={salesTrend} margin={{ left: 4, right: 4, top: 8 }}>
              <defs>
                <linearGradient id="adminSalesTrendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.72} />
                  <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.08} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis axisLine={false} dataKey="date" tickLine={false} />
              <YAxis axisLine={false} tickFormatter={(value) => `£${value}`} tickLine={false} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    indicator="line"
                    formatter={(value) => (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="font-semibold text-[#8f7461]">Revenue</span>
                        <span className="font-mono font-black text-[#3a2619]">£{Number(value).toFixed(2)}</span>
                      </div>
                    )}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Area dataKey="revenue" fill="url(#adminSalesTrendFill)" name="Revenue" stroke="var(--color-revenue)" strokeWidth={2.5} type="monotone" />
            </AreaChart>
          </ChartContainer>
        </ChartFrame>
      </DashboardCard>

      <section className="grid gap-6 xl:grid-cols-2">
        <DashboardCard title="Sales by Category" icon={BarChart3}>
          <ChartFrame empty={categorySales.length === 0} emptyText="No category sales yet.">
            <ChartContainer className="h-full w-full" config={categorySalesChartConfig}>
              <BarChart data={categorySales} margin={{ left: 4, right: 4, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis axisLine={false} dataKey="category" tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => (
                        <div className="flex w-full items-center justify-between gap-4">
                          <span className="font-semibold text-[#8f7461]">{name === "revenue" ? "Revenue" : "Units"}</span>
                          <span className="font-mono font-black text-[#3a2619]">{name === "revenue" ? `£${Number(value).toFixed(2)}` : Number(value).toLocaleString()}</span>
                        </div>
                      )}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" name="Revenue" radius={[5, 5, 0, 0]} />
                <Bar dataKey="quantity" fill="var(--color-quantity)" name="Units" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </ChartFrame>
        </DashboardCard>

        <DashboardCard title="Order Status" icon={Truck}>
          <ChartFrame empty={statusChartData.every((row) => row.orders === 0)} emptyText="No order status data yet.">
            <ChartContainer className="h-full w-full" config={orderStatusChartConfig}>
              <BarChart data={statusChartData} margin={{ left: 4, right: 4, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis axisLine={false} dataKey="name" tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
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
                <Bar dataKey="orders" fill="var(--color-orders)" name="Orders" radius={[5, 5, 0, 0]} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" name="Revenue" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </ChartFrame>
        </DashboardCard>
      </section>

      <DashboardCard title="Payment Methods Distribution" icon={CreditCard}>
        <ChartFrame empty={paymentChartData.length === 0} emptyText="No payment data yet.">
          <ChartContainer className="h-full w-full" config={paymentMethodsChartConfig}>
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    hideLabel
                    nameKey="key"
                    formatter={(value, _name, item) => (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="font-semibold text-[#8f7461]">{item.payload?.name}</span>
                        <span className="font-mono font-black text-[#3a2619]">£{Number(value).toFixed(2)}</span>
                      </div>
                    )}
                  />
                }
              />
              <Pie data={paymentChartData} cx="50%" cy="50%" dataKey="value" innerRadius={64} nameKey="name" outerRadius={108} paddingAngle={2} strokeWidth={4}>
                {paymentChartData.map((row, index) => (
                  <Cell fill={row.fill || adminChartColors[index % adminChartColors.length]} key={row.name} />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="key" />} />
            </PieChart>
          </ChartContainer>
        </ChartFrame>
      </DashboardCard>

      <section className="grid gap-6 xl:grid-cols-2">
        <DashboardCard title="Top Products" icon={ShoppingBag}>
          <RankedBars
            empty="No product sales yet."
            rows={productSales.slice(0, 8).map((product, index) => ({
              key: product.name,
              title: product.name,
              subtitle: `${product.quantity} units`,
              value: `£${product.revenue.toFixed(2)}`,
              index,
              width: (product.revenue / maxProductRevenue) * 100,
            }))}
          />
        </DashboardCard>

        <DashboardCard title="Best Customers" icon={Users}>
          <RankedBars
            empty="No customers yet."
            rows={topCustomers.map((customer, index) => ({
              key: customer.email,
              title: customer.email ? customer.email.split("@")[0] : "Unknown",
              subtitle: `${customer.orderCount} Orders`,
              value: `£${customer.totalSpent.toFixed(2)}`,
              index,
              width: (customer.totalSpent / maxCustomerSpent) * 100,
            }))}
          />
        </DashboardCard>
      </section>

      <DashboardCard title="Recent Activities" icon={Package}>
        <div className="grid gap-2">
          {orders.slice(0, 10).map((order) => (
            <Link className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-3 transition-colors hover:bg-white" href={`/orderdetails?id=${order.id}`} key={order.id}>
              <div className="flex min-w-0 items-center gap-3">
                <Package className="h-5 w-5 flex-shrink-0 text-blue-600" />
                <span className="truncate text-sm font-bold text-slate-800">Order #{order.orderNumber} · {order.customerEmail}</span>
              </div>
              <strong className="flex-shrink-0 text-sm font-black text-green-700">£{order.totalAmount.toFixed(2)}</strong>
            </Link>
          ))}
        </div>
      </DashboardCard>

      <p className="text-sm font-semibold text-[#8f7461]">{users.length} users loaded for admin reporting.</p>
    </div>
  );
}

function MetricCard({ icon: Icon, label, tone, value }: { icon: React.ComponentType<{ className?: string }>; label: string; tone: "green" | "purple" | "orange" | "blue"; value: string }) {
  const tones = {
    green: "bg-green-50 text-green-950 border-green-100",
    purple: "bg-purple-50 text-purple-950 border-purple-100",
    orange: "bg-orange-50 text-orange-950 border-orange-100",
    blue: "bg-blue-50 text-blue-950 border-blue-100",
  };

  return (
    <Card className={`rounded-2xl p-5 shadow-none ${tones[tone]}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold opacity-70">{label}</p>
          <strong className="mt-2 block truncate text-2xl font-black md:text-3xl">{value}</strong>
        </div>
        <Icon className="h-10 w-10 flex-shrink-0 opacity-45" />
      </div>
    </Card>
  );
}

function RangeButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      className={`h-9 rounded-lg px-3 text-xs font-black transition-colors ${
        active ? "bg-slate-950 text-white shadow-sm" : "text-slate-600 hover:bg-white hover:text-slate-950"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function DashboardCard({ children, icon: Icon, title }: { children: React.ReactNode; icon: React.ComponentType<{ className?: string }>; title: string }) {
  return (
    <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-xl shadow-slate-950/5">
      <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <h2 className="flex items-center gap-2 text-base font-black text-slate-950">
          <Icon className="h-5 w-5 text-amber-800" />
          {title}
        </h2>
      </header>
      <div className="p-5">{children}</div>
    </Card>
  );
}

function ChartFrame({ children, empty, emptyText }: { children: React.ReactNode; empty: boolean; emptyText: string }) {
  if (empty) {
    return <div className="rounded-lg bg-slate-50 p-4 text-sm font-semibold text-slate-500">{emptyText}</div>;
  }

  return <div className="h-80 min-w-0">{children}</div>;
}

function RankedBars({
  rows,
  empty,
}: {
  rows: Array<{ key: string; title: string; subtitle: string; value: string; width: number; index?: number }>;
  empty: string;
}) {
  if (rows.length === 0) {
    return <div className="rounded-lg bg-slate-50 p-4 text-sm font-semibold text-slate-500">{empty}</div>;
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <article className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3" key={row.key}>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {typeof row.index === "number" && (
              <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-amber-100 text-sm font-black text-amber-900">
                {row.index + 1}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-slate-800">{row.title}</p>
              <p className="text-xs font-semibold text-slate-500">{row.subtitle}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-amber-800" style={{ width: `${Math.max(8, row.width)}%` }} />
              </div>
            </div>
          </div>
          <strong className="text-sm font-black text-green-700">{row.value}</strong>
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
    const current = customers.get(order.customerEmail) ?? {
      email: order.customerEmail,
      orderCount: 0,
      totalSpent: 0,
      pendingPayment: 0,
    };
    current.orderCount += 1;
    current.totalSpent += order.totalAmount;
    if (order.paymentStatus === "pending") current.pendingPayment += order.totalAmount;
    customers.set(order.customerEmail, current);
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
