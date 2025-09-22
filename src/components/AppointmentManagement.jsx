import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Management.css';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
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
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Function to get the JWT token from localStorage
  const getAuthToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token found in localStorage at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    }
    return token;
  };

  // Create axios instance with base URL and headers
  const axiosInstance = axios.create({
    baseURL: '/api',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add request interceptor to include Authorization header
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log('Request to', config.url, 'at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), 'with token:', !!token);
      return config;
    },
    (error) => {
      console.error('Request error for', error.config?.url, 'at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), error);
      return Promise.reject(error);
    }
  );

  // Add response interceptor to handle errors
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
    }
  };

  const loadDoctors = async () => {
    try {
      const response = await axiosInstance.get('/doctors');
      console.log('Doctors response at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), ':', response.data);
      const doctorsData = Array.isArray(response.data) ? response.data : Array.isArray(response.data.data) ? response.data.data : [];
      if (doctorsData.length === 0) {
        console.warn('No doctors found in response at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
      } else if (!Array.isArray(doctorsData)) {
        console.error('Invalid doctors data structure at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), ':', doctorsData);
      }
      setDoctors(doctorsData);
      setApiError(null);
    } catch (error) {
      console.error('Error fetching doctors at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), ':', error.response?.data || error);
      setApiError('Failed to load doctors. Check server connection or authentication.');
    }
  };

  const loadDoctorsFiltered = async (departmentId) => {
    if (!departmentId) {
      loadDoctors();
      return;
    }
    try {
      const response = await axiosInstance.get('/doctors', {
        params: { departmentId },
      });
      console.log('Filtered doctors response at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), 'for departmentId', departmentId, ':', response.data);
      const doctorsData = Array.isArray(response.data) ? response.data : Array.isArray(response.data.data) ? response.data.data : [];
      console.log('Parsed filtered doctors data:', doctorsData); // Debug the parsed data
      if (doctorsData.length === 0) {
        console.warn('No doctors found for department', departmentId, 'at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
        setDoctors((prevDoctors) => (prevDoctors.length > 0 ? prevDoctors : doctorsData));
      } else if (!Array.isArray(doctorsData)) {
        console.error('Invalid filtered doctors data structure at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), ':', doctorsData);
      } else {
        setDoctors(doctorsData);
      }
      setApiError(null);
    } catch (error) {
      console.error('Error fetching filtered doctors at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), 'for departmentId', departmentId, ':', error.response?.data || error);
      setApiError(`Failed to load doctors for department ${departmentId}. Check server or authentication.`);
      setDoctors((prevDoctors) => (prevDoctors.length > 0 ? prevDoctors : []));
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await axiosInstance.get('/departments');
      console.log('Departments response at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), ':', response.data);
      const departmentsData = response.data?.data || [];
      if (Array.isArray(departmentsData)) {
        setDepartments(departmentsData);
        if (departmentsData.length === 0) {
          setApiError('No departments found. Please add departments or contact support.');
        } else {
          setApiError(null);
        }
      } else {
        setApiError('Invalid departments data received from server.');
        setDepartments([]);
        console.error('Invalid departments data structure:', departmentsData);
      }
    } catch (error) {
      console.error('Error fetching departments at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), ':', error.response?.data || error);
      setApiError('Failed to load departments. Check server connection or authentication.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
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
      loadDoctorsFiltered(value);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.patient) {
      newErrors.patient = 'Patient is required';
    }

    if (!formData.doctor) {
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
        doctor: formData.doctor,
        dept: formData.dept,
        date: formData.date,
        time: formData.time,
        status: formData.status,
        rsv: formData.rsv,
        notes: formData.notes,
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

    setEditingAppointment(appointment);
    setFormData({
      patient: appointment.patient._id.toString(),
      doctor: appointment.doctor._id.toString(),
      dept: appointment.dept._id.toString(),
      date: new Date(appointment.date).toISOString().split('T')[0],
      time: appointment.time,
      status: appointment.status,
      rsv: appointment.rsv,
      notes: appointment.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!isAuthenticated) {
      setApiError('Please log in to delete appointments.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        await axiosInstance.delete(`/appointments/${id}`);
        loadAppointments();
        setApiError(null);
      } catch (error) {
        console.error('Error deleting appointment at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), ':', error.response?.data || error);
        setApiError(error.response?.data.message || 'Failed to delete appointment.');
      }
    }
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
  };

  const getPatientName = (patientId) => {
    const patient = Array.isArray(patients) ? patients.find((p) => p._id === patientId) : null;
    return patient ? patient.name : 'Unknown';
  };

  const getDoctorName = (doctorId) => {
    const doctor = Array.isArray(doctors) ? doctors.find((d) => d._id === doctorId) : null;
    return doctor ? doctor.name : 'Unknown';
  };

  const getDepartmentName = (departmentId) => {
    const department = Array.isArray(departments) ? departments.find((dept) => dept._id === departmentId) : null;
    return department ? department.dept : 'Unknown'; // Use 'dept' field as per schema
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const patientName = getPatientName(appointment.patient._id).toLowerCase();
    const doctorName = getDoctorName(appointment.doctor._id).toLowerCase();
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
                            patients.map((patient) => (
                              <option key={patient._id} value={patient._id}>
                                {patient.name} - {patient.email}
                              </option>
                            ))
                          ) : (
                            <option value="" disabled>
                              No patients available
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
                        <label>Doctor *</label>
                        <select
                          name="doctor"
                          value={formData.doctor}
                          onChange={handleInputChange}
                          className={errors.doctor ? 'error' : ''}
                        >
                          <option value="">Select Doctor</option>
                          {Array.isArray(doctors) && doctors.length > 0 ? (
                            doctors
                              .filter((doctor) => !formData.dept || (doctor.dept && doctor.dept.toString() === formData.dept.toString())) // Changed to 'dept'
                              .map((doctor) => (
                                <option key={doctor._id} value={doctor._id}>
                                  {doctor.name || 'Unnamed Doctor'} - {doctor.spec || doctor.specialty || 'N/A'} // Changed to 'spec'
                                </option>
                              ))
                          ) : (
                            <option value="" disabled>
                              No doctors available for selected department
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
                      <label>Notes</label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder="Additional notes or symptoms..."
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
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(filteredAppointments) && filteredAppointments.length > 0 ? (
                    filteredAppointments.map((appointment) => (
                      <tr key={appointment._id}>
                        <td>{getPatientName(appointment.patient._id)}</td>
                        <td>{getDoctorName(appointment.doctor._id)}</td>
                        <td>{getDepartmentName(appointment.dept._id)}</td>
                        <td>{new Date(appointment.date).toISOString().split('T')[0]}</td>
                        <td>{appointment.time}</td>
                        <td>{appointment.rsv}</td>
                        <td>
                          <span className={`status-badge ${appointment.status.toLowerCase()}`}>
                            {appointment.status}
                          </span>
                        </td>
                        <td>
                          {isAuthenticated && (
                            <div className="action-buttons">
                              <button
                                className="edit-button"
                                onClick={() => handleEdit(appointment)}
                              >
                                ✏️
                              </button>
                              <button
                                className="delete-button"
                                onClick={() => handleDelete(appointment._id)}
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8">No appointments available</td>
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