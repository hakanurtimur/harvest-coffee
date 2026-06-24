"use client";

import { createClient } from "@base44/sdk";
import type { UserRole } from "@/lib/domain";
import { createBase44HarvestApi, createMockHarvestApi, createProxyHarvestApi, createReadOnlyHarvestApi, type Base44ClientLike, type HarvestApi } from "@/lib/api";
import { requestToast } from "@/components/ui/sonner";

const STORAGE_PREFIX = "base44_";
const ACCESS_TOKEN_KEY = "harvest_access_token";
const mockApi = createMockHarvestApi();

let cachedApi: HarvestApi | null = null;
let cachedBase44Client: ReturnType<typeof createClient> | null = null;

export function getHarvestApi(): HarvestApi {
  if (cachedApi) return cachedApi;

  if (shouldUseProxy()) {
    const proxyApi = createProxyHarvestApi({
      endpoint: process.env.NEXT_PUBLIC_HARVEST_API_URL || "/api/harvest",
      getAccessToken: getHarvestAccessToken,
      setAccessToken: setHarvestAccessToken,
    });
    cachedApi = withRequestToasts(isHarvestMockAuthEnabled() ? createMockAwareProxyHarvestApi(proxyApi) : proxyApi);
    return cachedApi;
  }

  if (shouldUseBase44()) {
    const base44 = getBase44Client();
    if (base44) {
      cachedApi = withRequestToasts(withReadOnlyGuard(createBase44HarvestApi(base44 as unknown as Base44ClientLike)));
      return cachedApi;
    }

    throw new Error("Base44 adapter requested, but NEXT_PUBLIC_BASE44_APP_ID or NEXT_PUBLIC_BASE44_BACKEND_URL is missing.");
  }

  if (!isHarvestMockAuthEnabled()) {
    throw new Error("Harvest mock API is disabled. Set NEXT_PUBLIC_HARVEST_API_ADAPTER=mock or NEXT_PUBLIC_ENABLE_MOCK_AUTH=true to use mock data.");
  }

  cachedApi = withRequestToasts(withReadOnlyGuard(withMockCurrentUserSelection(mockApi)));
  return cachedApi;
}

export function resetHarvestApiForTests() {
  cachedApi = null;
  cachedBase44Client = null;
}

export function getBase44Client() {
  if (!shouldUseBase44()) return null;
  if (cachedBase44Client) return cachedBase44Client;

  const params = getBase44Params();
  if (!params.appId || !params.serverUrl) return null;

  cachedBase44Client = createClient({
    appId: params.appId,
    serverUrl: normalizeBase44ServerUrl(params.serverUrl),
    token: params.token ?? undefined,
    functionsVersion: params.functionsVersion ?? undefined,
    requiresAuth: false,
  });

  return cachedBase44Client;
}

function shouldUseBase44() {
  return process.env.NEXT_PUBLIC_HARVEST_API_ADAPTER === "base44";
}

function shouldUseProxy() {
  return process.env.NEXT_PUBLIC_HARVEST_API_ADAPTER !== "mock" && !shouldUseBase44();
}

function withReadOnlyGuard(api: HarvestApi) {
  return process.env.NEXT_PUBLIC_HARVEST_API_READ_ONLY === "true"
    ? createReadOnlyHarvestApi(api)
    : api;
}

function withMockCurrentUserSelection(api: HarvestApi): HarvestApi {
  return {
    ...api,
    async getCurrentUser() {
      const users = await api.getUsers();
      const role = getMockRole();
      if (role === "admin") return users.find((user) => user.role === "admin") ?? users[0] ?? null;
      if (role === "dealer") return users.find((user) => user.role === "dealer") ?? users[0] ?? null;
      return api.getCurrentUser();
    },
    async updateCurrentUser(input) {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) throw new Error("User not found");
      return api.updateUser(currentUser.id, input);
    },
  };
}

