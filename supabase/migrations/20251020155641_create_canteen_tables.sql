/*
  # KuEats Canteen Management System Schema

  ## Overview
  This migration creates the complete database schema for the KuEats canteen management system,
  including canteens, menu items, orders, and reviews.

  ## New Tables
  
  ### 1. `canteens`
  Stores canteen information and owner details
  - `id` (uuid, primary key) - Unique canteen identifier
  - `owner_id` (uuid, foreign key to auth.users) - Reference to the canteen owner
  - `name` (text) - Canteen name
  - `description` (text) - Canteen description
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### 2. `menu_items`
  Stores menu items for each canteen
  - `id` (uuid, primary key) - Unique menu item identifier
  - `canteen_id` (uuid, foreign key) - Reference to canteen
  - `name` (text) - Item name
  - `description` (text) - Item description
  - `price` (decimal) - Item price
  - `category` (text) - Item category (e.g., Main Course, Drinks, Desserts)
  - `image_url` (text) - Item image URL
  - `is_available` (boolean) - Availability status
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### 3. `orders`
  Stores customer orders
  - `id` (uuid, primary key) - Unique order identifier
  - `canteen_id` (uuid, foreign key) - Reference to canteen
  - `customer_name` (text) - Customer name
  - `customer_phone` (text) - Customer phone number
  - `items` (jsonb) - Order items array with details
  - `total_amount` (decimal) - Total order amount
  - `status` (text) - Order status (pending, preparing, ready, completed, cancelled)
  - `created_at` (timestamptz) - Order timestamp
  - `updated_at` (timestamptz) - Status update timestamp

  ### 4. `reviews`
  Stores customer reviews for canteens
  - `id` (uuid, primary key) - Unique review identifier
  - `canteen_id` (uuid, foreign key) - Reference to canteen
  - `order_id` (uuid, foreign key) - Reference to order
  - `customer_name` (text) - Customer name
  - `rating` (integer) - Rating (1-5)
  - `comment` (text) - Review comment
  - `created_at` (timestamptz) - Review timestamp

  ## Security
  
  ### Row Level Security (RLS)
  - All tables have RLS enabled
  - Canteen owners can only access their own canteen data
  - Orders and reviews are linked to specific canteens
  
  ### Policies
  
  #### Canteens Table
  1. Owners can view their own canteen
  2. Owners can update their own canteen
  3. Owners can insert their own canteen
  
  #### Menu Items Table
  1. Owners can view menu items for their canteen
  2. Owners can insert menu items for their canteen
  3. Owners can update menu items for their canteen
  4. Owners can delete menu items for their canteen
  
  #### Orders Table
  1. Owners can view orders for their canteen
  2. Owners can update order status for their canteen
  
  #### Reviews Table
  1. Owners can view reviews for their canteen

  ## Important Notes
  - All timestamps use timestamptz for timezone awareness
  - Foreign key constraints ensure data integrity
  - Indexes are added for frequently queried columns
  - Default values prevent null-related issues
*/

-- Create canteens table
CREATE TABLE IF NOT EXISTS canteens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canteen_id uuid REFERENCES canteens(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  price decimal(10,2) NOT NULL CHECK (price >= 0),
  category text DEFAULT 'Other',
  image_url text DEFAULT '',
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canteen_id uuid REFERENCES canteens(id) ON DELETE CASCADE NOT NULL,
  customer_name text NOT NULL,
  customer_phone text DEFAULT '',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_amount decimal(10,2) NOT NULL CHECK (total_amount >= 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canteen_id uuid REFERENCES canteens(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_canteens_owner_id ON canteens(owner_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_canteen_id ON menu_items(canteen_id);
CREATE INDEX IF NOT EXISTS idx_orders_canteen_id ON orders(canteen_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_reviews_canteen_id ON reviews(canteen_id);

-- Enable Row Level Security
ALTER TABLE canteens ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Canteens policies
CREATE POLICY "Owners can view own canteen"
  ON canteens FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert own canteen"
  ON canteens FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own canteen"
  ON canteens FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Menu items policies
CREATE POLICY "Owners can view own menu items"
  ON menu_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM canteens
      WHERE canteens.id = menu_items.canteen_id
      AND canteens.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can insert own menu items"
  ON menu_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM canteens
      WHERE canteens.id = menu_items.canteen_id
      AND canteens.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update own menu items"
  ON menu_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM canteens
      WHERE canteens.id = menu_items.canteen_id
      AND canteens.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM canteens
      WHERE canteens.id = menu_items.canteen_id
      AND canteens.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can delete own menu items"
  ON menu_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM canteens
      WHERE canteens.id = menu_items.canteen_id
      AND canteens.owner_id = auth.uid()
    )
  );

-- Orders policies
CREATE POLICY "Owners can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM canteens
      WHERE canteens.id = orders.canteen_id
      AND canteens.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update own orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM canteens
      WHERE canteens.id = orders.canteen_id
      AND canteens.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM canteens
      WHERE canteens.id = orders.canteen_id
      AND canteens.owner_id = auth.uid()
    )
  );

-- Reviews policies
CREATE POLICY "Owners can view own reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM canteens
      WHERE canteens.id = reviews.canteen_id
      AND canteens.owner_id = auth.uid()
    )
  );