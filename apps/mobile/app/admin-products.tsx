import { Feather } from "@expo/vector-icons";
import { Product } from "@harvest/domain";
import { type Dispatch, type SetStateAction, useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, ConfirmDialog, EmptyState, fallbackImage, Field, fontFamilies, formatCurrency, ScrollContent, SectionTitle, StatusBanner, styles } from "../components/ui";
import { useMobileState } from "../lib/mobile-state";

type ProductForm = {
  category: Product["category"];
  description: string;
  imageUrl: string;
  lowStockThreshold: string;
  name: string;
  price: string;
  stockQuantity: string;
  stockStatus: Product["stockStatus"];
  weight: string;
};

type MessageState = { text: string; tone: "error" | "info" | "success" } | null;
type ViewMode = "cards" | "list";

const emptyForm: ProductForm = {
  category: "Cups & Lids",
  description: "",
  imageUrl: "",
  lowStockThreshold: "10",
  name: "",
  price: "",
  stockQuantity: "100",
  stockStatus: "in_stock",
  weight: "",
};

const categories: Product["category"][] = ["Single Origin", "Blend", "Decaf", "Specialty", "Cups & Lids", "Cleaning & Maintenance", "Accessories"];
const stockStatusOptions: Product["stockStatus"][] = ["in_stock", "low_stock", "out_of_stock"];

const stockStatusConfig: Record<Product["stockStatus"], { icon: keyof typeof Feather.glyphMap; label: string; tone: typeof colors.status.success }> = {
  in_stock: { icon: "check-circle", label: "In Stock", tone: colors.status.success },
  low_stock: { icon: "alert-triangle", label: "Low Stock", tone: colors.status.warning },
  out_of_stock: { icon: "x-circle", label: "Out of Stock", tone: colors.status.danger },
};

