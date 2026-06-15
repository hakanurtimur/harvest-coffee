import {
  AdminSettings,
  calculateOrderTotal,
  CreateOrderInput,
  CreateProductInput,
  CreateRentalInput,
  createOrderNumber,
  CustomerSegment,
  Notification,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Product,
  ProductStatus,
  Rental,
  RentalStatus,
  UpdateOrderInput,
  UpdateProductInput,
  UpdateRentalInput,
  User,
  UserRole,
} from "@harvest/domain";
import {
  createDemoNotifications,
  createDemoOrders,
  createDemoProducts,
  createDemoRentals,
  createDemoUsers,
} from "./fixtures";

type RawRecord = Record<string, unknown>;

export interface HarvestApi {
  getCurrentUser(): Promise<User | null>;
  updateCurrentUser(input: Partial<User>): Promise<User>;
  getProducts(): Promise<Product[]>;
  createProduct(input: CreateProductInput): Promise<Product>;
  updateProduct(id: string, input: UpdateProductInput): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  getMyOrders(customerEmail: string): Promise<Order[]>;
  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | null>;
  getOrderByNumber(orderNumber: string): Promise<Order | null>;
  createOrder(input: CreateOrderInput): Promise<Order>;
  updateOrder(id: string, input: UpdateOrderInput): Promise<Order>;
  getRentals(customerEmail?: string): Promise<Rental[]>;
  createRental(input: CreateRentalInput): Promise<Rental>;
  updateRental(id: string, input: UpdateRentalInput): Promise<Rental>;
  deleteRental(id: string): Promise<void>;
  getUsers(): Promise<User[]>;
  updateUser(id: string, input: Partial<User>): Promise<User>;
  getNotifications(recipientEmail: string): Promise<Notification[]>;
  markNotificationRead(id: string): Promise<Notification>;
  deleteNotification(id: string): Promise<void>;
}

export interface Base44ClientLike {
  auth?: {
    me(): Promise<RawRecord>;
    updateMe(data: RawRecord): Promise<RawRecord>;
  };
  entities: {
    Product: EntityClient;
    Order: EntityClient;
    Rental: EntityClient;
    Notification: EntityClient;
    User: EntityClient;
  };
}

interface EntityClient {
  list(order?: string): Promise<RawRecord[]>;
  filter(filter: RawRecord, order?: string): Promise<RawRecord[]>;
  create(data: RawRecord): Promise<RawRecord>;
  update(id: string, data: RawRecord): Promise<RawRecord>;
  delete(id: string): Promise<unknown>;
}

const nowIso = () => new Date().toISOString();

