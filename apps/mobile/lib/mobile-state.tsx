import {
  createProxyHarvestApi,
  HarvestApi,
  type ContactMessageInput,
  type HarvestContactResult,
  type HarvestUploadFile,
  type HarvestUploadResult,
} from "@harvest/api";
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
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getHarvestProxyEndpoint } from "./live-api";
import { mobileTokenStore } from "./secure-token-store";

let mobileUnauthorizedHandler: (() => void | Promise<void>) | null = null;

const api = createMobileHarvestApi();
const BOOT_DELAY_MS = 950;

interface MobileState {
  api: HarvestApi;
  blockingMessage: string | null;
  booting: boolean;
  cartItemCount: number;
  cartOpen: boolean;
  cartQuantities: Record<string, number>;
  currentUser: User | null;
  dataError: string | null;
  deliveryAddress: string;
  feedback: MobileFeedback | null;
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
  clearFeedback(): void;
  closeCart(): void;
  createProduct(input: CreateProductInput): Promise<Product>;
  createOrder(input: CreateOrderInput): Promise<Order>;
  createRental(input: CreateRentalInput): Promise<Rental>;
  sendContactMessage(input: ContactMessageInput): Promise<HarvestContactResult>;
  uploadProductImage(file: HarvestUploadFile): Promise<HarvestUploadResult>;
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

export interface MobileFeedback {
  body?: string;
  id: number;
  title: string;
  tone: "error" | "info" | "success";
}

export function MobileStateProvider({ children }: { children: ReactNode }) {
  const [booting, setBooting] = useState(true);
  const [blockingMessage, setBlockingMessage] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [feedback, setFeedback] = useState<MobileFeedback | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [notifications, setNotifications] = useState<HarvestNotification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const bootRestoreStartedRef = useRef(false);
  const sessionExpiredHandledRef = useRef(false);

  const cartItemCount = useMemo(
    () => Object.values(cartQuantities).reduce((sum, quantity) => sum + quantity, 0),
    [cartQuantities],
  );

  const showFeedback = useCallback((title: string, tone: MobileFeedback["tone"], body?: string) => {
    setFeedback({ body, id: Date.now(), title, tone });
  }, []);

  const clearFeedback = useCallback(() => {
    setFeedback(null);
  }, []);

  const resetSessionState = useCallback(() => {
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

  const handleUnauthorizedSession = useCallback(() => {
    if (sessionExpiredHandledRef.current) return;
    sessionExpiredHandledRef.current = true;
    void mobileTokenStore.clearAccessToken().catch(() => undefined);
    resetSessionState();
    setBlockingMessage(null);
    setLoadingData(false);
    showFeedback("Session expired", "info", "Please sign in again.");
  }, [resetSessionState, showFeedback]);

  useEffect(() => {
    mobileUnauthorizedHandler = handleUnauthorizedSession;
    return () => {
      if (mobileUnauthorizedHandler === handleUnauthorizedSession) {
        mobileUnauthorizedHandler = null;
      }
    };
  }, [handleUnauthorizedSession]);

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

  useEffect(() => {
    if (bootRestoreStartedRef.current) return;
    bootRestoreStartedRef.current = true;
    let cancelled = false;

    const restoreSession = async () => {
      const minimumBoot = new Promise((resolve) => setTimeout(resolve, BOOT_DELAY_MS));

      try {
        const token = await mobileTokenStore.loadAccessToken();
        if (cancelled || !token) return;

        setLoadingData(true);
        setBlockingMessage("Restoring secure session");
        const user = await api.getCurrentUser();
        if (!user) {
          await mobileTokenStore.clearAccessToken();
          throw new Error("Stored Base44 session could not be resolved.");
        }
        if (cancelled) return;

        sessionExpiredHandledRef.current = false;
        setCurrentUser(user);
        setDeliveryAddress(user.addresses[0]?.address ?? "");
        setBlockingMessage(user.role === "admin" ? "Loading admin workspace" : "Loading dealer workspace");

        try {
          if (user.role === "admin") await refreshAdminData(user);
          else await refreshDealerData(user);
        } catch {
          // Keep the restored session active and surface data failures through
          // dataError instead of forcing the user back through Google sign-in.
        }
      } catch (error) {
        await mobileTokenStore.clearAccessToken().catch(() => undefined);
        if (!cancelled) {
          setCurrentUser(null);
          showFeedback("Session expired", "info", error instanceof Error ? error.message : "Please sign in again.");
        }
      } finally {
        await minimumBoot;
        if (!cancelled) {
          setBlockingMessage(null);
          setBooting(false);
          setLoadingData(false);
        }
      }
    };

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, [refreshAdminData, refreshDealerData, showFeedback]);

  const completeLiveLogin = useCallback(async (accessToken: string) => {
    setLoadingData(true);
    setBlockingMessage("Signing in with Base44");
    try {
      await mobileTokenStore.setAccessToken(accessToken);
      const user = await api.getCurrentUser();
      if (!user) {
        await mobileTokenStore.clearAccessToken();
        throw new Error("Base44 session could not be resolved.");
      }
      sessionExpiredHandledRef.current = false;
      setCurrentUser(user);
      setDeliveryAddress(user.addresses[0]?.address ?? "");
      setBlockingMessage(user.role === "admin" ? "Loading admin workspace" : "Loading dealer workspace");
      try {
        if (user.role === "admin") await refreshAdminData(user);
        else await refreshDealerData(user);
        showFeedback("Signed in", "success", user.role === "admin" ? "Admin workspace is ready." : "Dealer workspace is ready.");
      } catch {
        // The session is valid if Base44 resolved the user. Keep the user signed in
        // and surface workspace data failures through dataError instead of failing auth.
      }
    } catch (error) {
      await mobileTokenStore.clearAccessToken().catch(() => undefined);
      setCurrentUser(null);
      throw error;
    } finally {
      setBlockingMessage(null);
      setLoadingData(false);
    }
  }, [refreshAdminData, refreshDealerData, showFeedback]);

  const logout = useCallback(() => {
    sessionExpiredHandledRef.current = true;
    void mobileTokenStore.clearAccessToken().catch(() => undefined);
    resetSessionState();
  }, [resetSessionState]);

  const createOrder = useCallback(async (input: CreateOrderInput) => {
    setBlockingMessage("Placing order");
    let order: Order;
    try {
      order = await api.createOrder(input);
    } catch (error) {
      showFeedback("Order failed", "error", error instanceof Error ? error.message : "The order could not be created.");
      throw error;
    }

    try {
      await refreshDealerData();
      showFeedback("Order created", "success", `${order.orderNumber} is ready in your orders.`);
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "The latest order list could not be refreshed.");
      showFeedback("Order created", "info", `${order.orderNumber} was created, but the latest list could not be refreshed.`);
    } finally {
      setBlockingMessage(null);
    }

    return order;
  }, [refreshDealerData, showFeedback]);

  const createRental = useCallback(async (input: CreateRentalInput) => {
    setBlockingMessage("Creating rental");
    let rental: Rental;
    try {
      rental = await api.createRental(input);
    } catch (error) {
      showFeedback("Rental failed", "error", error instanceof Error ? error.message : "The rental request could not be created.");
      throw error;
    }

    try {
      if (currentUser?.role === "admin") await refreshAdminData();
      else await refreshDealerData();
      showFeedback("Rental created", "success", rental.productName);
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "The latest rental list could not be refreshed.");
      showFeedback("Rental created", "info", `${rental.productName} was created, but the latest list could not be refreshed.`);
    } finally {
      setBlockingMessage(null);
    }

    return rental;
  }, [currentUser?.role, refreshAdminData, refreshDealerData, showFeedback]);

  const updateOrder = useCallback(async (id: string, input: UpdateOrderInput) => {
    try {
      const order = await api.updateOrder(id, input);
      if (currentUser?.role === "admin") await refreshAdminData();
      else await refreshDealerData();
      showFeedback("Order updated", "success", order.orderNumber);
      return order;
    } catch (error) {
      showFeedback("Order update failed", "error", error instanceof Error ? error.message : "Order could not be updated.");
      throw error;
    }
  }, [currentUser?.role, refreshAdminData, refreshDealerData, showFeedback]);

  const createProduct = useCallback(async (input: CreateProductInput) => {
    try {
      const product = await api.createProduct(input);
      await refreshAdminData();
      showFeedback("Product created", "success", product.name);
      return product;
    } catch (error) {
      showFeedback("Product failed", "error", error instanceof Error ? error.message : "Product could not be created.");
      throw error;
    }
  }, [refreshAdminData, showFeedback]);

  const uploadProductImage = useCallback(async (file: HarvestUploadFile) => {
    setBlockingMessage("Uploading image");
    try {
      const result = await api.uploadProductImage(file);
      showFeedback("Image uploaded", "success");
      return result;
    } catch (error) {
      showFeedback("Image upload failed", "error", error instanceof Error ? error.message : "Product image could not be uploaded.");
      throw error;
    } finally {
      setBlockingMessage(null);
    }
  }, [showFeedback]);

  const sendContactMessage = useCallback(async (input: ContactMessageInput) => {
    setBlockingMessage("Sending message");
    try {
      const result = await api.sendContactMessage(input);
      showFeedback("Message sent", "success", "The Harvest team will follow up shortly.");
      return result;
    } catch (error) {
      showFeedback("Message failed", "error", error instanceof Error ? error.message : "Message could not be sent.");
      throw error;
    } finally {
      setBlockingMessage(null);
    }
  }, [showFeedback]);

  const updateProduct = useCallback(async (id: string, input: UpdateProductInput) => {
    try {
      const product = await api.updateProduct(id, input);
      await refreshAdminData();
      showFeedback("Product updated", "success", product.name);
      return product;
    } catch (error) {
      showFeedback("Product update failed", "error", error instanceof Error ? error.message : "Product could not be updated.");
      throw error;
    }
  }, [refreshAdminData, showFeedback]);

  const deleteProduct = useCallback(async (id: string) => {
    try {
      await api.deleteProduct(id);
      await refreshAdminData();
      showFeedback("Product deleted", "success");
    } catch (error) {
      showFeedback("Product delete failed", "error", error instanceof Error ? error.message : "Product could not be deleted.");
      throw error;
    }
  }, [refreshAdminData, showFeedback]);

  const updateRental = useCallback(async (id: string, input: UpdateRentalInput) => {
    try {
      const rental = await api.updateRental(id, input);
      if (currentUser?.role === "admin") await refreshAdminData();
      else await refreshDealerData();
      showFeedback("Rental updated", "success", rental.productName);
      return rental;
    } catch (error) {
      showFeedback("Rental update failed", "error", error instanceof Error ? error.message : "Rental could not be updated.");
      throw error;
    }
  }, [currentUser?.role, refreshAdminData, refreshDealerData, showFeedback]);

  const deleteRental = useCallback(async (id: string) => {
    try {
      await api.deleteRental(id);
      if (currentUser?.role === "admin") await refreshAdminData();
      else await refreshDealerData();
      showFeedback("Rental deleted", "success");
    } catch (error) {
      showFeedback("Rental delete failed", "error", error instanceof Error ? error.message : "Rental could not be deleted.");
      throw error;
    }
  }, [currentUser?.role, refreshAdminData, refreshDealerData, showFeedback]);

  const updateUser = useCallback(async (id: string, input: Partial<User>) => {
    try {
      const user = await api.updateUser(id, input);
      setUsers((current) => current.map((item) => item.id === id ? user : item));
      if (currentUser?.id === id) setCurrentUser(user);
      showFeedback("Customer updated", "success", user.fullName || user.email);
      return user;
    } catch (error) {
      showFeedback("Customer update failed", "error", error instanceof Error ? error.message : "Customer could not be updated.");
      throw error;
    }
  }, [currentUser?.id, showFeedback]);

  const saveAdminSettings = useCallback(async (settings: AdminSettings) => {
    if (!currentUser) throw new Error("Admin session is not active.");
    const user = { ...currentUser, adminSettings: settings, updatedAt: new Date().toISOString() };
    setCurrentUser(user);
    setUsers((current) => current.map((item) => item.id === user.id ? user : item));
    showFeedback("Session settings saved", "success", "Base44 does not expose a persistent admin settings field yet.");
    return user;
  }, [currentUser, showFeedback]);

  const addAddress = useCallback(async (title: string, address: string) => {
    if (!currentUser) return;
    try {
      const nextUser = await api.updateCurrentUser({
        addresses: [...currentUser.addresses, { title, address }],
      });
      setCurrentUser(nextUser);
      setDeliveryAddress(address);
      showFeedback("Address added", "success", title);
    } catch (error) {
      showFeedback("Address failed", "error", error instanceof Error ? error.message : "The address could not be saved.");
      throw error;
    }
  }, [currentUser, showFeedback]);

  const updateAddress = useCallback(async (index: number, title: string, address: string) => {
    if (!currentUser?.addresses[index]) return;
    try {
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
      showFeedback("Address updated", "success", title);
    } catch (error) {
      showFeedback("Address failed", "error", error instanceof Error ? error.message : "The address could not be saved.");
      throw error;
    }
  }, [currentUser, deliveryAddress, showFeedback]);

  const deleteAddress = useCallback(async (index: number) => {
    if (!currentUser) return;
    try {
      const nextUser = await api.updateCurrentUser({
        addresses: currentUser.addresses.filter((_, itemIndex) => itemIndex !== index),
      });
      setCurrentUser(nextUser);
      if (deliveryAddress === currentUser.addresses[index]?.address) {
        setDeliveryAddress(nextUser.addresses[0]?.address ?? "");
      }
      showFeedback("Address deleted", "success");
    } catch (error) {
      showFeedback("Address delete failed", "error", error instanceof Error ? error.message : "The address could not be deleted.");
      throw error;
    }
  }, [currentUser, deliveryAddress, showFeedback]);

  const markNotificationRead = useCallback(async (id: string) => {
    try {
      await api.markNotificationRead(id);
      if (currentUser?.role === "admin") await refreshAdminData();
      else await refreshDealerData();
      showFeedback("Notification updated", "success");
    } catch (error) {
      showFeedback("Notification update failed", "error", error instanceof Error ? error.message : "Notification could not be updated.");
      throw error;
    }
  }, [currentUser?.role, refreshAdminData, refreshDealerData, showFeedback]);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await api.deleteNotification(id);
      if (currentUser?.role === "admin") await refreshAdminData();
      else await refreshDealerData();
      showFeedback("Notification deleted", "success");
    } catch (error) {
      showFeedback("Notification delete failed", "error", error instanceof Error ? error.message : "Notification could not be deleted.");
      throw error;
    }
  }, [currentUser?.role, refreshAdminData, refreshDealerData, showFeedback]);

  const value = useMemo<MobileState>(() => ({
    api,
    addAddress,
    blockingMessage,
    booting,
    cartItemCount,
    cartOpen,
    cartQuantities,
    clearCart,
    clearFeedback,
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
    feedback,
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
    sendContactMessage,
    setDeliveryAddress,
    setProductQuantity,
    uploadProductImage,
    updateAddress,
    updateOrder,
    updateCartQuantity,
    updateProduct,
    updateRental,
    updateUser,
    users,
  }), [
    addAddress,
    blockingMessage,
    booting,
    cartItemCount,
    cartOpen,
    cartQuantities,
    clearCart,
    clearFeedback,
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
    feedback,
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
    sendContactMessage,
    setProductQuantity,
    uploadProductImage,
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
    getAccessToken: () => mobileTokenStore.getAccessToken(),
    onUnauthorized: () => {
      void mobileTokenStore.clearAccessToken().catch(() => undefined);
      return mobileUnauthorizedHandler?.();
    },
    setAccessToken: (token) => {
      void (token ? mobileTokenStore.setAccessToken(token) : mobileTokenStore.clearAccessToken());
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
