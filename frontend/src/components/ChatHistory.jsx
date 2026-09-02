import React, { useState, useEffect } from 'react';  
import '../styles/ChatHistory.css';

const ChatHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/chat/history?limit=20');
      const data = await response.json();
      if (data.status === 'success') {
        setHistory(data.history);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  if (loading) return <div className="history-loading">Loading history...</div>;

  return (
    <div className="chat-history">
      <div className="history-header">
        <h2>📜 Chat History</h2>
        <button className="refresh-btn" onClick={fetchHistory}>🔄 Refresh</button>
      </div>
      
      {history.length === 0 ? (
        <div className="empty-history">
          <p>No chat history yet. Start investigating!</p>
        </div>
      ) : (
        <div className="history-list">
          {history.map((item) => (
            <div 
              key={item.id} 
              className={`history-item ${selected === item.id ? 'selected' : ''}`}
              onClick={() => setSelected(item.id === selected ? null : item.id)}
            >
              <div className="history-question">
                <span className="history-icon">❓</span>
                <span className="question-text">{item.question}</span>
                <span className="history-date">{formatDate(item.created_at)}</span>
              </div>
              
              {selected === item.id && (
                <div className="history-answer">
                  <div className="history-answer-text">{item.answer}</div>
                  
                  {item.timeline && item.timeline.length > 0 && (
                    <div className="history-timeline">
                      <strong>Timeline:</strong>
                      {item.timeline.slice(0, 3).map((event, idx) => (
                        <div key={idx} className="history-event">
                          {event.date} - {event.event}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatHistory;