export function createMockHarvestApi(): HarvestApi {
  const demoProducts = createDemoProducts();
  let demoOrders = createDemoOrders();
  let demoRentals = createDemoRentals();
  let demoNotifications = createDemoNotifications();
  let demoUsers = createDemoUsers();

  return {
    async getCurrentUser() {
      return demoUsers[0] ?? null;
    },
    async updateCurrentUser(input) {
      if (!demoUsers[0]) throw new Error("User not found");
      demoUsers[0] = { ...demoUsers[0], ...input, updatedAt: nowIso() };
      return demoUsers[0];
    },
    async getProducts() {
      return demoProducts;
    },
    async createProduct(input) {
      const product: Product = {
        id: `product-${Date.now()}`,
        description: "",
        imageUrl: "",
        weight: "",
        stockStatus: "in_stock",
        stockQuantity: 0,
        lowStockThreshold: 10,
        ...input,
      };
      demoProducts.unshift(product);
      return product;
    },
    async updateProduct(id, input) {
      const index = demoProducts.findIndex((product) => product.id === id);
      if (index < 0) throw new Error("Product not found");
      demoProducts[index] = { ...demoProducts[index], ...input };
      return demoProducts[index];
    },
    async deleteProduct(id) {
      const index = demoProducts.findIndex((product) => product.id === id);
      if (index >= 0) demoProducts.splice(index, 1);
    },
    async getMyOrders(customerEmail) {
      return demoOrders.filter((order) => order.customerEmail === customerEmail);
    },
    async getOrders() {
      return demoOrders;
    },
    async getOrder(id) {
      return demoOrders.find((order) => order.id === id) ?? null;
    },
    async getOrderByNumber(orderNumber) {
      return demoOrders.find((order) => order.orderNumber === orderNumber) ?? null;
    },
    async createOrder(input) {
      const order: Order = {
        id: `order-${Date.now()}`,
        orderNumber: createOrderNumber(),
        customerEmail: input.customerEmail,
        customerName: input.customerName,
        items: input.items,
        totalAmount: calculateOrderTotal(input.items),
        status: "preparing",
        paymentStatus: "pending",
        paymentMethod: input.paymentMethod,
        deliveryAddress: input.deliveryAddress,
        notes: input.notes,
        createdAt: nowIso(),
      };

      demoOrders = [order, ...demoOrders];
      return order;
    },
    async updateOrder(id, input) {
      const index = demoOrders.findIndex((order) => order.id === id);
      if (index < 0) throw new Error("Order not found");
      demoOrders[index] = { ...demoOrders[index], ...input, updatedAt: nowIso() };
      return demoOrders[index];
    },
    async getRentals(customerEmail) {
      return customerEmail ? demoRentals.filter((rental) => rental.customerEmail === customerEmail) : demoRentals;
    },
    async createRental(input) {
      const rental: Rental = {
        id: `rental-${Date.now()}`,
        ...input,
        status: "upcoming",
        reminderSent: false,
        createdAt: nowIso(),
      };
      demoRentals = [rental, ...demoRentals];
      return rental;
    },
    async updateRental(id, input) {
      const index = demoRentals.findIndex((rental) => rental.id === id);
      if (index < 0) throw new Error("Rental not found");
      demoRentals[index] = { ...demoRentals[index], ...input, updatedAt: nowIso() };
      return demoRentals[index];
    },
    async deleteRental(id) {
      demoRentals = demoRentals.filter((rental) => rental.id !== id);
    },
    async getUsers() {
      return demoUsers;
    },
    async updateUser(id, input) {
      const index = demoUsers.findIndex((user) => user.id === id);
      if (index < 0) throw new Error("User not found");
      demoUsers[index] = { ...demoUsers[index], ...input, updatedAt: nowIso() };
      return demoUsers[index];
    },
    async getNotifications(recipientEmail) {
      return demoNotifications.filter((notification) => notification.recipientEmail === recipientEmail);
    },
    async markNotificationRead(id) {
      const index = demoNotifications.findIndex((notification) => notification.id === id);
      if (index < 0) throw new Error("Notification not found");
      demoNotifications[index] = { ...demoNotifications[index], read: true, updatedAt: nowIso() };
      return demoNotifications[index];
    },
    async deleteNotification(id) {
      demoNotifications = demoNotifications.filter((notification) => notification.id !== id);
    },
  };
}