export default function AdminProductsScreen() {
  const { createProduct, deleteProduct, products, updateProduct } = useMobileState();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Product | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [message, setMessage] = useState<MessageState>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");

  const productStats = useMemo(() => ({
    inStock: products.filter((product) => product.stockStatus === "in_stock").length,
    lowStock: products.filter((product) => product.stockStatus === "low_stock").length,
    outOfStock: products.filter((product) => product.stockStatus === "out_of_stock").length,
    total: products.length,
  }), [products]);

  const editProduct = (product: Product) => {
    setEditingId(product.id);
    setForm({
      category: product.category || "Cups & Lids",
      description: product.description || "",
      imageUrl: product.imageUrl || "",
      lowStockThreshold: String(product.lowStockThreshold ?? 10),
      name: product.name || "",
      price: String(product.price ?? ""),
      stockQuantity: String(product.stockQuantity ?? 0),
      stockStatus: product.stockStatus || "in_stock",
      weight: product.weight || "",
    });
    setMessage(null);
    setShowForm(true);
  };

  const cancel = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false);
  };

  const save = async () => {
    const price = Number(form.price);
    if (!form.name.trim() || !Number.isFinite(price) || price <= 0) {
      setMessage({ text: "Add a product name and a valid price.", tone: "error" });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const input = {
        category: form.category,
        description: form.description.trim(),
        imageUrl: form.imageUrl.trim(),
        lowStockThreshold: Number.parseInt(form.lowStockThreshold, 10) || 10,
        name: form.name.trim(),
        price,
        stockQuantity: Number.parseInt(form.stockQuantity, 10) || 0,
        stockStatus: form.stockStatus,
        weight: form.weight.trim(),
      };
      if (editingId) {
        await updateProduct(editingId, input);
      } else {
        await createProduct(input);
      }
      cancel();
    } catch {
      // Global feedback handles API failures.
    } finally {
      setSaving(false);
    }
  };

  const remove = (product: Product) => {
    setDeleteCandidate(product);
  };

  const confirmDeleteProduct = async () => {
    if (!deleteCandidate) return;
    setDeletingId(deleteCandidate.id);
    setMessage(null);
    try {
      await deleteProduct(deleteCandidate.id);
      setDeleteCandidate(null);
    } catch {
      // Global feedback handles API failures.
    } finally {
      setDeletingId(null);
    }
  };

  const generateDescription = async () => {
    if (!form.name.trim()) {
      setMessage({ text: "Please enter a product name first.", tone: "error" });
      return;
    }
    setGeneratingDescription(true);
    try {
      setForm((current) => ({
        ...current,
        description: draftProductDescription(current),
      }));
      setMessage({ text: "Description drafted locally. Review it before saving.", tone: "info" });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "Description could not be generated.", tone: "error" });
    } finally {
      setGeneratingDescription(false);
    }
  };

  return (
    <ScrollContent>
      <SectionTitle eyebrow="Admin" title="Product management" />
      {message ? <StatusBanner tone={message.tone} title={message.text} /> : null}

      <View style={productStyles.metricsGrid}>
        <ProductMetric icon="package" label="Total" value={String(productStats.total)} />
        <ProductMetric icon="check-circle" label="In stock" value={String(productStats.inStock)} />
        <ProductMetric icon="alert-triangle" label="Low stock" value={String(productStats.lowStock)} />
        <ProductMetric icon="x-circle" label="Out" value={String(productStats.outOfStock)} />
      </View>

      <View style={productStyles.catalogHeader}>
        <View style={productStyles.catalogTitleBlock}>
          <Text style={productStyles.catalogEyebrow}>Catalogue</Text>
          <Text style={productStyles.catalogTitle}>Products</Text>
          <Text style={productStyles.catalogCount}>{products.length} active records</Text>
        </View>
        <View style={productStyles.catalogControls}>
          {!showForm ? (
            <Pressable accessibilityRole="button" onPress={() => setShowForm(true)} style={({ pressed }) => [productStyles.newProductButton, pressed && styles.pressed]}>
              <Feather color={colors.onPrimary} name="plus" size={15} />
              <Text style={productStyles.newProductText}>New</Text>
            </Pressable>
          ) : null}
          <ViewModeToggle onChange={setViewMode} value={viewMode} />
        </View>
      </View>

      {showForm ? (
        <ProductFormCard
          cancel={cancel}
          editing={Boolean(editingId)}
          form={form}
          generatingDescription={generatingDescription}
          generateDescription={generateDescription}
          save={save}
          saving={saving}
          setForm={setForm}
        />
      ) : null}

      {products.length === 0 ? (
        <EmptyState title="No products yet" body="Create the first product from the admin form." />
      ) : viewMode === "list" ? (
        <View style={productStyles.productList}>
          {products.map((product) => <AdminProductListItem deleting={deletingId === product.id} editProduct={editProduct} key={product.id} product={product} remove={remove} />)}
        </View>
      ) : (
        <View style={productStyles.productList}>
          {products.map((product) => <AdminProductCard deleting={deletingId === product.id} editProduct={editProduct} key={product.id} product={product} remove={remove} />)}
        </View>
      )}
      <ConfirmDialog
        body={deleteCandidate ? `${deleteCandidate.name} will be removed from the catalogue and stock views.` : ""}
        confirmLabel="Delete"
        confirming={Boolean(deleteCandidate && deletingId === deleteCandidate.id)}
        destructive
        onCancel={() => {
          if (!deletingId) setDeleteCandidate(null);
        }}
        onConfirm={() => void confirmDeleteProduct()}
        title="Delete product?"
        visible={Boolean(deleteCandidate)}
      />
    </ScrollContent>
  );
}

