import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  User,
  AlertCircle,
  Search,
  RefreshCw,
  BookOpen,
  TrendingUp,
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import Header from "../components/Header";
import { useNavigate } from "react-router-dom";
import "./css/AssessmentResults.css";

const ROWS_PER_PAGE = 5;

const AssessmentResults = () => {
  const [results, setResults] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState("ALL");
  const [activeStrand, setActiveStrand] = useState("ALL");
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const API_BASE_URL = process.env.REACT_APP_API_URL;

  // ------------------------------
  // Authentication
  // ------------------------------
  const checkToken = async () => {
    if (!token) {
      alert("Session expired. Please log in again.");
      navigate("/");
      return;
    }
    try {
      await axios.get(`${API_BASE_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Error fetching initial data:", err);
      navigate("/");
    }
  };

  // ------------------------------
  // Fetch Results
  // ------------------------------
  const fetchResults = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE_URL}/results/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setResults(data);
      setError(null);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to fetch results"
      );
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------
  // Fetch Datasets
  // ------------------------------
  const fetchDatasets = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/datasets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDatasets(data);
    } catch (err) {
      console.error("Failed to fetch datasets:", err);
    }
  };

  // ------------------------------
  // On Mount
  // ------------------------------
  useEffect(() => {
    fetchResults();
    fetchDatasets();
    checkToken();
  }, []);

  // ------------------------------
  // Helpers
  // ------------------------------
  const toggleRowExpansion = (id) => {
    const newSet = new Set(expandedRows);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setExpandedRows(newSet);
  };


  // ------------------------------
  // Filtering
  // ------------------------------
  const filteredResults = results.filter((r) => {
    const lowerSearch = searchTerm.toLowerCase();
    const allFields = [
      r.results_id, 
      r.user_data?.name,
      r.user_data?.email,
      r.recommended_strand,
      r.tie ? "tie" : "",
      r.dataset?.data_set_name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = allFields.includes(lowerSearch);

    const matchesStrand =
      activeStrand === "ALL" || r.recommended_strand === activeStrand;

    const matchesDataset =
      selectedDataset === "ALL" ||
      r.dataset?.data_set_id === parseInt(selectedDataset);

    return matchesSearch && matchesStrand && matchesDataset;
  });

  // ------------------------------
  // Pagination
  // ------------------------------
  const totalPages = Math.ceil(filteredResults.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const paginatedResults = filteredResults.slice(
    startIndex,
    startIndex + ROWS_PER_PAGE
  );

  // ------------------------------
  // Loading & Error States
  // ------------------------------
  if (loading) {
    return (
      <div className="loading-container">
        <RefreshCw className="animate-spin" /> Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <AlertCircle /> {error}
      </div>
    );
  }

  // ------------------------------
  // Render
  // ------------------------------
  return (
    <div className="assessment-container">
      <Header />
      <div className="assessment-content">
        {/* Header */}
        <div className="assessment-header">
          <div className="header-left">
            <TrendingUp /> <h1>Assessment Results</h1>
          </div>
          <div className="header-right">
            {/* Search */}
            <div className="search-box">
              <Search />
              <input
                placeholder="Search student or email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Dataset Select */}
            <select
              className="dataset-select"
              value={selectedDataset}
              onChange={(e) => {
                setSelectedDataset(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Datasets</option>
              {datasets.map((ds) => (
                <option key={ds.data_set_id} value={ds.data_set_id}>
                  {ds.data_set_name}
                </option>
              ))}
            </select>

            {/* Refresh */}
            <button className="refresh-btn" onClick={fetchResults}>
              <RefreshCw />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="summary-cards">
          {["ALL", "STEM", "HUMSS", "ABM"].map((strand) => (
            <div
              key={strand}
              className={`card ${strand.toLowerCase()} ${
                activeStrand === strand ? "active" : ""
              }`}
              onClick={() => {
                setActiveStrand(strand);
                setCurrentPage(1);
              }}
            >
              <h3>
                {strand === "ALL" ? "Total Results" : `${strand} Recommended`}
              </h3>
              <p>
                {strand === "ALL"
                  ? results.length
                  : results.filter((r) => r.recommended_strand === strand)
                      .length}
              </p>
            </div>
          ))}
        </div>

        {/* Results Table */}
        <div className="results-table">
          {paginatedResults.map((result) => {
            const highestScore = Math.max(
              result.stem_score,
              result.humss_score,
              result.abm_score
            );

            return (
              <div key={result.results_id} className="result-row">
                {/* Main Row */}
                <div
                  className="row-main"
                  onClick={() => toggleRowExpansion(result.results_id)}
                >
                  <div className="row-left">
                    {expandedRows.has(result.results_id) ? <ChevronDown /> : <ChevronRight />}
                    <div className="user-name-container">
                      <h2>
                        {result.user_data?.name || "Unknown"}{" "}
                        {result.tie && <span className="tie-badge-inline">TIE</span>}
                      </h2>
                      <div className="row-meta">
                        <span>
                          <User /> {result.user_data?.name || "N/A"}
                        </span>
                        <span>
                          <Calendar /> {new Date(result.created_at).toLocaleDateString()}
                        </span>
                        <span>
                          <BookOpen /> {result.dataset?.data_set_name}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side Badges */}
                  <div className="row-right">
                    <div
                      className={`track-badge ${result.recommended_strand.toLowerCase()}`}
                    >
                      {result.recommended_strand} Recommended
                    </div>

                    {/* ✅ Tie Badge Added */}
                    {result.tie && <div className="tie-badge">TIE</div>}

                    <div className={`highest-score`}>
                      {highestScore}
                    </div>
                  </div>
                </div>

                {/* Expanded Row */}
                {expandedRows.has(result.results_id) && (
                  <div className="row-expanded">
                    {/* Scores */}
                    <div className="scores">
                      {["STEM", "HUMSS", "ABM"].map((strand) => (
                        <div
                          key={strand}
                          className={`score ${strand.toLowerCase()}`}
                        >
                          <h4>{strand}</h4>
                          <p>{result[`${strand.toLowerCase()}_score`]}</p>
                        </div>
                      ))}
                    </div>

                    {/* Top Section */}
                    <div className="statistics-top-section two-columns">
                      <div className="statistics-card statistics-chart">
                        <div className="statistics-card-header">
                          <h2>User Scores Per Strand</h2>

                        </div>
                        <div className="statistics-card-body">
                          <ResponsiveContainer width="100%" height={250}>
                            <BarChart
                              data={[
                                { strand: "STEM", score: result.assessment_info?.stem_total || 0 },
                                { strand: "ABM", score: result.assessment_info?.abm_total || 0 },
                                { strand: "HUMSS", score: result.assessment_info?.humss_total || 0 },
                              ]}
                            >
                              <XAxis dataKey="strand" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="score" fill="#4cafef" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Tie Table (if available) */}
                      {result.tie_info && (
                        <div className="statistics-card statistics-tie-table">
                          <div className="statistics-card-header">
                            <h2>Tie Resolution Weights</h2>
                          </div>
                          <div className="statistics-card-body">
                            <table className="statistics-question-table">
                              <thead>
                                <tr>
                                  <th>Strand</th>
                                  <th>Weighted Distance</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(result.tie_info).map(
                                  ([strand, weight]) => (
                                    <tr key={strand}>
                                      <td>
                                        {strand
                                          .replace("_weight", "")
                                          .toUpperCase()}
                                      </td>
                                      <td>
                                        {weight != null
                                          ? Number(weight).toFixed(3)
                                          : "N/A"}
                                      </td>
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Section */}
                    <div className="statistics-bottom-section">
                      {/* Neighbors */}
                      <div className="statistics-card">
                        <div className="statistics-card-header">
                          <h2>Closest Matches</h2>
                        </div>
                        <div className="statistics-card-body">
                          {result.neighbors?.length > 0 ? (
                            <table className="statistics-question-table">
                              <thead>
                                <tr>
                                  <th>#</th>
                                  <th>Strand</th>
                                  <th>Distance</th>
                                </tr>
                              </thead>
                              <tbody>
                                {result.neighbors
                                  .slice()
                                  .sort((a, b) => a.distance - b.distance)
                                  .map((n, index) => (
                                    <tr
                                      key={`${n.neighbors_id || index}-${
                                        n.strand
                                      }`}
                                    >
                                      <td>{index + 1}</td>
                                      <td>{n.strand}</td>
                                      <td>
                                        {n.distance != null
                                          ? n.distance.toFixed(3)
                                          : "0.000"}
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          ) : (
                            <p>No neighbors found.</p>
                          )}
                        </div>
                      </div>

                      {/* Pie Chart */}
                      <div className="statistics-card statistics-chart">
                        <div className="statistics-card-header">
                          <h2>Closest Matches Distribution</h2>
                        </div>
                        <div className="statistics-card-body">
                          {result.neighbors?.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                              <PieChart>
                                <Pie
                                  data={Object.entries(
                                    result.neighbors.reduce((acc, n) => {
                                      acc[n.strand] =
                                        (acc[n.strand] || 0) + 1;
                                      return acc;
                                    }, {})
                                  ).map(([name, value]) => ({
                                    name,
                                    value,
                                  }))}
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={90}
                                  dataKey="value"
                                  label={({ name, percent }) =>
                                    `${name} ${(percent * 100).toFixed(0)}%`
                                  }
                                >
                                  {["#2563eb", "#4caf50", "#f59e0b"].map(
                                    (color, index) => (
                                      <Cell key={index} fill={color} />
                                    )
                                  )}
                                </Pie>
                                <Tooltip />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          ) : (
                            <p>No distribution available.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="details">
                      <div>Result ID: #{result.results_id}</div>
                      <div>
                        K-Value: {result.neighbors?.length || "N/A"}
                      </div>
                      <div>Dataset: {result.dataset?.data_set_name}</div>
                    </div>
                    <div className="student-info">
                      <div>Email: {result.user_data?.email}</div>
                      <div>
                        Assessment Date:{" "}
                        {new Date(result.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Pagination Footer */}
        <div className="table-footer">
          <div className="footer-info">
            Showing {paginatedResults.length} of {filteredResults.length} results
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
              Page {currentPage} of {totalPages || 1}
            </span>
            <button
              className="pagination-button primary"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentResults;