export function createBase44HarvestApi(base44: Base44ClientLike): HarvestApi {
  return {
    async getCurrentUser() {
      if (!base44.auth) return null;
      return mapBase44User(await base44.auth.me());
    },
    async updateCurrentUser(input) {
      if (!base44.auth) throw new Error("Auth client is not available");
      return mapBase44User(await base44.auth.updateMe(toBase44UserUpdate(input)));
    },
    async getProducts() {
      return (await base44.entities.Product.list()).map(mapBase44Product);
    },
    async createProduct(input) {
      return mapBase44Product(await base44.entities.Product.create(toBase44ProductInput(input)));
    },
    async updateProduct(id, input) {
      return mapBase44Product(await base44.entities.Product.update(id, toBase44ProductInput(input)));
    },
    async deleteProduct(id) {
      await base44.entities.Product.delete(id);
    },
    async getMyOrders(customerEmail) {
      return (await base44.entities.Order.filter({ created_by: customerEmail }, "-created_date")).map(mapBase44Order);
    },
    async getOrders() {
      return (await base44.entities.Order.list("-created_date")).map(mapBase44Order);
    },
    async getOrder(id) {
      const orders = await base44.entities.Order.filter({ id });
      return orders[0] ? mapBase44Order(orders[0]) : null;
    },
    async getOrderByNumber(orderNumber) {
      const orders = await base44.entities.Order.filter({ order_number: orderNumber });
      return orders[0] ? mapBase44Order(orders[0]) : null;
    },
    async createOrder(input) {
      return mapBase44Order(await base44.entities.Order.create(toBase44OrderCreate(input)));
    },
    async updateOrder(id, input) {
      return mapBase44Order(await base44.entities.Order.update(id, toBase44OrderUpdate(input)));
    },
    async getRentals(customerEmail) {
      const records = customerEmail
        ? await base44.entities.Rental.filter({ customer_email: customerEmail }, "-created_date")
        : await base44.entities.Rental.list("-created_date");
      return records.map(mapBase44Rental);
    },
    async createRental(input) {
      return mapBase44Rental(await base44.entities.Rental.create(toBase44RentalCreate(input)));
    },
    async updateRental(id, input) {
      return mapBase44Rental(await base44.entities.Rental.update(id, toBase44RentalUpdate(input)));
    },
    async deleteRental(id) {
      await base44.entities.Rental.delete(id);
    },
    async getUsers() {
      return (await base44.entities.User.list()).map(mapBase44User);
    },
    async updateUser(id, input) {
      return mapBase44User(await base44.entities.User.update(id, toBase44UserUpdate(input)));
    },
    async getNotifications(recipientEmail) {
      return (await base44.entities.Notification.filter({ recipient_email: recipientEmail }, "-created_date")).map(mapBase44Notification);
    },
    async markNotificationRead(id) {
      return mapBase44Notification(await base44.entities.Notification.update(id, { read: true }));
    },
    async deleteNotification(id) {
      await base44.entities.Notification.delete(id);
    },
  };
}

export function createReadOnlyHarvestApi(api: HarvestApi): HarvestApi {
  const readOnlyError = () => {
    throw new Error("Harvest API is running in read-only mode. Write operations are disabled.");
  };

  return {
    getCurrentUser: api.getCurrentUser.bind(api),
    async updateCurrentUser() {
      return readOnlyError();
    },
    getProducts: api.getProducts.bind(api),
    async createProduct() {
      return readOnlyError();
    },
    async updateProduct() {
      return readOnlyError();
    },
    async deleteProduct() {
      return readOnlyError();
    },
    getMyOrders: api.getMyOrders.bind(api),
    getOrders: api.getOrders.bind(api),
    getOrder: api.getOrder.bind(api),
    getOrderByNumber: api.getOrderByNumber.bind(api),
    async createOrder() {
      return readOnlyError();
    },
    async updateOrder() {
      return readOnlyError();
    },
    getRentals: api.getRentals.bind(api),
    async createRental() {
      return readOnlyError();
    },
    async updateRental() {
      return readOnlyError();
    },
    async deleteRental() {
      return readOnlyError();
    },
    getUsers: api.getUsers.bind(api),
    async updateUser() {
      return readOnlyError();
    },
    getNotifications: api.getNotifications.bind(api),
    async markNotificationRead() {
      return readOnlyError();
    },
    async deleteNotification() {
      return readOnlyError();
    },
  };
}

export function mapBase44Product(product: RawRecord): Product {
  return {
    id: stringValue(product.id),
    name: stringValue(product.name),
    description: stringValue(product.description),
    price: numberValue(product.price),
    imageUrl: stringValue(product.image_url),
    category: stringValue(product.category, "Products"),
    weight: stringValue(product.weight),
    stockStatus: mapStockStatus(product.stock_status),
    stockQuantity: numberValue(product.stock_quantity),
    lowStockThreshold: numberValue(product.low_stock_threshold, 10),
    createdAt: optionalString(product.created_date),
    updatedAt: optionalString(product.updated_date),
  };
}

