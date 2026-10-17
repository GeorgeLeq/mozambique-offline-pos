# 🇲🇿 Offline-First Smart POS Ecosystem (Mozambique)

A high-performance, **offline-first Point of Sale (POS) ecosystem** engineered specifically for local retail shops and informal merchants in Mozambique. 

Due to highly fragmented internet infrastructure in regional commercial hubs, cloud-reliant software routinely halts daily business operations. This project bridges that digital divide by combining a local-first architecture with native performance, ensuring seamless transactional continuity with zero network dependency.

> **Meta Global AI Developer Hackathon Status:** This repository represents the **core functional infrastructure layer**. The Meta Llama and SAM 3.1 AI integration layers will be developed and committed directly to this codebase during the official 10-day hacking window.

---

## 🚀 System Architecture Overview

Our ecosystem consists of two core applications working in tandem over a unified local data model, syncing to a centralized cloud instance when networks permit.

### 1. 🖥️ Desktop POS Application (`/pos-desktop-tauri`)
*   **Frontend Framework:** React.js (optimized for fast, low-latency UI rendering).
*   **Native Desktop Shell:** Tauri (compiled to Rust). This ensures a tiny app bundle size (~10MB) and near-zero idle RAM consumption, allowing it to run flawlessly on low-spec hardware common in local shops.

### 2. 📱 Mobile Companion App (`/pos-mobile-native`)
*   **Framework:** React Native.
*   **Purpose:** Allows floor managers and shop owners to track live floor sales, scan inventory barcodes, and review business analytics on the go.

### 3. 💾 Local Storage & Storage Layer (The Offline Core)
*   **Local Database:** SQLite. All transactional data, inventory changes, and checkout baskets are written instantly to an encrypted, high-performance embedded SQLite database right on the client device. This guarantees instant UI operations even in completely disconnected environments.

### 4. ⚡ Centralized Cloud Synchronization
*   **Cloud Backend:** Supabase (PostgreSQL).
*   **Sync Strategy:** Implements an offline queue and conflict-free client-side replication engine. Transactions cached in SQLite are safely batched and synchronized to Supabase table endpoints via background workers once internet signals stabilize.

---

## 🔮 Planned Meta AI Roadmap (Hacking Phase)

During the upcoming 10-day hackathon window, the following specific capabilities will be integrated using the Meta Model API:

1. **Local Audio-to-Cart Pipeline (Llama Edge):** Deploying lightweight, quantized Llama models locally within the Tauri/Native runtimes to allow merchants to dictate transactions verbally in Portuguese (*"Vendi dois quilos de arroz e uma água"*). The model will parse unstructured speech into explicit SQLite database mutations offline.
2. **Predictive Business Intelligence (Llama Cloud):** Funneling aggregated Supabase transactional history through high-capacity Llama models to autogenerate natural language weekly revenue summaries, predictive restock warnings, and localized optimal pricing tips.
3. **Visual Inventory Sorting (SAM 3.1):** Integrating Meta's Segment Anything Model into the companion app to enable rapid multi-item shelf scanning and instant digital intake.

---

## 🛠️ Local Installation & Development

### Prerequisites
*   Node.js (v18+)
*   Rust Compiler & Cargo (Required for Tauri builds)
*   Android Studio / Xcode (For React Native compilation)

### Setting Up the Desktop POS
```bash
cd pos-desktop-tauri
npm install
npm run tauri dev
```

### Setting Up the Mobile Companion
```bash
cd pos-mobile-native
npm install
npx react-native start
```
