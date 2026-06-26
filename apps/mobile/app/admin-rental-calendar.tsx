import { Feather } from "@expo/vector-icons";
import { Rental, RentalStatus } from "@harvest/domain";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, EmptyState, fontFamilies, formatDate, ScrollContent, SectionTitle, styles } from "../components/ui";
import { formatDateKey } from "../lib/admin-analytics";
import { useMobileState } from "../lib/mobile-state";

type CalendarMode = "agenda" | "month";
type RentalEventType = "active" | "ending" | "starting";
type DayEvents = {
  active: Rental[];
  ending: Rental[];
  starting: Rental[];
};
type AgendaEvent = {
  dateKey: string;
  rental: Rental;
  type: RentalEventType;
};

const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

const eventConfig: Record<RentalEventType, { icon: keyof typeof Feather.glyphMap; label: string; tone: typeof colors.status.success }> = {
  active: { icon: "check-circle", label: "Active", tone: colors.status.success },
  ending: { icon: "alert-triangle", label: "Ending", tone: colors.status.warning },
  starting: { icon: "play-circle", label: "Starting", tone: colors.status.info },
};

const rentalStatusConfig: Record<RentalStatus, { label: string; tone: typeof colors.status.success }> = {
  active: { label: "Active", tone: colors.status.success },
  cancelled: { label: "Cancelled", tone: colors.status.danger },
  expired: { label: "Expired", tone: colors.status.neutral },
  upcoming: { label: "Upcoming", tone: colors.status.info },
};

