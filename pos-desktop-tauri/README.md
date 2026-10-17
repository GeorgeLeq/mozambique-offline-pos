# 🏪 SYCOMM — Next-Generation Offline-First POS & Inventory Engine
> **High-Performance Windows Desktop Point of Sale & Retail Management System for Emerging Markets**

[![Built with React](https://img.shields.io/badge/Frontend-React%20%7C%20TypeScript-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Desktop Shell](https://img.shields.io/badge/Desktop-Tauri%20v2-FFC131?logo=tauri&logoColor=black)](https://v2.tauri.app/)
[![Local Engine](https://img.shields.io/badge/Local%20DB-SQLite%20(WAL%20Mode)-003B57?logo=sqlite&logoColor=white)](https://sqlite.org/)
[![Cloud Sync](https://img.shields.io/badge/Cloud-Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## 🌍 Executive Summary & Problem Statement

In emerging economies like **Mozambique**, retail and wholesale businesses face severe operational bottlenecks:
1. **Unreliable Internet & Power Outages**: Cloud-only web POS systems halt transactions during fiber cuts or power shedding, causing lost revenue and long checkout queues.
2. **Employee Theft & Cash Shrinkage**: Informal credit (*fiado*), manual tally sheets, and unmonitored drawer openings bleed margins.
3. **Packaging Confusion at Receiving**: Wholesale deliveries arrive in bundles (*fardos*), crates, or boxes, leading clerks to enter 2 boxes instead of 48 individual cans—corrupting inventory counts.
4. **Commercial Secrecy Leaks**: Store owners need floor managers to receive stock without exposing supplier cost prices or profit margins.

**SYCOMM** solves this with an **Offline-First Desktop Architecture** powered by **Tauri v2 + SQLite** for local execution and **Supabase** for cloud synchronization and multi-device fleet management.

---

## ⚡ Architectural Highlights

```
┌────────────────────────────────────────────────────────────────────────┐
│                        WINDOWS DESKTOP CLIENT                          │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                   React 18 + TypeScript UI                     │   │
│   │      (Tailwind CSS, Lucide Icons, Framer Motion Engine)        │   │
│   └────────────────────────────────┬───────────────────────────────┘   │
│                                    │ Sub-millisecond IPC               │
│   ┌────────────────────────────────▼───────────────────────────────┐   │
│   │                 Tauri v2 Native Desktop Bridge                 │   │
│   └────────────────────────────────┬───────────────────────────────┘   │
│                                    │ Direct Local I/O                  │
│   ┌────────────────────────────────▼───────────────────────────────┐   │
│   │           Embedded SQLite Database (@tauri-apps/plugin-sql)    │   │
│   │         • PRAGMA journal_mode = WAL                            │   │
│   │         • PRAGMA secure_delete = ON                            │   │
│   │         • PRAGMA synchronous = NORMAL                          │   │
│   └────────────────────────────────┬───────────────────────────────┘   │
└────────────────────────────────────┼───────────────────────────────────┘
                                     │ Background Delta Sync
                                     │ (When connection is online)
┌────────────────────────────────────▼───────────────────────────────────┐
│                    SUPABASE CLOUD & COMPANION APP                      │
│                                                                        │
│   ┌─────────────────────────────┐       ┌──────────────────────────┐   │
│   │     PostgreSQL Database     │◄─────►│   Mobile Companion App   │   │
│   │  (Row-Level Security, RLS)  │       │  (Owners Remote Auditing)│   │
│   └─────────────────────────────┘       └──────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

### 1. True Offline-First Operation
- **Zero Network Latency**: 100% of sales, barcode queries, stock lookups, and shift audits execute against local SQLite on the cashier's machine.
- **Continuous Availability**: The store operates without degradation during weeks of zero internet connectivity.
- **Asynchronous Sync Engine**: A background reconciliation worker queues mutated transactions in an offline delta buffer and pushes/pulls updates to Supabase once connectivity is restored.

### 2. Native Windows Performance via Tauri v2
- Replaces heavy Chromium runtimes (e.g., Electron) with native OS webview technology.
- **Resource Footprint**: Starts in under 400ms, consumes **~25–45 MB RAM** (vs 350+ MB on Electron), ensuring smooth performance on low-spec counter PCs commonly found in retail shops.

---

## 🛠️ Key System Features

### 🛒 1. Counter POS (Terminal de Vendas)
- **Instant Barcode Search & Fast-Keys**: Multi-field search by Barcode, SKU, Name, or Category.
- **Mozambique Payment Methods**:
  - Cash (Meticais `MT`) with quick denomination buttons (50, 100, 200, 500, 1000 MT).
  - Mobile Money: **M-Pesa** and **E-Mola** reference tracking.
  - POS Debit/Credit Cards.
  - Split Payments (e.g., partial M-Pesa + partial Cash).
- **Thermal Receipt Printing**: ESC/POS formatting for 58mm and 80mm thermal printers with dynamic QR codes and store headers.
- **Held Carts (Suspender Vendas)**: Suspend active transactions to serve the next customer, then resume in 1-click.

### 📦 2. "Double-Edged Sword" Product & Stock Workflow
- **"Blind Receiving" Mode for Expected Deliveries**:
  - Floor managers receive stock sent by headquarters or suppliers without seeing confidential wholesale cost prices (`Preço de Custo`) or profit margins.
  - Verifies and unlocks stock into circulation with one click (`Confirmar Entrada & Desbloquear`).
- **Visual Stock Calculator**:
  - Eliminates packaging errors via interactive multipliers (e.g., `2 Boxes × 24 units = 48 units`).
  - **Selling Mode Selector**:
    - **Venda Avulsa**: Sells items as loose individual units (sets stock to `48 un`).
    - **Venda em Caixas Fechadas**: Sells items as whole factory-sealed boxes (sets stock to `2 caixas`).
  - Dynamic Portuguese contextual notes prevent receiving mistakes.
- **Bulk Breakdown (Desmembramento de Fardos)**:
  - Decompose large crates/fardos into retail units on the fly with automatic inventory deduction and cost-basis transfer.

### 💼 3. Shift Management & Anti-Shrinkage Audit (Gestão de Turnos)
- **Strict Blind Cash-Up**: Cashiers input actual physical cash counted in the drawer without the system revealing the expected total beforehand.
- **Automated Discrepancy Detection**: Calculates surplus (*sobra*) or deficit (*quebra*) down to the cent.
- **Hard-Close Exit Prompting**: Prevents dangling shifts when cashiers attempt to close the application window before generating the end-of-day shift report.

### 📒 4. Informal Credit & Customer Ledger (Fiado & Contas Correntes)
- Built-in credit management tailored for neighborhood retail:
  - Customer balance limits and debt aging.
  - Partial debt repayments (*amortizações*) with dedicated payment receipts.
  - Customer purchase history tracking.

### 📱 5. Cloud Integration & Mobile Companion App
- **Real-Time Remote Dashboard**: Business owners track real-time revenue, gross profit, stock depletion, and cashier performance from any smartphone via Supabase.
- **Multi-Store Aggregation**: Centralizes sales and restock analytics across multiple shop branches.

---

## 💻 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Desktop Shell** | [Tauri v2](https://v2.tauri.app/) (Rust native bridge, Windows Webview2) |
| **Frontend Framework** | [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) |
| **Styling & Icons** | [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) |
| **Animations & UI** | [Framer Motion](https://www.framer.com/motion/) |
| **Local Database** | Embedded [SQLite](https://sqlite.org/) via `@tauri-apps/plugin-sql` |
| **Cloud Backend** | [Supabase](https://supabase.com/) (PostgreSQL 15, Auth, RLS, Edge Functions) |
| **Receipt Generation** | HTML5 Canvas / Raw ESC/POS thermal printing |

---

## 📂 Project Structure

```
├── src/
│   ├── components/
│   │   ├── POS/                    # Sales terminal, cart, checkout, payments
│   │   ├── ProductManager/         # Inventory, Double-Edged Sword form, stock calculator
│   │   │   ├── ProductForm/        # Blind receiving & full mode forms
│   │   │   │   ├── VisualStockCalculator.tsx
│   │   │   │   └── PricingStockSection.tsx
│   │   │   └── ProductList/        # Fast searchable inventory table
│   │   ├── Shifts/                 # Shift start/close, cash-up, audit reports
│   │   ├── RestockManager/         # Purchase orders & delivery verification
│   │   ├── Customers/              # Customer credit (fiado) & ledger
│   │   └── Settings/               # Hardware (printers, scanners), business profile
│   ├── lib/
│   │   ├── db/                     # SQLite database initialization, schemas & queries
│   │   ├── sync/                   # Supabase bi-directional synchronization engine
│   │   └── supabase.ts             # Supabase cloud client
│   ├── contexts/                   # Auth, shift state, offline/online indicators
│   └── App.tsx                     # Main layout & router
├── src-tauri/                      # Tauri v2 configuration, window controls, and permissions
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **Rust & Cargo** (for building Tauri desktop binaries)
- **Windows 10/11** (or Webview2 runtime installed)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/balcao-pos.git
cd balcao-pos
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run in Development Mode
```bash
# Run web client inside browser
npm run dev

# Run as native Windows desktop application via Tauri
npm run tauri dev
```

### 5. Build Desktop Installer (`.msi` / `.exe`)
```bash
npm run tauri build
```
The compiled installer will be generated in `src-tauri/target/release/bundle/msi/`.

---

## 🔒 Security & Data Integrity

- **Database Hardening**: SQLite configured with `PRAGMA secure_delete = ON` to prevent raw-disk data harvesting of deleted records.
- **Admin PIN Protection**: Sensitive configurations (cost margins, wholesale prices, database resets, discounts) require manager PIN authorization.
- **Row-Level Security (RLS)**: Supabase cloud database strictly isolates multi-tenant store data by organization ID.

---

## 👥 Hackathon & Development Team
- **Target Market**: Mozambique & Southern Africa Retail Ecosystem
- **Focus**: FinTech, Offline-First Systems, Retail Automation, Anti-Shrinkage Software
