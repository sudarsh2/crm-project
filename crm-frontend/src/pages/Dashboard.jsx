// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = 'https://your-crm-backend.onrender.com';

export default function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [newLead, setNewLead] = useState({ name: '', email: '', phone: '', company: '' });
  const [search, setSearch] = useState('');
  const [summary, setSummary] = useState({ total: 0 });
  const [editingLeadId, setEditingLeadId] = useState(null);
  const [editLeadData, setEditLeadData] = useState({ name: '', email: '', phone: '', company: '' });
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  const fetchLeads = async () => {
    if (!token) {
      navigate('/login');
      return;
    }
    
    try {
      const res = await axios.get(`${API_URL}/leads`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeads(res.data.leads);
      setSummary({ total: res.data.leads.length });
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
      console.error(err);
    }
  };

  // ... keep all your existing lead management functions ...

  useEffect(() => {
    if (!token) {
      navigate('/login');
    } else {
      fetchLeads();
    }
  }, [token, navigate]);

  if (!token) {
    return null; // Will redirect to login
  }

  return (
    <div className="p-6 max-w-4xl mx-auto text-white">
      <h2>Welcome to Dashboard</h2>
      <p>Total Leads: {summary.total}</p>
      {/* Render leads list for testing */}
    </div>
  );
}