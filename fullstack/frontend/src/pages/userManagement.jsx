import React, { useEffect, useState } from 'react';
import { Search, Users, Plus, Edit } from 'lucide-react';
import axios from 'axios';
import './css/userManagement.css';
import { useNavigate } from "react-router-dom";
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [errorModal, setErrorModal] = useState({ show: false, message: "" });
  const rowsPerPage = 10;
  const navigate = useNavigate();
  const token = sessionStorage.getItem('token');
  const API_BASE_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    fetchUsers();
    checkToken();
  }, []);
  const checkToken = async () => {
    if (!token) {
        alert("Session expired. Please log in again.");
        navigate("/");
        return;
      }
    try{
      const meRes = await axios.get(`${API_BASE_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUser(meRes.data)
    } catch (err) {
        console.error("Error fetching initial data:", err);
        navigate("/");
    }
    
  };
  const formatName = (name) => {
    if (!name) return "";
    return name
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const fetchUsers = () => {
    axios.get(`${API_BASE_URL}/user-management`, {headers: { Authorization: `Bearer ${token}` }})
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
        birthday: user.birthday,
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
  const handleCreate = async (data) => {
    await axios.post(
      `${API_BASE_URL}/user-management`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  };

  const handleUpdate = async (data) => {
    await axios.put(
      `${API_BASE_URL}/user-management/${selectedUser.user_id}`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formattedData = {
        ...formData,
        email: formData.email.toLowerCase(),
        first_name: formatName(formData.first_name),
        last_name: formatName(formData.last_name),
        affix: formData.affix ? formatName(formData.affix) : "",
        birthday: formData.birthday
      };

      if (selectedUser) {
        await handleUpdate(formattedData);
      } else {
        await handleCreate(formattedData);
      }

      fetchUsers();
      closeModal();
    } catch (err) {
      console.error("Error saving user:", err);
      const msg = err.response?.data?.error || "An error occurred while saving user data.";
      setErrorModal({ show: true, message: msg });
    }
  };

  const handleSubmitConfirm = async () => {
    try {
      const formattedData = {
        ...formData,
        email: formData.email.toLowerCase(),
        first_name: formatName(formData.first_name),
        last_name: formatName(formData.last_name),
        affix: formData.affix ? formatName(formData.affix) : "",
        birthday: formData.birthday
      };

      if (selectedUser) {
        await handleUpdate(formattedData);
      } else {
        await handleCreate(formattedData);
      }

      fetchUsers();
      closeModal();
    } catch (err) {
      console.error("Error saving user:", err);
      const msg = err.response?.data?.error || "An error occurred while saving user data.";
      setErrorModal({ show: true, message: msg });
    }
  };

  const handleDelete = async () => {
    if (selectedUser) {
      await axios.delete(`${API_BASE_URL}/user-management/${selectedUser.user_id}`, {headers: { Authorization: `Bearer ${token}` }});
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
            <form
              onSubmit={(e) => {
                e.preventDefault();       // stop default submission
                setShowSaveConfirm(true); // show confirmation modal
              }}
              className="modal-form"
            >
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
              <label htmlFor="birthday">Birthday</label>
              <input
                id="birthday"
                type="date"
                max={new Date().toISOString().split("T")[0]}
                value={formData.birthday || ""}
                onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
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
                    minLength={8}
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
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="btn-delete"
                  >
                    Delete
                  </button>
                )}
                <button type="button" onClick={closeModal} className="btn-cancel">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete {selectedUser.first_name} {selectedUser.last_name}?</p>
            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDelete();
                  setShowDeleteConfirm(false);
                }}
                className="btn-delete"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {showSaveConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Confirm {selectedUser ? "Update" : "Add"} User</h3>
            <p>
              Are you sure you want to {selectedUser ? "update" : "add"} this user?
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setShowSaveConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-save"
                onClick={async () => {
                  await handleSubmitConfirm();
                  setShowSaveConfirm(false);
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      {errorModal.show && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 style={{ color: "red" }}>Save Failed</h3>
            <p>{errorModal.message}</p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setErrorModal({ show: false, message: "" })}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
