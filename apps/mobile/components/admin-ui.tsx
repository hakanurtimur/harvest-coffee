import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card, colors } from "./ui";

export function AdminMetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </Card>
  );
}

export function AdminPanel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <Card>
      <Text style={styles.panelTitle}>{title}</Text>
      {children}
    </Card>
  );
}

export function ProgressRow({
  label,
  sublabel,
  value,
  width,
}: {
  label: string;
  sublabel?: string;
  value: string;
  width: number;
}) {
  return (
    <View style={styles.progressRow}>
      <View style={styles.rowBetween}>
        <View style={styles.flex}>
          <Text style={styles.rowTitle}>{label}</Text>
          {sublabel ? <Text style={styles.rowSub}>{sublabel}</Text> : null}
        </View>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.max(6, Math.min(width, 100))}%` }]} />
      </View>
    </View>
  );
}

export function OptionChip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderColor: "#d9c7b5",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
  },
  chipTextActive: {
    color: "#fff",
  },
  flex: {
    flex: 1,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  metricValue: {
    color: colors.foreground,
    fontSize: 26,
    fontWeight: "900",
    marginTop: 4,
  },
  panelTitle: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.74,
    transform: [{ scale: 0.98 }],
  },
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: "100%",
  },
  progressRow: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 8,
    paddingTop: 11,
  },
  progressTrack: {
    backgroundColor: "#eadccb",
    borderRadius: 999,
    height: 7,
    overflow: "hidden",
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  rowSub: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  rowTitle: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: "900",
  },
  rowValue: {
    color: colors.primary,
    fontWeight: "900",
  },
});
