import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { createProxyHarvestApi, exchangeMobileAuthCode } from "../packages/api/src/index.ts";

describe("createProxyHarvestApi unauthorized handling", () => {
  it("sends bearer tokens only through the Authorization header", async () => {
    const originalFetch = globalThis.fetch;
    let requestBody: unknown;
    let authorizationHeader: string | undefined;

    globalThis.fetch = async (_url, init) => {
      requestBody = JSON.parse(String(init?.body ?? "{}"));
      const headers = init?.headers as Record<string, string> | undefined;
      authorizationHeader = headers?.authorization;

      return new Response(JSON.stringify({ data: [] }), {
        headers: { "content-type": "application/json" },
        status: 200,
      });
    };

    try {
      const api = createProxyHarvestApi({
        endpoint: "https://harvest.example/api/harvest",
        getAccessToken: () => "secret-token",
      });

      await api.getProducts();

      assert.equal(authorizationHeader, "Bearer secret-token");
      assert.equal(Object.hasOwn(requestBody as Record<string, unknown>, "token"), false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

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

  it("calls the shared proxy action for product description generation", async () => {
    const originalFetch = globalThis.fetch;
    let actionName = "";

    globalThis.fetch = async (_url, init) => {
      const body = JSON.parse(String(init?.body ?? "{}"));
      actionName = String(body.action);

      return new Response(JSON.stringify({
        data: { description: "Generated copy", message: "Product description generated." },
      }), {
        headers: { "content-type": "application/json" },
        status: 200,
      });
    };

    try {
      const api = createProxyHarvestApi({
        endpoint: "https://harvest.example/api/harvest",
      });

      const result = await api.generateProductDescription({
        category: "Blend",
        productName: "House Espresso Beans",
        weight: "1kg",
      });

      assert.equal(actionName, "generateProductDescription");
      assert.equal(result.description, "Generated copy");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("exchanges mobile auth codes without sending an Authorization header", async () => {
    const originalFetch = globalThis.fetch;
    let requestBody: unknown;
    let authorizationHeader: string | undefined;

    globalThis.fetch = async (_url, init) => {
      requestBody = JSON.parse(String(init?.body ?? "{}"));
      const headers = init?.headers as Record<string, string> | undefined;
      authorizationHeader = headers?.authorization;

      return new Response(JSON.stringify({
        data: { accessToken: "base44-access-token", isNewUser: "false" },
      }), {
        headers: { "content-type": "application/json" },
        status: 200,
      });
    };

    try {
      const result = await exchangeMobileAuthCode("https://harvest.example/api/harvest", "auth-code");

      assert.deepEqual(requestBody, {
        action: "exchangeMobileAuthCode",
        input: { code: "auth-code" },
      });
      assert.equal(authorizationHeader, undefined);
      assert.equal(result.accessToken, "base44-access-token");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
