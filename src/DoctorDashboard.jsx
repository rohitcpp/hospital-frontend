import React, { useState, useEffect } from 'react';
import dataManager from './dataManager';
import PatientManagement from './components/PatientManagement';
import AppointmentManagement from './components/AppointmentManagement';
import './DoctorDashboard.css';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h3>Something went wrong</h3>
          <p>{this.state.error.message}</p>
          <button onClick={() => this.setState({ hasError: false })}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const DoctorDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userEmail, setUserEmail] = useState('');
  const [statistics, setStatistics] = useState({});
  const [userRole, setUserRole] = useState('');
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [departments, setDepartments] = useState([]); // New state for departments
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    const role = localStorage.getItem('userRole') || 'doctor';
    const token = localStorage.getItem('token');
    setUserEmail(email || '');
    setUserRole(role);
    loadStatistics();
    if (token) {
      fetchPatients(token);
      fetchAppointments(token);
      fetchDepartments(token); // Fetch departments
    } else {
      console.warn('No token found, login may be required');
      setError('No authentication token found. Please log in again.');
    }
    console.log('Initial role:', role, 'Token present:', !!token);
  }, []);

  const fetchPatients = async (token) => {
    setLoading(true);
    setError(null);
    try {
      const currentToken = token || localStorage.getItem('token');
      if (!currentToken) throw new Error('No authentication token found');
      const response = await fetch('http://localhost:5000/api/patients', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`,
        },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      const patientsList = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
      setPatients(patientsList);
      console.log('Fetched patients:', patientsList);
    } catch (error) {
      console.error('Error fetching patients:', error.message);
      setError(`Failed to load patients: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async (token) => {
    setLoading(true);
    setError(null);
    try {
      const currentToken = token || localStorage.getItem('token');
      if (!currentToken) throw new Error('No authentication token found');
      const response = await fetch('http://localhost:5000/api/appointments', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`,
        },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      const appointmentsList = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
      setAppointments(appointmentsList);
      console.log('Fetched appointments:', appointmentsList);
    } catch (error) {
      console.error('Error fetching appointments:', error.message);
      setError(`Failed to load appointments: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async (token) => {
    setLoading(true);
    setError(null);
    try {
      const currentToken = token || localStorage.getItem('token');
      if (!currentToken) throw new Error('No authentication token found');
      const response = await fetch('http://localhost:5000/api/departments', { // Assume this endpoint exists
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`,
        },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      const departmentsList = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
      setDepartments(departmentsList);
      console.log('Fetched departments:', departmentsList);
    } catch (error) {
      console.error('Error fetching departments:', error.message);
      setError(`Failed to load departments: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = () => {
    const stats = dataManager.getStatistics() || {};
    setStatistics(stats);
    console.log('Loaded statistics:', stats);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    setPatients([]);
    setAppointments([]);
    setDepartments([]); // Clear departments on logout
    setError(null);
    setActiveTab('dashboard');
  };

  const handleRetry = () => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchPatients(token);
      fetchAppointments(token);
      fetchDepartments(token); // Retry fetching departments
    } else {
      setError('No authentication token found. Please log in again.');
    }
    loadStatistics();
  };

  const renderContent = () => {
    console.log('Rendering content for activeTab:', activeTab, 'with role:', userRole);
    switch (activeTab) {
      case 'patients':
        return (
          <div className="patients-list">
            <h2>Patient Management</h2>
            {loading && <p>Loading patients...</p>}
            {error && (
              <div>
                <p className="error-message">{error}</p>
                <button onClick={handleRetry} className="retry-button">Retry</button>
              </div>
            )}
            {!loading && !error && (
              <ErrorBoundary>
                <PatientManagement
                  patients={patients}
                  onDataChange={(token) => fetchPatients(token)}
                  token={localStorage.getItem('token')}
                  userRole={userRole}
                />
              </ErrorBoundary>
            )}
          </div>
        );
      case 'appointments':
        return <AppointmentManagement onDataChange={loadStatistics} />;
      default:
        return (
          <div className="dashboard-overview">
            <div className="welcome-section">
              <h2>Welcome to {userRole === 'admin' ? 'Admin' : 'Doctor'} Dashboard</h2>
              <p>Manage your {userRole === 'admin' ? 'system' : 'patients and appointments'} efficiently</p>
            </div>
            
            <div className="stats-grid">
              <div className="stat-card patients">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>{statistics.totalPatients || 0}</h3>
                  <p>Total Patients</p>
                </div>
              </div>
              
              <div className="stat-card appointments">
                <div className="stat-icon">📅</div>
                <div className="stat-info">
                  <h3>{statistics.totalAppointments || 0}</h3>
                  <p>Total Appointments</p>
                </div>
              </div>
              
              <div className="stat-card today">
                <div className="stat-icon">📊</div>
                <div className="stat-info">
                  <h3>{statistics.todayAppointments || 0}</h3>
                  <p>Today's Appointments</p>
                </div>
              </div>
              
              <div className="stat-card active">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <h3>{statistics.activePatients || 0}</h3>
                  <p>Active Patients</p>
                </div>
              </div>
            </div>

            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="action-buttons">
                <button 
                  className="action-btn patients-btn"
                  onClick={() => { console.log('Patients tab clicked'); setActiveTab('patients'); }}
                >
                  <span className="btn-icon">👥</span>
                  Manage Patients
                </button>
                <button 
                  className="action-btn appointments-btn"
                  onClick={() => { console.log('Appointments tab clicked'); setActiveTab('appointments'); }}
                >
                  <span className="btn-icon">📅</span>
                  Manage Appointments
                </button>
              </div>
            </div>

            <div className="recent-appointments">
              <h3>Recent Appointments</h3>
              <div className="appointments-list">
                {appointments
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .slice(0, 5)
                  .map(appointment => {
                    const patient = patients.find(p => p.id === appointment.patientId);
                    const department = departments.find(d => d.id === appointment.departmentId) || { name: 'Unknown Dept' };
                    const appointmentDate = new Date(appointment.date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      timeZone: 'Asia/Kolkata',
                    });
                    const appointmentTime = new Date(`1970-01-01T${appointment.time}Z`).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'Asia/Kolkata',
                    });

                    return (
                      <div key={appointment.id} className="appointment-item">
                        <div className="appointment-info">
                          <div className="patient-name">{patient?.name || 'Unknown Patient'}</div>
                          <div className="appointment-details">
                            {appointmentDate} at {appointmentTime} - {department.name}
                          </div>
                          <div className="appointment-reason">{appointment.reason}</div>
                        </div>
                        <div className={`appointment-status ${appointment.status}`}>
                          {appointment.status}
                        </div>
                      </div>
                    );
                  })}
              </div>
              
              {appointments.length === 0 && (
                <div className="no-appointments">
                  <p>No appointments scheduled</p>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="doctor-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">🏥</div>
            <h1>HealthCare Management System</h1>
            <span className={`role-badge ${userRole === 'admin' ? 'admin' : 'doctor'}`}>
              {userRole === 'admin' ? 'Admin' : 'Doctor'}
            </span>
          </div>
          <div className="user-section">
            <span className="welcome-text">Welcome, {userEmail}</span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-body">
        <nav className="sidebar">
          <ul className="nav-menu">
            <li className={activeTab === 'dashboard' ? 'active' : ''}>
              <button onClick={() => { console.log('Dashboard tab clicked'); setActiveTab('dashboard'); }}>
                <span className="nav-icon">📊</span>
                Dashboard
              </button>
            </li>
            <li className={activeTab === 'patients' ? 'active' : ''}>
              <button onClick={() => { console.log('Patients tab clicked'); setActiveTab('patients'); }}>
                <span className="nav-icon">👥</span>
                Patients
              </button>
            </li>
            <li className={activeTab === 'appointments' ? 'active' : ''}>
              <button onClick={() => { console.log('Appointments tab clicked'); setActiveTab('appointments'); }}>
                <span className="nav-icon">📅</span>
                Appointments
              </button>
            </li>
          </ul>
        </nav>

        <main className="main-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default DoctorDashboard;