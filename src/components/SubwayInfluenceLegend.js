import React from 'react';
import { SUBWAY_INFLUENCE_CONFIG, SUBWAY_INFLUENCE_LEVELS } from '../utils/constants';

const SubwayInfluenceLegend = ({ 
  title = "지하철 영향권",
  barWidth = 200 
}) => {
  return (
    <div style={{ padding: 8 }}>
      {/* 타이틀 */}
      <div style={{
        fontSize: 12,
        marginBottom: 4,
        color: '#333'
      }}>
        {title}
      </div>
      
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
    </div>
  );
};

export default SubwayInfluenceLegend;