function createMockAwareProxyHarvestApi(proxyApi: HarvestApi): HarvestApi {
  const selectedMockApi = withReadOnlyGuard(withMockCurrentUserSelection(mockApi));
  return new Proxy(proxyApi, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== "function") return value;

      return (...args: unknown[]) => {
        const source = shouldUseExplicitMockSession() ? selectedMockApi : target;
        const method = Reflect.get(source, prop, source);
        if (typeof method !== "function") return value.apply(target, args);
        return method.apply(source, args);
      };
    },
  }) as HarvestApi;
}

function shouldUseExplicitMockSession() {
  if (typeof window === "undefined") return false;
  return isHarvestMockAuthEnabled() && !getHarvestAccessToken() && window.localStorage.getItem("harvest_mock_auth") === "logged-in";
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

export function isHarvestMockAuthEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === "true" || process.env.NEXT_PUBLIC_HARVEST_API_ADAPTER === "mock";
}

export function hasHarvestSession() {
  if (typeof window === "undefined") return false;
  return Boolean(getHarvestAccessToken()) || (isHarvestMockAuthEnabled() && window.localStorage.getItem("harvest_mock_auth") === "logged-in");
}

export function getHarvestMockRole(): UserRole | null {
  if (typeof window === "undefined") return null;
  const role = window.localStorage.getItem("harvest_mock_role");
  return role === "admin" || role === "dealer" ? role : null;
}

function getMockRole(): UserRole | null {
  return getHarvestMockRole();
}

function getBase44Params() {
  return {
    appId: getParam("app_id", process.env.NEXT_PUBLIC_BASE44_APP_ID),
    serverUrl: getParam("server_url", process.env.NEXT_PUBLIC_BASE44_BACKEND_URL),
    token: getParam("access_token"),
    functionsVersion: getParam("functions_version"),
  };
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
  window.localStorage.setItem("harvest_mock_auth", "logged-out");
  window.localStorage.removeItem("harvest_mock_role");
  url.searchParams.delete("access_token");
  url.searchParams.delete("is_new_user");
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  window.dispatchEvent(new Event("harvest_mock_auth_changed"));
  return token;
}

export function syncHarvestSessionFromUrl() {
  if (typeof window === "undefined") return;

  const token = syncHarvestAccessTokenFromUrl();
  if (token) return;

  const url = new URL(window.location.href);
  const requestedMockAuth = url.searchParams.get("mockAuth") === "1";
  if (!requestedMockAuth) return;

  const mockRole = url.searchParams.get("mockRole");
  if (isHarvestMockAuthEnabled()) {
    setHarvestAccessToken(null);
    window.localStorage.setItem("harvest_mock_auth", "logged-in");
    if (mockRole === "admin" || mockRole === "dealer") {
      window.localStorage.setItem("harvest_mock_role", mockRole);
    }
  }

  url.searchParams.delete("mockAuth");
  url.searchParams.delete("mockRole");
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  window.dispatchEvent(new Event("harvest_mock_auth_changed"));
}

export function setHarvestAccessToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  else window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function clearHarvestSession() {
  setHarvestAccessToken(null);
  if (typeof window === "undefined") return;
  window.localStorage.setItem("harvest_mock_auth", "logged-out");
  window.localStorage.removeItem("harvest_mock_role");
  window.localStorage.removeItem("harvest_user_label");
  window.dispatchEvent(new Event("harvest_mock_auth_changed"));
}

function normalizeBase44ServerUrl(value: string) {
  return value.replace(/\/api\/?$/, "").replace(/\/$/, "");
}

function getParam(name: string, fallback?: string) {
  if (typeof window === "undefined") return fallback ?? null;

  const key = `${STORAGE_PREFIX}${toSnakeCase(name)}`;
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get(name);

  if (fromUrl) {
    window.localStorage.setItem(key, fromUrl);
    if (name === "access_token") {
      params.delete(name);
      const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}${window.location.hash}`;
      window.history.replaceState({}, document.title, nextUrl);
    }
    return fromUrl;
  }

  if (fallback) {
    window.localStorage.setItem(key, fallback);
    return fallback;
  }

  return window.localStorage.getItem(key);
}

function toSnakeCase(value: string) {
  return value.replace(/([A-Z])/g, "_$1").toLowerCase();
}
