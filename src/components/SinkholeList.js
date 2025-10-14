import React, { useState, useMemo } from 'react';

const SinkholeList = ({ sinkholes, selectedSinkhole, onSinkholeClick, isVisible, onToggle }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  console.log('SinkholeList 렌더링:', { sinkholes: sinkholes?.length, isVisible });
  
  // 검색 필터링
  const filteredSinkholes = useMemo(() => {
    if (!sinkholes) return [];
    if (!searchQuery.trim()) return sinkholes;
    
    const query = searchQuery.toLowerCase().trim();
    return sinkholes.filter(sinkhole => 
      sinkhole.name.toLowerCase().includes(query) ||
      sinkhole.address.toLowerCase().includes(query) ||
      (sinkhole.description && sinkhole.description.toLowerCase().includes(query))
    );
  }, [sinkholes, searchQuery]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };
  
  return (
    <>
      {/* 패널이 숨겨졌을 때 보이는 토글 버튼 */}
      {!isVisible && (
        <button className="panel-toggle-btn" onClick={onToggle}>
          ☰
        </button>
      )}
      
      {/* 메인 패널 */}
      <div className={`sinkhole-panel ${isVisible ? '' : 'hidden'}`}>
        <div className="panel-header">
          <h3>싱크홀 목록 {sinkholes?.length ? `(${sinkholes.length}개)` : ''}</h3>
          <button className="toggle-btn" onClick={onToggle}>
            ✕
          </button>
        </div>
        
        {/* 검색 바 */}
        {sinkholes && sinkholes.length > 0 && (
          <div className="search-bar">
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="싱크홀 이름 또는 주소 검색..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
              {searchQuery && (
                <button className="clear-search-btn" onClick={clearSearch}>
                  ✕
                </button>
              )}
            </div>
            {searchQuery && (
              <div className="search-result-info">
                {filteredSinkholes.length}개 찾음
              </div>
            )}
          </div>
        )}
        
        <div className="panel-content">
          {!sinkholes || sinkholes.length === 0 ? (
            <p className="no-data">표시할 싱크홀이 없습니다.</p>
          ) : filteredSinkholes.length === 0 ? (
            <p className="no-data">검색 결과가 없습니다.</p>
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
    </>
  );
};

export default SinkholeList;
