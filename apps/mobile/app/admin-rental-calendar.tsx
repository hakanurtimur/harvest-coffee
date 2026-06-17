import { Rental } from "@harvest/domain";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AdminShell } from "../components/admin-shell";
import { AdminMetricCard } from "../components/admin-ui";
import { Badge, Card, ScrollContent, SectionTitle, styles } from "../components/ui";
import { formatDateKey } from "../lib/admin-analytics";
import { useMobileState } from "../lib/mobile-state";

export default function AdminRentalCalendarScreen() {
  const { rentals } = useMobileState();
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const totalActiveRentals = rentals.filter((rental) => rental.status === "active").length;
  const totalUpcomingRentals = rentals.filter((rental) => rental.status === "upcoming").length;
  const expiringThisMonth = rentals.filter((rental) => {
    const endDate = new Date(rental.endDate);
    return rental.status === "active" && endDate >= monthStart && endDate <= monthEnd;
  }).length;
  const calendarDays = getCalendarDays(currentMonth);

  const navigateMonth = (direction: number) => {
    setCurrentMonth((month) => new Date(month.getFullYear(), month.getMonth() + direction, 1));
  };

  return (
    <AdminShell title="Calendar">
      <ScrollContent>
        <SectionTitle eyebrow="Admin" title="Rental calendar" />
        <View style={calendarStyles.controls}>
          <Pressable accessibilityRole="button" onPress={() => navigateMonth(-1)} style={({ pressed }) => [styles.outlineButton, calendarStyles.control, pressed && styles.pressed]}>
            <Text style={styles.outlineButtonText}>Prev</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => setCurrentMonth(new Date())} style={({ pressed }) => [styles.primaryButton, calendarStyles.control, pressed && styles.pressed]}>
            <Text style={styles.primaryButtonText}>Today</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => navigateMonth(1)} style={({ pressed }) => [styles.outlineButton, calendarStyles.control, pressed && styles.pressed]}>
            <Text style={styles.outlineButtonText}>Next</Text>
          </Pressable>
        </View>
        <View style={calendarStyles.grid}>
          <AdminMetricCard label="Active rentals" value={String(totalActiveRentals)} />
          <AdminMetricCard label="Upcoming" value={String(totalUpcomingRentals)} />
          <AdminMetricCard label="Expiring this month" value={String(expiringThisMonth)} />
          <AdminMetricCard label="Total rentals" value={String(rentals.length)} />
        </View>

        <Card>
          <Text style={styles.cardTitle}>{new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(currentMonth)}</Text>
          {calendarDays.map((day) => {
            const dateKey = formatDateKey(day);
            const activeRentals = getActiveRentalsForDay(rentals, dateKey);
            const upcomingRentals = rentals.filter((rental) => rental.startDate === dateKey && rental.status === "upcoming");
            const expiringRentals = rentals.filter((rental) => rental.endDate === dateKey && rental.status === "active");
            const hasEvents = activeRentals.length || upcomingRentals.length || expiringRentals.length;
            if (!hasEvents && day.getDate() !== 1) return null;

            return (
              <View key={dateKey} style={calendarStyles.dayRow}>
                <View style={calendarStyles.dayBadge}>
                  <Text style={calendarStyles.dayText}>{day.getDate()}</Text>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.name}>{dateKey}</Text>
                  <View style={styles.badgeRow}>
                    {activeRentals.slice(0, 3).map((rental) => <RentalEvent key={`active-${rental.id}`} rental={rental} type="Active" />)}
                    {upcomingRentals.map((rental) => <RentalEvent key={`upcoming-${rental.id}`} rental={rental} type="Start" />)}
                    {expiringRentals.map((rental) => <RentalEvent key={`expiring-${rental.id}`} rental={rental} type="End" />)}
                    {activeRentals.length > 3 ? <Badge label={`+${activeRentals.length - 3} more`} /> : null}
                  </View>
                </View>
              </View>
            );
          })}
        </Card>
      </ScrollContent>
    </AdminShell>
  );
}

function RentalEvent({ rental, type }: { rental: Rental; type: "Active" | "End" | "Start" }) {
  return <Badge label={`${type}: ${rental.productName.split(" ").slice(0, 2).join(" ")}`} />;
}

function getCalendarDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const days: Date[] = [];
  for (const day = new Date(first); day <= last; day.setDate(day.getDate() + 1)) {
    days.push(new Date(day));
  }
  return days;
}

function getActiveRentalsForDay(rentals: Rental[], dateKey: string) {
  return rentals.filter((rental) => dateKey >= rental.startDate && dateKey <= rental.endDate && rental.status === "active");
}

const calendarStyles = StyleSheet.create({
  control: {
    flex: 1,
  },
  controls: {
    flexDirection: "row",
    gap: 8,
  },
  dayBadge: {
    alignItems: "center",
    backgroundColor: "#f3e8da",
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  dayRow: {
    alignItems: "flex-start",
    borderTopColor: "#eadccb",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 11,
    paddingTop: 11,
  },
  dayText: {
    color: "#6a3814",
    fontWeight: "900",
  },
  grid: {
    gap: 10,
  },
});
