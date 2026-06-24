import { z } from "zod";

export const ProductStatusSchema = z.enum(["in_stock", "low_stock", "out_of_stock"]);
export const ProductCategorySchema = z.enum([
  "Single Origin",
  "Blend",
  "Decaf",
  "Specialty",
  "Cups & Lids",
  "Cleaning & Maintenance",
  "Accessories",
]);
export const OrderStatusSchema = z.enum(["preparing", "in_transit", "delivered"]);
export const PaymentStatusSchema = z.enum(["pending", "paid", "failed"]);
export const PaymentMethodSchema = z.enum(["bank_transfer", "credit_card", "paypal", "cash_on_delivery"]);
export const RentalStatusSchema = z.enum(["active", "upcoming", "expired", "cancelled"]);
export const UserRoleSchema = z.enum(["admin", "user", "dealer"]);
export const CustomerSegmentSchema = z.enum(["new", "regular", "vip", "lapsed", "at_risk"]);
export const AcquisitionSourceSchema = z.enum([
  "direct",
  "referral",
  "social_media",
  "search_engine",
  "email_campaign",
  "trade_show",
  "other",
]);
export const NotificationTypeSchema = z.enum([
  "order_created",
  "order_status",
  "rental_expiring",
  "low_stock",
  "new_order_admin",
]);

export const AddressSchema = z.object({
  title: z.string(),
  address: z.string(),
});

export const AdminSettingsSchema = z.object({
  adminNotificationEmail: z.string().email().optional().or(z.literal("")),
  rentalReminderDays: z.number().int().min(1).max(30).default(3),
  appName: z.string().default("Harvest Coffee"),
});

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().default(""),
  price: z.number().nonnegative(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  category: ProductCategorySchema.default("Accessories"),
  weight: z.string().optional().or(z.literal("")),
  stockStatus: ProductStatusSchema.default("in_stock"),
  stockQuantity: z.number().int().nonnegative().default(0),
  lowStockThreshold: z.number().int().nonnegative().default(10),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const OrderItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
  subtotal: z.number().nonnegative(),
});

export const OrderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerName: z.string().optional(),
  createdById: z.string().optional().or(z.literal("")),
  items: z.array(OrderItemSchema),
  totalAmount: z.number().nonnegative(),
  status: OrderStatusSchema.default("preparing"),
  paymentStatus: PaymentStatusSchema.default("pending"),
  paymentMethod: PaymentMethodSchema.default("bank_transfer"),
  deliveryAddress: z.string().default(""),
  notes: z.string().optional().or(z.literal("")),
  estimatedDeliveryDate: z.string().optional().or(z.literal("")),
  trackingNumber: z.string().optional().or(z.literal("")),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export const RentalSchema = z.object({
  id: z.string(),
  productId: z.string(),
  productName: z.string(),
  customerEmail: z.string().email(),
  customerName: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  status: RentalStatusSchema.default("upcoming"),
  reminderSent: z.boolean().default(false),
  notes: z.string().optional().or(z.literal("")),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const NotificationSchema = z.object({
  id: z.string(),
  type: NotificationTypeSchema,
  title: z.string(),
  message: z.string(),
  recipientEmail: z.string().email(),
  isAdmin: z.boolean().default(false),
  relatedEntity: z.enum(["Order", "Rental", "Product", "User"]).optional(),
  relatedEntityId: z.string().optional(),
  read: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  fullName: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  companyName: z.string().optional().or(z.literal("")),
  role: UserRoleSchema.default("user"),
  customerSegment: CustomerSegmentSchema.default("new"),
  acquisitionSource: AcquisitionSourceSchema.optional(),
  addresses: z.array(AddressSchema).default([]),
  adminSettings: AdminSettingsSchema.optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const CreateProductInputSchema = ProductSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  description: true,
  imageUrl: true,
  weight: true,
  stockStatus: true,
  stockQuantity: true,
  lowStockThreshold: true,
});

export const UpdateProductInputSchema = CreateProductInputSchema.partial();

export const CreateOrderInputSchema = z.object({
  customerEmail: z.string().email(),
  customerName: z.string().optional(),
  items: z.array(OrderItemSchema).min(1),
  paymentMethod: PaymentMethodSchema.default("bank_transfer"),
  deliveryAddress: z.string().min(3),
  notes: z.string().optional(),
});

export const UpdateOrderInputSchema = z.object({
  status: OrderStatusSchema.optional(),
  paymentStatus: PaymentStatusSchema.optional(),
  paymentMethod: PaymentMethodSchema.optional(),
  estimatedDeliveryDate: z.string().optional(),
  trackingNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const CreateRentalInputSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  customerEmail: z.string().email(),
  customerName: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  notes: z.string().optional(),
});

export const UpdateRentalInputSchema = z.object({
  status: RentalStatusSchema.optional(),
  reminderSent: z.boolean().optional(),
  notes: z.string().optional(),
});

export type Address = z.infer<typeof AddressSchema>;
export type AdminSettings = z.infer<typeof AdminSettingsSchema>;
export type AcquisitionSource = z.infer<typeof AcquisitionSourceSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type ProductCategory = z.infer<typeof ProductCategorySchema>;
export type ProductStatus = z.infer<typeof ProductStatusSchema>;
export type CreateProductInput = z.infer<typeof CreateProductInputSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductInputSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type OrderStatus = z.infer<typeof OrderStatusSchema>;
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>;
export type UpdateOrderInput = z.infer<typeof UpdateOrderInputSchema>;
export type Rental = z.infer<typeof RentalSchema>;
export type RentalStatus = z.infer<typeof RentalStatusSchema>;
export type CreateRentalInput = z.infer<typeof CreateRentalInputSchema>;
export type UpdateRentalInput = z.infer<typeof UpdateRentalInputSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type NotificationType = z.infer<typeof NotificationTypeSchema>;
export type User = z.infer<typeof UserSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type CustomerSegment = z.infer<typeof CustomerSegmentSchema>;

export const orderStatusLabels: Record<OrderStatus, string> = {
  preparing: "Preparing",
  in_transit: "In transit",
  delivered: "Delivered",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  bank_transfer: "Bank transfer",
  credit_card: "Credit card",
  paypal: "PayPal",
  cash_on_delivery: "Cash on delivery",
};

export const customerSegmentLabels: Record<CustomerSegment, string> = {
  new: "New",
  regular: "Regular",
  vip: "VIP",
  lapsed: "Lapsed",
  at_risk: "At risk",
};

export function calculateOrderTotal(items: Pick<OrderItem, "subtotal">[]) {
  return Number(items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
}

export function createOrderNumber(now = Date.now()) {
  return `HC${now.toString().slice(-8)}`;
}

export function calculateOrderItems(products: Product[], quantities: Record<string, number>) {
  return Object.entries(quantities).flatMap(([productId, quantity]) => {
    const product = products.find((item) => item.id === productId);
    if (!product || quantity < 1) return [];
    return [{
      productId: product.id,
      productName: product.name,
      quantity,
      price: product.price,
      subtotal: Number((product.price * quantity).toFixed(2)),
    }];
  });
}
