# WANS System Architecture Diagrams

## 🏢 Complete System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPANY (ADMIN)                              │
│  - Product Creation                                             │
│  - Employee Management                                          │
│  - Order Approval                                               │
│  - System Control                                               │
└────────────┬────────────────────────────────────┬───────────────┘
             │                                    │
             │ PRODUCT FLOW                       │ EMPLOYEE FLOW
             │                                    │
             ▼                                    ▼
    ┌────────────────┐                  ┌────────────────┐
    │   WHOLESALE    │                  │  STATE HEAD    │
    │  - Buy from    │                  │  - Manages     │
    │    Company     │                  │    State       │
    │  - Sell to     │                  └────────┬───────┘
    │    Mini Stock  │                           │
    └────────┬───────┘                           ▼
             │                          ┌────────────────┐
             ▼                          │ ZONAL MANAGER  │
    ┌────────────────┐                 │  - Manages     │
    │   MINI STOCK   │                 │    Zone        │
    │  - Buy from    │                 └────────┬───────┘
    │    Wholesale   │                          │
    │  - Sell to     │                          ▼
    │    Customer    │                 ┌────────────────┐
    └────────┬───────┘                 │  AREA MANAGER  │
             │                         │  - Manages     │
             ▼                         │    Area        │
    ┌────────────────┐                └────────┬───────┘
    │    CUSTOMER    │                         │
    │  - Buys from   │                         ▼
    │    Mini Stock  │                ┌────────────────┐
    │  - Brought by  │◄───────────────│  DO MANAGER    │
    │    Advisor     │                │  - Manages     │
    └────────────────┘                │    District    │
                                      └────────┬───────┘
                                               │
                                               ▼
                                      ┌────────────────┐
                                      │    ADVISOR     │
                                      │  - Brings      │
                                      │    Customers   │
                                      │  - Earns       │
                                      │    Commission  │
                                      └────────────────┘
```

---

## 🔄 Order Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    ORDER LIFECYCLE                              │
└─────────────────────────────────────────────────────────────────┘

1. CREATE ORDER (status = PENDING)
   ┌──────────────────────────────────────────────────────────┐
   │  Buyer creates order                                     │
   │  - Validates product exists                              │
   │  - Determines seller automatically                       │
   │  - Builds hierarchy snapshot (if sales order)            │
   │  - NO STOCK UPDATE                                       │
   └──────────────────────────────────────────────────────────┘
                            │
                            ▼
2. APPROVE ORDER (status = APPROVED)
   ┌──────────────────────────────────────────────────────────┐
   │  Seller approves order                                   │
   │  - Validates payment status = PAID                       │
   │  - Validates seller has stock                            │
   │  - Sets approvedAt timestamp                             │
   │  - NO STOCK UPDATE                                       │
   └──────────────────────────────────────────────────────────┘
                            │
                            ▼
3. SHIP ORDER (status = SHIPPED)
   ┌──────────────────────────────────────────────────────────┐
   │  Seller ships order                                      │
   │  - Sets shippedAt timestamp                              │
   │  - NO STOCK UPDATE                                       │
   └──────────────────────────────────────────────────────────┘
                            │
                            ▼
4. CONFIRM DELIVERY (status = DELIVERED) ⚠️ CRITICAL
   ┌──────────────────────────────────────────────────────────┐
   │  Buyer confirms delivery                                 │
   │  ┌────────────────────────────────────────────────────┐  │
   │  │ TRANSACTION START                                  │  │
   │  │                                                    │  │
   │  │ 1. Deduct from seller inventory                   │  │
   │  │    - dispatched += quantity                       │  │
   │  │    - current -= quantity                          │  │
   │  │                                                    │  │
   │  │ 2. Add to buyer inventory                         │  │
   │  │    - received += quantity                         │  │
   │  │    - current += quantity                          │  │
   │  │                                                    │  │
   │  │ 3. Create StockLog entry                          │  │
   │  │    - type: PURCHASE/TRANSFER/SALE                 │  │
   │  │    - from: seller, to: buyer                      │  │
   │  │                                                    │  │
   │  │ 4. Calculate commissions (if sales order)         │  │
   │  │    - 5 levels: Advisor → DO → Area → Zonal → State│ │
   │  │    - Save commission records                      │  │
   │  │    - Update advisor totalSales                    │  │
   │  │                                                    │  │
   │  │ 5. Set deliveredAt timestamp                      │  │
   │  │                                                    │  │
   │  │ TRANSACTION COMMIT                                │  │
   │  └────────────────────────────────────────────────────┘  │
   │                                                          │
   │  6. Send notifications (outside transaction)             │
   └──────────────────────────────────────────────────────────┘
```

---

## 💰 Commission Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│              COMMISSION DISTRIBUTION                            │
│         (Only for Mini Stock → Customer sales)                  │
└─────────────────────────────────────────────────────────────────┘

