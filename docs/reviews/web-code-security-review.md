# Harvest Coffee Web Code + Security Review

Date: 2026-06-25
Scope: `apps/web`, shared API/domain mappers, Base44 proxy, auth callback routes, Base44 functions that affect web behavior.

## Executive Summary

The web app is close to the intended proxy-first Base44 architecture, but it is not yet release-clean. The main blockers are authorization hardening in `/api/harvest`, direct-adapter footguns, and route-shell decisions that can show the wrong layout after login.

No tracked API key was found in the reviewed source, and the Base44 API key is used server-side in the proxy path. The final Base44 OAuth callback also has same-origin redirect validation. Those are good foundations. The items below should be fixed before treating the web build as production-ready.

## Critical

No critical issues found in static review.

## High

### H1. `getOrder` can return an order by id without authentication

- Evidence: `apps/web/app/api/harvest/route.ts:106` calls `api.getOrder(...)`, then `assertOrderAccess(actor, order)`.
- Evidence: `apps/web/app/api/harvest/route.ts:195-198` returns early when `actor` is null.
- Impact: Anyone who can guess or obtain an Order id can call the proxy `getOrder` action and receive the full order detail payload, including address, payment status, tracking number, ETA, and items.
- Recommended fix: Require an authenticated actor for `getOrder`. Keep unauthenticated lookup limited to `getOrderByNumber`, and consider returning a redacted public tracking DTO there instead of the full internal Order.
- Test: POST `/api/harvest` with `{ "action": "getOrder", "input": { "id": "<known-order-id>" } }` and no token should return `401`.

### H2. `updateCurrentUser` allows client-controlled sensitive User fields

- Evidence: `apps/web/app/api/harvest/route.ts:126-128` passes raw `input` to `api.updateCurrentUser(input)`.
- Evidence: `apps/web/lib/api.ts:594-605` serializes `email`, `role`, `customer_segment`, and `admin_settings` if present.
- Evidence: OpenAPI User fields include `role`, `email`, `full_name`, `phone`, `addresses`, `acquisition_source`, `customer_segment`, `company_name`, but do not document `admin_settings`.
- Impact: A dealer can attempt to update fields that should be server/admin controlled. If Base44 accepts role mutation, this is a privilege escalation path. Even if Base44 rejects it, the web proxy should fail closed.
- Recommended fix: Add a server-side whitelist for `updateCurrentUser`: allow only profile-safe fields such as `fullName`, `phone`, `companyName`, `addresses`, and optionally `acquisitionSource`. Never accept `role`, `email`, `customerSegment`, or `adminSettings` from the current-user endpoint.
- Test: As dealer, POST `updateCurrentUser` with `{ role: "admin" }` should return `400/403` and should not change Base44 User.

## Medium

### M1. Direct Base44 adapter remains available in the browser bundle

- Evidence: `apps/web/lib/harvest-api.ts:28-36` can create a client-side Base44 adapter when `NEXT_PUBLIC_HARVEST_API_ADAPTER=base44`.
- Evidence: `apps/web/lib/harvest-api.ts:182-188` reads `app_id`, `server_url`, `access_token`, and `functions_version` from URL/localStorage for that direct adapter.
- Impact: The desired architecture is browser/mobile -> web proxy -> Base44. The direct client adapter is a production footgun: a bad env or URL-provided params can bypass the proxy's server-side allowlist and authorization logic.
- Recommended fix: Remove the direct Base44 adapter from production web code, or gate it behind a dev-only check (`NODE_ENV !== "production"` and explicit local flag). Production should only allow proxy mode.
- Test: Production build with `NEXT_PUBLIC_HARVEST_API_ADAPTER=base44` should fail loudly or ignore the adapter.

### M2. Access token is stored in JavaScript-readable `localStorage`

- Evidence: `apps/web/lib/harvest-api.ts:191-240` reads/writes `harvest_access_token` in `localStorage`.
- Evidence: `/auth/callback` stores the returned access token at `apps/web/app/auth/callback/page.tsx:30`.
- Impact: Any XSS bug can exfiltrate the Base44 access token. This is currently mitigated only by React escaping and limited code sinks, but the storage model itself raises the blast radius.
- Recommended fix: Prefer an HTTP-only, Secure, SameSite session cookie on the web proxy if Base44 flow allows it. If localStorage must remain, add strict CSP/security headers, avoid third-party scripts, keep token TTL short, and never log URLs containing tokens.
- Test: Verify network/client bundle never exposes `BASE44_API_KEY`; verify CSP blocks inline/script injection in a staged build.

### M3. No app-level CSP/security headers are configured

