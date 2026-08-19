import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import './styles/App.css'

// Import components
import KnowledgeGraph from './components/KnowledgeGraph'
import Timeline from './components/Timeline'
import ChatHistory from './components/ChatHistory'
import Toast from './components/Toast'
import LoadingSpinner from './components/LoadingSpinner'

function App() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [timeline, setTimeline] = useState([])
  const [graph, setGraph] = useState({ nodes: [], edges: [] })
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const formatAnswer = (text) => {
    if (!text) return null;
    
    const lines = text.split('\n');
    const formattedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      if (line.startsWith('## ')) {
        formattedLines.push(
          <h2 key={i} className="answer-heading">{line.substring(3)}</h2>
        );
      }
      else if (line.startsWith('### ')) {
        formattedLines.push(
          <h3 key={i} className="answer-subheading">{line.substring(4)}</h3>
        );
      }
      else if (line.includes('**')) {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        const formatted = parts.map((part, idx) => {
          if (idx % 2 === 1) {
            return <strong key={idx}>{part}</strong>;
          }
          return part;
        });
        formattedLines.push(
          <p key={i} className="answer-text">{formatted}</p>
        );
      }
      else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        formattedLines.push(
          <li key={i} className="answer-list-item">{line.trim().substring(2)}</li>
        );
      }
      else if (/^\d+\./.test(line.trim())) {
        formattedLines.push(
          <li key={i} className="answer-list-item">{line.trim()}</li>
        );
      }
      else if (line.includes('|') && line.trim().startsWith('|')) {
        if (line.includes('---')) {
          continue;
        }
        const cells = line.split('|').filter(cell => cell.trim());
        if (cells.length > 0) {
          formattedLines.push(
            <div key={i} className="table-row">
              {cells.map((cell, idx) => (
                <span key={idx} className="table-cell">{cell.trim()}</span>
              ))}
            </div>
          );
        }
      }
      else if (line.trim() === '---') {
        formattedLines.push(
          <hr key={i} className="answer-divider" />
        );
      }
      else if (line.includes('→') || line.includes('↓')) {
        formattedLines.push(
          <div key={i} className="connection-diagram">{line}</div>
        );
      }
      else if (line.trim() === '') {
        // Skip empty lines
      }
      else {
        formattedLines.push(
          <p key={i} className="answer-text">{line}</p>
        );
      }
    }
    
    const wrappedLines = [];
    let inList = false;
    let listItems = [];
    
    for (let i = 0; i < formattedLines.length; i++) {
      const element = formattedLines[i];
      if (element && element.type === 'li') {
        inList = true;
        listItems.push(element);
      } else {
        if (inList && listItems.length > 0) {
          wrappedLines.push(
            <ul key={`list-${i}`} className="answer-list">
              {listItems}
            </ul>
          );
          listItems = [];
          inList = false;
        }
        if (element) {
          wrappedLines.push(element);
        }
      }
    }
    
    if (inList && listItems.length > 0) {
      wrappedLines.push(
        <ul key="list-end" className="answer-list">
          {listItems}
        </ul>
      );
    }
    
    const finalOutput = [];
    let tableRows = [];
    let inTable = false;
    
    for (let i = 0; i < wrappedLines.length; i++) {
      const element = wrappedLines[i];
      if (element && element.props && element.props.className === 'table-row') {
        inTable = true;
        tableRows.push(element);
      } else {
        if (inTable && tableRows.length > 0) {
          finalOutput.push(
            <div key={`table-${i}`} className="answer-table">
              {tableRows}
            </div>
          );
          tableRows = [];
          inTable = false;
        }
        if (element) {
          finalOutput.push(element);
        }
      }
    }
    
    if (inTable && tableRows.length > 0) {
      finalOutput.push(
        <div key="table-end" className="answer-table">
          {tableRows}
        </div>
      );
    }
    
    return finalOutput;
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!question.trim()) {
      setToast({ message: 'Please enter a question', type: 'warning' })
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch('/api/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setAnswer(data.answer)
      setTimeline(data.timeline || [])
      setGraph(data.graph || { nodes: [], edges: [] })
      setSources(data.sources || [])
      setToast({ message: 'Investigation complete!', type: 'success' })
    } catch (error) {
      console.error('Error:', error)
      setAnswer('Error connecting to the server. Please try again.')
      setToast({ message: 'Failed to get response. Please try again.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const exportResults = () => {
    if (!answer) {
      setToast({ message: 'No results to export', type: 'warning' })
      return
    }
    
    try {
      const data = {
        question: question,
        answer: answer,
        timeline: timeline,
        graph: graph,
        sources: sources,
        exported_at: new Date().toISOString()
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `investigation_${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
      setToast({ message: 'Export successful!', type: 'success' })
    } catch (error) {
      setToast({ message: 'Export failed. Please try again.', type: 'error' })
    }
  }

  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-container">
            <div className="logo">⏳ ChronoGraph</div>
            <div className="nav-links">
              <Link to="/">Dashboard</Link>
              <Link to="/investigate">Investigate</Link>
              <Link to="/graph">Knowledge Graph</Link>
              <Link to="/timeline">Timeline</Link>
              <Link to="/sources">Data Sources</Link>
              <Link to="/history">History</Link>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/investigate" element={
            <div className="investigation-container">
              <h1>ChronoGraph Investigation</h1>
              <p className="subtitle">Ask questions about your engineering history</p>
              
              <form onSubmit={handleSubmit} className="question-form">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g., Why did we migrate from AWS to GCP?"
                  className="question-input"
                />
                <button type="submit" className="investigate-btn" disabled={loading}>
                  {loading ? 'Investigating...' : 'Investigate'}
                </button>
              </form>

              {loading && (
                <div className="loading-container">
                  <LoadingSpinner text="Analyzing your question..." />
                </div>
              )}

              {!answer && !loading && (
                <div className="empty-state">
                  <div className="empty-state-icon">🔍</div>
                  <h3>Ask a question to start investigating</h3>
                  <p>Try asking about your engineering history, like:</p>
                  <div className="example-questions">
                    <button 
                      onClick={() => setQuestion("Why did we migrate from AWS to GCP?")} 
                      className="example-btn"
                    >
                      Why did we migrate from AWS to GCP?
                    </button>
                    <button 
                      onClick={() => setQuestion("Who proposed the GCP migration?")} 
                      className="example-btn"
                    >
                      Who proposed the GCP migration?
                    </button>
                    <button 
                      onClick={() => setQuestion("What happened in March 2023?")} 
                      className="example-btn"
                    >
                      What happened in March 2023?
                    </button>
                    <button 
                      onClick={() => setQuestion("When was CLOUD-102 created?")} 
                      className="example-btn"
                    >
                      When was CLOUD-102 created?
                    </button>
                  </div>
                </div>
              )}

              {answer && (
                <div className="answer-container">
                  <div className="answer-header">
                    <h2>🔍 Investigation Results</h2>
                    <button className="export-btn" onClick={exportResults}>
                      📥 Export Results
                    </button>
                  </div>
                  
                  <div className="answer-body">
                    {formatAnswer(answer)}
                  </div>
                  
                  {timeline.length > 0 && (
                    <div className="investigation-section">
                      <h3>📅 Timeline</h3>
                      <div className="mini-timeline">
                        {timeline.map((event, idx) => (
                          <div key={idx} className="mini-timeline-item">
                            <span className="mini-timeline-date">{event.date}</span>
                            <span className="mini-timeline-event">{event.event}</span>
                            <span className="mini-timeline-source">{event.source}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {sources.length > 0 && (
                    <div className="investigation-section">
                      <h3>📚 Sources</h3>
                      <div className="sources-list">
                        {sources.map((source, idx) => (
                          <div key={idx} className="source-item">
                            <span className="source-badge">{source.source}</span>
                            <span className="source-detail">{source.id}</span>
                            <span className="source-date">{source.date}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          } />
          <Route path="/graph" element={<GraphExplorer />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/sources" element={<DataSources />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>

        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
      </div>
    </Router>
  )
}

// ============================================
// DASHBOARD - UPDATED WITH SMALLER CARDS
// ============================================

function Dashboard() {
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const activities = [
      { user: 'Rahul', action: 'reported AWS cost issue', time: '2 hours ago', type: 'slack' },
      { user: 'Priya', action: 'proposed GCP migration', time: '1 day ago', type: 'slack' },
      { user: 'System', action: 'CLOUD-102 created', time: '3 days ago', type: 'jira' },
      { user: 'Rahul', action: 'deployed GCP configuration', time: '1 week ago', type: 'github' },
      { user: 'Amit', action: 'completed GCP deployment', time: '1 week ago', type: 'github' },
    ];
    setRecentActivity(activities);
  }, []);

  const getActivityIcon = (type) => {
    const icons = { slack: '💬', github: '🐙', jira: '📋' };
    return icons[type] || '📌';
  };

  const getActivityColor = (type) => {
    const colors = { slack: '#4a6cf7', github: '#6e5494', jira: '#0052cc' };
    return colors[type] || '#6c8ba0';
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>📊 ChronoGraph Dashboard</h1>
        <p className="subtitle">Enterprise Temporal Intelligence • Real-time Engineering Insights</p>
      </div>

      {/* Stats Grid - 6 smaller cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Knowledge Graph</h3>
            <div className="stat-number">1,248</div>
            <div className="stat-label">Total Nodes</div>
            <div className="stat-change positive">↑ 12.5%</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔗</div>
          <div className="stat-content">
            <h3>Relationships</h3>
            <div className="stat-number">3,420</div>
            <div className="stat-label">Connections</div>
            <div className="stat-change positive">↑ 8.3%</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>Historical Events</h3>
            <div className="stat-number">856</div>
            <div className="stat-label">Records Analyzed</div>
            <div className="stat-change positive">↑ 5.7%</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📡</div>
          <div className="stat-content">
            <h3>Data Sources</h3>
            <div className="stat-number">3</div>
            <div className="stat-label">Connected</div>
            <div className="stat-change success">✅ All Active</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🤖</div>
          <div className="stat-content">
            <h3>AI Queries</h3>
            <div className="stat-number">247</div>
            <div className="stat-label">Questions Asked</div>
            <div className="stat-change positive">↑ 23.4%</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <h3>Avg Response</h3>
            <div className="stat-number">2.4s</div>
            <div className="stat-label">Response Time</div>
            <div className="stat-change positive">↑ 15% faster</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>📈 Activity Overview</h3>
          <div className="activity-bars">
            <div className="bar-item">
              <span className="bar-label">Slack</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: '75%', background: '#4a6cf7' }}></div>
              </div>
              <span className="bar-value">75%</span>
            </div>
            <div className="bar-item">
              <span className="bar-label">GitHub</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: '60%', background: '#6e5494' }}></div>
              </div>
              <span className="bar-value">60%</span>
            </div>
            <div className="bar-item">
              <span className="bar-label">Jira</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: '45%', background: '#0052cc' }}></div>
              </div>
              <span className="bar-value">45%</span>
            </div>
          </div>
          <div className="chart-footer">Source Distribution</div>
        </div>

        <div className="chart-card">
          <h3>📊 Quick Stats</h3>
          <div className="quick-stats">
            <div className="quick-stat-item">
              <span className="qs-label">Total Entities</span>
              <span className="qs-value">1,248</span>
            </div>
            <div className="quick-stat-item">
              <span className="qs-label">Relationships</span>
              <span className="qs-value">3,420</span>
            </div>
            <div className="quick-stat-item">
              <span className="qs-label">AI Confidence</span>
              <span className="qs-value">94%</span>
            </div>
            <div className="quick-stat-item">
              <span className="qs-label">Uptime</span>
              <span className="qs-value">99.9%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Data Sources */}
      <div className="dashboard-section">
        <h2>🔌 Data Sources</h2>
        <div className="sources-grid-mini">
          <div className="source-card-mini">
            <div className="source-icon" style={{ background: '#4a6cf7' }}>💬</div>
            <div className="source-info">
              <h4>Slack</h4>
              <span>620 records</span>
            </div>
            <span className="status-badge">✅ Connected</span>
          </div>
          <div className="source-card-mini">
            <div className="source-icon" style={{ background: '#6e5494' }}>🐙</div>
            <div className="source-info">
              <h4>GitHub</h4>
              <span>380 records</span>
            </div>
            <span className="status-badge">✅ Connected</span>
          </div>
          <div className="source-card-mini">
            <div className="source-icon" style={{ background: '#0052cc' }}>📋</div>
            <div className="source-info">
              <h4>Jira</h4>
              <span>248 records</span>
            </div>
            <span className="status-badge">✅ Connected</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="dashboard-section">
        <h2>🔄 Recent Activity</h2>
        <div className="activity-list">
          {recentActivity.map((activity, index) => (
            <div key={index} className="activity-item">
              <div className="activity-icon" style={{ background: getActivityColor(activity.type) }}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="activity-content">
                <div className="activity-text">
                  <strong>{activity.user}</strong> {activity.action}
                </div>
                <div className="activity-time">{activity.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="dashboard-footer">
        <p>© 2024 ChronoGraph • Built with ❤️ • Enterprise Temporal Intelligence</p>
        <div className="footer-stats">
          <span>📊 1,248 Nodes</span>
          <span>🔗 3,420 Relationships</span>
          <span>📅 856 Events</span>
        </div>
      </div>
    </div>
  )
}

function GraphExplorer() {
  return (
    <div className="page">
      <h1>Knowledge Graph Explorer</h1>
      <p className="subtitle">Visualize relationships between entities, events, and decisions</p>
      <KnowledgeGraph />
    </div>
  )
}

function TimelinePage() {
  return (
    <div className="page">
      <h1>Timeline</h1>
      <p className="subtitle">Chronological view of historical events</p>
      <Timeline />
    </div>
  )
}

function DataSources() {
  const sources = [
    { name: 'Slack', count: 620, status: 'Connected', icon: '💬', color: '#4a6cf7' },
    { name: 'GitHub', count: 380, status: 'Connected', icon: '🐙', color: '#6e5494' },
    { name: 'Jira', count: 248, status: 'Connected', icon: '📋', color: '#0052cc' },
  ];

  return (
    <div className="page">
      <h1>Data Sources</h1>
      <p className="subtitle">Connected enterprise data sources</p>
      <div className="sources-grid">
        {sources.map((source, index) => (
          <div key={index} className="source-card">
            <div className="source-icon" style={{ background: source.color }}>
              {source.icon}
            </div>
            <h3>{source.name}</h3>
            <div className="source-count">{source.count} records</div>
            <div className="source-status">
              <span className="status-dot"></span>
              {source.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function HistoryPage() {
  return (
    <div className="page">
      <h1>Chat History</h1>
      <p className="subtitle">View your past investigations</p>
      <ChatHistory />
    </div>
  )
}

export default App