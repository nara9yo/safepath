import React, { useState, useMemo } from 'react';

const SubwayInfluenceFilter = ({ 
  selectedInfluenceLevels, 
  onInfluenceLevelChange, 
  sinkholes = [],
  defaultExpanded = true,
  title = '지하철 영향도'
}) => {
  const [isExpanded, setIsExpanded] = useState(!!defaultExpanded);
  
  // 지하철 영향도별 싱크홀 개수 계산
  const influenceLevelCounts = useMemo(() => {
    const counts = {
      level1: 0,
      level2: 0,
      level3: 0
    };
    
    sinkholes.forEach(sinkhole => {
      const influenceLevel = sinkhole.subwayInfluenceLevel;
      // level1, level2, level3만 카운팅 (none은 제외)
      if (counts.hasOwnProperty(influenceLevel)) {
        counts[influenceLevel]++;
      }
    });
    
    return counts;
  }, [sinkholes]);
  
  // 지하철 영향도 옵션 정의 (범례 색상과 동일하게 설정)
  const influenceLevelOptions = [
    {
      value: 'level1',
      label: '1단계',
      color: '#DC143C', // 진한 빨간색 (1차 영향권)
      icon: '1',
      description: '노선 0~100m'
    },
    {
      value: 'level2',
      label: '2단계',
      color: '#FF6B35', // 진한 주황색 (2차 영향권)
      icon: '2',
      description: '노선 100~300m'
    },
    {
      value: 'level3',
      label: '3단계',
      color: '#FFD700', // 진한 금색 (3차 영향권)
      icon: '3',
      description: '노선 300m~500m'
    }
  ];

  const handleInfluenceLevelToggle = (influenceLevel) => {
    const newSelectedLevels = selectedInfluenceLevels.includes(influenceLevel)
      ? selectedInfluenceLevels.filter(level => level !== influenceLevel)
      : [...selectedInfluenceLevels, influenceLevel];
    
    onInfluenceLevelChange(newSelectedLevels);
  };

  const handleClearAll = () => {
    onInfluenceLevelChange([]);
  };

  const hasActiveInfluenceFilter = selectedInfluenceLevels.length > 0 && selectedInfluenceLevels.length < 3;

  const getCollapsedSummary = () => {
    if (selectedInfluenceLevels.length === 0) return '선택: 없음 (전체 표시)';
    if (selectedInfluenceLevels.length === 3) return '선택: 전체';
    const mapKo = { level1: '1단계', level2: '2단계', level3: '3단계' };
    return `선택: ${selectedInfluenceLevels.map(l => mapKo[l]).join(', ')}`;
  };

  return (
    <div className="filter-section">
      <div 
        className="filter-header clickable"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="filter-header-left">
          <span className="filter-toggle-icon">{isExpanded ? '▼' : '▶'}</span>
          <span className="filter-icon">🚇</span>
          <span className="filter-title">{title}</span>
        </div>
        <div className="filter-header-right">
          {hasActiveInfluenceFilter && (
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
      {!isExpanded && hasActiveInfluenceFilter && (
        <div className="filter-summary">
          <span className="filter-summary-text">{getCollapsedSummary()}</span>
          <span className="filter-summary-count">
            결과: {selectedInfluenceLevels.reduce((sum, level) => sum + influenceLevelCounts[level], 0)}개
          </span>
        </div>
      )}
      
      {/* 펼쳐진 상태일 때 필터 컨트롤 표시 */}
      {isExpanded && (
        <>
          <div className="influence-level-options">
            {influenceLevelOptions.map(option => {
              const isSelected = selectedInfluenceLevels.includes(option.value);
              const count = influenceLevelCounts[option.value] || 0;
              
              return (
                <div 
                  key={option.value}
                  className={`influence-level-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleInfluenceLevelToggle(option.value)}
                  style={{
                    borderLeftColor: option.color,
                    borderColor: isSelected ? option.color : '#e0e0e0',
                    backgroundColor: isSelected ? `${option.color}15` : 'white'
                  }}
                >
                  <div className="influence-level-main">
                    <div className="influence-level-info">
                      <div 
                        className="influence-level-icon"
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
                        {option.icon}
                      </div>
                      <div className="influence-level-details">
                        <div className="influence-level-label">{option.label}</div>
                        <div className="influence-level-description">{option.description}</div>
                      </div>
                    </div>
                    <div className="influence-level-count">
                      <span className="count-number">{count}</span>
                      <span className="count-unit">개</span>
                    </div>
                  </div>
                  
                  {isSelected && (
                    <div className="influence-level-indicator">
                      <span className="indicator-icon">✓</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="filter-result-info">
            필터 결과: {selectedInfluenceLevels.reduce((sum, level) => sum + influenceLevelCounts[level], 0)}개
          </div>
        </>
      )}
    </div>
  );
};

export default SubwayInfluenceFilter;
