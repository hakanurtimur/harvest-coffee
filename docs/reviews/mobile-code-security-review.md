# Harvest Coffee Mobile Code + Security Review

Date: 2026-06-26
Scope: `apps/mobile`, shared `packages/api`, shared `packages/domain`, and the web proxy/auth bridge used by mobile.

## Executive Summary

The mobile app is in a much better state than the earlier mock/demo phase: mobile no longer contains a mock runtime fallback, no Base44 API key or client secret was found in the mobile/shared source, and live data goes through the web proxy contract. Mobile auth now uses a nonce-protected, short-lived auth-code bridge instead of redirecting raw Base44 access tokens. Persisted mobile sessions also cache JWT expiry metadata and clear expired tokens on boot. The main remaining risks are around release configuration and optional server-backed one-time auth-code hardening.

No Critical or High findings were identified from the current static review.

## Positive Controls

- Mobile uses `EXPO_PUBLIC_HARVEST_API_URL` only as a public proxy URL; no Base44 secret is shipped in the app.
- `apps/mobile/lib/mobile-state.tsx` creates the API client through `createProxyHarvestApi` and fails closed when the proxy URL is missing.
- No `Alert.alert`, `WebView`, `eval`, `dangerouslySetInnerHTML`, `localStorage`, `AsyncStorage`, `api_key`, or `client_secret` usage was found in `apps/mobile`, `packages/api`, or `packages/domain`.
- Mobile now uses `expo-secure-store` through `apps/mobile/lib/token-store.ts` and `apps/mobile/lib/secure-token-store.ts` for the Base44 access token cache.
- Stored Base44 access tokens are decoded for JWT `exp`, expiry metadata is cached, and expired persisted tokens are cleared before the session is restored.
- Runtime `401` responses from the proxy trigger secure token cleanup and reset the mobile session state.
- Mobile login now creates a one-time SecureStore nonce, sends it in the `return_to` callback URL, and accepts returned auth codes only when the callback nonce matches.
- `apps/web/app/mobile-auth/callback/route.ts` converts Base44 callback tokens into encrypted short-lived auth codes; `apps/web/app/api/harvest/route.ts` exchanges those codes for the access token over the proxy response instead of putting the access token in the redirect URL.
- Root routing is centralized in `apps/mobile/app/_layout.tsx`; logged-out private routes redirect to login and role shells are selected from one place.
- Destructive product, rental, address, and notification deletes use `ConfirmDialog` and loading/disabled state in the inspected screens.
- Admin/dealer data access is primarily enforced by the web proxy route, including `created_by_id` order access checks and admin write guards.

## Findings

### High

No current High findings.

### Medium

#### M-00 Mobile auth code exchange is short-lived but not backed by a server-side one-time store

Evidence:
- `apps/web/app/mobile-auth/callback/route.ts` delegates redirect creation to `apps/web/lib/mobile-auth-bridge.ts` and no longer writes `access_token` into the redirect URL.
- `apps/web/lib/mobile-auth-code.ts` encrypts Base44 tokens into short-lived auth codes.
- `apps/web/app/api/harvest/route.ts` exposes `exchangeMobileAuthCode` to exchange the code over the proxy response.
- `apps/web/lib/security-helpers.ts` now rejects arbitrary `exp:` hosts, permits `harvestcoffee:` always, and permits Expo development hosts only when explicitly enabled by the mobile auth bridge.
- `apps/mobile/app/(public)/login.tsx` builds the mobile auth bridge with a one-time nonce-protected `return_to` URL.
- `apps/mobile/lib/mobile-auth.ts` and `apps/mobile/lib/token-store.ts` validate the returned callback nonce before exchanging the auth code.

Impact:
Resolved for raw-token URL exposure. The remaining hardening opportunity is making the auth code strictly one-time across serverless instances with a shared store, or adding a PKCE-style verifier if the bridge is extended further.

Recommended fix:
- Use the custom app scheme `harvestcoffee:` for production mobile callbacks.
- Keep `exp:`/`exps:` behind the explicit `HARVEST_ALLOW_EXPO_MOBILE_REDIRECTS=true` development flag or an exact environment allowlist.
- Keep the mobile-generated nonce/state regression covered.
- Consider a server-backed one-time code store or PKCE-style verifier for an additional production hardening pass.

