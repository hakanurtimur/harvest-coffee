"use client";

import { useEffect, useMemo, useState } from "react";

export const V2_STORAGE_KEY = "harvest_v2_pages";
export const V2_EVENT_NAME = "harvest_v2_changed";
export const V2_GLOBAL_KEY = "__all";

export type V2PageConfig = {
  path: string;
  label: string;
  supported: boolean;
  summary: string;
  changes: string[];
  functionalNotes: string[];
  mobileNotes: string[];
};

export const v2PageConfigs: V2PageConfig[] = [
  {
    path: "/home",
    label: "Landing / Home",
    supported: true,
    summary: "Premium B2B kahve landing dili, daha ferah editorial görsel akış ve daha net CTA hiyerarşisi.",
    changes: [
      "Hero, mission, signature products ve business/rental yönlendirmeleri modern landing akışına taşınır.",
      "Mevcut ürün datası kullanılır; yeni ürün, yeni sipariş veya yeni backend fonksiyonu eklenmez.",
      "Logged-in quick order davranışı korunur, sadece kart düzeni ve görsel hiyerarşi yenilenir.",
    ],
    functionalNotes: [
      "Discover Products, Learn More, View Rentals ve Contact CTA'ları mevcut legacy route'lara gider.",
      "Mock login ve mock API adapter davranışı aynen kalır.",
      "Email veya sipariş yan etkisi eklenmez.",
    ],
    mobileNotes: [
      "Hero tek kolona düşer; görsel kolaj dikey kart akışına dönüşür.",
      "CTA'lar touch-friendly yüksekliğe çıkarılır.",
      "Quick order kartları tek kolon ve yatay görsel ağırlıklı çalışır.",
    ],
  },
  {
    path: "/about",
    label: "About",
    supported: true,
    summary: "About sayfası premium editorial marka anlatımı, iki kolon hikaye alanı ve modern values kartlarına taşınır.",
    changes: [
      "Mevcut About metinleri korunur; yeni iş kuralı veya backend davranışı eklenmez.",
      "Story alanı görsel ağırlıklı iki kolon editorial düzene geçer.",
      "Values kartları mevcut dört değer üzerinden daha rafine bir grid düzenine taşınır.",
    ],
    functionalNotes: [
      "Sayfa statik içeriktir; form, email, sipariş veya auth yan etkisi eklenmez.",
      "Mevcut PublicShell route/navigation davranışı korunur.",
    ],
    mobileNotes: [
      "Hero ve story tek kolona düşer.",
      "Values kartları iki kolon/tek kolon akışına responsive geçer.",
    ],
  },
  {
    path: "/contact",
    label: "Contact",
    supported: true,
    summary: "Contact sayfası premium editorial iletişim düzeni, rafine form kartı ve net iletişim bilgileriyle yenilenir.",
    changes: [
      "Mevcut Contact metinleri, adres, email ve çalışma saatleri korunur.",
      "Mock contact form davranışı aynen kalır; gönderimde sadece mevcut success state gösterilir.",
      "İletişim bilgileri ve form modern iki kolon düzene taşınır.",
    ],
    functionalNotes: [
      "Email delivery hâlâ mock durumdadır; gerçek email/backend yan etkisi eklenmez.",
      "Required alanlar ve success mesajı mevcut V1 davranışıyla aynı kalır.",
    ],
    mobileNotes: [
      "Form ve iletişim bilgileri tek kolon akışa düşer.",
      "Input ve submit alanları touch-friendly yükseklikte kalır.",
    ],
  },
  {
    path: "/products",
    label: "Products",
    supported: true,
    summary: "Products sayfası logged out katalog ve logged in dealer sipariş akışları korunarak modern ürün grid/list deneyimine taşınır.",
    changes: [
      "Mevcut ürün datası korunur; yeni ürün, filtre veya backend iş kuralı eklenmez.",
      "Logged out durumda fiyat/sipariş kilidi ve Dealer Login yönlendirmesi korunur.",
      "Logged in durumda list/card görünümü, quantity kontrolleri, cart bar ve checkout modalı korunur.",
    ],
    functionalNotes: [
      "Sipariş oluşturma mevcut api.createOrder davranışıyla aynı kalır.",
      "Delivery address zorunluluğu ve orderdetails redirect davranışı korunur.",
      "Mock/API adapter sınırları değişmez.",
    ],
    mobileNotes: [
      "Ürün kartları tek kolon akışa düşer.",
      "Quantity ve checkout kontrolleri touch-friendly yükseklikte kalır.",
    ],
  },
  {
    path: "/login",
    label: "Login",
    supported: true,
    summary: "Mock login sayfası aynı dealer/admin auth davranışı korunarak modern V2 giriş ekranına taşınır.",
    changes: [
      "Mevcut mock dealer ve admin giriş butonları korunur.",
      "LocalStorage mock auth ve redirect davranışı değiştirilmez.",
      "Login ekranı premium editorial public shell diline taşınır.",
    ],
    functionalNotes: [
      "Gerçek Base44 auth eklenmez; mock login mevcut parity test davranışıyla kalır.",
      "Dealer login next parametresine, admin login /admin route'una gider.",
    ],
    mobileNotes: [
      "Login seçenekleri tek kolon, touch-friendly butonlarla çalışır.",
      "Dekoratif SVG'ler içerik üstüne binmeyecek şekilde responsive kalır.",
    ],
  },
  {
    path: "/trackorder",
    label: "Track Order",
    supported: true,
    summary: "Track Order sayfası mevcut order-number arama ve order status detayları korunarak modern takip ekranına taşınır.",
    changes: [
      "Order number query paramı ve arama formu korunur.",
      "Order Not Found, Delivery Status, Delivery Address ve Order Items blokları aynı veriyle çalışır.",
      "Progress bar ve status badge yapısı modern görsel dile taşınır.",
    ],
    functionalNotes: [
      "Arama hâlâ api.getOrderByNumber üzerinden çalışır.",
      "Yeni order lookup, email gönderimi veya backend yan etkisi eklenmez.",
      "View All Orders linki mevcut /orders route'una gider.",
    ],
    mobileNotes: [
      "Arama formu tek kolon touch-friendly akışa düşer.",
      "Status adımları mobilde dikey kartlara dönüşür.",
    ],
  },
  {
    path: "/orders",
    label: "My Orders",
    supported: true,
    summary: "My Orders listesi mevcut order datası ve details linkleri korunarak modern dealer order kartlarına taşınır.",
    changes: [
      "Mevcut order listesi, tarih, status badge, payment badge, ürün özeti ve toplam tutar korunur.",
      "Details linki mevcut /orderdetails route'una gitmeye devam eder.",
      "Loading ve empty state modern kart düzenine taşınır.",
    ],
    functionalNotes: [
      "Order datası hâlâ api.getOrders üzerinden yüklenir.",
      "Yeni filtre, arama, backend davranışı veya order update aksiyonu eklenmez.",
    ],
    mobileNotes: [
      "Order kartları tek kolon touch-friendly düzende çalışır.",
      "Status badge ve details CTA mobilde alt alta kırılır.",
    ],
  },
  {
    path: "/orderdetails",
    label: "Order Details",
    supported: true,
    summary: "Order Details sayfası normal dealer/public order akışına taşınır ve mevcut order detail/payment davranışı korunarak modern V2 görünüme geçer.",
    changes: [
      "Sayfa AppShell yerine PublicShell altında çalışır; My Orders nav grubu aktif kalır.",
      "Mevcut order item, tarih, status, payment, delivery address ve notes alanları aynı veriyle gösterilir.",
      "Payment method update ve pending payment notify/paid aksiyonu mevcut api.updateOrder davranışıyla korunur.",
    ],
    functionalNotes: [
      "Order datası hâlâ api.getOrder(orderId) üzerinden yüklenir.",
      "Yeni admin-only route, yeni payment provider veya backend yan etkisi eklenmez.",
      "Back to orders linki mevcut /orders route'una gider.",
    ],
    mobileNotes: [
      "Detail grid mobilde tek kolon akışa düşer.",
      "Payment panel sticky davranışını bırakıp form kontrollerini touch-friendly düzende gösterir.",
    ],
  },
  {
    path: "/rentals",
    label: "Rentals",
    supported: true,
    summary: "Rentals listesi mevcut auth kontrolü ve rental datası korunarak modern dealer rental kartlarına taşınır.",
    changes: [
      "Logged out durumda mevcut /home redirect davranışı korunur.",
      "Total, Active ve Upcoming metrikleri modern kartlara taşınır.",
      "Rental kartlarında ürün, tarih, notes, status ve Invoice butonu korunur.",
    ],
    functionalNotes: [
      "Rental datası hâlâ api.getRentals(currentUser.email) üzerinden yüklenir.",
      "Start New Rental ve Create First Rental linkleri mevcut /CreateRental route'una gider.",
      "Invoice butonu mevcut V1 gibi görsel aksiyon olarak kalır; yeni backend yan etkisi eklenmez.",
    ],
    mobileNotes: [
      "Metrikler ve rental kartları tek kolon touch-friendly düzene düşer.",
      "Status ve invoice aksiyonları mobilde kart altında sarılır.",
    ],
  },
  {
    path: "/CreateRental",
    label: "Create Rental",
    supported: true,
    summary: "Create Rental formu mevcut ürün seçimi, tarih validasyonu ve createRental akışı korunarak modern rental agreement ekranına taşınır.",
    changes: [
      "Product, start date, end date ve special notes alanları korunur.",
      "End date must be after start date validasyonu ve duration/monthly rate özeti korunur.",
      "Back to rentals ve submit sonrası /rentals redirect davranışı korunur.",
    ],
    functionalNotes: [
      "Ürün listesi hâlâ api.getProducts üzerinden gelir.",
      "Rental oluşturma hâlâ api.createRental üzerinden yapılır.",
      "Yeni fiyatlandırma, takvim, ödeme veya backend davranışı eklenmez.",
    ],
    mobileNotes: [
      "Form alanları mobilde tek kolona düşer.",
      "Rental summary kartı formun altına iner ve touch-friendly kalır.",
    ],
  },
  {
    path: "/profile",
    label: "Profile",
    supported: true,
    summary: "Profile sayfası account info, adres yönetimi, order history ve activity tabları korunarak modern dealer profile düzenine taşınır.",
    changes: [
      "Account Info, Addresses, Order History ve Activity tabları korunur.",
      "Adres ekleme, düzenleme ve silme akışı mevcut api.updateCurrentUser davranışıyla kalır.",
      "Delete Account aksiyonu mevcut mock migration mesajını göstermeye devam eder.",
    ],
    functionalNotes: [
      "Profile datası hâlâ api.getCurrentUser ve api.getMyOrders üzerinden yüklenir.",
      "Order/activity detail linkleri mevcut /orderdetails route'una gider.",
      "Gerçek account deletion veya yeni backend yan etkisi eklenmez.",
    ],
    mobileNotes: [
      "Tablar iki kolon/tek kolon akışta touch-friendly kalır.",
      "Adres formu, order rows ve activity rows mobilde dikey düzene kırılır.",
    ],
  },
  {
    path: "/admin",
    label: "Admin Dashboard",
    supported: true,
    summary: "Admin Dashboard mevcut raporlama datası, Recharts grafikleri, stock alerts ve recent activity akışı korunarak modern operasyon paneline taşınır.",
    changes: [
      "Total revenue, collected, pending payment ve total orders metrikleri aynı hesaplamalarla gösterilir.",
      "Stock alerts, sales trend range, category/status/payment charts, top products/customers ve recent activity korunur.",
      "Admin shell/nav davranışına bu adımda dokunulmaz; sadece /admin dashboard içeriği V2 olur.",
    ],
    functionalNotes: [
      "Dashboard datası hâlâ api.getOrders, api.getProducts ve api.getUsers üzerinden yüklenir.",
      "Recharts kullanılmaya devam eder.",
      "Yeni admin aksiyonu, yeni filtre veya backend yan etkisi eklenmez.",
    ],
    mobileNotes: [
      "Metrikler tek kolona düşer, grafikler yatay taşma olmadan kart içinde kalır.",
      "Recent activity ve ranked listeler mobilde taranabilir compact satırlara iner.",
    ],
  },
  {
    path: "/adminorders",
    label: "Admin Orders",
    supported: true,
    summary: "Admin Orders sayfası mevcut sipariş yönetimi, status/payment update, tracking ve ETA akışları korunarak modern operasyon listesine taşınır.",
    changes: [
      "Total orders, open orders, pending payments ve revenue bilgileri aynı order datasından hesaplanır.",
      "Status, payment status, tracking number ve ETA update davranışları mevcut api.updateOrder ile korunur.",
      "Legacy'deki status/payment filtreleri ve details linki mevcut order datası/route'u üzerinden gösterilir.",
    ],
    functionalNotes: [
      "Order datası hâlâ api.getOrders üzerinden yüklenir.",
      "Yeni backend alanı, yeni notification/email yan etkisi veya yeni admin aksiyonu eklenmez.",
      "Details linki mevcut /orderdetails route'una gider.",
    ],
    mobileNotes: [
      "Order kartları tek kolon akışa düşer.",
      "Status, payment, tracking ve ETA kontrolleri touch-friendly form gridine kırılır.",
    ],
  },
  {
    path: "/adminproducts",
    label: "Admin Products",
    supported: true,
    summary: "Admin Products sayfası mevcut ürün oluşturma, düzenleme, silme, stock ve mock AI description akışları korunarak modern ürün yönetimine taşınır.",
    changes: [
      "Product form alanları, kategori seçenekleri, stock status/quantity ve image URL alanları korunur.",
      "Create, update, delete ve mock AI description davranışları mevcut API/mock sınırlarıyla aynı kalır.",
      "Ürün kartlarında image, name, category, weight, description, price, stock badge ve edit/delete aksiyonları korunur.",
    ],
    functionalNotes: [
      "Ürün datası hâlâ api.getProducts üzerinden yüklenir.",
      "Create/update/delete hâlâ api.createProduct, api.updateProduct ve api.deleteProduct üzerinden çalışır.",
      "Gerçek InvokeLLM eklenmez; mevcut mock AI description notu korunur.",
    ],
    mobileNotes: [
      "Form alanları mobilde tek kolona düşer.",
      "Ürün kartları tek kolon touch-friendly aksiyonlarla çalışır.",
    ],
  },
  {
    path: "/stockmanagement",
    label: "Stock Management",
    supported: true,
    summary: "Stock Management sayfası mevcut stock summary, low-stock alerts ve stock/threshold edit akışları korunarak modern admin tablo görünümüne taşınır.",
    changes: [
      "Total products, low stock, out of stock ve stock value metrikleri aynı hesaplamalarla gösterilir.",
      "Low Stock Alerts bölümü mevcut ürün datasına göre korunur.",
      "Current stock ve threshold edit/save/cancel akışı mevcut api.updateProduct davranışıyla korunur.",
    ],
    functionalNotes: [
      "Ürün datası hâlâ api.getProducts üzerinden yüklenir.",
      "Stock update hâlâ api.updateProduct üzerinden yapılır ve stockStatus aynı getStockStatus mantığıyla hesaplanır.",
      "Low stock email hâlâ mock mesaj olarak kalır; gerçek SendEmail eklenmez.",
    ],
    mobileNotes: [
      "Summary kartları tek kolona düşer.",
      "Stock tablosu yatay scroll ile korunur; edit inputları touch-friendly kalır.",
    ],
  },
  {
    path: "/customermanagement",
    label: "Customer Management",
    supported: true,
    summary: "Customer Management sayfası mevcut müşteri segmentasyonu, sipariş sayısı ve harcama hesapları korunarak modern admin tablo görünümüne taşınır.",
    changes: [
      "Toplam müşteri, VIP müşteri, ortalama sipariş değeri ve toplam sipariş metrikleri aynı hesaplamalarla gösterilir.",
      "Müşteri listesinde isim, email, company, segment, order count ve total spent alanları korunur.",
      "Segment değiştirme akışı mevcut api.updateUser davranışıyla aynı kalır.",
    ],
    functionalNotes: [
      "Müşteri datası hâlâ api.getUsers üzerinden yüklenir.",
      "Sipariş hesapları hâlâ api.getOrders ve customerEmail eşleşmesiyle yapılır.",
      "Yeni filtre, arama, export, CRM aksiyonu veya backend yan etkisi eklenmez.",
    ],
    mobileNotes: [
      "Summary kartları tek kolona düşer.",
      "Müşteri tablosu yatay scroll ile korunur; segment select touch-friendly kalır.",
    ],
  },
  {
    path: "/reports",
    label: "Reports",
    supported: true,
    summary: "Reports sayfası mevcut rental, sales ve customer analysis tabları korunarak modern admin raporlama görünümüne taşınır.",
    changes: [
      "Rental summary metrikleri, rental status pie chart ve expiring rentals listesi aynı hesaplamalarla gösterilir.",
      "Monthly Orders & Revenue chartı mevcut monthly order aggregation ile korunur.",
      "Customer Analysis metrikleri ve Top Customers by Revenue listesi aynı order/user datasıyla çalışır.",
    ],
    functionalNotes: [
      "Rapor datası hâlâ api.getRentals, api.getOrders ve api.getUsers üzerinden yüklenir.",
      "Recharts kullanılmaya devam eder.",
      "Yeni export, filtre, tarih aralığı, backend alanı veya yan etki eklenmez.",
    ],
    mobileNotes: [
      "Tab kontrolleri mobilde yatay scroll ile korunur.",
      "Metrikler tek kolona düşer; chart alanları kart içinde sabit yükseklikle kalır.",
    ],
  },
  {
    path: "/adminsettings",
    label: "Admin Settings",
    supported: true,
    summary: "Admin Settings sayfası mevcut notification email ve rental reminder ayarları korunarak modern admin form görünümüne taşınır.",
    changes: [
      "Admin notification email ve rental reminder days alanları aynı form akışıyla gösterilir.",
      "Save settings aksiyonu mevcut api.updateCurrentUser davranışıyla korunur.",
      "Rental reminder system bilgi kartı mevcut notlarla modern kart düzenine taşınır.",
    ],
    functionalNotes: [
      "Settings datası hâlâ api.getCurrentUser üzerinden yüklenir.",
      "Kaydetme hâlâ api.updateCurrentUser({ adminSettings }) üzerinden çalışır.",
      "Yeni notification scheduler, email delivery, backend alanı veya yan etki eklenmez.",
    ],
    mobileNotes: [
      "Form ve bilgi kartı mobilde tek kolon akışa düşer.",
      "Input ve save button touch-friendly yükseklikte kalır.",
    ],
  },
  {
    path: "/adminrentals",
    label: "Admin Rentals",
    supported: true,
    summary: "Admin Rentals sayfası mevcut rental listeleme, status update ve delete aksiyonları korunarak admin route ağında görünür hale getirilir.",
    changes: [
      "Rental management component mevcut API davranışıyla /adminrentals route'una bağlanır.",
      "Status filtresi, rental metrikleri, status update ve delete aksiyonları korunur.",
      "New rental linki mevcut /CreateRental route'una yönlenir.",
    ],
    functionalNotes: [
      "Rental datası hâlâ api.getRentals üzerinden yüklenir.",
      "Status update api.updateRental, delete api.deleteRental üzerinden çalışır.",
      "Yeni invoice, email veya scheduler yan etkisi eklenmez.",
    ],
    mobileNotes: [
      "Mobil admin tarafında /admin-rentals route'u aynı liste, filtre, status update ve delete davranışlarını taşır.",
      "Calendar ayrı /admin-rental-calendar route'u olarak kalır.",
    ],
  },
  {
    path: "/rentalcalendar",
    label: "Rental Calendar",
    supported: true,
    summary: "Rental Calendar sayfası mevcut admin calendar datası, month navigation ve rental event gösterimi korunarak modern admin takvim görünümüne taşınır.",
    changes: [
      "Active, Upcoming, Expiring this month ve Total rentals metrikleri aynı hesaplamalarla gösterilir.",
      "Previous, Today ve Next month aksiyonları mevcut currentMonth state davranışıyla korunur.",
      "Calendar grid, active/upcoming/expiring rental eventleri ve legend aynı veriyle çalışır.",
    ],
    functionalNotes: [
      "Rental datası hâlâ api.getRentals üzerinden yüklenir.",
      "Yeni calendar backend, drag/drop, update veya delete aksiyonu eklenmez.",
      "Günlük event limit ve +more davranışı korunur.",
    ],
    mobileNotes: [
      "Metrikler tek kolona düşer.",
      "Takvim genişliği korunur ve küçük ekranlarda yatay scroll ile okunur.",
    ],
  },
  {
    path: "/notifications",
    label: "Notifications",
    supported: true,
    summary: "Notifications sayfası mevcut notification listesi, unread count, refresh, mark as read ve delete aksiyonları korunarak modern bildirim görünümüne taşınır.",
    changes: [
      "Unread count, refresh aksiyonu ve loading/empty state korunur.",
      "Notification title, message, type label, created date ve unread dot aynı veriyle gösterilir.",
      "Mark as read ve delete aksiyonları mevcut API davranışıyla korunur.",
    ],
    functionalNotes: [
      "Bildirim datası hâlâ api.getNotifications(currentUser.email) üzerinden yüklenir.",
      "Okundu işaretleme api.markNotificationRead, silme api.deleteNotification üzerinden çalışır.",
      "Yeni notification üretimi, filtre, realtime veya backend yan etkisi eklenmez.",
    ],
    mobileNotes: [
      "Bildirim kartları tek kolon akışta çalışır.",
      "Aksiyon butonları icon-only ve touch-friendly kalır.",
    ],
  },
];

