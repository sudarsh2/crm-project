import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import CustomerDetailsLayout from '../components/CustomerDetailsLayout';


const API_URL = 'http://127.0.0.1:5001';

function CustomerDetails() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/customers/${id}`);
        console.log("Fetched customer details:", res.data);
        setCustomer(res.data.customer);
        setFollowUps(res.data.follow_ups);
      } catch (err) {
        console.error('Error fetching customer details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomerDetails();
  }, [id]);

  const handleAddFollowUp = async (customerId, followUpData) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/customers/${customerId}/follow_ups`,
        followUpData,  // send the object directly
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );
      console.log('Follow-up added:', response.data);
      return response.data;
    } catch (error) {
      if (error.response) {
        // Server responded with a status outside 2xx
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        // Request made but no response
        console.error('No response received:', error.request);
      } else {
        // Other errors during request setup
        console.error('Request setup error:', error.message);
      }
      throw error; // optionally re-throw to let calling code handle it
    }
  };
  const addFollowUpAndUpdateState = async (customerId, followUpData) => {
    try {
      const newFollowUp = await handleAddFollowUp(customerId, followUpData);
      setFollowUps(prev => [newFollowUp, ...prev]);  // prepend new follow-up for latest on top
    } catch (error) {
      // handle or show error if needed
    }
  };

  const handleDeleteFollowUp = async (followUpId) => {
    if (!window.confirm('Delete this follow-up?')) return;
    try {
      await axios.post(`${API_URL}/api/follow_ups/${followUpId}/delete`);
      setFollowUps(followUps.filter(f => f.id !== followUpId));
    } catch (err) {
      console.error('Failed to delete follow-up:', err);
    }
  };

  if (loading) return <p>Loading customer details...</p>;
  if (!customer) return <p>Customer not found.</p>;

  return (
    <CustomerDetailsLayout
      customer={customer}
      followUps={followUps}
      onDeleteFollowUp={handleDeleteFollowUp}
      onAddFollowUp={addFollowUpAndUpdateState}     />
  );
}

export default CustomerDetails;
