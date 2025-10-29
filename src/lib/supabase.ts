import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Canteen {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  canteen_id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  canteen_id: string;
  customer : {
    name : string
  };
  items: Array<{
    menuItem : Array<{
      name : string;
      price : number;
    }>;
    quantity : number;
  }>;
  total_amount: number;
  status: 'pending' | 'preparing' | 'ready' | 'pickedUp' | 'delivered' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  canteen_id: string;
  order_id: string | null;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}
