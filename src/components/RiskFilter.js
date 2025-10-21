import React, { useState, useMemo } from 'react';

const RiskFilter = ({ 
  selectedRiskLevels, 
  onRiskLevelChange, 
  sinkholes = [],
  defaultExpanded = true,
  title = '위험도'
}) => {
  const [isExpanded, setIsExpanded] = useState(!!defaultExpanded);
  // 위험도별 싱크홀 개수 계산
  const riskLevelCounts = useMemo(() => {
    const counts = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };
    
    sinkholes.forEach(sinkhole => {
      const riskLevel = sinkhole.riskLevel || 'low';
      if (counts.hasOwnProperty(riskLevel)) {
        counts[riskLevel]++;
      }
    });
    
    return counts;
  }, [sinkholes]);
  
  // 위험도 옵션 정의 (범례 색상과 동일하게 설정)
  const riskLevelOptions = [
    {
      value: 'low',
      label: '낮음',
      color: '#2E7D32', // 진한 초록색
      icon: '🟢',
      description: '안전한 수준'
    },
    {
      value: 'medium', 
      label: '중간',
      color: '#E65100', // 진한 주황색
      icon: '🟠',
      description: '주의 필요'
    },
    {
      value: 'high',
      label: '높음',
      color: '#C62828', // 진한 빨간색
      icon: '🔴',
      description: '위험한 수준'
    },
    {
      value: 'critical',
      label: '치명적',
      color: '#6A1B9A', // 진한 보라색
      icon: '💥',
      description: '매우 위험'
    }
  ];

  const handleRiskLevelToggle = (riskLevel) => {
    const newSelectedLevels = selectedRiskLevels.includes(riskLevel)
      ? selectedRiskLevels.filter(level => level !== riskLevel)
      : [...selectedRiskLevels, riskLevel];
    
    onRiskLevelChange(newSelectedLevels);
  };

  const handleClearAll = () => {
    onRiskLevelChange([]);
  };

  const hasActiveRiskFilter = selectedRiskLevels.length > 0 && selectedRiskLevels.length < 4;

  const getCollapsedSummary = () => {
    if (selectedRiskLevels.length === 0) return '선택: 없음';
    if (selectedRiskLevels.length === 4) return '선택: 전체';
    const mapKo = { low: '낮음', medium: '중간', high: '높음', critical: '치명적' };
    return `선택: ${selectedRiskLevels.map(l => mapKo[l]).join(', ')}`;
  };

  return (
    <div className="filter-section">
      <div 
        className="filter-header clickable"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="filter-header-left">
          <span className="filter-toggle-icon">{isExpanded ? '▼' : '▶'}</span>
          <span className="filter-icon">🎯</span>
          <span className="filter-title">{title}</span>
        </div>
        <div className="filter-header-right">
          {hasActiveRiskFilter && (
            <button 
              className="clear-filters-btn" 
              onClick={(e) => {
                e.stopPropagation();
                handleClearAll();
              }}
            >
              전체 초기화
            </button>
          )}
        </div>
      </div>
      
      {/* 접힌 상태일 때 필터 요약 표시 */}
      {!isExpanded && hasActiveRiskFilter && (
        <div className="filter-summary">
          <span className="filter-summary-text">{getCollapsedSummary()}</span>
          <span className="filter-summary-count">
            결과: {selectedRiskLevels.reduce((sum, level) => sum + riskLevelCounts[level], 0)}개
          </span>
        </div>
      )}
      
      {/* 펼쳐진 상태일 때 필터 컨트롤 표시 */}
      {isExpanded && (
        <>
          <div className="risk-level-options">
            {riskLevelOptions.map(option => {
              const isSelected = selectedRiskLevels.includes(option.value);
              const count = riskLevelCounts[option.value] || 0;
              
              return (
                <div 
                  key={option.value}
                  className={`risk-level-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleRiskLevelToggle(option.value)}
                  style={{
                    borderLeftColor: option.color,
                    borderColor: isSelected ? option.color : '#e0e0e0',
                    backgroundColor: isSelected ? `${option.color}15` : 'white'
                  }}
                >
                  <div className="risk-level-main">
                    <div className="risk-level-info">
                      <div 
                        className="risk-level-icon"
                        style={{
                          backgroundColor: option.color,
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      >
                        {option.value === 'low' ? 'L' : option.value === 'medium' ? 'M' : option.value === 'high' ? 'H' : 'C'}
                      </div>
                      <div className="risk-level-details">
                        <div className="risk-level-label">{option.label}</div>
                        <div className="risk-level-description">{option.description}</div>
                      </div>
                    </div>
                    <div className="risk-level-count">
                      <span className="count-number">{count}</span>
                      <span className="count-unit">개</span>
                    </div>
                  </div>
                  
                  {isSelected && (
                    <div className="risk-level-indicator">
                      <span className="indicator-icon">✓</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="filter-result-info">
            필터 결과: {selectedRiskLevels.reduce((sum, level) => sum + riskLevelCounts[level], 0)}개
          </div>
        </>
      )}
    </div>
  );
};

export default RiskFilter;