export function normalizeV2Path(pathname: string | null | undefined) {
  if (!pathname || pathname === "/") return "/home";
  if (pathname.startsWith("/home")) return "/home";
  if (pathname.startsWith("/about")) return "/about";
  if (pathname.startsWith("/contact")) return "/contact";
  if (pathname.startsWith("/products")) return "/products";
  if (pathname.startsWith("/login")) return "/login";
  if (pathname.startsWith("/trackorder")) return "/trackorder";
  if (pathname.startsWith("/orderdetails")) return "/orderdetails";
  if (pathname.startsWith("/orders")) return "/orders";
  if (pathname.startsWith("/CreateRental")) return "/CreateRental";
  if (pathname.startsWith("/rentals")) return "/rentals";
  if (pathname.startsWith("/profile")) return "/profile";
  if (pathname.startsWith("/adminorders")) return "/adminorders";
  if (pathname.startsWith("/adminproducts")) return "/adminproducts";
  if (pathname.startsWith("/stockmanagement")) return "/stockmanagement";
  if (pathname.startsWith("/customermanagement")) return "/customermanagement";
  if (pathname.startsWith("/reports")) return "/reports";
  if (pathname.startsWith("/adminsettings")) return "/adminsettings";
  if (pathname.startsWith("/adminrentals")) return "/adminrentals";
  if (pathname.startsWith("/rentalcalendar")) return "/rentalcalendar";
  if (pathname.startsWith("/notifications")) return "/notifications";
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "/admin";
  return pathname;
}

