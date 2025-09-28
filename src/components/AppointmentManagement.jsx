import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import './Management.css';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-message" style={{ color: 'red', margin: '20px' }}>
          <h3>Something went wrong.</h3>
          <p>{this.state.error?.message || 'An unexpected error occurred.'}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppointmentManagement = ({ onDataChange }) => {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [formData, setFormData] = useState({
    patient: '',
    doctor: '',
    dept: '',
    date: '',
    time: '',
    status: 'Scheduled',
    rsv: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  const getAuthToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token found in localStorage at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
      return null;
    }
    return token;
  };

  const axiosInstance = axios.create({
    baseURL: '/api',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  axiosInstance.interceptors.request.use(
    (config) => {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log('Request to', config.url, 'with params:', config.params, 'at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
      return config;
    },
    (error) => {
      console.error('Request error for', error.config?.url, 'at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), error);
      return Promise.reject(error);
    }
  );

  axiosInstance.interceptors.response.use(
    (response) => {
      console.log('Response from', response.config.url, 'at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), ':', response.data);
      return response;
    },
    (error) => {
      if (error.response) {
        const url = error.config.url;
        if (error.response.status === 401) {
          setApiError('Unauthorized: Please log in to access this feature.');
          setIsAuthenticated(false);
          localStorage.removeItem('token');
          console.error('401 Error on', url, 'at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), ':', error.response.data);
        } else if (error.response.status === 403) {
          setApiError('Forbidden: You do not have permission to perform this action.');
          console.error('403 Error on', url, 'at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), ':', error.response.data);
        } else if (error.response.status === 400) {
          setApiError(`Invalid request on ${url}: ${error.response.data.message || 'Bad request'}.`);
          console.error('400 Error on', url, 'at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), ':', error.response.data);
        } else if (error.response.status === 500) {
          setApiError(`Server error on ${url}: ${error.response.data.message || 'Internal server error'}.`);
          console.error('500 Error on', url, 'at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), ':', error.response.data);
        } else {
          setApiError(`Error on ${url}: ${error.response.data.message || 'Unexpected error'}.`);
          console.error('API Error on', url, 'at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), ':', error.response.data);
        }
      } else {
        setApiError('Network error: Unable to connect to the server.');
        console.error('Network Error on', error.config?.url, 'at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), ':', error.message);
      }
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    if (isAuthenticated) {
      setIsLoading(true);
      const token = getAuthToken();
      if (token) {
        try {
          const decoded = jwtDecode(token);
          console.log('Decoded JWT token:', decoded);
          setUserRole(decoded.role || 'unknown');
          setCurrentUserId(decoded.id || null);
        } catch (error) {
          console.error('Error decoding JWT token at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), ':', error);
          setApiError('Failed to decode authentication token. Defaulting to restricted access.');
          setUserRole('unknown');
          setIsAuthenticated(false);
          localStorage.removeItem('token');
        }
      } else {
        setApiError('No authentication token found. Please log in.');
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      Promise.all([
        loadAppointments(),
        loadPatients(),
        loadDoctors(),
        loadDepartments(),
      ])
        .then(() => console.log('All data loaded successfully at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })))
        .catch((error) => console.error('Error loading data at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), ':', error))
        .finally(() => setIsLoading(false));
    } else {
      setApiError('Please log in to view appointments.');
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const loadAppointments = async () => {
    try {
      const response = await axiosInstance.get('/appointments');
      console.log('Appointments response at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), ':', response.data);
      setAppointments(Array.isArray(response.data) ? response.data : []);
      setApiError(null);
    } catch (error) {
      console.error('Error fetching appointments at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), ':', error.response?.data || error);
      setApiError('Failed to load appointments. Check server connection or authentication.');
    }
  };

  const loadPatients = async () => {
    try {
      const response = await axiosInstance.get('/patients');
      console.log('Patients response at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), ':', response.data);
      setPatients(Array.isArray(response.data) ? response.data : []);
      setApiError(null);
    } catch (error) {
      console.error('Error fetching patients at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), ':', error.response?.data || error);
      setApiError('Failed to load patients. Check server connection or authentication.');
    }
  };

  const loadDoctors = async () => {
    try {
      const response = await axiosInstance.get('/users/doctors');
      console.log('Doctors response at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), ':', response.data);
      const doctorsData = Array.isArray(response.data) ? response.data : Array.isArray(response.data.data) ? response.data.data : [];
      const validDoctors = doctorsData.filter((doctor) => {
        const deptId = doctor.dept?._id || doctor.dept || doctor.department?._id || doctor.department || doctor.deptId;
        if (!deptId) {
          console.warn('Skipping doctor with invalid dept:', doctor);
          return false;
        }
        const isActive = doctor.status?.toLowerCase() === 'active' || doctor.isActive === true || !doctor.status;
        if (!isActive) {
          console.warn('Skipping inactive doctor:', doctor);
          return false;
        }
        if (userRole === 'doctor' && doctor._id !== currentUserId) {
          console.warn('Skipping doctor for non-current user:', doctor, 'Current user ID:', currentUserId);
          return false;
        }
        console.log('Valid doctor:', doctor);
        return true;
      });
      if (validDoctors.length === 0) {
        console.warn('No valid active doctors found at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
        setApiError('No valid active doctors found. Please add active doctors with valid departments in Doctor Management.');
      } else {
        setApiError(null);
      }
      setDoctors(validDoctors);
    } catch (error) {
      console.error('Error fetching doctors at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), ':', error.response?.data || error);
      setApiError('Failed to load doctors. Check server connection or authentication.');
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await axiosInstance.get('/departments');
      console.log('Departments response at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), ':', response.data);
      const departmentsData = Array.isArray(response.data) ? response.data : Array.isArray(response.data.data) ? response.data.data : [];
      if (departmentsData.length === 0) {
        setApiError('No departments found. Please add departments or contact support.');
      } else {
        setApiError(null);
      }
      setDepartments(departmentsData);
    } catch (error) {
      console.error('Error fetching departments at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), ':', error.response?.data || error);
      setApiError('Failed to load departments. Check server connection or authentication.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'notes' && userRole === 'admin') {
      console.warn('Admins cannot edit notes field at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
      return;
    }
    console.log('Input changed:', name, value);
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }

    if (name === 'dept') {
      setFormData((prev) => ({ ...prev, doctor: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.patient) {
      newErrors.patient = 'Patient is required';
    }

    if (!formData.doctor && userRole !== 'admin') {
      newErrors.doctor = 'Doctor is required';
    }

    if (!formData.dept) {
      newErrors.dept = 'Department is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.date = 'Date cannot be in the past';
      }
    }

    if (!formData.time) {
      newErrors.time = 'Time is required';
    }

    if (!formData.rsv.trim()) {
      newErrors.rsv = 'Reason is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setApiError('Please log in to schedule or update appointments.');
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      const appointmentData = {
        patient: formData.patient,
        doctor: formData.doctor || null,
        dept: formData.dept,
        date: formData.date,
        time: formData.time,
        status: formData.status,
        rsv: formData.rsv,
        notes: userRole === 'doctor' ? formData.notes : editingAppointment?.notes || '',
      };

      if (editingAppointment) {
        await axiosInstance.put(`/appointments/${editingAppointment._id}`, appointmentData);
      } else {
        await axiosInstance.post('/appointments', appointmentData);
      }

      loadAppointments();
      resetForm();
      setApiError(null);
    } catch (error) {
      console.error('Error saving appointment at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), ':', error.response?.data || error);
      setApiError(error.response?.data.message || 'Failed to save appointment.');
    }
  };

  const handleEdit = (appointment) => {
    if (!isAuthenticated) {
      setApiError('Please log in to edit appointments.');
      return;
    }

    if (!appointment.patient || !appointment.dept) {
      setApiError('Cannot edit appointment: Missing patient or department data.');
      return;
    }

    setEditingAppointment(appointment);
    setFormData({
      patient: appointment.patient?._id?.toString() || '',
      doctor: appointment.doctor?._id?.toString() || '',
      dept: appointment.dept?._id?.toString() || '',
      date: new Date(appointment.date).toISOString().split('T')[0],
      time: appointment.time,
      status: appointment.status,
      rsv: appointment.rsv,
      notes: appointment.notes || '',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      patient: '',
      doctor: '',
      dept: '',
      date: '',
      time: '',
      status: 'Scheduled',
      rsv: '',
      notes: '',
    });
    setEditingAppointment(null);
    setShowForm(false);
    setErrors({});
    setApiError(null);
    if (userRole === 'admin') {
      loadDoctors();
    }
  };

  const getPatientName = (patient) => {
    if (!patient || !patient._id) return 'Unknown Patient';
    const patientRecord = Array.isArray(patients) ? patients.find((p) => p._id === patient._id) : null;
    return patientRecord ? patientRecord.name : 'Unknown Patient';
  };

  const getDoctorName = (doctor) => {
    if (!doctor || !doctor._id) return 'Unknown Doctor';
    const doctorRecord = Array.isArray(doctors) ? doctors.find((d) => d._id === doctor._id) : null;
    return doctorRecord ? doctorRecord.name : 'Unknown Doctor';
  };

  const getDepartmentName = (department) => {
    if (!department || !department._id) return 'Unknown Department';
    const departmentRecord = Array.isArray(departments) ? departments.find((dept) => dept._id === department._id) : null;
    return departmentRecord ? departmentRecord.dept : 'Unknown Department';
  };

  const filteredAppointments = appointments.filter((appointment) => {
    if (userRole === 'doctor' && (!appointment.patient || !appointment.doctor || !appointment.dept)) {
      console.warn('Skipping appointment with missing patient, doctor, or department:', appointment);
      return false;
    }
    if (userRole !== 'doctor' && (!appointment.patient || !appointment.dept)) {
      console.warn('Skipping appointment with missing patient or department:', appointment);
      return false;
    }
    const patientName = getPatientName(appointment.patient).toLowerCase();
    const doctorName = getDoctorName(appointment.doctor).toLowerCase();
    const search = searchTerm.toLowerCase();
    return (
      patientName.includes(search) ||
      doctorName.includes(search) ||
      appointment.rsv.toLowerCase().includes(search)
    );
  });

  return (
    <ErrorBoundary>
      <div className="management-container">
        {isLoading && <div>Loading data...</div>}
        {!isLoading && (
          <>
            <div className="management-header">
              <h2>Appointment Management</h2>
              {isAuthenticated && (
                <button className="add-button" onClick={() => setShowForm(true)}>
                  <span className="btn-icon">➕</span>
                  Schedule Appointment
                </button>
              )}
            </div>

            {apiError && (
              <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>
                {apiError}
                {!isAuthenticated && (
                  <span>
                    {' '}
                    <a href="/login">Log in here</a>.
                  </span>
                )}
              </div>
            )}

            <div className="search-bar">
              <input
                type="text"
                placeholder="Search appointments by patient, doctor, or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            {showForm && isAuthenticated && (
              <div className="form-modal">
                <div className="form-container">
                  <div className="form-header">
                    <h3>{editingAppointment ? 'Edit Appointment' : 'Schedule New Appointment'}</h3>
                    <button className="close-button" onClick={resetForm}>
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="appointment-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Patient *</label>
                        <select
                          name="patient"
                          value={formData.patient}
                          onChange={handleInputChange}
                          className={errors.patient ? 'error' : ''}
                        >
                          <option value="">Select Patient</option>
                          {Array.isArray(patients) && patients.length > 0 ? (
                            patients
                              .filter((patient) => patient.status === 'active')
                              .map((patient) => (
                                <option key={patient._id} value={patient._id}>
                                  {patient.name} - {patient.email}
                                </option>
                              ))
                          ) : (
                            <option value="" disabled>
                              No active patients available
                            </option>
                          )}
                        </select>
                        {errors.patient && <span className="error-message">{errors.patient}</span>}
                      </div>

                      <div className="form-group">
                        <label>Department *</label>
                        <select
                          name="dept"
                          value={formData.dept}
                          onChange={handleInputChange}
                          className={errors.dept ? 'error' : ''}
                        >
                          <option value="">Select Department</option>
                          {Array.isArray(departments) && departments.length > 0 ? (
                            departments.map((dept) => (
                              <option key={dept._id} value={dept._id}>
                                {dept.dept}
                              </option>
                            ))
                          ) : (
                            <option value="" disabled>
                              No departments available
                            </option>
                          )}
                        </select>
                        {errors.dept && <span className="error-message">{errors.dept}</span>}
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Doctor {userRole !== 'admin' ? '*' : ''}</label>
                        <select
                          name="doctor"
                          value={formData.doctor}
                          onChange={handleInputChange}
                          className={errors.doctor ? 'error' : ''}
                          disabled={!formData.dept || doctors.length === 0}
                        >
                          <option value="">Select Doctor</option>
                          {Array.isArray(doctors) && doctors.length > 0 ? (
                            doctors
                              .filter((doctor) => {
                                const deptId = doctor.dept?._id || doctor.dept || doctor.department?._id || doctor.department || doctor.deptId;
                                return !formData.dept || (deptId && deptId.toString() === formData.dept.toString());
                              })
                              .map((doctor) => (
                                <option key={doctor._id} value={doctor._id}>
                                  {doctor.name || 'Unnamed Doctor'} - {doctor.spec || 'N/A'}
                                </option>
                              ))
                          ) : (
                            <option value="" disabled>
                              No active doctors available{formData.dept ? ' for selected department' : ''}
                            </option>
                          )}
                          {Array.isArray(doctors) && doctors.filter((doctor) => {
                            const deptId = doctor.dept?._id || doctor.dept || doctor.department?._id || doctor.department || doctor.deptId;
                            return !formData.dept || (deptId && deptId.toString() === formData.dept.toString());
                          }).length === 0 && formData.dept && (
                            <option value="" disabled>
                              No active doctors available for selected department
                            </option>
                          )}
                        </select>
                        {errors.doctor && <span className="error-message">{errors.doctor}</span>}
                      </div>

                      <div className="form-group">
                        <label>Status</label>
                        <select name="status" value={formData.status} onChange={handleInputChange}>
                          <option value="Scheduled">Scheduled</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Date *</label>
                        <input
                          type="date"
                          name="date"
                          value={formData.date}
                          onChange={handleInputChange}
                          min={new Date().toISOString().split('T')[0]}
                          className={errors.date ? 'error' : ''}
                        />
                        {errors.date && <span className="error-message">{errors.date}</span>}
                      </div>

                      <div className="form-group">
                        <label>Time *</label>
                        <input
                          type="time"
                          name="time"
                          value={formData.time}
                          onChange={handleInputChange}
                          className={errors.time ? 'error' : ''}
                        />
                        {errors.time && <span className="error-message">{errors.time}</span>}
                      </div>
                    </div>

                    <div className="form-group full-width">
                      <label>Reason for Visit *</label>
                      <input
                        type="text"
                        name="rsv"
                        value={formData.rsv}
                        onChange={handleInputChange}
                        placeholder="e.g., Regular checkup, Follow-up consultation"
                        className={errors.rsv ? 'error' : ''}
                      />
                      {errors.rsv && <span className="error-message">{errors.rsv}</span>}
                    </div>

                    <div className="form-group full-width">
                      <label>Notes {userRole === 'admin' ? '(Read-Only)' : ''}</label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder={userRole === 'admin' ? 'Notes are read-only for admins' : 'Additional notes or symptoms...'}
                        disabled={userRole === 'admin'}
                        className={userRole === 'admin' ? 'disabled-textarea' : ''}
                      />
                    </div>

                    <div className="form-actions">
                      <button type="button" onClick={resetForm} className="cancel-button">
                        Cancel
                      </button>
                      <button type="submit" className="submit-button">
                        {editingAppointment ? 'Update Appointment' : 'Schedule Appointment'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Department</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Reason</th>
                    <th>Notes</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(filteredAppointments) && filteredAppointments.length > 0 ? (
                    filteredAppointments.map((appointment) => (
                      <tr key={appointment._id}>
                        <td>{getPatientName(appointment.patient)}</td>
                        <td>
                          {getDoctorName(appointment.doctor)}
                          {userRole === 'admin' && !appointment.doctor && (
                            <span className="warning-badge" title="Missing doctor reference">⚠️</span>
                          )}
                        </td>
                        <td>{getDepartmentName(appointment.dept)}</td>
                        <td>{new Date(appointment.date).toISOString().split('T')[0]}</td>
                        <td>{appointment.time}</td>
                        <td>{appointment.rsv}</td>
                        <td>{appointment.notes || 'No notes'}</td>
                        <td>
                          <span className={`status-badge ${appointment.status.toLowerCase()}`}>
                            {appointment.status}
                          </span>
                        </td>
                        <td>
                          {isAuthenticated && (
                            <div className="action-buttons">
                              <button className="edit-button" onClick={() => handleEdit(appointment)}>
                                ✏️
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9">No appointments available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default AppointmentManagement;