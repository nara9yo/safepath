// 컴포넌트: 싱크홀 목록/필터 패널
// 역할:
//  - 위험도/지하철영향/지역 필터 UI를 제공하고 결과 리스트 표시
//  - 전역 상수/색상 보간을 사용해 일관된 라벨/색/요약 제공
// 입력 props:
//  - sinkholes(필터링된), allSinkholes(카운트용), selectedSinkhole, onSinkholeClick
//  - 지역/위험도/영향도 필터 상태와 변경 핸들러
import React, { useEffect, useState } from 'react';
import RiskFilter from './RiskFilter';
import RegionFilter from './RegionFilter';
import SubwayInfluenceFilter from './SubwayInfluenceFilter';
import { getRiskLevelStyle, getSubwayInfluenceStyle, getGradientColor } from '../utils/constants';

const SinkholeList = ({ 
  sinkholes, // 필터링된 싱크홀 목록
  allSinkholes, // 원본 싱크홀 데이터 (필터 카운팅용)
  selectedSinkhole, 
  onSinkholeClick,
  selectedSido,
  selectedSigungu,
  selectedDong,
  onSidoChange,
  onSigunguChange,
  onDongChange,
  // 위험도 필터
  selectedRiskLevels,
  onRiskLevelChange,
  // 지하철 영향도 필터
  selectedInfluenceLevels,
  onInfluenceLevelChange
}) => {
  const [isFilterSectionExpanded, setIsFilterSectionExpanded] = useState(true);
  
  useEffect(() => {
  }, [sinkholes]);
  
  // 지역 옵션 및 요약 로직은 RegionFilter로 이동

  // App.js에서 이미 필터링된 데이터를 받으므로 추가 필터링 불필요
  // sinkholes prop은 이미 filteredSinkholes임

  // 지역 필터 핸들러 및 요약은 RegionFilter로 이동
  
  return (
    <div className="sinkhole-panel">
      {/* 필터 목록 섹션 */}
      <div className="filter-section-container">
        <div 
          className="filter-list-header clickable"
          onClick={() => setIsFilterSectionExpanded(!isFilterSectionExpanded)}
        >
          <div className="filter-section-title">필터 목록</div>
          <span className="filter-toggle-icon">{isFilterSectionExpanded ? '▼' : '▶'}</span>
        </div>
        
        {isFilterSectionExpanded && (
          <div className="filters-wrapper">
            {/* 위험도 필터 */}
            <RiskFilter 
              selectedRiskLevels={selectedRiskLevels}
              onRiskLevelChange={onRiskLevelChange}
              sinkholes={allSinkholes}
              defaultExpanded={false}
            />
            
            {/* 지하철 영향도 필터 */}
            {allSinkholes && allSinkholes.length > 0 && (
              <SubwayInfluenceFilter
                selectedInfluenceLevels={selectedInfluenceLevels}
                onInfluenceLevelChange={onInfluenceLevelChange}
                sinkholes={allSinkholes}
                defaultExpanded={false}
              />
            )}
            
            {/* 지역 필터 */}
            {allSinkholes && allSinkholes.length > 0 && (
              <RegionFilter
                sinkholes={allSinkholes}
                selectedSido={selectedSido}
                selectedSigungu={selectedSigungu}
                selectedDong={selectedDong}
                onSidoChange={onSidoChange}
                onSigunguChange={onSigunguChange}
                onDongChange={onDongChange}
                defaultExpanded={false}
              />
            )}
          </div>
        )}
      </div>
      
      {/* 싱크홀 목록 섹션 */}
      <div className="sinkhole-list-section">
        <div className="panel-header">
          <label>싱크홀 목록 {sinkholes?.length ? `(${sinkholes.length}개)` : ''}</label>
        </div>
        
        <div className="panel-content">
          {!sinkholes || sinkholes.length === 0 ? (
            <p className="no-data">표시할 싱크홀이 없습니다.</p>
          ) : (
            <div className="sinkhole-list">
              {sinkholes.map((sinkhole) => {
                const isSelected = selectedSinkhole && selectedSinkhole.id === sinkhole.id;
                
                // 위험도별 색상 및 아이콘 설정 (그라데이션 색상 사용)
                const getRiskInfo = (riskLevel, weight) => {
                  const style = getRiskLevelStyle(riskLevel);
                  // 그라데이션 색상 사용 (가중치 기반)
                  const gradientColor = getGradientColor(weight || 0);
                  return {
                    color: gradientColor,
                    label: style.label,
                    icon: style.shortLabel
                  };
                };
                
                // 지하철 영향권 정보 설정 (통합 상수 사용)
                const getSubwayInfluenceInfo = (influenceLevel) => {
                  const style = getSubwayInfluenceStyle(influenceLevel);
                  return {
                    color: style.color,
                    label: style.label,
                    description: style.description
                  };
                };
                
                const riskInfo = getRiskInfo(sinkhole.riskLevel, sinkhole.finalRisk);
                const subwayInfo = getSubwayInfluenceInfo(sinkhole.subwayInfluenceLevel);
                
                // 위험도 계산 (기본 위험도 + 지하철 영향 가중치)
                const baseWeight = parseFloat(sinkhole.baseRisk) || 0;
                const totalWeight = parseFloat(sinkhole.finalRisk) || 0;
                const subwayContribution = totalWeight - baseWeight; // 지하철로 인한 추가 가중치
                const weightIncrease = baseWeight > 0 ? ((subwayContribution / baseWeight) * 100).toFixed(1) : 0;
                
                // 지하철 거리 정보 (천 단위 콤마 적용)
                const subwayDistance = sinkhole.subwayDistance ? 
                  `${parseFloat(sinkhole.subwayDistance).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}m` : 'N/A';
                
                return (
                  <div
                    key={sinkhole.id}
                    className={`sinkhole-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => onSinkholeClick(sinkhole)}
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
                        {isSelected && <span className="selected-badge">선택됨</span>}
                      </h4>
                      <p className="sinkhole-address">{sinkhole.address}</p>
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
                            {subwayDistance}, 가중치: {subwayContribution.toFixed(2)}
                          </span>
                          {weightIncrease > 0 && (
                            <span className="weight-increase">(+{weightIncrease}%)</span>
                          )}
                        </div>
                      </div>
                      <div className="sinkhole-summary">
                        <span className="summary-item">발생횟수: {sinkhole.totalOccurrences || 1}회</span>
                        <span className="summary-separator"> | </span>
                        <span className="summary-item">최대규모: {sinkhole.maxSize || 'N/A'}</span>
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
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(SinkholeList);
