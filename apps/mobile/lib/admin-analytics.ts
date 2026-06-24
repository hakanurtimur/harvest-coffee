import { Order, OrderStatus, Product, Rental } from "@harvest/domain";

export function getTopProducts(orders: Order[]) {
  const products = new Map<string, { name: string; quantity: number; revenue: number }>();
  orders.forEach((order) => {
    order.items.forEach((item) => {
      const current = products.get(item.productName) ?? { name: item.productName, quantity: 0, revenue: 0 };
      current.quantity += item.quantity;
      current.revenue += item.subtotal;
      products.set(item.productName, current);
    });
  });
  return [...products.values()].sort((a, b) => b.quantity - a.quantity);
}

export function getTopCustomers(orders: Order[]) {
  const customers = new Map<string, { email: string; orderCount: number; pendingPayment: number; totalSpent: number }>();
  orders.forEach((order) => {
    const customerKey = order.customerEmail || order.createdById || "unknown-customer";
    const current = customers.get(customerKey) ?? {
      email: order.customerEmail || customerKey,
      orderCount: 0,
      pendingPayment: 0,
      totalSpent: 0,
    };
    current.orderCount += 1;
    current.totalSpent += order.totalAmount;
    if (order.paymentStatus === "pending") current.pendingPayment += order.totalAmount;
    customers.set(customerKey, current);
  });
  return [...customers.values()].sort((a, b) => b.totalSpent - a.totalSpent);
}

export function getStatusStats(orders: Order[]) {
  const statuses: OrderStatus[] = ["preparing", "in_transit", "delivered"];
  return statuses.map((status) => {
    const statusOrders = orders.filter((order) => order.status === status);
    return {
      status,
      count: statusOrders.length,
      revenue: statusOrders.reduce((sum, order) => sum + order.totalAmount, 0),
    };
  });
}

export function getCategorySales(orders: Order[], products: Product[]) {
  const productCategory = new Map(products.map((product) => [product.id, product.category || "Accessories"]));
  const categories = new Map<string, { category: string; quantity: number; revenue: number }>();

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const category = productCategory.get(item.productId) ?? "Accessories";
      const current = categories.get(category) ?? { category, quantity: 0, revenue: 0 };
      current.quantity += item.quantity;
      current.revenue += item.subtotal;
      categories.set(category, current);
    });
  });

  return [...categories.values()].sort((a, b) => b.revenue - a.revenue);
}

export function getMonthlyOrderData(orders: Order[]) {
  const data = new Map<string, { count: number; month: string; revenue: number }>();
  orders.forEach((order) => {
    const month = new Date(order.createdAt).toLocaleString("en-US", { month: "short" });
    const current = data.get(month) ?? { month, count: 0, revenue: 0 };
    current.count += 1;
    current.revenue += order.totalAmount;
    data.set(month, current);
  });
  return [...data.values()].slice(-6);
}

export function getExpiringRentals(rentals: Rental[]) {
  const today = new Date();
  return rentals.filter((rental) => {
    const daysUntil = Math.floor((new Date(rental.endDate).getTime() - today.getTime()) / 86400000);
    return rental.status === "active" && daysUntil <= 3 && daysUntil > 0;
  });
}

export function getStockStatus(stockQuantity: number, lowStockThreshold: number): Product["stockStatus"] {
  if (stockQuantity <= 0) return "out_of_stock";
  if (stockQuantity <= lowStockThreshold) return "low_stock";
  return "in_stock";
}

export function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
