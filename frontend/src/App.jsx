import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import './styles/App.css'

// Import components
import KnowledgeGraph from './components/KnowledgeGraph'
import Timeline from './components/Timeline'
import ChatHistory from './components/ChatHistory'

function App() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [timeline, setTimeline] = useState([])
  const [graph, setGraph] = useState({ nodes: [], edges: [] })
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch('/api/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      })
      
      const data = await response.json()
      setAnswer(data.answer)
      setTimeline(data.timeline || [])
      setGraph(data.graph || { nodes: [], edges: [] })
      setSources(data.sources || [])
    } catch (error) {
      console.error('Error:', error)
      setAnswer('Error connecting to the server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const exportResults = () => {
    if (!answer) return;
    
    const data = {
      question: question,
      answer: answer,
      timeline: timeline,
      graph: graph,
      sources: sources,
      exported_at: new Date().toISOString()
    };
    
    // Download as JSON
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `investigation_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

              {answer && (
                <div className="answer-container">
                  <div className="answer-header">
                    <h2>AI Analysis</h2>
                    <button className="export-btn" onClick={exportResults}>
                      📥 Export
                    </button>
                  </div>
                  <div className="answer-content">{answer}</div>
                  
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
      </div>
    </Router>
  )
}

function Dashboard() {
  return (
    <div className="dashboard">
      <h1>ChronoGraph Dashboard</h1>
      <p className="subtitle">Enterprise Temporal Intelligence</p>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Knowledge Graph</h3>
          <div className="stat-number">1,248</div>
          <div>Nodes</div>
        </div>
        <div className="stat-card">
          <h3>Relationships</h3>
          <div className="stat-number">3,420</div>
          <div>Connections</div>
        </div>
        <div className="stat-card">
          <h3>Historical Events</h3>
          <div className="stat-number">856</div>
          <div>Records</div>
        </div>
        <div className="stat-card">
          <h3>Data Sources</h3>
          <div className="stat-number">3</div>
          <div>Connected</div>
        </div>
      </div>

      <div className="dashboard-sources">
        <h2>Data Sources</h2>
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