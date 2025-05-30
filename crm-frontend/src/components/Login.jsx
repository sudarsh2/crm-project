// src/components/Login.jsx
import React, { useState } from 'react';
import './Login.css';
import { useNavigate } from "react-router-dom";
import axios from 'axios';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
  
    try {
      
      const response = await axios.post('https://crm-project-1-916c.onrender.com', 
        { username, password },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
  
      if (response.data.status === "success") {
        // Store token
        localStorage.setItem('token', response.data.access_token);
        
        // Redirect to dashboard
        navigate('/customers');  // Using react-router navigation
        
        // Alternative if you need full page reload:
        // window.location.href = '/dashboard';
      } else {
        setError(response.data.message || "Login failed");
      }
  
    } catch (error) {
      setError(error.response?.data?.message || "Network error");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="login-body d-flex align-items-center justify-content-center">
      <div className="login-container">
        <h2 className="text-center mb-4">Welcome to DELIUM CRM</h2>
        
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="username" className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Logging in...
              </>
            ) : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;