import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function CreateCustomer() {
  const navigate = useNavigate();

  // Declare newCustomer state with default fields
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    address: '',
    notes: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.post('https://crm-project-62br.onrender.com/api/customers', newCustomer, { headers });

      // Redirect to customers list after successful creation
      navigate('/customers');
    } catch (error) {
      console.error('Error adding customer:', error);
    }
  };

  return (
    <div className="container mt-4">
      <h2>Add New Customer</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>Name *</label>
          <input
            type="text"
            value={newCustomer.name}
            onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
            required
            className="form-control"
          />
        </div>
        {/* Repeat for other fields: phone, email, company, address, notes */}
        <div className="mb-3">
          <label>Phone</label>
          <input
            type="text"
            value={newCustomer.phone}
            onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
            className="form-control"
          />
        </div>
        <div className="mb-3">
          <label>Email</label>
          <input
            type="email"
            value={newCustomer.email}
            onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
            className="form-control"
          />
        </div>
        <div className="mb-3">
          <label>Company</label>
          <input
            type="text"
            value={newCustomer.company}
            onChange={(e) => setNewCustomer({ ...newCustomer, company: e.target.value })}
            className="form-control"
          />
        </div>
        <div className="mb-3">
          <label>Address</label>
          <textarea
            value={newCustomer.address}
            onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
            className="form-control"
            rows={2}
          />
        </div>
        <div className="mb-3">
          <label>Notes</label>
          <textarea
            value={newCustomer.notes}
            onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
            className="form-control"
            rows={2}
          />
        </div>
        <div className="mb-3">
            <label>Assigned To</label>
            <textarea
                value={newCustomer.assigned_to}
                onChange={(e) => setNewCustomer({ ...newCustomer, assigned_to: e.target.value})}
                className="form-control"
                rows={2}
                />
        </div>
        <button type="submit" className="btn btn-primary">Save Customer</button>
      </form>
    </div>
  );
}

export default CreateCustomer;
