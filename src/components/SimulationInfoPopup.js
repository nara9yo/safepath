import React, { useState } from 'react';
import ReactDOM from 'react-dom';

const SimulationInfoPopup = ({ isOpen, onClose, initialCategory = 'sinkhole-factors' }) => {
  const [selectedFactor, setSelectedFactor] = useState('sinkhole-size');

  // 가중치 요인 설명 데이터
  const factorDescriptions = {
    'sinkhole-size': {
      title: '1. 싱크홀 크기 가중치',
      description: '싱크홀의 물리적 크기가 위험도에 미치는 영향을 조정합니다. 큰 싱크홀일수록 더 높은 위험도를 부여하여 대형 사고의 심각성을 반영합니다.',
      factors: [
        {
          name: '크기 가중치 영향도',
          weight: '0.0 ~ 5.0배',
          description: '싱크홀의 폭, 연장, 깊이를 곱한 값에 적용되는 가중치 배수',
          detail: 'ㄴ 싱크홀의 물리적 규모가 클수록 위험도가 기하급수적으로 증가'
        }
      ]
    },
    'sinkhole-damage': {
      title: '2. 싱크홀 피해 가중치',
      description: '싱크홀 발생으로 인한 인명피해와 재산피해가 위험도에 미치는 영향을 조정합니다. 사망, 부상, 차량피해를 종합적으로 고려합니다.',
      factors: [
        {
          name: '피해 가중치 영향도',
          weight: '0.0 ~ 5.0배',
          description: '사망(12점), 부상(3점), 차량피해(1점) 점수에 적용되는 가중치 배수',
          detail: 'ㄴ 인명피해가 클수록 위험도가 크게 증가하며, 사고의 심각성을 반영'
        }
      ]
    },
    'sinkhole-time': {
      title: '3. 싱크홀 시간 가중치',
      description: '싱크홀 발생 시점의 최근성이 위험도에 미치는 영향을 조정합니다. 최근 발생한 싱크홀일수록 더 높은 위험도를 부여합니다.',
      factors: [
        {
          name: '시간 가중치 영향도',
          weight: '0.0 ~ 3.0배',
          description: '발생 시점에 따른 시간 가중치에 적용되는 배수',
          detail: 'ㄴ 최근 발생한 싱크홀일수록 현재 위험 상황을 더 잘 반영'
        }
      ]
    },
    'sinkhole-frequency': {
      title: '4. 싱크홀 반복 발생 가중치',
      description: '같은 지점에서 반복적으로 발생하는 싱크홀의 위험도를 조정합니다. 짧은 기간에 여러 번 발생할수록 높은 위험도를 부여합니다.',
      factors: [
        {
          name: '반복 발생 가중치 영향도',
          weight: '0.0 ~ 3.0배',
          description: '월당 발생률에 따른 반복 발생 가중치에 적용되는 배수',
          detail: 'ㄴ 같은 지점에서 반복 발생하는 싱크홀은 지반 불안정성을 나타냄'
        }
      ]
    },
    'subway-level1': {
      title: '5. 지하철 1차 영향권 가중치',
      description: '지하철 노선으로부터 100m 이내 지역의 위험도 가중치를 조정합니다. 지하철 공사와 직접적으로 연관된 지역의 위험도를 반영합니다.',
      factors: [
        {
          name: '1차 영향권 가중치',
          weight: '0.0 ~ 1.0',
          description: '지하철 노선 100m 이내 지역에 적용되는 가중치',
          detail: 'ㄴ 지하철 공사로 인한 지반 변동과 매설물 영향이 집중되는 구간'
        }
      ]
    },
    'subway-level2': {
      title: '6. 지하철 2차 영향권 가중치',
      description: '지하철 노선으로부터 100m~300m 지역의 위험도 가중치를 조정합니다. 지하철 공사의 간접적 영향을 받는 지역의 위험도를 반영합니다.',
      factors: [
        {
          name: '2차 영향권 가중치',
          weight: '0.0 ~ 0.8',
          description: '지하철 노선 100m~300m 지역에 적용되는 가중치',
          detail: 'ㄴ 굴착공사나 공동 형성 가능성이 높아 위험 중간 정도'
        }
      ]
    },
    'subway-level3': {
      title: '7. 지하철 3차 영향권 가중치',
      description: '지하철 노선으로부터 300m~500m 지역의 위험도 가중치를 조정합니다. 지하철 공사의 장기적 영향을 받는 지역의 위험도를 반영합니다.',
      factors: [
        {
          name: '3차 영향권 가중치',
          weight: '0.0 ~ 0.5',
          description: '지하철 노선 300m~500m 지역에 적용되는 가중치',
          detail: 'ㄴ 직접 영향은 낮지만 누적 침하 가능성이 있는 지역'
        }
      ]
    }
  };

  const factorCategories = [
    {
      id: 'sinkhole-factors',
      title: '싱크홀 위험도 요인',
      icon: '🚧',
      factors: [
        { id: 'sinkhole-size', name: '크기 가중치', icon: '📏' },
        { id: 'sinkhole-damage', name: '피해 가중치', icon: '⚠️' },
        { id: 'sinkhole-time', name: '시간 가중치', icon: '⏰' },
        { id: 'sinkhole-frequency', name: '반복 발생 가중치', icon: '🔄' }
      ]
    },
    {
      id: 'subway-factors',
      title: '지하철 영향도 요인',
      icon: '🚇',
      factors: [
        { id: 'subway-level1', name: '1차 영향권', icon: '1️⃣' },
        { id: 'subway-level2', name: '2차 영향권', icon: '2️⃣' },
        { id: 'subway-level3', name: '3차 영향권', icon: '3️⃣' }
      ]
    }
  ];

  // 초기 카테고리에 따라 첫 번째 요인 선택
  React.useEffect(() => {
    if (isOpen) {
      if (initialCategory === 'sinkhole-factors') {
        setSelectedFactor('sinkhole-size');
      } else if (initialCategory === 'subway-factors') {
        setSelectedFactor('subway-level1');
      }
    }
  }, [isOpen, initialCategory]);

  if (!isOpen) return null;

  const currentDescription = factorDescriptions[selectedFactor];

  return ReactDOM.createPortal((
    <div className="simulation-info-overlay">
      <div className="simulation-info-popup">
        <div className="popup-header">
          <h2 className="popup-title">시뮬레이션 도움말</h2>
          <button className="popup-close" onClick={onClose}>×</button>
        </div>
        
        <div className="popup-content">
          <div className="popup-sidebar">
            {factorCategories.map(category => (
              <div key={category.id} className="factor-category">
                <h3 className="category-title">
                  <span className="category-icon">{category.icon}</span>
                  {category.title}
                </h3>
                <div className="factor-list">
                  {category.factors.map(factor => (
                    <div
                      key={factor.id}
                      className={`factor-item ${selectedFactor === factor.id ? 'active' : ''}`}
                      onClick={() => setSelectedFactor(factor.id)}
                    >
                      <span className="factor-icon">{factor.icon}</span>
                      <span className="factor-name">{factor.name}</span>
                      {selectedFactor === factor.id && <span className="active-indicator">●</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="popup-main">
            <div className="description-section">
              <h3 className="description-title">{currentDescription.title}</h3>
              <p className="description-text">{currentDescription.description}</p>
              
              <div className="weight-factors">
                {currentDescription.factors.map((factor, index) => (
                  <div key={index} className="weight-factor">
                    <div className="weight-factor-header">
                      <span className="weight-factor-name">+ {factor.name}</span>
                      <span className="weight-factor-value">{factor.weight}</span>
                    </div>
                    <p className="weight-factor-description">{factor.description}</p>
                    <p className="weight-factor-detail">{factor.detail}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="visual-guide">
              <div className="guide-title">시각적 가이드</div>
              <div className="guide-content">
                <div className="guide-item">
                  <div className="guide-color low"></div>
                  <span>낮음 (0-2)</span>
                </div>
                <div className="guide-item">
                  <div className="guide-color medium"></div>
                  <span>중간 (2-5)</span>
                </div>
                <div className="guide-item">
                  <div className="guide-color high"></div>
                  <span>높음 (5-10)</span>
                </div>
                <div className="guide-item">
                  <div className="guide-color critical"></div>
                  <span>치명적 (10+)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ), document.body);
};

export default SimulationInfoPopup;
