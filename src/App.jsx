import React, { useState, useEffect } from 'react';
  import LoginPage from './LoginPage';
  import AdminDashboard from './AdminDashboard';
  import DoctorDashboard from './DoctorDashboard';
  import './App.css';

  function App() {
    const [currentPage, setCurrentPage] = useState('login');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState('admin');

    useEffect(() => {
      // Check authentication status on app load
      const authStatus = localStorage.getItem('isAuthenticated');
      const role = localStorage.getItem('userRole') || 'admin';
      if (authStatus === 'true') {
        setIsAuthenticated(true);
        setUserRole(role);
        setCurrentPage('dashboard');
      }

      // Listen for URL changes (simple routing)
      const handlePopState = () => {
        const path = window.location.pathname;
        if (path === '/dashboard' && authStatus === 'true') {
          setCurrentPage('dashboard');
        } else {
          setCurrentPage('login');
        }
      };

      window.addEventListener('popstate', handlePopState);

      // Set initial route based on current URL
      const currentPath = window.location.pathname;
      if (currentPath === '/dashboard' && authStatus === 'true') {
        setCurrentPage('dashboard');
      }

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }, []);

    // Handle successful login
    const handleLoginSuccess = () => {
      setIsAuthenticated(true);
      const role = localStorage.getItem('userRole') || 'admin'; // Sync userRole
      setUserRole(role);
      setCurrentPage('dashboard');
      window.history.pushState({}, '', '/dashboard');
    };

    // Handle logout
    const handleLogout = () => {
      setIsAuthenticated(false);
      setCurrentPage('login');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
      window.history.pushState({}, '', '/');
    };

    const renderDashboard = () => {
      if (userRole === 'admin') {
        return <AdminDashboard onLogout={handleLogout} />;
      } else {
        return <DoctorDashboard onLogout={handleLogout} />;
      }
    };

    return (
      <div className="App">
        {currentPage === 'login' ? (
          <LoginPage onLoginSuccess={handleLoginSuccess} />
        ) : (
          renderDashboard()
        )}
      </div>
    );
  }

  export default App;