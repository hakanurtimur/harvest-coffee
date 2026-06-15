"use client";

import { Card } from "@/components/ui/card";
import { getHarvestApi } from "@/lib/harvest-api";
import type { CustomerSegment, Order, User } from "@harvest/domain";
import { DollarSign, Package, TrendingUp, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const segmentOptions: CustomerSegment[] = ["new", "regular", "vip", "lapsed", "at_risk"];

const segmentConfig: Record<CustomerSegment, { label: string; className: string }> = {
  new: { label: "Yeni", className: "border-blue-200 bg-blue-50 text-blue-800" },
  regular: { label: "Düzenli", className: "border-green-200 bg-green-50 text-green-800" },
  vip: { label: "VIP", className: "border-purple-200 bg-purple-50 text-purple-800" },
  lapsed: { label: "Pasif", className: "border-gray-200 bg-gray-50 text-gray-800" },
  at_risk: { label: "Risk Altında", className: "border-red-200 bg-red-50 text-red-800" },
};

type CustomerRow = User & {
  orderCount: number;
  totalSpent: number;
};

export default function AdminCustomersV2Workspace() {
  const api = useMemo(() => getHarvestApi(), []);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  const loadCustomers = async () => {
    setIsLoading(true);
    setMessage("");
    const [nextUsers, nextOrders] = await Promise.all([
      api.getUsers(),
      api.getOrders(),
    ]);
    setUsers(nextUsers);
    setOrders(nextOrders);
    setIsLoading(false);
  };

  useEffect(() => {
    void loadCustomers();
  }, []);

  const customerStats: CustomerRow[] = users
    .map((customer) => {
      const customerOrders = orders.filter((order) => order.customerEmail === customer.email);
      const totalSpent = customerOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      return {
        ...customer,
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
      const updated = await api.updateUser(userId, { customerSegment });
      setUsers((current) => current.map((user) => (user.id === userId ? updated : user)));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Müşteri segmenti güncellenemedi.");
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <div className="space-y-5 text-[#3a2619]">
      <section className="rounded-lg border border-[#e8daca] bg-[#fffdf8] p-5 shadow-sm shadow-[#8a461c]/5 md:p-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#b3692c]">Admin</p>
        <h1 className="mt-2 text-3xl font-black tracking-normal text-[#3a2619] md:text-4xl">Müşteri Yönetimi</h1>
        <p className="mt-2 text-sm font-semibold text-[#8f7461]">Müşteri bilgileri ve segmentasyon</p>
      </section>

      {message && (
        <section className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
          {message}
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Toplam Müşteri" value={String(users.length)} icon={Users} tone="blue" />
        <SummaryCard label="VIP Müşteriler" value={String(vipCount)} icon={TrendingUp} tone="purple" />
        <SummaryCard label="Ort. Sipariş Değeri" value={`£${averageOrderValue.toFixed(2)}`} icon={DollarSign} tone="green" />
        <SummaryCard label="Toplam Sipariş" value={String(orders.length)} icon={Package} tone="amber" />
      </section>

      <section className="overflow-hidden rounded-lg border border-[#e8daca] bg-[#fffdf8] shadow-sm shadow-[#8a461c]/5">
        <header className="border-b border-[#eadccf] px-5 py-4">
          <h2 className="text-lg font-black text-[#3a2619]">Müşteriler</h2>
        </header>
        <div className="p-5">
          {isLoading ? (
            <div className="h-48 animate-pulse rounded-lg bg-[#f3e8da]" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="border-b-2 border-[#e8daca] bg-[#fff8ed]">
                  <tr>
                    <TableHead align="left">Müşteri</TableHead>
                    <TableHead>Segment</TableHead>
                    <TableHead>Sipariş Sayısı</TableHead>
                    <TableHead align="right">Toplam Harcama</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {customerStats.map((customer) => (
                    <tr className="border-b border-[#f0e2d4] transition-colors hover:bg-[#fff8ed]" key={customer.id}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-[#f0dfca] text-sm font-black uppercase text-[#8a461c]">
                            {(customer.fullName || customer.email || "HC").slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-black text-[#3a2619]">{customer.fullName || customer.email}</p>
                            <p className="text-sm font-semibold text-[#7f6554]">{customer.email}</p>
                            {customer.companyName && <p className="text-xs font-semibold text-[#9a8373]">{customer.companyName}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <SegmentBadge segment={customer.customerSegment || "new"} />
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-black text-[#3a2619]">{customer.orderCount}</span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-black text-green-700">£{customer.totalSpent.toFixed(2)}</span>
                      </td>
                      <td className="p-4">
                        <select
                          className="mx-auto block h-10 w-40 rounded-md border border-[#e3d1bd] bg-white px-3 text-sm font-bold text-[#3a2619] outline-none transition-colors focus:border-[#8a461c] disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={savingUserId === customer.id}
                          onChange={(event) => void handleSegmentChange(customer.id, event.target.value as CustomerSegment)}
                          value={customer.customerSegment || "new"}
                        >
                          {segmentOptions.map((segment) => (
                            <option value={segment} key={segment}>{segmentConfig[segment].label}</option>
                          ))}
                        </select>
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

function SummaryCard({ icon: Icon, label, tone, value }: { icon: React.ComponentType<{ className?: string }>; label: string; tone: "blue" | "purple" | "green" | "amber"; value: string }) {
  const tones = {
    blue: "border-blue-100 bg-blue-50 text-blue-950",
    purple: "border-purple-100 bg-purple-50 text-purple-950",
    green: "border-green-100 bg-green-50 text-green-950",
    amber: "border-amber-100 bg-amber-50 text-amber-950",
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
  return <th className={`p-4 text-sm font-black text-[#5c3a25] ${alignment}`}>{children}</th>;
}

function SegmentBadge({ segment }: { segment: CustomerSegment }) {
  const config = segmentConfig[segment] || segmentConfig.new;
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${config.className}`}>{config.label}</span>;
}
