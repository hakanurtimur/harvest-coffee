import { createMockHarvestApi, HarvestApi } from "@harvest/api";
import {
  CreateOrderInput,
  CreateRentalInput,
  Notification as HarvestNotification,
  Order,
  Product,
  Rental,
  User,
} from "@harvest/domain";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

const api = createMockHarvestApi();
const BOOT_DELAY_MS = 950;

interface MobileState {
  api: HarvestApi;
  booting: boolean;
  currentUser: User | null;
  deliveryAddress: string;
  isAuthenticated: boolean;
  loadingData: boolean;
  notifications: HarvestNotification[];
  orders: Order[];
  products: Product[];
  rentals: Rental[];
  addAddress(title: string, address: string): Promise<void>;
  createOrder(input: CreateOrderInput): Promise<Order>;
  createRental(input: CreateRentalInput): Promise<Rental>;
  deleteAddress(index: number): Promise<void>;
  deleteNotification(id: string): Promise<void>;
  loginDealer(): Promise<void>;
  logout(): void;
  markNotificationRead(id: string): Promise<void>;
  refreshDealerData(userOverride?: User): Promise<void>;
  setDeliveryAddress(address: string): void;
}

const MobileStateContext = createContext<MobileState | null>(null);

export function MobileStateProvider({ children }: { children: ReactNode }) {
  const [booting, setBooting] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [notifications, setNotifications] = useState<HarvestNotification[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setBooting(false), BOOT_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const refreshDealerData = useCallback(async (userOverride?: User) => {
    const user = userOverride ?? currentUser;
    if (!user) return;

    setLoadingData(true);
    try {
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
    } finally {
      setLoadingData(false);
    }
  }, [currentUser]);

  const loginDealer = useCallback(async () => {
    setLoadingData(true);
    try {
      const users = await api.getUsers();
      const dealer = users.find((user) => user.role === "dealer") ?? null;
      if (!dealer) throw new Error("Mock dealer user was not found.");
      setCurrentUser(dealer);
      setDeliveryAddress(dealer.addresses[0]?.address ?? "");
      await refreshDealerData(dealer);
    } finally {
      setLoadingData(false);
    }
  }, [refreshDealerData]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setProducts([]);
    setOrders([]);
    setRentals([]);
    setNotifications([]);
    setDeliveryAddress("");
  }, []);

  const createOrder = useCallback(async (input: CreateOrderInput) => {
    const order = await api.createOrder(input);
    await refreshDealerData();
    return order;
  }, [refreshDealerData]);

  const createRental = useCallback(async (input: CreateRentalInput) => {
    const rental = await api.createRental(input);
    await refreshDealerData();
    return rental;
  }, [refreshDealerData]);

  const addAddress = useCallback(async (title: string, address: string) => {
    if (!currentUser) return;
    const nextUser = await api.updateUser(currentUser.id, {
      addresses: [...currentUser.addresses, { title, address }],
    });
    setCurrentUser(nextUser);
    setDeliveryAddress(address);
  }, [currentUser]);

  const deleteAddress = useCallback(async (index: number) => {
    if (!currentUser) return;
    const nextUser = await api.updateUser(currentUser.id, {
      addresses: currentUser.addresses.filter((_, itemIndex) => itemIndex !== index),
    });
    setCurrentUser(nextUser);
    if (deliveryAddress === currentUser.addresses[index]?.address) {
      setDeliveryAddress(nextUser.addresses[0]?.address ?? "");
    }
  }, [currentUser, deliveryAddress]);

  const markNotificationRead = useCallback(async (id: string) => {
    await api.markNotificationRead(id);
    await refreshDealerData();
  }, [refreshDealerData]);

  const deleteNotification = useCallback(async (id: string) => {
    await api.deleteNotification(id);
    await refreshDealerData();
  }, [refreshDealerData]);

  const value = useMemo<MobileState>(() => ({
    api,
    addAddress,
    booting,
    createOrder,
    createRental,
    currentUser,
    deleteAddress,
    deleteNotification,
    deliveryAddress,
    isAuthenticated: Boolean(currentUser),
    loadingData,
    loginDealer,
    logout,
    markNotificationRead,
    notifications,
    orders,
    products,
    refreshDealerData,
    rentals,
    setDeliveryAddress,
  }), [
    addAddress,
    booting,
    createOrder,
    createRental,
    currentUser,
    deleteAddress,
    deleteNotification,
    deliveryAddress,
    loadingData,
    loginDealer,
    logout,
    markNotificationRead,
    notifications,
    orders,
    products,
    refreshDealerData,
    rentals,
  ]);

  return <MobileStateContext.Provider value={value}>{children}</MobileStateContext.Provider>;
}

export function useMobileState() {
  const value = useContext(MobileStateContext);
  if (!value) throw new Error("useMobileState must be used inside MobileStateProvider");
  return value;
}