- Evidence: `apps/web/next.config.mjs:6-8` only configures `outputFileTracingRoot`.
- Evidence: `apps/web/app/layout.tsx:24-34` has no equivalent header policy.
- Impact: Because auth tokens live in localStorage, lack of CSP materially increases XSS impact. Other standard hardening headers are also absent.
- Recommended fix: Add `headers()` in `next.config.mjs` or Vercel header config for at least `Content-Security-Policy`, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`, `X-Content-Type-Options`, and `Permissions-Policy`.
- Test: `curl -I` staging/prod and verify the headers are present.

### M4. `safeEntity*` helpers silently convert live Base44 failures into empty data

- Evidence: `apps/web/lib/api.ts:850-872` catches entity filter/get/list errors and returns `[]`/`null`.
- Impact: Live API/auth/schema failures look like empty orders, missing details, or no rentals. This can hide real data loss, authorization mistakes, and Base44 contract drift.
- Recommended fix: In proxy/live mode, surface the error to the UI. If fallback is needed, restrict it to known unsupported Base44 SDK methods and include telemetry/logging.
- Test: Force an entity request failure and confirm UI shows a clear live-data error instead of an empty list.

### M5. Mapper defaults hide schema drift

- Evidence: `apps/web/lib/api.ts:712-738` maps unknown category/status/payment values to default valid values.
- Evidence: `apps/web/lib/api.ts:740-742` maps unknown rental status to `upcoming`.
- Impact: If Base44 returns an unexpected enum, the UI silently shows wrong operational status. That is especially risky for orders, rentals, and stock.
- Recommended fix: Parse raw records with zod or explicit enum guards that either preserve an `unknown` state for the UI or throw a typed mapper error in live mode.
- Test: Feed a raw order with status `cancelled` or malformed status and verify it does not silently become `preparing`.

### M6. Client-side shell selection causes wrong-layout flicker and routing drift

- Evidence: `apps/web/components/ProductsRouteShell.tsx:13-49` decides public vs app shell only after client-side session sync.
- Evidence: `apps/web/components/PublicShell.tsx:366-368` leaves public shell only for `/`, `/home`, `/about`, `/contact`, and `/login`, not every authenticated-only context.
- Evidence: `apps/web/components/AppShell.tsx:51-117` performs auth/role redirects after mount.
- Impact: Dealer/admin users can briefly see public shell, and route behavior depends on client hydration. This matches the observed dealer/public layout confusion.
- Recommended fix: Move shell decisions to route groups or server-readable session state where possible. At minimum, create explicit dealer/admin route wrappers for app routes and remove public shell bridging from authenticated paths.
- Test: Log in as dealer and hard-refresh `/products`, `/orders`, `/rentals`, `/profile`, and `/trackorder`; public shell should never render, even briefly.

### M7. Demo data paths removed from web/mobile runtime

- Status: Resolved after review.
- Evidence: Web login now only exposes Google/Base44 sign-in. Web and mobile runtime API factories no longer fall back to fixture data.
- Impact: A production env mistake can no longer silently show local demo data as authenticated dealer/admin data.
- Test: In production env, `/login` should expose only Google sign-in and stale local role state should have no effect.

### M8. Base44 functions and AI utilities no longer return local demo results

- Status: Resolved after review.
- Evidence: Integration helpers now require a Base44 function client and invoke Base44 functions directly.
- Impact: Missing function wiring now fails visibly instead of returning local generated content.
- Test: Generate description, low-stock notification, and rental utility calls should either return live Base44 function results or a clear function error.
- Test: Trigger the UI action and verify the request goes to a server endpoint and then Base44 function, not a local generated response.

### M9. Shared API/domain code is duplicated between web and packages

- Evidence: `apps/web/lib/api.ts` and `packages/api/src/index.ts` both contain Base44 mappers and serializers, including the same User update serializer pattern.
- Evidence: `apps/web/lib/domain.ts` and `packages/domain/src/index.ts` duplicate domain schemas.
- Impact: Web fixes can diverge from mobile/shared behavior. This is already a risk because mobile is expected to use the same API contract.
- Recommended fix: Move web to consume `packages/api` and `packages/domain`, or add contract tests that run against both implementations until consolidation is done.
- Test: Add fixture-based mapper tests for Product, Order, Rental, Notification, User raw Base44 samples and run them for shared/web paths.

## Low

### L1. Auth callback page does not validate `next` itself

- Evidence: `apps/web/app/auth/callback/page.tsx:22-37` reads `next` from query and passes it to `router.replace`.
- Positive control: `apps/web/app/api/apps/auth/final-callback/route.ts:26-34` same-origin validates Base44 callback state before forwarding.
- Impact: The normal Base44 callback path is protected, but direct visits to `/auth/callback?access_token=...&next=...` rely on Next router behavior and do not explicitly enforce a relative/internal destination.
- Recommended fix: Add a `getSafeNextPath` helper in the callback page and only allow relative app paths.
- Test: Direct `/auth/callback?access_token=fake&next=https://example.com` must not navigate cross-origin.

### L2. Order numbers are predictable

- Evidence: `apps/web/lib/domain.ts:238-240` creates order numbers from the last 8 digits of `Date.now()`.
- Impact: Public track-order lookup by order number can be enumerated more easily than with random identifiers.
- Recommended fix: Add random entropy or use a Base44/server-generated opaque order number. Consider rate limiting public tracking lookup.
- Test: Generate multiple order numbers and verify they are not trivially sequential/predictable.

