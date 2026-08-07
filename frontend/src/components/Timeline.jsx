import React, { useState } from 'react';
import '../styles/Timeline.css';

const Timeline = ({ events = [] }) => {
  const [filter, setFilter] = useState('all');

  // Default mock events if none provided
  const defaultEvents = [
    { date: '2023-03-10', event: 'AWS cost problem reported', source: 'Slack', type: 'slack' },
    { date: '2023-03-15', event: 'GCP migration proposed', source: 'Slack', type: 'slack' },
    { date: '2023-03-18', event: 'CLOUD-102 created', source: 'Jira', type: 'jira' },
    { date: '2023-04-20', event: 'Initial GCP deployment', source: 'GitHub', type: 'github' },
    { date: '2023-04-25', event: 'GCP deployment completed', source: 'GitHub', type: 'github' },
    { date: '2023-05-15', event: 'Migration completed', source: 'GitHub', type: 'github' },
  ];

  const displayEvents = events.length > 0 ? events : defaultEvents;

  const filteredEvents = filter === 'all' 
    ? displayEvents 
    : displayEvents.filter(e => e.type === filter || e.source.toLowerCase() === filter);

  const getSourceColor = (source) => {
    const colors = {
      slack: '#4a6cf7',
      github: '#6e5494',
      jira: '#0052cc'
    };
    return colors[source.toLowerCase()] || '#6c8ba0';
  };

  return (
    <div className="timeline-container">
      <div className="timeline-header">
        <h3>📅 Timeline</h3>
        <div className="timeline-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${filter === 'slack' ? 'active' : ''}`}
            onClick={() => setFilter('slack')}
          >
            Slack
          </button>
          <button 
            className={`filter-btn ${filter === 'github' ? 'active' : ''}`}
            onClick={() => setFilter('github')}
          >
            GitHub
          </button>
          <button 
            className={`filter-btn ${filter === 'jira' ? 'active' : ''}`}
            onClick={() => setFilter('jira')}
          >
            Jira
          </button>
        </div>
      </div>

      <div className="timeline">
        {filteredEvents.map((event, index) => (
          <div key={index} className="timeline-item">
            <div className="timeline-dot" style={{ background: getSourceColor(event.source) }} />
            <div className="timeline-content">
              <div className="timeline-date">{event.date}</div>
              <div className="timeline-event">{event.event}</div>
              <div className="timeline-source">
                <span className="source-tag" style={{ background: getSourceColor(event.source) }}>
                  {event.source}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timeline;