"use client";

import { getHarvestApi } from "@/lib/harvest-api";
import { useV2Enabled } from "@/lib/v2-pages";
import type { Address, CustomerSegment, Order, OrderStatus, PaymentStatus, User } from "@/lib/domain";
import { Activity, AlertTriangle, Calendar, CheckCircle, Clock, Edit2, MapPin, Package, Plus, Save, Trash2, Truck, X, XCircle } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import ProfileV2Workspace from "./ProfileV2Workspace";

type ProfileTab = "info" | "addresses" | "orders" | "activity";

const fallbackEmail = "dealer@example.com";

const tabs: Array<{ id: ProfileTab; label: string }> = [
  { id: "info", label: "Account Info" },
  { id: "addresses", label: "Addresses" },
  { id: "orders", label: "Order History" },
  { id: "activity", label: "Activity" },
];

const segmentConfig: Record<CustomerSegment, { label: string; className: string }> = {
  new: { label: "Yeni", className: "bg-blue-100 text-blue-800" },
  regular: { label: "Düzenli", className: "bg-green-100 text-green-800" },
  vip: { label: "VIP", className: "bg-purple-100 text-purple-800" },
  lapsed: { label: "Pasif", className: "bg-gray-100 text-gray-800" },
  at_risk: { label: "Risk Altında", className: "bg-red-100 text-red-800" },
};

