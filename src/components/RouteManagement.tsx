import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, MapPin, Calendar, Clock } from 'lucide-react';
import { supabase, Route, RouteSchedule, Driver, Vehicle } from '../lib/supabase';
import { RouteForm } from './RouteForm';

export function RouteManagement() {
  const [routes, setRoutes] = useState<RouteSchedule[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RouteSchedule | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch route schedules with related data
      const { data: schedules, error: schedulesError } = await supabase
        .from('route_schedules')
        .select(`
          *,
          route:routes(*),
          driver:drivers(*),
          vehicle:vehicles(*)
        `)
        .order('created_at', { ascending: false });

      if (schedulesError) {
        console.error('Error fetching schedules:', schedulesError);
        return;
      }

      // Fetch drivers and vehicles for forms
      const [driversResult, vehiclesResult] = await Promise.all([
        supabase.from('drivers').select('*').eq('is_active', true),
        supabase.from('vehicles').select('*').eq('is_active', true)
      ]);

      setRoutes(schedules || []);
      setDrivers(driversResult.data || []);
      setVehicles(vehiclesResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (route: RouteSchedule) => {
    setEditingRoute(route);
    setShowForm(true);
  };

  const handleDelete = async (routeId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบเส้นทางนี้?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('route_schedules')
        .delete()
        .eq('id', routeId);

      if (error) {
        console.error('Error deleting route:', error);
        alert('เกิดข้อผิดพลาดในการลบเส้นทาง');
        return;
      }

      fetchData();
    } catch (error) {
      console.error('Error deleting route:', error);
      alert('เกิดข้อผิดพลาดในการลบเส้นทาง');
    }
  };

  const filteredRoutes = routes.filter(schedule => {
    const route = schedule.route;
    if (!route) return false;

    const matchesSearch = 
      route.route_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.route_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRegion = filterRegion === '' || route.region === filterRegion;
    
    return matchesSearch && matchesRegion;
  });

  const getDayOfWeekText = (days: string[]) => {
    const dayMap = {
      'monday': 'จ',
      'tuesday': 'อ',
      'wednesday': 'พ',
      'thursday': 'พฤ',
      'friday': 'ศ',
      'saturday': 'ส',
      'sunday': 'อา'
    };
    
    return days.map(day => dayMap[day as keyof typeof dayMap]).join(', ');
  };

  const getRouteTypeText = (type: string) => {
    return type === 'recurring' ? 'เส้นทางประจำ' : 'เส้นทางเสริม';
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      active: 'bg-green-100 text-green-800 border-green-200',
      inactive: 'bg-gray-100 text-gray-800 border-gray-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };

    const statusLabels = {
      active: 'ใช้งาน',
      inactive: 'ไม่ใช้งาน',
      completed: 'เสร็จสิ้น',
      cancelled: 'ยกเลิก'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        statusStyles[status as keyof typeof statusStyles] || statusStyles.inactive
      }`}>
        {statusLabels[status as keyof typeof statusLabels] || status}
      </span>
    );
  };

  if (showForm) {
    return (
      <RouteForm
        route={editingRoute}
        drivers={drivers}
        vehicles={vehicles}
        onSave={() => {
          setShowForm(false);
          setEditingRoute(null);
          fetchData();
        }}
        onCancel={() => {
          setShowForm(false);
          setEditingRoute(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">จัดการเส้นทาง</h1>
            <p className="text-gray-600 mt-1">จัดการเส้นทางประจำและเส้นทางเสริม</p>
          </div>
          
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            เพิ่มเส้นทางใหม่
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="ค้นหารหัสเส้นทางหรือชื่อเส้นทาง..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="lg:w-48">
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">ทุกภูมิภาค</option>
              <option value="กลาง">กลาง</option>
              <option value="เหนือ">เหนือ</option>
              <option value="ใต้">ใต้</option>
              <option value="ออก">ออก</option>
              <option value="ตก">ตก</option>
            </select>
          </div>
        </div>
      </div>

      {/* Routes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredRoutes.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">ไม่พบเส้นทางที่ค้นหา</p>
          </div>
        ) : (
          filteredRoutes.map((schedule) => {
            const route = schedule.route;
            if (!route) return null;

            return (
              <div key={schedule.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg mb-1">
                        {route.route_code}
                      </h3>
                      <p className="text-gray-600 mb-2">{route.route_name}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${
                          route.region === 'กลาง' ? 'bg-blue-500' :
                          route.region === 'เหนือ' ? 'bg-green-500' :
                          route.region === 'ใต้' ? 'bg-orange-500' :
                          route.region === 'ออก' ? 'bg-purple-500' :
                          'bg-red-500'
                        }`}></div>
                        <span className="text-sm text-gray-600">{route.region}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(schedule)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(schedule.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>เตรียม: {schedule.standby_time}</span>
                      <span className="text-gray-400">•</span>
                      <span>ออก: {schedule.departure_time}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>
                        {schedule.start_date}
                        {schedule.end_date && ` - ${schedule.end_date}`}
                      </span>
                    </div>

                    {schedule.route_type === 'recurring' && schedule.days_of_week.length > 0 && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">วันที่วิ่ง:</span> {getDayOfWeekText(schedule.days_of_week)}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {schedule.driver?.name || 'ไม่ระบุคนขับ'}
                        </div>
                        <div className="text-gray-500 font-mono">
                          {schedule.vehicle?.registration_number || 'ไม่ระบุทะเบียน'}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(schedule.status)}
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                          {getRouteTypeText(schedule.route_type)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}