import React, { useState } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import "./css/AddQuestionSetModal.css"; // reuse same styles

export default function AddQuestionSetModal({ show, onClose, onSuccess }) {
  const [fileName, setFileName] = useState("");
  const [questions, setQuestions] = useState([]);
  const [questionSetName, setQuestionSetName] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL;
  if (!show) return null;

  const resetForm = () => {
    setQuestionSetName("");
    setDescription("");
    setFileName("");
    setQuestions([]);
    setErrorDetails(null);
  };

  // ============================
  // Handle File Upload
  // ============================
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const workbook = XLSX.read(evt.target.result, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      const formatted = rows.map((row, i) => ({
        question_text: row["Questions"] || `Row ${i + 1} missing question`,
        strand: row["Strand"] || "N/A",
      }));

      setQuestions(formatted);
    };
    reader.readAsBinaryString(file);
  };

  // ============================
  // Save Question Set
  // ============================
  const handleSave = async () => {
    if (!questionSetName.trim() || !description.trim() || !fileName) {
      alert("All fields are required!");
      return;
    }

    const payload = {
      question_set_name: questionSetName,
      description,
      questions,
    };

    setIsUploading(true);
    setErrorDetails(null);

    try {
      const res = await axios.post(`${API_BASE_URL}/question-sets`, payload);
      onSuccess(res.data);
      resetForm();
      onClose();
    } catch (err) {
      console.error("Save failed:", err);
      const data = err.response?.data;
      setErrorDetails({ message: data?.error || err.message });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose}></div>

      {!errorDetails && (
        <div className="modal-container">
          <h2 className="modal-title">Import Question Set</h2>

          <p style={{ color: "#062474" }}>
            Upload an Excel/CSV file with only <b>Strand</b> and <b>Questions</b> columns.
          </p>

          <input
            type="text"
            placeholder="Question Set Name"
            value={questionSetName}
            onChange={(e) => setQuestionSetName(e.target.value)}
            className="modal-input"
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="modal-textarea"
          />

          <div className="file-upload-wrapper">
            <label htmlFor="questionset-file" className="btn-upload">
              Choose File
            </label>
            <input
              id="questionset-file"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
          </div>
          {fileName && <p className="file-name">Selected: {fileName}</p>}

          {questions.length > 0 && (
            <div className="preview">
              <h3 className="preview-title">Preview</h3>
              <table className="preview-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Questions</th>
                    <th>Strand</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.slice(0, 5).map((q, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{q.question_text}</td>
                      <td>{q.strand}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {questions.length > 5 && <p>Showing first 5 rows...</p>}
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
              Save
            </button>
          </div>
        </div>
      )}

      {isUploading && (
        <div className="loading-overlay">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Importing dataset, please wait...</p>
          </div>
        </div>
      )}

      {errorDetails && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setErrorDetails(null)}></div>

          <div className="modal-container" style={{ maxWidth: "400px", textAlign: "center" }}>
            <h2 style={{ color: "red", marginBottom: "10px" }}>Save Failed</h2>
            <p>
              Something went wrong while saving your question set. Please check your inputs and try again.
            </p>

            <div className="modal-actions" style={{ justifyContent: "center", marginTop: "15px" }}>
              <button
                className="btn-cancel"
                onClick={() => setErrorDetails(null)}
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
