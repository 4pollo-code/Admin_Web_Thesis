import React, { useState } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import "./css/AddQuestionSetModal.css"; // reuse same styles

export default function ImportDataSetModal({ show, onClose, onSuccess, questionSets }) {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState([]);
  const [datasetName, setDatasetName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSetId, setSelectedSetId] = useState("");
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  if (!show) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const workbook = XLSX.read(evt.target.result, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet);

      setRows(data);
    };
    reader.readAsBinaryString(file);
  };

  const handleSave = async () => {
    if (!datasetName.trim() || !description.trim() || !selectedSetId || !fileName) {
      alert("All fields are required!");
      return;
    }

    const payload = {
      dataset_name: datasetName,
      description,
      question_set_id: selectedSetId,
      rows: rows, // rows parsed from Excel, including strand + scores
    };
    console.log("Importing dataset", payload);
 

   try {
      const res = await axios.post(`${API_BASE_URL}/import_dataset`, payload);
      alert("Dataset imported successfully!");
      onSuccess(res.data);
      onClose();
    } catch (err) {
      console.error("Import failed", err);
      alert("Import failed: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose}></div>

      <div className="modal-container">
        <h2 className="modal-title">Import Dataset</h2>

        {/* Dataset Name */}
        <input
          type="text"
          placeholder="Dataset Name"
          value={datasetName}
          onChange={(e) => setDatasetName(e.target.value)}
          className="modal-input"
          required
        />

        {/* Description */}
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="modal-textarea"
          required
        />

        {/* Question Set Dropdown */}
        <select
          className="modal-input"
          value={selectedSetId}
          onChange={(e) => setSelectedSetId(e.target.value)}
          required
        >
          <option value="">Select Question Set</option>
          {questionSets.map((set) => (
            <option key={set.question_set_id} value={set.question_set_id}>
              {set.question_set_name}
            </option>
          ))}
        </select>

        {/* File Upload */}
        <input
          id="dataset-file"
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileUpload}
          required
        />
        {fileName && <p className="file-name">Selected: {fileName}</p>}

        {/* Preview */}
        {rows.length > 0 && (
          <div className="preview">
            <h3 className="preview-title">Preview</h3>
            <table className="preview-table">
              <thead>
                <tr>
                  {Object.keys(rows[0]).map((col, i) => (
                    <th key={i}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((val, j) => (
                      <td key={j}>{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="preview-note">Showing first 5 rows</p>
          </div>
        )}

        {/* Actions */}
        <div className="modal-actions">
          <button onClick={onClose} className="btn-cancel">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-save">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
