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
  generateProductDescription(input: GenerateProductDescriptionInput): Promise<HarvestIntegrationResult & { description: string }>;
  generateRentalInvoice(input: RentalInvoiceInput): Promise<HarvestRentalInvoice & { mocked: boolean }>;
  sendLowStockEmail(input: LowStockNotificationInput): Promise<HarvestIntegrationResult>;
}

export function getHarvestIntegrations(): HarvestIntegrations {
  return mockHarvestIntegrations;
}

const nowIso = () => new Date().toISOString();

const mockHarvestIntegrations: HarvestIntegrations = {
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
  async sendLowStockEmail(input) {
    return {
      message: `Low stock email notification is mocked for now; Base44 SendEmail will be wired later. ${input.productName} is at ${input.stockQuantity}/${input.lowStockThreshold}.`,
      mocked: true,
    };
  },
};
