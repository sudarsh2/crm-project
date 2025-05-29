import React, { useState } from 'react';

function TodaysFollowUps({ followUpsToday, users, currentUser, onAssign, onMarkDone }) {
  const [selectedUser, setSelectedUser] = useState({});

  const handleUserChange = (followUpId, userId) => {
    setSelectedUser(prev => ({ ...prev, [followUpId]: userId }));
  };

  const handleAssignSubmit = (e, followUpId) => {
    e.preventDefault();
    if (selectedUser[followUpId]) {
      const confirmAssign = window.confirm("Are you sure you want to assign this follow-up?");
      if (confirmAssign) {
        onAssign(followUpId, selectedUser[followUpId]);
      }
    }
  };

  const handleMarkDone = (assignmentId) => {
    const confirmDone = window.confirm("Mark this follow-up as done?");
    if (confirmDone) {
      onMarkDone(assignmentId);
    }
  };

  return (
    <div className="container mt-4">
      <h3>Today's Follow-ups</h3>
      <table className="table table-bordered">
        <thead className="table-dark">
          <tr>
            <th>Customer</th>
            <th>Phone</th>
            <th>Remarks</th>
            <th>Assigned To</th>
            <th>Status</th>
            <th>Follow-up Date</th> {/* Optional if available */}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {followUpsToday && followUpsToday.map((item) => (
            <tr
              key={item.follow_up.id}
              className={item.assignment?.user.id === currentUser.id ? 'table-info' : ''}
            >
              <td>{item.customer.name}</td>
              <td>{item.customer.phone}</td>
              <td>{item.follow_up.remarks}</td>
              <td>{item.assignment ? item.assignment.user.name : '-'}</td>
              <td>
                {item.assignment ? (
                  <span className={`badge bg-${item.assignment.status === 'done' ? 'success' : 'warning'}`}>
                    {item.assignment.status}
                  </span>
                ) : (
                  <span className="text-muted">Unassigned</span>
                )}
              </td>
              <td>
                {item.follow_up.due_date
                  ? new Date(item.follow_up.due_date).toLocaleDateString()
                  : <span className="text-muted">N/A</span>}
              </td>
              <td>
                {!item.assignment ? (
                  <form onSubmit={(e) => handleAssignSubmit(e, item.follow_up.id)}>
                    <div className="input-group">
                      <select
                        required
                        value={selectedUser[item.follow_up.id] || ''}
                        onChange={(e) => handleUserChange(item.follow_up.id, e.target.value)}
                        className="form-select form-select-sm"
                      >
                        <option value="" disabled>Select user</option>
                        {users.map(user => (
                          <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="btn btn-sm btn-primary"
                        aria-label="Assign follow-up"
                      >
                        Assign
                      </button>
                    </div>
                  </form>
                ) : item.assignment.user.id === currentUser.id && item.assignment.status !== 'done' ? (
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() => handleMarkDone(item.assignment.id)}
                    aria-label="Mark follow-up as done"
                  >
                    Mark Done
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
          {followUpsToday && followUpsToday.length === 0 && (
            <tr><td colSpan="7" className="text-center">No follow-ups today.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default TodaysFollowUps;
