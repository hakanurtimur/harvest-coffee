import { getBase44Client } from "@/lib/harvest-api";

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
  mocked: boolean;
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
  generateRentalInvoice(input: RentalInvoiceInput): Promise<HarvestRentalInvoice & { mocked: boolean }>;
  onOrderCreated(input: OrderCreatedFunctionInput): Promise<HarvestIntegrationResult>;
  onOrderStatusChanged(input: OrderStatusChangedFunctionInput): Promise<HarvestIntegrationResult>;
  sendNotification(input: SendNotificationInput): Promise<HarvestIntegrationResult & { notificationId?: string }>;
  sendLowStockEmail(input: LowStockNotificationInput): Promise<HarvestIntegrationResult>;
  updateRentalStatus(): Promise<HarvestIntegrationResult & { updatedCount?: number }>;
}

export function getHarvestIntegrations(): HarvestIntegrations {
  const base44 = getBase44Client();
  if (base44) return createBase44HarvestIntegrations(base44 as Base44FunctionClientLike);
  return mockHarvestIntegrations;
}

const nowIso = () => new Date().toISOString();

const mockHarvestIntegrations: HarvestIntegrations = {
  async checkRentalReminders() {
    return {
      message: "Rental reminder check is mocked for now; Base44 checkRentalReminders will be wired in live mode.",
      mocked: true,
      processed: 0,
    };
  },
  async generateProductDescription(input) {
    const productName = input.productName.trim();
    const context = [input.category, input.weight].filter(Boolean).join(" · ");
    return {
      description: `${productName} is prepared for professional coffee shops, cafes, and hospitality businesses. It is selected for reliable service, practical stock handling, and consistent quality across busy service periods.${context ? ` ${context} keeps the product easy to plan into recurring B2B orders.` : ""}`,
      message: "AI description is mocked for now; Base44 InvokeLLM will be wired later.",
      mocked: true,
    };
  },
  async generateRentalInvoice(input) {
    const start = Date.parse(input.startDate);
    const end = Date.parse(input.endDate);
    const rentalDays = Number.isNaN(start) || Number.isNaN(end)
      ? 0
      : Math.max(1, Math.ceil((end - start) / 86400000));

    return {
      customerEmail: input.customerEmail,
      customerName: input.customerName,
      date: nowIso().slice(0, 10),
      invoiceNumber: `INV-${input.rentalId.slice(0, 8).toUpperCase()}`,
      mocked: true,
      productName: input.productName,
      rentalDays,
      totalAmount: input.totalAmount,
    };
  },
  async onOrderCreated() {
    return {
      message: "Order created function is mocked for now; Base44 onOrderCreated will be called in live mode.",
      mocked: true,
    };
  },
  async onOrderStatusChanged() {
    return {
      message: "Order status changed function is mocked for now; Base44 onOrderStatusChanged will be called in live mode.",
      mocked: true,
    };
  },
  async sendNotification(input) {
    return {
      message: `Notification is mocked for now; Base44 sendNotification will be called in live mode. ${input.title}`,
      mocked: true,
      notificationId: `mock-${Date.now()}`,
    };
  },
  async sendLowStockEmail(input) {
    return {
      message: `Low stock email notification is mocked for now; Base44 SendEmail will be wired later. ${input.productName} is at ${input.stockQuantity}/${input.lowStockThreshold}.`,
      mocked: true,
    };
  },
  async updateRentalStatus() {
    return {
      message: "Rental status update is mocked for now; Base44 updateRentalStatus will be called in live mode.",
      mocked: true,
      updatedCount: 0,
    };
  },
};

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
        mocked: false,
        processed: data.processed,
      };
    },
    async generateProductDescription(input) {
      return {
        description: `${input.productName} is prepared for professional coffee shops, cafes, and hospitality businesses.`,
        message: "AI description remains local until a matching Base44 function exists.",
        mocked: true,
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
        mocked: false,
        productName: stringFromUnknown(rental.product, input.productName),
        rentalDays: numberFromUnknown(rental.days, calculateRentalDays(input.startDate, input.endDate)),
        totalAmount,
      };
    },
    async onOrderCreated(input) {
      const data = await invokeBase44Function<RawRecord>(base44, "onOrderCreated", input as unknown as RawRecord);
      return {
        message: stringFromUnknown(data.message, "Order created function completed."),
        mocked: false,
      };
    },
    async onOrderStatusChanged(input) {
      const data = await invokeBase44Function<RawRecord>(base44, "onOrderStatusChanged", input as unknown as RawRecord);
      return {
        message: stringFromUnknown(data.message, "Order status changed function completed."),
        mocked: false,
      };
    },
    async sendNotification(input) {
      const data = await invokeBase44Function<{ notificationId?: string; success?: boolean }>(base44, "sendNotification", input as unknown as RawRecord);
      return {
        message: data.success === false ? "Notification function returned without success." : "Notification function completed.",
        mocked: false,
        notificationId: data.notificationId,
      };
    },
    async sendLowStockEmail(input) {
      return {
        message: `Low stock email notification remains mocked until an admin recipient is provided. ${input.productName} is at ${input.stockQuantity}/${input.lowStockThreshold}.`,
        mocked: true,
      };
    },
    async updateRentalStatus() {
      const data = await invokeBase44Function<{ updatedCount?: number; success?: boolean }>(base44, "updateRentalStatus", {});
      return {
        message: data.success === false ? "Rental status update returned without success." : "Rental status update completed.",
        mocked: false,
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
