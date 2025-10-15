import React, { useState, useMemo } from 'react';

const RegionFilter = ({
  sinkholes = [],
  selectedSido,
  selectedSigungu,
  selectedDong,
  onSidoChange,
  onSigunguChange,
  onDongChange,
  defaultExpanded = false,
  title = '지역 필터'
}) => {
  const [isExpanded, setIsExpanded] = useState(!!defaultExpanded);

  // 옵션 리스트 계산
  const sidoOptions = useMemo(() => {
    if (!sinkholes) return [];
    const unique = [...new Set(sinkholes.map(s => s.sido).filter(Boolean))];
    return unique.sort();
  }, [sinkholes]);

  const sigunguOptions = useMemo(() => {
    if (!sinkholes || !selectedSido) return [];
    const filtered = sinkholes.filter(s => s.sido === selectedSido);
    const unique = [...new Set(filtered.map(s => s.sigungu).filter(Boolean))];
    return unique.sort();
  }, [sinkholes, selectedSido]);

  const dongOptions = useMemo(() => {
    if (!sinkholes || !selectedSido || !selectedSigungu) return [];
    const filtered = sinkholes.filter(s => s.sido === selectedSido && s.sigungu === selectedSigungu);
    const unique = [...new Set(filtered.map(s => s.dong).filter(Boolean))];
    return unique.sort();
  }, [sinkholes, selectedSido, selectedSigungu]);

  // 요약 & 활성 여부
  const hasActiveFilters = !!(selectedSido || selectedSigungu || selectedDong);
  const getFilterSummary = () => {
    const parts = [];
    if (selectedSido) parts.push(selectedSido);
    if (selectedSigungu) parts.push(selectedSigungu);
    if (selectedDong) parts.push(selectedDong);
    return parts.length > 0 ? parts.join(' > ') : '필터 없음';
  };

  const handleClear = (e) => {
    e?.stopPropagation?.();
    onSidoChange('');
    onSigunguChange('');
    onDongChange('');
  };

  // 결과 카운트 (현재 선택된 필터 조합으로 계산)
  const filteredCount = useMemo(() => {
    let result = sinkholes || [];
    if (selectedSido) result = result.filter(s => s.sido === selectedSido);
    if (selectedSigungu) result = result.filter(s => s.sigungu === selectedSigungu);
    if (selectedDong) result = result.filter(s => s.dong === selectedDong);
    return result.length;
  }, [sinkholes, selectedSido, selectedSigungu, selectedDong]);

  return (
    <div className="filter-section">
      <div 
        className="filter-header clickable"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="filter-header-left">
          <span className="filter-toggle-icon">{isExpanded ? '▼' : '▶'}</span>
          <span className="filter-icon">🗺️</span>
          <span className="filter-title">{title}</span>
        </div>
        <div className="filter-header-right">
          {hasActiveFilters && (
            <button className="clear-filters-btn" onClick={handleClear}>
              전체 초기화
            </button>
          )}
        </div>
      </div>

      {!isExpanded && hasActiveFilters && (
        <div className="filter-summary">
          <span className="filter-summary-text">{getFilterSummary()}</span>
          <span className="filter-summary-count">결과: {filteredCount}개</span>
        </div>
      )}

      {isExpanded && (
        <>
          <div className="filter-controls">
            <div className="filter-item">
              <label>광역시/도</label>
              <select 
                value={selectedSido} 
                onChange={(e) => {
                  onSidoChange(e.target.value);
                  onSigunguChange('');
                  onDongChange('');
                }}
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
                onChange={(e) => {
                  onSigunguChange(e.target.value);
                  onDongChange('');
                }}
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
                onChange={(e) => onDongChange(e.target.value)}
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
          <div className="filter-result-info">필터 결과: {filteredCount}개</div>
        </>
      )}
    </div>
  );
};

export default RegionFilter;
