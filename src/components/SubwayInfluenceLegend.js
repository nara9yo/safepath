// 컴포넌트: 지하철 영향권 범례
// 역할:
//  - 1/2/3차 영향권 색상바와 눈금 표시
//  - 도움말 팝업(MapInfoPopup) 연동
// 입력 props: title, barWidth
import React, { useState } from 'react';
import { SUBWAY_INFLUENCE_CONFIG, SUBWAY_INFLUENCE_LEVELS } from '../utils/constants';
import MapInfoPopup from './MapInfoPopup';

const SubwayInfluenceLegend = ({ 
  title = "지하철 영향권",
  barWidth = 200 
}) => {
  const [showInfo, setShowInfo] = useState(false);
  return (
    <div style={{ padding: 8, position: 'relative' }}>
      {/* 타이틀 */}
      <div style={{
        fontSize: 12,
        marginBottom: 4,
        color: '#333'
      }}>
        {title}
      </div>
      <button
        className="legend-info-btn"
        title="영향권 설명 보기"
        onClick={() => setShowInfo(true)}
        style={{ position: 'absolute', top: 6, right: 6 }}
      >
        i
      </button>
      
      {/* 3등분 색상 바 */}
      <div style={{
        display: 'flex',
        height: 20,
        width: barWidth,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 4,
        position: 'relative'
      }}>
        {[SUBWAY_INFLUENCE_LEVELS.LEVEL1, SUBWAY_INFLUENCE_LEVELS.LEVEL2, SUBWAY_INFLUENCE_LEVELS.LEVEL3].map(level => {
          const config = SUBWAY_INFLUENCE_CONFIG[level];
          return (
            <div key={level} style={{
              flex: 1,
              background: config.color,
              opacity: config.opacity,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              color: 'white',
              fontWeight: 'bold',
              textShadow: '1px 1px 2px rgba(0,0,0,0.7)'
            }}>
              {config.label}
            </div>
          );
        })}
      </div>
      
      {/* 눈금 표시 */}
      <div style={{
        width: barWidth,
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 11,
        marginTop: 4,
        color: '#666'
      }}>
        <span>0</span>
        <span>100</span>
        <span>300</span>
        <span>500</span>
      </div>
      <MapInfoPopup isOpen={showInfo} onClose={() => setShowInfo(false)} category="influence" />
    </div>
  );
};

export default SubwayInfluenceLegend;
