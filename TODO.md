# TODO

## Base44 project action required

- [ ] Base44 notification side-effect duzeltilecek.
  - Web proxy ekstra `Notification.create` yapmayacak; notification icin tek kaynak Base44 side-effect olmali.
  - `onOrderCreated`: admin notification mesaji order'i olusturan dogru dealer/customer bilgisinden gelmeli.
  - Dogru kaynak: `Order.created_by_id -> User.get(created_by_id)`.
  - Gosterim sirasi: `company_name || full_name || email`.
  - `onOrderStatusChanged`: `data.created_by` kullanilmamali; Order dokumaninda bu alan yok.
  - Dealer recipient icin dogru kaynak: `Order.created_by_id -> User.get(created_by_id).email`.
  - Lokal kopyadaki referans dosyalar: `base44/functions/onOrderCreated/entry.ts`, `base44/functions/onOrderStatusChanged/entry.ts`.

## Local audit notes

- [x] 2026-06-27 local web build passed: `npm --prefix apps/web run build`.
- [x] 2026-06-27 mobile typecheck passed: `npx tsc -p apps/mobile/tsconfig.json --noEmit`.
- [x] Web/mobile runtime mock fallback is not active by default.
  - Mobile API now fails closed without `EXPO_PUBLIC_HARVEST_API_URL`.
  - Web API expects proxy/live mode; direct Base44 adapter remains a reviewed risk, not the default path.
- [x] Web order/rental create screens no longer use `dealer@example.com` as a submission fallback.
- [x] Mobile public products catches missing proxy/API failures and shows a controlled error state.
- [x] Mobile notification mark-read failures are routed to global feedback instead of leaving an unhandled promise.

## API parity watchlist

- [ ] Order ownership must stay `created_by_id` first everywhere.
  - `customer_email` is not in the Order schema and may only remain as a legacy display/read fallback.
  - Customer summaries should use `Order.created_by_id -> User.id` before any email fallback.
- [ ] Rental ownership remains `customer_email`.
  - This is documented in Rental schema and should not be migrated to `created_by_id` unless Base44 schema changes.
- [ ] Notification reads remain Base44-driven.
  - App may read, mark read, and delete notifications.
  - App should not create duplicate notifications to compensate for Base44 side-effect issues.
- [ ] User `admin_settings` persistence is not documented.
  - Treat admin settings as a product decision before relying on them for live behavior.

## Mobile follow-up

- [ ] Harden mobile OAuth callback allowlist.
  - Production should prefer `harvestcoffee:` scheme.
  - Expo `exp:` / `exps:` callback targets should be dev-only or exact allowlist.
- [x] Move proxy token transport from JSON body to `Authorization: Bearer`.
  - `/api/harvest` still accepts the old body token as a temporary compatibility fallback.
  - Mobile temporarily sends both header and body token until the deployed web proxy is confirmed on the header-capable version.
- [x] Decouple successful order/rental writes from post-write refresh failures.
- [ ] Decide whether to add a dealer dashboard on mobile or keep dealer landing on Products.
