import React from 'react';

const ModeToggle = ({ mode, onModeChange }) => {
  return (
    <div className="mode-toggle">
      <h3>{mode === 'normal' ? '일반 모드' : '안전점검 모드'}</h3>
      <div className="toggle-switch">
        <input
          type="checkbox"
          id="mode-toggle"
          checked={mode === 'inspection'}
          onChange={(e) => onModeChange(e.target.checked ? 'inspection' : 'normal')}
        />
        <label htmlFor="mode-toggle" className="slider"></label>
      </div>
      <div className="slider-label">
        {mode === 'normal' ? '일반' : '안전점검'}
      </div>
      <div className="mode-description">
        {mode === 'normal' 
          ? '싱크홀을 피하는 안전한 경로를 제공합니다'
          : '싱크홀을 포함한 최단 경로를 제공합니다'
        }
      </div>
    </div>
  );
};

export default ModeToggle;

