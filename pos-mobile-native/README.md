# 📱 SYCOMM - Premium POS Executive Companion (Expo Go + Supabase)

Welcome! This directory contains the complete, production-ready, hand-crafted React Native TypeScript files designed to boot up flawlessly inside your mobile Android device using **Expo Go** and connected securely to your **Supabase** database.

## ⚡ Quick Start in 5 Steps

### 1. Initialize a Clean Expo Project
If you don't already have an Expo project configured, spin up a new TypeScript project in your local terminal:
```bash
npx create-expo-app@latest pos-boss-companion --template blank-typescript
cd pos-boss-companion
```

### 2. Copy the Package Configuration
Replace your local `package.json` with the one provided in this directory, or run the following command to install the required real-time libraries:
```bash
npm install @supabase/supabase-js @react-native-async-storage/async-storage expo-secure-store lucide-react-native react-native-svg react-native-url-polyfill
```

### 3. Add the Supabase Connection
Copy `/src/react-native-code/supabase.ts` into your local root folder (or `src/`) and configure your credentials:
- Set `SUPABASE_URL` to your project's URL (e.g., `https://xxxxxx.supabase.co`)
- Set `SUPABASE_ANON_KEY` to your Supabase public anon key.

### 4. Wire the App Screens
Replace your root `App.tsx` with the code in `/src/react-native-code/App.tsx`. Create your screen folders:
- Move `/src/react-native-code/LoginScreen.tsx` into `./screens/LoginScreen.tsx`
- Move `/src/react-native-code/DashboardScreen.tsx` into `./screens/DashboardScreen.tsx`

### 5. Launch on your Android Device!
Fire up the Expo Metro bundler:
```bash
npx expo start
```
1. Download **Expo Go** from the Google Play Store on your Android device.
2. Scan the QR code displayed in your terminal using the Expo Go camera scanner or your camera app.
3. Watch the beautiful, high-contrast Carbon Slate Boss interface load immediately!

---

## 🔒 Supabase Authentication & Mobile Companion Access Lock (Option 2)

Your table `public.shops` controls both authentication and mobile companion access:
- `code` (text) - Enter your desired Shop ID/Code to authenticate.
- `master_pin` (text) - The PIN code (e.g. `1234` or `9999`) to grant dashboard clearance.
- `name` (text) - The name of the outlet displayable on the header.
- `companion_app_enabled` (boolean, default false) - **The Command Central Access Switch!** Set to `true` to unlock the Boss Companion app for paying clients. Desktop POS is completely unaffected.
- `companion_app_expires_at` (timestamptz, optional) - Optional expiration timestamp for subscription billing cycles.

### SQL Migration
Run `/src/react-native-code/supabase/companion-app-subscription.sql` in your Supabase SQL Editor:
```sql
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS companion_app_enabled boolean DEFAULT false;

ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS companion_app_expires_at timestamp with time zone NULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.shops;
```

### Real-Time Instant Unlock
Because `shops` is added to `supabase_realtime`, when Command Central toggles `companion_app_enabled = true`, the Boss's phone unlocks automatically in under 1 second without even requiring an app restart!
