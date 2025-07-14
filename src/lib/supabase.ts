import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export type RegionType = 'กลาง' | 'เหนือ' | 'ใต้ | \'ออก' | 'ตก';
export type RouteStatus = 'active' | 'inactive' | 'completed' | 'cancelled';
export type RouteType = 'recurring' | 'one_time';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface Driver {
  id: string;
  name: string;
  phone?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  registration_number: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface VehicleType {
  id: string;
  type_name: string;
  description?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Route {
  id: string;
  route_code: string;
  route_name: string;
  region: RegionType;
  origin_coordinates?: string;
  destination_coordinates?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface RouteSchedule {
  id: string;
  route_id: string;
  route_type: RouteType;
  standby_time: string;
  departure_time: string;
  start_date: string;
  end_date?: string;
  days_of_week: DayOfWeek[];
  driver_id?: string;
  vehicle_id?: string;
  status: RouteStatus;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  route?: Route;
  driver?: Driver;
  vehicle?: Vehicle;
}

export interface RouteOverride {
  id: string;
  route_schedule_id: string;
  override_date: string;
  standby_time?: string;
  departure_time?: string;
  driver_id?: string;
  vehicle_id?: string;
  status?: RouteStatus;
  notes?: string;
  created_by: string;
  created_at: string;
}

export interface DailyRoute {
  schedule_id: string;
  route_id: string;
  route_code: string;
  route_name: string;
  region: RegionType;
  standby_time: string;
  departure_time: string;
  driver_name?: string;
  vehicle_registration?: string;
  status: RouteStatus;
  is_override: boolean;
  notes?: string;
}

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  old_values?: any;
  new_values?: any;
  user_id: string;
  created_at: string;
}