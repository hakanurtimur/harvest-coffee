import { getBase44Client, getHarvestAccessToken } from "@/lib/harvest-api";

type RawRecord = Record<string, unknown>;

export interface GenerateProductDescriptionInput {
  category?: string;
  productName: string;
  weight?: string;
}

export interface LowStockNotificationInput {
  lowStockThreshold: number;
  productName: string;
  stockQuantity: number;
}

export interface RentalInvoiceInput {
  customerEmail: string;
  customerName?: string;
  endDate: string;
  productName: string;
  rentalId: string;
  startDate: string;
  totalAmount?: number;
}

export interface SendNotificationInput {
  isAdmin?: boolean;
  message: string;
  recipientEmail: string;
  relatedEntity?: "Order" | "Rental" | "Product" | "User";
  relatedEntityId?: string;
  title: string;
  type: "order_created" | "order_status" | "rental_expiring" | "low_stock" | "new_order_admin";
}

export interface OrderCreatedFunctionInput {
  data: RawRecord;
}

export interface OrderStatusChangedFunctionInput {
  data: RawRecord;
  event?: string;
  old_data?: RawRecord;
}

export interface HarvestIntegrationResult {
  message: string;
}

export interface HarvestRentalInvoice {
  customerEmail: string;
  customerName?: string;
  date: string;
  invoiceNumber: string;
  productName: string;
  rentalDays: number;
  totalAmount?: number;
}

export interface HarvestIntegrations {
  checkRentalReminders(): Promise<HarvestIntegrationResult & { processed?: number }>;
  generateProductDescription(input: GenerateProductDescriptionInput): Promise<HarvestIntegrationResult & { description: string }>;
  generateRentalInvoice(input: RentalInvoiceInput): Promise<HarvestRentalInvoice>;
  onOrderCreated(input: OrderCreatedFunctionInput): Promise<HarvestIntegrationResult>;
  onOrderStatusChanged(input: OrderStatusChangedFunctionInput): Promise<HarvestIntegrationResult>;
  sendNotification(input: SendNotificationInput): Promise<HarvestIntegrationResult & { notificationId?: string }>;
  sendLowStockEmail(input: LowStockNotificationInput): Promise<HarvestIntegrationResult>;
  updateRentalStatus(): Promise<HarvestIntegrationResult & { updatedCount?: number }>;
}

export function getHarvestIntegrations(): HarvestIntegrations {
  const base44 = getBase44Client();
  if (base44) return createBase44HarvestIntegrations(base44 as Base44FunctionClientLike);
  return createProxyHarvestIntegrations();
}

const nowIso = () => new Date().toISOString();

interface Base44FunctionClientLike {
  functions: {
    invoke(functionName: string, data?: RawRecord): Promise<unknown>;
  };
}

function createBase44HarvestIntegrations(base44: Base44FunctionClientLike): HarvestIntegrations {
  return {
    async checkRentalReminders() {
      const data = await invokeBase44Function<{ processed?: number; success?: boolean }>(base44, "checkRentalReminders", {});
      return {
        message: data.success === false ? "Rental reminder check returned without success." : "Rental reminder check completed.",
        processed: data.processed,
      };
    },
    async generateProductDescription(input) {
      const data = await invokeBase44Function<RawRecord>(base44, "generateProductDescription", input as unknown as RawRecord);
      return {
        description: stringFromUnknown(data.description),
        message: stringFromUnknown(data.message, "Product description generated."),
      };
    },
    async generateRentalInvoice(input) {
      const data = await invokeBase44Function<RawRecord>(base44, "generateRentalInvoice", { rentalId: input.rentalId });
      const customer = readRecord(data.customer);
      const rental = readRecord(data.rental);
      const totalAmount = numberFromUnknown(data.totalAmount, input.totalAmount);
      return {
        customerEmail: stringFromUnknown(customer.email, input.customerEmail),
        customerName: stringFromUnknown(customer.name, input.customerName),
        date: stringFromUnknown(data.date, nowIso().slice(0, 10)),
        invoiceNumber: stringFromUnknown(data.invoiceNumber, `INV-${input.rentalId.slice(0, 8).toUpperCase()}`),
        productName: stringFromUnknown(rental.product, input.productName),
        rentalDays: numberFromUnknown(rental.days, calculateRentalDays(input.startDate, input.endDate)),
        totalAmount,
      };
    },
    async onOrderCreated(input) {
      const data = await invokeBase44Function<RawRecord>(base44, "onOrderCreated", input as unknown as RawRecord);
      return {
        message: stringFromUnknown(data.message, "Order created function completed."),
      };
    },
    async onOrderStatusChanged(input) {
      const data = await invokeBase44Function<RawRecord>(base44, "onOrderStatusChanged", input as unknown as RawRecord);
      return {
        message: stringFromUnknown(data.message, "Order status changed function completed."),
      };
    },
    async sendNotification(input) {
      const data = await invokeBase44Function<{ notificationId?: string; success?: boolean }>(base44, "sendNotification", input as unknown as RawRecord);
      return {
        message: data.success === false ? "Notification function returned without success." : "Notification function completed.",
        notificationId: data.notificationId,
      };
    },
    async sendLowStockEmail(input) {
      const data = await invokeBase44Function<RawRecord>(base44, "sendLowStockEmail", input as unknown as RawRecord);
      return {
        message: stringFromUnknown(data.message, "Low stock email notification completed."),
      };
    },
    async updateRentalStatus() {
      const data = await invokeBase44Function<{ updatedCount?: number; success?: boolean }>(base44, "updateRentalStatus", {});
      return {
        message: data.success === false ? "Rental status update returned without success." : "Rental status update completed.",
        updatedCount: data.updatedCount,
      };
    },
  };
}

