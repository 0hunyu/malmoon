import React from 'react';
import './CentralAacDisplay.css';

function CentralAacDisplay({ imageUrl }) {
  if (!imageUrl) {
    return null;
  }

  return (
    <div className="central-aac-container">
      <div className="central-aac-card">
        <img src={imageUrl} alt="Selected AAC" />
      </div>
    </div>
  );
}

export default CentralAacDisplay;