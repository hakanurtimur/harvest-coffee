import { Feather } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Product } from "@harvest/domain";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fallbackImage, Field, fontFamilies, formatCurrency, PrimaryButton, ScrollContent, SectionTitle, StatusBanner, styles } from "../components/ui";
import { useMobileState } from "../lib/mobile-state";
import { addDays, formatDateInput, validateRentalDates } from "../lib/validation";

const durationPresets = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 60, label: "60 days" },
  { days: 90, label: "90 days" },
];

type DateTarget = "end" | "start";
type PeriodOption = "custom" | number;
type RentalMessage = { body?: string; title: string; tone: "error" };

const DEFAULT_PERIOD_DAYS = 30;

export default function CreateRentalScreen() {
  const { createRental, currentUser, products } = useMobileState();
  const rentalProducts = useMemo(
    () => products.filter((product) => product.category.toLowerCase().includes("machine") || product.weight?.toLowerCase().includes("rental")),
    [products],
  );
  const productOptions = rentalProducts.length ? rentalProducts : products;
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(productOptions[0] ?? null);
  const [startDate, setStartDate] = useState(() => formatDateInput(new Date()));
  const [endDate, setEndDate] = useState(() => formatDateInput(addDays(new Date(), DEFAULT_PERIOD_DAYS)));
  const [notes, setNotes] = useState("");
  const [period, setPeriod] = useState<PeriodOption>(DEFAULT_PERIOD_DAYS);
  const [pickerTarget, setPickerTarget] = useState<DateTarget | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<RentalMessage | null>(null);

  useEffect(() => {
    if (!selectedProduct && productOptions.length > 0) setSelectedProduct(productOptions[0]);
  }, [productOptions, selectedProduct]);

  const duration = getDurationDays(startDate, endDate);
  const dateError = getDateError(startDate, endDate);
  const periodLabel = getPeriodLabel(period, duration);

  const applyDuration = (days: number) => {
    const start = parseDateInput(startDate) ?? new Date();
    setRentalPeriod(start, addDays(start, days), days);
  };

  const shiftStartDate = (days: number) => {
    const currentStart = parseDateInput(startDate) ?? new Date();
    const currentDuration = getPeriodDays(period, startDate, endDate);
    const nextStart = addDays(currentStart, days);
    setRentalPeriod(nextStart, addDays(nextStart, currentDuration), period);
  };

  const shiftEndDate = (days: number) => {
    const start = parseDateInput(startDate) ?? new Date();
    const currentEnd = parseDateInput(endDate) ?? addDays(start, DEFAULT_PERIOD_DAYS);
    setRentalPeriod(start, addDays(currentEnd, days), "custom");
  };

  const handlePickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === "dismissed") {
      setPickerTarget(null);
      return;
    }

    if (!selectedDate || !pickerTarget) return;

    if (pickerTarget === "start") {
      const currentDuration = getPeriodDays(period, startDate, endDate);
      setRentalPeriod(selectedDate, addDays(selectedDate, currentDuration), period);
    } else {
      setRentalPeriod(parseDateInput(startDate) ?? new Date(), selectedDate, "custom");
    }

    if (Platform.OS !== "ios") setPickerTarget(null);
  };

  const submit = async () => {
    if (!currentUser || !selectedProduct || saving) return;
    setMessage(null);
    const dates = validateRentalDates(startDate, endDate);
    if (!dates.ok) {
      setMessage({ body: dates.message, title: dates.title, tone: "error" });
      return;
    }

    setSaving(true);
    try {
      await createRental({
        customerEmail: currentUser.email,
        customerName: currentUser.companyName || currentUser.fullName,
        endDate: dates.value.endDate,
        notes: notes.trim() || undefined,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        startDate: dates.value.startDate,
      });
      router.replace("/rentals");
    } catch {
      // Global feedback handles API failures.
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollContent>
      <SectionTitle eyebrow="Rental request" title="Create rental" />
      {message ? <StatusBanner body={message.body} title={message.title} tone={message.tone} /> : null}

      <View style={rentalStyles.panel}>
        <View style={rentalStyles.panelHeader}>
          <View>
            <Text style={rentalStyles.panelEyebrow}>Step 1</Text>
            <Text style={rentalStyles.panelTitle}>Choose equipment</Text>
          </View>
          <View style={rentalStyles.panelIcon}>
            <Feather color={colors.foreground} name="coffee" size={18} />
          </View>
        </View>

        <View style={rentalStyles.productList}>
          {productOptions.map((product) => {
            const active = selectedProduct?.id === product.id;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                key={product.id}
                onPress={() => setSelectedProduct(product)}
                style={({ pressed }) => [rentalStyles.productOption, active && rentalStyles.productOptionActive, pressed && styles.pressed]}
              >
                <Image accessibilityLabel={product.name} source={{ uri: product.imageUrl || fallbackImage }} style={rentalStyles.productImage} />
                <View style={rentalStyles.productCopy}>
                  <Text style={[rentalStyles.productName, active && rentalStyles.activeText]} numberOfLines={2}>{product.name}</Text>
                  <Text style={[rentalStyles.productMeta, active && rentalStyles.activeMuted]}>{product.weight || product.category}</Text>
                </View>
                <View style={[rentalStyles.radio, active && rentalStyles.radioActive]}>
                  {active ? <Feather color={colors.onPrimary} name="check" size={13} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={rentalStyles.panel}>
        <View style={rentalStyles.panelHeader}>
          <View>
            <Text style={rentalStyles.panelEyebrow}>Step 2</Text>
            <Text style={rentalStyles.panelTitle}>Rental dates</Text>
          </View>
          <View style={rentalStyles.panelIcon}>
            <Feather color={colors.foreground} name="calendar" size={18} />
          </View>
        </View>

        <View style={rentalStyles.durationPresets}>
          {durationPresets.map((preset) => {
            const active = period === preset.days;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                key={preset.days}
                onPress={() => applyDuration(preset.days)}
                style={({ pressed }) => [rentalStyles.durationChip, active && rentalStyles.durationChipActive, pressed && styles.pressed]}
              >
                <Text style={[rentalStyles.durationChipText, active && rentalStyles.durationChipTextActive]}>{preset.label}</Text>
              </Pressable>
            );
          })}
          <View style={[rentalStyles.durationChip, rentalStyles.durationChipMuted, period === "custom" && rentalStyles.durationChipActive]}>
            <Text style={[rentalStyles.durationChipText, period === "custom" && rentalStyles.durationChipTextActive]}>Custom</Text>
          </View>
        </View>

        <DateControl label="Start date" onOpen={() => setPickerTarget("start")} onShift={shiftStartDate} value={startDate} />
        <DateControl label="End date" onOpen={() => setPickerTarget("end")} onShift={shiftEndDate} value={endDate} />

        {pickerTarget ? (
          <View style={rentalStyles.pickerPanel}>
            <View style={rentalStyles.pickerHeader}>
              <Text style={rentalStyles.pickerTitle}>{pickerTarget === "start" ? "Select start date" : "Select end date"}</Text>
              {Platform.OS === "ios" ? (
                <Pressable accessibilityRole="button" onPress={() => setPickerTarget(null)} style={({ pressed }) => [rentalStyles.doneButton, pressed && styles.pressed]}>
                  <Text style={rentalStyles.doneText}>Done</Text>
                </Pressable>
              ) : null}
            </View>
            <DateTimePicker
              accentColor={colors.primary}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              mode="date"
              onChange={handlePickerChange}
              style={Platform.OS === "ios" ? rentalStyles.iosPicker : undefined}
              textColor={colors.foreground}
              themeVariant="light"
              value={parseDateInput(pickerTarget === "start" ? startDate : endDate) ?? new Date()}
            />
          </View>
        ) : null}

        {dateError ? (
          <View style={rentalStyles.errorBox}>
            <Feather color={colors.status.danger.color} name="alert-circle" size={15} />
            <Text style={rentalStyles.errorText}>{dateError}</Text>
          </View>
        ) : null}

        <Field multiline onChangeText={setNotes} placeholder="Notes or special requirements" value={notes} />
      </View>

      <View style={rentalStyles.summaryCard}>
        <View style={rentalStyles.summaryHeader}>
          <View style={rentalStyles.summaryIcon}>
            <Feather color={colors.primary} name="file-text" size={18} />
          </View>
          <View style={styles.flex}>
            <Text style={rentalStyles.summaryTitle}>Rental summary</Text>
            <Text style={rentalStyles.summaryBody}>Review before creating the request</Text>
          </View>
        </View>
        <SummaryLine label="Product" value={selectedProduct?.name || "Not selected"} />
        <SummaryLine label="Start" value={startDate || "Not selected"} />
        <SummaryLine label="End" value={endDate || "Not selected"} />
        <SummaryLine label="Period" value={periodLabel} />
        <SummaryLine label="Duration" value={duration > 0 && !dateError ? `${duration} days` : "Waiting for dates"} />
        <SummaryLine label="Monthly rate" value={selectedProduct ? formatCurrency(selectedProduct.price).replace("GBP ", "£") : "Not selected"} />
        <PrimaryButton disabled={saving || !selectedProduct || Boolean(dateError)} label={saving ? "Creating rental..." : "Create rental agreement"} onPress={submit} />
      </View>
    </ScrollContent>
  );

  function setRentalPeriod(nextStart: Date, nextEnd: Date, nextPeriod: PeriodOption) {
    const normalized = normalizePeriod(nextStart, nextEnd);
    const normalizedDuration = getDurationBetween(normalized.start, normalized.end);
    setStartDate(formatDateInput(normalized.start));
    setEndDate(formatDateInput(normalized.end));
    setPeriod(nextPeriod === "custom" ? matchPreset(normalizedDuration) ?? "custom" : nextPeriod);
  }
}

function DateControl({
  label,
  onOpen,
  onShift,
  value,
}: {
  label: string;
  onOpen: () => void;
  onShift: (days: number) => void;
  value: string;
}) {
  return (
    <View style={rentalStyles.dateControl}>
      <Text style={rentalStyles.dateLabel}>{label}</Text>
      <View style={rentalStyles.dateRow}>
        <Pressable accessibilityRole="button" onPress={() => onShift(-1)} style={({ pressed }) => [rentalStyles.dateStep, pressed && styles.pressed]}>
          <Feather color={colors.foreground} name="minus" size={15} />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onOpen} style={({ pressed }) => [rentalStyles.datePickerButton, pressed && styles.pressed]}>
          <Feather color={colors.primary} name="calendar" size={15} />
          <View style={styles.flex}>
            <Text style={rentalStyles.datePickerValue}>{formatReadableDate(value)}</Text>
            <Text style={rentalStyles.datePickerRaw}>{value}</Text>
          </View>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => onShift(1)} style={({ pressed }) => [rentalStyles.dateStep, pressed && styles.pressed]}>
          <Feather color={colors.foreground} name="plus" size={15} />
        </Pressable>
      </View>
    </View>
  );
}

function formatReadableDate(value: string) {
  const date = parseDateInput(value);
  if (!date) return "Select date";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={rentalStyles.summaryLine}>
      <Text style={rentalStyles.summaryLabel}>{label}</Text>
      <Text style={rentalStyles.summaryValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

function getDurationDays(startDate: string, endDate: string) {
  const start = parseDateInput(startDate);
  const end = parseDateInput(endDate);
  if (!start || !end || end.getTime() < start.getTime()) return 0;
  return getDurationBetween(start, end);
}

function getDateError(startDate: string, endDate: string) {
  const dates = validateRentalDates(startDate, endDate);
  return dates.ok ? "" : dates.message;
}

function parseDateInput(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return formatDateInput(date) === value ? date : null;
}

function getDurationBetween(start: Date, end: Date) {
  return Math.max(1, Math.round((stripTime(end).getTime() - stripTime(start).getTime()) / 86400000));
}

function getPeriodDays(period: PeriodOption, startDate: string, endDate: string) {
  if (typeof period === "number") return period;
  return Math.max(1, getDurationDays(startDate, endDate) || DEFAULT_PERIOD_DAYS);
}

function getPeriodLabel(period: PeriodOption, duration: number) {
  if (typeof period === "number") {
    const preset = durationPresets.find((item) => item.days === period);
    return preset?.label ?? `${period} days`;
  }

  return duration > 0 ? `Custom (${duration} days)` : "Custom";
}

function matchPreset(duration: number) {
  return durationPresets.find((preset) => preset.days === duration)?.days;
}

function normalizePeriod(start: Date, end: Date) {
  const normalizedStart = stripTime(start);
  const normalizedEnd = stripTime(end);
  if (normalizedEnd.getTime() < normalizedStart.getTime()) {
    return { end: normalizedStart, start: normalizedStart };
  }

  return { end: normalizedEnd, start: normalizedStart };
}

function stripTime(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

const rentalStyles = StyleSheet.create({
  activeMuted: {
    color: colors.surfaceWarm,
  },
  activeText: {
    color: colors.onPrimary,
  },
  dateControl: {
    gap: 7,
  },
  dateLabel: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 11,
    textTransform: "uppercase",
  },
  datePickerButton: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 9,
    minHeight: 54,
    paddingHorizontal: 12,
  },
  datePickerRaw: {
    color: colors.muted,
    fontFamily: fontFamilies.medium,
    fontSize: 11,
    marginTop: 1,
  },
  datePickerValue: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
  },
  dateRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  dateStep: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  durationChip: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  durationChipActive: {
    backgroundColor: colors.foreground,
    borderColor: colors.foreground,
  },
  durationChipMuted: {
    opacity: 0.68,
  },
  durationChipText: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
  },
  durationChipTextActive: {
    color: colors.onPrimary,
  },
  durationPresets: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  errorBox: {
    alignItems: "center",
    backgroundColor: colors.status.danger.background,
    borderColor: colors.status.danger.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    padding: 10,
  },
  errorText: {
    color: colors.status.danger.color,
    flex: 1,
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
    lineHeight: 17,
  },
  iosPicker: {
    height: 180,
  },
  doneButton: {
    backgroundColor: colors.foreground,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  doneText: {
    color: colors.onPrimary,
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
  },
  panel: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
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
  panelIcon: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  panelTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 17,
    marginTop: 2,
  },
  pickerHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  pickerPanel: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    overflow: "hidden",
    padding: 10,
  },
  pickerTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
  },
  productCopy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  productImage: {
    backgroundColor: colors.border,
    borderRadius: 11,
    height: 56,
    width: 56,
  },
  productList: {
    gap: 8,
  },
  productMeta: {
    color: colors.muted,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
  },
  productName: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
    lineHeight: 19,
  },
  productOption: {
    alignItems: "center",
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 10,
  },
  productOptionActive: {
    backgroundColor: colors.foreground,
    borderColor: colors.foreground,
  },
  radio: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  radioActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  summaryBody: {
    color: colors.muted,
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  summaryCard: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    padding: 12,
  },
  summaryHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  summaryIcon: {
    alignItems: "center",
    backgroundColor: colors.surfaceSoft,
    borderRadius: 12,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  summaryLabel: {
    color: colors.muted,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
  },
  summaryLine: {
    alignItems: "flex-start",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingTop: 10,
  },
  summaryTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 15,
  },
  summaryValue: {
    color: colors.foreground,
    flex: 1,
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
    textAlign: "right",
  },
});
