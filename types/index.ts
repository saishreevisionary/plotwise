export type PlotStatus = 'available' | 'booked' | 'sold';

export type FacingDirection =
  | 'East'
  | 'West'
  | 'North'
  | 'South'
  | 'North-East'
  | 'North-West'
  | 'South-East'
  | 'South-West';

export type PolygonPoint = [number, number];

export interface Project {
  id: string;
  name: string;
  location: string;
  description: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  layout_count?: number;
  total_plots?: number;
  available_plots?: number;
  booked_plots?: number;
  sold_plots?: number;
  total_value?: number;
}

export type ProcessingStatus = 'uploaded' | 'processing' | 'completed' | 'needs_review' | 'failed';

export interface Layout {
  id: string;
  project_id: string;
  file_url: string;
  file_type: 'image/jpeg' | 'image/png' | 'application/pdf' | string;
  original_width: number;
  original_height: number;
  processing_status: ProcessingStatus;
  ai_model: string;
  processing_error?: string;
  created_at: string;
  updated_at: string;
}

export interface Plot {
  id: string;
  layout_id: string;
  plot_number: string;
  dimensions_text?: string; // e.g. "65' 0\" × 42' 0\""
  area_cents?: number; // e.g. 6.26 Cents
  area: number; // in sq.ft
  price: number; // in currency units
  facing: FacingDirection;
  status: PlotStatus;
  customer_name?: string;
  customer_phone?: string;
  booking_date?: string;
  polygon_coordinates: PolygonPoint[];
  ai_confidence: number;
  ai_detected: boolean;
  created_at: string;
  updated_at: string;
}

export interface Road {
  id: string;
  layout_id: string;
  name?: string;
  polygon_coordinates: PolygonPoint[];
  created_at: string;
}

export interface PlotStatusHistory {
  id: string;
  plot_id: string;
  old_status?: PlotStatus | string;
  new_status: PlotStatus;
  changed_by: string;
  changed_at: string;
  notes?: string;
}

export interface AIAnalysisResult {
  canvas: {
    width: number;
    height: number;
  };
  plots: Array<{
    plot_number: string;
    polygon: PolygonPoint[];
    area: number;
    dimensions_text?: string;
    area_cents?: number;
    facing: FacingDirection;
    price?: number;
    confidence: number;
  }>;
  roads: Array<{
    name?: string;
    polygon: PolygonPoint[];
  }>;
}

export interface MapViewport {
  x: number;
  y: number;
  zoom: number;
}

export type UserRole = 'admin' | 'broker' | 'client';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  phone?: string;
  broker_code?: string;
  agency_name?: string;
  assigned_broker_id?: string;
  created_by_id?: string;
  created_at?: string;
  avatar_url?: string;
}

export interface BrokerCode {
  code: string;
  broker_id: string;
  broker_name: string;
  agency_name: string;
  phone: string;
  commission_rate: number; // e.g. 2.5%
  active_clients: number;
  total_sales: number;
  created_at: string;
}

export interface PlotHold {
  id: string;
  plot_id: string;
  broker_id: string;
  broker_name: string;
  client_name: string;
  client_phone: string;
  client_email?: string;
  expires_at: string;
  status: 'active' | 'expired' | 'converted';
  created_at: string;
}

