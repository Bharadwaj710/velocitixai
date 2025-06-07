import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminDashboard from './pages/admin/Dashboard';

const AppContent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin-');
  
  return (
    <>
      {!isAdminRoute && <Navbar />}
      <main className={isAdminRoute ? 'w-full' : 'pt-16 w-full'}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
        </Routes>
      </main>
    </>
  );
};

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Router>
        <AppContent />
      </Router>
    </div>
  );
}

export default App;