function ViewModeToggle({
  onChange,
  value,
}: {
  onChange: (value: ViewMode) => void;
  value: ViewMode;
}) {
  const options: { icon: keyof typeof Feather.glyphMap; label: string; value: ViewMode }[] = [
    { icon: "grid", label: "Cards", value: "cards" },
    { icon: "list", label: "List", value: "list" },
  ];

  return (
    <View style={productStyles.viewToggle}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [productStyles.viewToggleButton, active && productStyles.viewToggleButtonActive, pressed && styles.pressed]}
          >
            <Feather color={active ? colors.onPrimary : colors.muted} name={option.icon} size={14} />
            <Text style={[productStyles.viewToggleText, active && productStyles.viewToggleTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ProductMetric({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={productStyles.metricCard}>
      <View style={productStyles.metricIcon}>
        <Feather color={colors.primary} name={icon} size={16} />
      </View>
      <Text style={productStyles.metricLabel}>{label}</Text>
      <Text style={productStyles.metricValue}>{value}</Text>
    </View>
  );
}

function ProductFormCard({
  cancel,
  editing,
  form,
  generatingDescription,
  generateDescription,
  save,
  saving,
  setForm,
}: {
  cancel: () => void;
  editing: boolean;
  form: ProductForm;
  generatingDescription: boolean;
  generateDescription: () => void;
  save: () => Promise<void>;
  saving: boolean;
  setForm: Dispatch<SetStateAction<ProductForm>>;
}) {
  return (
    <View style={productStyles.formCard}>
      <View style={productStyles.formHeader}>
        <View>
          <Text style={productStyles.formEyebrow}>Product setup</Text>
          <Text style={productStyles.formTitle}>{editing ? "Edit product" : "Add new product"}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={cancel} style={({ pressed }) => [productStyles.iconButton, pressed && styles.pressed]}>
          <Feather color={colors.foreground} name="x" size={16} />
        </Pressable>
      </View>

      <View style={productStyles.formGrid}>
        <LabeledField label="Product name">
          <Field onChangeText={(name) => setForm((current) => ({ ...current, name }))} placeholder="Product name" value={form.name} />
        </LabeledField>
        <LabeledField label="Price">
          <Field keyboardType="decimal-pad" onChangeText={(price) => setForm((current) => ({ ...current, price }))} placeholder="10.00" value={form.price} />
        </LabeledField>
        <LabeledField label="Size / weight">
          <Field onChangeText={(weight) => setForm((current) => ({ ...current, weight }))} placeholder="12oz, 900g, 1000pcs" value={form.weight} />
        </LabeledField>
        <LabeledField label="Stock quantity">
          <Field keyboardType="number-pad" onChangeText={(stockQuantity) => setForm((current) => ({ ...current, stockQuantity }))} placeholder="Stock quantity" value={form.stockQuantity} />
        </LabeledField>
        <LabeledField label="Low stock threshold">
          <Field keyboardType="number-pad" onChangeText={(lowStockThreshold) => setForm((current) => ({ ...current, lowStockThreshold }))} placeholder="Low stock threshold" value={form.lowStockThreshold} />
        </LabeledField>
      </View>

      <ChoiceSection
        label="Category"
        options={categories}
        value={form.category}
        onChange={(category) => setForm((current) => ({ ...current, category: category as Product["category"] }))}
      />
      <ChoiceSection
        label="Stock status"
        options={stockStatusOptions}
        value={form.stockStatus}
        labelFor={(stockStatus) => stockStatusConfig[stockStatus].label}
        onChange={(stockStatus) => setForm((current) => ({ ...current, stockStatus }))}
      />

      <LabeledField label="Product image URL">
        <Field onChangeText={(imageUrl) => setForm((current) => ({ ...current, imageUrl }))} placeholder="https://..." value={form.imageUrl} />
      </LabeledField>

      <View style={productStyles.descriptionHeader}>
        <Text style={productStyles.controlLabel}>Product description</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: generatingDescription || saving }}
          disabled={generatingDescription || saving}
          onPress={generateDescription}
          style={({ pressed }) => [productStyles.aiButton, pressed && !generatingDescription && !saving && styles.pressed, (generatingDescription || saving) && styles.disabled]}
        >
          <Feather color={colors.metric.purple.color} name="zap" size={14} />
          <Text style={productStyles.aiButtonText}>{generatingDescription ? "Drafting..." : "Draft copy"}</Text>
        </Pressable>
      </View>
      <Field
        multiline
        onChangeText={(description) => setForm((current) => ({ ...current, description }))}
        placeholder="Product description"
        value={form.description}
      />

      <View style={productStyles.actions}>
        <Pressable accessibilityRole="button" disabled={saving} onPress={() => void save()} style={({ pressed }) => [productStyles.saveButton, pressed && !saving && styles.pressed, saving && styles.disabled]}>
          <Feather color={colors.onPrimary} name="save" size={15} />
          <Text style={productStyles.saveButtonText}>{saving ? "Saving..." : "Save"}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={cancel} style={({ pressed }) => [productStyles.cancelButton, pressed && styles.pressed]}>
          <Text style={productStyles.cancelButtonText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

function LabeledField({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <View style={productStyles.fieldBlock}>
      <Text style={productStyles.controlLabel}>{label}</Text>
      {children}
    </View>
  );
}

function ChoiceSection<TValue extends string>({
  label,
  labelFor,
  onChange,
  options,
  value,
}: {
  label: string;
  labelFor?: (value: TValue) => string;
  onChange: (value: TValue) => void;
  options: TValue[];
  value: TValue;
}) {
  return (
    <View style={productStyles.choiceSection}>
      <Text style={productStyles.controlLabel}>{label}</Text>
      <View style={productStyles.chips}>
        {options.map((option) => {
          const active = option === value;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              key={option}
              onPress={() => onChange(option)}
              style={({ pressed }) => [productStyles.chip, active && productStyles.chipActive, pressed && styles.pressed]}
            >
              <Text style={[productStyles.chipText, active && productStyles.chipTextActive]}>{labelFor ? labelFor(option) : option}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function AdminProductListItem({ deleting, editProduct, product, remove }: { deleting: boolean; editProduct: (product: Product) => void; product: Product; remove: (product: Product) => void }) {
  const config = stockStatusConfig[product.stockStatus];

  return (
    <View style={productStyles.listItem}>
      <View style={productStyles.listTopRow}>
        <View style={productStyles.listTitleBlock}>
          <Text numberOfLines={1} style={productStyles.listName}>{product.name}</Text>
          <Text numberOfLines={1} style={productStyles.listMeta}>{product.category}{product.weight ? ` · ${product.weight}` : ""}</Text>
        </View>
        <Text style={productStyles.listPrice}>{formatCurrency(product.price).replace("GBP ", "£")}</Text>
      </View>

      <View style={productStyles.listFooter}>
        <View style={productStyles.listStatusBlock}>
          <View style={[productStyles.statusPill, { backgroundColor: config.tone.background, borderColor: config.tone.border }]}>
            <Feather color={config.tone.color} name={config.icon} size={13} />
            <Text style={[productStyles.statusText, { color: config.tone.color }]}>{config.label}</Text>
          </View>
          <Text style={productStyles.listStock}>{product.stockQuantity} units · threshold {product.lowStockThreshold}</Text>
        </View>

        <View style={productStyles.listActions}>
          <Pressable accessibilityRole="button" disabled={deleting} onPress={() => editProduct(product)} style={({ pressed }) => [productStyles.listIconButton, pressed && !deleting && styles.pressed, deleting && styles.disabled]}>
            <Feather color={colors.primary} name="edit-2" size={15} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: deleting }} disabled={deleting} onPress={() => remove(product)} style={({ pressed }) => [productStyles.listDeleteButton, pressed && !deleting && styles.pressed, deleting && styles.disabled]}>
            <Feather color={colors.status.danger.color} name="trash-2" size={15} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function AdminProductCard({ deleting, editProduct, product, remove }: { deleting: boolean; editProduct: (product: Product) => void; product: Product; remove: (product: Product) => void }) {
  const config = stockStatusConfig[product.stockStatus];
  return (
    <View style={productStyles.productCard}>
      <Image accessibilityLabel={product.name} source={{ uri: product.imageUrl || fallbackImage }} style={productStyles.image} />
      <View style={productStyles.cardBody}>
        <View style={productStyles.productHeader}>
          <View style={productStyles.productTitleBlock}>
            <Text numberOfLines={2} style={productStyles.productName}>{product.name}</Text>
            <Text style={productStyles.productMeta}>{product.category}{product.weight ? ` · ${product.weight}` : ""}</Text>
          </View>
          <Text style={productStyles.price}>{formatCurrency(product.price).replace("GBP ", "£")}</Text>
        </View>

        {product.description ? <Text numberOfLines={2} style={productStyles.description}>{product.description}</Text> : null}

        <View style={productStyles.stockRow}>
          <View style={[productStyles.statusPill, { backgroundColor: config.tone.background, borderColor: config.tone.border }]}>
            <Feather color={config.tone.color} name={config.icon} size={13} />
            <Text style={[productStyles.statusText, { color: config.tone.color }]}>{config.label}</Text>
          </View>
          <Text style={productStyles.stockText}>{product.stockQuantity} units · Threshold {product.lowStockThreshold}</Text>
        </View>

        <View style={productStyles.cardActions}>
          <Pressable accessibilityRole="button" disabled={deleting} onPress={() => editProduct(product)} style={({ pressed }) => [productStyles.editButton, pressed && !deleting && styles.pressed, deleting && styles.disabled]}>
            <Feather color={colors.primary} name="edit-2" size={15} />
            <Text style={productStyles.editButtonText}>Edit</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: deleting }} disabled={deleting} onPress={() => remove(product)} style={({ pressed }) => [productStyles.deleteButton, pressed && !deleting && styles.pressed, deleting && styles.disabled]}>
            <Feather color={colors.status.danger.color} name="trash-2" size={15} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function draftProductDescription(form: ProductForm) {
  const productName = form.name.trim();
  const size = form.weight.trim();
  const category = form.category;
  const sizeSentence = size ? ` The ${size} format keeps replenishment simple for recurring B2B orders.` : "";

  return `${productName} is selected for professional coffee shops, cafes, and hospitality teams that need reliable service and consistent quality. This ${category.toLowerCase()} product is easy to plan into daily operations and regular wholesale ordering.${sizeSentence}`;
}

const productStyles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: 9,
  },
  aiButton: {
    alignItems: "center",
    backgroundColor: colors.metric.purple.background,
    borderColor: colors.status.neutral.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  aiButtonText: {
    color: colors.metric.purple.color,
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
  },
  cancelButton: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 13,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 46,
  },
  cancelButtonText: {
    color: colors.primary,
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
  },
  catalogCount: {
    color: colors.muted,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 17,
  },
  catalogControls: {
    alignItems: "flex-end",
    gap: 8,
  },
  catalogEyebrow: {
    color: colors.primary,
    fontFamily: fontFamilies.semiBold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  catalogHeader: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    padding: 12,
  },
  catalogTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.bold,
    fontSize: 20,
    lineHeight: 25,
  },
  catalogTitleBlock: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  cardActions: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 9,
    paddingTop: 12,
  },
  cardBody: {
    gap: 12,
    padding: 12,
  },
  chip: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: colors.foreground,
    borderColor: colors.foreground,
  },
  chipText: {
    color: colors.foreground,
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
  },
  chipTextActive: {
    color: colors.onPrimary,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  choiceSection: {
    gap: 8,
  },
  controlLabel: {
    color: colors.muted,
    fontFamily: fontFamilies.semiBold,
    fontSize: 10,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  deleteButton: {
    alignItems: "center",
    backgroundColor: colors.status.danger.background,
    borderColor: colors.status.danger.border,
    borderRadius: 13,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 48,
  },
  description: {
    color: colors.muted,
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  descriptionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  editButton: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 13,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    minHeight: 44,
  },
  editButtonText: {
    color: colors.primary,
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
  },
  fieldBlock: {
    flex: 1,
    gap: 7,
    minWidth: 138,
  },
  formCard: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 15,
    borderWidth: 1,
    gap: 14,
    padding: 12,
  },
  formEyebrow: {
    color: colors.primary,
    fontFamily: fontFamilies.semiBold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  formGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  formHeader: {
    alignItems: "center",
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
  },
  formTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.bold,
    fontSize: 18,
    marginTop: 2,
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
  image: {
    backgroundColor: colors.progressTrack,
    height: 150,
    width: "100%",
  },
  listActions: {
    flexDirection: "row",
    gap: 8,
  },
  listDeleteButton: {
    alignItems: "center",
    backgroundColor: colors.status.danger.background,
    borderColor: colors.status.danger.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 42,
  },
  listFooter: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  listIconButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 42,
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
  listPrice: {
    color: colors.primary,
    fontFamily: fontFamilies.bold,
    fontSize: 16,
    lineHeight: 21,
    textAlign: "right",
  },
  listStatusBlock: {
    alignItems: "flex-start",
    flex: 1,
    gap: 7,
    minWidth: 0,
  },
  listStock: {
    color: colors.muted,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 17,
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
  newProductButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: 12,
  },
  newProductText: {
    color: colors.onPrimary,
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
  },
  price: {
    color: colors.primary,
    fontFamily: fontFamilies.bold,
    fontSize: 18,
  },
  productCard: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 15,
    borderWidth: 1,
    overflow: "hidden",
  },
  productHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  productList: {
    gap: 12,
  },
  productMeta: {
    color: colors.muted,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 17,
  },
  productName: {
    color: colors.foreground,
    fontFamily: fontFamilies.bold,
    fontSize: 17,
    lineHeight: 22,
  },
  productTitleBlock: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 13,
    flex: 1,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    minHeight: 46,
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
  stockRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
  },
  stockText: {
    color: colors.muted,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
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
