"use client";

import { createProxyHarvestApi, type HarvestApi } from "@/lib/api";
import { requestToast } from "@/components/ui/sonner";

const ACCESS_TOKEN_KEY = "harvest_access_token";
export const HARVEST_AUTH_EVENT = "harvest_auth_changed";

let cachedApi: HarvestApi | null = null;

export function getHarvestApi(): HarvestApi {
  if (cachedApi) return cachedApi;

  const proxyApi = createProxyHarvestApi({
    endpoint: process.env.NEXT_PUBLIC_HARVEST_API_URL || "/api/harvest",
    getAccessToken: getHarvestAccessToken,
    setAccessToken: setHarvestAccessToken,
  });
  cachedApi = withRequestToasts(proxyApi);
  return cachedApi;
}

export function resetHarvestApiForTests() {
  cachedApi = null;
}

type HarvestMethodName = {
  [K in keyof HarvestApi]: HarvestApi[K] extends (...args: never[]) => Promise<unknown> ? K : never;
}[keyof HarvestApi];

const requestToastMessages: Partial<Record<HarvestMethodName, { loading: string; success: string }>> = {
  createOrder: { loading: "Creating order...", success: "Order created." },
  updateOrder: { loading: "Updating order...", success: "Order updated." },
  createRental: { loading: "Creating rental...", success: "Rental created." },
  updateRental: { loading: "Updating rental...", success: "Rental updated." },
  deleteRental: { loading: "Deleting rental...", success: "Rental deleted." },
  uploadProductImage: { loading: "Uploading product image...", success: "Product image uploaded." },
  sendContactMessage: { loading: "Sending message...", success: "Message sent." },
  createProduct: { loading: "Saving product...", success: "Product created." },
  updateProduct: { loading: "Saving product...", success: "Product updated." },
  deleteProduct: { loading: "Deleting product...", success: "Product deleted." },
  updateCurrentUser: { loading: "Saving profile...", success: "Profile saved." },
  deleteCurrentUser: { loading: "Deleting account...", success: "Account deleted." },
  updateUser: { loading: "Saving customer...", success: "Customer saved." },
  markNotificationRead: { loading: "Updating notification...", success: "Notification updated." },
  deleteNotification: { loading: "Deleting notification...", success: "Notification deleted." },
};

function withRequestToasts(api: HarvestApi): HarvestApi {
  return new Proxy(api, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== "function") return value;
      const messages = requestToastMessages[prop as HarvestMethodName];
      if (!messages) return value.bind(target);

      return (...args: unknown[]) => requestToast.promise(
        value.apply(target, args),
        {
          loading: messages.loading,
          success: messages.success,
          error: (error) => error instanceof Error ? error.message : "Request failed.",
        },
      );
    },
  }) as HarvestApi;
}

export function hasHarvestSession() {
  if (typeof window === "undefined") return false;
  return Boolean(getHarvestAccessToken());
}

export function getHarvestAccessToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function syncHarvestAccessTokenFromUrl() {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  const token = url.searchParams.get("access_token");
  if (!token) return null;

  setHarvestAccessToken(token);
  url.searchParams.delete("access_token");
  url.searchParams.delete("is_new_user");
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  window.dispatchEvent(new Event(HARVEST_AUTH_EVENT));
  return token;
}

export function syncHarvestSessionFromUrl() {
  if (typeof window === "undefined") return;

  syncHarvestAccessTokenFromUrl();
}

export function setHarvestAccessToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  else window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function clearHarvestSession() {
  setHarvestAccessToken(null);
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("harvest_user_label");
  window.dispatchEvent(new Event(HARVEST_AUTH_EVENT));
}
