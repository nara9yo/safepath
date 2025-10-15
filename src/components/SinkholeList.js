import React, { useMemo, useEffect } from 'react';
import RiskFilter from './RiskFilter';
import RegionFilter from './RegionFilter';

const SinkholeList = ({ 
  sinkholes, 
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
  onRiskLevelChange
}) => {
  // 접기/펼치기 로컬 상태는 RegionFilter로 이동하여 미사용 변수 제거
  
  useEffect(() => {
    console.log('SinkholeList 렌더링:', { sinkholes: sinkholes?.length });
  }, [sinkholes]);
  
  // 지역 옵션 및 요약 로직은 RegionFilter로 이동

  // 지역 + 위험도 필터 적용
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
    // 위험도 필터 적용
    if (selectedRiskLevels && selectedRiskLevels.length > 0) {
      result = result.filter(s => selectedRiskLevels.includes(s.riskLevel || 'low'));
    }
    
    return result;
  }, [sinkholes, selectedSido, selectedSigungu, selectedDong, selectedRiskLevels]);

  // 지역 필터 핸들러 및 요약은 RegionFilter로 이동
  
  return (
    <div className="sinkhole-panel">
      <div className="panel-header">
        <label>싱크홀 목록 {sinkholes?.length ? `(${sinkholes.length}개)` : ''}</label>
      </div>
      {/* 위험도 필터 (타이틀 바로 아래) */}
      <RiskFilter 
        selectedRiskLevels={selectedRiskLevels}
        onRiskLevelChange={onRiskLevelChange}
        sinkholes={sinkholes}
        defaultExpanded={false}
      />
      
      {/* 지역 필터 (컴포넌트화) */}
      {sinkholes && sinkholes.length > 0 && (
        <RegionFilter
          sinkholes={sinkholes}
          selectedSido={selectedSido}
          selectedSigungu={selectedSigungu}
          selectedDong={selectedDong}
          onSidoChange={onSidoChange}
          onSigunguChange={onSigunguChange}
          onDongChange={onDongChange}
          defaultExpanded={false}
        />
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
