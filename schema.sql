-- PLOTWISE AI: Production Database Schema (PostgreSQL / Supabase)
-- Idempotent script: Safe to execute repeatedly without relation conflict errors (42P07).

-- 1. SAFE CLEANUP FOR RE-RUNS
DROP TABLE IF EXISTS plot_status_history CASCADE;
DROP TABLE IF EXISTS plot_holds CASCADE;
DROP TABLE IF EXISTS plots CASCADE;
DROP TABLE IF EXISTS layouts CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS broker_codes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS facing_direction CASCADE;
DROP TYPE IF EXISTS plot_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- 2. ENUMS
CREATE TYPE user_role AS ENUM ('admin', 'broker', 'client');
CREATE TYPE plot_status AS ENUM ('available', 'booked', 'sold');
CREATE TYPE facing_direction AS ENUM ('East', 'West', 'North', 'South', 'North-East', 'North-West', 'South-East', 'South-West');

-- 3. USERS TABLE
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'client',
    phone VARCHAR(32),
    broker_code VARCHAR(64),
    agency_name VARCHAR(255),
    assigned_broker_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    created_by_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. BROKER CODES TABLE
CREATE TABLE broker_codes (
    code VARCHAR(64) PRIMARY KEY,
    broker_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    broker_name VARCHAR(255) NOT NULL,
    agency_name VARCHAR(255),
    phone VARCHAR(32),
    commission_rate DECIMAL(5,2) DEFAULT 2.50,
    active_clients INT DEFAULT 0,
    total_sales DECIMAL(15,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. PROJECTS TABLE
CREATE TABLE projects (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT,
    created_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. LAYOUTS TABLE (Site Blueprint Files)
CREATE TABLE layouts (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type VARCHAR(64) DEFAULT 'image/svg+xml',
    original_width INT NOT NULL DEFAULT 1200,
    original_height INT NOT NULL DEFAULT 964,
    processing_status VARCHAR(32) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. PLOTS TABLE (Intelligent 2D/3D Land Blocks)
CREATE TABLE plots (
    id VARCHAR(64) PRIMARY KEY,
    layout_id VARCHAR(64) NOT NULL REFERENCES layouts(id) ON DELETE CASCADE,
    plot_number VARCHAR(32) NOT NULL,
    dimensions_text VARCHAR(64),
    area DECIMAL(10,2) NOT NULL, -- in sq.ft
    price DECIMAL(15,2) NOT NULL, -- in currency units
    facing facing_direction DEFAULT 'East',
    status plot_status DEFAULT 'available',
    customer_name VARCHAR(255),
    customer_phone VARCHAR(32),
    booking_date TIMESTAMP WITH TIME ZONE,
    polygon_coordinates JSONB NOT NULL, -- Array of [x, y] polygon points
    ai_confidence DECIMAL(4,3) DEFAULT 0.950,
    ai_detected BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. PLOT HOLDS TABLE (48-Hour Broker Reservations)
CREATE TABLE plot_holds (
    id VARCHAR(64) PRIMARY KEY,
    plot_id VARCHAR(64) NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
    broker_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    broker_name VARCHAR(255) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    client_phone VARCHAR(32) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(32) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. PLOT STATUS HISTORY AUDIT LOG
CREATE TABLE plot_status_history (
    id VARCHAR(64) PRIMARY KEY,
    plot_id VARCHAR(64) NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
    old_status plot_status,
    new_status plot_status NOT NULL,
    changed_by VARCHAR(255) NOT NULL,
    notes TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. PERFORMANCE INDEXES
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_broker_code ON users(broker_code);
CREATE INDEX idx_broker_codes_broker_id ON broker_codes(broker_id);
CREATE INDEX idx_plots_layout_id ON plots(layout_id);
CREATE INDEX idx_plots_status ON plots(status);
CREATE INDEX idx_plot_holds_expires_at ON plot_holds(expires_at);

-- 11. AUTOMATED UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_layouts_updated_at BEFORE UPDATE ON layouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_plots_updated_at BEFORE UPDATE ON plots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. INITIAL DEVELOPER ADMIN SEED ACCOUNT
INSERT INTO users (id, name, email, password_hash, role, agency_name, phone)
VALUES (
    'usr-admin-1',
    'Alex Morgan',
    'admin@plotwise',
    'admin123',
    'admin',
    'Green Valley Developers (Master Admin)',
    '+91 98000 00000'
)
ON CONFLICT (email) DO UPDATE 
SET role = 'admin', password_hash = 'admin123';

-- 13. ROW LEVEL SECURITY (RLS) CONFIGURATION
-- Disable RLS on tables so the Supabase anon key can read and write data
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE broker_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE layouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE plots DISABLE ROW LEVEL SECURITY;
ALTER TABLE plot_holds DISABLE ROW LEVEL SECURITY;
ALTER TABLE plot_status_history DISABLE ROW LEVEL SECURITY;