export function mapBase44Order(order: RawRecord): Order {
  const items = arrayValue(order.items).map(mapBase44OrderItem);
  return {
    id: stringValue(order.id),
    orderNumber: stringValue(order.order_number),
    customerEmail: stringValue(order.created_by ?? order.customer_email),
    customerName: optionalString(order.customer_name),
    items,
    totalAmount: numberValue(order.total_amount, calculateOrderTotal(items)),
    status: mapOrderStatus(order.status),
    paymentStatus: mapPaymentStatus(order.payment_status),
    paymentMethod: mapPaymentMethod(order.payment_method),
    deliveryAddress: stringValue(order.delivery_address),
    notes: optionalString(order.notes),
    estimatedDeliveryDate: optionalString(order.estimated_delivery_date),
    trackingNumber: optionalString(order.tracking_number),
    createdAt: stringValue(order.created_date, nowIso()),
    updatedAt: optionalString(order.updated_date),
  };
}

export function mapBase44Rental(rental: RawRecord): Rental {
  return {
    id: stringValue(rental.id),
    productId: stringValue(rental.product_id),
    productName: stringValue(rental.product_name),
    customerEmail: stringValue(rental.customer_email),
    customerName: optionalString(rental.customer_name),
    startDate: stringValue(rental.rental_start_date),
    endDate: stringValue(rental.rental_end_date),
    status: mapRentalStatus(rental.status),
    reminderSent: booleanValue(rental.reminder_sent),
    notes: optionalString(rental.notes),
    createdAt: optionalString(rental.created_date),
    updatedAt: optionalString(rental.updated_date),
  };
}

export function mapBase44Notification(notification: RawRecord): Notification {
  return {
    id: stringValue(notification.id),
    type: mapNotificationType(notification.type),
    title: stringValue(notification.title),
    message: stringValue(notification.message),
    recipientEmail: stringValue(notification.recipient_email),
    isAdmin: booleanValue(notification.is_admin),
    relatedEntity: mapRelatedEntity(notification.related_entity),
    relatedEntityId: optionalString(notification.related_entity_id),
    read: booleanValue(notification.read),
    createdAt: stringValue(notification.created_date, nowIso()),
    updatedAt: optionalString(notification.updated_date),
  };
}

export function mapBase44User(user: RawRecord): User {
  return {
    id: stringValue(user.id),
    email: stringValue(user.email),
    fullName: optionalString(user.full_name),
    companyName: optionalString(user.company_name),
    role: mapUserRole(user.role),
    customerSegment: mapCustomerSegment(user.customer_segment),
    addresses: arrayValue(user.addresses).map((address) => {
      const row = asRecord(address);
      return {
        title: stringValue(row.title),
        address: stringValue(row.address),
      };
    }),
    adminSettings: mapAdminSettings(user.admin_settings),
    createdAt: optionalString(user.created_date),
    updatedAt: optionalString(user.updated_date),
  };
}

export function toBase44ProductInput(input: Partial<Product>): RawRecord {
  return dropUndefined({
    name: input.name,
    description: input.description,
    price: input.price,
    image_url: input.imageUrl,
    category: input.category,
    weight: input.weight,
    stock_status: input.stockStatus,
    stock_quantity: input.stockQuantity,
    low_stock_threshold: input.lowStockThreshold,
  });
}

export function toBase44OrderCreate(input: CreateOrderInput): RawRecord {
  return {
    order_number: createOrderNumber(),
    items: input.items.map(toBase44OrderItem),
    total_amount: calculateOrderTotal(input.items),
    status: "preparing",
    payment_method: input.paymentMethod,
    payment_status: "pending",
    delivery_address: input.deliveryAddress,
    notes: input.notes,
  };
}

export function toBase44OrderUpdate(input: UpdateOrderInput): RawRecord {
  return dropUndefined({
    status: input.status,
    payment_status: input.paymentStatus,
    payment_method: input.paymentMethod,
    estimated_delivery_date: input.estimatedDeliveryDate,
    tracking_number: input.trackingNumber,
    notes: input.notes,
  });
}

