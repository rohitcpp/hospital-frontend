import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import PatientManagement from './components/PatientManagement'; // Adjust path as needed
import DoctorManagement from './components/DoctorManagement';   // Adjust path as needed
import AppointmentManagement from './components/AppointmentManagement';
import DepartmentManagement from './components/DepartmentManagement';

const AdminDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [departments, setDepartments] = useState([]); 
  const [userEmail, setUserEmail] = useState('');
  const [statistics, setStatistics] = useState({});
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    setUserEmail(email || 'Unknown User');
    loadStatistics();
  }, [activeTab]); // Trigger on tab change to refresh stats

  const loadStatistics = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      // Fetch patients
      const patientsResponse = await fetch('http://localhost:5000/api/patients', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!patientsResponse.ok) throw new Error('HTTP error! status: ' + patientsResponse.status);
      const patientsData = await patientsResponse.json();
      const patientsList = Array.isArray(patientsData) ? patientsData : [];
      setPatients(patientsList);

      // Fetch doctors
      const doctorsResponse = await fetch('http://localhost:5000/api/doctors', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!doctorsResponse.ok) throw new Error('HTTP error! status: ' + doctorsResponse.status);
      const doctorsData = await doctorsResponse.json();
      const doctorsList = Array.isArray(doctorsData) ? doctorsData : [];
      setDoctors(doctorsList);

      // Fetch appointments
      const appointmentsResponse = await fetch('http://localhost:5000/api/appointments', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!appointmentsResponse.ok) throw new Error('HTTP error! status: ' + appointmentsResponse.status);
      const appointmentsData = await appointmentsResponse.json();
      const appointmentsList = Array.isArray(appointmentsData) ? appointmentsData : Array.isArray(appointmentsData.data) ? appointmentsData.data : [];
      setAppointments(appointmentsList);

      // Fetch departments
      const departmentsResponse = await fetch('http://localhost:5000/api/departments', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!departmentsResponse.ok) throw new Error('HTTP error! status: ' + departmentsResponse.status);
      const departmentsData = await departmentsResponse.json();
      const departmentsList = Array.isArray(departmentsData.data) ? departmentsData.data : Array.isArray(departmentsData) ? departmentsData : [];
      setDepartments(departmentsList);

      // Calculate statistics
      const today = new Date().toISOString().split('T')[0]; // Current date: 2025-09-22
      const stats = {
        totalPatients: patientsList.length,
        totalDoctors: doctorsList.length,
        totalAppointments: appointmentsList.length,
        totalDepartments: departmentsList.length,
        todayAppointments: appointmentsList.filter(appointment => new Date(appointment.date).toISOString().split('T')[0] === today).length,
        activeDoctors: doctorsList.filter(doctor => doctor.status === 'Active').length,
      };
      setStatistics(stats);
    } catch (err) {
      console.error('Error loading statistics:', err.message);
      setError(`Failed to load statistics: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch patients (for management tab)
  const fetchPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch('http://localhost:5000/api/patients', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('HTTP error! status: ' + response.status);

      const data = await response.json();
      setPatients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching patients:', err.message);
      setError(`Failed to load patients: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch departments
  const fetchDepartments = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch('http://localhost:5000/api/departments', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('HTTP error! status: ' + response.status);

      const data = await response.json();
      setDepartments(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching departments:', err.message);
      setError(`Failed to load departments: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch doctors
  const fetchDoctors = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch('http://localhost:5000/api/doctors', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('HTTP error! status: ' + response.status);

      const data = await response.json();
      setDoctors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching doctors:', err.message);
      setError(`Failed to load doctors: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch appointments
  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch('http://localhost:5000/api/appointments', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('HTTP error! status: ' + response.status);

      const data = await response.json();
      setAppointments(Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error('Error fetching appointments:', err.message);
      setError(`Failed to load appointments: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (activeTab === 'patients') fetchPatients();
    if (activeTab === 'doctors') fetchDoctors();
    if (activeTab === 'departments') fetchDepartments();
    if (activeTab === 'appointments') fetchAppointments();
    loadStatistics();
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
  };

  const renderContent = () => {
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
              <PatientManagement
                patients={patients}
                onDataChange={fetchPatients}
                token={localStorage.getItem('token')}
              />
            )}
          </div>
        );

      case 'doctors':
        return (
          <div className="doctors-list">
            <h2>Doctor Management</h2>
            {loading && <p>Loading doctors...</p>}
            {error && (
              <div>
                <p className="error-message">{error}</p>
                <button onClick={handleRetry} className="retry-button">Retry</button>
              </div>
            )}
            {!loading && !error && (
              <DoctorManagement
                doctors={doctors}
                onDataChange={fetchDoctors}
                token={localStorage.getItem('token')}
              />
            )}
          </div>
        );

      case 'departments':
        return (
          <div className="departments-list">
            <h2>Department Management</h2>
            {loading && <p>Loading departments...</p>}
            {error && (
              <div>
                <p className="error-message">{error}</p>
                <button onClick={handleRetry} className="retry-button">Retry</button>
              </div>
            )}
            {!loading && !error && (
              <DepartmentManagement
                departments={departments}
                onDataChange={fetchDepartments}
                token={localStorage.getItem('token')}
              />
            )}
          </div>
        );

      case 'appointments':
        return <AppointmentManagement onDataChange={loadStatistics} />;
      case 'departments':
        return <DepartmentManagement onDataChange={loadStatistics} />;

      default:
        return (
          <div className="dashboard-overview">
            <div className="welcome-section">
              <h2>Welcome to Admin Dashboard</h2>
              <p>Manage your healthcare system efficiently</p>
            </div>

            <div className="stats-grid">
              <div className="stat-card patients">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>{statistics.totalPatients || 0}</h3>
                  <p>Total Patients</p>
                </div>
              </div>

              <div className="stat-card doctors">
                <div className="stat-icon">👨‍⚕️</div>
                <div className="stat-info">
                  <h3>{statistics.totalDoctors || 0}</h3>
                  <p>Total Doctors</p>
                </div>
              </div>

              <div className="stat-card appointments">
                <div className="stat-icon">📅</div>
                <div className="stat-info">
                  <h3>{statistics.totalAppointments || 0}</h3>
                  <p>Total Appointments</p>
                </div>
              </div>

              <div className="stat-card departments">
                <div className="stat-icon">🏢</div>
                <div className="stat-info">
                  <h3>{statistics.totalDepartments || 0}</h3>
                  <p>Departments</p>
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
                  <h3>{statistics.activeDoctors || 0}</h3>
                  <p>Active Doctors</p>
                </div>
              </div>
            </div>

            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="action-buttons">
                <button className="action-btn patients-btn" onClick={() => setActiveTab('patients')}>
                  <span className="btn-icon">👥</span> Manage Patients
                </button>
                <button className="action-btn doctors-btn" onClick={() => setActiveTab('doctors')}>
                  <span className="btn-icon">👨‍⚕️</span> Manage Doctors
                </button>
                <button className="action-btn appointments-btn" onClick={() => setActiveTab('appointments')}>
                  <span className="btn-icon">📅</span> Manage Appointments
                </button>
                <button className="action-btn departments-btn" onClick={() => setActiveTab('departments')}>
                  <span className="btn-icon">🏢</span> Manage Departments
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">🏥</div>
            <h1>HealthCare Management System</h1>
            <span className="role-badge admin">Administrator</span>
          </div>
          <div className="user-section">
            <span className="welcome-text">Welcome, {userEmail}</span>
            <button onClick={handleLogout} className="logout-button">Logout</button>
          </div>
        </div>
      </header>

      <div className="dashboard-body">
        <nav className="sidebar">
          <ul className="nav-menu">
            <li className={activeTab === 'dashboard' ? 'active' : ''}>
              <button onClick={() => setActiveTab('dashboard')}><span className="nav-icon">📊</span> Dashboard</button>
            </li>
            <li className={activeTab === 'patients' ? 'active' : ''}>
              <button onClick={() => setActiveTab('patients')}><span className="nav-icon">👥</span> Patients</button>
            </li>
            <li className={activeTab === 'doctors' ? 'active' : ''}>
              <button onClick={() => setActiveTab('doctors')}><span className="nav-icon">👨‍⚕️</span> Doctors</button>
            </li>
            <li className={activeTab === 'appointments' ? 'active' : ''}>
              <button onClick={() => setActiveTab('appointments')}><span className="nav-icon">📅</span> Appointments</button>
            </li>
            <li className={activeTab === 'departments' ? 'active' : ''}>
              <button onClick={() => setActiveTab('departments')}><span className="nav-icon">🏢</span> Departments</button>
            </li>
          </ul>
        </nav>
        <main className="main-content">{renderContent()}</main>
      </div>
    </div>
  );
};

export default AdminDashboard;