export default function AdminRentalCalendarScreen() {
  const { rentals } = useMobileState();
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [mode, setMode] = useState<CalendarMode>("month");
  const [selectedDateKey, setSelectedDateKey] = useState(() => formatDateKey(new Date()));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const monthStartKey = formatDateKey(monthStart);
  const monthEndKey = formatDateKey(monthEnd);
  const calendarDays = useMemo(() => getCalendarDays(currentMonth), [currentMonth]);

  const rentalStats = useMemo(() => {
    const activeRentals = rentals.filter((rental) => rental.status === "active");
    const upcomingRentals = rentals.filter((rental) => rental.status === "upcoming");
    const expiringThisMonth = rentals.filter((rental) => {
      const endDateKey = toDateKey(rental.endDate);
      return rental.status === "active" && endDateKey >= monthStartKey && endDateKey <= monthEndKey;
    });

    return {
      activeRentals,
      expiringThisMonth,
      upcomingRentals,
    };
  }, [monthEndKey, monthStartKey, rentals]);

  const selectedEvents = useMemo(() => getDayEvents(rentals, selectedDateKey), [rentals, selectedDateKey]);
  const agendaEvents = useMemo(() => getMonthAgendaEvents(rentals, currentMonth), [currentMonth, rentals]);
  const agendaGroups = useMemo(() => groupAgendaEvents(agendaEvents), [agendaEvents]);

  const navigateMonth = (direction: number) => {
    setCurrentMonth((month) => {
      const nextMonth = startOfMonth(new Date(month.getFullYear(), month.getMonth() + direction, 1));
      const selectedDate = parseDateKey(selectedDateKey);
      const selectedStillVisible = selectedDate.getFullYear() === nextMonth.getFullYear() && selectedDate.getMonth() === nextMonth.getMonth();
      if (!selectedStillVisible) setSelectedDateKey(formatDateKey(nextMonth));
      return nextMonth;
    });
  };

  const goToday = () => {
    const today = new Date();
    setCurrentMonth(startOfMonth(today));
    setSelectedDateKey(formatDateKey(today));
  };

  return (
    <ScrollContent>
      <SectionTitle eyebrow="Admin" title="Rental calendar" />

      <View style={calendarStyles.monthCard}>
        <View style={calendarStyles.monthHeader}>
          <Pressable accessibilityLabel="Previous month" accessibilityRole="button" onPress={() => navigateMonth(-1)} style={({ pressed }) => [calendarStyles.iconButton, pressed && styles.pressed]}>
            <Feather color={colors.foreground} name="chevron-left" size={20} />
          </Pressable>
          <View style={calendarStyles.monthTitleBlock}>
            <Text style={calendarStyles.monthTitle}>{formatMonth(currentMonth)}</Text>
            <Text style={calendarStyles.monthSubtitle}>{formatDate(selectedDateKey)} selected</Text>
          </View>
          <Pressable accessibilityLabel="Next month" accessibilityRole="button" onPress={() => navigateMonth(1)} style={({ pressed }) => [calendarStyles.iconButton, pressed && styles.pressed]}>
            <Feather color={colors.foreground} name="chevron-right" size={20} />
          </Pressable>
        </View>

        <View style={calendarStyles.monthActions}>
          <Pressable accessibilityRole="button" onPress={goToday} style={({ pressed }) => [calendarStyles.todayButton, pressed && styles.pressed]}>
            <Feather color={colors.primary} name="calendar" size={14} />
            <Text style={calendarStyles.todayText}>Today</Text>
          </Pressable>
          <View style={calendarStyles.modeToggle}>
            {(["month", "agenda"] as CalendarMode[]).map((option) => {
              const active = mode === option;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  key={option}
                  onPress={() => setMode(option)}
                  style={({ pressed }) => [calendarStyles.modeButton, active && calendarStyles.modeButtonActive, pressed && styles.pressed]}
                >
                  <Text style={[calendarStyles.modeText, active && calendarStyles.modeTextActive]}>{option === "month" ? "Month" : "Agenda"}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <View style={calendarStyles.metricsGrid}>
        <CalendarMetric icon="check-circle" label="Active" value={String(rentalStats.activeRentals.length)} />
        <CalendarMetric icon="clock" label="Upcoming" value={String(rentalStats.upcomingRentals.length)} />
        <CalendarMetric icon="alert-triangle" label="Expiring" value={String(rentalStats.expiringThisMonth.length)} />
        <CalendarMetric icon="calendar" label="Total" value={String(rentals.length)} />
      </View>

      {mode === "month" ? (
        <>
          <View style={calendarStyles.calendarCard}>
            <View style={calendarStyles.weekRow}>
              {weekDays.map((day, index) => (
                <Text key={`${day}-${index}`} style={calendarStyles.weekDay}>{day}</Text>
              ))}
            </View>
            <View style={calendarStyles.daysGrid}>
              {calendarDays.map((day) => {
                const dateKey = formatDateKey(day);
                const dayEvents = getDayEvents(rentals, dateKey);
                const isSelected = selectedDateKey === dateKey;
                const isToday = dateKey === formatDateKey(new Date());
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                const eventTotal = dayEvents.active.length + dayEvents.starting.length + dayEvents.ending.length;

                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    key={dateKey}
                    onPress={() => setSelectedDateKey(dateKey)}
                    style={({ pressed }) => [
                      calendarStyles.dayCell,
                      !isCurrentMonth && calendarStyles.dayCellMuted,
                      isSelected && calendarStyles.dayCellSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={[calendarStyles.dayNumberWrap, isToday && calendarStyles.todayNumberWrap, isSelected && calendarStyles.selectedDayNumberWrap]}>
                      <Text style={[calendarStyles.dayNumber, !isCurrentMonth && calendarStyles.dayNumberMuted, (isSelected || isToday) && calendarStyles.dayNumberActive]}>{day.getDate()}</Text>
                    </View>
                    <View style={calendarStyles.dotRow}>
                      {dayEvents.starting.length > 0 ? <View style={[calendarStyles.eventDot, { backgroundColor: eventConfig.starting.tone.color }]} /> : null}
                      {dayEvents.active.length > 0 ? <View style={[calendarStyles.eventDot, { backgroundColor: eventConfig.active.tone.color }]} /> : null}
                      {dayEvents.ending.length > 0 ? <View style={[calendarStyles.eventDot, { backgroundColor: eventConfig.ending.tone.color }]} /> : null}
                    </View>
                    {eventTotal > 3 ? <Text style={calendarStyles.moreCount}>+{eventTotal - 3}</Text> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <DayAgenda dateKey={selectedDateKey} events={selectedEvents} />
        </>
      ) : (
        <MonthAgenda groups={agendaGroups} />
      )}

      <View style={calendarStyles.legendCard}>
        <LegendItem type="starting" />
        <LegendItem type="active" />
        <LegendItem type="ending" />
      </View>
    </ScrollContent>
  );
}

function CalendarMetric({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={calendarStyles.metricCard}>
      <View style={calendarStyles.metricIcon}>
        <Feather color={colors.primary} name={icon} size={16} />
      </View>
      <Text style={calendarStyles.metricLabel}>{label}</Text>
      <Text style={calendarStyles.metricValue}>{value}</Text>
    </View>
  );
}

function DayAgenda({ dateKey, events }: { dateKey: string; events: DayEvents }) {
  const hasEvents = events.active.length || events.starting.length || events.ending.length;

  return (
    <View style={calendarStyles.agendaCard}>
      <View style={calendarStyles.panelHeader}>
        <Text style={calendarStyles.panelEyebrow}>Selected day</Text>
        <Text style={calendarStyles.panelTitle}>{formatDate(dateKey)}</Text>
      </View>

      {!hasEvents ? (
        <EmptyState body="No rentals start, end, or run on this day." title="No rentals on this day" />
      ) : (
        <View style={calendarStyles.eventStack}>
          {events.starting.map((rental) => <RentalEventCard key={`starting-${rental.id}`} rental={rental} type="starting" />)}
          {events.ending.map((rental) => <RentalEventCard key={`ending-${rental.id}`} rental={rental} type="ending" />)}
          {events.active.map((rental) => <RentalEventCard key={`active-${rental.id}`} rental={rental} type="active" />)}
        </View>
      )}
    </View>
  );
}

function MonthAgenda({ groups }: { groups: Array<{ dateKey: string; events: AgendaEvent[] }> }) {
  return (
    <View style={calendarStyles.agendaCard}>
      <View style={calendarStyles.panelHeader}>
        <Text style={calendarStyles.panelEyebrow}>Month agenda</Text>
        <Text style={calendarStyles.panelTitle}>Rental schedule</Text>
      </View>

      {groups.length === 0 ? (
        <EmptyState body="No rental start or end events in this month." title="No agenda events" />
      ) : (
        <View style={calendarStyles.eventStack}>
          {groups.map((group) => (
            <View key={group.dateKey} style={calendarStyles.agendaGroup}>
              <Text style={calendarStyles.agendaDate}>{formatDate(group.dateKey)}</Text>
              <View style={calendarStyles.eventStack}>
                {group.events.map((event) => (
                  <RentalEventCard key={`${event.type}-${event.rental.id}-${group.dateKey}`} rental={event.rental} type={event.type} />
                ))}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function RentalEventCard({ rental, type }: { rental: Rental; type: RentalEventType }) {
  const event = eventConfig[type];
  const status = rentalStatusConfig[rental.status];
  const daysLeft = getDaysUntil(rental.endDate);

  return (
    <View style={calendarStyles.eventCard}>
      <View style={[calendarStyles.eventIcon, { backgroundColor: event.tone.background, borderColor: event.tone.border }]}>
        <Feather color={event.tone.color} name={event.icon} size={15} />
      </View>
      <View style={calendarStyles.eventCopy}>
        <View style={calendarStyles.eventTitleRow}>
          <Text numberOfLines={1} style={calendarStyles.eventTitle}>{rental.productName}</Text>
          <View style={[calendarStyles.statusPill, { backgroundColor: status.tone.background, borderColor: status.tone.border }]}>
            <Text style={[calendarStyles.statusText, { color: status.tone.color }]}>{status.label}</Text>
          </View>
        </View>
        <Text numberOfLines={1} style={calendarStyles.eventMeta}>{rental.customerName || rental.customerEmail}</Text>
        <Text style={calendarStyles.eventDates}>{formatDate(rental.startDate)} - {formatDate(rental.endDate)}</Text>
        <View style={calendarStyles.eventFooter}>
          <Text style={[calendarStyles.eventKind, { color: event.tone.color }]}>{event.label}</Text>
          <Text style={calendarStyles.daysLeft}>{formatDaysLeft(daysLeft)}</Text>
        </View>
      </View>
    </View>
  );
}

function LegendItem({ type }: { type: RentalEventType }) {
  const event = eventConfig[type];
  return (
    <View style={calendarStyles.legendItem}>
      <View style={[calendarStyles.legendDot, { backgroundColor: event.tone.color }]} />
      <Text style={calendarStyles.legendText}>{event.label}</Text>
    </View>
  );
}

function getCalendarDays(month: Date) {
  const first = startOfMonth(month);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  const end = new Date(last);
  end.setDate(last.getDate() + (6 - last.getDay()));

  const days: Date[] = [];
  for (const day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
    days.push(new Date(day));
  }
  return days;
}

function getDayEvents(rentals: Rental[], dateKey: string): DayEvents {
  return {
    active: rentals.filter((rental) => {
      const startKey = toDateKey(rental.startDate);
      const endKey = toDateKey(rental.endDate);
      return dateKey > startKey && dateKey < endKey && rental.status === "active";
    }),
    ending: rentals.filter((rental) => toDateKey(rental.endDate) === dateKey && rental.status === "active"),
    starting: rentals.filter((rental) => toDateKey(rental.startDate) === dateKey && rental.status === "upcoming"),
  };
}

function getMonthAgendaEvents(rentals: Rental[], month: Date): AgendaEvent[] {
  const monthStart = startOfMonth(month);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const monthStartKey = formatDateKey(monthStart);
  const monthEndKey = formatDateKey(monthEnd);

  return rentals.flatMap((rental) => {
    const events: AgendaEvent[] = [];
    const startKey = toDateKey(rental.startDate);
    const endKey = toDateKey(rental.endDate);

    if (rental.status === "upcoming" && startKey >= monthStartKey && startKey <= monthEndKey) {
      events.push({ dateKey: startKey, rental, type: "starting" });
    }
    if (rental.status === "active" && endKey >= monthStartKey && endKey <= monthEndKey) {
      events.push({ dateKey: endKey, rental, type: "ending" });
    }

    return events;
  }).sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}

function groupAgendaEvents(events: AgendaEvent[]) {
  const groups = new Map<string, AgendaEvent[]>();
  events.forEach((event) => {
    const current = groups.get(event.dateKey) ?? [];
    current.push(event);
    groups.set(event.dateKey, current);
  });

  return [...groups.entries()].map(([dateKey, groupEvents]) => ({ dateKey, events: groupEvents }));
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function toDateKey(value?: string) {
  if (!value) return "";
  const trimmed = value.trim();
  const datePart = trimmed.split("T")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart;

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) return formatDateKey(parsed);
  return datePart;
}

function parseDateKey(value: string) {
  const dateKey = toDateKey(value);
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}

function getDaysUntil(dateKey: string) {
  const today = parseDateKey(formatDateKey(new Date()));
  return Math.ceil((parseDateKey(dateKey).getTime() - today.getTime()) / 86400000);
}

function formatDaysLeft(days: number) {
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

const calendarStyles = StyleSheet.create({
  agendaCard: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 15,
    borderWidth: 1,
    gap: 13,
    padding: 12,
  },
  agendaDate: {
    color: colors.primary,
    fontFamily: fontFamilies.bold,
    fontSize: 13,
    lineHeight: 18,
  },
  agendaGroup: {
    gap: 9,
  },
  calendarCard: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 15,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  dayCell: {
    alignItems: "center",
    aspectRatio: 0.78,
    borderColor: colors.border,
    borderRadius: 13,
    borderWidth: 1,
    flexBasis: "13.3%",
    flexGrow: 1,
    gap: 4,
    justifyContent: "center",
    minHeight: 58,
    paddingVertical: 6,
  },
  dayCellMuted: {
    opacity: 0.38,
  },
  dayCellSelected: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.primary,
  },
  dayNumber: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
  },
  dayNumberActive: {
    color: colors.onPrimary,
  },
  dayNumberMuted: {
    color: colors.muted,
  },
  dayNumberWrap: {
    alignItems: "center",
    borderRadius: 999,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  daysLeft: {
    color: colors.muted,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
  },
  dotRow: {
    flexDirection: "row",
    gap: 3,
    minHeight: 5,
  },
  eventCard: {
    alignItems: "flex-start",
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 11,
  },
  eventCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  eventDates: {
    color: colors.muted,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 17,
  },
  eventDot: {
    borderRadius: 999,
    height: 5,
    width: 5,
  },
  eventFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  eventIcon: {
    alignItems: "center",
    borderRadius: 13,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  eventKind: {
    fontFamily: fontFamilies.bold,
    fontSize: 12,
  },
  eventMeta: {
    color: colors.foreground,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 17,
  },
  eventStack: {
    gap: 10,
  },
  eventTitle: {
    color: colors.foreground,
    flex: 1,
    fontFamily: fontFamilies.bold,
    fontSize: 14,
    lineHeight: 19,
  },
  eventTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderRadius: 13,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  legendCard: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    padding: 12,
  },
  legendDot: {
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  legendItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  legendText: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
  },
  metricCard: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexBasis: "48%",
    flexGrow: 1,
    gap: 6,
    minHeight: 106,
    padding: 12,
  },
  metricIcon: {
    alignItems: "center",
    backgroundColor: colors.surfaceSoft,
    borderRadius: 12,
    height: 38,
    justifyContent: "center",
    width: 38,
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
    fontSize: 22,
    lineHeight: 27,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  modeButton: {
    alignItems: "center",
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: 12,
  },
  modeButtonActive: {
    backgroundColor: colors.foreground,
  },
  modeText: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
  },
  modeTextActive: {
    color: colors.onPrimary,
  },
  modeToggle: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    padding: 4,
  },
  monthActions: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  monthCard: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 15,
    borderWidth: 1,
    gap: 13,
    padding: 12,
  },
  monthHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  monthSubtitle: {
    color: colors.muted,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
  },
  monthTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.bold,
    fontSize: 20,
    lineHeight: 25,
    textAlign: "center",
  },
  monthTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  moreCount: {
    color: colors.primary,
    fontFamily: fontFamilies.bold,
    fontSize: 9,
  },
  panelEyebrow: {
    color: colors.primary,
    fontFamily: fontFamilies.semiBold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  panelHeader: {
    gap: 2,
  },
  panelTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.bold,
    fontSize: 19,
    lineHeight: 24,
  },
  selectedDayNumberWrap: {
    backgroundColor: colors.foreground,
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  statusText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 10,
  },
  todayButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    minHeight: 42,
    paddingHorizontal: 13,
  },
  todayNumberWrap: {
    backgroundColor: colors.primary,
  },
  todayText: {
    color: colors.primary,
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
  },
  weekDay: {
    color: colors.muted,
    flex: 1,
    fontFamily: fontFamilies.bold,
    fontSize: 11,
    textAlign: "center",
  },
  weekRow: {
    flexDirection: "row",
    gap: 5,
  },
});
