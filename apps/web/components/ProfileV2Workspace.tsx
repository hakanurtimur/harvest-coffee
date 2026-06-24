"use client";

import MotionReveal from "@/components/MotionReveal";
import LoadingState from "@/components/LoadingState";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { clearHarvestSession } from "@/lib/harvest-api";
import { useCurrentUserQuery, useDeleteCurrentUserMutation, useMyOrdersQuery, useUpdateCurrentUserMutation } from "@/lib/harvest-query";
import type { Address, CustomerSegment, Order, OrderStatus, PaymentStatus, User } from "@/lib/domain";
import {
  Activity,
  Calendar,
  CheckCircle,
  Clock,
  Edit2,
  MapPin,
  Package,
  Plus,
  Save,
  Trash2,
  Truck,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type ProfileTab = "info" | "addresses" | "orders" | "activity";

const tabs: Array<{ id: ProfileTab; label: string }> = [
  { id: "info", label: "Account Info" },
  { id: "addresses", label: "Addresses" },
  { id: "orders", label: "Order History" },
  { id: "activity", label: "Activity" },
];

const segmentConfig: Record<CustomerSegment, { label: string; className: string }> = {
  new: { label: "Yeni", className: "border-blue-200 bg-blue-50 text-blue-800" },
  regular: { label: "Düzenli", className: "border-green-200 bg-green-50 text-green-800" },
  vip: { label: "VIP", className: "border-purple-200 bg-purple-50 text-purple-800" },
  lapsed: { label: "Pasif", className: "border-border bg-secondary text-secondary-foreground" },
  at_risk: { label: "Risk Altında", className: "border-red-200 bg-red-50 text-red-800" },
};

export default function ProfileV2Workspace() {
  const currentUserQuery = useCurrentUserQuery();
  const ordersQuery = useMyOrdersQuery();
  const updateCurrentUserMutation = useUpdateCurrentUserMutation();
  const deleteCurrentUserMutation = useDeleteCurrentUserMutation();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProfileTab>("info");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState<Address>({ title: "", address: "" });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addressIndexToDelete, setAddressIndexToDelete] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const user = currentUserQuery.data ?? null;
  const orders = ordersQuery.data ?? [];
  const isLoading = currentUserQuery.isLoading || ordersQuery.isLoading;
  const isSaving = updateCurrentUserMutation.isPending || deleteCurrentUserMutation.isPending;

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
    if (editingIndex !== null) addresses[editingIndex] = addressForm;
    else addresses.push(addressForm);

    setMessage("");
    try {
      const actionLabel = editingIndex !== null ? "updated" : "saved";
      await updateCurrentUserMutation.mutateAsync({ addresses });
      setShowAddressForm(false);
      setEditingIndex(null);
      setAddressForm({ title: "", address: "" });
      setMessage(`Address ${actionLabel}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Profile could not be updated.");
    }
  };

  const handleEditAddress = (index: number) => {
    if (!user) return;
    setEditingIndex(index);
    setAddressForm(user.addresses[index]);
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async () => {
    if (!user || addressIndexToDelete === null) return;

    setMessage("");
    try {
      const addresses = [...(user.addresses || [])];
      addresses.splice(addressIndexToDelete, 1);
      await updateCurrentUserMutation.mutateAsync({ addresses });
      setMessage("Address deleted.");
      setAddressIndexToDelete(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Profile could not be updated.");
    }
  };

  const handleCancel = () => {
    setShowAddressForm(false);
    setEditingIndex(null);
    setAddressForm({ title: "", address: "" });
  };

  const handleDeleteAccount = async () => {
    setMessage("");
    try {
      await deleteCurrentUserMutation.mutateAsync();
      clearHarvestSession();
      setDeleteDialogOpen(false);
      router.push("/login");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Account could not be deleted.");
      setDeleteDialogOpen(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="harvest-theme bg-background px-5 py-24 text-foreground sm:px-8 lg:px-10">
        <LoadingState
          description="Fetching your account details, saved addresses, and recent orders."
          title="Loading profile"
        />
      </div>
    );
  }

  return (
    <div className="harvest-theme overflow-hidden bg-background text-foreground">
      <section className="relative px-5 pb-6 pt-0 sm:px-8 lg:px-10">
        <MotionReveal className="relative mx-auto max-w-7xl">
          <Card className="overflow-hidden rounded-2xl border-border bg-card p-5 shadow-sm shadow-primary/5 sm:p-6">
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <CoffeeBranchAsset className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 -scale-x-100 bg-primary/[0.045]" />
              <div className="relative">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary">Dealer account</p>
                <h1 className="mt-2 text-3xl font-black tracking-normal text-foreground sm:text-4xl">Profile</h1>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-muted-foreground">
                  Manage account details, delivery addresses, order history, and activity from your dealer workspace.
                </p>
              </div>
              <div className="relative grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
                <ProfileMetric label="Orders" value={String(totalOrders)} />
                <ProfileMetric label="Addresses" value={String(user.addresses?.length ?? 0)} />
                <ProfileMetric label="Spending" value={`£${totalSpent.toFixed(2)}`} />
              </div>
            </div>
            {user.customerSegment && (
              <div className="relative mt-5 flex items-center gap-2 border-t border-border pt-4">
                <span className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">Segment</span>
                <SegmentBadge segment={user.customerSegment} />
              </div>
            )}
          </Card>
        </MotionReveal>
      </section>

      <section className="relative bg-background px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
        <CoffeeBranchAsset className="absolute -left-24 bottom-0 h-60 w-60 bg-primary/[0.07]" />
        <div className="relative mx-auto max-w-7xl">
          {message && (
            <MotionReveal>
              <Card className="mb-6 rounded-lg border-primary/20 bg-secondary p-4 text-sm font-semibold text-foreground shadow-none">
                {message}
              </Card>
            </MotionReveal>
          )}

          <MotionReveal>
            <div className="grid w-full grid-cols-2 gap-1 rounded-lg border border-border bg-background/72 p-1 md:grid-cols-4">
              {tabs.map((tab) => (
                <button
                  className={`h-11 rounded-md px-3 text-sm font-black transition-colors ${
                    activeTab === tab.id ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/70 hover:bg-secondary hover:text-foreground"
                  }`}
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </MotionReveal>

          <div className="mt-6">
            {activeTab === "info" && (
              <MotionReveal>
                <Panel title="Account Information">
                  <div className="grid gap-6 md:grid-cols-2">
                    <ProfileField label="Full Name" value={user.fullName || ""} />
                    <ProfileField label="Email" value={user.email} />
                    <ProfileField label="Role" value={user.role === "admin" ? "Admin" : "Dealer"} />
                    <div>
                      <p className="text-sm font-bold text-muted-foreground">Customer Segment</p>
                      <div className="mt-2"><SegmentBadge segment={user.customerSegment || "new"} /></div>
                    </div>
                    <ProfileField label="Total Orders" value={String(totalOrders)} />
                    <ProfileField label="Total Spending" value={`£${totalSpent.toFixed(2)}`} valueClassName="text-green-700" />
                    {user.companyName && <ProfileField label="Company Name" value={user.companyName} wide />}
                  </div>

                  <div className="mt-8 border-t border-border pt-6">
                    <Button className="h-11 rounded-md bg-destructive px-5 text-destructive-foreground hover:bg-destructive/90" onClick={() => setDeleteDialogOpen(true)}>
                      <Trash2 className="h-4 w-4" />
                      Delete Account
                    </Button>
                  </div>
                </Panel>
              </MotionReveal>
            )}

            {activeTab === "addresses" && (
              <MotionReveal>
                <Panel
                  title={
                    <span className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Delivery Addresses
                    </span>
                  }
                  action={
                    !showAddressForm ? (
                      <Button className="h-10 rounded-md px-4" onClick={() => setShowAddressForm(true)}>
                        <Plus className="h-4 w-4" />
                        New Address
                      </Button>
                    ) : null
                  }
                >
                  {showAddressForm && (
                    <form className="mb-5 space-y-4 rounded-lg bg-secondary p-4" onSubmit={handleAddAddress}>
                      <label className="block">
                        <span className="mb-2 block text-sm font-bold text-foreground/70">Address Title</span>
                        <input
                          className={fieldClassName}
                          placeholder="e.g., Office, Home, Warehouse"
                          value={addressForm.title}
                          onChange={(event) => setAddressForm({ ...addressForm, title: event.target.value })}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm font-bold text-foreground/70">Delivery Address</span>
                        <textarea
                          className={`${fieldClassName} min-h-24 py-3`}
                          placeholder="Enter your full address"
                          value={addressForm.address}
                          onChange={(event) => setAddressForm({ ...addressForm, address: event.target.value })}
                        />
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <Button className="h-10 rounded-md px-4" disabled={isSaving} type="submit">
                          <Save className="h-4 w-4" />
                          {editingIndex !== null ? "Update" : "Save"}
                        </Button>
                        <Button className="h-10 rounded-md px-4" disabled={isSaving} onClick={handleCancel} type="button" variant="outline">
                          <X className="h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}

                  {user.addresses && user.addresses.length > 0 ? (
                    <div className="space-y-3">
                      {user.addresses.map((address, index) => (
                        <Card className="rounded-lg border-border bg-background/70 p-4 shadow-none" key={`${address.title}-${index}`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="font-display text-xl font-black text-foreground">{address.title}</h3>
                              <p className="mt-2 whitespace-pre-line text-sm font-medium leading-6 text-muted-foreground">{address.address}</p>
                            </div>
                            <div className="flex gap-2">
                              <button className="rounded-md p-2 text-blue-600 hover:bg-blue-50" onClick={() => handleEditAddress(index)} type="button" aria-label={`Edit ${address.title}`}>
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button className="rounded-md p-2 text-destructive hover:bg-destructive/10" onClick={() => setAddressIndexToDelete(index)} type="button" aria-label={`Delete ${address.title}`}>
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon={MapPin} title="No saved addresses yet" description="Add a delivery address to place an order" />
                  )}
                </Panel>
              </MotionReveal>
            )}

            {activeTab === "orders" && (
              <MotionReveal>
                <Panel title={<span className="flex items-center gap-2"><Package className="h-5 w-5 text-primary" />Order History</span>}>
                  {orders.length > 0 ? (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <OrderHistoryRow key={order.id} order={order} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon={Package} title="No orders yet" description="Browse products to place your first order" />
                  )}
                </Panel>
              </MotionReveal>
            )}

            {activeTab === "activity" && (
              <MotionReveal>
                <Panel title={<span className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" />Activity History</span>}>
                  {recentActivities.length > 0 ? (
                    <div className="space-y-4">
                      {recentActivities.map((activity) => (
                        <Card className="rounded-lg border-border bg-secondary/65 p-4 shadow-none" key={activity.id}>
                          <div className="flex items-start gap-4">
                            <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600">
                              <Package className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-foreground">{activity.description}</p>
                              <div className="mt-2 flex flex-wrap items-center gap-4">
                                <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {formatDateTime(activity.timestamp)}
                                </span>
                                <span className="text-sm font-black text-primary">£{activity.amount.toFixed(2)}</span>
                              </div>
                            </div>
                            <Link href={`/orderdetails?id=${activity.id}`} className="rounded-md px-3 py-2 text-sm font-black text-primary hover:bg-background/80">
                              View
                            </Link>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon={Activity} title="No activity yet" />
                  )}
                </Panel>
              </MotionReveal>
            )}
          </div>
        </div>
      </section>

      <AlertDialog
        confirmLabel="Delete address"
        description={
          addressIndexToDelete !== null && user.addresses?.[addressIndexToDelete]
            ? `This will remove "${user.addresses[addressIndexToDelete].title}" from your saved delivery addresses.`
            : "This delivery address will be removed."
        }
        loading={isSaving}
        onConfirm={() => void handleDeleteAddress()}
        onOpenChange={(open) => {
          if (!open) setAddressIndexToDelete(null);
        }}
        open={addressIndexToDelete !== null}
        title="Delete address?"
        tone="destructive"
      />

      <AlertDialog
        confirmLabel="Delete account"
        description="This action is permanent. Your account and related profile information will be deleted."
        loading={isSaving}
        onConfirm={() => void handleDeleteAccount()}
        onOpenChange={setDeleteDialogOpen}
        open={deleteDialogOpen}
        title="Delete account?"
        tone="destructive"
      >
        <ul className="list-inside list-disc space-y-1 text-sm font-semibold leading-6 text-muted-foreground">
          <li>All personal information</li>
          <li>Order history</li>
          <li>Saved addresses</li>
          <li>Account settings</li>
        </ul>
      </AlertDialog>
    </div>
  );
}

const fieldClassName =
  "w-full rounded-md border border-border bg-background/70 px-3 py-2 text-sm font-medium text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground/65";

function Panel({ action, children, title }: { action?: React.ReactNode; children: React.ReactNode; title: React.ReactNode }) {
  return (
    <Card className="overflow-hidden rounded-lg border-border bg-background/82 shadow-sm shadow-primary/5">
      <header className="border-b border-border bg-secondary/55 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-black text-foreground">{title}</h2>
          {action}
        </div>
      </header>
      <div className="p-6">{children}</div>
    </Card>
  );
}

function ProfileField({ label, value, valueClassName = "", wide }: { label: string; value: string; valueClassName?: string; wide?: boolean }) {
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <p className="text-sm font-bold text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-black text-foreground ${valueClassName}`}>{value}</p>
    </div>
  );
}

function ProfileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/80 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-normal text-foreground">{value}</p>
    </div>
  );
}

function OrderHistoryRow({ order }: { order: Order }) {
  return (
    <Card className="rounded-lg border-border bg-background/70 p-4 shadow-none">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="font-display text-xl font-black text-foreground">#{order.orderNumber}</h3>
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4 text-primary" />
              {formatDate(order.createdAt)}
            </span>
            <span className="font-black text-primary">£{order.totalAmount.toFixed(2)}</span>
            <span>{order.items.length} items</span>
          </div>
        </div>
        <Button asChildShim className="h-10 rounded-md px-4">
          <Link href={`/orderdetails?id=${order.id}`}>Details</Link>
        </Button>
      </div>
    </Card>
  );
}

function EmptyState({ description, icon: Icon, title }: { description?: string; icon: React.ComponentType<{ className?: string }>; title: string }) {
  return (
    <div className="py-12 text-center text-muted-foreground">
      <Icon className="mx-auto mb-4 h-16 w-16 text-primary/30" />
      <p className="text-lg font-black text-foreground">{title}</p>
      {description && <p className="mt-2 text-sm font-medium">{description}</p>}
    </div>
  );
}

function SegmentBadge({ segment }: { segment: CustomerSegment }) {
  const config = segmentConfig[segment] || segmentConfig.new;
  return <Badge className={config.className}>{config.label}</Badge>;
}

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = {
    preparing: { label: "Preparing", icon: Package, className: "border-blue-200 bg-blue-50 text-blue-800" },
    in_transit: { label: "In Transit", icon: Truck, className: "border-orange-200 bg-orange-50 text-orange-800" },
    delivered: { label: "Delivered", icon: CheckCircle, className: "border-green-200 bg-green-50 text-green-800" },
  }[status];
  const Icon = config.icon;
  return (
    <Badge className={`${config.className} gap-1`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const config = {
    pending: { label: "Pending", icon: Clock, className: "border-yellow-200 bg-yellow-50 text-yellow-800" },
    paid: { label: "Paid", icon: CheckCircle, className: "border-green-200 bg-green-50 text-green-800" },
    failed: { label: "Failed", icon: XCircle, className: "border-red-200 bg-red-50 text-red-800" },
  }[status];
  const Icon = config.icon;
  return (
    <Badge className={`${config.className} gap-1`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
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

function CoffeeBranchAsset({ className }: { className?: string }) {
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
