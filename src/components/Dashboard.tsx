import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Truck, Users, MapPin, Clock, AlertCircle } from 'lucide-react';
import { format, addDays, subDays, startOfDay } from 'date-fns';
import { th } from 'date-fns/locale';
import { supabase, DailyRoute } from '../lib/supabase';

export function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailyRoutes, setDailyRoutes] = useState<DailyRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRoutes: 0,
    activeRoutes: 0,
    completedRoutes: 0,
    pendingRoutes: 0
  });

  useEffect(() => {
    fetchDailyRoutes();
  }, [selectedDate]);

  const fetchDailyRoutes = async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { data, error } = await supabase
        .rpc('get_routes_for_date', { target_date: dateStr });

      if (error) {
        console.error('Error fetching daily routes:', error);
        return;
      }

      setDailyRoutes(data || []);
      
      // Calculate stats
      const total = data?.length || 0;
      const active = data?.filter(r => r.status === 'active').length || 0;
      const completed = data?.filter(r => r.status === 'completed').length || 0;
      const pending = total - active - completed;

      setStats({
        totalRoutes: total,
        activeRoutes: active,
        completedRoutes: completed,
        pendingRoutes: pending
      });
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedDate(subDays(selectedDate, 1));
    } else {
      setSelectedDate(addDays(selectedDate, 1));
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      active: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      inactive: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    const statusLabels = {
      active: 'ใช้งาน',
      completed: 'เสร็จสิ้น',
      cancelled: 'ยกเลิก',
      inactive: 'ไม่ใช้งาน'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        statusStyles[status as keyof typeof statusStyles] || statusStyles.inactive
      }`}>
        {statusLabels[status as keyof typeof statusLabels] || status}
      </span>
    );
  };

  const getRegionColor = (region: string) => {
    const regionColors = {
      'กลาง': 'bg-blue-500',
      'เหนือ': 'bg-green-500',
      'ใต้': 'bg-orange-500',
      'ออก': 'bg-purple-500',
      'ตก': 'bg-red-500'
    };
    return regionColors[region as keyof typeof regionColors] || 'bg-gray-500';
  };

  return (
    <div className="space-y-4">
      {/* Date Navigation */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">แดชบอร์ดเส้นทาง</h1>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              ←
            </button>
            
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">
                {format(selectedDate, 'EEEE ที่ d MMMM yyyy', { locale: th })}
              </span>
            </div>
            
            <button
              onClick={() => navigateDate('next')}
              className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              →
            </button>
            
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              วันนี้
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">เส้นทางทั้งหมด</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalRoutes}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">เส้นทางใช้งาน</p>
              <p className="text-3xl font-bold text-green-600">{stats.activeRoutes}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">เสร็จสิ้นแล้ว</p>
              <p className="text-3xl font-bold text-blue-600">{stats.completedRoutes}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">รอดำเนินการ</p>
              <p className="text-3xl font-bold text-orange-600">{stats.pendingRoutes}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Routes Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">เส้นทางประจำวัน</h2>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : dailyRoutes.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">ไม่มีเส้นทางในวันที่เลือก</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    รหัส/ชื่อเส้นทาง
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ภูมิภาค
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    เวลา
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    คนขับ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ทะเบียน
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dailyRoutes.map((route) => (
                  <tr key={route.schedule_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{route.route_code}</div>
                        <div className="text-sm text-gray-500">{route.route_name}</div>
                        {route.is_override && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                            แก้ไขเฉพาะวัน
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getRegionColor(route.region)}`}></div>
                        <span className="text-sm text-gray-900">{route.region}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center gap-1 mb-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>เตรียม: {route.standby_time}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-4 h-4 text-center text-gray-400">↗</span>
                          <span>ออก: {route.departure_time}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {route.driver_name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-mono">
                        {route.vehicle_registration || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(route.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}