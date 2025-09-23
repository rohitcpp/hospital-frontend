import React, { useState, useEffect } from 'react';
import './Management.css';

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
    status: 'active'
  });
  const [errors, setErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  // Only call loadDoctors/loadDepartments once on mount
  useEffect(() => {
    loadDoctors();
    loadDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load all doctors from backend
  // ...existing code...

const loadDoctors = async () => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:5000/api/doctors', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    const doctorsRaw = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
    const doctors = doctorsRaw.map(doc => ({
      id: doc._id,
      name: doc.name,
      email: doc.email,
      phone: doc.phno, 
      specialization: doc.spec, 
      departmentId: doc.dept, 
      experience: doc.exp, 
      qualification: doc.qual, 
      status: (doc.status || '').toLowerCase(), 
    }));
    setDoctors(doctors);
  } catch (err) {
    console.error('Error fetching doctors:', err);
    setDoctors([]);
  }
};


  const loadDepartments = async () => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:5000/api/departments', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    setDepartments(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
  } catch (err) {
    console.error('Error fetching departments:', err);
    setDepartments([]);
  }
};

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email address';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) newErrors.phone = 'Please enter a valid phone number';
    if (!formData.specialization.trim()) newErrors.specialization = 'Specialization is required';
    if (!formData.departmentId) newErrors.departmentId = 'Department is required';
    if (!formData.experience.trim()) newErrors.experience = 'Experience is required';
    if (!formData.qualification.trim()) newErrors.qualification = 'Qualification is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

 

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  const selectedDept = departments.find(
    dept => String(dept._id || dept.id) === String(formData.departmentId)
  );

  const doctorData = {
  name: formData.name,
  email: formData.email,
  phno: formData.phone.replace(/\D/g, '').slice(-10), 
  spec: formData.specialization,
  dept: selectedDept ? selectedDept._id : '', 
  exp: formData.experience,
  qual: formData.qualification,
  status: formData.status === 'active' ? 'Active' : 'Inactive', 
};


  console.log("Submitting doctor:", doctorData);

  const token = localStorage.getItem('token');

  try {
    let res;
    if (editingDoctor) {
      res = await fetch(`http://localhost:5000/api/doctors/${editingDoctor.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(doctorData),
      });
      if (!res.ok) throw new Error(`Failed to update doctor, status: ${res.status}`);
    } else {
      res = await fetch('http://localhost:5000/api/doctors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(doctorData),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to add doctor, status: ${res.status}, response: ${errorText}`);
      }
    }

    await loadDoctors();
    resetForm();
    if (onDataChange) onDataChange();
  } catch (error) {
    console.error('Error saving doctor:', error);
  }
};

  const handleEdit = (doctor) => {
    setEditingDoctor(doctor);
    setFormData({
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      specialization: doctor.specialization,
      departmentId: doctor.departmentId,
      experience: doctor.experience,
      qualification: doctor.qualification,
      status: doctor.status
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem('token');
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      try {
        const res = await fetch(`http://localhost:5000/api/doctors/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
          },
        });
        if (!res.ok) throw new Error(`Failed to delete doctor, status: ${res.status}`);
        await loadDoctors();
        if (onDataChange) onDataChange(); 
      } catch (err) {
        console.error('Error deleting doctor:', err);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      specialization: '',
      departmentId: '',
      experience: '',
      qualification: '',
      status: 'active'
    });
    setEditingDoctor(null);
    setShowForm(false);
    setErrors({});
  };



const getDepartmentName = (departmentId) => {
  if (!departmentId) return 'Unknown';
  if (!Array.isArray(departments)) return 'Unknown';

  const department = departments.find(
    dept => String(dept._id || dept.id) === String(departmentId)
  );

  return department ? (department.dept || department.name || 'Unknown') : 'Unknown';
};



const filteredDoctors = doctors.filter(doctor =>
  (doctor.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
  (doctor.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
  (doctor.specialization || '').toLowerCase().includes(searchTerm.toLowerCase())
);

  return (
    <div className="management-container">
      <div className="management-header">
        <h2>Doctor Management</h2>
        <button className="add-button" onClick={() => setShowForm(true)}>
          <span className="btn-icon">➕</span>
          Add New Doctor
        </button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search doctors by name, email, or specialization..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {showForm && (
        <div className="form-modal">
          <div className="form-container">
            <div className="form-header">
              <h3>{editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}</h3>
              <button className="close-button" onClick={resetForm}>✕</button>
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
                    {departments && Array.isArray(departments) && departments.map(dept => (
                      <option key={dept._id || dept.id} value={dept._id || dept.id}>
                      {dept.dept || dept.name}
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
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="cancel-button">Cancel</button>
                <button type="submit" className="submit-button">{editingDoctor ? 'Update Doctor' : 'Add Doctor'}</button>
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
            {filteredDoctors.map(doctor => (
              <tr key={doctor._id || doctor.id}>
                <td>{doctor.name || '-'}</td>
                <td>{doctor.email || '-'}</td>
                <td>{doctor.phone || '-'}</td>
                <td>{doctor.specialization || '-'}</td>
                <td>{getDepartmentName(doctor.departmentId)}</td>
                <td>{doctor.experience || '-'}</td>
                <td>
                  <span className={`status-badge ${doctor.status}`}>{doctor.status || '-'}</span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="edit-button" onClick={() => handleEdit(doctor)}>✏️</button>
                    <button className="delete-button" onClick={() => handleDelete(doctor._id || doctor.id)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredDoctors.length === 0 && (
          <div className="no-data">
            <p>No doctors found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorManagement;