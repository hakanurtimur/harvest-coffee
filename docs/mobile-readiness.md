# Mobile Readiness Notes

## Current Scope

The Expo app currently covers native public entry screens, dealer mobile-web parity, and the first admin mobile parity pass:

- Public Home
- Public About
- Public Contact with mocked form submission

- Mock dealer login/logout
- Products and quick order
- My Orders
- Order Detail
- Track Order
- Profile and delivery addresses
- Rentals and Create Rental
- Notifications

Admin mobile parity currently includes:

- Mock admin login/logout
- Admin Dashboard
- Admin Orders
- Admin Products
- Stock Management
- Customer Management
- Reports
- Admin Settings
- Rental Calendar

Unauthenticated users now boot into the native Public Home screen before choosing mock login.

## Hardening Completed

- Shared validation helpers for delivery addresses, profile addresses, order tracking, and rental dates.
- Dynamic rental date defaults instead of fixed dates.
- Consistent async error handling for order creation, rental creation, profile address creation, order lookup, and order detail loading.
- Dealer shell loading/error banners for mock data refresh state.
- Keyboard-safe app wrapper and native-friendly scroll behavior.
- Accessibility roles/states for buttons, tabs, cards, selections, and quantity controls.
- Lightweight native motion with React Native `Animated`.
- Product list render tuning for small-to-medium catalogues.
- Admin shell with role guard and horizontal admin navigation.
- Admin mock flows for orders, products, stock, customers, settings, reports, and rental calendar.

## Still Needed Before Production Release

- Real brand assets: app icon, adaptive icon, splash logo, and final stamp/logo.
- Persistent session storage with `expo-secure-store` or another approved storage layer.
- Preview/release build setup with EAS.
- Test coverage for domain/API validation and key mobile state flows.
- Real API environment switching when Base44/live API access is approved.

## Dependency Note

`expo-secure-store` was not added in this pass because `npm install` hit the existing root peer dependency conflict between React 19 and `@hello-pangea/dnd`'s React 18 peer range. Avoiding a forced install keeps the dependency tree stable for now.
