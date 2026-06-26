import { Feather } from "@expo/vector-icons";
import { orderStatusLabels } from "@harvest/domain";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, ConfirmDialog, EmptyState, Field, fontFamilies, formatCurrency, formatDate, initials, OutlineButton, PrimaryButton, ScrollContent, SectionTitle, StatusBanner, styles } from "../components/ui";
import { useMobileState } from "../lib/mobile-state";
import { validateAddressForm } from "../lib/validation";

type ProfileTab = "account" | "addresses" | "activity";

const profileTabs: Array<{ icon: keyof typeof Feather.glyphMap; label: string; value: ProfileTab }> = [
  { icon: "user", label: "Account", value: "account" },
  { icon: "map-pin", label: "Addresses", value: "addresses" },
  { icon: "activity", label: "Activity", value: "activity" },
];

export default function ProfileScreen() {
  const {
    addAddress,
    currentUser,
    deleteAddress,
    deliveryAddress,
    logout,
    orders,
    setDeliveryAddress,
    updateAddress,
  } = useMobileState();
  const [addressTitle, setAddressTitle] = useState("");
  const [addressText, setAddressText] = useState("");
  const [editingAddressIndex, setEditingAddressIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>("account");
  const [deleteAddressIndex, setDeleteAddressIndex] = useState<number | null>(null);
  const [message, setMessage] = useState<{ body?: string; title: string; tone: "error" | "success" } | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const recentActivities = useMemo(
    () => orders.slice(0, 5).map((order) => ({
      amount: order.totalAmount,
      description: `Order #${order.orderNumber} - ${orderStatusLabels[order.status]}`,
      id: order.id,
      timestamp: order.updatedAt || order.createdAt,
    })),
    [orders],
  );

  if (!currentUser) return null;

  const isEditingAddress = editingAddressIndex !== null;

  const resetAddressForm = () => {
    setAddressTitle("");
    setAddressText("");
    setEditingAddressIndex(null);
    setShowAddressForm(false);
  };

  const startEditAddress = (index: number) => {
    const address = currentUser.addresses[index];
    if (!address) return;
    setAddressTitle(address.title);
    setAddressText(address.address);
    setEditingAddressIndex(index);
    setActiveTab("addresses");
    setShowAddressForm(true);
  };

  const submitAddress = async () => {
    const address = validateAddressForm(addressTitle, addressText);
    if (!address.ok) {
      setMessage({ body: address.message, title: address.title, tone: "error" });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      if (isEditingAddress) {
        await updateAddress(editingAddressIndex, address.value.title, address.value.address);
        setMessage({ title: "Address updated", tone: "success" });
      } else {
        await addAddress(address.value.title, address.value.address);
        setMessage({ title: "Address added", tone: "success" });
      }
      resetAddressForm();
    } catch (error) {
      setMessage({ body: error instanceof Error ? error.message : "The address could not be saved.", title: "Address failed", tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const confirmDeleteAddress = (index: number) => {
    const address = currentUser.addresses[index];
    if (!address) return;
    setDeleteAddressIndex(index);
  };

  const deleteSelectedAddress = async () => {
    if (deleteAddressIndex === null) return;
    setSaving(true);
    setMessage(null);
    try {
      await deleteAddress(deleteAddressIndex);
      setMessage({ title: "Address deleted", tone: "success" });
      setDeleteAddressIndex(null);
    } catch (error) {
      setMessage({ body: error instanceof Error ? error.message : "The address could not be deleted.", title: "Delete failed", tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollContent>
      <SectionTitle eyebrow="Account" title="Profile" />
      {message ? <StatusBanner body={message.body} title={message.title} tone={message.tone} /> : null}

      <View style={profileStyles.heroCard}>
        <View style={profileStyles.avatar}>
          <Text style={profileStyles.avatarText}>{initials(currentUser.fullName)}</Text>
        </View>
        <View style={profileStyles.heroCopy}>
          <Text style={profileStyles.name}>{currentUser.fullName}</Text>
          <Text style={profileStyles.company}>{currentUser.companyName}</Text>
          <Text style={profileStyles.email}>{currentUser.email}</Text>
        </View>
      </View>

      <View style={profileStyles.metricsRow}>
        <MetricBox label="Orders" value={orders.length.toString()} />
        <MetricBox label="Segment" value={currentUser.customerSegment} />
        <MetricBox label="Addresses" value={currentUser.addresses.length.toString()} />
      </View>

      <View style={profileStyles.tabs}>
        {profileTabs.map((tab) => {
          const active = activeTab === tab.value;
          return (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              key={tab.value}
              onPress={() => setActiveTab(tab.value)}
              style={({ pressed }) => [profileStyles.tabButton, active && profileStyles.tabButtonActive, pressed && styles.pressed]}
            >
              <Feather color={active ? colors.onPrimary : colors.muted} name={tab.icon} size={15} />
              <Text style={[profileStyles.tabText, active && profileStyles.tabTextActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {activeTab === "account" ? (
        <View style={profileStyles.sessionCard}>
          <View style={profileStyles.sessionCopy}>
            <Text style={profileStyles.panelTitle}>Session</Text>
            <Text style={profileStyles.sessionText}>Dealer workspace session is active.</Text>
          </View>
          <OutlineButton label="Logout" onPress={handleLogout} />
        </View>
      ) : null}

      {activeTab === "addresses" ? (
        <View style={profileStyles.panel}>
          <View style={profileStyles.panelHeader}>
            <View>
              <Text style={profileStyles.panelEyebrow}>Delivery</Text>
              <Text style={profileStyles.panelTitle}>Saved addresses</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => showAddressForm ? resetAddressForm() : setShowAddressForm(true)}
              style={({ pressed }) => [profileStyles.iconButton, pressed && styles.pressed]}
            >
              <Feather color={colors.foreground} name={showAddressForm ? "x" : "plus"} size={18} />
            </Pressable>
          </View>

          {showAddressForm ? (
            <View style={profileStyles.formCard}>
              <Field onChangeText={setAddressTitle} placeholder="Address title" value={addressTitle} />
              <Field multiline onChangeText={setAddressText} placeholder="Delivery address" value={addressText} />
              <PrimaryButton
                disabled={saving}
                label={saving ? "Saving address..." : isEditingAddress ? "Save address" : "Add address"}
                onPress={submitAddress}
              />
              {isEditingAddress ? <OutlineButton label="Cancel edit" onPress={resetAddressForm} /> : null}
            </View>
          ) : null}

          {currentUser.addresses.length === 0 ? (
            <View style={profileStyles.emptyAddress}>
              <Feather color={colors.primary} name="map-pin" size={20} />
              <Text style={profileStyles.emptyText}>No saved addresses yet.</Text>
            </View>
          ) : (
            currentUser.addresses.map((address, index) => {
              const active = deliveryAddress === address.address;
              return (
                <View key={`${address.title}-${index}`} style={[profileStyles.addressCard, active && profileStyles.addressCardActive]}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={({ pressed }) => [profileStyles.addressSelect, pressed && styles.pressed]}
                    onPress={() => setDeliveryAddress(address.address)}
                  >
                    <View style={[profileStyles.radio, active && profileStyles.radioActive]}>
                      {active ? <Feather color={colors.onPrimary} name="check" size={12} /> : null}
                    </View>
                    <View style={profileStyles.addressCopy}>
                      <View style={profileStyles.addressTitleRow}>
                        <Text style={profileStyles.addressTitle}>{address.title}</Text>
                        {active ? <Text style={profileStyles.defaultBadge}>Default</Text> : null}
                      </View>
                      <Text style={profileStyles.addressText}>{address.address}</Text>
                    </View>
                  </Pressable>
                  <View style={profileStyles.addressActions}>
                    <Pressable
                      accessibilityLabel={`Edit ${address.title}`}
                      accessibilityRole="button"
                      onPress={() => startEditAddress(index)}
                      style={({ pressed }) => [profileStyles.editButton, pressed && styles.pressed]}
                    >
                      <Feather color={colors.foreground} name="edit-3" size={15} />
                    </Pressable>
                    <Pressable
                      accessibilityLabel={`Delete ${address.title}`}
                      accessibilityRole="button"
                      onPress={() => confirmDeleteAddress(index)}
                      style={({ pressed }) => [profileStyles.deleteButton, pressed && styles.pressed]}
                    >
                      <Feather color={colors.status.danger.color} name="trash-2" size={15} />
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </View>
      ) : null}

      {activeTab === "activity" ? (
        <View style={profileStyles.panel}>
        <View style={profileStyles.panelHeader}>
          <View>
            <Text style={profileStyles.panelEyebrow}>Activity</Text>
            <Text style={profileStyles.panelTitle}>Recent activity</Text>
          </View>
          <View style={profileStyles.activityHeaderIcon}>
            <Feather color={colors.primary} name="activity" size={17} />
          </View>
        </View>

        {recentActivities.length === 0 ? (
          <EmptyState title="No activity yet" body="Orders will appear here after checkout." />
        ) : (
          <View style={profileStyles.activityList}>
            {recentActivities.map((activity) => (
              <Pressable
                accessibilityRole="button"
                key={activity.id}
                onPress={() => router.push(`/order/${activity.id}`)}
                style={({ pressed }) => [profileStyles.activityItem, pressed && styles.pressed]}
              >
                <View style={profileStyles.activityIcon}>
                  <Feather color={colors.foreground} name="package" size={16} />
                </View>
                <View style={profileStyles.activityCopy}>
                  <Text numberOfLines={2} style={profileStyles.activityTitle}>{activity.description}</Text>
                  <Text style={profileStyles.activityDate}>{formatDate(activity.timestamp)}</Text>
                </View>
                <View style={profileStyles.activityMeta}>
                  <Text style={profileStyles.activityAmount}>{formatCurrency(activity.amount).replace("GBP ", "£")}</Text>
                  <Feather color={colors.muted} name="chevron-right" size={16} />
                </View>
              </Pressable>
            ))}
          </View>
        )}
        </View>
      ) : null}
      <ConfirmDialog
        body={
          deleteAddressIndex !== null && currentUser.addresses[deleteAddressIndex]
            ? `${currentUser.addresses[deleteAddressIndex].title} will be removed from your saved delivery addresses.`
            : "This address will be removed from your saved delivery addresses."
        }
        confirmLabel="Delete"
        confirming={saving && deleteAddressIndex !== null}
        destructive
        onCancel={() => {
          if (!saving) setDeleteAddressIndex(null);
        }}
        onConfirm={() => void deleteSelectedAddress()}
        title="Delete address?"
        visible={deleteAddressIndex !== null}
      />
    </ScrollContent>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={profileStyles.metricBox}>
      <Text style={profileStyles.metricValue}>{value}</Text>
      <Text style={profileStyles.metricLabel}>{label}</Text>
    </View>
  );
}

const profileStyles = StyleSheet.create({
  activityAmount: {
    color: colors.primary,
    fontFamily: fontFamilies.bold,
    fontSize: 12,
  },
  activityCopy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  activityDate: {
    color: colors.muted,
    fontFamily: fontFamilies.medium,
    fontSize: 11,
  },
  activityHeaderIcon: {
    alignItems: "center",
    backgroundColor: colors.surfaceWarm,
    borderRadius: 12,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  activityIcon: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  activityItem: {
    alignItems: "center",
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 10,
  },
  activityList: {
    gap: 8,
  },
  activityMeta: {
    alignItems: "flex-end",
    gap: 4,
  },
  activityTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  addressActions: {
    flexDirection: "row",
    gap: 6,
  },
  addressCard: {
    alignItems: "flex-start",
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    padding: 10,
  },
  addressCardActive: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.primary,
  },
  addressCopy: {
    flex: 1,
    gap: 5,
    minWidth: 0,
  },
  addressSelect: {
    alignItems: "flex-start",
    flex: 1,
    flexDirection: "row",
    gap: 10,
  },
  addressText: {
    color: colors.muted,
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  addressTitle: {
    color: colors.foreground,
    flex: 1,
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
  },
  addressTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: colors.foreground,
    borderRadius: 18,
    height: 58,
    justifyContent: "center",
    width: 58,
  },
  avatarText: {
    color: colors.onPrimary,
    fontFamily: fontFamilies.bold,
    fontSize: 16,
  },
  company: {
    color: colors.foreground,
    fontFamily: fontFamilies.medium,
    fontSize: 13,
  },
  defaultBadge: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    color: colors.onPrimary,
    fontFamily: fontFamilies.semiBold,
    fontSize: 10,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  deleteButton: {
    alignItems: "center",
    backgroundColor: colors.status.danger.background,
    borderRadius: 11,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  editButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 11,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  email: {
    color: colors.muted,
    fontFamily: fontFamilies.regular,
    fontSize: 12,
  },
  emptyAddress: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 12,
  },
  emptyText: {
    color: colors.muted,
    flex: 1,
    fontFamily: fontFamilies.medium,
    fontSize: 13,
  },
  formCard: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 10,
  },
  heroCard: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 13,
    padding: 14,
    shadowColor: colors.foreground,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
  },
  heroCopy: {
    flex: 1,
    gap: 3,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  metricBox: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 13,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    padding: 11,
  },
  metricLabel: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 10,
    textTransform: "uppercase",
  },
  metricValue: {
    color: colors.foreground,
    fontFamily: fontFamilies.bold,
    fontSize: 16,
    textTransform: "capitalize",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 8,
  },
  name: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 18,
    lineHeight: 23,
  },
  panel: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  panelEyebrow: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 10,
    textTransform: "uppercase",
  },
  panelHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  panelTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 15,
  },
  radio: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 22,
    justifyContent: "center",
    marginTop: 1,
    width: 22,
  },
  radioActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sessionCard: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    padding: 12,
  },
  sessionCopy: {
    flex: 1,
    gap: 3,
  },
  sessionText: {
    color: colors.muted,
    fontFamily: fontFamilies.regular,
    fontSize: 12,
  },
  tabButton: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 13,
    flex: 1,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 8,
  },
  tabButtonActive: {
    backgroundColor: colors.foreground,
  },
  tabs: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    padding: 4,
  },
  tabText: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 11,
  },
  tabTextActive: {
    color: colors.onPrimary,
  },
});
