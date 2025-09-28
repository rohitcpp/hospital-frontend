import React, { useState, useEffect } from 'react';
import axios from 'axios';
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

const DoctorManagement = ({ onDataChange }) => {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    departmentId: '',
    experience: '',
    qualification: '',
    status: 'Active',
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const getAuthToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token found in localStorage at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
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
      console.log('Request to', config.url, 'at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), 'with token:', !!token, 'Payload:', config.data);
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
          setIsAdmin(false);
          localStorage.removeItem('token');
          console.error('401 Error on', url, 'at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), ':', error.response.data);
        } else if (error.response.status === 403) {
          setApiError('Forbidden: Only admins can perform this action.');
          setIsAdmin(false);
          console.error('403 Error on', url, 'at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), ':', error.response.data);
        } else if (error.response.status === 400) {
          const errorMessage = error.response.data.message || 'Bad request. Please check the form data.';
          setApiError(`Invalid request: ${errorMessage}`);
          console.error('400 Error on', url, 'at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), ':', error.response.data, 'Payload sent:', error.config.data);
        } else if (error.response.status === 500) {
          setApiError(`Server error: ${error.response.data.message || 'Internal server error.'}`);
          console.error('500 Error on', url, 'at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), ':', error.response.data);
        } else {
          setApiError(`Error: ${error.response.data.message || 'Unexpected error.'}`);
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
      Promise.all([loadDoctors(), loadDepartments()])
        .then(() => {
          console.log('All data loaded successfully at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
          setIsAdmin(true);
        })
        .catch((error) => {
          console.error('Error loading data at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), ':', error);
          if (error.response?.status === 403) {
            setIsAdmin(false);
          }
        })
        .finally(() => setIsLoading(false));
    } else {
      setApiError('Please log in to manage doctors.');
      setIsLoading(false);
      setIsAdmin(false);
    }
  }, [isAuthenticated]);

  const loadDoctors = async () => {
    try {
      const response = await axiosInstance.get('/users/doctors');
      console.log('Doctors response at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), ':', response.data);
      const doctorsRaw = Array.isArray(response.data) ? response.data : Array.isArray(response.data.data) ? response.data.data : [];
      const doctors = doctorsRaw.map((doc) => ({
        id: doc._id,
        name: doc.name,
        email: doc.email,
        phone: doc.phno,
        specialization: doc.spec,
        departmentId: doc.dept?._id || doc.dept,
        experience: doc.exp,
        qualification: doc.qual,
        status: (doc.status || 'Active').toLowerCase(),
      }));
      setDoctors(doctors);
      setApiError(null);
    } catch (error) {
      console.error('Error fetching doctors at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), ':', error.response?.data || error);
      setApiError('Failed to load doctors. Check server connection or authentication.');
      setDoctors([]);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await axiosInstance.get('/departments');
      console.log('Departments response at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), ':', response.data);
      const departmentsData = Array.isArray(response.data) ? response.data : Array.isArray(response.data.data) ? response.data.data : [];
      setDepartments(departmentsData);
      if (departmentsData.length === 0) {
        setApiError('No departments found. Please add departments or contact support.');
      } else {
        setApiError(null);
      }
    } catch (error) {
      console.error('Error fetching departments at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), ':', error.response?.data || error);
      setApiError('Failed to load departments. Check server connection or authentication.');
      setDepartments([]);
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
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email address';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    else {
      const cleanedPhone = formData.phone.replace(/\D/g, '').slice(-10);
      if (cleanedPhone.length !== 10) newErrors.phone = 'Phone number must be exactly 10 digits';
    }
    if (!formData.specialization.trim()) newErrors.specialization = 'Specialization is required';
    if (!formData.departmentId) newErrors.departmentId = 'Department is required';
    else if (!departments.some((dept) => dept._id === formData.departmentId)) {
      newErrors.departmentId = 'Invalid department selected';
      console.warn('Invalid departmentId selected:', formData.departmentId, 'Available departments:', departments);
    }
    if (!formData.experience.trim()) newErrors.experience = 'Experience is required';
    if (!formData.qualification.trim()) newErrors.qualification = 'Qualification is required';
    if (formData.status && !formData.status.trim()) newErrors.status = 'Status cannot be empty if provided';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setApiError('Please log in to manage doctors.');
      return;
    }

    if (!isAdmin) {
      setApiError('Only admins can create or update doctors.');
      return;
    }

    if (!validateForm()) return;

    
    let doctorData = {};
    if (editingDoctor) {
      if (formData.name.trim() !== editingDoctor.name) doctorData.name = formData.name.trim();
      if (formData.email.trim() !== editingDoctor.email) doctorData.email = formData.email.trim();
      if (formData.phone.replace(/\D/g, '').slice(-10) !== editingDoctor.phone) doctorData.phno = formData.phone.replace(/\D/g, '').slice(-10);
      if (formData.specialization.trim() !== editingDoctor.specialization) doctorData.spec = formData.specialization.trim();
      if (formData.departmentId !== editingDoctor.departmentId) doctorData.dept = formData.departmentId;
      if (formData.experience.trim() !== editingDoctor.experience) doctorData.exp = formData.experience.trim();
      if (formData.qualification.trim() !== editingDoctor.qualification) doctorData.qual = formData.qualification.trim();
      if (formData.status && formData.status.trim() !== editingDoctor.status) doctorData.status = formData.status.trim();
    } else {
  
      doctorData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phno: formData.phone.replace(/\D/g, '').slice(-10),
        spec: formData.specialization.trim(),
        dept: formData.departmentId,
        exp: formData.experience.trim(),
        qual: formData.qualification.trim(),
        role: 'doctor',
        ...(formData.status && { status: formData.status.trim() }),
      };
    }

    console.log('Submitting doctor data:', doctorData);

    try {
      if (editingDoctor) {
        await axiosInstance.put(`/users/doctors/${editingDoctor.id}`, doctorData);
      } else {
        await axiosInstance.post('/users/doctors', doctorData);
      }
      await loadDoctors();
      resetForm();
      if (onDataChange) onDataChange();
      setApiError(null);
    } catch (error) {
      console.error('Error saving doctor at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), ':', error.response?.data || error);
      setApiError(error.response?.data.message || 'Failed to save doctor. Please check the form data.');
    }
  };

  const handleEdit = (doctor) => {
    if (!isAuthenticated) {
      setApiError('Please log in to edit doctors.');
      return;
    }
    if (!isAdmin) {
      setApiError('Only admins can edit doctors.');
      return;
    }
    setEditingDoctor(doctor);
    setFormData({
      name: doctor.name || '',
      email: doctor.email || '',
      phone: doctor.phone || '',
      specialization: doctor.specialization || '',
      departmentId: doctor.departmentId || '',
      experience: doctor.experience || '',
      qualification: doctor.qualification || '',
      status: doctor.status || '',
    });
    setShowForm(true);
  };

  /*const handleDelete = async (id) => {
    if (!isAuthenticated) {
      setApiError('Please log in to delete doctors.');
      return;
    }
    if (!isAdmin) {
      setApiError('Only admins can delete doctors.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      try {
        await axiosInstance.delete(`/users/doctors/${id}`);
        await loadDoctors();
        if (onDataChange) onDataChange();
        setApiError(null);
      } catch (error) {
        console.error('Error deleting doctor at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), ':', error.response?.data || error);
        setApiError(error.response?.data.message || 'Failed to delete doctor.');
      }
    }
  };*/

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      specialization: '',
      departmentId: '',
      experience: '',
      qualification: '',
      status: 'Active',
    });
    setEditingDoctor(null);
    setShowForm(false);
    setErrors({});
    setApiError(null);
  };

  const getDepartmentName = (departmentId) => {
    if (!departmentId) return 'Unknown';
    if (!Array.isArray(departments)) return 'Unknown';
    const department = departments.find((dept) => String(dept._id) === String(departmentId));
    return department ? department.dept : 'Unknown';
  };

  const filteredDoctors = doctors.filter(
    (doctor) =>
      (doctor.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doctor.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doctor.specialization || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ErrorBoundary>
      <div className="management-container">
        {isLoading && <div>Loading data...</div>}
        {!isLoading && (
          <>
            <div className="management-header">
              <h2>Doctor Management</h2>
              {isAuthenticated && isAdmin && (
                <button className="add-button" onClick={() => setShowForm(true)}>
                  <span className="btn-icon">➕</span>
                  Add New Doctor
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
                placeholder="Search doctors by name, email, or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            {showForm && isAuthenticated && isAdmin && (
              <div className="form-modal">
                <div className="form-container">
                  <div className="form-header">
                    <h3>{editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}</h3>
                    <button className="close-button" onClick={resetForm}>
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="doctor-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Full Name *</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className={errors.name ? 'error' : ''}
                        />
                        {errors.name && <span className="error-message">{errors.name}</span>}
                      </div>

                      <div className="form-group">
                        <label>Email *</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={errors.email ? 'error' : ''}
                        />
                        {errors.email && <span className="error-message">{errors.email}</span>}
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Phone Number *</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className={errors.phone ? 'error' : ''}
                        />
                        {errors.phone && <span className="error-message">{errors.phone}</span>}
                      </div>

                      <div className="form-group">
                        <label>Specialization *</label>
                        <input
                          type="text"
                          name="specialization"
                          value={formData.specialization}
                          onChange={handleInputChange}
                          className={errors.specialization ? 'error' : ''}
                        />
                        {errors.specialization && <span className="error-message">{errors.specialization}</span>}
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Department *</label>
                        <select
                          name="departmentId"
                          value={formData.departmentId}
                          onChange={handleInputChange}
                          className={errors.departmentId ? 'error' : ''}
                        >
                          <option value="">Select Department</option>
                          {Array.isArray(departments) && departments.map((dept) => (
                            <option key={dept._id} value={dept._id}>
                              {dept.dept}
                            </option>
                          ))}
                        </select>
                        {errors.departmentId && <span className="error-message">{errors.departmentId}</span>}
                      </div>

                      <div className="form-group">
                        <label>Experience *</label>
                        <input
                          type="text"
                          name="experience"
                          value={formData.experience}
                          onChange={handleInputChange}
                          placeholder="e.g., 5 years"
                          className={errors.experience ? 'error' : ''}
                        />
                        {errors.experience && <span className="error-message">{errors.experience}</span>}
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Qualification *</label>
                        <input
                          type="text"
                          name="qualification"
                          value={formData.qualification}
                          onChange={handleInputChange}
                          placeholder="e.g., MD, MBBS"
                          className={errors.qualification ? 'error' : ''}
                        />
                        {errors.qualification && <span className="error-message">{errors.qualification}</span>}
                      </div>

                      <div className="form-group">
                        <label>Status</label>
                        <select name="status" value={formData.status} onChange={handleInputChange}>
                          <option value="">Select Status</option>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                        {errors.status && <span className="error-message">{errors.status}</span>}
                      </div>
                    </div>

                    <div className="form-actions">
                      <button type="button" onClick={resetForm} className="cancel-button">
                        Cancel
                      </button>
                      <button type="submit" className="submit-button">
                        {editingDoctor ? 'Update Doctor' : 'Add Doctor'}
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
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Specialization</th>
                    <th>Department</th>
                    <th>Experience</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDoctors.length > 0 ? (
                    filteredDoctors.map((doctor) => (
                      <tr key={doctor.id}>
                        <td>{doctor.name || '-'}</td>
                        <td>{doctor.email || '-'}</td>
                        <td>{doctor.phone || '-'}</td>
                        <td>{doctor.specialization || '-'}</td>
                        <td>
                          {getDepartmentName(doctor.departmentId)}
                          {!doctor.departmentId && (
                            <span className="warning-badge" title="Missing department reference">⚠️</span>
                          )}
                        </td>
                        <td>{doctor.experience || '-'}</td>
                        <td>
                          <span className={`status-badge ${doctor.status}`}>
                            {doctor.status || '-'}
                          </span>
                        </td>
                        <td>
                          {isAuthenticated && isAdmin && (
                            <div className="action-buttons">
                              <button className="edit-button" onClick={() => handleEdit(doctor)}>
                                ✏️
                              </button>
                              {/*<button className="delete-button" onClick={() => handleDelete(doctor.id)}>
                                🗑️
                              </button>*/}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8">No doctors found</td>
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

export default DoctorManagement;