import React, { useState, useEffect } from 'react';
import dataManager from '../dataManager';
import './Management.css';

const DepartmentManagement = ({ onDataChange }) => {
  const [departments, setDepartments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [errors, setErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const token = localStorage.getItem('token');

      const [deptRes, docRes, appRes] = await Promise.all([
        fetch('http://localhost:5000/api/departments', {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' },
        }),
        fetch('http://localhost:5000/api/doctors', {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' },
        }),
        fetch('http://localhost:5000/api/appointments', {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' },
        }),
      ]);

      if (!deptRes.ok || !docRes.ok || !appRes.ok) {
        throw new Error('Failed to fetch one of the resources');
      }

      const deptData = await deptRes.json();
      const docData = await docRes.json();
      const appData = await appRes.json();

      const departmentsArray = Array.isArray(deptData.data) ? deptData.data : deptData;
      const doctorsArray = Array.isArray(docData) ? docData : Array.isArray(docData.data) ? docData.data : [];
      const appointmentsArray = Array.isArray(appData) ? appData : Array.isArray(appData.data) ? appData.data : [];

      console.log('Fetched departments:', departmentsArray);
      console.log('Fetched doctors (raw):', doctorsArray.map(d => ({ id: d._id, department: d.department })));
      console.log('Fetched appointments (raw):', appointmentsArray.map(a => ({ id: a._id, dept: a.dept })));

      const enrichedDepartments = departmentsArray.map(dept => {
        const deptId = dept._id;

        const doctorCount = doctorsArray.filter(
          doctor => doctor.department && doctor.department.toString() === deptId
        ).length;

        const appointmentCount = appointmentsArray.filter(
          appointment => appointment.dept && appointment.dept.toString() === deptId
        ).length;

        console.log(`Department: ${dept.dept}, DeptId: ${deptId}, DoctorCount: ${doctorCount}, AppointmentCount: ${appointmentCount}, Doctors Checked:`, doctorsArray.map(d => d.department));

        return {
          ...dept,
          doctorCount,
          appointmentCount,
        };
      });

      console.log('Enriched departments:', enrichedDepartments);
      setDepartments(enrichedDepartments);
    } catch (error) {
      console.error('Error loading departments:', error);
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
    if (!formData.name.trim()) {
      newErrors.name = 'Department name is required';
    }
    if (!formData.description.trim() || formData.description.trim().length < 10) {
      newErrors.description = 'Description is required and must be at least 10 characters long';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const departmentData = {
      dept: formData.name,
      description: formData.description
    };

    const token = localStorage.getItem('token');

    try {
      const url = editingDepartment
        ? `http://localhost:5000/api/departments/${editingDepartment._id}`
        : 'http://localhost:5000/api/departments';

      const method = editingDepartment ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(departmentData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to ${editingDepartment ? 'update' : 'add'} department, status: ${res.status}, response: ${errorText}`);
      }

      await loadDepartments();
      resetForm();
      if (onDataChange) onDataChange();
    } catch (error) {
      console.error('Error saving department:', error);
    }
  };

  const handleEdit = (department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.dept || '',
      description: department.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const doctors = dataManager.getDoctors();
    const associatedDoctors = doctors.filter(doctor => doctor.departmentId === id);

    if (associatedDoctors.length > 0) {
      alert(`Cannot delete this department. It has ${associatedDoctors.length} associated doctor(s). Please reassign or remove the doctors first.`);
      return;
    }

    const appointments = dataManager.getAppointments();
    const associatedAppointments = appointments.filter(appointment => appointment.departmentId === id);

    if (associatedAppointments.length > 0) {
      alert(`Cannot delete this department. It has ${associatedAppointments.length} associated appointment(s). Please reassign or remove the appointments first.`);
      return;
    }

    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/departments/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
          },
        });
        if (!res.ok) throw new Error(`Failed to delete department, status: ${res.status}`);
        await loadDepartments();
      } catch (error) {
        console.error('Error deleting department:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setEditingDepartment(null);
    setShowForm(false);
    setErrors({});
  };

  const getDepartmentStats = (department) => {
    return {
      doctorCount: department.doctorCount || 0,
      appointmentCount: department.appointmentCount || 0,
    };
  };

  const filteredDepartments = Array.isArray(departments)
    ? departments.filter(department =>
        (department.dept || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (department.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <div className="management-container">
      <div className="management-header">
        <h2>Department Management</h2>
        <button className="add-button" onClick={() => setShowForm(true)}>
          <span className="btn-icon">➕</span>
          Add New Department
        </button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search departments by name or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {showForm && (
        <div className="form-modal">
          <div className="form-container">
            <div className="form-header">
              <h3>{editingDepartment ? 'Edit Department' : 'Add New Department'}</h3>
              <button className="close-button" onClick={resetForm}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="department-form">
              <div className="form-group">
                <label>Department Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Cardiology, Neurology"
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Describe the department's focus and services..."
                  className={errors.description ? 'error' : ''}
                />
                {errors.description && <span className="error-message">{errors.description}</span>}
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="cancel-button">
                  Cancel
                </button>
                <button type="submit" className="submit-button">
                  {editingDepartment ? 'Update Department' : 'Add Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="departments-grid">
        {filteredDepartments.map(department => {
          const stats = getDepartmentStats(department);
          return (
            <div 
              key={department._id}
              className="department-card"
            >
              <div className="department-header">
                <h3>{department.dept}</h3>
                <div className="department-actions">
                  <button 
                    className="edit-button"
                    onClick={() => handleEdit(department)}
                    title="Edit Department"
                  >
                    ✏️
                  </button>
                  <button 
                    className="delete-button"
                    onClick={() => handleDelete(department._id)}
                    title="Delete Department"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <p className="department-description">{department.description}</p>
              
            </div>
          );
        })}
      </div>
      
      {filteredDepartments.length === 0 && (
        <div className="no-data">
          <p>No departments found</p>
        </div>
      )}
    </div>
  );
};

export default DepartmentManagement;