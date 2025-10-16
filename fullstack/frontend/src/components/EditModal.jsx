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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal medium">
        <h2>Edit {type === "record" ? "Record" : "Question"}</h2>

        <div className="modal-body">
          {type === "record" ? (
            <>
              <label>Strand:</label>
              <input name="strand" value={formData.strand || ""} onChange={handleChange} />

              <label>STEM Score:</label>
              <input name="stem_score" value={formData.stem_score || ""} onChange={handleChange} />

              <label>ABM Score:</label>
              <input name="abm_score" value={formData.abm_score || ""} onChange={handleChange} />

              <label>HUMSS Score:</label>
              <input name="humss_score" value={formData.humss_score || ""} onChange={handleChange} />
            </>
          ) : (
            <>
              <label htmlFor="question_text">Question Text:</label>
              <textarea
                id="question_text"
                name="question_text"
                className="edit-modal-textarea"
                value={formData.question_text || ""}
                onChange={handleChange}
                placeholder="Enter the question text here..."
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
