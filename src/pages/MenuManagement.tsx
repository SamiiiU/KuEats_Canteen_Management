import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { supabase, MenuItem } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const MenuManagement: React.FC = () => {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [canteenId, setCanteenId] = useState<string | null>("Chemistry Canteen");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Main Course',
    image_url: '',
  });

  useEffect(() => {
    loadCanteenData();
  }, [user]);

  useEffect(() => {
    if (canteenId) {
      loadMenuItems();
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
  };

  const loadMenuItems = async () => {
    if (!canteenId) return;

    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('canteen_name', canteenId)
      .order('created_at', { ascending: false });
    if (error) console.error('Fetch Error:', error);
    else console.log('Menu items fetched:', data);

    setMenuItems(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canteenId) {
      console.log("Canteen id nh milri mujyh")
      return};

    const itemData = {
      canteen_name: canteenId,
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      category: formData.category,
      image_url: formData.image_url,
    };

    if (editingItem) {
      await supabase
        .from('menu_items')
        .update(itemData)
        .eq('id', editingItem.id);
    } else {
      await supabase
        .from('menu_items')
        .insert([itemData]);
    }

    resetForm();
    loadMenuItems();
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      image_url: item.image_url,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      await supabase.from('menu_items').delete().eq('id', id);
      loadMenuItems();
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    await supabase
      .from('menu_items')
      .update({
        is_available: !item.is_available,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.id);

    loadMenuItems();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'Main Course',
      image_url: '',
    });
    setEditingItem(null);
    setShowModal(false);
  };

  const categories = ['Main Course', 'Appetizers', 'Drinks', 'Desserts', 'Snacks', 'Other'];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold" style={{ color: '#831615' }}>Menu Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#831615' }}
        >
          <Plus className="w-5 h-5" />
          <span>Add Item</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="h-48 bg-gray-200 flex items-center justify-center" style={{ backgroundColor: '#f9f9f9' }}>
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400">No Image</span>
              )}
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-lg">{item.name}</h3>
                  <p className="text-sm text-gray-600">{item.category}</p>
                </div>
                <p className="text-xl font-bold" style={{ color: '#831615' }}>
                  ₹{parseFloat(item.price.toString()).toFixed(2)}
                </p>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.description}</p>

              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.is_available}
                    onChange={() => toggleAvailability(item)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">
                    {item.is_available ? 'Available' : 'Unavailable'}
                  </span>
                </label>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="flex-1 flex items-center justify-center space-x-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="flex-1 flex items-center justify-center space-x-1 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {menuItems.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No menu items yet. Add your first item to get started!</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: '#831615' }}>
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h2>
              <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#831615' }}
                >
                  {editingItem ? 'Update' : 'Add'} Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
