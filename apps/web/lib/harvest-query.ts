"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getHarvestApi, hasHarvestSession } from "@/lib/harvest-api";
import type {
  CreateOrderInput,
  CreateProductInput,
  CreateRentalInput,
  Notification,
  Order,
  Product,
  Rental,
  UpdateOrderInput,
  UpdateProductInput,
  UpdateRentalInput,
  User,
} from "@/lib/domain";

export const harvestQueryKeys = {
  currentUser: ["harvest", "currentUser"] as const,
  products: ["harvest", "products"] as const,
  orders: ["harvest", "orders"] as const,
  myOrders: ["harvest", "orders", "mine"] as const,
  order: (id: string) => ["harvest", "orders", id] as const,
  orderByNumber: (orderNumber: string) => ["harvest", "orders", "number", orderNumber] as const,
  rentals: ["harvest", "rentals"] as const,
  users: ["harvest", "users"] as const,
  notifications: ["harvest", "notifications"] as const,
};

export function useCurrentUserQuery() {
  return useQuery({
    queryKey: harvestQueryKeys.currentUser,
    queryFn: () => getHarvestApi().getCurrentUser(),
    enabled: hasHarvestSession(),
    staleTime: 60_000,
  });
}

export function useProductsQuery() {
  return useQuery({
    queryKey: harvestQueryKeys.products,
    queryFn: () => getHarvestApi().getProducts(),
  });
}

export function useMyOrdersQuery() {
  const currentUserQuery = useCurrentUserQuery();

  return useQuery({
    queryKey: harvestQueryKeys.myOrders,
    queryFn: async () => {
      const user = currentUserQuery.data ?? await getHarvestApi().getCurrentUser();
      if (!user?.email) throw new Error("Please sign in to view your orders.");
      const orders = await getHarvestApi().getMyOrders(user.email);
      return sortOrders(orders);
    },
    enabled: currentUserQuery.isSuccess && Boolean(currentUserQuery.data?.email),
  });
}

export function useOrdersQuery() {
  return useQuery({
    queryKey: harvestQueryKeys.orders,
    queryFn: async () => sortOrders(await getHarvestApi().getOrders()),
  });
}

export function useOrderQuery(orderId: string) {
  return useQuery({
    queryKey: harvestQueryKeys.order(orderId),
    queryFn: () => getHarvestApi().getOrder(orderId),
    enabled: Boolean(orderId),
  });
}

export function useOrderByNumberQuery(orderNumber: string) {
  return useQuery({
    queryKey: harvestQueryKeys.orderByNumber(orderNumber),
    queryFn: () => getHarvestApi().getOrderByNumber(orderNumber),
    enabled: Boolean(orderNumber),
  });
}

export function useAdminDashboardQuery() {
  return useQuery({
    queryKey: ["harvest", "adminDashboard"] as const,
    queryFn: async () => {
      const [orders, products, users] = await Promise.all([
        getHarvestApi().getOrders(),
        getHarvestApi().getProducts(),
        getHarvestApi().getUsers(),
      ]);
      return {
        orders: sortOrders(orders),
        products,
        users,
      };
    },
  });
}

export function useRentalsQuery(customerEmail?: string) {
  return useQuery({
    queryKey: customerEmail ? ["harvest", "rentals", customerEmail] as const : harvestQueryKeys.rentals,
    queryFn: () => getHarvestApi().getRentals(customerEmail),
  });
}

export function useMyRentalsQuery() {
  const currentUserQuery = useCurrentUserQuery();

  return useQuery({
    queryKey: ["harvest", "rentals", "mine"] as const,
    queryFn: async () => {
      const user = currentUserQuery.data ?? await getHarvestApi().getCurrentUser();
      if (!user?.email) throw new Error("Please sign in to view rentals.");
      return getHarvestApi().getRentals(user.email);
    },
    enabled: currentUserQuery.isSuccess && Boolean(currentUserQuery.data?.email),
  });
}

export function useUsersQuery() {
  return useQuery({
    queryKey: harvestQueryKeys.users,
    queryFn: () => getHarvestApi().getUsers(),
  });
}

export function useNotificationsQuery() {
  const currentUserQuery = useCurrentUserQuery();

  return useQuery({
    queryKey: harvestQueryKeys.notifications,
    queryFn: async () => {
      const user = currentUserQuery.data ?? await getHarvestApi().getCurrentUser();
      const recipientEmail = user?.email ?? "admin@example.com";
      return getHarvestApi().getNotifications(recipientEmail, { includeAdmin: user?.role === "admin" });
    },
    enabled: currentUserQuery.isSuccess,
  });
}

