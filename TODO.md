# TODO

- [ ] Base44 notification side-effect duzeltilecek.
  - Web proxy ekstra `Notification.create` yapmayacak; notification icin tek kaynak Base44 side-effect olmali.
  - `onOrderCreated`: admin notification mesaji order'i olusturan dogru dealer/customer bilgisinden gelmeli.
  - Dogru kaynak: `Order.created_by_id -> User.get(created_by_id)`.
  - Gosterim sirasi: `company_name || full_name || email`.
  - `onOrderStatusChanged`: `data.created_by` kullanilmamali; Order dokumaninda bu alan yok.
  - Dealer recipient icin dogru kaynak: `Order.created_by_id -> User.get(created_by_id).email`.
  - Lokal kopyadaki referans dosyalar: `base44/functions/onOrderCreated/entry.ts`, `base44/functions/onOrderStatusChanged/entry.ts`.
