import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  User,
  AlertCircle,
  Search,
  RefreshCw,
  BookOpen,
  TrendingUp
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Header from "../components/Header";
import './css/AssessmentResults.css'; 

const AssessmentResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const API_BASE_URL = process.env.REACT_APP_API_URL;
  // Axios fetch results
  const fetchResults = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE_URL}/results/`, { withCredentials: true });
      setResults(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to fetch results");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const toggleRowExpansion = (id) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedRows(newSet);
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'score-excellent';
    if (score >= 80) return 'score-good';
    if (score >= 70) return 'score-fair';
    return 'score-poor';
  };

  const filteredResults = results.filter(r =>
    r.user_data?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.user_data?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.recommendation_description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="loading-container"><RefreshCw className="animate-spin" /> Loading...</div>;
  if (error) return <div className="error-container"><AlertCircle /> {error}</div>;

  return (
    <div className="assessment-container">
      <Header />
      <div className="assessment-content">
        <div className="assessment-header">
          <div className="header-left"><TrendingUp /> <h1>Assessment Results</h1></div>
          <div className="header-right">
            <div className="search-box">
              <Search />
              <input placeholder="Search student or recommendation..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <button className="refresh-btn" onClick={fetchResults}><RefreshCw /></button>
          </div>
        </div>

        <div className="summary-cards">
          <div className="card total"><h3>Total Results</h3><p>{results.length}</p></div>
          <div className="card stem"><h3>STEM Recommended</h3>
            <p>{results.filter(r => r.recommended_strand === 'STEM').length}</p>
          </div>
          <div className="card humss"><h3>HUMSS Recommended</h3>
            <p>{results.filter(r => r.recommended_strand === 'HUMSS').length}</p>
          </div>
          <div className="card abm"><h3>ABM Recommended</h3>
            <p>{results.filter(r => r.recommended_strand === 'ABM').length}</p>
          </div>
        </div>

        <div className="results-table">
          {filteredResults.map(result => {
            const highestScore = Math.max(result.stem_score, result.humss_score, result.abm_score);

            return (
              <div key={result.results_id} className="result-row">
                <div className="row-main" onClick={() => toggleRowExpansion(result.results_id)}>
                  <div className="row-left">
                    {expandedRows.has(result.results_id) ? <ChevronDown /> : <ChevronRight />}
                    <div>
                      <h2>{result.user_data?.name}</h2>
                      <div className="row-meta">
                        <span><User /> {result.user_data?.name || "N/A"}</span>
                        <span><Calendar /> {new Date(result.created_at).toLocaleDateString()}</span>
                        <span><BookOpen /> {result.dataset?.name}</span>
                        {result.tie && <span className="tie-badge">TIE</span>}
                      </div>
                    </div>
                  </div>
                  <div className={`track-badge ${result.recommended_strand.toLowerCase()}`}>
                    {result.recommended_strand} Recommended
                  </div>
                  <div className={`highest-score ${getScoreColor(highestScore)}`}>
                    {highestScore}
                  </div>
                </div>

                {expandedRows.has(result.results_id) && (
                  <div className="row-expanded">
                    <div className="scores">
                      <div className="score stem"><h4>STEM</h4><p>{result.stem_score}</p></div>
                      <div className="score humss"><h4>HUMSS</h4><p>{result.humss_score}</p></div>
                      <div className="score abm"><h4>ABM</h4><p>{result.abm_score}</p></div>
                    </div>

                    <div className="recommendation"><p>{result.recommendation_description}</p></div>

                    {/* Neighbors Visualization */}
                    {result.neighbors?.length > 0 && (
                      <div className="knn-container">
                        <div className="knn-bar">
                          <h4>Neighbor Strand Distribution</h4>
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={
                              Object.values(result.neighbors.reduce((acc, n) => {
                                acc[n.strand] = (acc[n.strand] || 0) + 1;
                                return acc;
                              }, {})).map((count, i) => ({ strand: Object.keys(result.neighbors.reduce((acc, n) => { acc[n.strand] = (acc[n.strand] || 0) + 1; return acc; }, {}))[i], count }))
                            }>
                              <XAxis dataKey="strand" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="count" fill="#2563eb" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="knn-table">
                          <h4>Neighbors Details</h4>
                          <table>
                            <thead>
                              <tr>
                                <th>Index</th>
                                <th>Strand</th>
                                <th>Distance</th>
                              </tr>
                            </thead>
                            <tbody>
                              {result.neighbors.map(neighbor => (
                                <tr key={neighbor.neighbors_id}>
                                  <td>{neighbor.neighbor_index}</td>
                                  <td>{neighbor.strand}</td>
                                  <td>{neighbor.distance.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div className="details">
                      <div>Result ID: #{result.results_id}</div>
                      <div>K-Value: {result.neighbors?.length || "N/A"}</div>
                      <div>Dataset: {result.dataset?.name}</div>
                    </div>
                    <div className="student-info">
                      <div>Email: {result.user_data?.email}</div>
                      <div>Assessment Date: {new Date(result.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AssessmentResults;
