import React, { useEffect, useState } from 'react';
import { DollarSign, ShoppingBag, Star, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { supabase, Order, MenuItem } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface DashboardStats {
  totalEarnings: number;
  todayEarnings: number;
  totalOrders: number;
  averageRating: number;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalEarnings: 0,
    todayEarnings: 0,
    totalOrders: 0,
    averageRating: 0,
  });
  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  const [canteenId, setCanteenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCanteenData();
  }, [user]);

  useEffect(() => {
    if (canteenId) {
      loadStats();
      loadLiveOrders();

      const ordersSubscription = supabase
        .channel('orders_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `canteen_id=eq.${canteenId}`,
          },
          () => {
            loadLiveOrders();
            loadStats();
          }
        )
        .subscribe();

      return () => {
        ordersSubscription.unsubscribe();
      };
    }
  }, [canteenId]);

  const loadCanteenData = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('canteens')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (data) {
      setCanteenId(data.id);
    }
    setLoading(false);
  };

  const loadStats = async () => {
    if (!canteenId) return;

    const { data: orders } = await supabase
      .from('orders')
      .select('total_amount, created_at, status')
      .eq('canteen_id', canteenId);

    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('canteen_id', canteenId);
      

    const totalEarnings = orders?.reduce((sum, order) => {
      if (order.status === 'completed') {
        return sum + parseFloat(order.total_amount.toString());
      }
      return sum;
    }, 0) || 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEarnings = orders?.reduce((sum, order) => {
      const orderDate = new Date(order.created_at);
      if (orderDate >= today && order.status === 'completed') {
        return sum + parseFloat(order.total_amount.toString());
      }
      return sum;
    }, 0) || 0;

    const averageRating = reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    setStats({
      totalEarnings,
      todayEarnings,
      totalOrders: orders?.length || 0,
      averageRating,
    });
  };

  const loadLiveOrders = async () => {
    if (!canteenId) return;

    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('canteen_id', canteenId)
      .in('status', ['pending', 'preparing', 'ready', 'pickedUp'])
      .order('created_at', { ascending: false });

    const normalized = (data || []).map((o: any) => {
      let items = o.items;
      if (!Array.isArray(items)) {
        if (typeof items === 'string') {
          try {
            items = JSON.parse(items);
          } catch (e) {
            items = [];
          }
        } else if (items == null) {
          items = [];
        } else if (typeof items === 'object') {
          items = Array.isArray(items) ? items : [items];
        } else {
          items = [];
        }
      }
      return { ...o, items } as Order;
    });

    setLiveOrders(normalized);
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    loadLiveOrders();
    loadStats();
  };
  // status = ANY (ARRAY['pending'::text, 'preparing'::text, 'ready'::text, 'completed'::text, 'cancelled'::text])

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'preparing': return '#3b82f6';
      case 'ready': return '#3b82f6';
      case 'pickedUp': return '#3b82f6';
      case 'completed': return '#3b82f6';


      default: return '#6b7280';
    }
  };

  const getNextStatus = (currentStatus: Order['status']): Order['status'] | null => {
    switch (currentStatus) {
      case 'pending': return 'preparing';
      case 'preparing': return 'ready';
      case 'ready': return 'pickedUp';
      case 'pickedUp': return 'completed';
      case 'completed' : return 'completed'
      default: return null;
    }
  };

  const getStatusButtonText = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Accept Order';
      case 'preparing': return 'Mark as Ready';
      case 'ready': return 'Rider Picked Up';
      case 'pickedUp': return 'Mark as Delivered';
      case 'completed': return 'Complete Project';

      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl" style={{ color: '#831615' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8" style={{ color: '#831615' }}>Main Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 text-sm font-medium">Total Earnings</h3>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold" style={{ color: '#831615' }}>
            PKR {stats.totalEarnings.toFixed(2)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 text-sm font-medium">Today's Earnings</h3>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold" style={{ color: '#831615' }}>
            PKR{stats.todayEarnings.toFixed(2)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 text-sm font-medium">Total Orders</h3>
            <ShoppingBag className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold" style={{ color: '#831615' }}>
            {stats.totalOrders}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 text-sm font-medium">Average Rating</h3>
            <Star className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold" style={{ color: '#831615' }}>
            {stats.averageRating.toFixed(1)} / 5
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-6" style={{ color: '#831615' }}>Live Orders</h2>

        {liveOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No active orders at the moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {liveOrders.map((order) => (
              <div
                key={order.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                style={{ borderColor: getStatusColor(order.status) }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{order.customer_name}</h3>
                    <p className="text-sm text-gray-600">{order.customer_phone}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold" style={{ color: '#831615' }}>
                      PKR {parseFloat(order.total_amount.toString()).toFixed(2)}
                    </p>
                    <span
                      className="text-xs font-semibold px-3 py-1 rounded-full inline-block mt-2"
                      style={{
                        backgroundColor: getStatusColor(order.status) + '20',
                        color: getStatusColor(order.status),
                      }}
                    >
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Items:</h4>
                  <ul className="space-y-1">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex justify-between">
                        <span>{item.name} x {item.quantity}</span>
                        <span>PKR {(item.price * item.quantity).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {getNextStatus(order.status) && (
                  <button
                    onClick={() => {
                      const nextStatus = getNextStatus(order.status);
                      if (nextStatus) updateOrderStatus(order.id, nextStatus);
                    }}
                    className="w-full py-2 px-4 rounded-lg font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: '#831615' }}
                  >
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                    {getStatusButtonText(order.status)}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