export function toBase44RentalCreate(input: CreateRentalInput): RawRecord {
  return {
    product_id: input.productId,
    product_name: input.productName,
    rental_start_date: input.startDate,
    rental_end_date: input.endDate,
    customer_email: input.customerEmail,
    customer_name: input.customerName,
    status: "upcoming",
    reminder_sent: false,
    notes: input.notes,
  };
}

export function toBase44RentalUpdate(input: UpdateRentalInput): RawRecord {
  return dropUndefined({
    status: input.status,
    reminder_sent: input.reminderSent,
    notes: input.notes,
  });
}

export function toBase44UserUpdate(input: Partial<User>): RawRecord {
  return dropUndefined({
    email: input.email,
    full_name: input.fullName,
    company_name: input.companyName,
    role: input.role,
    customer_segment: input.customerSegment,
    addresses: input.addresses,
    admin_settings: input.adminSettings ? toBase44AdminSettings(input.adminSettings) : undefined,
  });
}

function mapBase44OrderItem(item: unknown): OrderItem {
  const row = asRecord(item);
  return {
    productId: stringValue(row.product_id ?? row.productId),
    productName: stringValue(row.product_name ?? row.productName),
    quantity: numberValue(row.quantity),
    price: numberValue(row.price),
    subtotal: numberValue(row.subtotal),
  };
}

function toBase44OrderItem(item: OrderItem): RawRecord {
  return {
    product_id: item.productId,
    product_name: item.productName,
    quantity: item.quantity,
    price: item.price,
    subtotal: item.subtotal,
  };
}

function mapAdminSettings(value: unknown): AdminSettings | undefined {
  if (!value || typeof value !== "object") return undefined;
  const settings = value as RawRecord;
  return {
    adminNotificationEmail: optionalString(settings.admin_notification_email) ?? "",
    rentalReminderDays: numberValue(settings.rental_reminder_days, 3),
    appName: stringValue(settings.app_name, "Harvest Coffee"),
  };
}

function toBase44AdminSettings(settings: AdminSettings): RawRecord {
  return {
    admin_notification_email: settings.adminNotificationEmail,
    rental_reminder_days: settings.rentalReminderDays,
    app_name: settings.appName,
  };
}

function mapStockStatus(value: unknown): ProductStatus {
  if (value === "low_stock" || value === "out_of_stock") return value;
  return "in_stock";
}

function mapOrderStatus(value: unknown): OrderStatus {
  if (value === "in_transit" || value === "delivered" || value === "cancelled") return value;
  return "preparing";
}

function mapPaymentStatus(value: unknown): PaymentStatus {
  if (value === "paid" || value === "failed") return value;
  return "pending";
}

function mapPaymentMethod(value: unknown): PaymentMethod {
  if (value === "credit_card" || value === "paypal" || value === "cash_on_delivery") return value;
  return "bank_transfer";
}

function mapRentalStatus(value: unknown): RentalStatus {
  if (value === "active" || value === "expired" || value === "cancelled") return value;
  return "upcoming";
}

function mapUserRole(value: unknown): UserRole {
  if (value === "admin" || value === "dealer") return value;
  return "user";
}

function mapCustomerSegment(value: unknown): CustomerSegment {
  if (value === "regular" || value === "vip" || value === "lapsed" || value === "at_risk") return value;
  return "new";
}

function mapNotificationType(value: unknown): Notification["type"] {
  if (
    value === "order_status" ||
    value === "rental_expiring" ||
    value === "low_stock" ||
    value === "new_order_admin"
  ) return value;
  return "order_created";
}

function mapRelatedEntity(value: unknown): Notification["relatedEntity"] {
  if (value === "Order" || value === "Rental" || value === "Product" || value === "User") return value;
  return undefined;
}

function asRecord(value: unknown): RawRecord {
  return value && typeof value === "object" ? value as RawRecord : {};
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function numberValue(value: unknown, fallback = 0): number {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function booleanValue(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function dropUndefined(record: RawRecord): RawRecord {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}
