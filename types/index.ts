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

export type AccuracyMode = 'visual' | 'calibrated' | 'survey';

export interface GpsAnchor {
  lat: number;
  lng: number;
  zoom?: number;
  rotation_degrees?: number; // Compass rotation in degrees (0 = North)
  meters_per_pixel?: number; // Ground scale
}

export interface ControlPointPair {
  id: string;
  label?: string;
  image_point: PolygonPoint; // [x, y] in pixel coordinates
  geo_point: [number, number]; // [lat, lng] in GPS coordinates
}

export type ProcessingStatus = 'uploaded' | 'processing' | 'completed' | 'needs_review' | 'failed';

export type CalibrationStatus = 'uncalibrated' | 'calibrating' | 'calibrated' | 'needs_review';

export interface Layout {
  id: string;
  project_id: string;
  file_url: string;
  file_type: 'image/jpeg' | 'image/png' | 'application/pdf' | string;
  original_width: number;
  original_height: number;
  processing_status: ProcessingStatus;
  status?: ProcessingStatus; // Backward compatible alias
  calibration_status?: CalibrationStatus;
  ai_model: string;
  processing_error?: string;
  
  // Real-World Geospatial & Aerial Extensions
  accuracy_mode?: AccuracyMode;
  aerial_image_url?: string;
  aerial_opacity?: number; // 0.0 to 1.0
  gps_anchor?: GpsAnchor;
  control_points?: ControlPointPair[];
  image_source_type?: 'blueprint' | 'drone_aerial' | 'satellite' | 'site_photo' | 'scanned_plan';

  created_at: string;
  updated_at: string;
}

export interface Plot {
  id: string;
  layout_id: string;
  plot_number: string;
  dimensions_text?: string; // e.g. "65' 0\" × 42' 0\""
  area_cents?: number; // e.g. 6.26 Cents
  area: number; // in sq.ft (Estimated)
  area_sq_meters?: number; // in m² (Estimated from geodesic calculation)
  real_world_scale_calibrated?: boolean; // True once GPS/scale calibration has been confirmed
  price: number; // in currency units
  facing: FacingDirection;
  status: PlotStatus;
  customer_name?: string;
  customer_phone?: string;
  booking_date?: string;
  deed_number?: string;
  payment_ref?: string;
  token_amount?: number;
  
  // Image & Geo Coordinates
  polygon_coordinates: PolygonPoint[]; // Primary image coordinate polygon
  image_polygon?: PolygonPoint[]; // Explicit image space alias
  geo_polygon?: [number, number][] | null; // Geographic [latitude, longitude] polygon (null when uncalibrated)
  
  road_access?: string; // e.g. "Main 30ft Avenue"
  neighboring_plots?: string[]; // e.g. ["P02", "P05"]

  ai_confidence: number; // 0.0 to 1.0 (>= 0.85 = High Green, 0.60-0.84 = Med Yellow, < 0.60 = Low Red/Review)
  ai_detected: boolean;
  accuracy_mode?: AccuracyMode;
  created_at: string;
  updated_at: string;
}

export interface Road {
  id: string;
  layout_id: string;
  name?: string;
  polygon_coordinates: PolygonPoint[];
  geo_polygon?: [number, number][]; // Optional [latitude, longitude]
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
  coordinate_space?: 'pixel' | 'geographic';
  accuracy_mode?: AccuracyMode;
  image_source_type?: 'blueprint' | 'drone_aerial' | 'satellite' | 'site_photo';
  plots: Array<{
    plot_number: string;
    polygon: PolygonPoint[];
    geo_polygon?: [number, number][];
    area: number;
    dimensions_text?: string;
    area_cents?: number;
    facing: FacingDirection;
    price?: number;
    confidence: number;
    road_access?: string;
    neighboring_plots?: string[];
  }>;
  roads: Array<{
    name?: string;
    polygon: PolygonPoint[];
    geo_polygon?: [number, number][];
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

