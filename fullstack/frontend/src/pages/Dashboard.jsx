import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import "./css/dashboard.css";
import Header from "../components/Header";
import axios from "axios";
import AddQuestionSetModal from "../components/AddQuestionSetModal";
import ImportDatasetModal from "../components/ImportDataSetModal";
import EditModal from "../components/EditModal";


// ✅ Reusable confirmation modal
function ConfirmModal({ show, title, message, onConfirm, onClose }) {
  if (!show) return null;
  return (
    <div className="modal-overlay">
      <div className="modal small">
        <div className="modal-header">
          <h2>{title || "Confirm Action"}</h2>
        </div>
        <div className="modal-body">
          <p>{message || "Are you sure you want to proceed?"}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onConfirm}>
            Yes
          </button>
          <button className="btn-cancel" onClick={onClose}>
            No
          </button>
        </div>
      </div>
    </div>
  );
}
export default function Dashboard() {
  const [selectedSet, setSelectedSet] = useState(null);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [questionSets, setQuestionSets] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [filteredDatasets, setFilteredDatasets] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [records, setRecords] = useState([]);
  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); 
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [originalRecords, setOriginalRecords] = useState([]);
  const [originalQuestions, setOriginalQuestions] = useState([]);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // action modal
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editType, setEditType] = useState(null); 

  // confirm modal state
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: "",
    message: "",
    action: null,
  });
  const [distribution, setDistribution] = useState([]);
  const [distMode, setDistMode] = useState("count"); 
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });


  const openConfirm = (title, message, action) => {
    setConfirmModal({ show: true, title, message, action });
  }
