import React, { useState, useEffect } from 'react';
import '../styles/Timeline.css';

const Timeline = ({ events = [] }) => {
  const [filter, setFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [animatedEvents, setAnimatedEvents] = useState([]);

  // Default mock events if none provided
  const defaultEvents = [
    { 
      date: '2023-03-10', 
      event: 'AWS cost problem reported', 
      source: 'Slack', 
      type: 'slack',
      description: 'Rahul reported that AWS infrastructure costs increased significantly this quarter.',
      user: 'Rahul',
      channel: '#engineering'
    },
    { 
      date: '2023-03-15', 
      event: 'GCP migration proposed', 
      source: 'Slack', 
      type: 'slack',
      description: 'Priya proposed evaluating GCP as an alternative to AWS to reduce costs.',
      user: 'Priya',
      channel: '#architecture'
    },
    { 
      date: '2023-03-18', 
      event: 'CLOUD-102 created', 
      source: 'Jira', 
      type: 'jira',
      description: 'Jira issue created to formally track the AWS to GCP migration.',
      assignee: 'Priya',
      priority: 'High'
    },
    { 
      date: '2023-04-20', 
      event: 'Initial GCP deployment', 
      source: 'GitHub', 
      type: 'github',
      description: 'Rahul added the initial GCP deployment configuration.',
      author: 'Rahul',
      repo: 'main'
    },
    { 
      date: '2023-04-25', 
      event: 'GCP deployment completed', 
      source: 'Slack', 
      type: 'slack',
      description: 'Amit confirmed the initial GCP deployment was successful.',
      user: 'Amit',
      channel: '#engineering'
    },
    { 
      date: '2023-05-15', 
      event: 'Migration completed', 
      source: 'GitHub', 
      type: 'github',
      description: 'All services successfully migrated to GCP. AWS decommissioned.',
      author: 'Rahul',
      repo: 'main'
    },
  ];

  // Use provided events or default
  const displayEvents = events && events.length > 0 ? events : defaultEvents;

  // Add types to events if not present
  const enrichedEvents = displayEvents.map(event => ({
    ...event,
    type: event.type || event.source?.toLowerCase() || 'all'
  }));

  // Filter events
  const filteredEvents = filter === 'all' 
    ? enrichedEvents 
    : enrichedEvents.filter(e => e.type === filter || e.source?.toLowerCase() === filter);

  // Sort events by date (oldest first)
  const sortedEvents = [...filteredEvents].sort((a, b) => new Date(a.date) - new Date(b.date));

  // Animate events on load
  useEffect(() => {
    setAnimatedEvents([]);
    const timer = setTimeout(() => {
      sortedEvents.forEach((event, index) => {
        setTimeout(() => {
          setAnimatedEvents(prev => [...prev, event]);
        }, index * 150);
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [filter, events]);

  const getSourceColor = (source) => {
    const colors = {
      slack: '#4a6cf7',
      github: '#6e5494',
      jira: '#0052cc',
      default: '#6c8ba0'
    };
    return colors[source?.toLowerCase()] || colors.default;
  };

  const getSourceIcon = (source) => {
    const icons = {
      slack: '💬',
      github: '🐙',
      jira: '📋',
      default: '📌'
    };
    return icons[source?.toLowerCase()] || icons.default;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getSourceBadgeStyle = (source) => {
    const styles = {
      slack: { background: '#4a6cf7', color: '#fff' },
      github: { background: '#6e5494', color: '#fff' },
      jira: { background: '#0052cc', color: '#fff' },
      default: { background: '#6c8ba0', color: '#fff' }
    };
    return styles[source?.toLowerCase()] || styles.default;
  };

  const handleEventClick = (event) => {
    setSelectedEvent(selectedEvent === event ? null : event);
  };

  return (
    <div className="timeline-container">
      {/* Timeline Header */}
      <div className="timeline-header">
        <div className="timeline-title-section">
          <h2>📅 Engineering Timeline</h2>
          <p className="timeline-subtitle">Chronological view of all historical events</p>
        </div>
        
        <div className="timeline-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            📊 All
          </button>
          <button 
            className={`filter-btn ${filter === 'slack' ? 'active' : ''}`}
            onClick={() => setFilter('slack')}
          >
            💬 Slack
          </button>
          <button 
            className={`filter-btn ${filter === 'github' ? 'active' : ''}`}
            onClick={() => setFilter('github')}
          >
            🐙 GitHub
          </button>
          <button 
            className={`filter-btn ${filter === 'jira' ? 'active' : ''}`}
            onClick={() => setFilter('jira')}
          >
            📋 Jira
          </button>
        </div>
      </div>

      {/* Timeline Stats */}
      <div className="timeline-stats">
        <div className="stat-item">
          <span className="stat-number">{sortedEvents.length}</span>
          <span className="stat-label">Events</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{new Set(sortedEvents.map(e => e.source)).size}</span>
          <span className="stat-label">Sources</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">
            {sortedEvents.length > 0 ? 
              `${new Date(Math.min(...sortedEvents.map(e => new Date(e.date)))).getFullYear()} - 
               ${new Date(Math.max(...sortedEvents.map(e => new Date(e.date)))).getFullYear()}` 
              : 'N/A'}
          </span>
          <span className="stat-label">Year Range</span>
        </div>
      </div>

      {/* Timeline Events */}
      <div className="timeline">
        {sortedEvents.length === 0 ? (
          <div className="empty-timeline">
            <span className="empty-icon">📭</span>
            <p>No events found for this filter</p>
          </div>
        ) : (
          sortedEvents.map((event, index) => (
            <div 
              key={index} 
              className={`timeline-item ${animatedEvents.includes(event) ? 'visible' : ''}`}
              onClick={() => handleEventClick(event)}
            >
              {/* Timeline Line */}
              <div className="timeline-line">
                <div 
                  className="timeline-dot" 
                  style={{ background: getSourceColor(event.source) }}
                />
                {index < sortedEvents.length - 1 && (
                  <div className="timeline-connector" />
                )}
              </div>

              {/* Timeline Content */}
              <div className="timeline-content">
                <div className={`timeline-card ${selectedEvent === event ? 'expanded' : ''}`}>
                  <div className="timeline-card-header">
                    <div className="timeline-date">
                      <span className="date-icon">📅</span>
                      <span className="date-text">{formatDate(event.date)}</span>
                    </div>
                    <div 
                      className="timeline-source-badge"
                      style={getSourceBadgeStyle(event.source)}
                    >
                      <span className="source-icon">{getSourceIcon(event.source)}</span>
                      <span className="source-name">{event.source}</span>
                    </div>
                  </div>
                  
                  <div className="timeline-event-title">
                    {event.event}
                  </div>
                  
                  {event.description && (
                    <div className="timeline-event-description">
                      {event.description}
                    </div>
                  )}
                  
                  {/* Event Details */}
                  <div className="timeline-event-details">
                    {event.user && (
                      <span className="detail-tag">
                        👤 {event.user}
                      </span>
                    )}
                    {event.channel && (
                      <span className="detail-tag">
                        📢 {event.channel}
                      </span>
                    )}
                    {event.assignee && (
                      <span className="detail-tag">
                        👤 Assigned to: {event.assignee}
                      </span>
                    )}
                    {event.priority && (
                      <span className={`detail-tag priority-${event.priority.toLowerCase()}`}>
                        ⚡ {event.priority}
                      </span>
                    )}
                    {event.author && (
                      <span className="detail-tag">
                        ✍️ {event.author}
                      </span>
                    )}
                  </div>

                  {/* Expand indicator */}
                  {selectedEvent === event && (
                    <div className="timeline-expanded-content">
                      <div className="expanded-divider"></div>
                      <div className="expanded-details">
                        <h4>📋 Full Details</h4>
                        <div className="detail-grid">
                          <div className="detail-row">
                            <span className="detail-label">Event:</span>
                            <span className="detail-value">{event.event}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Date:</span>
                            <span className="detail-value">{event.date}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Source:</span>
                            <span className="detail-value">{event.source}</span>
                          </div>
                          {event.description && (
                            <div className="detail-row">
                              <span className="detail-label">Description:</span>
                              <span className="detail-value">{event.description}</span>
                            </div>
                          )}
                          {event.user && (
                            <div className="detail-row">
                              <span className="detail-label">User:</span>
                              <span className="detail-value">{event.user}</span>
                            </div>
                          )}
                          {event.channel && (
                            <div className="detail-row">
                              <span className="detail-label">Channel:</span>
                              <span className="detail-value">{event.channel}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Click to expand hint */}
                  {selectedEvent !== event && (
                    <div className="expand-hint">
                      <span>Click for more details ▾</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Timeline;