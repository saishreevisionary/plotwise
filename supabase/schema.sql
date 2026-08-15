-- ====================================================================
-- PLOTWISE AI - Supabase PostgreSQL Schema Migration
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT,
    description TEXT,
    created_by TEXT DEFAULT 'User',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Layouts Table
CREATE TABLE IF NOT EXISTS public.layouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    original_width INT DEFAULT 1600,
    original_height INT DEFAULT 1200,
    processing_status TEXT NOT NULL DEFAULT 'uploaded' CHECK (processing_status IN ('uploaded', 'processing', 'completed', 'needs_review', 'failed')),
    ai_model TEXT DEFAULT 'vision-ocr-v1',
    processing_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Plots Table
CREATE TABLE IF NOT EXISTS public.plots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    layout_id UUID NOT NULL REFERENCES public.layouts(id) ON DELETE CASCADE,
    plot_number TEXT NOT NULL,
    area NUMERIC DEFAULT 1200,
    price NUMERIC DEFAULT 1500000,
    facing TEXT DEFAULT 'East',
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'sold')),
    customer_name TEXT,
    customer_phone TEXT,
    booking_date TIMESTAMPTZ,
    polygon_coordinates JSONB NOT NULL,
    ai_confidence NUMERIC DEFAULT 0.95,
    ai_detected BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Roads Table
CREATE TABLE IF NOT EXISTS public.roads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    layout_id UUID NOT NULL REFERENCES public.layouts(id) ON DELETE CASCADE,
    name TEXT DEFAULT 'Internal Road',
    polygon_coordinates JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Plot Status History Table
CREATE TABLE IF NOT EXISTS public.plot_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_id UUID NOT NULL REFERENCES public.plots(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by TEXT DEFAULT 'Admin',
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- 7. Indexes for Query Performance
CREATE INDEX IF NOT EXISTS idx_layouts_project_id ON public.layouts(project_id);
CREATE INDEX IF NOT EXISTS idx_plots_layout_id ON public.plots(layout_id);
CREATE INDEX IF NOT EXISTS idx_plots_status ON public.plots(status);
CREATE INDEX IF NOT EXISTS idx_plots_number ON public.plots(plot_number);
CREATE INDEX IF NOT EXISTS idx_roads_layout_id ON public.roads(layout_id);
CREATE INDEX IF NOT EXISTS idx_history_plot_id ON public.plot_status_history(plot_id);

-- 8. Updated At Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_layouts_updated_at BEFORE UPDATE ON public.layouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_plots_updated_at BEFORE UPDATE ON public.plots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Row Level Security (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plot_status_history ENABLE ROW LEVEL SECURITY;

-- Allow public read & authenticated write policies
CREATE POLICY "Allow public read projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Allow public write projects" ON public.projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update projects" ON public.projects FOR UPDATE USING (true);

CREATE POLICY "Allow public read layouts" ON public.layouts FOR SELECT USING (true);
CREATE POLICY "Allow public write layouts" ON public.layouts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update layouts" ON public.layouts FOR UPDATE USING (true);

CREATE POLICY "Allow public read plots" ON public.plots FOR SELECT USING (true);
CREATE POLICY "Allow public write plots" ON public.plots FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update plots" ON public.plots FOR UPDATE USING (true);
CREATE POLICY "Allow public delete plots" ON public.plots FOR DELETE USING (true);

CREATE POLICY "Allow public read roads" ON public.roads FOR SELECT USING (true);
CREATE POLICY "Allow public write roads" ON public.roads FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read plot_status_history" ON public.plot_status_history FOR SELECT USING (true);
CREATE POLICY "Allow public write plot_status_history" ON public.plot_status_history FOR INSERT WITH CHECK (true);
