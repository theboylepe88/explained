import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Truck } from 'lucide-react';
import { supabase, Vehicle } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export function VehiclesManagement() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({
    registration_number: '',
    is_active: true
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching vehicles:', error);
        return;
      }

      setVehicles(data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const vehicleData = {
        registration_number: formData.registration_number,
        is_active: formData.is_active
      };

      if (editingVehicle) {
        const { error } = await supabase
          .from('vehicles')
          .update({
            ...vehicleData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingVehicle.id);

        if (error) {
          console.error('Error updating vehicle:', error);
          alert('เกิดข้อผิดพลาดในการอัปเดตข้อมูลยานพาหนะ');
          return;
        }
      } else {
        const { error } = await supabase
          .from('vehicles')
          .insert({
            ...vehicleData,
            created_by: user.id
          });

        if (error) {
          console.error('Error creating vehicle:', error);
          alert('เกิดข้อผิดพลาดในการเพิ่มยานพาหนะ');
          return;
        }
      }

      setFormData({ registration_number: '', is_active: true });
      setEditingVehicle(null);
      setShowForm(false);
      fetchVehicles();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      registration_number: vehicle.registration_number,
      is_active: vehicle.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (vehicleId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบยานพาหนะคันนี้?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);

      if (error) {
        console.error('Error deleting vehicle:', error);
        alert('เกิดข้อผิดพลาดในการลบยานพาหนะ');
        return;
      }

      fetchVehicles();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      alert('เกิดข้อผิดพลาดในการลบยานพาหนะ');
    }
  };

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.registration_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">จัดการยานพาหนะ</h1>
            <p className="text-gray-600 mt-1">จัดการข้อมูลยานพาหนะ</p>
          </div>
          
          <button
            onClick={() => {
              setEditingVehicle(null);
              setFormData({ registration_number: '', is_active: true });
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            เพิ่มยานพาหนะใหม่
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="ค้นหาทะเบียนยานพาหนะ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingVehicle ? 'แก้ไขข้อมูลยานพาหนะ' : 'เพิ่มยานพาหนะใหม่'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ทะเบียน *
                </label>
                <input
                  type="text"
                  value={formData.registration_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, registration_number: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="เช่น กข 1234"
                  required
                />
              </div>
              
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">ใช้งานอยู่</span>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                บันทึก
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">ไม่พบยานพาหนะที่ค้นหา</p>
          </div>
        ) : (
          filteredVehicles.map((vehicle) => (
            <div key={vehicle.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Truck className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 font-mono text-lg">
                        {vehicle.registration_number}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        vehicle.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {vehicle.is_active ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(vehicle)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(vehicle.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">
                    ทะเบียน: {vehicle.registration_number}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}