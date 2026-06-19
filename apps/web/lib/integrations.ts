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

export interface HarvestIntegrationResult {
  message: string;
  mocked: boolean;
}

export interface HarvestIntegrations {
  generateProductDescription(input: GenerateProductDescriptionInput): Promise<HarvestIntegrationResult & { description: string }>;
  sendLowStockEmail(input: LowStockNotificationInput): Promise<HarvestIntegrationResult>;
}

export function getHarvestIntegrations(): HarvestIntegrations {
  return mockHarvestIntegrations;
}

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
  async sendLowStockEmail(input) {
    return {
      message: `Low stock email notification is mocked for now; Base44 SendEmail will be wired later. ${input.productName} is at ${input.stockQuantity}/${input.lowStockThreshold}.`,
      mocked: true,
    };
  },
};
