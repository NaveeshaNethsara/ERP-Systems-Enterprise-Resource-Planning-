# Meridian ERP — Enterprise Resource Planning UI

An Angular 19 enterprise operations UI built with standalone components, reactive Signals state management, lazy-loaded feature routes, and cross-module workflows across five core ERP domains.

## Core Modules

- **Operations Overview (`/dashboard`)**: Cross-module KPIs, interactive 6-month Revenue vs. Operating Expense comparison chart, pending Purchase Order and Leave approval queues, low-stock reorder alerts with 1-click PO generation, and active shipment tracking.
- **Inventory Management (`/inventory`)**: Multi-facet SKU search and filtering (category, warehouse, stock health), sortable stock ledger, cycle-count adjustments, stock movement audit trail, new SKU registration, and direct replenishment PO creation.
- **Employee Management (`/employees`)**: Searchable staff directory, employee profile drawer with employment status control, onboarding modal, leave request approval queue with automatic PTO deductions, and department payroll cost-center breakdown.
- **Finance & Accounting (`/finance`)**: General ledger register, Accounts Receivable / Accounts Payable invoice settlement, live Chart of Accounts trial balance, and double-entry journal posting modal.
- **Procurement (`/procurement`)**: Full purchase order lifecycle (`Draft` → `Pending Approval` → `Approved` → `Ordered` → `Received`), vendor performance directory, and automatic cross-module sync on goods receipt (updates Inventory stock, creates AP payable bill, updates vendor YTD spend, and closes linked shipments).
- **Supply Chain Management (`/supply-chain`)**: Multi-modal shipment tracker (`Ocean Freight`, `Air Express`, `Ground LTL`, `Rail Intermodal`) with 5-stage milestone progress bars, delay exception flagging, consignment dispatch modal, and distribution hub capacity monitor.

## Tech Stack

- **Framework**: Angular 19 (Standalone Components, `@if`/`@for`/`@switch` control flow, Lazy-Loaded Routes)
- **State Management**: Angular Signals (`signal`, `computed`, `effect`) with `localStorage` persistence
- **Styling**: SCSS with unified CSS custom properties and tabular numerals (`IBM Plex Sans` & `IBM Plex Mono`)
- **Testing**: Jasmine & Karma

## Getting Started

```bash
# Install dependencies
npm install

# Run local development server
npm start
```

Open `http://localhost:4200/` in your browser.

## Build & Test

```bash
# Production build
npm run build

# Unit tests (headless)
npx ng test --watch=false --browsers=ChromeHeadless
```

> **Note**: All operational records, financial figures, vendor details, and employee entries in `src/app/core/data/seed-data.ts` are synthetic demonstration data.
