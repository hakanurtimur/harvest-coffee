import { Feather } from "@expo/vector-icons";
import { Product } from "@harvest/domain";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, EmptyState, Field, fontFamilies, formatCurrency, ScrollContent, SectionTitle, StatusBanner, styles } from "../components/ui";
import { getStockStatus } from "../lib/admin-analytics";
import { useMobileState } from "../lib/mobile-state";

type MessageState = { body?: string; text: string; tone: "error" | "info" | "success" } | null;
type StockFilter = "all" | "healthy" | "low" | "out";
type ViewMode = "cards" | "list";

const filterOptions: Array<{ icon: keyof typeof Feather.glyphMap; label: string; value: StockFilter }> = [
  { icon: "layers", label: "All", value: "all" },
  { icon: "check-circle", label: "Healthy", value: "healthy" },
  { icon: "alert-triangle", label: "Low", value: "low" },
  { icon: "x-circle", label: "Out", value: "out" },
];

const stockStatusConfig: Record<Product["stockStatus"], { icon: keyof typeof Feather.glyphMap; label: string; tone: typeof colors.status.success }> = {
  in_stock: { icon: "check-circle", label: "In stock", tone: colors.status.success },
  low_stock: { icon: "alert-triangle", label: "Low stock", tone: colors.status.warning },
  out_of_stock: { icon: "x-circle", label: "Out of stock", tone: colors.status.danger },
};