function createProxyHarvestIntegrations(): HarvestIntegrations {
  return {
    async checkRentalReminders() {
      const data = await invokeHarvestProxyFunction<{ processed?: number; success?: boolean }>("checkRentalReminders", {});
      return {
        message: data.success === false ? "Rental reminder check returned without success." : "Rental reminder check completed.",
        processed: data.processed,
      };
    },
    async generateProductDescription(input) {
      const data = await invokeHarvestProxyFunction<RawRecord>("generateProductDescription", input as unknown as RawRecord);
      return {
        description: stringFromUnknown(data.description),
        message: stringFromUnknown(data.message, "Product description generated."),
      };
    },
    async generateRentalInvoice(input) {
      const data = await invokeHarvestProxyFunction<RawRecord>("generateRentalInvoice", { rentalId: input.rentalId });
      const customer = readRecord(data.customer);
      const rental = readRecord(data.rental);
      const totalAmount = numberFromUnknown(data.totalAmount, input.totalAmount);
      return {
        customerEmail: stringFromUnknown(customer.email, input.customerEmail),
        customerName: stringFromUnknown(customer.name, input.customerName),
        date: stringFromUnknown(data.date, nowIso().slice(0, 10)),
        invoiceNumber: stringFromUnknown(data.invoiceNumber, `INV-${input.rentalId.slice(0, 8).toUpperCase()}`),
        productName: stringFromUnknown(rental.product, input.productName),
        rentalDays: numberFromUnknown(rental.days, calculateRentalDays(input.startDate, input.endDate)),
        totalAmount,
      };
    },
    async onOrderCreated(input) {
      const data = await invokeHarvestProxyFunction<RawRecord>("onOrderCreated", input as unknown as RawRecord);
      return {
        message: stringFromUnknown(data.message, "Order created function completed."),
      };
    },
    async onOrderStatusChanged(input) {
      const data = await invokeHarvestProxyFunction<RawRecord>("onOrderStatusChanged", input as unknown as RawRecord);
      return {
        message: stringFromUnknown(data.message, "Order status changed function completed."),
      };
    },
    async sendNotification(input) {
      const data = await invokeHarvestProxyFunction<{ notificationId?: string; success?: boolean }>("sendNotification", input as unknown as RawRecord);
      return {
        message: data.success === false ? "Notification function returned without success." : "Notification function completed.",
        notificationId: data.notificationId,
      };
    },
    async sendLowStockEmail(input) {
      const data = await invokeHarvestProxyFunction<RawRecord>("sendLowStockEmail", input as unknown as RawRecord);
      return {
        message: stringFromUnknown(data.message, "Low stock email notification completed."),
      };
    },
    async updateRentalStatus() {
      const data = await invokeHarvestProxyFunction<{ updatedCount?: number; success?: boolean }>("updateRentalStatus", {});
      return {
        message: data.success === false ? "Rental status update returned without success." : "Rental status update completed.",
        updatedCount: data.updatedCount,
      };
    },
  };
}

async function invokeBase44Function<T extends RawRecord = RawRecord>(
  base44: Base44FunctionClientLike,
  functionName: string,
  payload: RawRecord,
): Promise<T> {
  const result = await base44.functions.invoke(functionName, payload);
  return unwrapFunctionResult(result) as T;
}

async function invokeHarvestProxyFunction<T extends RawRecord = RawRecord>(
  action: string,
  input: RawRecord,
): Promise<T> {
  const response = await fetch(process.env.NEXT_PUBLIC_HARVEST_API_URL || "/api/harvest", {
    body: JSON.stringify({
      action,
      input,
      token: getHarvestAccessToken() ?? undefined,
    }),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });
  const payload = await response.json().catch(() => ({}));
  const row = readRecord(payload);

  if (!response.ok) {
    throw new Error(stringFromUnknown(row.error, `Harvest proxy function failed: ${action}`));
  }

  return readRecord(row.data) as T;
}

function unwrapFunctionResult(result: unknown) {
  const row = readRecord(result);
  if ("data" in row) return readRecord(row.data);
  return row;
}

function readRecord(value: unknown): RawRecord {
  return value && typeof value === "object" ? value as RawRecord : {};
}

function stringFromUnknown(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function numberFromUnknown(value: unknown, fallback = 0) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function calculateRentalDays(startDate: string, endDate: string) {
  const start = Date.parse(startDate);
  const end = Date.parse(endDate);
  return Number.isNaN(start) || Number.isNaN(end)
    ? 0
    : Math.max(1, Math.ceil((end - start) / 86400000));
}