export function getV2Config(pathname: string | null | undefined) {
  const normalized = normalizeV2Path(pathname);
  return v2PageConfigs.find((config) => config.path === normalized) ?? {
    path: normalized,
    label: normalized,
    supported: false,
    summary: "Bu sayfa için V2 çalışması henüz planlanmadı.",
    changes: ["Henüz V2 component bağlanmadı."],
    functionalNotes: ["Mevcut V1 sayfası çalışmaya devam eder."],
    mobileNotes: ["Mobile karşılığı sayfa planına alındığında ayrıca notlanacak."],
  };
}

function readV2State() {
  if (typeof window === "undefined") return {};

  try {
    return JSON.parse(window.localStorage.getItem(V2_STORAGE_KEY) || "{}") as Record<string, boolean>;
  } catch {
    return {};
  }
}

export function setV2Enabled(pathname: string, enabled: boolean) {
  const path = normalizeV2Path(pathname);
  const nextState = { ...readV2State(), [path]: enabled };
  nextState[V2_GLOBAL_KEY] = areAllSupportedPathsEnabled(nextState);
  window.localStorage.setItem(V2_STORAGE_KEY, JSON.stringify(nextState));
  window.dispatchEvent(new CustomEvent(V2_EVENT_NAME, { detail: { path, enabled } }));
}

