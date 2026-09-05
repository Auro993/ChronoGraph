import React, { useState, useEffect } from 'react';
import '../styles/Toast.css'; 

const Toast = ({ message, type = 'success', duration = 3000, onClose }) => {
  const [visible, setVisible] = useState(true); 

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null; 

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  return (
    <div className={`toast toast-${type}`}>
      <span className="toast-icon">{icons[type] || 'ℹ️'}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={() => setVisible(false)}>×</button>
    </div>
  );
};

export default Toast;
