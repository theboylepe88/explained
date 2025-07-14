import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { AuthForm } from './components/AuthForm';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { RouteManagement } from './components/RouteManagement';
import { DriversManagement } from './components/DriversManagement';
import { VehiclesManagement } from './components/VehiclesManagement';
import { VehicleTypesManagement } from './components/VehicleTypesManagement';

function App() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'routes':
        return <RouteManagement />;
      case 'drivers':
        return <DriversManagement />;
      case 'vehicles':
        return <VehiclesManagement />;
      case 'vehicle-types':
        return <VehicleTypesManagement />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {renderContent()}
    </Layout>
  );
}

export default App;