export function setAllV2Enabled(enabled: boolean) {
  const nextState: Record<string, boolean> = { ...readV2State(), [V2_GLOBAL_KEY]: enabled };
  v2PageConfigs
    .filter((config) => config.supported)
    .forEach((config) => {
      nextState[config.path] = enabled;
    });
  window.localStorage.setItem(V2_STORAGE_KEY, JSON.stringify(nextState));
  window.dispatchEvent(new CustomEvent(V2_EVENT_NAME, { detail: { path: V2_GLOBAL_KEY, enabled } }));
}

export function useAllV2Enabled() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const sync = () => setEnabled(areAllSupportedPathsEnabled(readV2State()));
    sync();
    window.addEventListener(V2_EVENT_NAME, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(V2_EVENT_NAME, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return enabled;
}

export function useV2Enabled(pathname: string) {
  const path = useMemo(() => normalizeV2Path(pathname), [pathname]);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const sync = () => {
      const state = readV2State();
      setEnabled(Boolean(state[path] ?? state[V2_GLOBAL_KEY]));
    };
    sync();
    window.addEventListener(V2_EVENT_NAME, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(V2_EVENT_NAME, sync);
      window.removeEventListener("storage", sync);
    };
  }, [path]);

  return enabled;
}

function areAllSupportedPathsEnabled(state: Record<string, boolean>) {
  return v2PageConfigs.filter((config) => config.supported).every((config) => Boolean(state[config.path]));
}
