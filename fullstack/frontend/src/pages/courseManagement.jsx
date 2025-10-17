import React, { useEffect, useState } from "react";
import { Search, Plus, Edit, Trash2, XCircle } from "lucide-react";
import axios from "axios";
import "./css/courseManagement.css";
import HeaderBar from "../components/Header";
import { useNavigate } from "react-router-dom";

export default function CourseDashboard() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ course_name: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "course_name", direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorModal, setErrorModal] = useState({ show: false, title: "", message: "" });

  const rowsPerPage = 5;
  const token = sessionStorage.getItem("token");
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    validateToken();
    loadCourses();
  }, []);

  const validateToken = async () => {
    if (!token) {
      setErrorModal({
        show: true,
        title: "Session Expired",
        message: "Your session has expired. Please log in again.",
      });
      navigate("/");
      return;
    }

    try {
      await axios.get(`${API_URL}/me`, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "An unknown error occurred.";
      setErrorModal({
        show: true,
        title: "Authentication Failed",
        message: msg,
      });
      navigate("/");
    }
  };

  const loadCourses = async () => {
    try {
      const res = await axios.get(`${API_URL}/courses/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sorted = res.data.sort((a, b) =>
        a.course_name.toLowerCase().localeCompare(b.course_name.toLowerCase())
      );
      setCourses(sorted);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Failed to load courses.";
      setErrorModal({ show: true, title: "Loading Failed", message: msg });
    }
  };

  const openModal = (course = null) => {
    setSelectedCourse(course);
    setFormData({ course_name: course ? course.course_name : "" });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedCourse(null);
    setFormData({ course_name: "" });
    setIsModalOpen(false);
  };

  const handleSaveConfirm = async () => {
    try {
      if (selectedCourse) {
        await axios.put(`${API_URL}/courses/${selectedCourse.course_id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API_URL}/courses/`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      await loadCourses();
      closeModal();
      setShowSaveConfirm(false);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Failed to save course.";
      setErrorModal({ show: true, title: "Save Failed", message: msg });
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}/courses/${selectedCourse.course_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadCourses();
      setShowDeleteConfirm(false);
      closeModal();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Failed to delete course.";
      setErrorModal({ show: true, title: "Delete Failed", message: msg });
    }
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  const filteredCourses = courses.filter((course) =>
    course.course_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedCourses = [...filteredCourses].sort((a, b) => {
    const aVal = a[sortConfig.key].toLowerCase();
    const bVal = b[sortConfig.key].toLowerCase();
    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedCourses.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedCourses = sortedCourses.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="course-management-container">
      <HeaderBar />
      <div className="main-content">
        <div className="page-header">
          <div className="header-left">
            <Plus size={32} color="#062474" />
            <h1 className="page-title">Course Dashboard</h1>
          </div>

          <div className="header-right">
            <div className="search-container">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search courses..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <button className="btn-add" onClick={() => openModal()}>
              <Plus size={16} /> Add Course
            </button>
          </div>
        </div>

        <div className="user-table">
          <div className="table-header">
            <div className="header-cell" onClick={() => handleSort("course_name")}>
              <h3 className="header-title">Course Name</h3>
            </div>
            <div className="header-cell"></div>
          </div>

          <div className="table-body">
            {paginatedCourses.map((course) => (
              <div key={course.course_id} className="table-row">
                <div className="table-cell cell-text">{course.course_name}</div>
                <div className="table-cell actions-cell">
                  <button className="edit-btn" onClick={() => openModal(course)}>
                    <Edit size={18} />
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => {
                      setSelectedCourse(course);
                      setShowDeleteConfirm(true);
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="table-footer">
          <div className="footer-info">
            Showing {paginatedCourses.length} of {filteredCourses.length} courses
          </div>
          <div className="pagination">
            <button
              className="pagination-button primary"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="pagination-info">
              Page {currentPage} of {totalPages}
            </span>
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

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{selectedCourse ? "Edit Course" : "Add Course"}</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowSaveConfirm(true);
              }}
              className="modal-form"
            >
              <label htmlFor="course_name">Course Name</label>
              <input
                id="course_name"
                type="text"
                placeholder="Enter course name"
                value={formData.course_name}
                onChange={(e) => setFormData({ course_name: e.target.value })}
                required
              />
              <div className="modal-actions">
                <button type="submit" className="btn-save">
                  Save
                </button>
                <button type="button" onClick={closeModal} className="btn-cancel">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSaveConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Confirm {selectedCourse ? "Update" : "Add"} Course</h3>
            <p>Are you sure you want to {selectedCourse ? "update" : "add"} this course?</p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setShowSaveConfirm(false)}
              >
                Cancel
              </button>
              <button type="button" className="btn-save" onClick={handleSaveConfirm}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete "{selectedCourse?.course_name}"?</p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button type="button" className="btn-delete" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {errorModal.show && (
        <div className="modal-overlay">
          <div className="modal error-modal">
            <XCircle size={40} color="red" />
            <h3>{errorModal.title}</h3>
            <p>{errorModal.message}</p>
            <button
              className="btn-cancel"
              onClick={() => setErrorModal({ show: false, title: "", message: "" })}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
