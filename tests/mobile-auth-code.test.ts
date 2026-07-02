import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { consumeMobileAuthCode, createMobileAuthCode } from "../apps/web/lib/mobile-auth-code.ts";

describe("mobile auth code bridge", () => {
  it("creates short-lived encrypted codes without exposing the access token", () => {
    const code = createMobileAuthCode({
      accessToken: "base44-access-token",
      isNewUser: "false",
      now: 1_000,
      secret: "test-secret",
    });

    assert.equal(code.includes("base44-access-token"), false);
    assert.deepEqual(
      consumeMobileAuthCode(code, {
        now: 1_500,
        secret: "test-secret",
      }),
      {
        accessToken: "base44-access-token",
        isNewUser: "false",
      },
    );
  });

  it("rejects expired mobile auth codes", () => {
    const code = createMobileAuthCode({
      accessToken: "base44-access-token",
      now: 1_000,
      secret: "test-secret",
      ttlMs: 500,
    });

    assert.throws(
      () => consumeMobileAuthCode(code, { now: 1_501, secret: "test-secret" }),
      /expired/i,
    );
  });

  it("mobile auth callback route does not redirect raw access tokens", () => {
    const source = readFileSync(new URL("../apps/web/app/mobile-auth/callback/route.ts", import.meta.url), "utf8");

    assert.equal(source.includes("access_token"), false);
    assert.equal(source.includes("buildMobileAuthRedirect"), true);
  });
});