// Compute distribution for datasets (records)
  useEffect(() => {
    if (selectedDataset && records.length > 0) {
      let stem = 0, abm = 0, humss = 0;

      if (distMode === "score") {
        records.forEach((rec) => {
          stem += rec.stem_score || 0;
          abm += rec.abm_score || 0;
          humss += rec.humss_score || 0;
        });
      } else {
        // count by strand
        records.forEach((rec) => {
          if (rec.strand === "STEM") stem++;
          if (rec.strand === "ABM") abm++;
          if (rec.strand === "HUMSS") humss++;
        });
      }

      setDistribution([
        { name: "STEM", value: stem },
        { name: "ABM", value: abm },
        { name: "HUMSS", value: humss },
      ]);
    } else if (selectedSet && questions.length > 0) {
      let stem = 0, abm = 0, humss = 0;

      // question sets only have strands → count
      questions.forEach((q) => {
        if (q.strand === "STEM") stem++;
        if (q.strand === "ABM") abm++;
        if (q.strand === "HUMSS") humss++;
      });

      setDistribution([
        { name: "STEM", value: stem },
        { name: "ABM", value: abm },
        { name: "HUMSS", value: humss },
      ]);
    } else {
      setDistribution([]);
    }
  }, [records, questions, selectedDataset, selectedSet, distMode]);


  useEffect(() => {
    fetchQuestionSets();
    fetchDatasets();
  }, []);

  const fetchQuestionSets = () => {
    axios
      .get(`${API_BASE_URL}/question-sets`)
      .then((res) => setQuestionSets(res.data))
      .catch((err) => console.error("Error fetching question sets:", err));
  };

  const fetchDatasets = () => {
    axios
      .get(`${API_BASE_URL}/datasets`)
      .then((res) => setDatasets(res.data))
      .catch((err) => console.error("Error fetching datasets:", err));
  };

  // 🔑 Filter datasets when a QuestionSet is selected
  useEffect(() => {
    if (selectedSet) {
      const related = datasets.filter(
        (ds) => ds.question_set_id === selectedSet.question_set_id
      );
      setFilteredDatasets(related);
      setSelectedDataset(null);
    } else {
      setFilteredDatasets([]);
    }
  }, [selectedSet, datasets]);

  // 🔑 Load questions for selected QuestionSet
  useEffect(() => {
    if (selectedSet) {
      axios
        .get(
          `${API_BASE_URL}/question-sets/${selectedSet.question_set_id}/questions`
        )
        .then((res) => {
          setQuestions(res.data);
          setOriginalQuestions(res.data); // keep original order for index sort
        })
        .catch((err) => console.error("Error fetching questions:", err));
    } else {
      setQuestions([]);
      setOriginalQuestions([]); // clear when no set selected
    }
  }, [selectedSet]);

  // 🔑 Save edits
  const handleSaveEdit = async (newDesc) => {
  try {
    if (editType === "dataset" && selectedDataset) {
      await axios.put(
        `${API_BASE_URL}/datasets/${selectedDataset.data_set_id}`,
        {
          data_set_name: selectedDataset.data_set_name,
          data_set_description: newDesc,
        }
      );
      fetchDatasets(); // refresh list
    } else if (editType === "set" && selectedSet) {
      await axios.put(
        `${API_BASE_URL}/question-sets/${selectedSet.question_set_id}`,
        {
          question_set_name: selectedSet.question_set_name,
          description: newDesc,
        }
      );
      fetchQuestionSets(); // refresh list
    }
    setShowEditModal(false);
  } catch (err) {
    console.error("Error saving edit:", err);
  }
};

  // 🔑 Load records for selected dataset
  useEffect(() => {
    if (selectedDataset) {
      axios
        .get(`${API_BASE_URL}/datasets/${selectedDataset.data_set_id}/records`)
        .then((res) => {
          setRecords(res.data);
          setOriginalRecords(res.data); // ✅ keep untouched copy
        })
        .catch((err) => console.error("Error fetching records:", err));
    } else {
      setRecords([]);
      setOriginalRecords([]);
    }
  }, [selectedDataset]);


  const handleDeleteDataset = async (id) => {
    await axios.delete(`${API_BASE_URL}/datasets/${id}`);
    setSelectedDataset(null);
    fetchDatasets();
  };

  const handleDeleteQuestionSet = async (id) => {
    await axios.delete(`${API_BASE_URL}/question-sets/${id}`);
    setSelectedSet(null);
    fetchQuestionSets();
  };

  const handleActivateDataset = async (dataset) => {
    try {
      await axios.put(
        `${API_BASE_URL}/activate/${dataset.data_set_id}`,
        { status: "Active" }, 
        { headers: { "Content-Type": "application/json" } }
      );
      fetchDatasets();
    } catch (err) {
      console.error("Error activating dataset:", err);
    }
  };
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortData = (data) => {
    if (!sortConfig.key) return data;

    // special case for index
    if (sortConfig.key === "index") {
      return sortConfig.direction === "asc"
        ? [...originalQuestions]            // reset to API order
        : [...originalQuestions].reverse(); // reversed
    }

    // normal sorting
    return [...data].sort((a, b) => {
      const valA = a[sortConfig.key] ?? "";
      const valB = b[sortConfig.key] ?? "";

      if (typeof valA === "number" && typeof valB === "number") {
        return sortConfig.direction === "asc" ? valA - valB : valB - valA;
      }
      return sortConfig.direction === "asc"
        ? valA.toString().localeCompare(valB.toString())
        : valB.toString().localeCompare(valA.toString());
    });
  };


  // helper for showing arrow
  const getSortArrow = (key) => {
    if (sortConfig.key !== key) return "";
    return sortConfig.direction === "asc" ? " ▲" : " ▼";
  };
  

  

  return (
    <div className="dashboard-container">
      <Header />

      <div className="main-content">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
          <button
            className="btn btn-primary"
            onClick={() => setIsActivateModalOpen(true)}
          >
            Activate Dataset
          </button>
          <input
            type="text"
            placeholder="Search datasets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: "0.4rem 0.8rem", borderRadius: "6px", border: "1px solid #ccc", width: "250px" }}
          />
        </div>

        <div className="top-section">
          {/* Question Sets */}
          <div className="card question-set">
            <div className="card-header">
              <h2>Question Sets</h2>
              <button
                className="btn btn-primary"
                onClick={() => setShowModal(true)}
              >
                Add Question Set
              </button>

              
            </div>
            <div className="card-body">
              <div className="item-container">
                {questionSets.length === 0 ? (
                  <p>No question sets available.</p>
                ) : (
                  <ul className="content-list">
                    {questionSets.map((set) => (
                      <li
                        key={set.question_set_id}
                        className={`question-set-item ${
                          selectedSet?.question_set_id === set.question_set_id ? "Active" : ""
                        }`}
                        onClick={() => {
                          setSelectedSet(set);
                          setSelectedDataset(null);
                        }}
                      >
                        <span>{set.question_set_name}</span>
                        <div className="item-actions">
                          <button
                            className="btn btn-actions"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem(set);
                              setEditType("set");
                              setIsActionModalOpen(true);
                            }}
                          >
                            Actions
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Data Sets */}
          <div className="card dataset">
            <div className="card-header">
              <h2>Data Sets</h2>
              <button
                className="btn btn-primary"
                onClick={() => setShowImportModal(true)}
              >
                Import Data
              </button>

              
            </div>
            <div className="card-body">
              <div className="item-container">
                {selectedSet ? (
                  filteredDatasets.length === 0 ? (
                    <p>No data sets for this question set.</p>
                  ) : (
                    <ul className="content-list">
                      {filteredDatasets.map((dataset) => (
                        <li
                          key={dataset.data_set_id}
                          className={`dataset-item ${
                            selectedDataset?.data_set_id === dataset.data_set_id ? "Active" : ""
                          }`}
                          onClick={() => setSelectedDataset(dataset)}
                        >
                          <span>
                            {dataset.data_set_name} {dataset.active ? "(Active)" : ""}
                          </span>
                          <div className="item-actions">
                            <button
                              className="btn btn-actions"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedItem(dataset);
                                setEditType("dataset");
                                setIsActionModalOpen(true);
                              }}
                            >
                              Actions
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>

                  )
                ) : (
                  <p>Select a question set to view its datasets.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="bottom-section">
          {/* Description */}
          <div className="card description">
            <div className="card-header">
              <h2>Description</h2>
            </div>
            <div className="card-body">
              {selectedDataset ? (
                <>
                  <h3>{selectedDataset.data_set_name}</h3>
                  <p>
                    <strong>Status:</strong> {selectedDataset.status} <br />
                    <strong>Description:</strong>{" "}
                    {selectedDataset.data_set_description || "No description"}
                    <br />
                    <strong>Created At:</strong>{" "}
                    {new Date(selectedDataset.created_at).toLocaleString()}
                  </p>
                  
                </>
              ) : selectedSet ? (
                <>
                  <h3>{selectedSet.question_set_name}</h3>
                  <p>
                    
                    <strong>Description:</strong>{" "}
                    {selectedSet.description || "No description"} <br />
                    <strong>Created At:</strong>{" "}
                    {new Date(selectedSet.created_at).toLocaleString()}
                  </p>
                  
                </>
              ) : (
                <p>Select a set or dataset to see details.</p>
              )}
              <div className="stats">
                {selectedDataset ? (
                  <>
                    <div>
                      <h4>{selectedDataset.rows || 0}</h4>
                      <p>Rows</p>
                    </div>
                    <div>
                      <h4>{selectedDataset.best_k ?? "-"}</h4>
                      <p>Best K</p>
                    </div>
                    <div>
                      <h4>
                        {selectedDataset.accuracy != null
                          ? (selectedDataset.accuracy * 100).toFixed(2) + "%"
                          : "-"}
                      </h4>
                      <p>Accuracy</p>
                    </div>
                  </>
                ) : selectedSet ? (
                  <div>
                    <h4>{selectedSet.total_questions || 0}</h4>
                    <p>Questions</p>
                  </div>
                ) : null}
              </div>

              {/* Toggle for count/score only when dataset is selected */}
              {selectedDataset && (
                <div style={{ margin: "10px 0" }}>
                  <button
                    onClick={() =>
                      setDistMode(distMode === "count" ? "score" : "count")
                    }
                    className="btn btn-primary"
                  >
                    Switch to {distMode === "count" ? "Score" : "Count"} View
                  </button>
                </div>
              )}

              {/* Pie Chart */}
              {distribution.length > 0 && (
                <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                  <PieChart width={300} height={250}>
                    <Pie
                      data={distribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#4cafef" />
                      <Cell fill="#ff9800" />
                      <Cell fill="#8bc34a" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </div>
              )}

            </div>
          </div>

          {/* Table View */}
          <div className="card connected">
            <div className="card-header">
              <h2>Table View</h2>
            </div>
            <div className="card-body">
              {selectedDataset ? (
                records.length === 0 ? (
                  <p>No records for this dataset.</p>
                ) : (
                  
                  <table className="question-table">
                    <thead>
                      <tr>
                        <th onClick={() => handleSort("index")}>#{getSortArrow("index")}</th>
                        <th onClick={() => handleSort("strand")}>Strand{getSortArrow("strand")}</th>
                        <th onClick={() => handleSort("stem_score")}>STEM{getSortArrow("stem_score")}</th>
                        <th onClick={() => handleSort("abm_score")}>ABM{getSortArrow("abm_score")}</th>
                        <th onClick={() => handleSort("humss_score")}>HUMSS{getSortArrow("humss_score")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortData(records, sortConfig.key).map((rec, index) => (
                        <tr key={rec.data_id}>
                          <td>{index + 1}</td>
                          <td>{rec.strand}</td>
                          <td>{rec.stem_score}</td>
                          <td>{rec.abm_score}</td>
                          <td>{rec.humss_score}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              ) : selectedSet ? (
                questions.length === 0 ? (
                  <p>No questions for this set.</p>
                ) : (
                  <table className="question-table">
                    <thead>
                      <tr>
                        <th onClick={() => handleSort("index")}>
                          # {getSortArrow("index")}
                        </th>
                        <th onClick={() => handleSort("question_text")}>
                          Question {getSortArrow("question_text")}
                        </th>
                        <th onClick={() => handleSort("strand")}>
                          Strand {getSortArrow("strand")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortData(questions).map((q, index) => (
                        <tr key={q.question_id}>
                          <td>{index + 1}</td>
                          <td>{q.question_text}</td>
                          <td>{q.strand}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              ) : (
                <p>Select a set or dataset to view details.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <EditModal
        show={showEditModal}
        onClose={() =>
          openConfirm(
            "Discard Changes?",
            "Are you sure you want to discard your edits?",
            () => {
              setShowEditModal(false);
              setConfirmModal({ show: false });
            }
          )
        }
        onSave={(newDesc) =>
          openConfirm("Confirm Save", "Do you want to save these changes?", () => {
            handleSaveEdit(newDesc);
            setConfirmModal({ show: false });
          })
        }
        item={editType === "dataset" ? selectedDataset : selectedSet}
        type={editType}
      />
      <AddQuestionSetModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={(newSet) =>
          setQuestionSets([...questionSets, newSet])
        }
      />
      <ImportDatasetModal
        show={showImportModal}
        onClose={() => setShowImportModal(false)}
        questionSets={questionSets}
        onSuccess={(newDataset) =>
          setDatasets([...datasets, newDataset])
        }
      />   
      {/* Action Modal */}
      {isActionModalOpen && selectedItem && (
        <div className="modal-overlay">
          <div className="modal small">
            <h2>Actions</h2>
            <p>
              What do you want to do with{" "}
              <strong>
                {selectedItem.data_set_name || selectedItem.question_set_name}
              </strong>
              ?
            </p>

            <div className="modal-actions">
              {/* Edit */}
              <button
                className="btn-save"
                onClick={() => {
                  setShowEditModal(true);
                  setIsActionModalOpen(false);
                }}
              >
                Edit
              </button>

              {/* Delete */}
              <button
                className="btn-delete"
                onClick={() =>
                  openConfirm(
                    `Delete ${editType === "dataset" ? "Dataset" : "Question Set"}`,
                    "Are you sure you want to delete this item?",
                    () => {
                      if (editType === "dataset") {
                        handleDeleteDataset(selectedItem.data_set_id);
                      } else {
                        handleDeleteQuestionSet(selectedItem.question_set_id);
                      }
                      setConfirmModal({ show: false });
                      setIsActionModalOpen(false);
                    }
                  )
                }
              >
                Delete
              </button>

        
              {/* Cancel just closes */}
              <button
                className="btn-cancel"
                onClick={() => setIsActionModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        show={confirmModal.show}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.action}
        onClose={() => setConfirmModal({ ...confirmModal, show: false })}
      />
    {isActivateModalOpen && (
      <div className="modal-overlay">
        <div className="modal large">
          <h2>Activate Dataset</h2>
          <p>Click "Activate" to make a dataset active.</p>

          <table className="question-table">
            <thead>
              <tr>
                <th>Dataset Name</th>
                <th>Connected Question Set</th>
                <th>Date Created</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sortData(
                datasets.filter(ds => ds.data_set_name.toLowerCase().includes(searchQuery.toLowerCase())),
                sortConfig.key
              )
                .map(ds => {
                  const setName =
                    questionSets.find(s => s.question_set_id === ds.question_set_id)?.question_set_name ||
                    "-";
                  return (
                    <tr key={ds.data_set_id}>
                      <td>{ds.data_set_name}</td>
                      <td>{setName}</td>
                      <td>{new Date(ds.created_at).toLocaleString()}</td>
                      <td>
                        {ds.status === "Active" ? (
                          <span className="status-badge active">Active</span>
                        ) : (
                          <span className="status-badge inactive">Inactive</span>
                        )}
                      </td>
                      <td>
                        {!ds.active && (
                          <button
                            className="btn-primary"
                            onClick={() => {
                              handleActivateDataset(ds);
                              setIsActivateModalOpen(false);
                            }}
                          >
                            Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>

          <div style={{ marginTop: "1rem", textAlign: "right" }}>
            <button className="btn-cancel" onClick={() => setIsActivateModalOpen(false)}>
              Close
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
    
  );
}