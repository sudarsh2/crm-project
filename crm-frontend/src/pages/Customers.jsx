import { Link } from "react-router-dom";
import axios from "axios";
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';


const API_URL = 'https://crm-project-62br.onrender.com';


function Customers() {
  const [summary, setSummary] = useState({
    total_customers: 0,
    followed_up: 0,
    pending_follow_up: 0,
  });

  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]); 
  const [editingId, setEditingId] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [followedUp, setFollowedUp] = useState(false);


  const location = useLocation();

useEffect(() => {
  const params = new URLSearchParams(location.search);
  const followedUpParam = params.get('followed_up');
  const pendingParam = params.get('pending');

  if (followedUpParam === '1') {
    setFollowedUp(true);
  } else if (pendingParam === '1') {
    setFollowedUp(false);
  } else {
    setFollowedUp(false); // Default case
  }

  setPage(1); // Reset to page 1 when filters change
}, [location.search]);

const fetchCustomers = async (pageNumber = 1, searchQuery = "") => {
  setLoading(true);
  try {
    const params = {
      page: pageNumber,
      page_size: pageSize,
      search: searchQuery,
    };

    // Add filter explicitly
    const paramsFromURL = new URLSearchParams(location.search);
    if (paramsFromURL.get("followed_up") === "1") {
      params.followed_up = 1;
    } else if (paramsFromURL.get("pending") === "1") {
      params.pending = 1;
    }
    

    const res = await axios.get(`${API_URL}/api/customers`, { params });
    setCustomers(res.data.customers);
    setPage(res.data.page);
    setTotalPages(res.data.total_pages);
  } catch (error) {
    console.error("Error loading customers:", error);
  }
  setLoading(false);
};


  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_URL}/api/users`, { headers });
      setUsers(res.data.users || res.data); // Adjust based on your API response
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  useEffect(() => {
    // Fetch summary only once
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    axios.get(`${API_URL}/api/dashboard_summary`, { headers })
      .then((res) => setSummary(res.data))
      .catch(err => console.error("Summary Error:", err));

      fetchUsers(); 
  }, []);

  useEffect(() => {
    fetchCustomers(page, search);
  }, [page, search, followedUp]);

  const handleAssignChange = async (customerId, userId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Find the user name from the users list
      const user = users.find(u => u.id === parseInt(userId));
      const userName = user ? user.name : null;

      await axios.put(`${API_URL}/api/customers/${customerId}/assign`, {
        assigned_to: userName
      }, { headers });
      
      // Update local state
      setCustomers(customers.map(c => 
        c.id === customerId ? {...c, assigned_to: userName} : c
      ));
      
      setEditingId(null); // Exit edit mode
    } catch (error) {
      console.error("Error updating assignment:", error);
    }
  };

  const handlePrev = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNext = () => {
    if (page < totalPages) setPage(page + 1);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // Reset to page 1 when searching
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Dashboard Summary</h2>
      <div className="row mb-5">
        <div className="col-md-4">
          <Link to="/customers" className="card text-white bg-primary text-decoration-none shadow-sm mb-3">
            <div className="card-body d-flex align-items-center gap-3">
              <i className="fas fa-users fa-3x"></i>
              <div>
                <h5 className="card-title mb-1">Total Customers</h5>
                <p className="fs-4">{summary.total_customers}</p>
              </div>
            </div>
          </Link>
        </div>
        <div className="col-md-4">
          <Link to={`/customers?followed_up=1`} className="card text-white bg-success text-decoration-none shadow-sm mb-3">
            <div className="card-body d-flex align-items-center gap-3">
              <i className="fas fa-check-circle fa-3x"></i>
              <div>
                <h5 className="card-title mb-1">Followed Up</h5>
                <p className="fs-4">{summary.followed_up}</p>
              </div>
            </div>
          </Link>
        </div>
        <div className="col-md-4">
          <Link to="/customers?pending=1" className="card text-white bg-warning text-decoration-none shadow-sm mb-3">
            <div className="card-body d-flex align-items-center gap-3">
              <i className="fas fa-clock fa-3x"></i>
              <div>
                <h5 className="card-title mb-1">Pending Follow-up</h5>
                <p className="fs-4">{summary.pending_follow_up}</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        
        <Link to="/create_customer" className="btn btn-primary">
          <i className="fas fa-user-plus me-2"></i>Add New Customer
        </Link>
      </div>

      <div className="mb-3">
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          className="form-control"
          placeholder="Search customers by name..."
        />
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-striped table-bordered table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th>Follow-ups</th>
                  <th>Last Follow-up</th>
                  <th>Assigned To</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td><Link to={`/customers/${c.id}`}>{c.name}</Link></td>
                    <td>{c.phone}</td>
                    <td>{c.email}</td>
                    <td>{c.company}</td>
                    <td>{c.follow_up_count}</td>
                    <td>
                      {c.last_follow_up ? (
                        <>
                          <span className="badge bg-success mb-1">🟢 Followed Up</span><br />
                          {c.last_follow_up}
                        </>
                      ) : (
                        <span className="badge bg-warning text-dark">🔁 Pending</span>
                      )}
                    </td>

                    <td onClick={() => setEditingId(c.id)} style={{cursor: 'pointer'}}>
                      {editingId === c.id ? (
                        <select
                          className="form-select form-select-sm"
                          value={c.assigned_to || ''}
                          onChange={(e) => handleAssignChange(c.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                          onBlur={() => setEditingId(null)}
                        >
                          <option value="">Unassigned</option>
                          {users.map(user => (
                            <option key={user.id} value={user.id}>
                              {user.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        c.assigned_to || 'Unassigned'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="d-flex justify-content-center align-items-center mt-3 gap-2">
  <button
    onClick={() => setPage(1)}
    className="btn btn-outline-secondary"
    disabled={page === 1}
    title="First Page"
  >
    ⏮ First
  </button>

  <button
    onClick={handlePrev}
    className="btn btn-outline-primary"
    disabled={page === 1}
    title="Previous Page"
  >
    ◀ Prev
  </button>

  <span className="mx-2">Page {page} of {totalPages}</span>

  <button
    onClick={handleNext}
    className="btn btn-outline-primary"
    disabled={page === totalPages}
    title="Next Page"
  >
    Next ▶
  </button>

  <button
    onClick={() => setPage(totalPages)}
    className="btn btn-outline-secondary"
    disabled={page === totalPages}
    title="Last Page"
  >
    Last ⏭
  </button>
</div>

        </>
      )}
    </div>
  );
}

export default Customers;
