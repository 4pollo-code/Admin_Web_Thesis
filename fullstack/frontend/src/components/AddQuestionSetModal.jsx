import React, { useState } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import "./css/AddQuestionSetModal.css";


export default function AddQuestionSetModal({ show, onClose, onSuccess }) {
  const [fileName, setFileName] = useState("");
  const [questions, setQuestions] = useState([]);
  const [questionSetName, setQuestionSetName] = useState("");
  const [description, setDescription] = useState("");
  const API_BASE_URL = process.env.REACT_APP_API_URL;

  if (!show) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const workbook = XLSX.read(evt.target.result, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      const formatted = rows.map((row, i) => ({
        question_text: row["Questions"] || `Row ${i + 1} missing question`,
        strand: row["Strand"] || "N/A",
      }));

      setQuestions(formatted);
    };
    reader.readAsBinaryString(file);
  };

  const handleSave = async () => {
  const payload = {
    question_set_name: questionSetName,
    description,
    questions,
  };
  console.log("Saving", payload);

  try {
    console.log("Submitting to backend...");
    const res = await axios.post(`${API_BASE_URL}/question-sets`, payload);
    console.log("Save successful", res.data);
    onSuccess(res.data);  // pass new set back to parent
    console.log(res.data);
    onClose();
  } catch (err) {
    console.error("Save failed", err);
    alert("Save failed: " + (err.response?.data?.error || err.message));
  }
};


  return (
    <div className="modal-overlay">
      {/* backdrop */}
      <div className="modal-backdrop" onClick={onClose}></div>

      {/* modal box */}
      <div className="modal-container">
        <h2 className="modal-title">Import Question Set</h2>

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

        <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
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
                {questions.map((q, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{q.question_text}</td>
                    <td>{q.strand}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* actions */}
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
