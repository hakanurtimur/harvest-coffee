import { Product } from "@harvest/domain";
import { useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { AdminShell } from "../components/admin-shell";
import { OptionChip } from "../components/admin-ui";
import { Badge, Card, EmptyState, fallbackImage, Field, formatCurrency, ScrollContent, SectionTitle, StatusBanner, styles } from "../components/ui";
import { useMobileState } from "../lib/mobile-state";

type ProductForm = {
  category: string;
  description: string;
  imageUrl: string;
  lowStockThreshold: string;
  name: string;
  price: string;
  stockQuantity: string;
  stockStatus: Product["stockStatus"];
  weight: string;
};

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

const categories = ["Single Origin", "Blend", "Decaf", "Specialty", "Cups & Lids", "Cleaning & Maintenance", "Accessories", "Machines"];
const stockStatusOptions: Product["stockStatus"][] = ["in_stock", "low_stock", "out_of_stock"];

export default function AdminProductsScreen() {
  const { createProduct, deleteProduct, products, updateProduct } = useMobileState();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

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
    setMessage("");
    setShowForm(true);
  };

  const cancel = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false);
  };

  const save = async () => {
    if (!form.name.trim() || Number(form.price) <= 0) {
      Alert.alert("Product required", "Add a product name and a valid price.");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const input = {
        category: form.category,
        description: form.description.trim(),
        imageUrl: form.imageUrl.trim(),
        lowStockThreshold: Number.parseInt(form.lowStockThreshold, 10) || 10,
        name: form.name.trim(),
        price: Number(form.price),
        stockQuantity: Number.parseInt(form.stockQuantity, 10) || 0,
        stockStatus: form.stockStatus,
        weight: form.weight.trim(),
      };
      if (editingId) {
        await updateProduct(editingId, input);
        setMessage("Product updated.");
      } else {
        await createProduct(input);
        setMessage("Product created.");
      }
      cancel();
    } catch (error) {
      Alert.alert("Product save failed", error instanceof Error ? error.message : "Product could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const remove = (product: Product) => {
    Alert.alert("Delete product", `Delete ${product.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteProduct(product.id);
            setMessage("Product deleted.");
          } catch (error) {
            Alert.alert("Delete failed", error instanceof Error ? error.message : "Product could not be deleted.");
          }
        },
      },
    ]);
  };

  const generateDescription = () => {
    if (!form.name.trim()) {
      Alert.alert("Product name required", "Please enter a product name first.");
      return;
    }
    setForm((current) => ({
      ...current,
      description: `${current.name} is prepared for professional coffee shops, cafes, and hospitality businesses. It is selected for reliable service, practical stock handling, and consistent quality across busy service periods.`,
    }));
    setMessage("AI description is mocked for now; Base44 InvokeLLM will be wired later.");
  };

  return (
    <AdminShell title="Products">
      <ScrollContent>
        <SectionTitle eyebrow="Admin" title="Product management" />
        {message ? <StatusBanner tone="success" title={message} /> : null}
        {!showForm ? (
          <Pressable accessibilityRole="button" onPress={() => setShowForm(true)} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryButtonText}>New product</Text>
          </Pressable>
        ) : (
          <ProductFormCard cancel={cancel} form={form} generateDescription={generateDescription} save={save} saving={saving} setForm={setForm} />
        )}

        {products.length === 0 ? (
          <EmptyState title="No products yet" body="Create the first product from the admin form." />
        ) : (
          products.map((product) => <AdminProductCard editProduct={editProduct} key={product.id} product={product} remove={remove} />)
        )}
      </ScrollContent>
    </AdminShell>
  );
}

function ProductFormCard({
  cancel,
  form,
  generateDescription,
  save,
  saving,
  setForm,
}: {
  cancel: () => void;
  form: ProductForm;
  generateDescription: () => void;
  save: () => Promise<void>;
  saving: boolean;
  setForm: (form: ProductForm) => void;
}) {
  return (
    <Card>
      <Text style={styles.cardTitle}>Product form</Text>
      <Field onChangeText={(name) => setForm({ ...form, name })} placeholder="Product name" value={form.name} />
      <Field keyboardType="decimal-pad" onChangeText={(price) => setForm({ ...form, price })} placeholder="Price" value={form.price} />
      <Text style={styles.muted}>Category</Text>
      <View style={productStyles.chips}>
        {categories.map((category) => (
          <OptionChip key={category} active={form.category === category} label={category} onPress={() => setForm({ ...form, category })} />
        ))}
      </View>
      <Field onChangeText={(weight) => setForm({ ...form, weight })} placeholder="Size / weight" value={form.weight} />
      <Text style={styles.muted}>Stock status</Text>
      <View style={productStyles.chips}>
        {stockStatusOptions.map((stockStatus) => (
          <OptionChip key={stockStatus} active={form.stockStatus === stockStatus} label={stockStatus.replaceAll("_", " ")} onPress={() => setForm({ ...form, stockStatus })} />
        ))}
      </View>
      <Field keyboardType="number-pad" onChangeText={(stockQuantity) => setForm({ ...form, stockQuantity })} placeholder="Stock quantity" value={form.stockQuantity} />
      <Field keyboardType="number-pad" onChangeText={(lowStockThreshold) => setForm({ ...form, lowStockThreshold })} placeholder="Low stock threshold" value={form.lowStockThreshold} />
      <Field onChangeText={(imageUrl) => setForm({ ...form, imageUrl })} placeholder="Product image URL" value={form.imageUrl} />
      <Field multiline onChangeText={(description) => setForm({ ...form, description })} placeholder="Product description" value={form.description} />
      <Pressable accessibilityRole="button" onPress={generateDescription} style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed]}>
        <Text style={styles.outlineButtonText}>Generate with AI</Text>
      </Pressable>
      <View style={productStyles.actions}>
        <Pressable accessibilityRole="button" disabled={saving} onPress={() => void save()} style={({ pressed }) => [styles.primaryButton, productStyles.action, pressed && !saving && styles.pressed, saving && styles.disabled]}>
          <Text style={styles.primaryButtonText}>{saving ? "Saving..." : "Save"}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={cancel} style={({ pressed }) => [styles.outlineButton, productStyles.action, pressed && styles.pressed]}>
          <Text style={styles.outlineButtonText}>Cancel</Text>
        </Pressable>
      </View>
    </Card>
  );
}

function AdminProductCard({ editProduct, product, remove }: { editProduct: (product: Product) => void; product: Product; remove: (product: Product) => void }) {
  return (
    <Card>
      <Image accessibilityLabel={product.name} source={{ uri: product.imageUrl || fallbackImage }} style={productStyles.image} />
      <View style={styles.rowBetween}>
        <View style={styles.flex}>
          <Text style={styles.cardTitle}>{product.name}</Text>
          <Text style={styles.muted}>{product.category}{product.weight ? ` · ${product.weight}` : ""}</Text>
        </View>
        <Text style={styles.total}>{formatCurrency(product.price)}</Text>
      </View>
      {product.description ? <Text style={styles.description}>{product.description}</Text> : null}
      <View style={styles.badgeRow}>
        <Badge label={product.stockStatus.replaceAll("_", " ")} />
        <Badge label={`${product.stockQuantity} units`} />
        <Badge label={`Threshold ${product.lowStockThreshold}`} />
      </View>
      <View style={productStyles.actions}>
        <Pressable accessibilityRole="button" onPress={() => editProduct(product)} style={({ pressed }) => [styles.outlineButton, productStyles.action, pressed && styles.pressed]}>
          <Text style={styles.outlineButtonText}>Edit</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => remove(product)} style={({ pressed }) => [styles.outlineButton, productStyles.action, pressed && styles.pressed]}>
          <Text style={styles.outlineButtonText}>Delete</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const productStyles = StyleSheet.create({
  action: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  image: {
    backgroundColor: "#eadccb",
    borderRadius: 10,
    height: 128,
    width: "100%",
  },
});
