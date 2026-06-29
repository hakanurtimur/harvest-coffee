"use client";

import { Card } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import AdminPageHeader from "@/components/AdminPageHeader";
import { useOrdersQuery, useUpdateUserMutation, useUsersQuery } from "@/lib/harvest-query";
import type { CustomerSegment, Order, User } from "@/lib/domain";
import { DollarSign, Package, TrendingUp, Users } from "lucide-react";
import { useState } from "react";

const segmentOptions: CustomerSegment[] = ["new", "regular", "vip", "lapsed", "at_risk"];

const segmentConfig: Record<CustomerSegment, { label: string; className: string }> = {
  new: { label: "New", className: "border-[hsl(var(--status-info)/0.24)] bg-[hsl(var(--status-info)/0.08)] text-[hsl(var(--status-info))]" },
  regular: { label: "Regular", className: "border-[hsl(var(--status-success)/0.24)] bg-[hsl(var(--status-success)/0.08)] text-[hsl(var(--status-success))]" },
  vip: { label: "VIP", className: "border-[hsl(var(--chart-4)/0.24)] bg-[hsl(var(--chart-4)/0.08)] text-[hsl(var(--chart-4))]" },
  lapsed: { label: "Lapsed", className: "border-border bg-muted text-muted-foreground" },
  at_risk: { label: "At Risk", className: "border-[hsl(var(--status-danger)/0.24)] bg-[hsl(var(--status-danger)/0.08)] text-[hsl(var(--status-danger))]" },
};

const segmentComboboxOptions = segmentOptions.map((segment) => ({
  label: segmentConfig[segment].label,
  value: segment,
}));

type CustomerRow = User & {
  lastOrderAt?: string;
  orderCount: number;
  totalSpent: number;
};

export default function AdminCustomersModernWorkspace() {
  const usersQuery = useUsersQuery();
  const ordersQuery = useOrdersQuery();
  const updateUserMutation = useUpdateUserMutation();
  const [message, setMessage] = useState("");
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const users = usersQuery.data ?? [];
  const orders = ordersQuery.data ?? [];
  const isLoading = usersQuery.isLoading || ordersQuery.isLoading;

  const customerStats: CustomerRow[] = users
    .map((customer) => {
      const customerOrders = orders
        .filter((order) => isCustomerOrder(order, customer))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const totalSpent = customerOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      const lastOrderAt = customerOrders[0]?.createdAt;
      return {
        ...customer,
        lastOrderAt,
        orderCount: customerOrders.length,
        totalSpent,
      };
    })
    .sort((a, b) => b.totalSpent - a.totalSpent);

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  const vipCount = users.filter((user) => user.customerSegment === "vip").length;

  const handleSegmentChange = async (userId: string, customerSegment: CustomerSegment) => {
    setSavingUserId(userId);
    setMessage("");
    try {
      await updateUserMutation.mutateAsync({ id: userId, input: { customerSegment } });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Customer segment could not be updated.");
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <div className="harvest-theme space-y-5 text-foreground">
      <AdminPageHeader title="Customer Management" description="Customer information and segmentation" />

      {message && (
        <section className="rounded-xl border border-[hsl(var(--status-danger)/0.24)] bg-[hsl(var(--status-danger)/0.08)] px-4 py-3 text-sm font-bold text-[hsl(var(--status-danger))]">
          {message}
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total Customers" value={String(users.length)} icon={Users} tone="blue" />
        <SummaryCard label="VIP Customers" value={String(vipCount)} icon={TrendingUp} tone="purple" />
        <SummaryCard label="Avg. Order Value" value={`£${averageOrderValue.toFixed(2)}`} icon={DollarSign} tone="green" />
        <SummaryCard label="Total Orders" value={String(orders.length)} icon={Package} tone="amber" />
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm shadow-primary/5">
        <header className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-black text-foreground">Customers</h2>
        </header>
        <div className="p-5">
          {isLoading ? (
            <div className="h-48 animate-pulse rounded-lg bg-muted" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="border-b-2 border-border bg-muted">
                  <tr>
                    <TableHead align="left">Customer</TableHead>
                    <TableHead>Segment</TableHead>
                    <TableHead>Order Count</TableHead>
                    <TableHead align="right">Total Spent</TableHead>
                    <TableHead>Last Order</TableHead>
                    <TableHead>Actions</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {customerStats.map((customer) => (
                    <tr className="border-b border-border transition-colors hover:bg-muted" key={customer.id}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-muted text-sm font-black uppercase text-primary">
                            {(customer.fullName || customer.email || "HC").slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-black text-foreground">{customer.fullName || customer.email}</p>
                            <p className="text-sm font-semibold text-muted-foreground">{customer.email}</p>
                            {customer.companyName && <p className="text-xs font-semibold text-muted-foreground/80">{customer.companyName}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <SegmentBadge segment={customer.customerSegment || "new"} />
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-black text-foreground">{customer.orderCount}</span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-black text-[hsl(var(--status-success))]">£{customer.totalSpent.toFixed(2)}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-sm font-bold text-muted-foreground">{customer.lastOrderAt ? formatDate(customer.lastOrderAt) : "-"}</span>
                      </td>
                      <td className="p-4">
                        <Combobox
                          className="mx-auto h-10 w-40 rounded-md"
                          disabled={savingUserId === customer.id}
                          loading={savingUserId === customer.id}
                          onChange={(value) => void handleSegmentChange(customer.id, value as CustomerSegment)}
                          options={segmentComboboxOptions}
                          placeholder="Segment"
                          value={customer.customerSegment || "new"}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function isCustomerOrder(order: Order, customer: User) {
  if (order.createdById && order.createdById === customer.id) return true;
  return Boolean(order.customerEmail && sameEmail(order.customerEmail, customer.email));
}

function sameEmail(left?: string, right?: string) {
  return Boolean(left && right && left.trim().toLowerCase() === right.trim().toLowerCase());
}

function SummaryCard({ icon: Icon, label, tone, value }: { icon: React.ComponentType<{ className?: string }>; label: string; tone: "blue" | "purple" | "green" | "amber"; value: string }) {
  const tones = {
    blue: "border-[hsl(var(--status-info)/0.24)] bg-[hsl(var(--status-info)/0.08)] text-[hsl(var(--status-info))]",
    purple: "border-[hsl(var(--chart-4)/0.24)] bg-[hsl(var(--chart-4)/0.08)] text-[hsl(var(--chart-4))]",
    green: "border-[hsl(var(--status-success)/0.24)] bg-[hsl(var(--status-success)/0.08)] text-[hsl(var(--status-success))]",
    amber: "border-[hsl(var(--status-warning)/0.24)] bg-[hsl(var(--status-warning)/0.08)] text-[hsl(var(--status-warning))]",
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

function TableHead({ align = "center", children }: { align?: "left" | "center" | "right"; children: React.ReactNode }) {
  const alignment = align === "left" ? "text-left" : align === "right" ? "text-right" : "text-center";
  return <th className={`p-4 text-sm font-black text-foreground ${alignment}`}>{children}</th>;
}

function SegmentBadge({ segment }: { segment: CustomerSegment }) {
  const config = segmentConfig[segment] || segmentConfig.new;
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${config.className}`}>{config.label}</span>;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}