Order Total: ₹10,000
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│  ADVISOR (Direct - L0)                                        │
│  Rate: 5.0%                                                   │
│  Commission: ₹500                                             │
└───────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│  DO MANAGER (L1)                                              │
│  Rate: 2.0%                                                   │
│  Commission: ₹200                                             │
└───────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│  AREA MANAGER (L2)                                            │
│  Rate: 1.0%                                                   │
│  Commission: ₹100                                             │
└───────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│  ZONAL MANAGER (L3)                                           │
│  Rate: 0.5%                                                   │
│  Commission: ₹50                                              │
└───────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│  STATE HEAD (L4)                                              │
│  Rate: 0.2%                                                   │
│  Commission: ₹20                                              │
└───────────────────────────────────────────────────────────────┘

Total Commission: ₹870 (8.7% of order total)
```

---

## 📦 Stock Movement Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    STOCK FLOW                                   │
└─────────────────────────────────────────────────────────────────┘

COMPANY (Infinite Stock)
    │
    │ Order Type: WHOLESALE → COMPANY
    │ Status: DELIVERED
    │ StockLog Type: PURCHASE
    │
    ▼
WHOLESALE INVENTORY
    │ received += quantity
    │ current += quantity
    │
    │ Order Type: MINI_STOCK → WHOLESALE
    │ Status: DELIVERED
    │ StockLog Type: TRANSFER
    │
    ▼
MINI STOCK INVENTORY
    │ received += quantity
    │ current += quantity
    │
    │ Order Type: CUSTOMER → MINI_STOCK
    │ Status: DELIVERED
    │ StockLog Type: SALE
    │
    ▼
CUSTOMER (End User)
    │ No inventory tracking
    │ Commission triggered here
    │
    ▼
ADVISOR EARNS COMMISSION
```

---

## 🔐 Role Permissions Matrix

```
┌──────────────┬────────┬───────────┬────────────┬──────────┬─────────┐
│   Action     │ ADMIN  │ WHOLESALE │ MINI_STOCK │ ADVISOR  │ CUSTOMER│
├──────────────┼────────┼───────────┼────────────┼──────────┼─────────┤
│ Create       │   ✅   │     ✅    │     ✅     │    ❌    │   ❌    │
│ Order        │        │  (to Co.) │ (to Whole.)│          │         │
├──────────────┼────────┼───────────┼────────────┼──────────┼─────────┤
│ Approve      │   ✅   │     ✅    │     ❌     │    ❌    │   ❌    │
│ Order        │ (Whole)│  (Mini)   │            │          │         │
├──────────────┼────────┼───────────┼────────────┼──────────┼─────────┤
│ Ship         │   ✅   │     ✅    │     ✅     │    ❌    │   ❌    │
│ Order        │        │           │            │          │         │
├──────────────┼────────┼───────────┼────────────┼──────────┼─────────┤
│ Confirm      │   ❌   │     ✅    │     ✅     │    ❌    │   ✅    │
│ Delivery     │        │ (as buyer)│ (as buyer) │          │(as buyer)│
├──────────────┼────────┼───────────┼────────────┼──────────┼─────────┤
│ View All     │   ✅   │     ❌    │     ❌     │    ❌    │   ❌    │
│ Orders       │        │           │            │          │         │
├──────────────┼────────┼───────────┼────────────┼──────────┼─────────┤
│ View Own     │   ✅   │     ✅    │     ✅     │    ✅    │   ✅    │
│ Orders       │        │           │            │          │         │
├──────────────┼────────┼───────────┼────────────┼──────────┼─────────┤
│ Manage       │   ✅   │     ❌    │     ❌     │    ❌    │   ❌    │
│ Products     │        │           │            │          │         │
├──────────────┼────────┼───────────┼────────────┼──────────┼─────────┤
│ Manage       │   ✅   │     ❌    │     ❌     │    ❌    │   ❌    │
│ Employees    │        │           │            │          │         │
├──────────────┼────────┼───────────┼────────────┼──────────┼─────────┤
│ View         │   ✅   │     ❌    │     ❌     │    ✅    │   ❌    │
│ Commissions  │  (all) │           │            │  (own)   │         │
└──────────────┴────────┴───────────┴────────────┴──────────┴─────────┘
```

---

## 🧾 Order Types Matrix

```
┌──────────────┬────────────┬──────────────┬─────────────┬────────────┐
│  Order Type  │   Buyer    │    Seller    │  Advisor?   │ Commission?│
├──────────────┼────────────┼──────────────┼─────────────┼────────────┤
│ Type 1       │ WHOLESALE  │ COMPANY      │     NO      │     NO     │
│ Purchase     │            │ (Admin)      │             │            │
├──────────────┼────────────┼──────────────┼─────────────┼────────────┤
│ Type 2       │ MINI_STOCK │ WHOLESALE    │     NO      │     NO     │
│ Transfer     │            │              │             │            │
├──────────────┼────────────┼──────────────┼─────────────┼────────────┤
│ Type 3       │ CUSTOMER   │ MINI_STOCK   │     YES     │    YES     │
│ Sale         │            │              │ (Required)  │ (5 levels) │
└──────────────┴────────────┴──────────────┴─────────────┴────────────┘
```

