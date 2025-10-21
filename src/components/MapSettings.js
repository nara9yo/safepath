import React from 'react';

const MapSettings = ({
  mapType,
  onMapTypeChange,
  showMarkers,
  onShowMarkersChange,
  markerRiskFilter,
  onMarkerRiskFilterChange,
  showHeatmap,
  onShowHeatmapChange,
  heatmapPreset,
  onHeatmapPresetChange,
  showSubway,
  onShowSubwayChange,
  showSubwayInfluence,
  onShowSubwayInfluenceChange,
  sinkholes = []
}) => {
  const mapTypes = [
    { id: 'terrain', name: '지형', icon: '🏔️' },
    { id: 'normal', name: '일반', icon: '🗺️' },
    { id: 'satellite', name: '위성', icon: '🛰️' },
    { id: 'hybrid', name: '하이브리드', icon: '🌍' }
  ];

  // 실제 데이터 범위 계산
  const getDataRange = () => {
    const weights = sinkholes.map(s => Number(s.weight) || 0).filter(Number.isFinite);
    if (weights.length === 0) return { min: 1, max: 10 };
    
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    return { min: Math.floor(min), max: Math.ceil(max) };
  };

  const dataRange = getDataRange();
  const rangeSize = dataRange.max - dataRange.min;
  const quarterRange = rangeSize / 4;

  const riskLevels = [
    { id: 'all', name: '전체', range: `${dataRange.min.toFixed(1)} ~ ${dataRange.max.toFixed(1)}` },
    { id: 'low', name: '낮음', range: `${dataRange.min.toFixed(1)} ~ ${(dataRange.min + quarterRange).toFixed(1)}` },
    { id: 'medium', name: '중간', range: `${(dataRange.min + quarterRange).toFixed(1)} ~ ${(dataRange.min + quarterRange * 2).toFixed(1)}` },
    { id: 'high', name: '높음', range: `${(dataRange.min + quarterRange * 2).toFixed(1)} ~ ${(dataRange.min + quarterRange * 3).toFixed(1)}` },
    { id: 'critical', name: '치명적', range: `${(dataRange.min + quarterRange * 3).toFixed(1)} ~ ${dataRange.max.toFixed(1)}` }
  ];

  return (
    <div className="map-settings-text">
      <div className="settings-row">
        <span className="settings-label">지도 유형:</span>
        <div className="text-buttons">
          {mapTypes.map((type) => (
            <button
              key={type.id}
              className={`text-button ${mapType === type.id ? 'active' : ''}`}
              onClick={() => onMapTypeChange(type.id)}
            >
              {type.name}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-row">
        <span className="settings-label">싱크홀 지점:</span>
        <div className="text-controls">
          <div className="switch-container">
            <input
              type="checkbox"
              id="markers-switch"
              checked={!!showMarkers}
              onChange={(e) => onShowMarkersChange?.(e.target.checked)}
              className="switch-input"
            />
            <label htmlFor="markers-switch" className="switch-label">
              <span className="switch-slider"></span>
            </label>
          </div>
        </div>
      </div>

      {showMarkers && (
        <div className="settings-row" style={{ paddingLeft: '20px', marginTop: '-8px', border: 'none', background: 'transparent' }}>
          <span className="settings-label">위험도:</span>
          <div className="text-controls">
            <div className="risk-filter-container">
              <select
                value={markerRiskFilter || 'all'}
                onChange={(e) => onMarkerRiskFilterChange?.(e.target.value)}
                className="risk-filter-select"
              >
                {riskLevels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name} ({level.range})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="settings-row">
        <span className="settings-label">히트맵:</span>
        <div className="text-controls">
          <div className="switch-container">
            <input
              type="checkbox"
              id="heatmap-switch"
              checked={!!showHeatmap}
              onChange={(e) => onShowHeatmapChange?.(e.target.checked)}
              className="switch-input"
            />
            <label htmlFor="heatmap-switch" className="switch-label">
              <span className="switch-slider"></span>
            </label>
          </div>
        </div>
      </div>

      {showHeatmap && (
        <div className="settings-row" style={{ paddingLeft: '20px', marginTop: '-8px', border: 'none', background: 'transparent' }}>
          <span className="settings-label">히트맵 유형:</span>
          <div className="text-controls">
            <select
              value={heatmapPreset || 'severity'}
              onChange={(e) => onHeatmapPresetChange?.(e.target.value)}
              className="text-select"
            >
              <option value="severity">위험도</option>
              <option value="default">기본</option>
              <option value="recentness">최근성</option>
              <option value="colorBlind">색각이상</option>
              <option value="highContrast">고대비</option>
            </select>
          </div>
        </div>
      )}

      <div className="settings-row">
        <span className="settings-label">지하철 노선:</span>
        <div className="text-controls">
          <div className="switch-container">
            <input
              type="checkbox"
              id="subway-switch"
              checked={!!showSubway}
              onChange={(e) => onShowSubwayChange?.(e.target.checked)}
              className="switch-input"
            />
            <label htmlFor="subway-switch" className="switch-label">
              <span className="switch-slider"></span>
            </label>
          </div>
        </div>
      </div>

      {showSubway && (
        <div className="settings-row" style={{ paddingLeft: '20px', marginTop: '-8px', border: 'none', background: 'transparent' }}>
          <span className="settings-label">영향권:</span>
          <div className="text-controls">
            <div className="switch-container">
              <input
                type="checkbox"
                id="subway-influence-switch"
                checked={!!showSubwayInfluence}
                onChange={(e) => onShowSubwayInfluenceChange?.(e.target.checked)}
                className="switch-input"
              />
              <label htmlFor="subway-influence-switch" className="switch-label">
                <span className="switch-slider"></span>
              </label>
            </div>
            <div className="influence-info">
              <small style={{ color: '#666', fontSize: '12px' }}>
                1차(100m) 2차(300m) 3차(500m) 영향권 표시
              </small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapSettings;
