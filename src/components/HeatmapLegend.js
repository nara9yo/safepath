// 컴포넌트: 히트맵 범례
// 역할:
//  - 히트맵 그라디언트 시각화 및 최소/중앙/최대 레이블 표시
//  - 도움말 팝업(MapInfoPopup) 연동
// 입력 props: gradient, min, max, title, barWidth
import React, { useState } from 'react';
import MapInfoPopup from './MapInfoPopup';

const HeatmapLegend = ({ gradient = [], min = 0, max = 10, title = '위험도', barWidth = 280 }) => {
  const steps = gradient.length;
  const labels = [min, (min + max) / 2, max];
  const background = `linear-gradient(to right, ${gradient.join(',')})`;

  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="heatmap-legend" style={{ padding: 8, position: 'relative' }}>
      <div style={{ fontSize: 12, marginBottom: 4 }}>{title}</div>
      <button
        className="legend-info-btn"
        title="위험도 설명 보기"
        onClick={() => setShowInfo(true)}
        style={{ position: 'absolute', top: 6, right: 6 }}
      >
        i
      </button>
      <div style={{ height: 10, width: barWidth, background, borderRadius: 4 }} />
      <div style={{ width: barWidth, display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 4 }}>
        <span>{labels[0]}</span>
        <span>{labels[1]}</span>
        <span>{labels[2]}</span>
      </div>
      <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>
        스펙트럼 단계: {steps}
      </div>
      <MapInfoPopup isOpen={showInfo} onClose={() => setShowInfo(false)} category="risk" />
    </div>
  );
};

export default HeatmapLegend;



