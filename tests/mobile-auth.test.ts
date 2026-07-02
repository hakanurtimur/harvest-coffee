import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  MOBILE_AUTH_CODE_PARAM,
  MOBILE_LOGIN_NONCE_PARAM,
  appendMobileLoginNonce,
  getMobileLoginCallbackParams,
} from "../apps/mobile/lib/mobile-auth.ts";

describe("mobile auth helpers", () => {
  it("adds the login nonce to custom-scheme return URLs", () => {
    const returnTo = appendMobileLoginNonce("harvestcoffee://login", "nonce-123");
    const params = getMobileLoginCallbackParams(returnTo);

    assert.equal(params.get(MOBILE_LOGIN_NONCE_PARAM), "nonce-123");
  });

  it("reads callback params from Expo URLs", () => {
    const params = getMobileLoginCallbackParams("exp://ca-ine8-anonymous-8081.exp.direct/--/login?auth_code=code&login_nonce=nonce-456");

    assert.equal(params.get(MOBILE_AUTH_CODE_PARAM), "code");
    assert.equal(params.get(MOBILE_LOGIN_NONCE_PARAM), "nonce-456");
  });
});