export default function AdminStockScreen() {
  const { products, updateProduct } = useMobileState();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<StockFilter>("all");
  const [lowStockThreshold, setLowStockThreshold] = useState("10");
  const [message, setMessage] = useState<MessageState>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [stockQuantity, setStockQuantity] = useState("0");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const stockStats = useMemo(() => {
    const lowStockProducts = products.filter((product) => product.stockQuantity <= product.lowStockThreshold && product.stockQuantity > 0);
    const outOfStockProducts = products.filter((product) => product.stockQuantity === 0);
    const healthyProducts = products.filter((product) => product.stockQuantity > product.lowStockThreshold);
    const totalUnits = products.reduce((sum, product) => sum + product.stockQuantity, 0);
    const totalStockValue = products.reduce((sum, product) => sum + product.stockQuantity * product.price, 0);

    return {
      healthyProducts,
      lowStockProducts,
      outOfStockProducts,
      totalStockValue,
      totalUnits,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const byFilter = products.filter((product) => {
      if (filter === "healthy") return product.stockQuantity > product.lowStockThreshold;
      if (filter === "low") return product.stockQuantity <= product.lowStockThreshold && product.stockQuantity > 0;
      if (filter === "out") return product.stockQuantity === 0;
      return true;
    });

    return [...byFilter].sort((a, b) => getRiskRank(a) - getRiskRank(b) || a.name.localeCompare(b.name));
  }, [filter, products]);

  const edit = (product: Product) => {
    setEditingId(product.id);
    setLowStockThreshold(String(product.lowStockThreshold || 10));
    setMessage(null);
    setStockQuantity(String(product.stockQuantity || 0));
  };

  const cancel = () => {
    setEditingId(null);
    setLowStockThreshold("10");
    setStockQuantity("0");
  };

  const save = async (product: Product) => {
    const nextQuantity = Number.parseInt(stockQuantity, 10);
    const nextThreshold = Number.parseInt(lowStockThreshold, 10);

    if (!Number.isFinite(nextQuantity) || nextQuantity < 0 || !Number.isFinite(nextThreshold) || nextThreshold < 0) {
      setMessage({ text: "Stock values must be zero or greater.", tone: "error" });
      return;
    }

    setSavingId(product.id);
    setMessage(null);
    try {
      const updated = await updateProduct(product.id, {
        lowStockThreshold: nextThreshold,
        stockQuantity: nextQuantity,
        stockStatus: getStockStatus(nextQuantity, nextThreshold),
      });
      cancel();
      if (updated.stockQuantity <= updated.lowStockThreshold && updated.stockQuantity > 0) {
        setMessage({
          body: "Base44 SendEmail will be wired later; this is still mock-only.",
          text: "Low stock notification mocked",
          tone: "info",
        });
      } else if (updated.stockQuantity === 0) {
        setMessage({ text: "Product marked out of stock.", tone: "info" });
      } else {
        setMessage({ text: "Stock updated.", tone: "success" });
      }
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "Stock could not be updated.", tone: "error" });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <ScrollContent>
      <SectionTitle eyebrow="Inventory" title="Stock management" />
      {message ? <StatusBanner body={message.body} title={message.text} tone={message.tone} /> : null}

      <View style={stockStyles.metricsGrid}>
        <StockMetric icon="package" label="Products" value={String(products.length)} />
        <StockMetric icon="layers" label="Units" value={String(stockStats.totalUnits)} />
        <StockMetric icon="alert-triangle" label="Low stock" value={String(stockStats.lowStockProducts.length)} />
        <StockMetric icon="credit-card" label="Value" value={formatCurrency(stockStats.totalStockValue).replace("GBP ", "£")} />
      </View>

      {stockStats.lowStockProducts.length > 0 || stockStats.outOfStockProducts.length > 0 ? (
        <View style={stockStyles.alertPanel}>
          <View style={stockStyles.alertHeader}>
            <View style={stockStyles.alertIcon}>
              <Feather color={colors.status.warning.color} name="alert-triangle" size={17} />
            </View>
            <View style={stockStyles.alertTitleBlock}>
              <Text style={stockStyles.alertTitle}>Stock attention needed</Text>
              <Text style={stockStyles.alertText}>{stockStats.lowStockProducts.length} low stock, {stockStats.outOfStockProducts.length} out of stock</Text>
            </View>
          </View>
          <View style={stockStyles.alertList}>
            {[...stockStats.outOfStockProducts, ...stockStats.lowStockProducts].slice(0, 4).map((product) => (
              <Pressable accessibilityRole="button" key={product.id} onPress={() => edit(product)} style={({ pressed }) => [stockStyles.alertRow, pressed && styles.pressed]}>
                <View style={stockStyles.alertProduct}>
                  <Text numberOfLines={1} style={stockStyles.alertName}>{product.name}</Text>
                  <Text style={stockStyles.alertMeta}>{product.stockQuantity} units · threshold {product.lowStockThreshold}</Text>
                </View>
                <Feather color={colors.primary} name="edit-2" size={14} />
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <View style={stockStyles.controlCard}>
        <View style={stockStyles.controlHeader}>
          <View style={stockStyles.controlTitleBlock}>
            <Text style={stockStyles.controlEyebrow}>Inventory</Text>
            <Text style={stockStyles.controlTitle}>Manage stock levels</Text>
            <Text style={stockStyles.controlCount}>{filteredProducts.length} products shown</Text>
          </View>
          <ViewModeToggle onChange={setViewMode} value={viewMode} />
        </View>

        <View style={stockStyles.filterRow}>
          {filterOptions.map((option) => {
            const active = filter === option.value;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                key={option.value}
                onPress={() => setFilter(option.value)}
                style={({ pressed }) => [stockStyles.filterChip, active && stockStyles.filterChipActive, pressed && styles.pressed]}
              >
                <Feather color={active ? colors.onPrimary : colors.muted} name={option.icon} size={13} />
                <Text style={[stockStyles.filterText, active && stockStyles.filterTextActive]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {filteredProducts.length === 0 ? (
        <EmptyState title="No stock records" body="No products match the selected stock filter." />
      ) : viewMode === "list" ? (
        <View style={stockStyles.productList}>
          {filteredProducts.map((product) => (
            <StockListItem
              cancel={cancel}
              edit={edit}
              editing={editingId === product.id}
              key={product.id}
              lowStockThreshold={lowStockThreshold}
              product={product}
              save={save}
              saving={savingId === product.id}
              setLowStockThreshold={setLowStockThreshold}
              setStockQuantity={setStockQuantity}
              stockQuantity={stockQuantity}
            />
          ))}
        </View>
      ) : (
        <View style={stockStyles.productList}>
          {filteredProducts.map((product) => (
            <StockCard
              cancel={cancel}
              edit={edit}
              editing={editingId === product.id}
              key={product.id}
              lowStockThreshold={lowStockThreshold}
              product={product}
              save={save}
              saving={savingId === product.id}
              setLowStockThreshold={setLowStockThreshold}
              setStockQuantity={setStockQuantity}
              stockQuantity={stockQuantity}
            />
          ))}
        </View>
      )}
    </ScrollContent>
  );
}

function StockMetric({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={stockStyles.metricCard}>
      <View style={stockStyles.metricIcon}>
        <Feather color={colors.primary} name={icon} size={16} />
      </View>
      <Text style={stockStyles.metricLabel}>{label}</Text>
      <Text numberOfLines={1} adjustsFontSizeToFit style={stockStyles.metricValue}>{value}</Text>
    </View>
  );
}

function ViewModeToggle({
  onChange,
  value,
}: {
  onChange: (value: ViewMode) => void;
  value: ViewMode;
}) {
  const options: Array<{ icon: keyof typeof Feather.glyphMap; label: string; value: ViewMode }> = [
    { icon: "grid", label: "Cards", value: "cards" },
    { icon: "list", label: "List", value: "list" },
  ];

  return (
    <View style={stockStyles.viewToggle}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [stockStyles.viewToggleButton, active && stockStyles.viewToggleButtonActive, pressed && styles.pressed]}
          >
            <Feather color={active ? colors.onPrimary : colors.muted} name={option.icon} size={14} />
            <Text style={[stockStyles.viewToggleText, active && stockStyles.viewToggleTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function StockListItem({
  cancel,
  edit,
  editing,
  lowStockThreshold,
  product,
  save,
  saving,
  setLowStockThreshold,
  setStockQuantity,
  stockQuantity,
}: StockItemProps) {
  const config = stockStatusConfig[getStockStatus(product.stockQuantity, product.lowStockThreshold)];

  return (
    <View style={stockStyles.listItem}>
      <View style={stockStyles.listTopRow}>
        <View style={stockStyles.listTitleBlock}>
          <Text numberOfLines={1} style={stockStyles.listName}>{product.name}</Text>
          <Text numberOfLines={1} style={stockStyles.listMeta}>{product.category}{product.weight ? ` · ${product.weight}` : ""}</Text>
        </View>
        <View style={stockStyles.listValueBlock}>
          <Text style={stockStyles.listValue}>{formatCurrency(product.stockQuantity * product.price).replace("GBP ", "£")}</Text>
          <Text style={stockStyles.listUnits}>{product.stockQuantity} units</Text>
        </View>
      </View>

      <StockLevel product={product} />

      <View style={stockStyles.listFooter}>
        <StatusPill config={config} />
        <Text style={stockStyles.thresholdText}>Threshold {product.lowStockThreshold}</Text>
        <Pressable accessibilityRole="button" onPress={() => edit(product)} style={({ pressed }) => [stockStyles.editIconButton, pressed && styles.pressed]}>
          <Feather color={colors.primary} name="edit-2" size={15} />
        </Pressable>
      </View>

      {editing ? (
        <StockEditPanel
          cancel={cancel}
          lowStockThreshold={lowStockThreshold}
          product={product}
          save={save}
          saving={saving}
          setLowStockThreshold={setLowStockThreshold}
          setStockQuantity={setStockQuantity}
          stockQuantity={stockQuantity}
        />
      ) : null}
    </View>
  );
}

function StockCard({
  cancel,
  edit,
  editing,
  lowStockThreshold,
  product,
  save,
  saving,
  setLowStockThreshold,
  setStockQuantity,
  stockQuantity,
}: StockItemProps) {
  const config = stockStatusConfig[getStockStatus(product.stockQuantity, product.lowStockThreshold)];

  return (
    <View style={stockStyles.stockCard}>
      <View style={stockStyles.cardHeader}>
        <View style={stockStyles.cardTitleBlock}>
          <Text numberOfLines={2} style={stockStyles.cardTitle}>{product.name}</Text>
          <Text style={stockStyles.cardMeta}>{product.category}{product.weight ? ` · ${product.weight}` : ""}</Text>
        </View>
        <Text style={stockStyles.cardValue}>{formatCurrency(product.stockQuantity * product.price).replace("GBP ", "£")}</Text>
      </View>

      <View style={stockStyles.cardStatsRow}>
        <View style={stockStyles.cardStat}>
          <Text style={stockStyles.cardStatLabel}>Current</Text>
          <Text style={stockStyles.cardStatValue}>{product.stockQuantity}</Text>
        </View>
        <View style={stockStyles.cardStat}>
          <Text style={stockStyles.cardStatLabel}>Threshold</Text>
          <Text style={stockStyles.cardStatValue}>{product.lowStockThreshold}</Text>
        </View>
        <View style={stockStyles.cardStat}>
          <Text style={stockStyles.cardStatLabel}>Unit price</Text>
          <Text style={stockStyles.cardStatValue}>{formatCurrency(product.price).replace("GBP ", "£")}</Text>
        </View>
      </View>

      <StockLevel product={product} />

      <View style={stockStyles.cardFooter}>
        <StatusPill config={config} />
        <Pressable accessibilityRole="button" onPress={() => edit(product)} style={({ pressed }) => [stockStyles.editButton, pressed && styles.pressed]}>
          <Feather color={colors.primary} name="edit-2" size={15} />
          <Text style={stockStyles.editButtonText}>Edit stock</Text>
        </Pressable>
      </View>

      {editing ? (
        <StockEditPanel
          cancel={cancel}
          lowStockThreshold={lowStockThreshold}
          product={product}
          save={save}
          saving={saving}
          setLowStockThreshold={setLowStockThreshold}
          setStockQuantity={setStockQuantity}
          stockQuantity={stockQuantity}
        />
      ) : null}
    </View>
  );
}

type StockItemProps = {
  cancel: () => void;
  edit: (product: Product) => void;
  editing: boolean;
  lowStockThreshold: string;
  product: Product;
  save: (product: Product) => Promise<void>;
  saving: boolean;
  setLowStockThreshold: (value: string) => void;
  setStockQuantity: (value: string) => void;
  stockQuantity: string;
};

function StockEditPanel({
  cancel,
  lowStockThreshold,
  product,
  save,
  saving,
  setLowStockThreshold,
  setStockQuantity,
  stockQuantity,
}: Omit<StockItemProps, "edit" | "editing">) {
  return (
    <View style={stockStyles.editPanel}>
      <View style={stockStyles.editGrid}>
        <View style={stockStyles.fieldBlock}>
          <Text style={stockStyles.controlLabel}>Current stock</Text>
          <Field keyboardType="number-pad" onChangeText={setStockQuantity} placeholder="Current stock" value={stockQuantity} />
        </View>
        <View style={stockStyles.fieldBlock}>
          <Text style={stockStyles.controlLabel}>Low stock threshold</Text>
          <Field keyboardType="number-pad" onChangeText={setLowStockThreshold} placeholder="Low stock threshold" value={lowStockThreshold} />
        </View>
      </View>

      <View style={stockStyles.editActions}>
        <Pressable accessibilityRole="button" disabled={saving} onPress={() => void save(product)} style={({ pressed }) => [stockStyles.saveButton, pressed && !saving && styles.pressed, saving && styles.disabled]}>
          <Feather color={colors.onPrimary} name="save" size={15} />
          <Text style={stockStyles.saveButtonText}>{saving ? "Saving..." : "Save"}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={cancel} style={({ pressed }) => [stockStyles.cancelButton, pressed && styles.pressed]}>
          <Text style={stockStyles.cancelButtonText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

function StatusPill({ config }: { config: { icon: keyof typeof Feather.glyphMap; label: string; tone: typeof colors.status.success } }) {
  return (
    <View style={[stockStyles.statusPill, { backgroundColor: config.tone.background, borderColor: config.tone.border }]}>
      <Feather color={config.tone.color} name={config.icon} size={13} />
      <Text style={[stockStyles.statusText, { color: config.tone.color }]}>{config.label}</Text>
    </View>
  );
}

function StockLevel({ product }: { product: Product }) {
  const status = getStockStatus(product.stockQuantity, product.lowStockThreshold);
  const config = stockStatusConfig[status];
  const target = Math.max(product.lowStockThreshold * 2, product.stockQuantity, 1);
  const progress = Math.min(product.stockQuantity / target, 1);

  return (
    <View style={stockStyles.levelBlock}>
      <View style={stockStyles.levelHeader}>
        <Text style={stockStyles.levelLabel}>Stock level</Text>
        <Text style={[stockStyles.levelValue, { color: config.tone.color }]}>{Math.round(progress * 100)}%</Text>
      </View>
      <View style={stockStyles.progressTrack}>
        <View style={[stockStyles.progressFill, { backgroundColor: config.tone.color, flex: progress }]} />
        <View style={{ flex: 1 - progress }} />
      </View>
    </View>
  );
}

function getRiskRank(product: Product) {
  if (product.stockQuantity === 0) return 0;
  if (product.stockQuantity <= product.lowStockThreshold) return 1;
  return 2;
}

const stockStyles = StyleSheet.create({
  alertHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  alertIcon: {
    alignItems: "center",
    backgroundColor: colors.status.warning.background,
    borderColor: colors.status.warning.border,
    borderRadius: 14,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  alertList: {
    gap: 9,
  },
  alertMeta: {
    color: colors.muted,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 17,
  },
  alertName: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  alertPanel: {
    backgroundColor: colors.status.warning.background,
    borderColor: colors.status.warning.border,
    borderRadius: 15,
    borderWidth: 1,
    gap: 12,
    padding: 12,
  },
  alertProduct: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  alertRow: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderColor: colors.status.warning.border,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 11,
    paddingVertical: 10,
  },
  alertText: {
    color: colors.muted,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 17,
  },
  alertTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.bold,
    fontSize: 15,
    lineHeight: 20,
  },
  alertTitleBlock: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  cancelButton: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 13,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 45,
  },
  cancelButtonText: {
    color: colors.primary,
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
  },
  cardFooter: {
    alignItems: "center",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    paddingTop: 12,
  },
  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  cardMeta: {
    color: colors.muted,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 17,
  },
  cardStat: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderRadius: 13,
    borderWidth: 1,
    flex: 1,
    gap: 3,
    padding: 10,
  },
  cardStatLabel: {
    color: colors.muted,
    fontFamily: fontFamilies.medium,
    fontSize: 11,
  },
  cardStatsRow: {
    flexDirection: "row",
    gap: 8,
  },
  cardStatValue: {
    color: colors.foreground,
    fontFamily: fontFamilies.bold,
    fontSize: 15,
    lineHeight: 20,
  },
  cardTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.bold,
    fontSize: 17,
    lineHeight: 22,
  },
  cardTitleBlock: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  cardValue: {
    color: colors.primary,
    fontFamily: fontFamilies.bold,
    fontSize: 17,
    lineHeight: 22,
    textAlign: "right",
  },
  controlCard: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 15,
    borderWidth: 1,
    gap: 12,
    padding: 12,
  },
  controlCount: {
    color: colors.muted,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 17,
  },
  controlEyebrow: {
    color: colors.primary,
    fontFamily: fontFamilies.semiBold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  controlHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  controlLabel: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 10,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  controlTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.bold,
    fontSize: 20,
    lineHeight: 25,
  },
  controlTitleBlock: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  editActions: {
    flexDirection: "row",
    gap: 9,
  },
  editButton: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    minHeight: 42,
    paddingHorizontal: 12,
  },
  editButtonText: {
    color: colors.primary,
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
  },
  editGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  editIconButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 42,
  },
  editPanel: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    padding: 11,
  },
  fieldBlock: {
    flex: 1,
    gap: 7,
    minWidth: 136,
  },
  filterChip: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: colors.foreground,
    borderColor: colors.foreground,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  filterText: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
  },
  filterTextActive: {
    color: colors.onPrimary,
  },
  levelBlock: {
    gap: 8,
  },
  levelHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  levelLabel: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 11,
    textTransform: "uppercase",
  },
  levelValue: {
    fontFamily: fontFamilies.bold,
    fontSize: 12,
  },
  listFooter: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  listItem: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 15,
    borderWidth: 1,
    gap: 12,
    padding: 12,
  },
  listMeta: {
    color: colors.muted,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 17,
  },
  listName: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 15,
    lineHeight: 20,
  },
  listTitleBlock: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  listTopRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  listUnits: {
    color: colors.muted,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "right",
  },
  listValue: {
    color: colors.primary,
    fontFamily: fontFamilies.bold,
    fontSize: 16,
    lineHeight: 21,
    textAlign: "right",
  },
  listValueBlock: {
    alignItems: "flex-end",
    gap: 2,
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
    fontSize: 20,
    lineHeight: 25,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  productList: {
    gap: 12,
  },
  progressFill: {
    borderRadius: 999,
  },
  progressTrack: {
    backgroundColor: colors.progressTrack,
    borderRadius: 999,
    flexDirection: "row",
    height: 9,
    overflow: "hidden",
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 13,
    flex: 1,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    minHeight: 45,
  },
  saveButtonText: {
    color: colors.onPrimary,
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
  },
  statusPill: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  statusText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 11,
  },
  stockCard: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 15,
    borderWidth: 1,
    gap: 13,
    padding: 12,
  },
  thresholdText: {
    color: colors.muted,
    flex: 1,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 17,
  },
  viewToggle: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    padding: 4,
  },
  viewToggleButton: {
    alignItems: "center",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    minHeight: 34,
    paddingHorizontal: 10,
  },
  viewToggleButtonActive: {
    backgroundColor: colors.foreground,
  },
  viewToggleText: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
  },
  viewToggleTextActive: {
    color: colors.onPrimary,
  },
});
