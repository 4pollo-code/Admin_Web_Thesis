import React, { useEffect, useState } from 'react';
import { Search, Users, Plus, Edit } from 'lucide-react';
import axios from 'axios';
import './css/userManagement.css';
import Header from '../components/Header';

export default function UserManagementSystem() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ first_name: "", last_name: "", email: "", role: "USER"});

  useEffect(() => {
    fetchUsers();
  }, []);

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
      // Update
      await axios.put(`http://127.0.0.1:5000/user-management/${selectedUser.user_id}`, formData);
    } else {
      // Create
      console.log(formData);
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

          {/* Navigation arrows and search */}
          
          <div className="header-right">
            
            <div className="search-container">
              <Search className="search-icon" size={20} />
              <input type="text" placeholder="Search Data..." className="search-input" />
            </div>
            <button className="btn btn-add" onClick={() => openModal()}>
                <Plus size={16} />
                  Add User
                </button>
          </div>
        </div>

        {/* User Management Table */}
        <div className="user-table">
          <div className="table-header">
            <div className="header-cell"><h3 className="header-title">First Name</h3></div>
            <div className="header-cell"><h3 className="header-title">Last Name</h3></div>
            <div className="header-cell"><h3 className="header-title">Email</h3></div>
            <div className="header-cell"><h3 className="header-title">Role</h3></div>
            <div className="header-cell"><h3 className="header-title"> </h3></div>
          </div>

          <div className="table-body">
            {users.map((user) => (
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
          <div className="footer-info">Showing {users.length} users</div>
          <div className="pagination">
            <button className="pagination-button primary">Previous</button>
            <button className="pagination-button active">1</button>
            <button className="pagination-button primary">Next</button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 >{selectedUser ? "Edit User" : "Create User"}</h2>
            <form onSubmit={handleSubmit} className="modal-form">
              
              <label htmlFor="first_name">First Name</label>
              <input
                id ="first_name"
                type="text"
                placeholder="First Name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
              <label htmlFor="last_name">Last Name</label>
              <input
                id = "last_name"
                type="text"
                placeholder="Last Name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
              <label htmlFor="affix">Affix</label>
              <input
                id = "affix"
                type="text"
                placeholder="Affix"
                value={formData.affix || ''}
                onChange={(e) => setFormData({ ...formData, affix: e.target.value })}
              />
              <label htmlFor="email">Email</label>
              <input
                id = "email"
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
                    id = "password"
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
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>

              <div className="modal-actions">
                <button type="submit" className="btn-save">Save</button>
                {selectedUser && (
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
