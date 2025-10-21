import React from 'react';

const ModeToggle = ({ showHeatmap, onShowHeatmapChange, heatmapPreset, onHeatmapPresetChange, rescaleMethod, onRescaleMethodChange }) => {
  return (
    <div className="mode-toggle">

      <div className="filter-section">
        <div className="filter-header">
          <div className="filter-header-left">
            <span className="filter-icon">🎨</span>
            <span className="filter-title">히트맵 설정</span>
          </div>
        </div>
        <div className="filter-content">
          <label htmlFor="show-heatmap" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              id="show-heatmap"
              type="checkbox"
              checked={!!showHeatmap}
              onChange={(e) => onShowHeatmapChange?.(e.target.checked)}
            />
            히트맵 표시
          </label>
          <div style={{ marginTop: 8 }}>
            <label htmlFor="heatmap-preset" style={{ display: 'block', marginBottom: 6 }}>스펙트럼 프리셋</label>
            <select
              id="heatmap-preset"
              value={heatmapPreset || 'severity'}
              onChange={(e) => onHeatmapPresetChange?.(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="severity">위험도 중심</option>
              <option value="default">기본</option>
              <option value="recentness">최근성</option>
              <option value="colorBlind">색각이상 친화</option>
              <option value="highContrast">고대비(저사양)</option>
            </select>
          </div>
          <div style={{ marginTop: 8 }}>
            <label htmlFor="rescale-method" style={{ display: 'block', marginBottom: 6 }}>재스케일 방식</label>
            <select
              id="rescale-method"
              value={rescaleMethod || 'p90'}
              onChange={(e) => onRescaleMethodChange?.(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="p90">P90 클리핑</option>
              <option value="iqr">IQR(사분위) 상한</option>
              <option value="none">해제</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModeToggle;

