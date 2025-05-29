import { useEffect, useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { NavLink } from 'react-router-dom';


export default function Layout() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-bs-theme', savedTheme);
    setTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-bs-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    setTheme(newTheme);
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top" style={{ backgroundColor: '#1e1e2f' }}>
        <div className="container-fluid">
          <Link className="navbar-brand" to="/customers" style={{ color: '#fff' }}>DELIUM CRM</Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto">

              
              <li className="nav-item">
              <Link to="/todays_followups" className="btn btn-warning" style={{ backgroundColor: '#ffc107', borderColor: '#ffc107' }}>
  Today's Follow-ups
</Link>
              </li>
              <li>
  <NavLink to="/cold_calls" className="nav-link" style={{ color: '#fff' }}>
    Cold Calls
  </NavLink>
</li>
            </ul>
            <div className="d-flex">
              <button onClick={toggleTheme} className="btn btn-outline-light btn-sm me-2" style={{ color: '#fff', borderColor: '#fff' }}>
                {theme === 'light' ? 'Dark' : 'Light'}
              </button>
              <Link className="btn btn-outline-danger btn-sm" to="/logout" style={{ backgroundColor: '#dc3545', borderColor: '#dc3545', color: '#fff' }}>Logout</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="d-flex justify-content-center align-items-center vh-100 vw-100" style={{ marginTop: '5.5rem' }}>
        <div className="container text-center w-100 h-100">
          <Outlet />
        </div>
      </main>

    </>
  );
}