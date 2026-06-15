# Harvest Coffee Parity Plan

This rewrite is a parity migration. New screens may be reorganized or redesigned, but they should not require Base44 entities, fields, functions, or write operations that do not already exist in the legacy project.

## Implemented

| Capability | Legacy source | Existing backend calls | New route |
| --- | --- | --- | --- |
| Dealer catalog and order creation | `src/pages/Products.jsx` | `Product.list`, `Order.create` | `/catalog` |
| Public home | `src/pages/Home.jsx` | `Product.list` for featured product; mock `auth.isAuthenticated`; `Order.list` only when mock-authenticated for Quick Order | `/`, `/home` |
| Public about | `src/pages/About.jsx` | Static content | `/about` |
| Public contact | `src/pages/Contact.jsx` | Static/mock form; legacy `Core.SendEmail` intentionally not wired yet | `/contact` |
| Public layout/auth nav | `src/Layout.jsx` | Mock `auth.isAuthenticated`, mock `auth.me`, mock logout; live Base44 auth intentionally not wired in the browser shell yet | Shared public shell |
| Dealer order history | `src/pages/Orders.jsx`, `src/pages/Profile.jsx` | `Order.filter({ created_by })` | `/orders` |
| Dealer order detail and payment status | `src/pages/OrderDetails.jsx` | `Order.filter({ id })`, `Order.update` | `/orders/[id]` |
| Public order tracking | `src/pages/TrackOrder.jsx` | `Order.filter({ order_number })` | `/track-order` |
| Dealer rental list | `src/pages/Rentals.jsx` | `Rental.filter({ customer_email })` | `/rentals` |
| Dealer rental creation | `src/pages/CreateRental.jsx` | `Product.list`, `Rental.create` | `/rentals/new` |
| Dealer notifications | `src/pages/Notifications.jsx` | `Notification.filter({ recipient_email })`, `Notification.update`, `Notification.delete` | `/notifications` |
| Dealer profile, addresses, order history, activity | `src/pages/Profile.jsx` | `auth.me`, `auth.updateMe`, `Order.filter({ created_by })` | `/profile` |
| Admin dashboard metrics and summaries | `src/pages/AdminDashboard.jsx` | `Order.list`, `Product.list`, `User.list` | `/admin` |
| Admin reports | `src/pages/Reports.jsx` | `Rental.list`, `Order.list`, `User.list` | `/admin/reports` |
| Rental calendar | `src/pages/RentalCalendar.jsx` | `Rental.list` | `/admin/calendar` |
| Admin settings | `src/pages/AdminSettings.jsx` | `auth.me`, `auth.updateMe({ admin_settings })` | `/admin/settings` |
| Admin product create/update/delete | `src/pages/AdminProducts.jsx` | `Product.list`, `Product.create`, `Product.update`, `Product.delete` | `/admin/products` |
| Stock quantity/threshold update | `src/pages/StockManagement.jsx` | `Product.list`, `Product.update` | `/admin/products` |
| Admin order management | `src/pages/AdminOrders.jsx` | `Order.list`, `Order.update` | `/admin/orders` |
| Admin rental management | `src/pages/AdminRentals.jsx` | `Rental.list`, `Rental.update`, `Rental.delete` | `/admin/rentals` |
| Customer management and segmentation | `src/pages/CustomerManagement.jsx` | `User.list`, `Order.list`, `User.update` | `/admin/customers` |

## Guardrails

- UI must use `packages/domain` camelCase models.
- Base44 snake_case fields stay inside `packages/api`.
- Live Base44 access stays opt-in through `NEXT_PUBLIC_HARVEST_API_ADAPTER=base44`.
- Read-only mode can be enabled with `NEXT_PUBLIC_HARVEST_API_READ_ONLY=true`.
- No new Base44 entity, field, server function, or email side effect should be introduced without explicitly updating this plan.
- Legacy account deletion in `src/pages/Profile.jsx` calls `User.delete` and `auth.logout`; it is intentionally not migrated yet because it is destructive and needs a separate product decision.
- Legacy contact form email sending in `src/pages/Contact.jsx` calls `Core.SendEmail`; the Next.js contact form is intentionally mock/static until live email side effects are approved.
