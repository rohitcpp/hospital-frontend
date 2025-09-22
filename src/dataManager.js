// Data Management System for Healthcare Management
class DataManager {
  constructor() {
    this.initializeData();
  }

  initializeData() {
    // Initialize with sample data if not exists
    if (!localStorage.getItem('healthcare_departments')) {
      const departments = [
        { id: 1, name: 'Cardiology', description: 'Heart and cardiovascular system' },
        { id: 2, name: 'Neurology', description: 'Brain and nervous system' },
        { id: 3, name: 'Orthopedics', description: 'Bones, joints, and muscles' },
        { id: 4, name: 'Pediatrics', description: 'Children healthcare' },
        { id: 5, name: 'Dermatology', description: 'Skin conditions' },
        { id: 6, name: 'Emergency', description: 'Emergency medical care' }
      ];
      localStorage.setItem('healthcare_departments', JSON.stringify(departments));
    }

    if (!localStorage.getItem('healthcare_doctors')) {
      const doctors = [
        {
          id: 1,
          name: 'Dr. John Smith',
          email: 'john.smith@healthcare.com',
          phone: '+1-555-0101',
          specialization: 'Cardiology',
          departmentId: 1,
          experience: '10 years',
          qualification: 'MD, FACC',
          status: 'active'
        },
        {
          id: 2,
          name: 'Dr. Sarah Johnson',
          email: 'sarah.johnson@healthcare.com',
          phone: '+1-555-0102',
          specialization: 'Neurology',
          departmentId: 2,
          experience: '8 years',
          qualification: 'MD, PhD',
          status: 'active'
        },
        {
          id: 3,
          name: 'Dr. Michael Brown',
          email: 'michael.brown@healthcare.com',
          phone: '+1-555-0103',
          specialization: 'Orthopedics',
          departmentId: 3,
          experience: '12 years',
          qualification: 'MD, MS Ortho',
          status: 'active'
        }
      ];
      localStorage.setItem('healthcare_doctors', JSON.stringify(doctors));
    }

    if (!localStorage.getItem('healthcare_patients')) {
      const patients = [
        {
          id: 1,
          name: 'Alice Wilson',
          email: 'alice.wilson@email.com',
          phone: '+1-555-1001',
          age: 35,
          gender: 'Female',
          address: '123 Main St, City, State 12345',
          bloodGroup: 'A+',
          emergencyContact: '+1-555-1002',
          medicalHistory: 'Hypertension',
          registrationDate: '2024-01-15'
        },
        {
          id: 2,
          name: 'Bob Davis',
          email: 'bob.davis@email.com',
          phone: '+1-555-1003',
          age: 42,
          gender: 'Male',
          address: '456 Oak Ave, City, State 12345',
          bloodGroup: 'B+',
          emergencyContact: '+1-555-1004',
          medicalHistory: 'Diabetes Type 2',
          registrationDate: '2024-01-20'
        },
        {
          id: 3,
          name: 'Carol Martinez',
          email: 'carol.martinez@email.com',
          phone: '+1-555-1005',
          age: 28,
          gender: 'Female',
          address: '789 Pine Rd, City, State 12345',
          bloodGroup: 'O-',
          emergencyContact: '+1-555-1006',
          medicalHistory: 'Asthma',
          registrationDate: '2024-02-01'
        }
      ];
      localStorage.setItem('healthcare_patients', JSON.stringify(patients));
    }

    if (!localStorage.getItem('healthcare_appointments')) {
      const appointments = [
        {
          id: 1,
          patientId: 1,
          doctorId: 1,
          departmentId: 1,
          date: '2024-08-26',
          time: '10:00',
          status: 'scheduled',
          reason: 'Regular checkup',
          notes: 'Patient reports chest pain'
        },
        {
          id: 2,
          patientId: 2,
          doctorId: 2,
          departmentId: 2,
          date: '2024-08-27',
          time: '14:30',
          status: 'scheduled',
          reason: 'Follow-up consultation',
          notes: 'Diabetes management review'
        },
        {
          id: 3,
          patientId: 3,
          doctorId: 3,
          departmentId: 3,
          date: '2024-08-28',
          time: '09:15',
          status: 'completed',
          reason: 'Injury assessment',
          notes: 'Knee pain after sports activity'
        }
      ];
      localStorage.setItem('healthcare_appointments', JSON.stringify(appointments));
    }
  }

  // Generic CRUD operations
  getData(type) {
    const data = localStorage.getItem(`healthcare_${type}`);
    return data ? JSON.parse(data) : [];
  }

