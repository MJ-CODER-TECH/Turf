import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoutes/ProtectedRoute';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import Turfs from './pages/Turfs';
import Users from './pages/Users';
import Payments from './pages/Payments';
import Slots from './pages/Slots';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import AddTurf from './pages/AddTurf';

const pageConfig = {
  dashboard:  { title: 'Dashboard',  subtitle: 'Welcome back, Admin!' },
  bookings:   { title: 'Bookings',   subtitle: 'Manage all turf bookings' },
  turfs:      { title: 'Turfs',      subtitle: 'Manage turf listings' },
  users:      { title: 'Users',      subtitle: 'Manage registered users' },
  payments:   { title: 'Payments',   subtitle: 'Track revenue & transactions' },
  slots:      { title: 'Time Slots', subtitle: 'Manage slot availability' },
  reports:    { title: 'Reports',    subtitle: 'Analytics & insights' },
  settings:   { title: 'Settings',   subtitle: 'Platform configuration' },
  profile:    { title: 'Profile',    subtitle: 'Manage your profile' },
  'add-turf': { title: 'Add Turf',   subtitle: 'Register a new turf' },
  'edit-turf':{ title: 'Edit Turf',  subtitle: 'Update turf details' },
};

const pageComponents = {
  dashboard:   Dashboard,
  bookings:    Bookings,
  turfs:       Turfs,
  users:       Users,
  payments:    Payments,
  slots:       Slots,
  reports:     Reports,
  settings:    Settings,
  profile:     Profile,
  'add-turf':  AddTurf,
  'edit-turf': AddTurf,
};

function AdminLayout() {
  const [activePage, setActivePage] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [pageData, setPageData] = useState(null);   // ← edit data ke liye

  // ← yeh navigate function sabko pass hoga
  const navigate = (page, data = null) => {
    setActivePage(page);
    setPageData(data);
  };

  const page = pageConfig[activePage] || pageConfig.dashboard;
  const PageComponent = pageComponents[activePage] || Dashboard;

  return (
    <div className="min-h-screen bg-dark-300 flex">
      <Sidebar
        active={activePage}
        onNavigate={navigate}       // ← navigate function
        collapsed={collapsed}
      />
      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-300"
        style={{ marginLeft: collapsed ? '80px' : '256px' }}
      >
        <Topbar
          title={page.title}
          subtitle={page.subtitle}
          onToggleSidebar={() => setCollapsed(prev => !prev)}
        />
        <main className="flex-1 p-6 overflow-auto">
          {/* ← onNavigate aur editData dono pass ho rahe hain */}
          <PageComponent onNavigate={navigate} editData={pageData} />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}