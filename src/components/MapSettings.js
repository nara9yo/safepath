import React from 'react';
import ModeToggle from './ModeToggle';

const MapSettings = ({
  mapType,
  onMapTypeChange,
  showHeatmap,
  onShowHeatmapChange,
  heatmapPreset,
  onHeatmapPresetChange
}) => {
  const mapTypes = [
    { id: 'terrain', name: '지형', icon: '🏔️' },
    { id: 'normal', name: '일반', icon: '🗺️' },
    { id: 'satellite', name: '위성', icon: '🛰️' },
    { id: 'hybrid', name: '하이브리드', icon: '🌍' }
  ];

  return (
    <div className="map-settings">
      <div className="settings-section">
        <h3 className="settings-title">🗺️ 지도 유형</h3>
        <div className="map-type-options">
          {mapTypes.map((type) => (
            <button
              key={type.id}
              className={`map-type-option ${mapType === type.id ? 'selected' : ''}`}
              onClick={() => onMapTypeChange(type.id)}
            >
              <span className="map-type-icon">{type.icon}</span>
              <span className="map-type-name">{type.name}</span>
              {mapType === type.id && (
                <span className="map-type-check">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <h3 className="settings-title">🔥 히트맵 설정</h3>
        <ModeToggle
          showHeatmap={showHeatmap}
          onShowHeatmapChange={onShowHeatmapChange}
          heatmapPreset={heatmapPreset}
          onHeatmapPresetChange={onHeatmapPresetChange}
        />
      </div>
    </div>
  );
};

export default MapSettings;