  saveData(type, data) {
    localStorage.setItem(`healthcare_${type}`, JSON.stringify(data));
  }

  getNextId(type) {
    const data = this.getData(type);
    return data.length > 0 ? Math.max(...data.map(item => item.id)) + 1 : 1;
  }

  // Department operations
  getDepartments() {
    return this.getData('departments');
  }

  addDepartment(department) {
    const departments = this.getDepartments();
    const newDepartment = {
      ...department,
      id: this.getNextId('departments')
    };
    departments.push(newDepartment);
    this.saveData('departments', departments);
    return newDepartment;
  }

  updateDepartment(id, updatedDepartment) {
    const departments = this.getDepartments();
    const index = departments.findIndex(dept => dept.id === id);
    if (index !== -1) {
      departments[index] = { ...departments[index], ...updatedDepartment };
      this.saveData('departments', departments);
      return departments[index];
    }
    return null;
  }

  deleteDepartment(id) {
    const departments = this.getDepartments();
    const filteredDepartments = departments.filter(dept => dept.id !== id);
    this.saveData('departments', filteredDepartments);
    return true;
  }

  // Doctor operations
  getDoctors() {
    return this.getData('doctors');
  }

  addDoctor(doctor) {
    const doctors = this.getDoctors();
    const newDoctor = {
      ...doctor,
      id: this.getNextId('doctors')
    };
    doctors.push(newDoctor);
    this.saveData('doctors', doctors);
    return newDoctor;
  }

  updateDoctor(id, updatedDoctor) {
    const doctors = this.getDoctors();
    const index = doctors.findIndex(doc => doc.id === id);
    if (index !== -1) {
      doctors[index] = { ...doctors[index], ...updatedDoctor };
      this.saveData('doctors', doctors);
      return doctors[index];
    }
    return null;
  }

  deleteDoctor(id) {
    const doctors = this.getDoctors();
    const filteredDoctors = doctors.filter(doc => doc.id !== id);
    this.saveData('doctors', filteredDoctors);
    return true;
  }

  // Patient operations
  getPatients() {
    return this.getData('patients');
  }

  addPatient(patient) {
    const patients = this.getPatients();
    const newPatient = {
      ...patient,
      id: this.getNextId('patients'),
      registrationDate: new Date().toISOString().split('T')[0]
    };
    patients.push(newPatient);
    this.saveData('patients', patients);
    return newPatient;
  }

  updatePatient(id, updatedPatient) {
    const patients = this.getPatients();
    const index = patients.findIndex(patient => patient.id === id);
    if (index !== -1) {
      patients[index] = { ...patients[index], ...updatedPatient };
      this.saveData('patients', patients);
      return patients[index];
    }
    return null;
  }

  deletePatient(id) {
    const patients = this.getPatients();
    const filteredPatients = patients.filter(patient => patient.id !== id);
    this.saveData('patients', filteredPatients);
    return true;
  }

  // Appointment operations
  getAppointments() {
    return this.getData('appointments');
  }

  addAppointment(appointment) {
    const appointments = this.getAppointments();
    const newAppointment = {
      ...appointment,
      id: this.getNextId('appointments')
    };
    appointments.push(newAppointment);
    this.saveData('appointments', appointments);
    return newAppointment;
  }

  updateAppointment(id, updatedAppointment) {
    const appointments = this.getAppointments();
    const index = appointments.findIndex(apt => apt.id === id);
    if (index !== -1) {
      appointments[index] = { ...appointments[index], ...updatedAppointment };
      this.saveData('appointments', appointments);
      return appointments[index];
    }
    return null;
  }

  deleteAppointment(id) {
    const appointments = this.getAppointments();
    const filteredAppointments = appointments.filter(apt => apt.id !== id);
    this.saveData('appointments', filteredAppointments);
    return true;
  }

  // Statistics
  getStatistics() {
    return {
      totalPatients: this.getPatients().length,
      totalDoctors: this.getDoctors().length,
      totalAppointments: this.getAppointments().length,
      totalDepartments: this.getDepartments().length,
      todayAppointments: this.getAppointments().filter(apt => 
        apt.date === new Date().toISOString().split('T')[0]
      ).length,
      activePatients: this.getPatients().length,
      activeDoctors: this.getDoctors().filter(doc => doc.status === 'active').length
    };
  }
}

// Create singleton instance
const dataManager = new DataManager();
export default dataManager;
