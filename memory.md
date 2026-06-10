# Project Memory & Status Log

## Project Name: Carbon Footprint Tracker & Sub-Application purchase system

### 📌 Current State
- **Backend**: FastAPI fully configured, with auth helpers for Supabase JWT verification. All endpoints (`/subapps/purchase`, `/subapps/verify`, `/carbon/logs`) have mock verification tests passing.
- **Database Schema**: Successfully migrated to Supabase Postgres (tables `sub_applications`, `user_sub_app_accounts`, `pin_verification_cache`, and `carbon_logs` are provisioned).
- **Environment Config**: `.env` and `requirements.txt` are created.
- **Frontend**: Scaffolded with Vite + React + TypeScript and `npm install` finished. Types are defined in `src/types.ts`.

### 🛠️ Architecture Summary
- **Primary Auth & DB**: Supabase.
- **PIN Verification**: Hashed verification code generated via Supabase Edge Functions.
- **Public Page Priorities**: SEO, A11y (WCAG contrast & keyboard navigation), Responsive design via Tailwind CSS.

### 🔮 Next Steps
- Generate design screens for the UI cockpit using Stitch ("Google Stage").
- Integrate API connections on the React frontend.
