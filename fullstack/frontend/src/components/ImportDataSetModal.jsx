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
  const [isUploading, setIsUploading] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL;
  if (!show) return null;

  const resetForm = () => {
    setDatasetName("");
    setDescription("");
    setSelectedSetId("");
    setFileName("");
    setRows([]);
    setErrorDetails(null);
  };

  // ============================
  // 📁 Handle File Upload
  // ============================
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const workbook = XLSX.read(evt.target.result, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: true });
      setRows(data);
    };
    reader.readAsBinaryString(file);
  };

  // ============================
  // 💾 Handle Save / Import
  // ============================
  const handleSave = async () => {
    if (!datasetName.trim() || !description.trim() || !selectedSetId || !fileName) {
      alert("All fields are required!");
      return;
    }

    const payload = {
      dataset_name: datasetName,
      description,
      question_set_id: selectedSetId,
      rows,
    };

    setIsUploading(true);
    setErrorDetails(null);

    try {
      const res = await axios.post(`${API_BASE_URL}/import_dataset`, payload);
      resetForm();
      onSuccess(res.data);
      onClose();
    } catch (err) {
      console.error("❌ Import failed:", err);
      const data = err.response?.data;

      // === Handle different error scenarios ===
      if (data?.error?.includes("already exists")) {
        // Duplicate dataset name error
        setErrorDetails({
          message: "A dataset with this name already exists. Please use a different name.",
        });
      } else if (data?.missing_questions || data?.extra_questions || data?.missing_strand_rows) {
        // Validation-related errors
        setErrorDetails({
          missingQuestions: data.missing_questions || [],
          extraQuestions: data.extra_questions || [],
          missingStrands: data.missing_strand_rows || [],
          message: data.error || "Import failed due to missing or invalid data.",
        });
      } else {
        // Unknown/general error
        setErrorDetails({
          message: data?.error || err.message || "An unknown error occurred.",
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose}></div>

      {/* === MAIN MODAL === */}
      {!errorDetails && (
        <div className="modal-container">
          <h2 className="modal-title">Import Dataset</h2>

          <input
            type="text"
            placeholder="Dataset Name"
            value={datasetName}
            onChange={(e) => setDatasetName(e.target.value)}
            className="modal-input"
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="modal-textarea"
          />

          <select
            className="modal-input"
            value={selectedSetId}
            onChange={(e) => setSelectedSetId(e.target.value)}
          >
            <option value="">Select Question Set</option>
            {questionSets.map((set) => (
              <option key={set.question_set_id} value={set.question_set_id}>
                {set.question_set_name}
              </option>
            ))}
          </select>

          <div className="file-upload-wrapper">
            <label htmlFor="dataset-file" className="btn-upload">
              Choose File
            </label>
            <input
              id="dataset-file"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
          </div>

          {fileName && <p className="file-name">Selected: {fileName}</p>}

          {rows.length > 0 && (
            <div className="preview">
              <h3 className="preview-title">Preview</h3>
              <table className="preview-table">
                <thead>
                  <tr>
                    {Object.keys(rows[0] || {}).map((col, i) => (
                      <th key={i}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((row, i) => (
                    <tr key={i}>
                      {Object.keys(rows[0]).map((col, j) => (
                        <td key={j}>{row[col]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 5 && <p>Showing first 5 rows...</p>}
            </div>
          )}

          <div className="modal-actions">
            <button
              className="btn-cancel"
              onClick={() => {
                resetForm();
                onClose();
              }}
            >
              Cancel
            </button>
            <button className="btn-save" onClick={handleSave}>
              Import
            </button>
          </div>
        </div>
      )}

      {/* === LOADING OVERLAY === */}
      {isUploading && (
        <div className="loading-overlay">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Importing dataset, please wait...</p>
          </div>
        </div>
      )}

      {/* === ERROR MODAL === */}
      {errorDetails && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setErrorDetails(null)}></div>

          <div className="modal-container" style={{ maxWidth: "500px", textAlign: "center" }}>
            <h2 style={{ color: "red", marginBottom: "10px" }}>Import Failed</h2>
            <p>{errorDetails.message}</p>

            {errorDetails.missingQuestions?.length > 0 && (
              <>
                <h4 className="error-list-message">Missing Questions</h4>
                <div className="error-list-container">
                  <ul className="error-list">
                    {errorDetails.missingQuestions.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            <div className="modal-actions" style={{ justifyContent: "center", marginTop: "15px" }}>
              <button className="btn-cancel" onClick={() => setErrorDetails(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
