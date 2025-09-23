import React, { useState } from 'react';
import './LoginPage.css';

const LoginPage = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'doctor' 
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
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

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsLoading(true);
    try {
      console.log('Sending login request:', {
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      });
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
        console.log('Parsed response data:', data);
      } catch (e) {
        data = { message: `Invalid response: ${text || 'No data'}` };
        console.error('Failed to parse response:', text, e);
      }
      console.log('Login response:', { status: response.status, data });

      if (response.ok && data.success) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userEmail', formData.email);
        localStorage.setItem('userRole', formData.role);
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        if (onLoginSuccess) {
          console.log('Calling onLoginSuccess');
          onLoginSuccess();
        } else {
          console.log('No onLoginSuccess, falling back to /dashboard');
          window.location.href = '/dashboard';
        }
      } else {
        setErrors({ submit: data.message || 'Login failed. Please try again.' });
        console.log('Login failed with message:', data.message);
      }
    } catch (error) {
      console.error('Fetch error:', error.message);
      setErrors({ submit: 'Login failed due to a network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-overlay">
        <div className="login-card">
          <div className="login-header">
            <div className="hospital-logo">
              <div className="logo-icon">🏥</div>
              <h1>HealthCare </h1>
            </div>
            <p className="login-subtitle">Welcome back! Please sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="role" className="form-label">
                Login As
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="form-input"
              >
                <option value="admin">Admin</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="Enter your email"
                autoComplete="email"
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div className="form-options">
              <label className="checkbox-container">
                <input type="checkbox" />
                <span className="checkmark"></span>
                Remember me
              </label>
              <a href="#" className="forgot-password">Forgot Password?</a>
            </div>

            {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}

            <button 
              type="submit" 
              className={`login-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>Don't have an account? <a href="#" className="signup-link">Sign up here</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;