# Database Schema Specification (Supabase PostgreSQL)

This schema handles users, sub-applications (identified by PID), purchases (with hashed PIN protection), and carbon footprint logs.

```sql
-- Available Sub-Applications Catalog
CREATE TABLE IF NOT EXISTS sub_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pid VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'carbon-tracker-pro'
    name VARCHAR(150) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT
);

-- User-purchased Sub-Application Accounts (integrated with Supabase Auth users)
CREATE TABLE IF NOT EXISTS user_sub_app_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    pid VARCHAR(100) REFERENCES sub_applications(pid),
    pin_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_sub_app UNIQUE (user_id, pid)
);

-- Supabase Cache Table for PIN Verification Codes
CREATE TABLE IF NOT EXISTS pin_verification_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    pid VARCHAR(100) NOT NULL,
    verification_code_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Carbon Tracking Data logs
CREATE TABLE IF NOT EXISTS carbon_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL, -- 'transportation', 'energy', 'food'
    value DECIMAL(10, 2) NOT NULL, -- CO2 in kilograms
    logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_sub_app_pid ON user_sub_app_accounts(user_id, pid);
CREATE INDEX IF NOT EXISTS idx_carbon_logs_user_date ON carbon_logs(user_id, logged_date);
CREATE INDEX IF NOT EXISTS idx_pin_cache_user_expires ON pin_verification_cache(user_id, expires_at);

-- Seed Sub-Applications Catalog
INSERT INTO sub_applications (pid, name, price, description)
VALUES ('carbon-tracker-pro', 'Carbon Tracker Pro', 9.99, 'Access advanced logs, automated wizard calculator, and personalized footprint insights.')
ON CONFLICT (pid) DO NOTHING;

```

