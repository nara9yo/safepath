import React, { useState, useMemo, useEffect } from 'react';

const SinkholeList = ({ 
  sinkholes, 
  selectedSinkhole, 
  onSinkholeClick,
  selectedSido,
  selectedSigungu,
  selectedDong,
  onSidoChange,
  onSigunguChange,
  onDongChange
}) => {
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  
  useEffect(() => {
    console.log('SinkholeList 렌더링:', { sinkholes: sinkholes?.length });
  }, [sinkholes]);
  
  // 광역시/도 옵션 추출
  const sidoOptions = useMemo(() => {
    if (!sinkholes) return [];
    const unique = [...new Set(sinkholes.map(s => s.sido).filter(Boolean))];
    return unique.sort();
  }, [sinkholes]);

  // 시/군/구 옵션 추출 (광역시/도 선택에 따라)
  const sigunguOptions = useMemo(() => {
    if (!sinkholes || !selectedSido) return [];
    const filtered = sinkholes.filter(s => s.sido === selectedSido);
    const unique = [...new Set(filtered.map(s => s.sigungu).filter(Boolean))];
    return unique.sort();
  }, [sinkholes, selectedSido]);

  // 읍/면/동 옵션 추출 (시/군/구 선택에 따라)
  const dongOptions = useMemo(() => {
    if (!sinkholes || !selectedSido || !selectedSigungu) return [];
    const filtered = sinkholes.filter(s => 
      s.sido === selectedSido && s.sigungu === selectedSigungu
    );
    const unique = [...new Set(filtered.map(s => s.dong).filter(Boolean))];
    return unique.sort();
  }, [sinkholes, selectedSido, selectedSigungu]);

  // 지역 필터 적용
  const filteredSinkholes = useMemo(() => {
    if (!sinkholes) return [];
    
    let result = sinkholes;
    
    // 지역 필터 적용
    if (selectedSido) {
      result = result.filter(s => s.sido === selectedSido);
    }
    if (selectedSigungu) {
      result = result.filter(s => s.sigungu === selectedSigungu);
    }
    if (selectedDong) {
      result = result.filter(s => s.dong === selectedDong);
    }
    
    return result;
  }, [sinkholes, selectedSido, selectedSigungu, selectedDong]);

  // 광역시/도 변경 시 하위 필터 초기화
  const handleSidoChange = (e) => {
    onSidoChange(e.target.value);
    onSigunguChange('');
    onDongChange('');
  };

  // 시/군/구 변경 시 하위 필터 초기화
  const handleSigunguChange = (e) => {
    onSigunguChange(e.target.value);
    onDongChange('');
  };

  // 읍/면/동 변경
  const handleDongChange = (e) => {
    onDongChange(e.target.value);
  };

  // 모든 필터 초기화
  const clearFilters = () => {
    onSidoChange('');
    onSigunguChange('');
    onDongChange('');
  };

  // 필터 적용 여부 확인
  const hasActiveFilters = selectedSido || selectedSigungu || selectedDong;

  // 필터 요약 정보 생성
  const getFilterSummary = () => {
    const parts = [];
    if (selectedSido) parts.push(selectedSido);
    if (selectedSigungu) parts.push(selectedSigungu);
    if (selectedDong) parts.push(selectedDong);
    return parts.length > 0 ? parts.join(' > ') : '필터 없음';
  };
  
  return (
    <div className="sinkhole-panel">
      <div className="panel-header">
        <label>싱크홀 목록 {sinkholes?.length ? `(${sinkholes.length}개)` : ''}</label>
      </div>
      
      {/* 지역 필터 */}
      {sinkholes && sinkholes.length > 0 && (
        <div className="filter-section">
          <div 
            className="filter-header clickable" 
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
          >
            <div className="filter-header-left">
              <span className="filter-toggle-icon">
                {isFilterExpanded ? '▼' : '▶'}
              </span>
              <span className="filter-title">지역 필터</span>
            </div>
            <div className="filter-header-right">
              {hasActiveFilters && (
                <button 
                  className="clear-filters-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFilters();
                  }}
                >
                  전체 초기화
                </button>
              )}
            </div>
          </div>
          
          {/* 접힌 상태일 때 필터 요약 표시 */}
          {!isFilterExpanded && hasActiveFilters && (
            <div className="filter-summary">
              <span className="filter-summary-text">{getFilterSummary()}</span>
              <span className="filter-summary-count">
                결과: {filteredSinkholes.length}개
              </span>
            </div>
          )}
          
          {/* 펼쳐진 상태일 때 필터 컨트롤 표시 */}
          {isFilterExpanded && (
            <>
              <div className="filter-controls">
                <div className="filter-item">
                  <label>광역시/도</label>
                  <select 
                    value={selectedSido} 
                    onChange={handleSidoChange}
                    className="filter-select"
                  >
                    <option value="">전체</option>
                    {sidoOptions.map(sido => (
                      <option key={sido} value={sido}>{sido}</option>
                    ))}
                  </select>
                </div>
                
                <div className="filter-item">
                  <label>시/군/구</label>
                  <select 
                    value={selectedSigungu} 
                    onChange={handleSigunguChange}
                    className="filter-select"
                    disabled={!selectedSido}
                  >
                    <option value="">전체</option>
                    {sigunguOptions.map(sigungu => (
                      <option key={sigungu} value={sigungu}>{sigungu}</option>
                    ))}
                  </select>
                </div>
                
                <div className="filter-item">
                  <label>읍/면/동</label>
                  <select 
                    value={selectedDong} 
                    onChange={handleDongChange}
                    className="filter-select"
                    disabled={!selectedSigungu}
                  >
                    <option value="">전체</option>
                    {dongOptions.map(dong => (
                      <option key={dong} value={dong}>{dong}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="filter-result-info">
                필터 결과: {filteredSinkholes.length}개
              </div>
            </>
          )}
        </div>
      )}
        
      <div className="panel-content">
          {!sinkholes || sinkholes.length === 0 ? (
            <p className="no-data">표시할 싱크홀이 없습니다.</p>
          ) : filteredSinkholes.length === 0 ? (
            <p className="no-data">필터 결과가 없습니다.</p>
          ) : (
            <div className="sinkhole-list">
              {filteredSinkholes.map((sinkhole) => {
                const isSelected = selectedSinkhole && selectedSinkhole.id === sinkhole.id;
                return (
                  <div
                    key={sinkhole.id}
                    className={`sinkhole-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => onSinkholeClick(sinkhole)}
                  >
                    <div className="sinkhole-icon">
                      ⚠️
                    </div>
                    <div className="sinkhole-info">
                      <h4 className="sinkhole-name">
                        {sinkhole.name}
                        {isSelected && <span className="selected-badge">선택됨</span>}
                      </h4>
                      <p className="sinkhole-address">{sinkhole.address}</p>
                      {sinkhole.description && (
                        <p className="sinkhole-description">{sinkhole.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
  );
};

export default React.memo(SinkholeList);
