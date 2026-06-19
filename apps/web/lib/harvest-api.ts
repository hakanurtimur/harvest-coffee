"use client";

import { createClient } from "@base44/sdk";
import type { UserRole } from "@/lib/domain";
import { createBase44HarvestApi, createMockHarvestApi, createReadOnlyHarvestApi, type Base44ClientLike, type HarvestApi } from "@/lib/api";

const STORAGE_PREFIX = "base44_";
const mockApi = createMockHarvestApi();

let cachedApi: HarvestApi | null = null;
let cachedBase44Client: ReturnType<typeof createClient> | null = null;

export function getHarvestApi(): HarvestApi {
  if (cachedApi) return cachedApi;

  if (shouldUseBase44()) {
    const base44 = getBase44Client();
    if (base44) {
      cachedApi = withReadOnlyGuard(createBase44HarvestApi(base44 as unknown as Base44ClientLike));
      return cachedApi;
    }

    console.warn("Base44 adapter requested, but NEXT_PUBLIC_BASE44_APP_ID or NEXT_PUBLIC_BASE44_BACKEND_URL is missing. Falling back to mock API.");
  }

  cachedApi = withReadOnlyGuard(withMockCurrentUserSelection(mockApi));
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
    headers: params.apiKey ? { api_key: params.apiKey } : undefined,
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

function getMockRole(): UserRole | null {
  if (typeof window === "undefined") return null;
  const role = window.localStorage.getItem("harvest_mock_role");
  return role === "admin" || role === "dealer" ? role : null;
}

function getBase44Params() {
  return {
    appId: getParam("app_id", process.env.NEXT_PUBLIC_BASE44_APP_ID),
    apiKey: getParam("api_key", process.env.NEXT_PUBLIC_BASE44_API_KEY),
    serverUrl: getParam("server_url", process.env.NEXT_PUBLIC_BASE44_BACKEND_URL),
    token: getParam("access_token"),
    functionsVersion: getParam("functions_version"),
  };
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
