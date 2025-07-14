import React, { useState, useEffect } from 'react';
import { Save, X, MapPin } from 'lucide-react';
import { supabase, RouteSchedule, Driver, Vehicle, RouteType, RegionType, RouteStatus, DayOfWeek } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface RouteFormProps {
  route?: RouteSchedule | null;
  drivers: Driver[];
  vehicles: Vehicle[];
  onSave: () => void;
  onCancel: () => void;
}

export function RouteForm({ route, drivers, vehicles, onSave, onCancel }: RouteFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Route basic info
    route_code: '',
    route_name: '',
    region: 'กลาง' as RegionType,
    origin_coordinates: '',
    destination_coordinates: '',
    
    // Schedule info
    route_type: 'recurring' as RouteType,
    standby_time: '',
    departure_time: '',
    start_date: '',
    end_date: '',
    days_of_week: [] as DayOfWeek[],
    driver_id: '',
    vehicle_id: '',
    status: 'active' as RouteStatus,
    notes: ''
  });

  useEffect(() => {
    if (route?.route) {
      setFormData({
        route_code: route.route.route_code,
        route_name: route.route.route_name,
        region: route.route.region,
        origin_coordinates: route.route.origin_coordinates || '',
        destination_coordinates: route.route.destination_coordinates || '',
        route_type: route.route_type,
        standby_time: route.standby_time,
        departure_time: route.departure_time,
        start_date: route.start_date,
        end_date: route.end_date || '',
        days_of_week: route.days_of_week || [],
        driver_id: route.driver_id || '',
        vehicle_id: route.vehicle_id || '',
        status: route.status,
        notes: route.notes || ''
      });
    }
  }, [route]);

  const handleDayToggle = (day: DayOfWeek) => {
    setFormData(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      if (route?.route) {
        // Update existing route
        const { error: routeError } = await supabase
          .from('routes')
          .update({
            route_code: formData.route_code,
            route_name: formData.route_name,
            region: formData.region,
            origin_coordinates: formData.origin_coordinates || null,
            destination_coordinates: formData.destination_coordinates || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', route.route.id);

        if (routeError) {
          console.error('Error updating route:', routeError);
          alert('เกิดข้อผิดพลาดในการอัปเดตข้อมูลเส้นทาง');
          return;
        }

        const { error: scheduleError } = await supabase
          .from('route_schedules')
          .update({
            route_type: formData.route_type,
            standby_time: formData.standby_time,
            departure_time: formData.departure_time,
            start_date: formData.start_date,
            end_date: formData.end_date || null,
            days_of_week: formData.route_type === 'recurring' ? formData.days_of_week : [],
            driver_id: formData.driver_id || null,
            vehicle_id: formData.vehicle_id || null,
            status: formData.status,
            notes: formData.notes || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', route.id);

        if (scheduleError) {
          console.error('Error updating schedule:', scheduleError);
          alert('เกิดข้อผิดพลาดในการอัปเดตตารางเวลา');
          return;
        }
      } else {
        // Create new route
        const { data: newRoute, error: routeError } = await supabase
          .from('routes')
          .insert({
            route_code: formData.route_code,
            route_name: formData.route_name,
            region: formData.region,
            origin_coordinates: formData.origin_coordinates || null,
            destination_coordinates: formData.destination_coordinates || null,
            created_by: user.id
          })
          .select()
          .single();

        if (routeError) {
          console.error('Error creating route:', routeError);
          alert('เกิดข้อผิดพลาดในการสร้างเส้นทาง');
          return;
        }

        const { error: scheduleError } = await supabase
          .from('route_schedules')
          .insert({
            route_id: newRoute.id,
            route_type: formData.route_type,
            standby_time: formData.standby_time,
            departure_time: formData.departure_time,
            start_date: formData.start_date,
            end_date: formData.end_date || null,
            days_of_week: formData.route_type === 'recurring' ? formData.days_of_week : [],
            driver_id: formData.driver_id || null,
            vehicle_id: formData.vehicle_id || null,
            status: formData.status,
            notes: formData.notes || null,
            created_by: user.id
          });

        if (scheduleError) {
          console.error('Error creating schedule:', scheduleError);
          alert('เกิดข้อผิดพลาดในการสร้างตารางเวลา');
          return;
        }
      }

      onSave();
    } catch (error) {
      console.error('Error saving route:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const daysOfWeek = [
    { value: 'monday', label: 'จันทร์' },
    { value: 'tuesday', label: 'อังคาร' },
    { value: 'wednesday', label: 'พุธ' },
    { value: 'thursday', label: 'พฤหัสฯ' },
    { value: 'friday', label: 'ศุกร์' },
    { value: 'saturday', label: 'เสาร์' },
    { value: 'sunday', label: 'อาทิตย์' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {route ? 'แก้ไขเส้นทาง' : 'เพิ่มเส้นทางใหม่'}
            </h1>
            <p className="text-gray-600 mt-1">กรอกข้อมูลเส้นทางและตารางเวลา</p>
          </div>
          
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Route Information */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            ข้อมูลเส้นทาง
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รหัสเส้นทาง *
              </label>
              <input
                type="text"
                value={formData.route_code}
                onChange={(e) => setFormData(prev => ({ ...prev, route_code: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="เช่น LH-6W5.5-BAGH-SO5-05:00-1-RO"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อเส้นทาง *
              </label>
              <input
                type="text"
                value={formData.route_name}
                onChange={(e) => setFormData(prev => ({ ...prev, route_name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="เช่น กรุงเทพ-ชลบุรี"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ภูมิภาค *
              </label>
              <select
                value={formData.region}
                onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value as RegionType }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="กลาง">กลาง</option>
                <option value="เหนือ">เหนือ</option>
                <option value="ใต้">ใต้</option>
                <option value="ออก">ออก</option>
                <option value="ตก">ตก</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ประเภทเส้นทาง
              </label>
              <select
                value={formData.route_type}
                onChange={(e) => setFormData(prev => ({ ...prev, route_type: e.target.value as RouteType }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="recurring">เส้นทางประจำ</option>
                <option value="one_time">เส้นทางเสริม</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                จุดต้นทาง (ละติจูด, ลองจิจูด)
              </label>
              <input
                type="text"
                value={formData.origin_coordinates}
                onChange={(e) => setFormData(prev => ({ ...prev, origin_coordinates: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="เช่น 13.736717, 100.523186"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                จุดปลายทาง (ละติจูด, ลองจิจูด)
              </label>
              <input
                type="text"
                value={formData.destination_coordinates}
                onChange={(e) => setFormData(prev => ({ ...prev, destination_coordinates: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="เช่น 13.361389, 101.003611"
              />
            </div>
          </div>
        </div>

        {/* Schedule Information */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">ตารางเวลา</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เวลาเตรียมพร้อม *
              </label>
              <input
                type="time"
                value={formData.standby_time}
                onChange={(e) => setFormData(prev => ({ ...prev, standby_time: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เวลาออกเดินทาง *
              </label>
              <input
                type="time"
                value={formData.departure_time}
                onChange={(e) => setFormData(prev => ({ ...prev, departure_time: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                วันที่เริ่ม *
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                วันที่สิ้นสุด {formData.route_type === 'recurring' && '(เส้นทางประจำ)'}
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={formData.route_type === 'one_time'}
              />
            </div>
          </div>

          {formData.route_type === 'recurring' && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                วันที่วิ่ง (เส้นทางประจำ)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {daysOfWeek.map((day) => (
                  <label key={day.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.days_of_week.includes(day.value as DayOfWeek)}
                      onChange={() => handleDayToggle(day.value as DayOfWeek)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Assignment Information */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">การมอบหมายงาน</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                คนขับ
              </label>
              <select
                value={formData.driver_id}
                onChange={(e) => setFormData(prev => ({ ...prev, driver_id: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- เลือกคนขับ --</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ยานพาหนะ
              </label>
              <select
                value={formData.vehicle_id}
                onChange={(e) => setFormData(prev => ({ ...prev, vehicle_id: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- เลือกยานพาหนะ --</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.registration_number}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                สถานะ
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as RouteStatus }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">ใช้งาน</option>
                <option value="inactive">ไม่ใช้งาน</option>
                <option value="completed">เสร็จสิ้น</option>
                <option value="cancelled">ยกเลิก</option>
              </select>
            </div>
            
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                หมายเหตุ
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="หมายเหตุเพิ่มเติม..."
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            บันทึก
          </button>
        </div>
      </form>
    </div>
  );
}