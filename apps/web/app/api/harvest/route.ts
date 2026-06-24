import { createClient } from "@base44/sdk";
import {
  createBase44HarvestApi,
  mapBase44User,
  type Base44ClientLike,
  type HarvestApi,
} from "@/lib/api";
import type { CreateOrderInput, CreateRentalInput, User } from "@/lib/domain";

type RawRecord = Record<string, unknown>;

const DEFAULT_BASE44_APP_ID = "691daa20af5806873f836b87";
const DEFAULT_BASE44_BACKEND_URL = "https://harvest-coffee-b2-b-orders-3f836b87.base44.app/api";

const WRITE_ACTIONS = new Set([
  "updateCurrentUser",
  "deleteCurrentUser",
  "createProduct",
  "updateProduct",
  "deleteProduct",
  "createOrder",
  "updateOrder",
  "createRental",
  "updateRental",
  "deleteRental",
  "updateUser",
  "markNotificationRead",
  "deleteNotification",
]);

export const runtime = "nodejs";

export function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("mode") !== "google-login") {
    return jsonError("Unsupported Harvest proxy GET action.", 400);
  }

  const appId = process.env.BASE44_APP_ID || process.env.NEXT_PUBLIC_BASE44_APP_ID || DEFAULT_BASE44_APP_ID;
  const serverUrl = process.env.BASE44_BACKEND_URL || process.env.NEXT_PUBLIC_BASE44_BACKEND_URL || DEFAULT_BASE44_BACKEND_URL;
  if (!appId || !serverUrl) {
    return jsonError("BASE44_APP_ID and BASE44_BACKEND_URL are required for Google login.", 500);
  }

  const requestedFrom = url.searchParams.get("from") || "/";
  const fromUrl = normalizeLoginRedirectUrl(
    requestedFrom.startsWith("http") || requestedFrom.includes("://")
      ? requestedFrom
      : new URL(requestedFrom, url.origin).toString()
  );
  const loginUrl = new URL(`${normalizeBase44ServerUrl(serverUrl)}/api/apps/auth/login`);
  loginUrl.searchParams.set("app_id", appId);
  loginUrl.searchParams.set("from_url", fromUrl);

  return Response.redirect(loginUrl.toString(), 302);
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = stringValue(body.action);
    const input = readRecord(body.input);
    const token = optionalString(body.token);

    if (!action) return jsonError("Missing harvest proxy action.", 400);
    if (WRITE_ACTIONS.has(action) && isReadOnly()) {
      return jsonError("Harvest API is running in read-only mode. Write operations are disabled.", 403);
    }

    const base44 = createServerBase44Client(token);
    const api = createBase44HarvestApi(base44 as unknown as Base44ClientLike);

    const actor = await getActor(base44, token);
    const data = await runHarvestAction(action, input, api, actor);
    return jsonOk(data);
  } catch (error) {
    const status = numberValue(readRecord(error).status, 500);
    return jsonError(error instanceof Error ? error.message : "Harvest proxy request failed.", status);
  }
}

async function runHarvestAction(
  action: string,
  input: RawRecord,
  api: HarvestApi,
  actor: User | null,
) {
  switch (action) {
    case "getCurrentUser":
      return actor;
    case "getProducts":
      return api.getProducts();
    case "getOrders":
      requireAdmin(actor);
      return api.getOrders();
    case "getMyOrders": {
      requireUser(actor);
      const orders = await api.getOrders();
      return orders.filter((order) => (
        sameRecordId(order.createdById, actor.id) ||
        Boolean(order.customerEmail && sameEmail(order.customerEmail, actor.email))
      ));
    }
    case "getOrder": {
      const order = await api.getOrder(stringValue(input.id));
      assertOrderAccess(actor, order);
      return order;
    }
    case "getOrderByNumber": {
      const order = await api.getOrderByNumber(stringValue(input.orderNumber));
      if (actor) assertOrderAccess(actor, order);
      return order;
    }
    case "getRentals":
      requireUser(actor);
      if (actor.role === "admin" && !input.customerEmail) return api.getRentals();
      return api.getRentals(actor.email);
    case "getUsers":
      requireAdmin(actor);
      return api.getUsers();
    case "getNotifications":
      requireUser(actor);
      return api.getNotifications(actor.email, { includeAdmin: actor.role === "admin" });
    case "updateCurrentUser":
      requireUser(actor);
      return api.updateCurrentUser(input);
    case "deleteCurrentUser":
      requireUser(actor);
      return api.deleteCurrentUser();
    case "createProduct":
      requireAdmin(actor);
      return api.createProduct(input as Parameters<HarvestApi["createProduct"]>[0]);
    case "updateProduct":
      requireAdmin(actor);
      return api.updateProduct(stringValue(input.id), readRecord(input.input) as Parameters<HarvestApi["updateProduct"]>[1]);
    case "deleteProduct":
      requireAdmin(actor);
      return api.deleteProduct(stringValue(input.id));
    case "createOrder":
      requireUser(actor);
      return api.createOrder(withActorOrderIdentity(input, actor));
    case "updateOrder":
      requireAdmin(actor);
      return api.updateOrder(stringValue(input.id), readRecord(input.input) as Parameters<HarvestApi["updateOrder"]>[1]);
    case "createRental":
      requireUser(actor);
      return api.createRental(withActorRentalIdentity(input, actor));
    case "updateRental":
      requireAdmin(actor);
      return api.updateRental(stringValue(input.id), readRecord(input.input) as Parameters<HarvestApi["updateRental"]>[1]);
    case "deleteRental":
      requireAdmin(actor);
      return api.deleteRental(stringValue(input.id));
    case "updateUser":
      requireAdmin(actor);
      return api.updateUser(stringValue(input.id), readRecord(input.input));
    case "markNotificationRead":
      requireUser(actor);
      await assertNotificationAccess(api, actor, stringValue(input.id));
      return api.markNotificationRead(stringValue(input.id));
    case "deleteNotification":
      requireUser(actor);
      await assertNotificationAccess(api, actor, stringValue(input.id));
      return api.deleteNotification(stringValue(input.id));
    default:
      throw httpError(`Unsupported harvest proxy action: ${action}`, 400);
  }
}

