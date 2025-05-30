import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = 'https://crm-project-62br.onrender.com'; // your Flask backend URL

function ColdCalls() {
  const [customersToCall, setCustomersToCall] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // For demo, assume user_id = 1 (you should get this from your auth system)
  const userId = 1;

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const res = await axios.get(`${API_URL}/api/random_cold_calls`, {
          params: { user_id: userId }
        });
        setCustomersToCall(res.data.customers);
      } catch (err) {
        setError('Failed to load customers to call.');
      } finally {
        setLoading(false);
      }
    }
    fetchCustomers();
  }, [userId]);

  if (loading) return <p>Loading customers to call today...</p>;
  if (error) return <p className="text-danger">{error}</p>;

  return (
    <div className="container mt-4">
      <h2>Cold Calls</h2>
      {customersToCall.length === 0 ? (
        <p>No customers assigned for cold calls today.</p>
      ) : (
        <table className="table table-striped table-hover">
          <thead className="bg-primary text-white">
            <tr>
              <th scope="col" className="px-4 py-2">Name</th>
              <th scope="col" className="px-4 py-2">Phone</th>
              <th scope="col" className="px-4 py-2">Company</th>
              <th scope="col" className="px-4 py-2">Email</th>
            </tr>
          </thead>
          <tbody>
            {customersToCall.map(c => (
              <tr key={c.id} className="align-middle">
                <td className="px-4 py-2"><Link to={`/customers/${c.id}`}>{c.name}</Link></td>
                <td className="px-4 py-2">{c.phone}</td>
                <td className="px-4 py-2">{c.company || '-'}</td>
                <td className="px-4 py-2">{c.email || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ColdCalls;
