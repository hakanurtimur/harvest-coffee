"use client";

import AdminCustomersV2Workspace from "@/components/AdminCustomersV2Workspace";
import { Combobox } from "@/components/ui/combobox";
import { getHarvestApi } from "@/lib/harvest-api";
import { useV2Enabled } from "@/lib/v2-pages";
import type { CustomerSegment, Order, User } from "@/lib/domain";
import { DollarSign, Package, TrendingUp, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const segmentOptions: CustomerSegment[] = ["new", "regular", "vip", "lapsed", "at_risk"];

const segmentConfig: Record<CustomerSegment, { label: string; className: string }> = {
  new: { label: "Yeni", className: "bg-blue-100 text-blue-800" },
  regular: { label: "Düzenli", className: "bg-green-100 text-green-800" },
  vip: { label: "VIP", className: "bg-purple-100 text-purple-800" },
  lapsed: { label: "Pasif", className: "bg-gray-100 text-gray-800" },
  at_risk: { label: "Risk Altında", className: "bg-red-100 text-red-800" },
};

const segmentComboboxOptions = segmentOptions.map((segment) => ({
  label: segmentConfig[segment].label,
  value: segment,
}));

type CustomerRow = User & {
  orderCount: number;
  totalSpent: number;
};

export default function AdminCustomersWorkspace() {
  const v2Enabled = useV2Enabled("/customermanagement");

  if (v2Enabled) {
    return <AdminCustomersV2Workspace />;
  }

  return <LegacyAdminCustomersWorkspace />;
}

function LegacyAdminCustomersWorkspace() {
  const api = useMemo(() => getHarvestApi(), []);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  useEffect(() => {
    void loadCustomers();
  }, []);

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
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-amber-900 mb-2" style={{ fontFamily: "Georgia, serif" }}>
          Müşteri Yönetimi
        </h1>
        <p className="text-amber-700">Müşteri bilgileri ve segmentasyon</p>
      </div>

      {message && <section className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{message}</section>}

      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard label="Toplam Müşteri" value={String(users.length)} icon={<Users className="w-12 h-12 text-blue-600 opacity-50" />} className="from-blue-50 to-blue-100 text-blue-900" />
        <SummaryCard label="VIP Müşteriler" value={String(vipCount)} icon={<TrendingUp className="w-12 h-12 text-purple-600 opacity-50" />} className="from-purple-50 to-purple-100 text-purple-900" />
        <SummaryCard label="Ort. Sipariş Değeri" value={`£${averageOrderValue.toFixed(2)}`} icon={<DollarSign className="w-12 h-12 text-green-600 opacity-50" />} className="from-green-50 to-green-100 text-green-900" />
        <SummaryCard label="Toplam Sipariş" value={String(orders.length)} icon={<Package className="w-12 h-12 text-amber-600 opacity-50" />} className="from-amber-50 to-amber-100 text-amber-900" />
      </section>

      <section className="rounded-xl border border-amber-100 bg-white">
        <header className="p-6 border-b border-amber-100">
          <h2 className="text-lg font-semibold text-amber-900">Müşteriler</h2>
        </header>
        <div className="p-6">
          {isLoading ? (
            <div className="h-48 bg-gray-100 animate-pulse rounded-lg" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px]">
                <thead className="bg-amber-50 border-b-2 border-amber-200">
                  <tr>
                    <th className="text-left p-4 font-semibold text-amber-900">Müşteri</th>
                    <th className="text-center p-4 font-semibold text-amber-900">Segment</th>
                    <th className="text-center p-4 font-semibold text-amber-900">Sipariş Sayısı</th>
                    <th className="text-right p-4 font-semibold text-amber-900">Toplam Harcama</th>
                    <th className="text-center p-4 font-semibold text-amber-900">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {customerStats.map((customer) => (
                    <tr className="border-b border-amber-50 hover:bg-amber-50/50" key={customer.id}>
                      <td className="p-4">
                        <div>
                          <p className="font-semibold text-amber-900">{customer.fullName || customer.email}</p>
                          <p className="text-sm text-gray-600">{customer.email}</p>
                          {customer.companyName && <p className="text-xs text-gray-500">{customer.companyName}</p>}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <SegmentBadge segment={customer.customerSegment || "new"} />
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-semibold text-amber-900">{customer.orderCount}</span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-bold text-green-700">£{customer.totalSpent.toFixed(2)}</span>
                      </td>
                      <td className="p-4">
                        <Combobox
                          className="mx-auto h-10 w-40 rounded-md"
                          value={customer.customerSegment || "new"}
                          onChange={(value) => void handleSegmentChange(customer.id, value as CustomerSegment)}
                          options={segmentComboboxOptions}
                          placeholder="Segment"
                          disabled={savingUserId === customer.id}
                          loading={savingUserId === customer.id}
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

function SummaryCard({ label, value, icon, className }: { label: string; value: string; icon: React.ReactNode; className: string }) {
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

function SegmentBadge({ segment }: { segment: CustomerSegment }) {
  const config = segmentConfig[segment] || segmentConfig.new;
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.className}`}>{config.label}</span>;
}
