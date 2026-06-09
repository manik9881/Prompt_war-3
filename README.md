# Obsidian Portal: Carbon Footprint Tracker & Sub-Application Accounts

Obsidian Portal is a premium, glassmorphic suite of sub-applications secured by a crypt-PIN locking mechanism. The flagship sub-application is the **Carbon Footprint Tracker**, which helps individuals monitor, understand, and reduce their environmental footprint.

---

## 🛠️ Technology Stack
- **Frontend**: React (Vite) + TypeScript + Tailwind CSS (v4)
- **Backend**: FastAPI (Python) + Pytest + Uvicorn
- **Database & Cache**: Supabase (PostgreSQL, Auth, and Edge Functions)

---

## 📂 Project Structure
```bash
VirtualPromptWar/
├── backend/
│   ├── main.py          # FastAPI application entry point
│   ├── auth.py          # Supabase authentication & token gateway
│   ├── migrate.py       # Automated PostgreSQL schema migration script
│   └── tests/           # Unit tests for verification
│       └── test_main.py
├── frontend/
│   ├── src/
│   │   ├── App.tsx      # Main portal, PIN gate, and Carbon Tracker views
│   │   ├── index.css    # Tailwind CSS inputs
│   │   └── types.ts     # TypeScript interface definitions
│   └── package.json     # Node configurations
├── HLD.md               # High-Level Architecture Design
├── LLD.md               # Low-Level Component Design
├── SCHEMA.md            # PostgreSQL Database Schema definition
├── memory.md            # Project checkpoint log
├── requirements.txt     # Python backend dependencies
└── .env                 # Environment credentials (API keys and Database URLs)
```

---

## 🚀 Getting Started

### 1. Database Setup (Supabase)
Ensure your `.env` variables are populated in the root directory. Then run the automated database migration script to construct the tables in your Supabase project:
```bash
# From the root directory
python backend/migrate.py
```

### 2. Backend Setup (FastAPI)
Install Python dependencies and start the backend development server:
```bash
# Install packages
pip install -r requirements.txt

# Start FastAPI server
uvicorn backend.main:app --reload
```
The backend API documentation will be available at `http://localhost:8000/docs`.

### 3. Frontend Setup (React + Tailwind v4)
Install Node modules and start the Vite development server:
```bash
# Navigate to frontend folder
cd frontend

# Install Node modules
npm install

# Start Vite hot-reload dev server
npm run dev
```
Open `http://localhost:5173/` in your browser.

---

## 🧪 Verification & Testing
To run the automated test suite verifying auth dependencies and endpoints:
```bash
# From the root directory
python -m pytest backend/tests/
```

---

## 🔒 Security & Sub-App Purchase Flow
1. **Purchase**: Users subscribe to a sub-application (PID: `carbon-tracker-pro`) and establish a 4-digit PIN.
2. **Access Gate**: When clicking the locked sub-app, a glassmorphic PIN prompt is loaded.
3. **PIN Verification**: The 4-digit PIN is verified securely via a Supabase Edge Function to prevent credentials tampering or replay attacks.
4. **Session**: An authorized session grants token permission to query and append carbon footprints.
