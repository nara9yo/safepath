// 컴포넌트: 시뮬레이션 패널
// 역할:
//  - 사용자 가중치 파라미터(UI 슬라이더) → 시뮬레이션 데이터 생성
//  - 결과 통계/분포/Top5 요약 제공 및 지도/리스트와 상호작용
// 입력 props: sinkholes, subwayStations, onSimulationDataChange, onSinkholeClick
// 내부 상태: sinkholeParams, subwayParams, 필터/섹션 토글
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  generateSimulationData, 
  calculateSimulationStats, 
  SIMULATION_DEFAULTS 
} from '../utils/simulationAnalyzer';
import { getRiskLevelStyle, getGradientColor, getSubwayInfluenceStyle } from '../utils/constants';
import SimulationInfoPopup from './SimulationInfoPopup';

const SimulationPanel = ({
  sinkholes = [],
  subwayStations = [],
  onSimulationDataChange,
  onSimulationLegendSourceChange,
  onSinkholeClick // 새로 추가된 prop
}) => {
  // 시뮬레이션 파라미터 상태
  const [sinkholeParams, setSinkholeParams] = useState(SIMULATION_DEFAULTS.SINKHOLE);
  const [subwayParams, setSubwayParams] = useState(SIMULATION_DEFAULTS.SUBWAY);
  
  // UI 상태
  const [showStats, setShowStats] = useState(true);
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [popupCategory, setPopupCategory] = useState('sinkhole-factors');
  const [isSinkholeSectionExpanded, setIsSinkholeSectionExpanded] = useState(false);
  const [isSubwaySectionExpanded, setIsSubwaySectionExpanded] = useState(false);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(true);
  
  // 필터 상태
  const [selectedRiskFilter, setSelectedRiskFilter] = useState(null);
  const [selectedSubwayFilter, setSelectedSubwayFilter] = useState(null);
  
  // 시뮬레이션은 고정 임계값(100/300/500m)을 사용하므로 거리 파라미터는 전달하지 않음

  // 시뮬레이션 데이터 생성
  const { rawData, filteredData: simulationData } = useMemo(() => {
    if (!sinkholes || sinkholes.length === 0) return [];
    
    const data = generateSimulationData(
      sinkholes, 
      subwayStations, 
      sinkholeParams, 
      subwayParams
    );
    
    // 필터링 적용
    let filteredData = data;
    
    // 위험도 필터 적용
    if (selectedRiskFilter) {
      filteredData = filteredData.filter(sinkhole => sinkhole.riskLevel === selectedRiskFilter);
    }
    
    // 지하철 영향권 필터 적용
    if (selectedSubwayFilter) {
      filteredData = filteredData.filter(sinkhole => sinkhole.subwayInfluenceLevel === selectedSubwayFilter);
    }
    
    return { rawData: data, filteredData };
  }, [sinkholes, subwayStations, sinkholeParams, subwayParams, selectedRiskFilter, selectedSubwayFilter]);
  
  // 시뮬레이션 데이터 변경 시 부모 컴포넌트에 전달
  useEffect(() => {
    if (onSimulationDataChange) {
      onSimulationDataChange(simulationData);
    }
    if (onSimulationLegendSourceChange) {
      onSimulationLegendSourceChange(rawData || []);
    }
  }, [simulationData, rawData, onSimulationDataChange, onSimulationLegendSourceChange]);
  
  // 통계 계산
  const stats = useMemo(() => {
    return calculateSimulationStats(simulationData);
  }, [simulationData]);
  
  // 싱크홀 파라미터 변경 핸들러
  const handleSinkholeParamChange = useCallback((param, value) => {
    setSinkholeParams(prev => ({
      ...prev,
      [param]: Number(value)
    }));
  }, []);
  
  
  // 기본값 리셋
  const handleReset = useCallback(() => {
    setSinkholeParams(SIMULATION_DEFAULTS.SINKHOLE);
    setSubwayParams(SIMULATION_DEFAULTS.SUBWAY);
    setSelectedRiskFilter(null);
    setSelectedSubwayFilter(null);
  }, []);
  
  const handleSubwayParamChange = useCallback((param, value) => {
    setSubwayParams(prev => {
      const newParams = {
        ...prev,
        [param]: Number(value)
      };
      return newParams;
    });
  }, []);
  
  // 위험도 필터 핸들러
  const handleRiskFilterClick = useCallback((riskLevel) => {
    if (selectedRiskFilter === riskLevel) {
      setSelectedRiskFilter(null); // 같은 항목 클릭 시 필터 해제
    } else {
      setSelectedRiskFilter(riskLevel);
      setSelectedSubwayFilter(null); // 다른 필터 해제
    }
  }, [selectedRiskFilter]);
  
  // 지하철 영향권 필터 핸들러
  const handleSubwayFilterClick = useCallback((influenceLevel) => {
    if (selectedSubwayFilter === influenceLevel) {
      setSelectedSubwayFilter(null); // 같은 항목 클릭 시 필터 해제
    } else {
      setSelectedSubwayFilter(influenceLevel);
      setSelectedRiskFilter(null); // 다른 필터 해제
    }
  }, [selectedSubwayFilter]);
  
  // 파라미터가 기본값과 다른지 확인
  const isModified = useMemo(() => {
    const sinkholeModified = Object.keys(SIMULATION_DEFAULTS.SINKHOLE).some(
      key => Math.abs(sinkholeParams[key] - SIMULATION_DEFAULTS.SINKHOLE[key]) > 0.01
    );
    const subwayModified = Object.keys(SIMULATION_DEFAULTS.SUBWAY).some(
      key => Math.abs(subwayParams[key] - SIMULATION_DEFAULTS.SUBWAY[key]) > 0.01
    );
    return sinkholeModified || subwayModified;
  }, [sinkholeParams, subwayParams]);
  
  return (
    <div className="simulation-panel">
      <div 
        className={`simulation-header clickable ${!isSettingsExpanded ? 'collapsed' : ''}`}
        onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
      >
        <h3>🎛️ 시뮬레이션 설정</h3>
        <div className="simulation-controls">
          <button 
            className={`reset-btn ${isModified ? 'modified' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              handleReset();
            }}
            title="기본값으로 리셋"
          >
            🔄 리셋
          </button>
          <span className="parameter-toggle-icon">{isSettingsExpanded ? '▼' : '▶'}</span>
        </div>
      </div>
      
      {isSettingsExpanded && (
        <div className="settings-content">
          {/* 싱크홀 파라미터 */}
          <div className="parameter-group">
            <div 
              className="parameter-group-header clickable"
              onClick={() => setIsSinkholeSectionExpanded(!isSinkholeSectionExpanded)}
            >
              <h4 className="parameter-group-title">🚧 싱크홀 위험도 요인</h4>
              <div className="parameter-header-controls">
                <button 
                  className="parameter-info-btn"
                  onClick={(e) => {
                    e.stopPropagation(); // 헤더 클릭 이벤트 전파 방지
                    setPopupCategory('sinkhole-factors');
                    setShowInfoPopup(true);
                  }}
                  title="싱크홀 위험도 요인 설명 보기"
                >
                  i
                </button>
                <span className="parameter-toggle-icon">{isSinkholeSectionExpanded ? '▼' : '▶'}</span>
              </div>
            </div>
            
            {isSinkholeSectionExpanded && (
              <div className="parameter-content">
                <div className="parameter-item">
                  <label className="parameter-label">
                    크기 가중치 영향도
                    <span className="parameter-value">{sinkholeParams.SIZE_WEIGHT_MULTIPLIER.toFixed(1)}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={sinkholeParams.SIZE_WEIGHT_MULTIPLIER}
                    onChange={(e) => handleSinkholeParamChange('SIZE_WEIGHT_MULTIPLIER', e.target.value)}
                    className="parameter-slider"
                  />
                  <div className="parameter-range">0.0 - 5.0</div>
                </div>
                
                <div className="parameter-item">
                  <label className="parameter-label">
                    피해 가중치 영향도
                    <span className="parameter-value">{sinkholeParams.DAMAGE_WEIGHT_MULTIPLIER.toFixed(1)}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={sinkholeParams.DAMAGE_WEIGHT_MULTIPLIER}
                    onChange={(e) => handleSinkholeParamChange('DAMAGE_WEIGHT_MULTIPLIER', e.target.value)}
                    className="parameter-slider"
                  />
                  <div className="parameter-range">0.0 - 5.0</div>
                </div>
                
                <div className="parameter-item">
                  <label className="parameter-label">
                    시간 가중치 영향도
                    <span className="parameter-value">{sinkholeParams.TIME_WEIGHT_MULTIPLIER.toFixed(1)}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.1"
                    value={sinkholeParams.TIME_WEIGHT_MULTIPLIER}
                    onChange={(e) => handleSinkholeParamChange('TIME_WEIGHT_MULTIPLIER', e.target.value)}
                    className="parameter-slider"
                  />
                  <div className="parameter-range">0.0 - 3.0</div>
                </div>
                
                <div className="parameter-item">
                  <label className="parameter-label">
                    반복 발생 가중치 영향도
                    <span className="parameter-value">{sinkholeParams.FREQUENCY_WEIGHT_MULTIPLIER.toFixed(1)}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.1"
                    value={sinkholeParams.FREQUENCY_WEIGHT_MULTIPLIER}
                    onChange={(e) => handleSinkholeParamChange('FREQUENCY_WEIGHT_MULTIPLIER', e.target.value)}
                    className="parameter-slider"
                  />
                  <div className="parameter-range">0.0 - 3.0</div>
                </div>
              </div>
            )}
          </div>
          
          {/* 지하철 파라미터 */}
          <div className="parameter-group">
            <div 
              className="parameter-group-header clickable"
              onClick={() => setIsSubwaySectionExpanded(!isSubwaySectionExpanded)}
            >
              <h4 className="parameter-group-title">🚇 지하철 영향도 요인</h4>
              <div className="parameter-header-controls">
                <button 
                  className="parameter-info-btn"
                  onClick={(e) => {
                    e.stopPropagation(); // 헤더 클릭 이벤트 전파 방지
                    setPopupCategory('subway-factors');
                    setShowInfoPopup(true);
                  }}
                  title="지하철 영향도 요인 설명 보기"
                >
                  i
                </button>
                <span className="parameter-toggle-icon">{isSubwaySectionExpanded ? '▼' : '▶'}</span>
              </div>
            </div>
            
            {isSubwaySectionExpanded && (
              <div className="parameter-content">
                <div className="parameter-item">
                  <label className="parameter-label">
                    1차 영향권 (100m) 가중치
                    <span className="parameter-value">{subwayParams.LEVEL1_WEIGHT.toFixed(1)}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={subwayParams.LEVEL1_WEIGHT}
                    onChange={(e) => handleSubwayParamChange('LEVEL1_WEIGHT', e.target.value)}
                    className="parameter-slider"
                  />
                  <div className="parameter-range">0.0 - 1.0</div>
                </div>
                
                <div className="parameter-item">
                  <label className="parameter-label">
                    2차 영향권 (300m) 가중치
                    <span className="parameter-value">{subwayParams.LEVEL2_WEIGHT.toFixed(1)}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="0.8"
                    step="0.1"
                    value={subwayParams.LEVEL2_WEIGHT}
                    onChange={(e) => handleSubwayParamChange('LEVEL2_WEIGHT', e.target.value)}
                    className="parameter-slider"
                  />
                  <div className="parameter-range">0.0 - 0.8</div>
                </div>
                
                <div className="parameter-item">
                  <label className="parameter-label">
                    3차 영향권 (500m) 가중치
                    <span className="parameter-value">{subwayParams.LEVEL3_WEIGHT.toFixed(1)}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="0.5"
                    step="0.1"
                    value={subwayParams.LEVEL3_WEIGHT}
                    onChange={(e) => handleSubwayParamChange('LEVEL3_WEIGHT', e.target.value)}
                    className="parameter-slider"
                  />
                  <div className="parameter-range">0.0 - 0.5</div>
                </div>
                
                {/* 거리 설정 제거됨: 시뮬레이션은 고정 임계값(100/300/500m)을 사용 */}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 통계 섹션 */}
      <div className={`stats-section ${!isSettingsExpanded ? 'collapsed' : ''}`}>
        <div className="panel-header">
          <div className="stats-header" onClick={() => setShowStats(!showStats)}>
            <h4 className="stats-title">📊 시뮬레이션 결과</h4>
            <span className="stats-toggle">{showStats ? '▼' : '▶'}</span>
          </div>
        </div>

        <div className="panel-content">
          {showStats && stats && stats.weightStats && (
            <div className="stats-scroll-content">
              {/* 기본 통계 */}
              <div className="stats-cards">
                <div className="stat-card">
                  <div className="stat-label">총 싱크홀 수</div>
                  <div className="stat-value">{stats.totalCount}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">평균 위험도</div>
                  <div className="stat-value">{stats.weightStats.avg.toFixed(2)}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">최대 위험도</div>
                  <div className="stat-value">{stats.weightStats.max.toFixed(2)}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">최소 위험도</div>
                  <div className="stat-value">{stats.weightStats.min.toFixed(2)}</div>
                </div>
              </div>
              
              {/* 위험도 분포 */}
              <div className="distribution-section">
                <h5>위험도 분포</h5>
                <div className="distribution-chart">
                  <div 
                    className={`distribution-item low ${selectedRiskFilter === 'low' ? 'selected' : ''}`}
                    onClick={() => {
                      handleRiskFilterClick('low');
                    }}
                  >
                    <span className="distribution-label">낮음</span>
                    <span className="distribution-count">{stats.riskDistribution.low}</span>
                  </div>
                  <div 
                    className={`distribution-item medium ${selectedRiskFilter === 'medium' ? 'selected' : ''}`}
                    onClick={() => {
                      handleRiskFilterClick('medium');
                    }}
                  >
                    <span className="distribution-label">중간</span>
                    <span className="distribution-count">{stats.riskDistribution.medium}</span>
                  </div>
                  <div 
                    className={`distribution-item high ${selectedRiskFilter === 'high' ? 'selected' : ''}`}
                    onClick={() => {
                      handleRiskFilterClick('high');
                    }}
                  >
                    <span className="distribution-label">높음</span>
                    <span className="distribution-count">{stats.riskDistribution.high}</span>
                  </div>
                  <div 
                    className={`distribution-item critical ${selectedRiskFilter === 'critical' ? 'selected' : ''}`}
                    onClick={() => {
                      handleRiskFilterClick('critical');
                    }}
                  >
                    <span className="distribution-label">치명적</span>
                    <span className="distribution-count">{stats.riskDistribution.critical}</span>
                  </div>
                </div>
              </div>

              {/* 지하철 영향권 분포 */}
              <div className="distribution-section">
                <h5>지하철 영향권 분포</h5>
                <div className="distribution-chart">
                  <div 
                    className={`distribution-item level1 ${selectedSubwayFilter === 'level1' ? 'selected' : ''}`}
                    onClick={() => handleSubwayFilterClick('level1')}
                  >
                    <span className="distribution-label">1차 영향권</span>
                    <span className="distribution-count">{stats.subwayInfluenceDistribution.level1}</span>
                  </div>
                  <div 
                    className={`distribution-item level2 ${selectedSubwayFilter === 'level2' ? 'selected' : ''}`}
                    onClick={() => handleSubwayFilterClick('level2')}
                  >
                    <span className="distribution-label">2차 영향권</span>
                    <span className="distribution-count">{stats.subwayInfluenceDistribution.level2}</span>
                  </div>
                  <div 
                    className={`distribution-item level3 ${selectedSubwayFilter === 'level3' ? 'selected' : ''}`}
                    onClick={() => handleSubwayFilterClick('level3')}
                  >
                    <span className="distribution-label">3차 영향권</span>
                    <span className="distribution-count">{stats.subwayInfluenceDistribution.level3}</span>
                  </div>
                  <div 
                    className={`distribution-item none ${selectedSubwayFilter === 'none' ? 'selected' : ''}`}
                    onClick={() => handleSubwayFilterClick('none')}
                  >
                    <span className="distribution-label">영향권 밖</span>
                    <span className="distribution-count">{stats.subwayInfluenceDistribution.none}</span>
                  </div>
                </div>
              </div>
              
              {/* 위험도 TOP 5 싱크홀 */}
              <div className="top-sinkholes-section">
                <h5>위험도 TOP 5 싱크홀</h5>
                <div className="sinkhole-list">
                  {stats.topRiskSinkholes.map((sinkhole, index) => {
                    // 위험도별 색상 및 아이콘 설정 (싱크홀 목록과 동일한 로직)
                    const getRiskInfo = (riskLevel, weight) => {
                      const style = getRiskLevelStyle(riskLevel);
                      const gradientColor = getGradientColor(weight || 0);
                      return {
                        color: gradientColor,
                        label: style.label,
                        icon: style.shortLabel
                      };
                    };
                    
                    // 지하철 영향권 정보 설정 (싱크홀 목록과 동일한 로직)
                    const getSubwayInfluenceInfo = (influenceLevel) => {
                      const style = getSubwayInfluenceStyle(influenceLevel);
                      return {
                        color: style.color,
                        label: style.label,
                        description: style.description
                      };
                    };

                    const riskInfo = getRiskInfo(sinkhole.riskLevel, sinkhole.finalWeight);
                    const subwayInfo = getSubwayInfluenceInfo(sinkhole.subwayInfluenceLevel || 'none');
                    
                    const totalWeight = sinkhole.finalWeight || 0;
                    // 위험도 계산 로직을 시뮬레이션 결과에 맞게 단순화
                    const baseWeight = sinkhole.sinkholeRisk || 0;
                    const subwayContribution = totalWeight - baseWeight;
                    
                    // 지하철 거리 정보 (천 단위 콤마 적용)
                    const subwayDistance = sinkhole.subwayDistance ? 
                      `${parseFloat(sinkhole.subwayDistance).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}m` : 'N/A';
                    
                    return (
                      <div
                        key={sinkhole.id}
                        className="sinkhole-item"
                        onClick={() => {
                          if (onSinkholeClick) {
                            // 원본 싱크홀 데이터 찾기 - ID로 먼저 찾기
                            let originalSinkhole = sinkholes.find(original => 
                              original.id === sinkhole.id
                            );
                            
                            // ID로 찾지 못한 경우 좌표로 찾기
                            if (!originalSinkhole && sinkhole.lat && sinkhole.lng) {
                              originalSinkhole = sinkholes.find(original => 
                                Math.abs(original.lat - sinkhole.lat) < 0.0001 && 
                                Math.abs(original.lng - sinkhole.lng) < 0.0001
                              );
                            }
                            
                            // 이름으로 찾기 (마지막 시도)
                            if (!originalSinkhole) {
                              originalSinkhole = sinkholes.find(original => 
                                original.name === sinkhole.name || 
                                original.사고명 === sinkhole.name
                              );
                            }
                            
                            if (originalSinkhole) {
                              onSinkholeClick(originalSinkhole);
                            } else {
                              // 원본을 찾지 못한 경우 시뮬레이션 데이터 사용
                              onSinkholeClick(sinkhole);
                            }
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="sinkhole-icon">
                          <div 
                            className="risk-level-icon"
                            style={{
                              backgroundColor: riskInfo.color,
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                          >
                            {riskInfo.icon}
                          </div>
                        </div>
                        <div className="sinkhole-info">
                          <h4 className="sinkhole-name" style={{ color: riskInfo.color }}>
                            {sinkhole.name}
                            <span className="rank-badge">#{index + 1}</span>
                          </h4>
                          <p className="sinkhole-address">{sinkhole.location}</p>
                          <div className="sinkhole-details">
                            <div className="risk-info">
                              <span className="risk-label">위험도:</span>
                              <span 
                                className="risk-value"
                                style={{ color: riskInfo.color, fontWeight: 'bold' }}
                              >
                                {riskInfo.label}({baseWeight.toFixed(2)} + {subwayContribution.toFixed(2)} = {totalWeight.toFixed(2)})
                              </span>
                            </div>
                            <div className="subway-influence-info">
                              <span className="influence-label">지하철영향:</span>
                              <span 
                                className="influence-value"
                                style={{ color: subwayInfo.color, fontWeight: 'bold' }}
                              >
                                {subwayDistance}, 가중치: {(totalWeight - baseWeight).toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <div className="sinkhole-summary">
                            <span className="summary-item">발생횟수: 1회</span>
                            <span className="summary-separator"> | </span>
                            <span className="summary-item">최대규모: {sinkhole.maxSize}</span>
                            <span className="summary-separator"> | </span>
                            <span className="summary-item">위험도: {totalWeight.toFixed(2)}({riskInfo.label})</span>
                            <span className="summary-separator"> | </span>
                            <span className="summary-item">지하철영향권: {subwayInfo.label} ({subwayInfo.description})</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 정보 팝업 */}
      <SimulationInfoPopup 
        isOpen={showInfoPopup}
        onClose={() => setShowInfoPopup(false)}
        initialCategory={popupCategory}
      />
    </div>
  );
};

export default SimulationPanel;
