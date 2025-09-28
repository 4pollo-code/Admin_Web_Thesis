import React, { useState, useEffect } from 'react';
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
  const mockNeighbors = [
  { results_id: 201, stem_score: 80, humss_score: 70, abm_score: 65, strand: "STEM" },
  { results_id: 202, stem_score: 78, humss_score: 85, abm_score: 60, strand: "HUMSS" },
  { results_id: 203, stem_score: 65, humss_score: 70, abm_score: 88, strand: "ABM" },
  { results_id: 204, stem_score: 82, humss_score: 78, abm_score: 72, strand: "STEM" },
  { results_id: 205, stem_score: 70, humss_score: 82, abm_score: 75, strand: "HUMSS" },
  { results_id: 206, stem_score: 60, humss_score: 68, abm_score: 90, strand: "ABM" },
];

  // Mock data
  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      
      const mockData = [
        {
          results_id: 1,
          stem_score: 85,
          humss_score: 72,
          abm_score: 68,
          recommendation: "Based on your scores, STEM track is highly recommended. You show strong analytical and mathematical abilities.",
          tie: false,
          results_for: 101,
          k: 3,
          dataset_id: 1,
          user_data: { name: "John Doe", email: "john.doe@email.com"},
          dataset: { name: "Academic Strand Assessment v2.1", created_at: "2024-03-15T10:30:00Z" },
          created_at: "2024-03-15T14:30:00Z"
        },
        {
          results_id: 2,
          stem_score: 78,
          humss_score: 89,
          abm_score: 73,
          recommendation: "HUMSS track aligns well with your strengths in humanities and social sciences. Consider pursuing liberal arts or social work.",
          tie: false,
          results_for: 102,
          k: 5,
          dataset_id: 1,
          user_data: { name: "Jane Smith", email: "jane.smith@email.com"},
          dataset: { name: "Academic Strand Assessment v2.1", created_at: "2024-03-12T16:45:00Z" },
          created_at: "2024-03-12T16:45:00Z"
        },
        {
          results_id: 3,
          stem_score: 82,
          humss_score: 81,
          abm_score: 83,
          recommendation: "Your scores show balanced abilities across all tracks. ABM has a slight edge - consider business or entrepreneurship programs.",
          tie: true,
          results_for: 103,
          k: 4,
          dataset_id: 2,
          user_data: { name: "Mike Johnson", email: "mike.johnson@email.com"},
          dataset: { name: "Enhanced Career Guidance Assessment", created_at: "2024-03-10T11:20:00Z" },
          created_at: "2024-03-10T11:20:00Z"
        },
        {
          results_id: 4,
          stem_score: 91,
          humss_score: 76,
          abm_score: 79,
          recommendation: "Excellent STEM aptitude! You would excel in engineering, computer science, or medical fields. Your analytical thinking is exceptional.",
          tie: false,
          results_for: 104,
          k: 3,
          dataset_id: 1,
          user_data: { name: "Sarah Wilson", email: "sarah.wilson@email.com"},
          dataset: { name: "Academic Strand Assessment v2.1", created_at: "2024-03-08T13:15:00Z" },
          created_at: "2024-03-08T13:15:00Z"
        },
        {
          results_id: 5,
          stem_score: 65,
          humss_score: 70,
          abm_score: 88,
          recommendation: "ABM track is your strongest suit. You demonstrate excellent business acumen and entrepreneurial potential. Consider accounting or business management.",
          tie: false,
          results_for: 105,
          k: 4,
          dataset_id: 2,
          user_data: { name: "Alex Brown", email: "alex.brown@email.com"},
          dataset: { name: "Enhanced Career Guidance Assessment", created_at: "2024-03-05T10:30:00Z" },
          created_at: "2024-03-05T10:30:00Z"
        },
        {
          results_id: 6,
          stem_score: 74,
          humss_score: 92,
          abm_score: 71,
          recommendation: "Outstanding performance in HUMSS! Your communication skills and social awareness are remarkable. Consider journalism, psychology, or education.",
          tie: false,
          results_for: 106,
          k: 5,
          dataset_id: 1,
          user_data: { name: "Emily Davis", email: "emily.davis@email.com"},
          dataset: { name: "Academic Strand Assessment v2.1", created_at: "2024-03-04T09:15:00Z" },
          created_at: "2024-03-04T09:15:00Z"
        }
      ];
      setResults(mockData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch assessment results.');
    } finally {
      setLoading(false);
    }
  };

  const toggleRowExpansion = (id) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedRows(newSet);
  };

  const getHighestScore = (stem, humss, abm) => {
    const scores = { STEM: stem, HUMSS: humss, ABM: abm };
    return Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'score-excellent';
    if (score >= 80) return 'score-good';
    if (score >= 70) return 'score-fair';
    return 'score-poor';
  };

  const filteredResults = results.filter(r =>
    r.user_data.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.user_data.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.recommendation.toLowerCase().includes(searchTerm.toLowerCase())
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
          <div className="card stem"><h3>STEM Recommended</h3><p>{results.filter(r => getHighestScore(r.stem_score, r.humss_score, r.abm_score) === 'STEM').length}</p></div>
          <div className="card humss"><h3>HUMSS Recommended</h3><p>{results.filter(r => getHighestScore(r.stem_score, r.humss_score, r.abm_score) === 'HUMSS').length}</p></div>
          <div className="card abm"><h3>ABM Recommended</h3><p>{results.filter(r => getHighestScore(r.stem_score, r.humss_score, r.abm_score) === 'ABM').length}</p></div>
        </div>

        <div className="results-table">
          {filteredResults.map(result => {
            const recommendedTrack = getHighestScore(result.stem_score, result.humss_score, result.abm_score);
            const highestScore = Math.max(result.stem_score, result.humss_score, result.abm_score);
            return (
              <div key={result.results_id} className="result-row">
                <div className="row-main" onClick={() => toggleRowExpansion(result.results_id)}>
                  <div className="row-left">
                    {expandedRows.has(result.results_id) ? <ChevronDown /> : <ChevronRight />}
                    <div>
                      <h2>{result.user_data.name}</h2>
                      <div className="row-meta">
                        <span><User /> {result.user_data.grade_level}</span>
                        <span><Calendar /> {new Date(result.created_at).toLocaleDateString()}</span>
                        <span><BookOpen /> {result.dataset.name}</span>
                        {result.tie && <span className="tie-badge">TIE</span>}
                      </div>
                    </div>
                  </div>
                  <div className={`track-badge ${recommendedTrack.toLowerCase()}`}>{recommendedTrack} Recommended</div>
                  <div className={`highest-score ${getScoreColor(highestScore)}`}>{highestScore}</div>
                </div>

                {expandedRows.has(result.results_id) && (
                  <div className="row-expanded">
                    <div className="scores">
                      <div className="score stem"><h4>STEM</h4><p>{result.stem_score}</p></div>
                      <div className="score humss"><h4>HUMSS</h4><p>{result.humss_score}</p></div>
                      <div className="score abm"><h4>ABM</h4><p>{result.abm_score}</p></div>
                    </div>

                    {/* Recommendation */}
                    <div className="recommendation"><p>{result.recommendation}</p></div>

                    {/* KNN Visualization */}
                    <div className="knn-container">
                      {/* Count strands for bar chart */}
                      {(() => {
                        const neighbors = mockNeighbors.slice(0, result.k); // neighbors for this student
                        const strandCounts = neighbors.reduce((acc, n) => {
                          acc[n.strand] = (acc[n.strand] || 0) + 1;
                          return acc;
                        }, {});
                        const barData = Object.keys(strandCounts).map(strand => ({
                          strand,
                          count: strandCounts[strand]
                        }));
                        return (
                          <>
                            <div className="knn-bar">
                              <h4>Neighbor Strand Distribution</h4>
                              <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={barData}>
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
                                    <th>ID</th>
                                    <th>STEM</th>
                                    <th>HUMSS</th>
                                    <th>ABM</th>
                                    <th>Strand</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {neighbors.map(neighbor => (
                                    <tr key={neighbor.results_id}>
                                      <td>{neighbor.results_id}</td>
                                      <td>{neighbor.stem_score}</td>
                                      <td>{neighbor.humss_score}</td>
                                      <td>{neighbor.abm_score}</td>
                                      <td>{neighbor.strand}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* Original details and student info */}
                    <div className="details">
                      <div>Result ID: #{result.results_id}</div>
                      <div>K-Value: {result.k}</div>
                      <div>Dataset: {result.dataset.name}</div>
                    </div>
                    <div className="student-info">
                      <div>Email: {result.user_data.email}</div>
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
