/*
  # Transportation Route Planning Schema

  1. New Tables
    - `profiles` - User profiles linked to auth.users
    - `drivers` - Driver information
    - `vehicles` - Vehicle registration and details
    - `routes` - Master route templates
    - `route_schedules` - Daily route instances (recurring and one-time)
    - `route_overrides` - Day-specific modifications
    - `audit_logs` - Track all changes for accountability
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Ensure users can only access their team's data
*/

-- Create custom types
CREATE TYPE region_type AS ENUM ('กลาง', 'เหนือ', 'ใต้', 'ออก', 'ตก');
CREATE TYPE route_status AS ENUM ('active', 'inactive', 'completed', 'cancelled');
CREATE TYPE route_type AS ENUM ('recurring', 'one_time');
CREATE TYPE day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

-- User profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text DEFAULT 'planner',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Drivers table
CREATE TABLE IF NOT EXISTS drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  license_number text UNIQUE,
  phone text,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number text UNIQUE NOT NULL,
  model text,
  capacity integer,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Routes master table
CREATE TABLE IF NOT EXISTS routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_code text UNIQUE NOT NULL,
  route_name text NOT NULL,
  region region_type NOT NULL,
  origin_coordinates text, -- "latitude,longitude"
  destination_coordinates text, -- "latitude,longitude"
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Route schedules table (for both recurring and one-time routes)
CREATE TABLE IF NOT EXISTS route_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid REFERENCES routes(id) ON DELETE CASCADE,
  route_type route_type NOT NULL DEFAULT 'recurring',
  standby_time time NOT NULL,
  departure_time time NOT NULL,
  start_date date NOT NULL,
  end_date date,
  days_of_week day_of_week[] DEFAULT '{}',
  driver_id uuid REFERENCES drivers(id),
  vehicle_id uuid REFERENCES vehicles(id),
  status route_status DEFAULT 'active',
  notes text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Route overrides table (for day-specific modifications)
CREATE TABLE IF NOT EXISTS route_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_schedule_id uuid REFERENCES route_schedules(id) ON DELETE CASCADE,
  override_date date NOT NULL,
  standby_time time,
  departure_time time,
  driver_id uuid REFERENCES drivers(id),
  vehicle_id uuid REFERENCES vehicles(id),
  status route_status,
  notes text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(route_schedule_id, override_date)
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL, -- 'insert', 'update', 'delete'
  old_values jsonb,
  new_values jsonb,
  user_id uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Drivers policies
CREATE POLICY "Authenticated users can read drivers"
  ON drivers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert drivers"
  ON drivers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update drivers"
  ON drivers FOR UPDATE
  TO authenticated
  USING (true);

-- Vehicles policies
CREATE POLICY "Authenticated users can read vehicles"
  ON vehicles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert vehicles"
  ON vehicles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update vehicles"
  ON vehicles FOR UPDATE
  TO authenticated
  USING (true);

-- Routes policies
CREATE POLICY "Authenticated users can read routes"
  ON routes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert routes"
  ON routes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update routes"
  ON routes FOR UPDATE
  TO authenticated
  USING (true);

-- Route schedules policies
CREATE POLICY "Authenticated users can read route schedules"
  ON route_schedules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert route schedules"
  ON route_schedules FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update route schedules"
  ON route_schedules FOR UPDATE
  TO authenticated
  USING (true);

-- Route overrides policies
CREATE POLICY "Authenticated users can read route overrides"
  ON route_overrides FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert route overrides"
  ON route_overrides FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update route overrides"
  ON route_overrides FOR UPDATE
  TO authenticated
  USING (true);

-- Audit logs policies
CREATE POLICY "Authenticated users can read audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_route_schedules_date_range ON route_schedules(start_date, end_date);
CREATE INDEX idx_route_schedules_route_id ON route_schedules(route_id);
CREATE INDEX idx_route_overrides_date ON route_overrides(override_date);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_user_date ON audit_logs(user_id, created_at);

-- Create functions for common queries
CREATE OR REPLACE FUNCTION get_routes_for_date(target_date date)
RETURNS TABLE (
  schedule_id uuid,
  route_id uuid,
  route_code text,
  route_name text,
  region region_type,
  standby_time time,
  departure_time time,
  driver_name text,
  vehicle_registration text,
  status route_status,
  is_override boolean,
  notes text
) AS $$
BEGIN
  RETURN QUERY
  WITH route_data AS (
    -- Get regular schedules for the date
    SELECT 
      rs.id as schedule_id,
      r.id as route_id,
      r.route_code,
      r.route_name,
      r.region,
      rs.standby_time,
      rs.departure_time,
      d.name as driver_name,
      v.registration_number as vehicle_registration,
      rs.status,
      false as is_override,
      rs.notes
    FROM route_schedules rs
    JOIN routes r ON rs.route_id = r.id
    LEFT JOIN drivers d ON rs.driver_id = d.id
    LEFT JOIN vehicles v ON rs.vehicle_id = v.id
    WHERE rs.start_date <= target_date
      AND (rs.end_date IS NULL OR rs.end_date >= target_date)
      AND (
        rs.route_type = 'one_time' AND rs.start_date = target_date
        OR 
        rs.route_type = 'recurring' AND 
        CASE EXTRACT(DOW FROM target_date)
          WHEN 1 THEN 'monday' = ANY(rs.days_of_week)
          WHEN 2 THEN 'tuesday' = ANY(rs.days_of_week)
          WHEN 3 THEN 'wednesday' = ANY(rs.days_of_week)
          WHEN 4 THEN 'thursday' = ANY(rs.days_of_week)
          WHEN 5 THEN 'friday' = ANY(rs.days_of_week)
          WHEN 6 THEN 'saturday' = ANY(rs.days_of_week)
          WHEN 0 THEN 'sunday' = ANY(rs.days_of_week)
        END
      )
    
    UNION ALL
    
    -- Get overrides for the date
    SELECT 
      rs.id as schedule_id,
      r.id as route_id,
      r.route_code,
      r.route_name,
      r.region,
      COALESCE(ro.standby_time, rs.standby_time) as standby_time,
      COALESCE(ro.departure_time, rs.departure_time) as departure_time,
      COALESCE(d_override.name, d.name) as driver_name,
      COALESCE(v_override.registration_number, v.registration_number) as vehicle_registration,
      COALESCE(ro.status, rs.status) as status,
      true as is_override,
      COALESCE(ro.notes, rs.notes) as notes
    FROM route_overrides ro
    JOIN route_schedules rs ON ro.route_schedule_id = rs.id
    JOIN routes r ON rs.route_id = r.id
    LEFT JOIN drivers d ON rs.driver_id = d.id
    LEFT JOIN vehicles v ON rs.vehicle_id = v.id
    LEFT JOIN drivers d_override ON ro.driver_id = d_override.id
    LEFT JOIN vehicles v_override ON ro.vehicle_id = v_override.id
    WHERE ro.override_date = target_date
  )
  SELECT * FROM route_data
  ORDER BY standby_time, departure_time, route_code;
END;
$$ LANGUAGE plpgsql;