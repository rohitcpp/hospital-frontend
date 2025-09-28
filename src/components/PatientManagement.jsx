import React, { useState, useEffect } from 'react';
import './Management.css';

const PatientManagement = ({ patients, onDataChange, token, userRole }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phno: '',
    age: '',
    gender: 'Male',
    address: '',
    status: 'active',
    bg: 'A+', 
    emerno: '',
    medical_history: ''
  });
  const [errors, setErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

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
    if (!formData.phno.trim()) newErrors.phno = 'Phone number is required';
    else if (!/^\+?[\d\s\-\(\)]+$/.test(formData.phno)) newErrors.phno = 'Please enter a valid phone number';
    if (!formData.age || formData.age < 1 || formData.age > 120) newErrors.age = 'Please enter a valid age (1-120)';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.emerno.trim()) newErrors.emerno = 'Emergency contact is required';
    if(!formData.emerno.trim() || !/^\+?[\d\s\-\(\)]+$/.test(formData.emerno)) newErrors.emerno = 'Please enter a valid emergency contact number';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const patientData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phno: formData.phno.trim(),
        age: Number(formData.age),
        gender: formData.gender.toLowerCase(),
        bg: formData.bg || 'A+', 
        address: formData.address?.trim() || undefined,
        status: formData.status || 'active',
        emerno: formData.emerno?.trim() || undefined,
        medical_history: formData.medical_history?.trim() || undefined,
      };

      console.log('Submitting patient data:', patientData); 

      const url = editingPatient
        ? `http://localhost:5000/api/patients/${editingPatient._id}`
        : "http://localhost:5000/api/patients/patient";

      const method = editingPatient ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(patientData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save patient");
      }

      const savedPatient = await response.json();
      console.log("Patient saved successfully:", savedPatient);

      if (onDataChange) onDataChange(token); 

      resetForm();
    } catch (error) {
      console.error("Error saving patient:", error.message);
      alert(`Failed to save patient: ${error.message}`);
    }
  };

  const handleEdit = (patient) => {
    setEditingPatient(patient);
    setFormData({
      name: patient.name,
      email: patient.email,
      phno: patient.phno,
      age: patient.age,
      gender: patient.gender,
      address: patient.address,
      status: patient.status,
      bg: patient.bg,
      emerno: patient.emerno,
      medical_history: patient.medical_history || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phno: '',
      age: '',
      gender: 'Male',
      address: '',
      status: 'active',
      bg: 'A+', 
      emerno: '',
      medical_history: ''
    });
    setEditingPatient(null);
    setShowForm(false);
    setErrors({});
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phno.includes(searchTerm)
  );

  return (
    <div className="management-container">
      <div className="management-header">
        <h2>Patient Management</h2>
        {userRole !== 'doctor' && (
          <button 
            className="add-button"
            onClick={() => setShowForm(true)}
          >
            <span className="btn-icon">➕</span>
            Add New Patient
          </button>
        )}
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search patients by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {showForm && userRole !== 'doctor' && (
        <div className="form-modal">
          <div className="form-container">
            <div className="form-header">
              <h3>{editingPatient ? 'Edit Patient' : 'Add New Patient'}</h3>
              <button className="close-button" onClick={resetForm}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="patient-form">
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
                    name="phno"
                    value={formData.phno}
                    onChange={handleInputChange}
                    className={errors.phno ? 'error' : ''}
                  />
                  {errors.phno && <span className="error-message">{errors.phno}</span>}
                </div>
                
                <div className="form-group">
                  <label>Age *</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    min="1"
                    max="120"
                    className={errors.age ? 'error' : ''}
                  />
                  {errors.age && <span className="error-message">{errors.age}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Blood Group</label>
                  <select
                    name="bg"
                    value={formData.bg}
                    onChange={handleInputChange}
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
              <div className="form-group">
                <label>Address *</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows="3"
                  className={errors.address ? 'error' : ''}
                />
                {errors.address && <span className="error-message">{errors.address}</span>}
              </div>

              <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="active">Active</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Emergency Contact *</label>
                <input
                  type="tel"
                  name="emerno"
                  value={formData.emerno}
                  onChange={handleInputChange}
                  className={errors.emerno ? 'error' : ''}
                />
                {errors.emerno && <span className="error-message">{errors.emerno}</span>}
              </div>

              <div className="form-group">
                <label>Medical History</label>
                <textarea
                  name="medical_history"
                  value={formData.medical_history}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Any relevant medical history..."
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="cancel-button">
                  Cancel
                </button>
                <button type="submit" className="submit-button">
                  {editingPatient ? 'Update Patient' : 'Add Patient'}
                </button>
              </div>
              {errors.general && <p className="error-message">{errors.general}</p>}
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
              <th>Age</th>
              <th>Gender</th>
              <th>Blood Group</th>
              <th>Status</th>
              {userRole !== 'doctor' && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredPatients.map(patient => (
              <tr key={patient._id}>
                <td>{patient.name}</td>
                <td>{patient.email}</td>
                <td>{patient.phno}</td>
                <td>{patient.age}</td>
                <td>{patient.gender}</td>
                <td>{patient.bg}</td>
                <td>
                  <span className={`status-badge ${patient.status}`}>
                    {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
                  </span>
                </td>
                {userRole !== 'doctor' && (
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="edit-button"
                        onClick={() => handleEdit(patient)}
                      >
                        ✏️
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredPatients.length === 0 && (
          <div className="no-data">
            <p>No patients found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientManagement;