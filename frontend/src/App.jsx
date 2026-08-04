import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import './styles/App.css'

function App() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      })
      
      const data = await response.json()
      setAnswer(data.answer)
    } catch (error) {
      console.error('Error:', error)
      setAnswer('Error connecting to the server. Please try again.')
    } finally {
      setLoading(false)
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
                  <h2>AI Analysis</h2>
                  <div className="answer-content">{answer}</div>
                </div>
              )}
            </div>
          } />
          <Route path="/graph" element={<GraphExplorer />} />
          <Route path="/timeline" element={<TimelinePage />} />
        </Routes>
      </div>
    </Router>
  )
}

function Dashboard() {
  return (
    <div className="dashboard">
      <h1>ChronoGraph Dashboard</h1>
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
    </div>
  )
}

function GraphExplorer() {
  return <div className="page"><h1>Knowledge Graph Explorer</h1><p>Coming soon with React Flow...</p></div>
}

function TimelinePage() {
  return <div className="page"><h1>Timeline</h1><p>Coming soon...</p></div>
}

export default App