---

## 📊 Database Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE SCHEMA                              │
└─────────────────────────────────────────────────────────────────┘

┌──────────┐         ┌──────────┐         ┌──────────┐
│  Order   │────────▶│  Product │         │   User   │
│          │         │          │         │          │
│ buyerId  │────┐    └──────────┘         │ parentId │──┐
│ sellerId │────┼───────────────────────▶ │          │  │
│ advisorId│────┘                         └──────────┘  │
└──────────┘                                     ▲       │
     │                                           │       │
     │                                           └───────┘
     │                                        (Hierarchy)
     │
     ▼
┌──────────┐         ┌──────────┐
│StockLog  │         │Commission│
│          │         │          │
│ orderId  │         │ orderId  │
│ from     │         │ userId   │
│ to       │         └──────────┘
└──────────┘

┌──────────┐
│Inventory │
│          │
│ ownerId  │────────▶ User
│ items[]  │────────▶ Product
└──────────┘
```

---

## 🔄 Transaction Flow

```
┌─────────────────────────────────────────────────────────────────┐
│           DELIVERY CONFIRMATION TRANSACTION                     │
└─────────────────────────────────────────────────────────────────┘

START TRANSACTION
    │
    ├─▶ 1. Find seller inventory
    │      └─▶ Validate stock available
    │
    ├─▶ 2. Update seller inventory
    │      ├─▶ dispatched += quantity
    │      └─▶ current -= quantity
    │
    ├─▶ 3. Find/create buyer inventory
    │
    ├─▶ 4. Update buyer inventory
    │      ├─▶ received += quantity
    │      └─▶ current += quantity
    │
    ├─▶ 5. Create StockLog entry
    │      ├─▶ type: PURCHASE/TRANSFER/SALE
    │      ├─▶ from: sellerId
    │      └─▶ to: buyerId
    │
    ├─▶ 6. IF sales order (advisorId exists):
    │      ├─▶ Calculate commissions (5 levels)
    │      ├─▶ Save commission records
    │      └─▶ Update advisor totalSales
    │
    ├─▶ 7. Update order status
    │      ├─▶ status = DELIVERED
    │      └─▶ deliveredAt = now
    │
    └─▶ COMMIT TRANSACTION
         │
         └─▶ Send notifications (outside transaction)

IF ANY STEP FAILS:
    └─▶ ROLLBACK TRANSACTION
         └─▶ No changes applied
```

---

## 🎯 System Principles

```
┌─────────────────────────────────────────────────────────────────┐
│                    CORE PRINCIPLES                              │
└─────────────────────────────────────────────────────────────────┘

1. INVENTORY = ORDERS + DELIVERY
   ├─▶ Stock is NEVER manually edited
   ├─▶ Stock is ALWAYS the result of orders
   └─▶ Stock updates ONLY on delivery

2. COMMISSION = SALES + DELIVERY
   ├─▶ Commission ONLY for sales orders
   ├─▶ Commission ONLY on delivery
   └─▶ Commission uses immutable snapshot

3. HIERARCHY = SNAPSHOT + HISTORY
   ├─▶ Snapshot captured at order creation
   ├─▶ Snapshot NEVER changes
   └─▶ Historical accuracy preserved

4. TRANSACTIONS = ATOMIC + SAFE
   ├─▶ All operations use transactions
   ├─▶ Rollback on any error
   └─▶ No partial updates

5. SEPARATION = FLOWS + CONNECTION
   ├─▶ Product flow: Company → Wholesale → Mini Stock
   ├─▶ Employee flow: Admin → State → Zonal → Area → DO → Advisor
   └─▶ Connection: Orders + Advisor + Commission
```

---

## 🚀 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT STACK                             │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  React + Vite + Tailwind CSS                                 │
│  - Order creation forms                                      │
│  - Order management UI                                       │
│  - Inventory dashboard                                       │
│  - Commission reports                                        │
└────────────────────────┬─────────────────────────────────────┘
                         │ REST API
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│  Node.js + Express                                           │
│  - Order controller                                          │
│  - Inventory controller                                      │
│  - Commission controller                                     │
│  - User controller                                           │
└────────────────────────┬─────────────────────────────────────┘
                         │ MongoDB Driver
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                       DATABASE                               │
│  MongoDB                                                     │
│  - Orders collection                                         │
│  - Users collection                                          │
│  - Inventory collection                                      │
│  - Commissions collection                                    │
│  - StockLog collection                                       │
└──────────────────────────────────────────────────────────────┘
```
