import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  MOBILE_ACCESS_TOKEN_EXPIRES_AT_KEY,
  MOBILE_LOGIN_NONCE_KEY,
  createMobileTokenStore,
  readJwtExpirationMs,
} from "../apps/mobile/lib/token-store.ts";

describe("createMobileTokenStore", () => {
  it("loads a persisted token into the synchronous cache", async () => {
    const storage = createFakeSecureStore({ harvest_mobile_access_token: "stored-token" });
    const store = createMobileTokenStore(storage);

    assert.equal(store.getAccessToken(), null);
    assert.equal(await store.loadAccessToken(), "stored-token");
    assert.equal(store.getAccessToken(), "stored-token");
  });

  it("persists and clears tokens while keeping synchronous reads current", async () => {
    const storage = createFakeSecureStore();
    const store = createMobileTokenStore(storage);

    await store.setAccessToken("fresh-token");
    assert.equal(store.getAccessToken(), "fresh-token");
    assert.equal(storage.values.harvest_mobile_access_token, "fresh-token");

    await store.clearAccessToken();
    assert.equal(store.getAccessToken(), null);
    assert.equal("harvest_mobile_access_token" in storage.values, false);
  });

  it("persists JWT expiry metadata when setting an expiring token", async () => {
    const storage = createFakeSecureStore();
    const store = createMobileTokenStore(storage, { now: () => 1_000 });
    const token = createJwtWithExp(120);

    await store.setAccessToken(token);

    assert.equal(storage.values.harvest_mobile_access_token, token);
    assert.equal(storage.values[MOBILE_ACCESS_TOKEN_EXPIRES_AT_KEY], "120000");
  });

  it("decodes JWT expiry without relying on platform atob", () => {
    const token = createJwtWithExp(120);
    const originalAtob = globalThis.atob;

    try {
      Object.defineProperty(globalThis, "atob", { configurable: true, value: undefined });
      assert.equal(readJwtExpirationMs(token), 120000);
    } finally {
      Object.defineProperty(globalThis, "atob", { configurable: true, value: originalAtob });
    }
  });

  it("keeps unexpired persisted tokens during load", async () => {
    const token = createJwtWithExp(120);
    const storage = createFakeSecureStore({
      harvest_mobile_access_token: token,
      [MOBILE_ACCESS_TOKEN_EXPIRES_AT_KEY]: "120000",
    });
    const store = createMobileTokenStore(storage, { now: () => 10_000 });

    assert.equal(await store.loadAccessToken(), token);
    assert.equal(store.getAccessToken(), token);
    assert.equal(storage.values.harvest_mobile_access_token, token);
  });

  it("clears expired persisted tokens during load", async () => {
    const token = createJwtWithExp(1);
    const storage = createFakeSecureStore({
      harvest_mobile_access_token: token,
      [MOBILE_ACCESS_TOKEN_EXPIRES_AT_KEY]: "1000",
    });
    const store = createMobileTokenStore(storage, { now: () => 2_000 });

    assert.equal(await store.loadAccessToken(), null);
    assert.equal(store.getAccessToken(), null);
    assert.equal("harvest_mobile_access_token" in storage.values, false);
    assert.equal(MOBILE_ACCESS_TOKEN_EXPIRES_AT_KEY in storage.values, false);
  });

  it("creates and consumes one-time login nonces", async () => {
    const storage = createFakeSecureStore();
    const store = createMobileTokenStore(storage);

    const nonce = await store.createLoginNonce();

    assert.equal(typeof nonce, "string");
    assert.equal(nonce.length >= 32, true);
    assert.equal(storage.values[MOBILE_LOGIN_NONCE_KEY], nonce);

    assert.equal(await store.consumeLoginNonce("wrong-nonce"), false);
    assert.equal(MOBILE_LOGIN_NONCE_KEY in storage.values, false);

    const nextNonce = await store.createLoginNonce();
    assert.equal(await store.consumeLoginNonce(nextNonce), true);
    assert.equal(MOBILE_LOGIN_NONCE_KEY in storage.values, false);
  });
});

function createFakeSecureStore(initialValues: Record<string, string> = {}) {
  const values = { ...initialValues };
  return {
    values,
    async deleteItemAsync(key: string) {
      delete values[key];
    },
    async getItemAsync(key: string) {
      return values[key] ?? null;
    },
    async setItemAsync(key: string, value: string) {
      values[key] = value;
    },
  };
}

function createJwtWithExp(expSeconds: number) {
  return [
    base64UrlEncode(JSON.stringify({ alg: "none", typ: "JWT" })),
    base64UrlEncode(JSON.stringify({ exp: expSeconds })),
    "signature",
  ].join(".");
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}
