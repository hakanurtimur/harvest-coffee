# Mobile Readiness Notes

## Current Scope

The Expo app currently covers native public entry screens, dealer mobile-web parity, and the first admin mobile parity pass:

- Public Home
- Public About
- Public Contact

- Base44 dealer login/logout
- Products and quick order
- My Orders
- Order Detail
- Track Order
- Profile and delivery addresses
- Rentals and Create Rental
- Notifications

Admin mobile parity currently includes:

- Base44 admin login/logout
- Admin Dashboard
- Admin Orders
- Admin Products
- Stock Management
- Customer Management
- Reports
- Admin Settings
- Rental Calendar

Unauthenticated users now boot into the native Public Home screen before choosing Google login.

## Hardening Completed

- Shared validation helpers for delivery addresses, profile addresses, order tracking, and rental dates.
- Dynamic rental date defaults instead of fixed dates.
- Consistent async error handling for order creation, rental creation, profile address creation, order lookup, and order detail loading.
- Dealer shell loading/error banners for live data refresh state.
- Keyboard-safe app wrapper and native-friendly scroll behavior.
- Accessibility roles/states for buttons, tabs, cards, selections, and quantity controls.
- Lightweight native motion with React Native `Animated`.
- Product list render tuning for small-to-medium catalogues.
- Admin shell with role guard and horizontal admin navigation.
- Admin flows for orders, products, stock, customers, settings, reports, and rental calendar.
- Persistent session storage with `expo-secure-store`.
- Runtime `401` handling clears the secure token cache and returns the app to a clean login state.
- Proxy bearer tokens are sent through the `Authorization` header instead of JSON request bodies.
- Expo mobile auth redirects are gated behind `HARVEST_ALLOW_EXPO_MOBILE_REDIRECTS=true`; production app-owned callbacks use `harvestcoffee:`.
- Mobile admin product description generation uses the shared Base44 proxy function.
- Order detail screens revalidate cached detail data on open.

## Still Needed Before Production Release

- Real brand assets: app icon, adaptive icon, splash logo, and final stamp/logo.
- Token lifetime metadata handling if Base44 exposes explicit expiry information.
- Production mobile auth nonce/state or a short-lived code exchange.
- Preview/release build setup with EAS.
- Test coverage for domain/API validation and key mobile state flows.
- Release environment hardening for the live Base44 proxy URL.

## Dependency Note

`expo-secure-store@~15.0.8` is installed for Expo SDK 54 and is used only for the mobile Base44 access token cache.
