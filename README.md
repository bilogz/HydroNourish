# HydroNourish — Automated Pet Feeding, Hydration, and AI Health Monitoring System

**Client:** Heritage Animal Clinic  
**Stack:** React 18, Vite, TypeScript, Tailwind CSS, React Router v6, Lucide React, Recharts  

---

## 📌 Project Overview

**HydroNourish** is a complete, modern SaaS-style web template and monitoring dashboard developed for **Heritage Animal Clinic**. It connects automated smart feeding dispensers, hydration fountains, and biometric collar sensors into a centralized healthcare management interface.

### Key Capabilities
- **Automated Pet Feeding:** Portions and schedule rules with manual override dispenses.
- **Smart Hydration Monitoring:** Ultrasonic container depth level tracking and low-water alerts.
- **Biometric Vital Signs:** Body temperature (°C), resting heart rate (bpm), activity levels, and weight tracking.
- **AI-Assisted Observations:** Real-time anomaly detection flagging potential fluid decline or fever.
- **ESP32 Node Management:** Real-time device online/offline tracking, battery %, and Wi-Fi RSSI signal data.
- **Clinical Reporting:** Printable summary reports, PDF mock exports, and instant CSV downloads.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` or `yarn`

### 1. Installation
Clone the repository and install project dependencies:

```bash
git clone https://github.com/your-username/HydroNourish.git
cd HydroNourish
npm install
```

### 2. Run Development Server
To launch the Vite development server locally:

```bash
npm run dev
```

Open your browser at `http://localhost:3000` or `http://localhost:5173`.

### 3. Build for Production
To generate an optimized production bundle:

```bash
npm run build
```

The output files will be compiled into the `dist/` directory. You can preview the production build locally using:

```bash
npm run preview
```

---

## ☁️ Deploying to Vercel

1. Create or log into your account at [Vercel](https://vercel.com).
2. Click **Add New Project** and import your GitHub repository.
3. Select **Vite** as the Framework Preset.
4. Keep the root directory set to `./` and click **Deploy**.
5. Vercel will automatically build and assign a `.vercel.app` URL to your project.

### Connecting a Custom Domain on Vercel
1. Go to your project settings in the Vercel dashboard.
2. Navigate to **Domains** -> **Add Domain**.
3. Enter your domain (e.g., `hydronourish.heritageanimalclinic.com`).
4. Update your domain DNS settings at your registrar (such as Namecheap or GoDaddy):
   - **A Record:** Point `@` to `76.76.21.21`
   - **CNAME Record:** Point `www` to `cname.vercel-dns.com`
5. Vercel will automatically provision a free SSL certificate once DNS resolves.

---

## 🗄️ Supabase Backend Integration (Future Database Wiring)

This project contains a pre-built Supabase service placeholder located at [`src/services/supabase.ts`](file:///d:/CAPSTONE-COMMISSION/HydroNourish/src/services/supabase.ts).

### How to Connect Supabase:
1. Create a project at [Supabase.com](https://supabase.com).
2. Install the Supabase JS Client:
   ```bash
   npm install @supabase/supabase-js
   ```
3. Create a `.env.local` file in your root folder:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
4. Create the following database tables in Supabase:
   - `pets` (id, name, species, breed, age, weight, owner_name, device_id, health_status)
   - `feeding_schedules` (id, pet_id, food_type, portion_grams, scheduled_time, status)
   - `hydration_logs` (id, pet_id, amount_ml, timestamp, reservoir_level)
   - `vital_signs` (id, pet_id, temperature, heart_rate, weight, status, timestamp)
   - `ai_alerts` (id, pet_id, alert_type, observed_reading, severity, ai_observation, review_status)
   - `devices` (id, assigned_pet_id, status, wifi_dbm, food_level, water_level, battery)
5. Uncomment the `createClient` initialization inside [`src/services/supabase.ts`](file:///d:/CAPSTONE-COMMISSION/HydroNourish/src/services/supabase.ts).

---

## 🔌 ESP32 Microcontroller Hardware API Connection

Smart feeder and hydration nodes communicate with HydroNourish over REST or MQTT protocols.

### Sample ESP32 Telemetry JSON Payload:
When an ESP32 node transmits telemetry, it sends a JSON payload structured as follows:

```json
{
  "device_id": "HN-DEV-0101",
  "assigned_pet_id": "PET-001",
  "mac_address": "24:0A:C4:00:01:A1",
  "food_level_pct": 78,
  "water_level_pct": 82,
  "battery_pct": 98,
  "wifi_rssi_dbm": -54,
  "telemetry": {
    "temperature_c": 38.5,
    "heart_rate_bpm": 85,
    "weight_kg": 29.5
  }
}
```

### Endpoints Configuration
Specify your live ingestion URL under **Settings > Device API Configuration** inside the dashboard interface or update the default endpoint string in [`src/data/mockData.ts`](file:///d:/CAPSTONE-COMMISSION/HydroNourish/src/data/mockData.ts).

---

## ⚖️ Clinical Disclaimer

> **Notice:** HydroNourish provides monitoring and AI-assisted observations to support veterinary staff at Heritage Animal Clinic. It does not replace professional veterinary diagnosis, examination, or medical treatment.

---

© 2026 HydroNourish — Heritage Animal Clinic. All rights reserved.