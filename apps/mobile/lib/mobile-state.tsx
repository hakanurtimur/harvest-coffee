import { createProxyHarvestApi, HarvestApi } from "@harvest/api";
import {
  AdminSettings,
  CreateProductInput,
  CreateOrderInput,
  CreateRentalInput,
  Notification as HarvestNotification,
  Order,
  Product,
  Rental,
  UpdateOrderInput,
  UpdateProductInput,
  UpdateRentalInput,
  User,
} from "@harvest/domain";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getHarvestProxyEndpoint } from "./live-api";

let mobileAccessToken: string | null = null;

const api = createMobileHarvestApi();
const BOOT_DELAY_MS = 950;

interface MobileState {
  api: HarvestApi;
  booting: boolean;
  cartItemCount: number;
  cartOpen: boolean;
  cartQuantities: Record<string, number>;
  currentUser: User | null;
  dataError: string | null;
  deliveryAddress: string;
  isAuthenticated: boolean;
  lastSyncedAt: string | null;
  loadingData: boolean;
  notifications: HarvestNotification[];
  orders: Order[];
  products: Product[];
  rentals: Rental[];
  users: User[];
  addAddress(title: string, address: string): Promise<void>;
  clearCart(): void;
  closeCart(): void;
  createProduct(input: CreateProductInput): Promise<Product>;
  createOrder(input: CreateOrderInput): Promise<Order>;
  createRental(input: CreateRentalInput): Promise<Rental>;
  deleteAddress(index: number): Promise<void>;
  deleteNotification(id: string): Promise<void>;
  deleteProduct(id: string): Promise<void>;
  deleteRental(id: string): Promise<void>;
  completeLiveLogin(accessToken: string): Promise<void>;
  logout(): void;
  markNotificationRead(id: string): Promise<void>;
  openCart(): void;
  refreshAdminData(userOverride?: User): Promise<void>;
  refreshDealerData(userOverride?: User): Promise<void>;
  saveAdminSettings(settings: AdminSettings): Promise<User>;
  setDeliveryAddress(address: string): void;
  setProductQuantity(productId: string, quantity: number): void;
  updateCartQuantity(productId: string, delta: number): void;
  updateOrder(id: string, input: UpdateOrderInput): Promise<Order>;
  updateAddress(index: number, title: string, address: string): Promise<void>;
  updateProduct(id: string, input: UpdateProductInput): Promise<Product>;
  updateRental(id: string, input: UpdateRentalInput): Promise<Rental>;
  updateUser(id: string, input: Partial<User>): Promise<User>;
}

const MobileStateContext = createContext<MobileState | null>(null);

