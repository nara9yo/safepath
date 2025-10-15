import React from 'react';

const ModeToggle = ({ mode, onModeChange, inspectionRadiusKm, onInspectionRadiusChange }) => {
  const radiusMeters = Math.round((inspectionRadiusKm || 0) * 1000);
  return (
    <div className="mode-toggle">
      <div className="mode-toggle-header">
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
      </div>
      <div className="mode-description">
        {mode === 'normal'
          ? '싱크홀을 피하는 안전한 경로를 제공합니다'
          : '싱크홀을 포함한 최단 경로를 제공합니다'
        }
      </div>

      {mode === 'inspection' && (
        <div className="inspection-radius" style={{ marginTop: 12 }}>
          <label htmlFor="inspection-radius" style={{ display: 'block', marginBottom: 6 }}>
            근거리 기준: {radiusMeters}m
          </label>
          <input
            id="inspection-radius"
            type="range"
            min={0.01}
            max={0.2}
            step={0.01}
            value={Number(inspectionRadiusKm || 0)}
            onChange={(e) => onInspectionRadiusChange(Number(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>10m ~ 200m</div>
        </div>
      )}
    </div>
  );
};

export default ModeToggle;