### L3. `dangerouslySetInnerHTML` is present in chart styling

- Evidence: `apps/web/components/ui/chart.tsx:71-90` injects generated CSS variables via `dangerouslySetInnerHTML`.
- Impact: Current configs appear internal, so this is not an immediate exploit. If chart config ever becomes user-controlled, CSS/script injection risk increases.
- Recommended fix: Keep chart config internal only, or validate color tokens strictly before style injection.
- Test: Attempt to pass malformed chart color config in tests and ensure it is rejected or escaped.

### L4. Deployment config still carries legacy/Vite confusion at repo level

- Evidence: root `package.json:14-19` keeps `legacy:*` Vite commands.
- Evidence: `base44/config.jsonc:3-8` still points Base44 site output to `./dist`.
- Positive control: `apps/web/vercel.json:3-6` correctly declares Next.js and app-level build commands.
- Impact: This already caused confusion during deploy setup. It is not a runtime security issue, but it increases operational risk.
- Recommended fix: Document that Vercel root is `apps/web`, or remove/rename legacy scripts once Base44 migration is fully frozen.
- Test: Fresh Vercel project import uses `apps/web` as root and does not detect Vite.

## Positive Controls Observed

- `/api/harvest` uses an action allowlist via the switch in `apps/web/app/api/harvest/route.ts:84-169`.
- Admin-only reads/writes call `requireAdmin` in the proxy for orders/users/product/rental admin actions.
- Write operations are blocked unless `HARVEST_API_READ_ONLY=false`, via `apps/web/app/api/harvest/route.ts:68-70` and `249-250`.
- Base44 final auth callback validates same-origin redirect state at `apps/web/app/api/apps/auth/final-callback/route.ts:26-34`.
- Mobile auth callback restricts redirect protocols to `exp:`, `exps:`, and `harvestcoffee:` at `apps/web/app/mobile-auth/callback/route.ts:1-31`.
- `.env.local` is ignored by git.

## API Parity Notes

- Product: OpenAPI fields match the mapper broadly. Risk remains around enum defaulting.
- Order: OpenAPI has `created_by_id` and no `customer_email`/`customer_name`. Current create path correctly omits `customer_email`, but old fallback logic remains in reads. Dealer ownership should be enforced by `created_by_id`.
- Rental: OpenAPI includes `customer_email` and `customer_name`; current mapper/create path matches that.
- Notification: OpenAPI includes `recipient_email`, `is_admin`, `related_entity`, `related_entity_id`, and read flag; current mapper matches. Duplicate/wrong notification behavior should be fixed in Base44 function logic/deployment, not by adding extra web-side notification creates.
- User: OpenAPI role enum is `admin`/`user`; the app's `dealer` is a domain alias for Base44 `user`. `admin_settings` is not in the OpenAPI User schema and should not be treated as a guaranteed persisted User field without Base44 confirmation.

## Base44 Project Actions Required

- Validate and deploy `base44/functions/onOrderCreated/entry.ts`; it should resolve the dealer from `order.created_by_id` before creating dealer/admin notifications.
- Validate and deploy `base44/functions/onOrderStatusChanged/entry.ts`; it should resolve the dealer from `created_by_id` and create exactly one dealer notification.
- Confirm whether Base44 automatically invokes these functions on entity create/update. If it already does, do not call them manually from web.
- Decide where admin settings live. The current code expects `User.admin_settings`, but the OpenAPI User schema does not document that field.

## Recommended Fix Order

1. Auth/proxy blockers: require auth for `getOrder`, whitelist `updateCurrentUser`, disable production direct-adapter paths.
2. API/entity blockers: stop silent `safeEntity*` fallback in live mode, make enum/schema drift explicit, resolve `admin_settings`.
3. Route-shell blockers: remove public-shell flicker for authenticated dealer/admin routes.
4. Function parity: expose approved Base44 utility functions through server-side endpoints and verify notification side effects.
5. Cleanup: consolidate `apps/web/lib/api.ts` with `packages/api`, remove legacy/v2 wording and dead routes/scripts.

## Verification Checklist

- `npm --prefix apps/web run build`
- `npx tsc -p apps/web/tsconfig.json --noEmit`
- Manual auth QA:
  - Google login lands in correct role shell.
  - Dealer `/products`, `/orders`, `/rentals`, `/profile`, `/trackorder`, `/orderdetails` never render public shell.
  - Admin detail and rental calendar stay in admin shell.
- Manual API QA:
  - Anonymous `getOrder` by id fails.
  - Public `getOrderByNumber` returns only intended tracking data.
  - Dealer sees only own `created_by_id` orders.
  - Admin sees all orders.
  - Profile update cannot modify role/email/admin settings.
  - Notification read/delete access is scoped to the current user/admin.