Test scenario:
- Start a login with `return_to=exp://attacker.example/--/login` and verify the bridge rejects it.
- Start a valid login with the expected Expo development URL and a matching nonce and verify it succeeds.
- Start a callback with a missing or stale nonce and verify mobile rejects the auth code.
- Verify the mobile redirect URL contains `auth_code` and never contains `access_token`.

#### M-01 Proxy bearer token transport is header-only

Evidence:
- `packages/api/src/index.ts` sends bearer tokens through `Authorization: Bearer <token>`.
- `apps/web/app/api/harvest/route.ts` reads bearer tokens from the `Authorization` header only.

Impact:
Resolved. Bearer tokens are no longer included in JSON request bodies.

Recommended fix:
- Keep request bodies free of token fields.
- Keep regression coverage around the proxy adapter.

Test scenario:
- `tests/api-unauthorized.test.ts` verifies the proxy request body does not contain `token` and the header contains `Authorization: Bearer <token>`.

#### M-02 Successful writes were decoupled from full refresh calls

Evidence:
- `apps/mobile/lib/mobile-state.tsx` now separates `createOrder`/`createRental` failures from post-create refresh failures.
- If create succeeds but refresh fails, the app shows an informational "created, but latest list could not be refreshed" feedback and still returns the created record.

Impact:
Resolved. A follow-up refresh failure no longer makes the create action fail after Base44 has already created an order or rental.

Recommended fix:
- Keep this regression covered when refactoring mobile state.

Test scenario:
- Mock or force `refreshDealerData` to fail after a successful `createOrder`. The app should still clear the cart and navigate to order detail.

#### M-03 Admin settings are explicitly session-only

Evidence:
- `apps/mobile/app/admin-settings.tsx:14` through `apps/mobile/app/admin-settings.tsx:18` says preferences remain in the admin session.
- `apps/mobile/app/admin-settings.tsx` labels the screen as session-only until Base44 exposes a supported settings field.
- `apps/mobile/lib/mobile-state.tsx` updates only local `currentUser` and `users`, and the success feedback says Base44 does not expose a persistent admin settings field yet.
- User API docs did not show an `admin_settings` field as a stable Base44 user field.

Impact:
Resolved for mobile UX. The feature is no longer presented as durable Base44 persistence.

Recommended fix:
- If persistence is required later, add a documented settings entity or Base44 function and wire it through the proxy.

Test scenario:
- Change an admin setting, restart the app, and verify either the setting is persisted through a supported API or the UI clearly says it is not.

#### M-04 Product "Generate description" uses the shared Base44 proxy action

Evidence:
- `apps/mobile/app/admin-products.tsx` calls `api.generateProductDescription(...)`.
- `packages/api/src/index.ts` exposes `generateProductDescription` through `createProxyHarvestApi`.
- `/api/harvest` already routes the action to the Base44 `generateProductDescription` function behind admin authorization.

Impact:
Resolved. Mobile and web now use the same Base44/proxy source for product description generation.

Recommended fix:
- Keep admin-only authorization on the proxy action.
- Keep `tests/api-unauthorized.test.ts` coverage for the shared proxy action.

Test scenario:
- Tap "Generate copy" in mobile admin products and verify it calls the proxy `generateProductDescription` action.

#### M-05 Public products can fail noisily when the proxy URL is missing

Evidence:
- `apps/mobile/app/(public)/products.tsx:43` through `apps/mobile/app/(public)/products.tsx:59` loads public products when logged out.
- `apps/mobile/lib/mobile-state.tsx:428` through `apps/mobile/lib/mobile-state.tsx:435` rejects API calls when `EXPO_PUBLIC_HARVEST_API_URL` is missing.

Impact:
Opening public products without a configured proxy can create an unhandled promise rejection instead of a clean configuration error state.

Recommended fix:
- Add `.catch` around the public product load and show a native error state.
- Optionally skip public product fetching entirely when no proxy endpoint is configured.

Test scenario:
- Start the app without `EXPO_PUBLIC_HARVEST_API_URL`, open public products, and verify the app shows a controlled error instead of console/runtime noise.

### Low

#### L-01 Access token lifetime metadata is modeled from JWT expiry

