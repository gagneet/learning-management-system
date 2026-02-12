# Centre-Based LMS — Domain Specification Pack
Generated: 2026-02-11 (Australia/Sydney)

This pack splits the platform into **5 implementable domain documents** for different teams:
1. Academic Domain
2. Operations Domain
3. Finance Domain
4. Infrastructure Domain
5. Governance Domain

Assumptions (aligned to your current direction):
- Web: Next.js + React + TypeScript
- API: REST (OpenAPI) + async events (queue)
- DB: PostgreSQL (multi-tenant via `centre_id`), Prisma ORM
- Cache/queues: Redis + a worker (BullMQ or equivalent)
- Storage: S3-compatible (or Azure Blob) for files/media
- Video providers: pluggable (Teams first)

Notation:
- `UUID` types are shown as `String @db.Uuid` in Prisma-style examples.
- Every table includes `centre_id` unless it is global/template-level.
- All APIs are shown as REST; GraphQL can sit on top later.

---
# 4) Infrastructure Domain
## Scope
Physical/digital assets and supplies:
- Asset inventory (laptops, printers, furniture)
- Maintenance and repairs
- Stock & supplies (paper, toner)
- Vendors (optional portal)
- Device assignment / checkout

---
## 4.1 UX/UI
IT Manager:
- Asset register, maintenance queue
- Assign device to student/room
- Work orders (from tickets)

Stock Officer:
- Stock catalogue and reorder alerts
- Stock in/out movements (linked to tickets)

Tutor/Student:
- Request device/supplies via ticket form
- See assigned device status

---
## 4.2 Data Model

```prisma
model Asset {
  id        String @id @default(uuid()) @db.Uuid
  centreId  String @db.Uuid
  type      String // LAPTOP, PRINTER, CHAIR, TABLE, ROUTER
  make      String?
  model     String?
  serialNo  String?
  tagCode   String? @unique
  location  String?
  condition String @default("OK") // OK, DEGRADED, BROKEN, RETIRED
  assignedToUserId String? @db.Uuid
  assignedAt DateTime?
  purchaseDate DateTime?
  warrantyUntil DateTime?
  notes     String?
}

model MaintenanceEvent {
  id        String @id @default(uuid()) @db.Uuid
  centreId  String @db.Uuid
  assetId   String @db.Uuid
  ticketId  String? @db.Uuid
  kind      String // INSPECTION, REPAIR, REPLACEMENT
  vendorId  String? @db.Uuid
  status    String @default("OPEN") // OPEN, IN_PROGRESS, DONE
  startedAt DateTime?
  completedAt DateTime?
  costCents Int?
  notes     String?
}

model Vendor {
  id        String @id @default(uuid()) @db.Uuid
  centreId  String @db.Uuid
  name      String
  type      String // IT, MAINTENANCE, SUPPLIES
  email     String?
  phone     String?
  active    Boolean @default(true)
}

model StockItem {
  id        String @id @default(uuid()) @db.Uuid
  centreId  String @db.Uuid
  name      String
  unit      String // PACK, EACH, BOX
  reorderLevel Int @default(0)
  quantityOnHand Int @default(0)
  vendorId  String? @db.Uuid
  unitCostCents Int?
  currency  String @default("AUD")
  updatedAt DateTime @updatedAt
}

model StockMovement {
  id        String @id @default(uuid()) @db.Uuid
  centreId  String @db.Uuid
  stockItemId String @db.Uuid
  kind      String // IN, OUT, ADJUST
  quantity  Int
  reason    String
  ticketId  String? @db.Uuid
  createdAt DateTime @default(now())
  createdBy String @db.Uuid
}
```

---
## 4.3 APIs
Assets:
- GET /api/assets?centreId=&type=&condition=
- POST /api/assets
- POST /api/assets/{id}/assign
- POST /api/assets/{id}/status
- POST /api/assets/{id}/maintenance
- GET /api/assets/{id}/maintenance

Stock:
- GET /api/stock/items?centreId=
- POST /api/stock/items
- POST /api/stock/movements
- GET /api/stock/reorder-queue?centreId=

---
## 4.4 Ops link
- Ticket subcategory “Laptop repair” links to asset_id
- Ticket close action can mark MaintenanceEvent DONE and update Asset.condition
