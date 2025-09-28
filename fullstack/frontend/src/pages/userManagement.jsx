import React, { useEffect, useState } from 'react';
import { Search, Users, Plus, Edit } from 'lucide-react';
import axios from 'axios';
import './css/userManagement.css';
import Header from '../components/Header';

export default function UserManagementSystem() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ first_name: "", last_name: "", email: "", role: "USER" });
  const [currentUser, setCurrentUser] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "first_name", direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get("http://localhost:5000/me", { withCredentials: true });
      setCurrentUser(response.data);
    } catch (error) {
      console.error("Error fetching current user: ", error);
    }
  };

  const fetchUsers = () => {
    axios.get('http://127.0.0.1:5000/user-management')
      .then((res) => setUsers(res.data))
      .catch((err) => console.error("Error fetching users:", err));
  };

  const openModal = (user = null) => {
    setSelectedUser(user);
    if (user) {
      setFormData({
        first_name: user.first_name,
        last_name: user.last_name,
        affix: user.affix,
        email: user.email,
        role: user.role
      });
    } else {
      setFormData({ first_name: "", last_name: "", email: "", password: "", role: "USER" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedUser) {
      await axios.put(`http://127.0.0.1:5000/user-management/${selectedUser.user_id}`, formData);
    } else {
      await axios.post('http://127.0.0.1:5000/user-management', formData);
    }
    fetchUsers();
    closeModal();
  };

  const handleDelete = async () => {
    if (selectedUser) {
      await axios.delete(`http://127.0.0.1:5000/user-management/${selectedUser.user_id}`);
      fetchUsers();
      closeModal();
    }
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Filter
  const filteredUsers = users.filter((user) =>
    [user.first_name, user.last_name, user.email]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // Sort
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!a[sortConfig.key] || !b[sortConfig.key]) return 0;
    const aVal = a[sortConfig.key].toString().toLowerCase();
    const bVal = b[sortConfig.key].toString().toLowerCase();

    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedUsers.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedUsers = sortedUsers.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="user-management-container">
      {/* Header */}
      <Header />
      <div className="main-content">
        <div className="page-header">
          <div className="header-left">
            <Users size={32} color="white" />
            <h1 className="page-title">User Management System</h1>
          </div>

          {/* Search and Add */}
          <div className="header-right">
            <div className="search-container">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search Data..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <button className="btn btn-add" onClick={() => openModal()}>
              <Plus size={16} />
              Add User
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="user-table">
          <div className="table-header">
            <div className="header-cell" onClick={() => handleSort("first_name")}><h3 className="header-title">First Name</h3></div>
            <div className="header-cell" onClick={() => handleSort("last_name")}><h3 className="header-title">Last Name</h3></div>
            <div className="header-cell" onClick={() => handleSort("email")}><h3 className="header-title">Email</h3></div>
            <div className="header-cell" onClick={() => handleSort("role")}><h3 className="header-title">Role</h3></div>
            <div className="header-cell"></div>
          </div>

          <div className="table-body">
            {paginatedUsers.map((user) => (
              <div key={user.user_id} className="table-row">
                <div className="table-cell"><span className="cell-text">{user.first_name}</span></div>
                <div className="table-cell"><span className="cell-text">{user.last_name}</span></div>
                <div className="table-cell"><span className="cell-text">{user.email}</span></div>
                <div className="table-cell"><span className="cell-text">{user.role}</span></div>
                <div className="table-cell actions-cell">
                  <button className="edit-btn" onClick={() => openModal(user)}>
                    <Edit size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="table-footer">
          <div className="footer-info">
            Showing {paginatedUsers.length} of {filteredUsers.length} users
          </div>
          <div className="pagination">
            <button
              className="pagination-button primary"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="pagination-info">Page {currentPage} of {totalPages}</span>
            <button
              className="pagination-button primary"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{selectedUser ? "Edit User" : "Create User"}</h2>
            <form onSubmit={handleSubmit} className="modal-form">
              <label htmlFor="first_name">First Name</label>
              <input
                id="first_name"
                type="text"
                placeholder="First Name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
              <label htmlFor="last_name">Last Name</label>
              <input
                id="last_name"
                type="text"
                placeholder="Last Name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
              <label htmlFor="affix">Affix</label>
              <input
                id="affix"
                type="text"
                placeholder="Affix"
                value={formData.affix || ''}
                onChange={(e) => setFormData({ ...formData, affix: e.target.value })}
              />
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              {!selectedUser && (
                <>
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </>
              )}
              <label htmlFor="role">Role</label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                disabled={selectedUser && currentUser && selectedUser.user_id === currentUser.user_id}
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>

              <div className="modal-actions">
                <button type="submit" className="btn-save">Save</button>
                {selectedUser && currentUser && selectedUser.user_id !== currentUser.user_id && (
                  <button type="button" onClick={handleDelete} className="btn-delete">Delete</button>
                )}
                <button type="button" onClick={closeModal} className="btn-cancel">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