export function useCreateOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrderInput) => getHarvestApi().createOrder(input),
    onSuccess: (order) => {
      queryClient.setQueryData(harvestQueryKeys.order(order.id), order);
      void queryClient.invalidateQueries({ queryKey: harvestQueryKeys.orders });
      void queryClient.invalidateQueries({ queryKey: harvestQueryKeys.myOrders });
      void queryClient.invalidateQueries({ queryKey: harvestQueryKeys.notifications });
    },
  });
}

export function useUpdateOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateOrderInput }) => getHarvestApi().updateOrder(id, input),
    onSuccess: (order) => {
      queryClient.setQueryData(harvestQueryKeys.order(order.id), order);
      updateOrderList(queryClient, harvestQueryKeys.orders, order);
      updateOrderList(queryClient, harvestQueryKeys.myOrders, order);
      void queryClient.invalidateQueries({ queryKey: harvestQueryKeys.orders });
      void queryClient.invalidateQueries({ queryKey: harvestQueryKeys.myOrders });
      void queryClient.invalidateQueries({ queryKey: harvestQueryKeys.notifications });
    },
  });
}

export function useCreateRentalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRentalInput) => getHarvestApi().createRental(input),
    onSuccess: (rental) => {
      addToList(queryClient, harvestQueryKeys.rentals, rental);
      void queryClient.invalidateQueries({ queryKey: harvestQueryKeys.rentals });
    },
  });
}

export function useUpdateRentalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRentalInput }) => getHarvestApi().updateRental(id, input),
    onSuccess: (rental) => {
      updateListItem(queryClient, harvestQueryKeys.rentals, rental);
      void queryClient.invalidateQueries({ queryKey: harvestQueryKeys.rentals });
    },
  });
}

export function useDeleteRentalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => getHarvestApi().deleteRental(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: harvestQueryKeys.rentals });
    },
  });
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProductInput) => getHarvestApi().createProduct(input),
    onSuccess: (product) => {
      addToList(queryClient, harvestQueryKeys.products, product);
      void queryClient.invalidateQueries({ queryKey: harvestQueryKeys.products });
    },
  });
}

export function useUploadProductImageMutation() {
  return useMutation({
    mutationFn: (file: File) => getHarvestApi().uploadProductImage(file),
  });
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProductInput }) => getHarvestApi().updateProduct(id, input),
    onSuccess: (product) => {
      updateListItem(queryClient, harvestQueryKeys.products, product);
      void queryClient.invalidateQueries({ queryKey: harvestQueryKeys.products });
    },
  });
}

export function useDeleteProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => getHarvestApi().deleteProduct(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: harvestQueryKeys.products });
    },
  });
}

export function useUpdateCurrentUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<User>) => getHarvestApi().updateCurrentUser(input),
    onSuccess: (user) => {
      queryClient.setQueryData(harvestQueryKeys.currentUser, user);
      updateListItem(queryClient, harvestQueryKeys.users, user);
    },
  });
}

export function useDeleteCurrentUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => getHarvestApi().deleteCurrentUser(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<User> }) => getHarvestApi().updateUser(id, input),
    onSuccess: (user) => {
      updateListItem(queryClient, harvestQueryKeys.users, user);
      void queryClient.invalidateQueries({ queryKey: harvestQueryKeys.users });
    },
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => getHarvestApi().markNotificationRead(id),
    onSuccess: (notification) => {
      updateListItem(queryClient, harvestQueryKeys.notifications, notification);
      void queryClient.invalidateQueries({ queryKey: harvestQueryKeys.notifications });
    },
  });
}

export function useDeleteNotificationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => getHarvestApi().deleteNotification(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: harvestQueryKeys.notifications });
    },
  });
}

function sortOrders(orders: Order[]) {
  return [...orders].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

function updateOrderList(
  queryClient: ReturnType<typeof useQueryClient>,
  queryKey: readonly unknown[],
  updatedOrder: Order,
) {
  queryClient.setQueryData<Order[]>(queryKey, (current) => (
    current ? sortOrders(current.map((order) => order.id === updatedOrder.id ? updatedOrder : order)) : current
  ));
}

function addToList<T extends { id: string }>(
  queryClient: ReturnType<typeof useQueryClient>,
  queryKey: readonly unknown[],
  item: T,
) {
  queryClient.setQueryData<T[]>(queryKey, (current) => current ? [item, ...current] : current);
}

function updateListItem<T extends { id: string }>(
  queryClient: ReturnType<typeof useQueryClient>,
  queryKey: readonly unknown[],
  updatedItem: T,
) {
  queryClient.setQueryData<T[]>(queryKey, (current) => (
    current ? current.map((item) => item.id === updatedItem.id ? updatedItem : item) : current
  ));
}
