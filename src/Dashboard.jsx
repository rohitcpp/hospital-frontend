import React, { useEffect, useState } from 'react';
import './Dashboard.css';

const Dashboard = ({ onLogout }) => {
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    const email = localStorage.getItem('userEmail');
    
    if (!isAuthenticated) {
      window.location.href = '/';
      return;
    }
    
    setUserEmail(email);
  }, []);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">🏥</div>
            <h1>MediCare Portal</h1>
          </div>
          <div className="user-section">
            <span className="welcome-text">Welcome, {userEmail}</span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="welcome-card">
            <h2>Welcome to Your Dashboard</h2>
            <p>You have successfully logged into the MediCare Portal.</p>
          </div>

          <div className="dashboard-grid">
            <div className="dashboard-card">
              <div className="card-icon">👥</div>
              <h3>Patients</h3>
              <p>Manage patient records and information</p>
              <button className="card-button">View Patients</button>
            </div>

            <div className="dashboard-card">
              <div className="card-icon">📅</div>
              <h3>Appointments</h3>
              <p>Schedule and manage appointments</p>
              <button className="card-button">View Schedule</button>
            </div>

            <div className="dashboard-card">
              <div className="card-icon">📊</div>
              <h3>Reports</h3>
              <p>Generate and view medical reports</p>
              <button className="card-button">View Reports</button>
            </div>

            <div className="dashboard-card">
              <div className="card-icon">⚙️</div>
              <h3>Settings</h3>
              <p>Configure system preferences</p>
              <button className="card-button">Open Settings</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
