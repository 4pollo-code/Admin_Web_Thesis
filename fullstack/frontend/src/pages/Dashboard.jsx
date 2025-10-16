import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Edit, RefreshCw  } from "lucide-react"
import "./css/dashboard.css";
import Header from "../components/Header";
import axios from "axios";
import AddQuestionSetModal from "../components/AddQuestionSetModal";
import ImportDatasetModal from "../components/ImportDataSetModal";
import { useNavigate } from "react-router-dom";
import EditModal from "../components/EditModal";


function LoadingOverlay({ show, text }) {
  if (!show) return null;
  return (
    <div className="loading-overlay">
      <div className="spinner"></div>
      <p>{text}</p>
    </div>
  );
}

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
  const [currentPage, setCurrentPage] = useState(1);
  const [originalRecords, setOriginalRecords] = useState([]);
  const [deleteLoadig, setDeleteLoadig] = useState(false);
  const [originalQuestions, setOriginalQuestions] = useState([]);
  const [activatingDatasetId, setActivatingDatasetId] = useState(null);
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_URL;
  const token = sessionStorage.getItem('token');
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editType, setEditType] = useState(null); 
  const [confirmModal, setConfirmModal] = useState({show: false, title: "", message: "", action: null,});
  const [deletingItemType, setDeletingItemType] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [searchQuestionSet, setSearchQuestionSet] = useState("");
  const [searchDataset, setSearchDataset] = useState("");
  const [addingSet, setAddingSet] = useState(false);
  const [importing, setImporting] = useState(false);
  const [distribution, setDistribution] = useState([]);
  const [distMode, setDistMode] = useState("count"); 
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });


  const openConfirm = (title, message, action) => {
    setConfirmModal({ show: true, title, message, action });
  }

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
        // Count by strand (normalize variations)
        records.forEach((rec) => {
          const strand = (rec.strand || "").toUpperCase().trim();

          if (
            strand.includes("STEM") ||
            strand.includes("SCIENCE, TECHNOLOGY, ENGINEERING AND MATHEMATICS")
          ) {
            stem++;
          } else if (
            strand.includes("ABM") ||
            strand.includes("ACCOUNTANCY AND BUSINESS MANAGEMENT")
          ) {
            abm++;
          } else if (
            strand.includes("HUMSS") ||
            strand.includes("HUMANITIES AND SOCIAL SCIENCES")
          ) {
            humss++;
          }
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
    checkToken()
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [datasets, searchQuery]);

  useEffect(() => {
    setSortConfig({ key: "data_set_name", direction: "asc" });
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
    } catch (err) {
        console.error("Error fetching initial data:", err);
        navigate("/");
    }
    
  };

  const fetchQuestionSets = () => {
    axios
      .get(`${API_BASE_URL}/question-sets`, {headers: { Authorization: `Bearer ${token}` }})
      .then((res) => setQuestionSets(res.data))
      .catch((err) => console.error("Error fetching question sets:", err));
  };

  const fetchDatasets = () => {
    axios
      .get(`${API_BASE_URL}/datasets`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setDatasets(res.data);

        // ✅ Automatically select the active dataset
        const activeDataset = res.data.find(ds => ds.status === "Active");
        if (activeDataset) {
          setSelectedDataset(activeDataset);
        }
      })
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
          `${API_BASE_URL}/question-sets/${selectedSet.question_set_id}/questions`, {headers: { Authorization: `Bearer ${token}` }},
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
  const handleSaveEdit = async (newData) => {
    try {
      if (editType === "dataset" && selectedItem) {
        await axios.put(
          `${API_BASE_URL}/datasets/${selectedItem.data_set_id}`,
          {
            data_set_name: selectedItem.data_set_name,
            data_set_description: newData,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        await fetchDatasets();

      } else if (editType === "set" && selectedItem) {
        await axios.put(
          `${API_BASE_URL}/questions/${selectedItem.question_set_id}`,
          {
            question_set_name: selectedItem.question_set_name,
            description: newData,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        await fetchQuestionSets();

      } else if (editType === "question" && selectedItem) {
        await axios.put(
          `${API_BASE_URL}/questions/${selectedItem.question_id}`,
          {
            question_text: newData.question_text,
            strand: newData.strand,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        await fetchQuestionSets(); // refresh questions
      }

      // ✅ Close modal after successful edit
      setShowEditModal(false);
      setSelectedItem(null);
      setEditType(null);

    } catch (err) {
      console.error("❌ Error saving edit:", err);
    }
  };
  
  const handleEditRow = (item, type) => {
  setSelectedItem(item);     // store which record/question is being edited
  setEditType(type);         // type can be "record" or "question"
  setShowEditModal(true);    // open the edit modal
};
  // 🔑 Load records for selected dataset
  useEffect(() => {
    if (selectedDataset) {
      axios
        .get(`${API_BASE_URL}/datasets/${selectedDataset.data_set_id}/records`, { headers: { Authorization: `Bearer ${token}` } })
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
    try {
      setDeletingItemType("dataset");
      setDeleteLoadig(true); // start loading
      // Delete dataset
      await axios.delete(`${API_BASE_URL}/datasets/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSelectedDataset(null);

      await fetchDatasets();
    } catch (err) {
      console.error("Error deleting dataset:", err);
    } finally {
      setDeleteLoadig(false); // stop loading regardless of success/error
      setDeletingItemType("");
    }
  };


  const handleDeleteQuestionSet = async (id) => {
    try {
      setDeletingItemType("question set");
      setDeleteLoadig(true); // start loading
      // Delete the question set
      await axios.delete(`${API_BASE_URL}/question-sets/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSelectedSet(null);

      // Refresh the list
      await fetchQuestionSets();
    } catch (err) {
      console.error("Error deleting question set:", err);
    } finally {
      setDeleteLoadig(false); // stop loading
      setDeletingItemType("");
    }
  };

  const handleActivateDataset = async (dataset) => {
    setActivatingDatasetId(dataset.data_set_id); // start loading
    try {
      await axios.put(
        `${API_BASE_URL}/activate/${dataset.data_set_id}`,
        { status: "Active" },
        { headers: { "Content-Type": "application/json" } }
      );
      await fetchDatasets(); // refresh list
    } catch (err) {
      console.error("Error activating dataset:", err);
    } finally {
      setActivatingDatasetId(null); // stop loading
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

  const getSortedDatasetsForModal = () => {
    // Separate active datasets from inactive
    const activeDatasets = datasets.filter(ds => ds.status === "Active");
    const inactiveDatasets = datasets.filter(ds => ds.status !== "Active");

    // Sort only the inactive datasets based on sortConfig
    if (sortConfig.key) {
      inactiveDatasets.sort((a, b) => {
        const valA = a[sortConfig.key] ?? "";
        const valB = b[sortConfig.key] ?? "";

        if (typeof valA === "number" && typeof valB === "number") {
          return sortConfig.direction === "asc" ? valA - valB : valB - valA;
        }

        return sortConfig.direction === "asc"
          ? valA.toString().localeCompare(valB.toString())
          : valB.toString().localeCompare(valA.toString());
      });
    }

    // Return Active first, then sorted inactive
    return [...activeDatasets, ...inactiveDatasets];
  };

  const getSortArrow = (key) => {
    if (sortConfig.key !== key) return "";
    return sortConfig.direction === "asc" ? " ▲" : " ▼";
  };
  
  return (
    <div className="dashboard-container">
      <LoadingOverlay show={addingSet} text="Adding Question Set..." />
      <LoadingOverlay show={importing} text="Importing Dataset..." />
      <Header />

      <div className="main-content">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
          <button
            className="btn btn-primary"
            onClick={() => setIsActivateModalOpen(true)}
          >
            Activate Dataset
          </button>
        </div>
        <button
          className="refresh-btn"
          onClick={() => {
            fetchQuestionSets();
            fetchDatasets();
          }}
        >
          <RefreshCw />
        </button>
        <div className="top-section">
          {/* Question Sets */}
          <div className="card question-set">
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2>Question Sets</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input
                  type="text"
                  placeholder="Search question sets..."
                  value={searchQuestionSet}
                  onChange={(e) => setSearchQuestionSet(e.target.value)}
                  style={{ padding: "0.4rem 0.8rem", borderRadius: "6px", border: "1px solid #ccc", width: "180px" }}
                />
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>Add Question Set</button>
              </div>
            </div>
            <div className="card-body">
              <div className="item-container">
                {questionSets.length === 0 ? (
                  <p>No question sets available.</p>
                ) : (
                  <ul className="content-list">
                    {questionSets.filter(qs =>
                      qs.question_set_name.toLowerCase().includes(searchQuestionSet.toLowerCase())
                    ).map((set) => (
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
                            className="btn btn-edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem(set);
                              setEditType("set");
                              setIsActionModalOpen(true);
                            }}
                          >
                            <Edit size={25} />                           
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
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2>Data Sets</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input
                  type="text"
                  placeholder="Search datasets..."
                  value={searchDataset}
                  onChange={(e) => setSearchDataset(e.target.value)}
                  style={{ padding: "0.4rem 0.8rem", borderRadius: "6px", border: "1px solid #ccc", width: "180px" }}
                />
                <button className="btn btn-primary" onClick={() => setShowImportModal(true)}>Add Dataset</button>
              </div>
            </div>
            <div className="card-body">
              <div className="item-container">
                {selectedSet ? (
                  filteredDatasets.length === 0 ? (
                    <p>No data sets for this question set.</p>
                  ) : (
                    <ul className="content-list">
                      {filteredDatasets
                        .filter(ds => ds.data_set_name.toLowerCase().includes(searchDataset.toLowerCase()))
                        .map((dataset) => (
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
                                <Edit size={25} />
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
                        <th onClick={() => handleSort("index")}># {getSortArrow("index")}</th>
                        <th onClick={() => handleSort("question_text")}>Question {getSortArrow("question_text")}</th>
                        <th onClick={() => handleSort("strand")}>Strand {getSortArrow("strand")}</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortData(questions).map((q, index) => (
                        <tr key={q.question_id}>
                          <td>{index + 1}</td>
                          <td>{q.question_text}</td>
                          <td>{q.strand}</td>
                          <td>
                            <button
                              className="btn btn-edit"
                              onClick={() => handleEditRow(q, "question")}
                            >
                              <Edit size={20} />
                            </button>
                          </td>
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
        item={selectedItem}
        type={editType}
      />

      <AddQuestionSetModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={async () => {
          setAddingSet(true);
          await new Promise(resolve => setTimeout(resolve, 100));

          try {
            await fetchQuestionSets(); 
            setSuccessMessage("Questions imported successfully!");
            setShowSuccessModal(true); 
          } finally {
            setAddingSet(false);
            setShowModal(false);
          }
        }}
      />
      <ImportDatasetModal
        show={showImportModal}
        onClose={() => setShowImportModal(false)}
        questionSets={questionSets}
        onSuccess={async () => {
          setImporting(true);
          await new Promise(resolve => setTimeout(resolve, 100));

          try {
            await fetchDatasets(); 
            setSuccessMessage("Dataset imported successfully!");
            setShowSuccessModal(true); 
          } finally {
            setImporting(false);
            setShowImportModal(false);
          }
        }}
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
      {deleteLoadig && (
        <div className="loading-overlay">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Deleting {deletingItemType}, please wait...</p>
          </div>
        </div>
      )}
    {isActivateModalOpen && (
      <div className="modal-overlay">
        <div className="modal large">
          <h2 style={{ color: "black" }}>Activate Dataset</h2>
          <p>Click "Activate" to make a dataset active.</p>

          <table className="question-table">
            <thead>
              <tr>
                <th onClick={() => handleSort("data_set_name")}>
                  Dataset Name {getSortArrow("data_set_name")}
                </th>
                <th onClick={() => handleSort("question_set_id")}>
                  Connected Question Set {getSortArrow("question_set_id")}
                </th>
                <th onClick={() => handleSort("created_at")}>
                  Date Created {getSortArrow("created_at")}
                </th>
                <th onClick={() => handleSort("status")}>
                  Status {getSortArrow("status")}
                </th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {getSortedDatasetsForModal()
                .filter(ds =>
                  ds.data_set_name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .slice((currentPage - 1) * 5, currentPage * 5)
                .map(ds => {
                  const setName =
                    questionSets.find(s => s.question_set_id === ds.question_set_id)?.question_set_name || "-";
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
                        {ds.status !== "Active" && (
                          <button
                            className="btn-primary"
                            onClick={() => handleActivateDataset(ds)}
                            disabled={activatingDatasetId === ds.data_set_id}
                          >
                            {activatingDatasetId === ds.data_set_id ? "Activating..." : "Activate"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination" style={{ paddingTop: "25px" }}>
            <button
              className="btn-cancel"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {Math.ceil(datasets.length / 5)}
            </span>
            <button
              className="btn-cancel"
              onClick={() =>
                setCurrentPage(prev => Math.min(prev + 1, Math.ceil(datasets.length / 5)))
              }
              disabled={currentPage === Math.ceil(datasets.length / 5)}
            >
              Next
            </button>
          </div>

          <div style={{ marginTop: "1rem", textAlign: "right" }}>
            <button className="btn-cancel" onClick={() => setIsActivateModalOpen(false)}>
              Close
            </button>
          </div>
        </div>
      </div>
    )}
    {showSuccessModal && (
    <div className="success-modal">
      <div className="success-modal-backdrop" onClick={() => setShowSuccessModal(false)}></div>
      <div className="success-modal-container">
        <h2>✅ Success</h2>
        <p>{successMessage}</p>
        <button className="btn-ok" onClick={() => setShowSuccessModal(false)}>OK</button>
      </div>
    </div>
  )}
    </div>
    
  );
}