export default function ProfileWorkspace() {
  const v2Enabled = useV2Enabled("/profile");
  const api = useMemo(() => getHarvestApi(), []);
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<ProfileTab>("info");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState<Address>({ title: "", address: "" });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (v2Enabled) return;

    const loadProfile = async () => {
      setIsLoading(true);
      const currentUser = await api.getCurrentUser();
      setUser(currentUser);
      const nextOrders = await api.getMyOrders(currentUser?.email ?? fallbackEmail);
      setOrders([...nextOrders].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)));
      setIsLoading(false);
    };

    void loadProfile();
  }, [api, v2Enabled]);

  if (v2Enabled) {
    return <ProfileV2Workspace />;
  }

  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const recentActivities = orders.slice(0, 10).map((order) => ({
    id: order.id,
    description: `Order #${order.orderNumber} - ${activityStatusLabel(order.status)}`,
    timestamp: order.updatedAt || order.createdAt,
    amount: order.totalAmount,
  }));

  const handleAddAddress = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !addressForm.title.trim() || !addressForm.address.trim()) {
      setMessage("Lütfen tüm alanları doldurun");
      return;
    }

    const addresses = [...(user.addresses || [])];
    if (editingIndex !== null) {
      addresses[editingIndex] = addressForm;
    } else {
      addresses.push(addressForm);
    }

    setIsSaving(true);
    setMessage("");
    try {
      const updatedUser = await api.updateCurrentUser({ addresses });
      setUser(updatedUser);
      setShowAddressForm(false);
      setEditingIndex(null);
      setAddressForm({ title: "", address: "" });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Profile could not be updated.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditAddress = (index: number) => {
    if (!user) return;
    setEditingIndex(index);
    setAddressForm(user.addresses[index]);
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (index: number) => {
    if (!user || !window.confirm("Bu adresi silmek istediğinizden emin misiniz?")) return;

    setIsSaving(true);
    setMessage("");
    try {
      const addresses = [...(user.addresses || [])];
      addresses.splice(index, 1);
      const updatedUser = await api.updateCurrentUser({ addresses });
      setUser(updatedUser);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Profile could not be updated.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setShowAddressForm(false);
    setEditingIndex(null);
    setAddressForm({ title: "", address: "" });
  };

  const handleDeleteAccount = () => {
    setDeleteDialogOpen(false);
    setMessage("Account deletion is mocked in this migration step because the legacy action deletes the Base44 user and logs out.");
  };

  if (isLoading) {
    return <div className="text-center py-12">Yükleniyor...</div>;
  }

  if (!user) {
    return <div className="text-center py-12">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-amber-900 dark:text-amber-300 mb-2" style={{ fontFamily: "Georgia, serif" }}>
            Profile
          </h1>
          <p className="text-amber-700 dark:text-amber-400">Manage your account information and history</p>
        </div>
        {user.customerSegment && <SegmentBadge segment={user.customerSegment} />}
      </div>

      {message && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {message}
        </div>
      )}

      <div className="w-full">
        <div className="grid w-full grid-cols-2 md:grid-cols-4 mb-6 rounded-lg bg-amber-100/70 p-1">
          {tabs.map((tab) => (
            <button
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id ? "bg-white text-amber-900 shadow-sm" : "text-amber-900 hover:bg-white/60"
              }`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "info" && (
          <section className="overflow-hidden rounded-xl border border-amber-100 bg-white dark:border-gray-700 dark:bg-gray-800">
            <CardHeader title="Account Information" />
            <div className="p-6 dark:text-white space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ProfileField label="Full Name" value={user.fullName || ""} />
                <ProfileField label="Email" value={user.email} />
                <ProfileField label="Role" value={user.role === "admin" ? "Admin" : "Dealer"} />
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Customer Segment</label>
                  <div className="mt-1"><SegmentBadge segment={user.customerSegment || "new"} /></div>
                </div>
                <ProfileField label="Total Orders" value={String(totalOrders)} />
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Total Spending</label>
                  <p className="text-lg font-semibold text-green-700 dark:text-green-400">£{totalSpent.toFixed(2)}</p>
                </div>
                {user.companyName && <ProfileField label="Company Name" value={user.companyName} wide />}
              </div>

              <div className="border-t dark:border-gray-700 pt-6">
                <button
                  className="inline-flex w-full sm:w-auto items-center justify-center rounded-md bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700"
                  onClick={() => setDeleteDialogOpen(true)}
                  type="button"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </button>
              </div>
            </div>
          </section>
        )}

        {activeTab === "addresses" && (
          <section className="overflow-hidden rounded-xl border border-amber-100 bg-white dark:border-gray-700 dark:bg-gray-800">
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Delivery Addresses
                </span>
              }
              action={
                !showAddressForm ? (
                  <button
                    className="inline-flex items-center rounded-md bg-amber-900 px-3 py-2 text-sm font-medium text-white hover:bg-amber-800"
                    onClick={() => setShowAddressForm(true)}
                    type="button"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Address
                  </button>
                ) : null
              }
            />
            <div className="p-6 space-y-4">
              {showAddressForm && (
                <form className="bg-amber-50 dark:bg-gray-700 p-4 rounded-lg space-y-4 dark:text-white" onSubmit={handleAddAddress}>
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Address Title</span>
                    <input
                      className="w-full rounded-md border border-amber-200 bg-white px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-amber-700"
                      placeholder="e.g., Office, Home, Warehouse"
                      value={addressForm.title}
                      onChange={(event) => setAddressForm({ ...addressForm, title: event.target.value })}
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Delivery Address</span>
                    <textarea
                      className="min-h-24 w-full rounded-md border border-amber-200 bg-white px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-amber-700"
                      placeholder="Enter your full address"
                      value={addressForm.address}
                      onChange={(event) => setAddressForm({ ...addressForm, address: event.target.value })}
                    />
                  </label>
                  <div className="flex gap-2">
                    <button className="inline-flex items-center rounded-md bg-amber-900 px-4 py-2 font-medium text-white hover:bg-amber-800 disabled:opacity-60" disabled={isSaving} type="submit">
                      <Save className="w-4 h-4 mr-2" />
                      {editingIndex !== null ? "Update" : "Save"}
                    </button>
                    <button
                      className="inline-flex items-center rounded-md border border-amber-200 px-4 py-2 font-medium text-amber-900 hover:bg-amber-50 disabled:opacity-60"
                      disabled={isSaving}
                      onClick={handleCancel}
                      type="button"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {user.addresses && user.addresses.length > 0 ? (
                <div className="space-y-3">
                  {user.addresses.map((address, index) => (
                    <article className="rounded-lg border border-amber-200 p-4 transition-all hover:shadow-md dark:border-gray-700 dark:hover:bg-gray-700/50" key={`${address.title}-${index}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-amber-900 dark:text-amber-300 mb-1">{address.title}</h3>
                          <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line">{address.address}</p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            className="rounded-md p-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                            onClick={() => handleEditAddress(index)}
                            type="button"
                            aria-label={`Edit ${address.title}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            className="rounded-md p-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => void handleDeleteAddress(index)}
                            type="button"
                            aria-label={`Delete ${address.title}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No saved addresses yet</p>
                  <p className="text-sm">Add a delivery address to place an order</p>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === "orders" && (
          <section className="overflow-hidden rounded-xl border border-amber-100 bg-white dark:border-gray-700 dark:bg-gray-800">
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Order History
                </span>
              }
            />
            <div className="p-6">
              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <article className="rounded-lg border border-amber-200 p-4 transition-all hover:shadow-md dark:border-gray-700 dark:hover:bg-gray-700/50" key={order.id}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="font-semibold text-amber-900 dark:text-amber-300">#{order.orderNumber}</h3>
                            <OrderStatusBadge status={order.status} />
                            <PaymentStatusBadge status={order.paymentStatus} />
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(order.createdAt)}
                            </div>
                            <div className="font-semibold text-amber-900 dark:text-amber-300">£{order.totalAmount.toFixed(2)}</div>
                            <div>{order.items?.length || 0} items</div>
                          </div>
                        </div>
                        <Link href={`/orderdetails?id=${order.id}`} className="inline-flex items-center justify-center rounded-md bg-amber-900 px-3 py-2 text-sm font-medium text-white hover:bg-amber-800">
                          Details
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">No orders yet</p>
                  <p className="text-sm">Browse products to place your first order</p>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === "activity" && (
          <section className="overflow-hidden rounded-xl border border-amber-100 bg-white dark:border-gray-700 dark:bg-gray-800">
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Activity History
                </span>
              }
            />
            <div className="p-6">
              {recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <article className="flex items-start gap-4 rounded-lg bg-amber-50/50 p-4 transition-colors hover:bg-amber-50 dark:bg-gray-700/50 dark:hover:bg-gray-700" key={activity.id}>
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Package className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{activity.description}</p>
                        <div className="flex flex-wrap items-center gap-4 mt-1">
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="w-3 h-3" />
                            {formatDateTime(activity.timestamp)}
                          </div>
                          <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">£{activity.amount.toFixed(2)}</p>
                        </div>
                      </div>
                      <Link href={`/orderdetails?id=${activity.id}`} className="rounded-md px-3 py-2 text-sm font-medium text-amber-900 hover:bg-white/70">
                        View
                      </Link>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Activity className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">No activity yet</p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {deleteDialogOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Account</h2>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              This action is permanent. Your account will be deleted and the following data will be removed:
              <ul className="list-disc list-inside mt-3 space-y-1">
                <li>All personal information</li>
                <li>Order history</li>
                <li>Saved addresses</li>
                <li>Account settings</li>
              </ul>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50" onClick={() => setDeleteDialogOpen(false)} type="button">
                Cancel
              </button>
              <button className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700" onClick={handleDeleteAccount} type="button">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CardHeader({ title, action }: { title: React.ReactNode; action?: React.ReactNode }) {
  return (
    <header className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 border-b border-amber-100 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-300">{title}</h2>
        {action}
      </div>
    </header>
  );
}

function ProfileField({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <label className="text-sm text-gray-600 dark:text-gray-400">{label}</label>
      <p className="text-lg font-semibold text-amber-900 dark:text-amber-300">{value}</p>
    </div>
  );
}

function SegmentBadge({ segment }: { segment: CustomerSegment }) {
  const config = segmentConfig[segment] || segmentConfig.new;
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.className}`}>{config.label}</span>;
}

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = {
    preparing: { label: "Preparing", icon: Package, className: "bg-blue-100 text-blue-800 border-blue-200" },
    in_transit: { label: "In Transit", icon: Truck, className: "bg-orange-100 text-orange-800 border-orange-200" },
    delivered: { label: "Delivered", icon: CheckCircle, className: "bg-green-100 text-green-800 border-green-200" },
  }[status];
  const Icon = config.icon;
  return (
    <span className={`${config.className} border inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const config = {
    pending: { label: "Pending", icon: Clock, className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    paid: { label: "Paid", icon: CheckCircle, className: "bg-green-100 text-green-800 border-green-200" },
    failed: { label: "Failed", icon: XCircle, className: "bg-red-100 text-red-800 border-red-200" },
  }[status];
  const Icon = config.icon;
  return (
    <span className={`${config.className} border inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}

function activityStatusLabel(status: OrderStatus) {
  if (status === "preparing") return "Preparing";
  if (status === "in_transit") return "In Transit";
  return status === "delivered" ? "Delivered" : "Cancelled";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
