import React from 'react';

const ModeToggle = ({ mode, onModeChange, inspectionRadiusKm, onInspectionRadiusChange, showHeatmap, onShowHeatmapChange, heatmapPreset, onHeatmapPresetChange, showRouteHeatband, onShowRouteHeatbandChange, rescaleMethod, onRescaleMethodChange }) => {
  const radiusMeters = Math.round((inspectionRadiusKm || 0) * 1000);
  return (
    <div className="mode-toggle">
      <div className="filter-section">
        <div className="filter-header">
          <div className="filter-header-left">
            <span className="filter-icon">🧭</span>
            <span className="filter-title">경로 모드</span>
          </div>
        </div>
        <div className="filter-content">
          <div className="mode-toggle-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0 }}>{mode === 'normal' ? '일반 모드' : '안전점검 모드'}</h3>
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
          <div className="mode-description" style={{ marginTop: 6 }}>
            {mode === 'normal'
              ? '싱크홀을 피하는 안전한 경로를 제공합니다'
              : '싱크홀을 포함한 최단 경로를 제공합니다'
            }
          </div>
        </div>
      </div>

      <div className="filter-section" style={{ marginTop: 12 }}>
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
          <label htmlFor="show-route-heatband" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <input
              id="show-route-heatband"
              type="checkbox"
              checked={!!showRouteHeatband}
              onChange={(e) => onShowRouteHeatbandChange?.(e.target.checked)}
            />
            경로 히트밴드 표시
          </label>
        </div>
      </div>

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
        <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
          {mode === 'normal' 
            ? '10m ~ 200m (싱크홀 감지 범위)' 
            : '10m ~ 200m'
          }
        </div>
      </div>
    </div>
  );
};

export default ModeToggle;

