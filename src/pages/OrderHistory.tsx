import React, { useEffect, useState } from 'react';
import { Search, Calendar, LocateIcon, MapPin } from 'lucide-react';
import { supabase, Order } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const OrderHistory: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any>([]);
  const [filteredOrders, setFilteredOrders] = useState<any>([]);
  const [canteenId, setCanteenId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadCanteenData();
  }, [user]);

  useEffect(() => {
    if (canteenId) {
      loadOrders();
    }
  }, [canteenId]);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

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
  };

  const loadOrders = async () => {
    if (!canteenId) return;

    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('canteen_id', canteenId)
      .order('created_at', { ascending: false });
    console.log("orders yere ", data[0].items[0].menuItem.price);
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
          // If it's a single object, wrap it in an array
          items = Array.isArray(items) ? items : [items];
        } else {
          items = [];
        }
      }
      return { ...o, items } as Order;
    });

    setOrders(normalized);
  };

  const filterOrders = () => {
    let filtered = [...orders];

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customer_phone.includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'preparing': return '#3b82f6';
      case 'completed': return '#059669';
      default: return '#6b7280';
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8" style={{ color: '#831615' }}>Order History</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by customer name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
            />
          </div> */}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>

            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <div key={order.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-xl">{order.customer.name}</h3>
                <div className="flex items-center text-sm text-gray-500 mt-2">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(order.created_at).toLocaleString()}
                </div>
                <div className="flex items-center text-sm text-gray-500 mt-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  {order.customer.department}
                </div>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold mb-2" style={{ color: '#831615' }}>
                  PKR {parseFloat(order.total_amount.toString()).toFixed(2)}
                </p>
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-full inline-block"
                  style={{
                    backgroundColor: getStatusColor(order.status) + '20',
                    color: getStatusColor(order.status),
                  }}
                >
                  {order.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Order Items:</h4>
              <div className="space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {item.menuItem.name} <span className="text-gray-500">x {item.quantity}</span>
                    </span>
                    <span className="font-medium">PKR {  (item.menuItem.price)* (item.quantity)  }</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'all'
              ? 'No orders found matching your filters'
              : 'No orders yet'}
          </p>
        </div>
      )}
    </div>
  );
};
