import React, { useState } from 'react';
import { Link } from "react-router-dom";

function CustomerDetailsLayout({ customer, followUps, onDeleteFollowUp, onAddFollowUp }) {
  const [remark, setRemark] = useState('');
  const [date, setDate] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Number of follow-ups per page

  const totalPages = Math.ceil(followUps.length / itemsPerPage);

  // Calculate current page follow-ups slice
  const currentFollowUps = followUps
    .sort((a, b) => new Date(b.follow_up_date) - new Date(a.follow_up_date))
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!remark.trim()) return;
    onAddFollowUp(customer.id, { remarks: remark, follow_up_date: date });
    setRemark('');
    setDate('');
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link to="/" className="inline-block mb-4 text-blue-600 hover:underline">
        ← Back to Customers
      </Link>

      <Link to="/cold_calls" className="inline-block mb-4 text-blue-600 hover:underline">
      ← Back to Cold calls
      </Link>

      <h2 className="text-2xl font-bold mb-4">Customer Details</h2>

      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <p><strong>Name:</strong> {customer.name}</p>
        <p><strong>Phone:</strong> {customer.phone || '—'}</p>
        <p><strong>Email:</strong> {customer.email || '—'}</p>
        <p><strong>Company:</strong> {customer.company || '—'}</p>
        <p><strong>Address:</strong> {customer.address || '—'}</p>
        <p><strong>Notes:</strong> {customer.notes || '—'}</p>
      </div>

      <h3 className="text-xl font-semibold mb-2">Follow-Ups</h3>

      {followUps.length === 0 ? (
        <p>No follow-ups yet.</p>
      ) : (
        <>
          <table className="w-full mb-4 border border-gray-300 rounded">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border-b border-gray-300 text-left">Date</th>
                <th className="p-2 border-b border-gray-300 text-left">Remarks</th>
                
              </tr>
            </thead>
            <tbody>
              {currentFollowUps.map((f) => (
                <tr key={f.id} className="border-b border-gray-300">
                  <td className="p-2">{new Date(f.follow_up_date).toLocaleDateString()}</td>
                  <td className="p-2">{f.remarks || f.remark}</td>
                  <td className="p-2 text-center">
                    
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <div className="flex justify-center gap-2 mb-6">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 border rounded bg-gray-200">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-4">
        <div className="mb-4">
          <label htmlFor="remark" className="block mb-2 text-sm font-medium text-gray-700">
            Add a follow-up remark...
          </label>
          <textarea
            id="remark"
            className="w-full p-2 border rounded mb-2 resize-none block"
            rows="3"
            placeholder="Type something..."
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label htmlFor="date" className="block mb-2 text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            id="date"
            type="date"
            className="w-full p-2 border rounded"
            onChange={(e) => setDate(e.target.value)}
            value={date}
            required
          />
        </div>
        <button
          type="submit"
          className="block w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-md"
        >
          Add Follow-Up
        </button>
      </form>
    </div>
  );
}

export default CustomerDetailsLayout;
