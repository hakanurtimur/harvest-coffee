import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { createProxyHarvestApi } from "../packages/api/src/index.ts";

describe("createProxyHarvestApi unauthorized handling", () => {
  it("notifies the caller before throwing a 401 proxy error", async () => {
    const calls: string[] = [];
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async () => new Response(JSON.stringify({ error: "Authentication is required." }), {
      headers: { "content-type": "application/json" },
      status: 401,
    });

    try {
      const api = createProxyHarvestApi({
        endpoint: "https://harvest.example/api/harvest",
        onUnauthorized: () => {
          calls.push("unauthorized");
        },
      });

      await assert.rejects(() => api.getProducts(), /Authentication is required/);
      assert.deepEqual(calls, ["unauthorized"]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
