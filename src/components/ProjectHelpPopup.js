import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

// 컴포넌트: 프로젝트 도움말 팝업
// 역할:
//  - 프로젝트 목적/활용처/데이터/향후계획을 개조식으로 설명
//  - 사이드 탭 전환 및 포탈 렌더링
const ProjectHelpPopup = ({ isOpen, onClose }) => {
  const [selected, setSelected] = useState('purpose');

  const categories = [
    { id: 'purpose', title: '목적', icon: '🎯' },
    { id: 'usage', title: '활용처', icon: '💼' },
    { id: 'data', title: '사용 데이터', icon: '📊' },
    { id: 'future', title: '향후 계획', icon: '🚀' }
  ];

  const descriptions = {
    purpose: {
      title: '프로젝트 목적',
      description: '싱크홀 발생 위험도를 시각화하고 예측하여 도시 안전을 향상시키는 것을 목표로 합니다.',
      bullets: [
        {
          title: '핵심 목표',
          description: '지하 인프라와 싱크홀 발생 패턴을 분석하여 위험 지역을 사전에 파악하고 예방 대책을 수립합니다.'
        },
        {
          title: '주요 기능',
          description: '싱크홀 데이터 시각화, 지하철 영향권 분석, 위험도 시뮬레이션, 실시간 모니터링을 제공합니다.'
        },
        {
          title: '대상 사용자',
          description: '도시계획자, 안전관리자, 시민, 연구자 등이 활용할 수 있는 통합 플랫폼입니다.'
        }
      ]
    },
    usage: {
      title: '활용처',
      description: '다양한 분야에서 싱크홀 위험 관리와 도시 안전 계획 수립에 활용할 수 있습니다.',
      bullets: [
        {
          title: '도시계획 및 관리',
          description: '개발 우선순위 결정, 인프라 투자 계획, 토지 이용 계획 수립 시 위험도 고려'
        },
        {
          title: '안전관리 및 대응',
          description: '위험 지역 사전 점검, 응급 대응 계획 수립, 시민 안전 교육 자료 활용'
        },
        {
          title: '연구 및 분석',
          description: '싱크홀 발생 패턴 연구, 지하 인프라 영향 분석, 예측 모델 개발'
        },
        {
          title: '시민 서비스',
          description: '안전한 경로 안내, 위험 지역 알림, 투명한 정보 공개'
        }
      ]
    },
    data: {
      title: '사용 데이터',
      description: '현재 정적 데이터를 사용하며, 향후 실시간 데이터 연동을 계획하고 있습니다.',
      bullets: [
        {
          title: '지하사고 데이터',
          description: '싱크홀 발생 이력, 규모, 피해 정보, 발생 시점, 위치 정보 등을 포함합니다.'
        },
        {
          title: '지하철 노선도',
          description: '지하철 노선, 역 위치, 터널 구간 정보를 활용하여 영향권 분석에 사용합니다.'
        },
        {
          title: '현재 데이터 상태',
          description: '국가정보자원관리원 화재로 인해 정적 데이터를 사용 중입니다.'
        },
        {
          title: '데이터 처리',
          description: '위험도 계산, 공간 분석, 시각화를 위해 데이터를 정규화하고 가중치를 적용합니다.'
        }
      ]
    },
    future: {
      title: '향후 계획',
      description: '더 정확하고 실시간적인 분석을 위해 다양한 데이터 소스와 기술을 도입할 예정입니다.',
      bullets: [
        {
          title: '지하수심도분포도 데이터 활용',
          description: '지하수위 정보를 추가하여 지하수 관련 싱크홀 위험도를 더 정확하게 예측합니다.'
        },
        {
          title: '지질정보 데이터 활용',
          description: '지반 특성, 암반 정보를 활용하여 지질학적 요인을 위험도 계산에 반영합니다.'
        },
        {
          title: '실시간 데이터 연동',
          description: 'AS-IS: 정적 데이터 사용 → TO-BE: 공공데이터 포털 API를 통한 실시간 데이터 활용'
        },
        {
          title: 'AI/ML 기술 도입',
          description: '머신러닝을 활용한 예측 모델 고도화, 자동화된 위험도 업데이트 시스템 구축'
        },
        {
          title: '확장 계획',
          description: '다른 도시로의 확장, 모바일 앱 개발, 시민 참여 기능 추가 등을 검토 중입니다.'
        }
      ]
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelected('purpose');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const current = descriptions[selected];

  return ReactDOM.createPortal(
    (
      <div className="simulation-info-overlay">
        <div className="simulation-info-popup">
          <div className="popup-header">
            <h2 className="popup-title">싱크홀 안전지도 프로젝트</h2>
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
                  {current.bullets.map((item, index) => (
                    <div key={index} className="weight-factor">
                      <div className="weight-factor-header">
                        <span className="weight-factor-name">+ {item.title}</span>
                      </div>
                      <p className="weight-factor-description">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="visual-guide">
                <div className="guide-title">프로젝트 개요</div>
                <div className="guide-content">
                  <div className="guide-item">
                    <div className="guide-color" style={{ background: '#2196F3' }}></div>
                    <span>현재 버전: 정적 데이터 기반</span>
                  </div>
                  <div className="guide-item">
                    <div className="guide-color" style={{ background: '#4CAF50' }}></div>
                    <span>향후 계획: 실시간 데이터 연동</span>
                  </div>
                  <div className="guide-item">
                    <div className="guide-color" style={{ background: '#FF9800' }}></div>
                    <span>확장 예정: AI/ML 기술 도입</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    document.body
  );
};

export default ProjectHelpPopup;
