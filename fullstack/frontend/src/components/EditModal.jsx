import React, { useState, useEffect } from "react";
import "./css/EditModal.css";

export default function EditModal({ show, onClose, onSave, item, type }) {
  const [formData, setFormData] = useState({ name: "", description: "" });

  // Populate form when modal opens
  useEffect(() => {
    if (item) {
      setFormData({
        name: type === "dataset" ? item.data_set_name : item.question_set_name,
        description:
          type === "dataset"
            ? item.data_set_description || ""
            : item.description || "",
      });
    }
  }, [item, type]);

  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData.description); // ✅ only description is editable
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Edit {type === "dataset" ? "Dataset" : "Question Set"}</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          <label>Name</label>
          <input
            type="text"
            value={formData.name}
            disabled // name cannot be edited (only description)
          />

          <label>Description</label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />

          <div className="modal-actions">
            <button type="submit" className="btn-save">
              Save
            </button>
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
