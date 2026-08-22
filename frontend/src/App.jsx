import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

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
        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        
        {/* Main Content */}
        <div className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/investigate" element={
              <Investigation 
                question={question}
                setQuestion={setQuestion}
                answer={answer}
                timeline={timeline}
                graph={graph}
                sources={sources}
                loading={loading}
                handleSubmit={handleSubmit}
                exportResults={exportResults}
                formatAnswer={formatAnswer}
                setToast={setToast}
              />
            } />
            <Route path="/graph" element={<GraphExplorer />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/sources" element={<DataSources />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/export" element={<ExportPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>

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
// SIDEBAR COMPONENT
// ============================================

function Sidebar({ isOpen, setIsOpen }) {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: '🏠', label: 'Dashboard' },
    { path: '/investigate', icon: '🔍', label: 'Investigation' },
    { path: '/graph', icon: '🕸️', label: 'Knowledge Graph' },
    { path: '/timeline', icon: '⏳', label: 'Timeline' },
    { path: '/sources', icon: '📂', label: 'Data Sources' },
    { path: '/history', icon: '💬', label: 'Chat History' },
    { path: '/export', icon: '📤', label: 'Export Results' },
    { path: '/settings', icon: '⚙️', label: 'Settings' },
  ];

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-icon">⏳</span>
          {isOpen && (
            <div className="logo-text">
              <span className="logo-title">ChronoGraph</span>
              <span className="logo-subtitle">AI Enterprise Investigator</span>
            </div>
          )}
        </div>
        <button className="sidebar-toggle" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? '◀' : '▶'}
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {isOpen && <span className="nav-label">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {isOpen && (
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="user-avatar">👤</span>
            <div className="user-info">
              <span className="user-name">User</span>
              <span className="user-role">Admin</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// 1. DASHBOARD PAGE
// ============================================

function Dashboard() {
  const [recentActivity, setRecentActivity] = useState([]);
  const [recentInvestigations, setRecentInvestigations] = useState([]);

  useEffect(() => {
    const activities = [
      { action: 'New entity extracted', time: '2 hours ago', type: 'extract' },
      { action: 'New relationship created', time: '4 hours ago', type: 'create' },
      { action: 'New investigation completed', time: '6 hours ago', type: 'investigate' },
    ];
    setRecentActivity(activities);

    const investigations = [
      'Why did we migrate from AWS to GCP?',
      'Who proposed the GCP migration?',
      'What happened in March 2023?',
    ];
    setRecentInvestigations(investigations);
  }, []);

  return (
    <div className="page dashboard-page">
      <div className="page-header">
        <h1>📊 ChronoGraph Dashboard</h1>
        <p className="subtitle">Enterprise Temporal Intelligence</p>
      </div>

      {/* Stats Grid - Real numbers */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Total Entities</h3>
            <div className="stat-number">7</div>
            <div className="stat-label">Nodes in Graph</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔗</div>
          <div className="stat-content">
            <h3>Relationships</h3>
            <div className="stat-number">7</div>
            <div className="stat-label">Connections</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>Historical Events</h3>
            <div className="stat-number">15</div>
            <div className="stat-label">Records Analyzed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📡</div>
          <div className="stat-content">
            <h3>Data Sources</h3>
            <div className="stat-number">3</div>
            <div className="stat-label">Connected</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🤖</div>
          <div className="stat-content">
            <h3>AI Investigations</h3>
            <div className="stat-number">12</div>
            <div className="stat-label">Questions Asked</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <h3>Response Time</h3>
            <div className="stat-number">2.4s</div>
            <div className="stat-label">Average</div>
          </div>
        </div>
      </div>

      {/* Events Over Time - Simple Chart */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>📈 Events Over Time</h3>
          <div className="chart-visual">
            <div className="chart-line">
              <span className="chart-point" style={{ height: '20px' }}>●</span>
              <span className="chart-point" style={{ height: '40px' }}>●</span>
              <span className="chart-point" style={{ height: '60px' }}>●</span>
              <span className="chart-point" style={{ height: '45px' }}>●</span>
              <span className="chart-point" style={{ height: '30px' }}>●</span>
            </div>
            <div className="chart-labels">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
            </div>
          </div>
          <div className="chart-footer">Event distribution over time</div>
        </div>

        <div className="chart-card">
          <h3>📊 Data Source Overview</h3>
          <div className="source-bars">
            <div className="source-bar-item">
              <span className="source-bar-label">💬 Slack</span>
              <div className="source-bar-track">
                <div className="source-bar-fill" style={{ width: '40%', background: '#4a6cf7' }}></div>
              </div>
              <span className="source-bar-value">6</span>
            </div>
            <div className="source-bar-item">
              <span className="source-bar-label">🐙 GitHub</span>
              <div className="source-bar-track">
                <div className="source-bar-fill" style={{ width: '33%', background: '#6e5494' }}></div>
              </div>
              <span className="source-bar-value">5</span>
            </div>
            <div className="source-bar-item">
              <span className="source-bar-label">📋 Jira</span>
              <div className="source-bar-track">
                <div className="source-bar-fill" style={{ width: '27%', background: '#0052cc' }}></div>
              </div>
              <span className="source-bar-value">4</span>
            </div>
          </div>
          <div className="chart-footer">Total: 15 records</div>
        </div>
      </div>

      {/* Recent Investigations & Activity */}
      <div className="dashboard-grid">
        <div className="dashboard-section">
          <h2>🔄 Recent Investigations</h2>
          <div className="investigation-list">
            {recentInvestigations.map((item, index) => (
              <div key={index} className="investigation-item">
                <span className="investigation-icon">🔍</span>
                <span className="investigation-text">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-section">
          <h2>📋 Recent Activity</h2>
          <div className="activity-list">
            {recentActivity.map((activity, index) => (
              <div key={index} className="activity-item">
                <span className="activity-icon">
                  {activity.type === 'extract' ? '📊' : activity.type === 'create' ? '🔗' : '🤖'}
                </span>
                <span className="activity-text">{activity.action}</span>
                <span className="activity-time">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// 2. INVESTIGATION PAGE
// ============================================

function Investigation({ 
  question, 
  setQuestion, 
  answer, 
  timeline, 
  graph, 
  sources, 
  loading, 
  handleSubmit,
  exportResults,
  formatAnswer,
  setToast 
}) {
  const exampleQuestions = [
    'Why did we migrate from AWS to GCP?',
    'Who proposed the GCP migration?',
    'What happened in March 2023?',
    'Who worked on the GCP deployment?',
  ];

  const handleExampleClick = (q) => {
    setQuestion(q);
  };

  return (
    <div className="page investigation-page">
      <div className="investigation-layout">
        {/* Left Sidebar - Example Questions */}
        <div className="investigation-sidebar">
          <h3>💡 Example Questions</h3>
          <div className="example-questions-list">
            {exampleQuestions.map((q, index) => (
              <button 
                key={index}
                className="example-question-btn"
                onClick={() => handleExampleClick(q)}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="investigation-main">
          <div className="investigation-header">
            <h1>🔍 Investigation</h1>
            <p className="subtitle">Ask about your project history</p>
          </div>

          <form onSubmit={handleSubmit} className="question-form">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., Why did we migrate from AWS to GCP?"
              className="question-input"
            />
            <button type="submit" className="investigate-btn" disabled={loading}>
              {loading ? 'Investigating...' : 'Ask'}
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
              <p>Try clicking an example question or typing your own</p>
            </div>
          )}

          {answer && (
            <div className="answer-container">
              <div className="answer-header">
                <h2>🤖 AI Answer</h2>
                <button className="export-btn" onClick={exportResults}>
                  📤 Export Results
                </button>
              </div>
              
              <div className="answer-body">
                {formatAnswer(answer)}
              </div>

              {/* Sources */}
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

              {/* Timeline */}
              {timeline.length > 0 && (
                <div className="investigation-section">
                  <h3>⏳ Timeline</h3>
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

              {/* Knowledge Graph */}
              {graph.nodes && graph.nodes.length > 0 && (
                <div className="investigation-section">
                  <h3>🕸️ Knowledge Graph</h3>
                  <div className="mini-graph">
                    {graph.nodes.map((node, idx) => (
                      <span key={idx} className="mini-graph-node">
                        {node.label || node.id}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// 3. KNOWLEDGE GRAPH PAGE
// ============================================

function GraphExplorer() {
  return (
    <div className="page graph-page">
      <div className="page-header">
        <h1>🕸️ Knowledge Graph</h1>
        <p className="subtitle">Visualize relationships between entities</p>
      </div>

      <div className="graph-controls">
        <div className="graph-search">
          <input type="text" placeholder="Search entity..." className="search-input" />
        </div>
        <div className="graph-filters">
          <button className="filter-btn active">All</button>
          <button className="filter-btn">People</button>
          <button className="filter-btn">Technology</button>
          <button className="filter-btn">Projects</button>
          <button className="filter-btn">Issues</button>
          <button className="filter-btn">Decisions</button>
        </div>
      </div>

      <KnowledgeGraph />

      <div className="graph-footer">
        <p>💡 Click any node or edge to inspect details</p>
        <p>🔄 Drag to pan • Scroll to zoom</p>
      </div>
    </div>
  )
}

// ============================================
// 4. TIMELINE PAGE
// ============================================

function TimelinePage() {
  return (
    <div className="page timeline-page">
      <div className="page-header">
        <h1>⏳ Timeline</h1>
        <p className="subtitle">What happened and when</p>
      </div>

      <div className="timeline-controls">
        <div className="timeline-filters">
          <button className="filter-btn active">All</button>
          <button className="filter-btn">Slack</button>
          <button className="filter-btn">GitHub</button>
          <button className="filter-btn">Jira</button>
        </div>
        <div className="timeline-date-range">
          <input type="date" className="date-input" />
          <span>→</span>
          <input type="date" className="date-input" />
        </div>
      </div>

      <Timeline />
    </div>
  )
}

// ============================================
// 5. DATA SOURCES PAGE
// ============================================

function DataSources() {
  const [selectedSource, setSelectedSource] = useState(null);

  const sources = [
    { 
      name: 'Slack', 
      count: 6, 
      status: 'Connected', 
      icon: '💬', 
      color: '#4a6cf7',
      description: 'Team communication platform',
      lastUpdated: 'March 2023',
      details: [
        { date: '2023-03-10', user: 'Rahul', message: 'AWS costs are increasing' },
        { date: '2023-03-15', user: 'Priya', message: 'Evaluate GCP' },
        { date: '2023-03-20', user: 'Rahul', message: 'I support the migration' },
      ]
    },
    { 
      name: 'GitHub', 
      count: 5, 
      status: 'Connected', 
      icon: '🐙', 
      color: '#6e5494',
      description: 'Code repository',
      lastUpdated: 'March 2023',
      details: [
        { date: '2023-03-18', author: 'Priya', message: 'Add GCP proposal' },
        { date: '2023-04-20', author: 'Rahul', message: 'Add GCP config' },
        { date: '2023-04-25', author: 'Priya', message: 'Migrate API' },
      ]
    },
    { 
      name: 'Jira', 
      count: 4, 
      status: 'Connected', 
      icon: '📋', 
      color: '#0052cc',
      description: 'Project management',
      lastUpdated: 'March 2023',
      details: [
        { date: '2023-03-18', assignee: 'Priya', title: 'CLOUD-102: Evaluate GCP' },
        { date: '2023-04-01', assignee: 'Rahul', title: 'CLOUD-105: GCP pipeline' },
        { date: '2023-04-15', assignee: 'Amit', title: 'CLOUD-108: Database' },
      ]
    },
  ];

  return (
    <div className="page sources-page">
      <div className="page-header">
        <h1>📂 Data Sources</h1>
        <p className="subtitle">Where your historical information comes from</p>
      </div>

      <div className="sources-grid">
        {sources.map((source, index) => (
          <div 
            key={index} 
            className={`source-card ${selectedSource === index ? 'selected' : ''}`}
            onClick={() => setSelectedSource(selectedSource === index ? null : index)}
          >
            <div className="source-card-header">
              <div className="source-icon-large" style={{ background: source.color }}>
                {source.icon}
              </div>
              <div className="source-status-badge">
                <span className="status-dot"></span>
                {source.status}
              </div>
            </div>
            <h3>{source.name}</h3>
            <p className="source-description">{source.description}</p>
            <div className="source-stats">
              <div className="source-stat">
                <span className="stat-number">{source.count}</span>
                <span className="stat-label">Records</span>
              </div>
              <div className="source-stat">
                <span className="stat-number">100%</span>
                <span className="stat-label">Uptime</span>
              </div>
              <div className="source-stat">
                <span className="stat-number">{source.lastUpdated}</span>
                <span className="stat-label">Last Updated</span>
              </div>
            </div>
            <button className="source-btn primary">View Data</button>

            {selectedSource === index && (
              <div className="source-details">
                <h4>📋 {source.name} Records</h4>
                <div className="source-records">
                  {source.details.map((record, idx) => (
                    <div key={idx} className="record-item">
                      <span className="record-date">{record.date}</span>
                      <span className="record-content">
                        {record.message || record.title || record.author || record.assignee}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// 6. CHAT HISTORY PAGE
// ============================================

function HistoryPage() {
  return (
    <div className="page history-page">
      <div className="page-header">
        <h1>💬 Chat History</h1>
        <p className="subtitle">Previous investigations</p>
      </div>

      <div className="history-search">
        <input type="text" placeholder="Search previous questions..." className="search-input" />
      </div>

      <ChatHistory />
    </div>
  )
}

// ============================================
// 7. EXPORT RESULTS PAGE
// ============================================

function ExportPage() {
  const exports = [
    { name: 'AWS-GCP-Investigation.json', date: 'May 20, 2026', size: '2.4 KB' },
    { name: 'GCP-Timeline.json', date: 'May 19, 2026', size: '1.8 KB' },
    { name: 'Migration-Graph.json', date: 'May 18, 2026', size: '3.1 KB' },
  ];

  return (
    <div className="page export-page">
      <div className="page-header">
        <h1>📤 Export Results</h1>
        <p className="subtitle">Save investigation results</p>
      </div>

      <div className="export-grid">
        <div className="export-card">
          <h3>📄 Export Investigation</h3>
          <p className="export-description">Export current investigation with answer, sources, timeline and graph</p>
          <div className="export-actions">
            <button className="export-btn primary">Export JSON</button>
            <button className="export-btn secondary">Export PDF</button>
          </div>
        </div>

        <div className="export-card">
          <h3>🕸️ Export Graph</h3>
          <p className="export-description">Export current knowledge graph data</p>
          <div className="export-actions">
            <button className="export-btn primary">Export JSON</button>
          </div>
        </div>

        <div className="export-card">
          <h3>⏳ Export Timeline</h3>
          <p className="export-description">Export historical timeline data</p>
          <div className="export-actions">
            <button className="export-btn primary">Export JSON</button>
          </div>
        </div>
      </div>

      <div className="exports-history">
        <h3>📋 Recent Exports</h3>
        <div className="exports-list">
          {exports.map((exp, index) => (
            <div key={index} className="export-item">
              <span className="export-icon">📄</span>
              <span className="export-name">{exp.name}</span>
              <span className="export-date">{exp.date}</span>
              <span className="export-size">{exp.size}</span>
              <button className="export-download">⬇️</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================
// 8. SETTINGS PAGE
// ============================================

function SettingsPage() {
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('English');
  const [notifications, setNotifications] = useState({
    investigation: true,
    dataIngestion: true,
    errors: true,
  });

  return (
    <div className="page settings-page">
      <div className="page-header">
        <h1>⚙️ Settings</h1>
        <p className="subtitle">Application configuration</p>
      </div>

      <div className="settings-grid">
        <div className="settings-card">
          <h3>🎨 General</h3>
          <div className="setting-item">
            <label>Theme</label>
            <div className="setting-control">
              <button 
                className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => setTheme('dark')}
              >
                🌙 Dark
              </button>
              <button 
                className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                onClick={() => setTheme('light')}
              >
                ☀️ Light
              </button>
            </div>
          </div>
          <div className="setting-item">
            <label>Language</label>
            <select className="setting-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option>English</option>
              <option>Hindi</option>
              <option>Spanish</option>
            </select>
          </div>
        </div>

        <div className="settings-card">
          <h3>🤖 AI Settings</h3>
          <div className="setting-item">
            <label>AI Provider</label>
            <span className="setting-value">Google Gemini</span>
          </div>
          <div className="setting-item">
            <label>Model</label>
            <span className="setting-value">Gemini Pro</span>
          </div>
          <div className="setting-item">
            <label>Temperature</label>
            <input type="range" className="setting-range" defaultValue="0.7" min="0" max="1" step="0.1" />
          </div>
        </div>

        <div className="settings-card">
          <h3>📡 Data Settings</h3>
          <div className="setting-item">
            <label>Slack</label>
            <span className="setting-status connected">✅ Connected</span>
          </div>
          <div className="setting-item">
            <label>GitHub</label>
            <span className="setting-status connected">✅ Connected</span>
          </div>
          <div className="setting-item">
            <label>Jira</label>
            <span className="setting-status connected">✅ Connected</span>
          </div>
        </div>

        <div className="settings-card">
          <h3>🔔 Notifications</h3>
          <div className="setting-item">
            <label>Investigation completed</label>
            <button 
              className={`toggle-btn ${notifications.investigation ? 'active' : ''}`}
              onClick={() => setNotifications({...notifications, investigation: !notifications.investigation})}
            >
              {notifications.investigation ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="setting-item">
            <label>Data ingestion completed</label>
            <button 
              className={`toggle-btn ${notifications.dataIngestion ? 'active' : ''}`}
              onClick={() => setNotifications({...notifications, dataIngestion: !notifications.dataIngestion})}
            >
              {notifications.dataIngestion ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="setting-item">
            <label>Errors</label>
            <button 
              className={`toggle-btn ${notifications.errors ? 'active' : ''}`}
              onClick={() => setNotifications({...notifications, errors: !notifications.errors})}
            >
              {notifications.errors ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App