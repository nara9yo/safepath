import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

// 컴포넌트: 지도 도움말 팝업
// 역할:
//  - 위험도/히트맵/영향권 카테고리별 설명을 개조식으로 제공
//  - 사이드 탭 전환, 포탈 렌더링, 외부 트리거로 카테고리 초기화
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
        '싱크홀 위험도는 여러 요인을 정규화·가중하여 합성한 최종 점수입니다. 점수는 낮음/중간/높음/치명적 4구간으로 구분되어 지도 마커와 목록의 색/아이콘에 반영됩니다.',
      bullets: [
        {
          title: '계산 개요',
          description:
            '최종위험도 = 기본위험도 + 지하철영향가중치. 기본위험도는 규모, 피해, 최근성, 반복발생을 가중합으로 계산합니다.'
        },
        {
          title: '기본위험도 구성',
          description:
            '기본위험도 = (규모지표 × 크기 가중치) + (피해지표 × 피해 가중치) + (최근성지표 × 시간 가중치) + (반복지표 × 반복 가중치)'
        },
        {
          title: '지표 정규화',
          description:
            '서로 단위가 다른 입력(폭/연장/깊이, 사상/부상/차량피해, 발생시점, 재발횟수)을 0~1 범위로 정규화하여 공정하게 비교합니다.'
        },
        {
          title: '가중치 역할',
          description:
            '도메인 지식이나 운영 목적에 따라 각 지표의 민감도를 조정합니다. 예) 인명피해를 더 중요시하면 피해 가중치를 상향.'
        },
        {
          title: '최종 구간화',
          description:
            '프로젝트 내 데이터의 최소~최대 범위를 4등분하여 낮음→중간→높음→치명적으로 표시합니다. 색상은 녹→노→주→적 순.'
        },
        {
          title: '검증 포인트',
          description:
            '특정 지역/기간의 결과가 기대와 다를 경우, 원천지표(규모/피해/최근성/반복)와 가중치 설정을 우선 점검하세요.'
        }
      ]
    },
    heatmap: {
      title: '히트맵',
      description:
        '히트맵은 개별 지점의 점 정보를 연속적인 밀도/강도 분포로 바꿔 보여줍니다. 이상치에 덜 민감하며, 핫스팟(집중 발생 구역) 파악과 트렌드 확인에 유리합니다.',
      bullets: [
        {
          title: '왜 히트맵인가?',
          description:
            '마커가 많아 겹치는 지역에서도 위험 집중도를 한눈에 파악할 수 있고, 개별 점의 노이즈를 평균화해 큰 흐름을 드러냅니다.'
        },
        {
          title: '프리셋 - 기본(위험도)',
          description:
            '최종위험도에 비례하여 색 강도를 표시합니다. 고위험 지역 탐색의 기본 설정으로 추천합니다.'
        },
        {
          title: '프리셋 - 최근성',
          description:
            '최근 발생 지점에 추가 가중을 부여해 최신 위험 경향을 강조합니다. 단기 대응/모니터링에 적합합니다.'
        },
        {
          title: '프리셋 - 색각이상',
          description:
            '색각이상 친화 팔레트를 사용해 적록색 구분이 어려운 사용자도 위험 패턴을 인지할 수 있도록 설계했습니다.'
        },
        {
          title: '프리셋 - 고대비',
          description:
            '밝기·채도 대비를 크게 하여 야외/저해상도 환경에서도 구간 경계를 또렷하게 구분할 수 있게 합니다.'
        },
        {
          title: '권장 사용법',
          description:
            '히트맵과 개별 마커/리스트를 병행해, “어디가 뜨거운가(히트맵)”와 “무엇이 원인인가(마커 세부)”를 함께 확인하세요.'
        }
      ]
    },
    influence: {
      title: '지하철 영향권',
      description:
        '도심 지하철은 굴착/차수·배수/차량진동/매설물 공정 등으로 지반에 복합적인 응력 변화를 유발할 수 있습니다. 이를 거리권역으로 단순화하여 위험도에 가중 반영합니다.',
      bullets: [
        {
          title: '권역 기준(100m/300m/500m)의 근거',
          description:
            '도시철도 굴착 영향 연구 및 지반공학 경험칙을 참고해, 직접 영향(≈100m), 간접 영향(≈300m), 장기·누적 영향 가능(≈500m)으로 실무 친화적 구간화를 채택했습니다.'
        },
        {
          title: '지하철이 미치는 주요 메커니즘',
          description:
            '① 굴착/차수: 지반 이완·지하수위 변동으로 공동 형성 가능성 증가 ② 진동/동하중: 미세 균열·침하 촉진 ③ 매설물/지장물: 누수·지반세굴 리스크 ④ 유지보수/공사: 국부적 지반교란'
        },
        {
          title: '가중치 해석',
          description:
            '1차 > 2차 > 3차 순으로 위험 기여도를 낮추어 반영합니다. 실제 현장과 맞지 않는 경우, 거리/가중치를 설정에서 조정할 수 있습니다.'
        },
        {
          title: '활용 팁',
          description:
            '히트맵과 병행하여 “지하철 노선 근접 구역의 고위험 핫스팟”을 빠르게 파악하고, 시설점검·배수관리 등 선제 조치 지역을 선정하세요.'
        }
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
                  {current.bullets.map((item, index) => {
                    const isString = typeof item === 'string';
                    const title = isString ? item : item.title;
                    const description = isString ? null : item.description;
                    const details = !isString && Array.isArray(item.details) ? item.details : null;
                    return (
                      <div key={index} className="weight-factor">
                        <div className="weight-factor-header">
                          <span className="weight-factor-name">+ {title}</span>
                        </div>
                        {description && (
                          <p className="weight-factor-description">{description}</p>
                        )}
                        {details && details.map((d, i) => (
                          <p key={i} className="weight-factor-detail">{d}</p>
                        ))}
                      </div>
                    );
                  })}
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


