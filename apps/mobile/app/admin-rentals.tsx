import { Feather } from "@expo/vector-icons";
import { Rental, RentalStatus } from "@harvest/domain";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Badge, Card, colors, ConfirmDialog, EmptyState, fontFamilies, formatDate, ScrollContent, SectionTitle, styles } from "../components/ui";
import { useMobileState } from "../lib/mobile-state";

type RentalFilter = "all" | RentalStatus;

const filters: { label: string; value: RentalFilter }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Expired", value: "expired" },
  { label: "Cancelled", value: "cancelled" },
];

const rentalStatusLabels: Record<RentalStatus, string> = {
  active: "Active",
  cancelled: "Cancelled",
  expired: "Expired",
  upcoming: "Upcoming",
};

export default function AdminRentalsScreen() {
  const { deleteRental, rentals, updateRental } = useMobileState();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Rental | null>(null);
  const [filter, setFilter] = useState<RentalFilter>("all");

  const filteredRentals = useMemo(
    () => filter === "all" ? rentals : rentals.filter((rental) => rental.status === filter),
    [filter, rentals],
  );

  const statusCounts = useMemo(() => ({
    active: rentals.filter((rental) => rental.status === "active").length,
    expired: rentals.filter((rental) => rental.status === "expired").length,
    total: rentals.length,
    upcoming: rentals.filter((rental) => rental.status === "upcoming").length,
  }), [rentals]);

  const setStatus = async (rental: Rental, status: RentalStatus) => {
    if (rental.status === status || busyId === rental.id) return;
    setBusyId(rental.id);
    try {
      await updateRental(rental.id, { status });
    } catch {
      // Global feedback handles API failures.
    } finally {
      setBusyId(null);
    }
  };

  const removeRental = (rental: Rental) => {
    setDeleteCandidate(rental);
  };

  const confirmDeleteRental = async () => {
    if (!deleteCandidate) return;
    setBusyId(deleteCandidate.id);
    try {
      await deleteRental(deleteCandidate.id);
      setDeleteCandidate(null);
    } catch {
      // Global feedback handles API failures.
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ScrollContent>
      <SectionTitle eyebrow="Admin" title="Rental management" />

      <View style={adminRentalStyles.metrics}>
        <Metric label="Total" value={String(statusCounts.total)} />
        <Metric label="Active" value={String(statusCounts.active)} />
        <Metric label="Upcoming" value={String(statusCounts.upcoming)} />
        <Metric label="Expired" value={String(statusCounts.expired)} />
      </View>

      <View style={adminRentalStyles.filters}>
        {filters.map((item) => {
          const active = filter === item.value;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              key={item.value}
              onPress={() => setFilter(item.value)}
              style={({ pressed }) => [adminRentalStyles.filterChip, active && adminRentalStyles.filterChipActive, pressed && styles.pressed]}
            >
              <Text style={[adminRentalStyles.filterText, active && adminRentalStyles.filterTextActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {rentals.length === 0 ? (
        <EmptyState title="No rentals" body="Rental agreements created by dealers will appear here." />
      ) : filteredRentals.length === 0 ? (
        <EmptyState title="No matching rentals" body="Try another rental status filter." />
      ) : (
        filteredRentals.map((rental) => (
          <Card key={rental.id}>
            <View style={styles.rowBetween}>
              <View style={styles.flex}>
                <Text style={styles.cardTitle}>{rental.productName}</Text>
                <Text style={styles.muted}>{rental.customerName || rental.customerEmail}</Text>
              </View>
              <Badge label={rentalStatusLabels[rental.status]} />
            </View>

            <View style={adminRentalStyles.dateRow}>
              <View style={adminRentalStyles.dateCell}>
                <Text style={adminRentalStyles.dateLabel}>Start</Text>
                <Text style={adminRentalStyles.dateValue}>{formatDate(rental.startDate)}</Text>
              </View>
              <View style={adminRentalStyles.dateCell}>
                <Text style={adminRentalStyles.dateLabel}>End</Text>
                <Text style={adminRentalStyles.dateValue}>{formatDate(rental.endDate)}</Text>
              </View>
            </View>

            {rental.notes ? <Text style={styles.description}>{rental.notes}</Text> : null}

            <View style={adminRentalStyles.statusGrid}>
              {(Object.keys(rentalStatusLabels) as RentalStatus[]).map((status) => {
                const active = rental.status === status;
                const disabled = active || busyId === rental.id;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ disabled, selected: active }}
                    disabled={disabled}
                    key={status}
                    onPress={() => setStatus(rental, status)}
                    style={({ pressed }) => [
                      adminRentalStyles.statusChip,
                      active && adminRentalStyles.statusChipActive,
                      pressed && styles.pressed,
                      disabled && !active && styles.disabled,
                    ]}
                  >
                    <Text style={[adminRentalStyles.statusText, active && adminRentalStyles.statusTextActive]}>{rentalStatusLabels[status]}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: busyId === rental.id }}
              disabled={busyId === rental.id}
              onPress={() => removeRental(rental)}
              style={({ pressed }) => [adminRentalStyles.deleteButton, pressed && styles.pressed, busyId === rental.id && styles.disabled]}
            >
              <Feather color={colors.status.danger.color} name="trash-2" size={15} />
              <Text style={adminRentalStyles.deleteText}>{busyId === rental.id ? "Deleting..." : "Delete rental"}</Text>
            </Pressable>
          </Card>
        ))
      )}
      <ConfirmDialog
        body={deleteCandidate ? `${deleteCandidate.productName} will be removed from rental records.` : ""}
        confirmLabel="Delete"
        confirming={Boolean(deleteCandidate && busyId === deleteCandidate.id)}
        destructive
        onCancel={() => {
          if (!(deleteCandidate && busyId === deleteCandidate.id)) setDeleteCandidate(null);
        }}
        onConfirm={() => void confirmDeleteRental()}
        title="Delete rental?"
        visible={Boolean(deleteCandidate)}
      />
    </ScrollContent>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={adminRentalStyles.metricCard}>
      <Text style={adminRentalStyles.metricValue}>{value}</Text>
      <Text style={adminRentalStyles.metricLabel}>{label}</Text>
    </View>
  );
}

const adminRentalStyles = StyleSheet.create({
  dateCell: {
    flex: 1,
    gap: 3,
  },
  dateLabel: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 10,
    textTransform: "uppercase",
  },
  dateRow: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 12,
  },
  dateValue: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
  },
  deleteButton: {
    alignItems: "center",
    borderColor: colors.status.danger.background,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    paddingVertical: 11,
  },
  deleteText: {
    color: colors.status.danger.color,
    fontFamily: fontFamilies.extraBold,
    fontSize: 12,
  },
  filterChip: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  filterChipActive: {
    backgroundColor: colors.foreground,
    borderColor: colors.foreground,
  },
  filterText: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
  },
  filterTextActive: {
    color: colors.onPrimary,
  },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metricCard: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    minWidth: "47%",
    padding: 14,
  },
  metricLabel: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 11,
    textTransform: "uppercase",
  },
  metricValue: {
    color: colors.foreground,
    fontFamily: fontFamilies.extraBold,
    fontSize: 24,
  },
  metrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statusChip: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  statusChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusText: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
  },
  statusTextActive: {
    color: colors.onPrimary,
  },
});
