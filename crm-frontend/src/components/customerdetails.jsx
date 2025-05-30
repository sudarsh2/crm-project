import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useEffect } from 'react';

const API_URL = 'https://crm-project-1-916c.onrender.com';

export default function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState({});
  const [followUps, setFollowUps] = useState([]);
  const [followUpDate, setFollowUpDate] = useState('');
  const [remarks, setRemarks] = useState('');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    axios.get(`${API_URL}/api/customers/${id}`, { headers })
      .then(res => {
        setCustomer(res.data.customer);
        setFollowUps(res.data.follow_ups);
      })
      .catch(err => console.error(err));
  }, [id]);

  const handleDelete = (followUpId) => {
    if (window.confirm('Delete this follow-up?')) {
      axios.post(`${API_URL}/delete_follow_up/${followUpId}`, {}, { headers })
        .then(() => {
          setFollowUps(prev => prev.filter(f => f.id !== followUpId));
        })
        .catch(err => console.error(err));
    }
  };

  const handleAddFollowUp = (e) => {
    e.preventDefault();
    axios.post(`${API_URL}/add_follow_up/${id}`, {
      follow_up_date: followUpDate,
      remarks,
    }, { headers })
      .then((res) => {
        setFollowUps([...followUps, res.data]);
        setFollowUpDate('');
        setRemarks('');
        document.getElementById('closeModalBtn').click();
      })
      .catch(err => console.error(err));
  };

  return (
    <div className="container my-4">
      <h2 className="mb-4">Customer Details</h2>

      <div className="mb-3"><strong>Name:</strong> {customer.name}</div>
      <div className="mb-3"><strong>Phone:</strong> {customer.phone}</div>
      <div className="mb-3"><strong>Email:</strong> {customer.email}</div>
      <div className="mb-3"><strong>Company:</strong> {customer.company}</div>
      <div className="mb-3">
        <strong>Address:</strong>
        <div className="border rounded p-2 bg-light" style={{ whiteSpace: 'pre-wrap' }}>{customer.address}</div>
      </div>
      <div className="mb-4">
        <strong>Notes:</strong>
        <div className="border rounded p-2 bg-light" style={{ whiteSpace: 'pre-wrap' }}>{customer.notes}</div>
      </div>

      <h3 className="mb-3">Follow-ups</h3>
      <table className="table table-striped table-bordered">
        <thead className="table-dark">
          <tr>
            <th>Date</th>
            <th>Remarks</th>
            <th style={{ width: '120px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {followUps.length > 0 ? followUps.map(f => (
            <tr key={f.id}>
              <td>{f.follow_up_date}</td>
              <td>{f.remarks}</td>
              <td>
                <button onClick={() => handleDelete(f.id)} className="btn btn-sm btn-danger">Delete</button>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="3" className="text-center fst-italic">No follow-ups yet.</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="text-end mt-4">
        <button className="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#addFollowUpModal">
          <i className="fa fa-plus"></i> Add Follow-up
        </button>
      </div>

      <p className="mt-4 text-start">
        <Link to="/customers" className="btn btn-secondary float-start">
          <i className="fa fa-arrow-left"></i> Back to Customers
        </Link>
      </p>

      <div className="modal fade" id="addFollowUpModal" tabIndex="-1" aria-labelledby="addFollowUpModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-md modal-dialog-centered">
          <div className="modal-content">
            <form onSubmit={handleAddFollowUp}>
              <div className="modal-header">
                <h5 className="modal-title" id="addFollowUpModalLabel">Add Follow-up</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" id="closeModalBtn"></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="follow_up_date" className="form-label">Follow-up Date *</label>
                  <input type="date" id="follow_up_date" name="follow_up_date" className="form-control form-control-sm" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label htmlFor="remarks" className="form-label">Remarks</label>
                  <textarea id="remarks" name="remarks" className="form-control form-control-sm" rows="3" value={remarks} onChange={(e) => setRemarks(e.target.value)}></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-success btn-sm">Save</button>
                <button type="button" className="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
