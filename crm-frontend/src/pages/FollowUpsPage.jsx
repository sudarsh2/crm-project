import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TodaysFollowUps from '../components/FollowUpsToday';

const API_URL = 'https://crm-project-1-916c.onrender.com';

function FollowUpsPage() {
  const [followUpsToday, setFollowUpsToday] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState({ id: 1, name: 'Alice' }); // example user, fetch from your auth system if available
  const [loading, setLoading] = useState(true);

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [followUpsRes, usersRes, currentUserRes] = await Promise.all([
          axios.get(`${API_URL}/api/follow_ups_today`),
          axios.get(`${API_URL}/api/users`),
          axios.get(`${API_URL}/api/current_user`),
        ]);
        setFollowUpsToday(followUpsRes.data.follow_ups_today);
        setUsers(usersRes.data.users);
        setCurrentUser(currentUserRes.data.user);
      } catch (error) {
        console.error('Failed to load follow-ups or users:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAssign = async (followUpId, userId) => {
    try {
      await axios.post(`${API_URL}/api/follow_ups/${followUpId}/assign`, { user_id: userId });
      // Refresh follow-ups to reflect new assignment
      const res = await axios.get(`${API_URL}/api/follow_ups_today`);
      setFollowUpsToday(res.data.follow_ups_today);
    } catch (error) {
      console.error('Failed to assign follow-up:', error);
    }
  };

  const handleMarkDone = async (assignmentId) => {
    try {
      await axios.post(`${API_URL}/api/assignments/${assignmentId}/mark_done`);
      // Refresh follow-ups to reflect status change
      const res = await axios.get(`${API_URL}/api/follow_ups_today`);
      setFollowUpsToday(res.data.follow_ups_today);
    } catch (error) {
      console.error('Failed to mark follow-up done:', error);
    }
  };

  if (loading) return <p>Loading follow-ups...</p>;

  return (
    <TodaysFollowUps
      followUpsToday={followUpsToday}
      users={users}
      currentUser={currentUser}
      onAssign={handleAssign}
      onMarkDone={handleMarkDone}
    />
  );
}

export default FollowUpsPage;
