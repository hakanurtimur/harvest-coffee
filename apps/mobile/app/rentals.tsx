import { Feather } from "@expo/vector-icons";
import { Rental, RentalStatus } from "@harvest/domain";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, EmptyState, fontFamilies, formatDate, PrimaryButton, ScrollContent, SectionTitle, StatusBanner, styles } from "../components/ui";
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

const statusIcon: Record<RentalStatus, keyof typeof Feather.glyphMap> = {
  active: "check-circle",
  cancelled: "x-circle",
  expired: "alert-triangle",
  upcoming: "clock",
};

const statusTone: Record<RentalStatus, { background: string; color: string }> = {
  active: colors.status.success,
  cancelled: colors.status.neutral,
  expired: colors.status.danger,
  upcoming: colors.status.info,
};

export default function RentalsScreen() {
  const { rentals } = useMobileState();
  const { created } = useLocalSearchParams<{ created?: string }>();
  const [filter, setFilter] = useState<RentalFilter>("all");

  const filteredRentals = useMemo(
    () => filter === "all" ? rentals : rentals.filter((rental) => rental.status === filter),
    [filter, rentals],
  );
  const activeRentals = rentals.filter((rental) => rental.status === "active").length;
  const upcomingRentals = rentals.filter((rental) => rental.status === "upcoming").length;

  return (
    <ScrollContent>
      <SectionTitle eyebrow="Equipment" title="Rental history" />
      {created === "1" ? (
        <StatusBanner body="The rental request has been created." title="Rental created" tone="success" />
      ) : null}
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/create-rental")}
        style={({ pressed }) => [rentalStyles.createCard, pressed && styles.pressed]}
      >
        <View style={rentalStyles.createIcon}>
          <Feather color={colors.foreground} name="plus" size={19} />
        </View>
        <View style={rentalStyles.createCopy}>
          <Text style={rentalStyles.createTitle}>Start rental request</Text>
          <Text style={rentalStyles.createBody}>Request eligible machine products</Text>
        </View>
        <Feather color={colors.muted} name="chevron-right" size={20} />
      </Pressable>

      <View style={rentalStyles.summaryRow}>
        <View style={rentalStyles.summaryItem}>
          <Text style={rentalStyles.summaryValue}>{rentals.length}</Text>
          <Text style={rentalStyles.summaryLabel}>Total</Text>
        </View>
        <View style={rentalStyles.summaryDivider} />
        <View style={rentalStyles.summaryItem}>
          <Text style={rentalStyles.summaryValue}>{activeRentals}</Text>
          <Text style={rentalStyles.summaryLabel}>Active</Text>
        </View>
        <View style={rentalStyles.summaryDivider} />
        <View style={rentalStyles.summaryItem}>
          <Text style={rentalStyles.summaryValue}>{upcomingRentals}</Text>
          <Text style={rentalStyles.summaryLabel}>Upcoming</Text>
        </View>
      </View>

      <View style={rentalStyles.filters}>
        {filters.map((item) => {
          const active = filter === item.value;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              key={item.value}
              onPress={() => setFilter(item.value)}
              style={({ pressed }) => [rentalStyles.filterChip, active && rentalStyles.filterChipActive, pressed && styles.pressed]}
            >
              <Text style={[rentalStyles.filterText, active && rentalStyles.filterTextActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {rentals.length === 0 ? (
        <View style={rentalStyles.emptyCard}>
          <EmptyState title="No rentals yet" body="Create a rental request for eligible machine products." />
          <PrimaryButton label="Create first rental" onPress={() => router.push("/create-rental")} />
        </View>
      ) : filteredRentals.length === 0 ? (
        <EmptyState title="No matching rentals" body="Try another rental status filter." />
      ) : (
        filteredRentals.map((rental) => <DealerRentalCard key={rental.id} rental={rental} />)
      )}
    </ScrollContent>
  );
}

function DealerRentalCard({ rental }: { rental: Rental }) {
  const tone = statusTone[rental.status];
  const duration = getRentalDuration(rental.startDate, rental.endDate);

  return (
    <View style={rentalStyles.rentalCard}>
      <View style={rentalStyles.rentalHeader}>
        <View style={[rentalStyles.statusIcon, { backgroundColor: tone.background }]}>
          <Feather color={tone.color} name={statusIcon[rental.status]} size={18} />
        </View>
        <View style={rentalStyles.rentalTitleBlock}>
          <Text style={rentalStyles.rentalTitle} numberOfLines={2}>{rental.productName}</Text>
          <Text style={rentalStyles.rentalMeta}>{duration} day rental</Text>
        </View>
        <View style={[rentalStyles.statusBadge, { backgroundColor: tone.background }]}>
          <Text style={[rentalStyles.statusText, { color: tone.color }]}>{rentalStatusLabels[rental.status]}</Text>
        </View>
      </View>

      <View style={rentalStyles.dateGrid}>
        <View style={rentalStyles.dateItem}>
          <Text style={rentalStyles.dateLabel}>Start</Text>
          <Text style={rentalStyles.dateValue}>{formatDate(rental.startDate)}</Text>
        </View>
        <View style={rentalStyles.dateDivider} />
        <View style={rentalStyles.dateItem}>
          <Text style={rentalStyles.dateLabel}>End</Text>
          <Text style={rentalStyles.dateValue}>{formatDate(rental.endDate)}</Text>
        </View>
      </View>

      {rental.notes ? (
        <View style={rentalStyles.notesBox}>
          <Feather color={colors.primary} name="file-text" size={14} />
          <Text style={rentalStyles.notesText}>{rental.notes}</Text>
        </View>
      ) : null}
    </View>
  );
}

function getRentalDuration(startDate: string, endDate: string) {
  const start = Date.parse(startDate);
  const end = Date.parse(endDate);
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.max(1, Math.round((end - start) / 86400000) + 1);
}

const rentalStyles = StyleSheet.create({
  createBody: {
    color: colors.muted,
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  createCard: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 12,
  },
  createCopy: {
    flex: 1,
    gap: 2,
  },
  createIcon: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  createTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
  },
  dateDivider: {
    backgroundColor: colors.border,
    width: 1,
  },
  dateGrid: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 12,
  },
  dateItem: {
    flex: 1,
    gap: 3,
  },
  dateLabel: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 10,
    textTransform: "uppercase",
  },
  dateValue: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
  },
  emptyCard: {
    gap: 12,
  },
  filterChip: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: colors.foreground,
    borderColor: colors.foreground,
  },
  filterText: {
    color: colors.foreground,
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
  notesBox: {
    alignItems: "flex-start",
    backgroundColor: colors.surfaceSoft,
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    padding: 10,
  },
  notesText: {
    color: colors.foreground,
    flex: 1,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  rentalCard: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    padding: 12,
    shadowColor: colors.foreground,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
  },
  rentalHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
  },
  rentalMeta: {
    color: colors.muted,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
  },
  rentalTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 15,
    lineHeight: 20,
  },
  rentalTitleBlock: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  statusIcon: {
    alignItems: "center",
    borderRadius: 12,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  statusText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 11,
  },
  summaryDivider: {
    backgroundColor: colors.border,
    height: 30,
    width: 1,
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
    gap: 2,
  },
  summaryLabel: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 10,
    textTransform: "uppercase",
  },
  summaryRow: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    padding: 12,
  },
  summaryValue: {
    color: colors.foreground,
    fontFamily: fontFamilies.bold,
    fontSize: 16,
  },
});
