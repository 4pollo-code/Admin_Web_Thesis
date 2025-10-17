import React, { useState, useEffect } from "react";
import "./css/EditModal.css";

export default function EditModal({ show, onClose, onSave, item, type }) {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (item) {
      setFormData(item);
    }
  }, [item]);

  if (!show) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal medium">
        <h2>
          Edit{" "}
          {type === "dataset"
            ? "Dataset"
            : type === "set"
            ? "Question Set"
            : "Question"}
        </h2>

        <div className="modal-body">
          {type === "dataset" && (
            <>
              <label htmlFor="data_set_name">Dataset Name:</label>
              <input
                id="data_set_name"
                name="data_set_name"
                value={formData.data_set_name || ""}
                onChange={handleChange}
                className="edit-modal-input"
                placeholder="Enter dataset name"
              />

              <label htmlFor="data_set_description">Description:</label>
              <textarea
                id="data_set_description"
                name="data_set_description"
                className="edit-modal-textarea"
                value={formData.data_set_description || ""}
                onChange={handleChange}
                placeholder="Enter dataset description"
              />
            </>
          )}

          {type === "set" && (
            <>
              <label htmlFor="question_set_name">Question Set Name:</label>
              <input
                id="question_set_name"
                name="question_set_name"
                value={formData.question_set_name || ""}
                onChange={handleChange}
                className="edit-modal-input"
                placeholder="Enter question set name"
              />

              <label htmlFor="description">Description:</label>
              <textarea
                id="description"
                name="description"
                className="edit-modal-textarea"
                value={formData.description || ""}
                onChange={handleChange}
                placeholder="Enter description for the question set"
              />
            </>
          )}

          {type === "question" && (
            <>
              <label htmlFor="question_text">Question Text:</label>
              <textarea
                id="question_text"
                name="question_text"
                className="edit-modal-textarea"
                value={formData.question_text || ""}
                onChange={handleChange}
                placeholder="Enter the question text"
              />

              <label htmlFor="strand">Strand:</label>
              <select
                id="strand"
                name="strand"
                className="edit-modal-select"
                value={formData.strand || ""}
                onChange={handleChange}
              >
                <option value="STEM">STEM</option>
                <option value="ABM">ABM</option>
                <option value="HUMSS">HUMSS</option>
              </select>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={handleSubmit}>
            Save
          </button>
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