export function MobileStateProvider({ children }: { children: ReactNode }) {
  const [booting, setBooting] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [notifications, setNotifications] = useState<HarvestNotification[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const cartItemCount = useMemo(
    () => Object.values(cartQuantities).reduce((sum, quantity) => sum + quantity, 0),
    [cartQuantities],
  );

  const updateCartQuantity = useCallback((productId: string, delta: number) => {
    setCartQuantities((current) => {
      const nextQuantity = Math.max(0, (current[productId] ?? 0) + delta);
      const next = { ...current };
      if (nextQuantity === 0) delete next[productId];
      else next[productId] = nextQuantity;
      return next;
    });
  }, []);

  const setProductQuantity = useCallback((productId: string, quantity: number) => {
    setCartQuantities((current) => {
      const next = { ...current };
      if (quantity <= 0) delete next[productId];
      else next[productId] = quantity;
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCartQuantities({});
  }, []);

  const openCart = useCallback(() => {
    setCartOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    setCartOpen(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setBooting(false), BOOT_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const refreshDealerData = useCallback(async (userOverride?: User) => {
    const user = userOverride ?? currentUser;
    if (!user) return;

    setLoadingData(true);
    try {
      setDataError(null);
      const [nextProducts, nextOrders, nextRentals, nextNotifications] = await Promise.all([
        api.getProducts(),
        api.getMyOrders(user.email),
        api.getRentals(user.email),
        api.getNotifications(user.email),
      ]);

      setProducts(nextProducts);
      setOrders([...nextOrders].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)));
      setRentals([...nextRentals].sort((a, b) => Date.parse(b.startDate) - Date.parse(a.startDate)));
      setNotifications([...nextNotifications].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)));
      setLastSyncedAt(new Date().toISOString());
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "Dealer data could not be refreshed.");
      throw error;
    } finally {
      setLoadingData(false);
    }
  }, [currentUser]);

  const refreshAdminData = useCallback(async (userOverride?: User) => {
    const user = userOverride ?? currentUser;
    if (!user) return;

    setLoadingData(true);
    try {
      setDataError(null);
      const [nextProducts, nextOrders, nextRentals, nextNotifications, nextUsers] = await Promise.all([
        api.getProducts(),
        api.getOrders(),
        api.getRentals(),
        api.getNotifications(user.email, { includeAdmin: true }),
        api.getUsers(),
      ]);

      setProducts(nextProducts);
      setOrders([...nextOrders].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)));
      setRentals([...nextRentals].sort((a, b) => Date.parse(b.startDate) - Date.parse(a.startDate)));
      setNotifications([...nextNotifications].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)));
      setUsers(nextUsers);
      setLastSyncedAt(new Date().toISOString());
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "Admin data could not be refreshed.");
      throw error;
    } finally {
      setLoadingData(false);
    }
  }, [currentUser]);

  const completeLiveLogin = useCallback(async (accessToken: string) => {
    setLoadingData(true);
    try {
      mobileAccessToken = accessToken;
      const user = await api.getCurrentUser();
      if (!user) throw new Error("Base44 session could not be resolved.");
      setCurrentUser(user);
      setDeliveryAddress(user.addresses[0]?.address ?? "");
      try {
        if (user.role === "admin") await refreshAdminData(user);
        else await refreshDealerData(user);
      } catch {
        // The session is valid if Base44 resolved the user. Keep the user signed in
        // and surface workspace data failures through dataError instead of failing auth.
      }
    } finally {
      setLoadingData(false);
    }
  }, [refreshAdminData, refreshDealerData]);

  const logout = useCallback(() => {
    mobileAccessToken = null;
    setCurrentUser(null);
    setCartOpen(false);
    setCartQuantities({});
    setProducts([]);
    setOrders([]);
    setRentals([]);
    setNotifications([]);
    setUsers([]);
    setDeliveryAddress("");
    setDataError(null);
    setLastSyncedAt(null);
  }, []);

  const createOrder = useCallback(async (input: CreateOrderInput) => {
    const order = await api.createOrder(input);
    await refreshDealerData();
    return order;
  }, [refreshDealerData]);

  const createRental = useCallback(async (input: CreateRentalInput) => {
    const rental = await api.createRental(input);
    if (currentUser?.role === "admin") await refreshAdminData();
    else await refreshDealerData();
    return rental;
  }, [currentUser?.role, refreshAdminData, refreshDealerData]);

  const updateOrder = useCallback(async (id: string, input: UpdateOrderInput) => {
    const order = await api.updateOrder(id, input);
    if (currentUser?.role === "admin") await refreshAdminData();
    else await refreshDealerData();
    return order;
  }, [currentUser?.role, refreshAdminData, refreshDealerData]);

  const createProduct = useCallback(async (input: CreateProductInput) => {
    const product = await api.createProduct(input);
    await refreshAdminData();
    return product;
  }, [refreshAdminData]);

  const updateProduct = useCallback(async (id: string, input: UpdateProductInput) => {
    const product = await api.updateProduct(id, input);
    await refreshAdminData();
    return product;
  }, [refreshAdminData]);

  const deleteProduct = useCallback(async (id: string) => {
    await api.deleteProduct(id);
    await refreshAdminData();
  }, [refreshAdminData]);

  const updateRental = useCallback(async (id: string, input: UpdateRentalInput) => {
    const rental = await api.updateRental(id, input);
    if (currentUser?.role === "admin") await refreshAdminData();
    else await refreshDealerData();
    return rental;
  }, [currentUser?.role, refreshAdminData, refreshDealerData]);

  const deleteRental = useCallback(async (id: string) => {
    await api.deleteRental(id);
    if (currentUser?.role === "admin") await refreshAdminData();
    else await refreshDealerData();
  }, [currentUser?.role, refreshAdminData, refreshDealerData]);

  const updateUser = useCallback(async (id: string, input: Partial<User>) => {
    const user = await api.updateUser(id, input);
    setUsers((current) => current.map((item) => item.id === id ? user : item));
    if (currentUser?.id === id) setCurrentUser(user);
    return user;
  }, [currentUser?.id]);

  const saveAdminSettings = useCallback(async (settings: AdminSettings) => {
    if (!currentUser) throw new Error("Admin session is not active.");
    const user = { ...currentUser, adminSettings: settings, updatedAt: new Date().toISOString() };
    setCurrentUser(user);
    setUsers((current) => current.map((item) => item.id === user.id ? user : item));
    return user;
  }, [currentUser]);

  const addAddress = useCallback(async (title: string, address: string) => {
    if (!currentUser) return;
    const nextUser = await api.updateCurrentUser({
      addresses: [...currentUser.addresses, { title, address }],
    });
    setCurrentUser(nextUser);
    setDeliveryAddress(address);
  }, [currentUser]);

  const updateAddress = useCallback(async (index: number, title: string, address: string) => {
    if (!currentUser?.addresses[index]) return;
    const previousAddress = currentUser.addresses[index].address;
    const nextUser = await api.updateCurrentUser({
      addresses: currentUser.addresses.map((item, itemIndex) => (
        itemIndex === index ? { title, address } : item
      )),
    });
    setCurrentUser(nextUser);
    if (deliveryAddress === previousAddress) {
      setDeliveryAddress(address);
    }
  }, [currentUser, deliveryAddress]);

  const deleteAddress = useCallback(async (index: number) => {
    if (!currentUser) return;
    const nextUser = await api.updateCurrentUser({
      addresses: currentUser.addresses.filter((_, itemIndex) => itemIndex !== index),
    });
    setCurrentUser(nextUser);
    if (deliveryAddress === currentUser.addresses[index]?.address) {
      setDeliveryAddress(nextUser.addresses[0]?.address ?? "");
    }
  }, [currentUser, deliveryAddress]);

  const markNotificationRead = useCallback(async (id: string) => {
    await api.markNotificationRead(id);
    if (currentUser?.role === "admin") await refreshAdminData();
    else await refreshDealerData();
  }, [currentUser?.role, refreshAdminData, refreshDealerData]);

  const deleteNotification = useCallback(async (id: string) => {
    await api.deleteNotification(id);
    if (currentUser?.role === "admin") await refreshAdminData();
    else await refreshDealerData();
  }, [currentUser?.role, refreshAdminData, refreshDealerData]);

  const value = useMemo<MobileState>(() => ({
    api,
    addAddress,
    booting,
    cartItemCount,
    cartOpen,
    cartQuantities,
    clearCart,
    closeCart,
    createProduct,
    createOrder,
    createRental,
    currentUser,
    dataError,
    deleteAddress,
    deleteNotification,
    deleteProduct,
    deleteRental,
    deliveryAddress,
    isAuthenticated: Boolean(currentUser),
    lastSyncedAt,
    loadingData,
    completeLiveLogin,
    logout,
    markNotificationRead,
    notifications,
    openCart,
    orders,
    products,
    refreshAdminData,
    refreshDealerData,
    rentals,
    saveAdminSettings,
    setDeliveryAddress,
    setProductQuantity,
    updateAddress,
    updateOrder,
    updateCartQuantity,
    updateProduct,
    updateRental,
    updateUser,
    users,
  }), [
    addAddress,
    booting,
    cartItemCount,
    cartOpen,
    cartQuantities,
    clearCart,
    closeCart,
    createProduct,
    createOrder,
    createRental,
    currentUser,
    dataError,
    deleteAddress,
    deleteNotification,
    deleteProduct,
    deleteRental,
    deliveryAddress,
    lastSyncedAt,
    loadingData,
    completeLiveLogin,
    logout,
    markNotificationRead,
    notifications,
    openCart,
    orders,
    products,
    refreshAdminData,
    refreshDealerData,
    rentals,
    saveAdminSettings,
    setProductQuantity,
    updateAddress,
    updateOrder,
    updateCartQuantity,
    updateProduct,
    updateRental,
    updateUser,
    users,
  ]);

  return <MobileStateContext.Provider value={value}>{children}</MobileStateContext.Provider>;
}

function createMobileHarvestApi() {
  const endpoint = getHarvestProxyEndpoint();
  if (!endpoint) {
    return createUnavailableHarvestApi();
  }
  return createProxyHarvestApi({
    endpoint,
    getAccessToken: () => mobileAccessToken,
    setAccessToken: (token) => {
      mobileAccessToken = token;
    },
  });
}

function createUnavailableHarvestApi(): HarvestApi {
  const error = new Error("EXPO_PUBLIC_HARVEST_API_URL is required for the mobile Harvest API.");
  return new Proxy({}, {
    get() {
      return () => Promise.reject(error);
    },
  }) as HarvestApi;
}

export function useMobileState() {
  const value = useContext(MobileStateContext);
  if (!value) throw new Error("useMobileState must be used inside MobileStateProvider");
  return value;
}
