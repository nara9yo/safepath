import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

// 싱크홀 안전지도 도움말 팝업 (시뮬레이션 팝업 룩앤필 재사용)
const MapInfoPopup = ({ isOpen, onClose, category = 'risk' }) => {
  const [selected, setSelected] = useState('risk');

  const categories = [
    { id: 'risk', title: '위험도', icon: '⚠️' },
    { id: 'heatmap', title: '히트맵', icon: '🌡️' },
    { id: 'influence', title: '영향권', icon: '🚇' }
  ];

  const descriptions = {
    risk: {
      title: '위험도',
      description:
        '싱크홀 데이터의 가중 합산 결과를 시각화합니다. 낮음/중간/높음/치명적 구간으로 분류되며 지도와 목록의 색상, 아이콘에 반영됩니다.',
      bullets: [
        '+ 구간 정의: 데이터 최소~최대 범위를 4등분하여 표시',
        '+ 색상 의미: 녹색(낮음) → 노랑(중간) → 주황(높음) → 적색(치명적)',
        '+ 사용처: 마커 색상, 패널 통계, 리스트 하이라이트'
      ]
    },
    heatmap: {
      title: '히트맵',
      description:
        '지도 전역에서 위험도의 공간 분포를 색상 그라디언트로 표현합니다. 프리셋에 따라 색 구성과 대비가 달라집니다.',
      bullets: [
        '+ 기본: 위험도 중심의 표준 그라디언트',
        '+ 최근성: 최근 발생 지점 강조',
        '+ 색각이상/고대비: 접근성 및 가시성 강화 프리셋'
      ]
    },
    influence: {
      title: '지하철 영향권',
      description:
        '지하철 노선으로부터의 거리 구간을 1차(100m), 2차(300m), 3차(500m)로 나누어 표시합니다. 각 구간은 별도 색상/투명도로 렌더링됩니다.',
      bullets: [
        '+ 1차(100m): 직접 영향 구간, 가장 높은 가중 영향',
        '+ 2차(300m): 간접 영향 구간',
        '+ 3차(500m): 장기/누적 영향 가능 구간'
      ]
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelected(category);
    }
  }, [isOpen, category]);

  if (!isOpen) return null;

  const current = descriptions[selected];

  return ReactDOM.createPortal(
    (
      <div className="simulation-info-overlay">
        <div className="simulation-info-popup">
          <div className="popup-header">
            <h2 className="popup-title">싱크홀 안전지도 도움말</h2>
            <button className="popup-close" onClick={onClose}>×</button>
          </div>
          <div className="popup-content">
            <div className="popup-sidebar">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className={`factor-item ${selected === c.id ? 'active' : ''}`}
                  onClick={() => setSelected(c.id)}
                >
                  <span className="factor-icon">{c.icon}</span>
                  <span className="factor-name">{c.title}</span>
                  {selected === c.id && <span className="active-indicator">●</span>}
                </div>
              ))}
            </div>

            <div className="popup-main">
              <div className="description-section">
                <h3 className="description-title">{current.title}</h3>
                <p className="description-text">{current.description}</p>
                <div className="weight-factors">
                  {current.bullets.map((b, idx) => (
                    <div key={idx} className="weight-factor">
                      <div className="weight-factor-header">
                        <span className="weight-factor-name">{b}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="visual-guide">
                <div className="guide-title">시각적 가이드</div>
                {selected === 'risk' && (
                  <div className="guide-content">
                    <div className="guide-item">
                      <div className="guide-color low"></div>
                      <span>낮음</span>
                    </div>
                    <div className="guide-item">
                      <div className="guide-color medium"></div>
                      <span>중간</span>
                    </div>
                    <div className="guide-item">
                      <div className="guide-color high"></div>
                      <span>높음</span>
                    </div>
                    <div className="guide-item">
                      <div className="guide-color critical"></div>
                      <span>치명적</span>
                    </div>
                  </div>
                )}

                {selected === 'influence' && (
                  <div className="guide-content">
                    <div className="guide-item">
                      <div className="guide-color" style={{ background: '#DC143C', opacity: 0.25 }}></div>
                      <span>1차 영향권 (100m)</span>
                    </div>
                    <div className="guide-item">
                      <div className="guide-color" style={{ background: '#FF6B35', opacity: 0.2 }}></div>
                      <span>2차 영향권 (300m)</span>
                    </div>
                    <div className="guide-item">
                      <div className="guide-color" style={{ background: '#FFD700', opacity: 0.15 }}></div>
                      <span>3차 영향권 (500m)</span>
                    </div>
                  </div>
                )}

                {selected === 'heatmap' && (
                  <div className="guide-content">
                    <div className="guide-item" style={{ width: '100%' }}>
                      <div
                        className="guide-color"
                        style={{
                          width: '100%',
                          height: 12,
                          borderRadius: 4,
                          background:
                            'linear-gradient(to right, #2e7d32, #fdd835, #fb8c00, #c62828)'
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    document.body
  );
};

export default MapInfoPopup;


