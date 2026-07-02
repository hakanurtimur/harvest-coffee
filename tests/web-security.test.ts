import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  createMemoryRateLimiter,
  getSafeHarvestLoginRedirectUrl,
  getSafeMobileRedirectUrl,
} from "../apps/web/lib/security-helpers.ts";

describe("Harvest web security helpers", () => {
  it("allows only auth callback login redirects on the current origin", () => {
    assert.equal(
      getSafeHarvestLoginRedirectUrl("/auth/callback?next=%2Fproducts", "https://harvest.example"),
      "https://harvest.example/auth/callback?next=%2Fproducts",
    );
    assert.equal(
      getSafeHarvestLoginRedirectUrl("https://harvest.example/mobile-auth/callback?return_to=harvestcoffee://login", "https://harvest.example"),
      "https://harvest.example/mobile-auth/callback?return_to=harvestcoffee://login",
    );
  });

  it("rejects open redirects and non-auth login redirect paths", () => {
    assert.equal(getSafeHarvestLoginRedirectUrl("https://evil.example/auth/callback", "https://harvest.example"), null);
    assert.equal(getSafeHarvestLoginRedirectUrl("//evil.example/auth/callback", "https://harvest.example"), null);
    assert.equal(getSafeHarvestLoginRedirectUrl("/products", "https://harvest.example"), null);
    assert.equal(getSafeHarvestLoginRedirectUrl("javascript:alert(1)", "https://harvest.example"), null);
  });

  it("allows app-owned and Expo mobile redirect targets only", () => {
    assert.equal(
      getSafeMobileRedirectUrl("exp://ca-ine8-anonymous-8081.exp.direct/--/login")?.toString(),
      "exp://ca-ine8-anonymous-8081.exp.direct/--/login",
    );
    assert.equal(getSafeMobileRedirectUrl("harvestcoffee://login")?.toString(), "harvestcoffee://login");
    assert.equal(getSafeMobileRedirectUrl("exp://evil.example/--/login"), null);
    assert.equal(getSafeMobileRedirectUrl("https://evil.example/login"), null);
  });

  it("rate limits repeated contact requests per key", () => {
    const limiter = createMemoryRateLimiter({ limit: 2, windowMs: 1000 });

    assert.equal(limiter.check("ip:1", 0).allowed, true);
    assert.equal(limiter.check("ip:1", 100).allowed, true);
    assert.equal(limiter.check("ip:1", 200).allowed, false);
    assert.equal(limiter.check("ip:1", 1200).allowed, true);
  });
});