function createServerBase44Client(token?: string) {
  const appId = process.env.BASE44_APP_ID || process.env.NEXT_PUBLIC_BASE44_APP_ID || DEFAULT_BASE44_APP_ID;
  const apiKey = process.env.BASE44_API_KEY;
  const serverUrl = process.env.BASE44_BACKEND_URL || process.env.NEXT_PUBLIC_BASE44_BACKEND_URL || DEFAULT_BASE44_BACKEND_URL;

  if (!appId || !serverUrl) {
    throw httpError("BASE44_APP_ID and BASE44_BACKEND_URL are required for the Harvest proxy.", 500);
  }

  return createClient({
    appId,
    headers: !token && apiKey ? { api_key: apiKey } : undefined,
    requiresAuth: false,
    serverUrl: normalizeBase44ServerUrl(serverUrl),
    token,
  });
}

async function getActor(base44: ReturnType<typeof createClient>, token?: string) {
  if (!token) return null;
  return mapBase44User(await base44.auth.me() as RawRecord);
}

function assertOrderAccess(actor: User | null, order: Awaited<ReturnType<HarvestApi["getOrder"]>>) {
  if (!order) return;
  if (!actor) return;
  if (actor.role === "admin") return;
  if (order.createdById) {
    if (!sameRecordId(order.createdById, actor.id)) {
      throw httpError("You do not have access to this order.", 403);
    }
    return;
  }
  if (order.customerEmail && !sameEmail(order.customerEmail, actor.email)) {
    throw httpError("You do not have access to this order.", 403);
  }
  if (!order.customerEmail) {
    throw httpError("You do not have access to this order.", 403);
  }
}

async function assertNotificationAccess(api: HarvestApi, actor: User, notificationId: string) {
  const notifications = await api.getNotifications(actor.email, { includeAdmin: actor.role === "admin" });
  if (!notifications.some((notification) => notification.id === notificationId)) {
    throw httpError("You do not have access to this notification.", 403);
  }
}

function requireUser(actor: User | null): asserts actor is User {
  if (!actor) throw httpError("Authentication is required for this Harvest action.", 401);
}

function requireAdmin(actor: User | null): asserts actor is User {
  requireUser(actor);
  if (actor.role !== "admin") throw httpError("Admin access is required for this Harvest action.", 403);
}

function withActorOrderIdentity(input: RawRecord, actor: User): CreateOrderInput {
  return {
    ...(input as CreateOrderInput),
    customerEmail: actor.email,
    customerName: getUserDisplayName(actor),
  };
}

function withActorRentalIdentity(input: RawRecord, actor: User): CreateRentalInput {
  return {
    ...(input as CreateRentalInput),
    customerEmail: actor.email,
    customerName: getUserDisplayName(actor),
  };
}

function getUserDisplayName(user: User) {
  return user.companyName || user.fullName || user.email || "A customer";
}

function isReadOnly() {
  return process.env.HARVEST_API_READ_ONLY !== "false";
}

function jsonOk(data: unknown) {
  return Response.json({ data });
}

function jsonError(error: string, status: number) {
  return Response.json({ error }, { status });
}

function httpError(message: string, status: number) {
  return Object.assign(new Error(message), { status });
}

function normalizeBase44ServerUrl(value: string) {
  return value.replace(/\/api\/?$/, "").replace(/\/$/, "");
}

function normalizeLoginRedirectUrl(value: string) {
  try {
    const redirectUrl = new URL(value);
    if (redirectUrl.hostname === "0.0.0.0") {
      redirectUrl.hostname = "localhost";
    }
    return redirectUrl.toString();
  } catch {
    return value;
  }
}

function readRecord(value: unknown): RawRecord {
  return value && typeof value === "object" ? value as RawRecord : {};
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function sameEmail(left: unknown, right: unknown) {
  return normalizeEmail(left) === normalizeEmail(right);
}

function sameRecordId(left: unknown, right: unknown) {
  return stringValue(left).trim() === stringValue(right).trim();
}

function normalizeEmail(value: unknown) {
  return stringValue(value).trim().toLowerCase();
}

function optionalString(value: unknown) {
  return typeof value === "string" && value ? value : undefined;
}

function numberValue(value: unknown, fallback = 0) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : fallback;
}