Evidence:
- `apps/mobile/lib/token-store.ts` stores the mobile Base44 access token in `expo-secure-store`.
- `apps/mobile/lib/token-store.ts` decodes JWT `exp`, stores `harvest_mobile_access_token_expires_at`, and clears expired persisted tokens during `loadAccessToken`.
- `apps/mobile/lib/mobile-state.tsx` restores the stored token on boot only after token-store validation and clears it on logout, unresolved session, or runtime `401`.
- `tests/mobile-token-store.test.ts` covers expiry metadata persistence, unexpired restore, and expired token cleanup.

Impact:
Resolved for the current JWT-based Base44 token shape. Persisted sessions are no longer restored when the token is already expired or within the configured expiry skew window.

Recommended fix:
- Keep the JWT expiry regression tests.
- If Base44 later exposes refresh tokens or explicit token lifetime metadata, add proactive refresh/re-auth before expiry.

Test scenario:
- Login, kill/reopen the app, and verify the user is restored.
- Persist an expired token, reopen the app, and verify the token is cleared with no login loop.
- Revoke a still-unexpired session server-side, trigger any API request, and verify runtime `401` still clears the secure token.

#### L-02 Order detail can show stale cached order data

Evidence:
- `apps/mobile/app/order/[id].tsx:15` through `apps/mobile/app/order/[id].tsx:34` only fetches the order if it is not already present in local state.

Impact:
If an admin changes status/payment/tracking on another device, mobile order detail can show the cached version until another refresh happens.

Recommended fix:
- Show cached data immediately, then revalidate order detail on screen focus.
- Keep a loading or "updated" state separate from the cached view.

Test scenario:
- Open an order detail, update the same order elsewhere, navigate away/back, and verify fresh status is shown.

#### L-03 Notification mark-read failures are silent

Evidence:
- `apps/mobile/app/notifications.tsx:14` through `apps/mobile/app/notifications.tsx:21` catches no error in `markRead`.

Impact:
If a mark-read request fails, the user gets no message and the badge/list can look inconsistent.

Recommended fix:
- Catch errors and show `StatusBanner`, matching delete notification behavior.

Test scenario:
- Force `markNotificationRead` to return 403/500 and verify a visible error appears.

#### L-04 Unknown Base44 roles map to dealer

Evidence:
- `packages/api/src/index.ts:750` through `packages/api/src/index.ts:753` maps `admin` to admin and all other roles to dealer.

Impact:
This matches the known Base44 `user` role to the app's dealer role, but it fails open for unexpected role values.

Recommended fix:
- Map `user` explicitly to dealer.
- Treat unknown roles as unauthorized or a limited default until reviewed.

Test scenario:
- Simulate a user with role `guest` or an empty role and verify private dealer screens are not granted automatically.

## Screen Flow Notes

Dealer:
- Products/cart uses profile addresses and disables the place-order button while saving.
- Orders/order detail/track order are routed through the role-aware shell.
- Rentals/create rental use native date picker and proxy create flows.
- Profile address add/edit/delete/select uses `updateCurrentUser` and delete confirmation.
- Notifications can mark read/delete with confirmation/disabled states, success feedback, and visible error feedback through the shared mobile feedback banner.

Admin:
- Dashboard/orders/products/stock/customers/reports/settings/rentals/calendar use the shared state/proxy model.
- Customer order summaries use `createdById` first through `getOrdersForUser`.
- Product/rental/address destructive actions have confirmation.
- Admin settings are clearly session-only on mobile; product description generation now uses the shared Base44 proxy action.

## Base44 Project Action Required

- Notification side effects should stay in the Base44 project/functions. Mobile should read, mark read, and delete notifications, but should not create duplicate notification records to compensate for Base44 side-effect bugs.
- Order-created and order-status-changed notification correctness depends on the Base44 side effect assigning the right recipient fields.
- Rental status automation and reminder notification behavior should be validated in Base44 functions/schedules, not faked in mobile.

## Recommended Fix Order

1. Decide whether admin settings should remain session-only or gain a documented persisted Base44 settings backend.
2. Optionally back mobile auth codes with a shared one-time store or PKCE-style verifier before app-store release.

## Verification Performed

- Static search for risky mobile patterns.
- Manual source review of mobile auth, root layout, mobile state, proxy API contract, dealer flows, admin flows, and shared mappers.
- TypeScript verification should be run after this report: `npx tsc -p apps/mobile/tsconfig.json --noEmit`.
