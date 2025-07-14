/*
  # Remove unnecessary fields from vehicles and drivers tables

  1. Changes to vehicles table
    - Remove model column
    - Remove capacity column
  
  2. Changes to drivers table
    - Remove license_number column
  
  3. New vehicle_types table
    - Add vehicle_types table with type and description
*/

-- Remove columns from vehicles table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'model'
  ) THEN
    ALTER TABLE vehicles DROP COLUMN model;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'capacity'
  ) THEN
    ALTER TABLE vehicles DROP COLUMN capacity;
  END IF;
END $$;

-- Remove license_number column from drivers table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'drivers' AND column_name = 'license_number'
  ) THEN
    ALTER TABLE drivers DROP COLUMN license_number;
  END IF;
END $$;

-- Create vehicle_types table
CREATE TABLE IF NOT EXISTS vehicle_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type_name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on vehicle_types
ALTER TABLE vehicle_types ENABLE ROW LEVEL SECURITY;

-- Vehicle types policies
CREATE POLICY "Authenticated users can read vehicle types"
  ON vehicle_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert vehicle types"
  ON vehicle_types FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update vehicle types"
  ON vehicle_types FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete vehicle types"
  ON vehicle_types FOR DELETE
  TO authenticated
  USING (true);

-- Insert some default vehicle types
INSERT INTO vehicle_types (type_name, description, created_by) VALUES
('รถตู้', 'รถตู้โดยสารขนาดเล็ก', (SELECT id FROM profiles LIMIT 1)),
('รถบัส', 'รถบัสโดยสารขนาดใหญ่', (SELECT id FROM profiles LIMIT 1)),
('รถกระบะ', 'รถกระบะสำหรับขนส่งสินค้า', (SELECT id FROM profiles LIMIT 1))
ON CONFLICT DO NOTHING;