import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { createMobileTokenStore } from "../apps/mobile/lib/token-store.ts";

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
